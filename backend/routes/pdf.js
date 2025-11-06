import express from 'express';
import PDFGenerator from '../utils/pdfGenerator.js';
import Tramite from '../models/Tramite.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Generar PDF para un trámite
router.post('/generar', authMiddleware, async (req, res) => {
  try {
    const { tramiteId, options = {} } = req.body;

    const tramite = await Tramite.findById(tramiteId)
      .populate('ciudadano', 'dni nombres apellidos celular direccion distrito email')
      .populate('funcionarioAsignado', 'nombres apellidos cargo');

    if (!tramite) {
      return res.status(404).json({ 
        error: 'Trámite no encontrado' 
      });
    }

    // Verificar permisos
    const usuario = req.user;
    if (usuario.rol === 'ciudadano' && tramite.ciudadano._id.toString() !== usuario._id.toString()) {
      return res.status(403).json({ 
        error: 'No tiene permisos para generar el PDF de este trámite' 
      });
    }

    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generarDocumentoTramite(
      tramite, 
      tramite.ciudadano, 
      tramite.funcionarioAsignado
    );

    // Devolver el PDF como base64 para que el frontend lo maneje
    const pdfBase64 = pdfBuffer.toString('base64');

    res.json({
      success: true,
      pdf: pdfBase64,
      nombreArchivo: `tramite_${tramite.codigo}.pdf`
    });

  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al generar PDF' 
    });
  }
});

// Descargar PDF directamente
router.get('/descargar/:tramiteId', authMiddleware, async (req, res) => {
  try {
    const { tramiteId } = req.params;

    const tramite = await Tramite.findById(tramiteId)
      .populate('ciudadano', 'dni nombres apellidos celular direccion distrito email')
      .populate('funcionarioAsignado', 'nombres apellidos cargo');

    if (!tramite) {
      return res.status(404).json({ 
        error: 'Trámite no encontrado' 
      });
    }

    // Verificar permisos
    const usuario = req.user;
    if (usuario.rol === 'ciudadano' && tramite.ciudadano._id.toString() !== usuario._id.toString()) {
      return res.status(403).json({ 
        error: 'No tiene permisos para descargar el PDF de este trámite' 
      });
    }

    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generarDocumentoTramite(
      tramite, 
      tramite.ciudadano, 
      tramite.funcionarioAsignado
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tramite_${tramite.codigo}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error descargando PDF:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al descargar PDF' 
    });
  }
});

// Generar reporte estadístico
router.post('/reporte-estadistico', authMiddleware, async (req, res) => {
  try {
    const { fechaInicio, fechaFin, tipoReporte } = req.body;

    // Validar fechas
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({
        error: 'Fechas inválidas'
      });
    }

    // Consultar datos para el reporte
    const tramites = await Tramite.find({
      fechaSolicitud: {
        $gte: inicio,
        $lte: fin
      }
    }).populate('ciudadano', 'dni nombres apellidos distrito');

    const estadisticas = await Tramite.aggregate([
      {
        $match: {
          fechaSolicitud: {
            $gte: inicio,
            $lte: fin
          }
        }
      },
      {
        $group: {
          _id: '$tipo',
          total: { $sum: 1 },
          completados: {
            $sum: { $cond: [{ $eq: ['$estado', 'COMPLETADO'] }, 1, 0] }
          },
          tiempoPromedio: {
            $avg: {
              $cond: [
                { $eq: ['$estado', 'COMPLETADO'] },
                { $subtract: ['$fechaFinalizacion', '$fechaSolicitud'] },
                null
              ]
            }
          }
        }
      }
    ]);

    // Generar PDF del reporte
    const pdfGenerator = new PDFGenerator();
    
    // Datos para el reporte
    const datosReporte = {
      titulo: `Reporte Estadístico - ${tipoReporte}`,
      periodo: `${inicio.toLocaleDateString('es-PE')} - ${fin.toLocaleDateString('es-PE')}`,
      totalTramites: tramites.length,
      estadisticas: estadisticas,
      tramites: tramites.slice(0, 50) // Limitar para no hacer el PDF muy grande
    };

    const pdfBuffer = await pdfGenerator.generarReporteEstadistico(datosReporte);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_estadistico_${Date.now()}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generando reporte estadístico:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al generar reporte' 
    });
  }
});

// Generar múltiples PDFs (para descarga masiva)
router.post('/generar-multiples', authMiddleware, async (req, res) => {
  try {
    const { tramitesIds } = req.body;

    if (!tramitesIds || !Array.isArray(tramitesIds)) {
      return res.status(400).json({
        error: 'Lista de IDs de trámites requerida'
      });
    }

    const usuario = req.user;
    const tramites = await Tramite.find({
      _id: { $in: tramitesIds }
    })
      .populate('ciudadano', 'dni nombres apellidos celular direccion distrito email')
      .populate('funcionarioAsignado', 'nombres apellidos cargo');

    // Verificar permisos para cada trámite
    if (usuario.rol === 'ciudadano') {
      const tramitesNoAutorizados = tramites.filter(
        tramite => tramite.ciudadano._id.toString() !== usuario._id.toString()
      );
      
      if (tramitesNoAutorizados.length > 0) {
        return res.status(403).json({
          error: 'No tiene permisos para generar PDFs de algunos trámites'
        });
      }
    }

    const pdfGenerator = new PDFGenerator();
    const pdfs = [];

    // Generar PDF para cada trámite
    for (const tramite of tramites) {
      const pdfBuffer = await pdfGenerator.generarDocumentoTramite(
        tramite,
        tramite.ciudadano,
        tramite.funcionarioAsignado
      );
      
      pdfs.push({
        nombre: `tramite_${tramite.codigo}.pdf`,
        data: pdfBuffer.toString('base64')
      });
    }

    res.json({
      success: true,
      pdfs,
      total: pdfs.length
    });

  } catch (error) {
    console.error('Error generando múltiples PDFs:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al generar PDFs' 
    });
  }
});

export default router;