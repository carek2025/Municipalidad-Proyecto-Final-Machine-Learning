import express from 'express';
import Alerta from '../models/Alerta.js';
import Tramite from '../models/Tramite.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Obtener todas las alertas con filtros
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { leida, nivel, tipo, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Filtros
    if (leida !== undefined) query.leidaGlobal = leida === 'true';
    if (nivel) query.nivel = nivel;
    if (tipo) query.tipo = tipo;

    const alertas = await Alerta.find(query)
      .populate({
        path: 'tramite',
        populate: {
          path: 'ciudadano',
          select: 'dni nombres apellidos celular distrito'
        }
      })
      .populate('destinatarios.usuario', 'nombres apellidos cargo')
      .sort({ fechaGeneracion: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Alerta.countDocuments(query);

    res.json({
      success: true,
      alertas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Obtener alerta por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const alerta = await Alerta.findById(req.params.id)
      .populate({
        path: 'tramite',
        populate: {
          path: 'ciudadano',
          select: 'dni nombres apellidos celular direccion distrito'
        }
      })
      .populate('destinatarios.usuario', 'nombres apellidos cargo area');

    if (!alerta) {
      return res.status(404).json({ 
        error: 'Alerta no encontrada' 
      });
    }

    res.json({
      success: true,
      alerta
    });

  } catch (error) {
    console.error('Error obteniendo alerta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Marcar alerta como leída
router.put('/:id/leida', authMiddleware, async (req, res) => {
  try {
    const alerta = await Alerta.findById(req.params.id);

    if (!alerta) {
      return res.status(404).json({ 
        error: 'Alerta no encontrada' 
      });
    }

    // Marcar como leída por el usuario actual
    alerta.marcarLeida(req.user._id);
    await alerta.save();

    res.json({
      success: true,
      message: 'Alerta marcada como leída'
    });

  } catch (error) {
    console.error('Error marcando alerta como leída:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Resolver alerta (solo personal autorizado)
router.put('/:id/resolver', authMiddleware, requireRole(['administrativo', 'supervisor', 'admin']), async (req, res) => {
  try {
    const { observaciones } = req.body;

    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      {
        leidaGlobal: true,
        fechaResolucion: new Date(),
        resueltaPor: req.user._id,
        $push: {
          acciones: {
            tipo: 'RESOLUCION',
            descripcion: observaciones || 'Alerta resuelta',
            usuario: req.user._id
          }
        }
      },
      { new: true }
    );

    if (!alerta) {
      return res.status(404).json({ 
        error: 'Alerta no encontrada' 
      });
    }

    res.json({
      success: true,
      message: 'Alerta resuelta exitosamente',
      alerta
    });

  } catch (error) {
    console.error('Error resolviendo alerta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Crear alerta manual (solo personal autorizado)
router.post('/', authMiddleware, requireRole(['administrativo', 'supervisor', 'admin']), async (req, res) => {
  try {
    const { tramiteId, tipo, nivel, titulo, mensaje, datosAdicionales } = req.body;

    const tramite = await Tramite.findById(tramiteId);
    if (!tramite) {
      return res.status(404).json({ 
        error: 'Trámite no encontrado' 
      });
    }

    const alerta = new Alerta({
      codigo: Alerta.generarCodigo(),
      tramite: tramiteId,
      tipo,
      nivel,
      titulo,
      mensaje,
      datosAdicionales,
      destinatarios: [{
        usuario: tramite.ciudadano,
        leida: false
      }]
    });

    await alerta.save();

    res.status(201).json({
      success: true,
      message: 'Alerta creada exitosamente',
      alerta: await alerta.populate({
        path: 'tramite',
        populate: {
          path: 'ciudadano',
          select: 'dni nombres apellidos celular'
        }
      })
    });

  } catch (error) {
    console.error('Error creando alerta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Estadísticas de alertas
router.get('/estadisticas/estadisticas', authMiddleware, async (req, res) => {
  try {
    const totalAlertas = await Alerta.countDocuments();
    const alertasNoLeidas = await Alerta.countDocuments({ leidaGlobal: false });
    const alertasCriticas = await Alerta.countDocuments({ nivel: 'CRITICO' });

    const alertasPorTipo = await Alerta.aggregate([
      {
        $group: {
          _id: '$tipo',
          count: { $sum: 1 },
          noLeidas: {
            $sum: { $cond: [{ $eq: ['$leidaGlobal', false] }, 1, 0] }
          }
        }
      }
    ]);

    const alertasPorNivel = await Alerta.aggregate([
      {
        $group: {
          _id: '$nivel',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      estadisticas: {
        total: totalAlertas,
        noLeidas: alertasNoLeidas,
        criticas: alertasCriticas,
        porTipo: alertasPorTipo,
        porNivel: alertasPorNivel
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de alertas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

export default router;