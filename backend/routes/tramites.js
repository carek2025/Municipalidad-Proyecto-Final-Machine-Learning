import express from 'express';
import Tramite from '../models/Tramite.js';
import Alerta from '../models/Alerta.js';
import { authMiddleware, requireRole, requireArea } from '../middleware/auth.js';
import upload, { handleUploadError } from '../middleware/upload.js';
import { mlService } from '../utils/mlService.js';

const router = express.Router();

// Generar código único para trámites
const generarCodigoTramite = async (tipo) => {
  const prefixMap = {
    'LICENCIA_FUNCIONAMIENTO': 'LF',
    'PERMISO_CONSTRUCCION': 'PC',
    'PARTIDA_NACIMIENTO': 'PN',
    'MATRIMONIO_CIVIL': 'MC',
    'DEFUNCION': 'DF',
    'CONSTANCIA_VECINDAD': 'CV',
    'RECLAMO': 'RC',
    'SOLICITUD_SERVICIO': 'SS',
    'PAGO_ARBITRIOS': 'PA',
    'AUTORIZACION_EVENTO': 'AE',
    'LICENCIA_CONDUCIR': 'LC',
    'VERIFICACION_VEHICULAR': 'VV'
  };

  const prefix = prefixMap[tipo] || 'TR';
  const count = await Tramite.countDocuments({ tipo });
  const fecha = new Date();
  const year = fecha.getFullYear().toString().slice(-2);
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
  
  return `${prefix}${year}${month}${(count + 1).toString().padStart(4, '0')}`;
};

// Crear nuevo trámite
router.post('/', authMiddleware, upload.array('documentos', 5), handleUploadError, async (req, res) => {
  try {
    const { tipo, descripcion, datosTramite } = req.body;
    const usuario = req.user;

    // Validaciones
    if (!tipo || !descripcion) {
      return res.status(400).json({ 
        error: 'Tipo y descripción son requeridos' 
      });
    }

    // Generar código único
    const codigo = await generarCodigoTramite(tipo);

    // Procesar documentos adjuntos
    const documentosAdjuntos = req.files ? req.files.map(file => ({
      nombre: file.originalname,
      url: `/uploads/${file.filename}`,
      tipo: file.mimetype,
      tamaño: file.size
    })) : [];

    // Calcular urgencia inicial
    const analisisUrgencia = await mlService.analizarUrgencia(descripcion);
    
    // Crear trámite
    const tramite = new Tramite({
      codigo,
      tipo,
      ciudadano: usuario._id,
      descripcion,
      datosTramite: datosTramite ? JSON.parse(datosTramite) : {},
      prioridad: analisisUrgencia.priority,
      puntuacionUrgencia: analisisUrgencia.urgency_score,
      palabrasClaveUrgencia: analisisUrgencia.found_keywords,
      documentosAdjuntos,
      metadata: {
        ipSolicitud: req.ip,
        userAgent: req.get('User-Agent'),
        dispositivo: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
      }
    });

    await tramite.save();

    // Crear alerta si es urgente
    if (analisisUrgencia.priority === 'URGENTE' || analisisUrgencia.priority === 'ALTA') {
      const alerta = new Alerta({
        codigo: Alerta.generarCodigo(),
        tramite: tramite._id,
        tipo: 'URGENCIA_ML',
        nivel: analisisUrgencia.priority === 'URGENTE' ? 'CRITICO' : 'ALTO',
        titulo: `Trámite ${codigo} marcado como ${analisisUrgencia.priority}`,
        mensaje: `El trámite ${codigo} ha sido identificado como prioritario por el sistema de ML. Puntuación: ${analisisUrgencia.urgency_score}`,
        datosAdicionales: {
          puntuacion: analisisUrgencia.urgency_score,
          palabrasClave: analisisUrgencia.found_keywords,
          confianza: analisisUrgencia.confidence
        }
      });

      await alerta.save();
    }

    // Popular datos para respuesta
    await tramite.populate('ciudadano', 'dni nombres apellidos celular distrito');

    res.status(201).json({
      success: true,
      message: 'Trámite creado exitosamente',
      tramite: {
        id: tramite._id,
        codigo: tramite.codigo,
        tipo: tramite.tipo,
        estado: tramite.estado,
        prioridad: tramite.prioridad,
        puntuacionUrgencia: tramite.puntuacionUrgencia,
        fechaSolicitud: tramite.fechaSolicitud,
        ciudadano: tramite.ciudadano.publicData
      }
    });

  } catch (error) {
    console.error('Error creando trámite:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Error de validación', 
        details: errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Obtener trámites con filtros
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      tipo, 
      estado, 
      prioridad, 
      area,
      page = 1, 
      limit = 10,
      sort = 'fechaSolicitud',
      order = 'desc'
    } = req.query;
    
    const usuario = req.user;
    
    // Construir query
    let query = {};
    
    // Ciudadanos solo ven sus trámites
    if (usuario.rol === 'ciudadano') {
      query.ciudadano = usuario._id;
    } else {
      // Personal puede filtrar por área
      if (area && usuario.area !== 'admin') {
        query.areaAsignada = area;
      }
    }
    
    // Aplicar filtros
    if (tipo) query.tipo = tipo;
    if (estado) query.estado = estado;
    if (prioridad) query.prioridad = prioridad;

    // Configurar ordenamiento
    const sortConfig = {};
    sortConfig[sort] = order === 'desc' ? -1 : 1;

    // Ejecutar consulta
    const tramites = await Tramite.find(query)
      .populate('ciudadano', 'dni nombres apellidos celular distrito')
      .populate('funcionarioAsignado', 'nombres apellidos cargo area')
      .sort(sortConfig)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Tramite.countDocuments(query);

    res.json({
      success: true,
      tramites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error obteniendo trámites:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Obtener trámite por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const tramite = await Tramite.findById(req.params.id)
      .populate('ciudadano', 'dni nombres apellidos celular direccion distrito email')
      .populate('funcionarioAsignado', 'nombres apellidos cargo area')
      .populate('historial.funcionario', 'nombres apellidos cargo');

    if (!tramite) {
      return res.status(404).json({ 
        error: 'Trámite no encontrado' 
      });
    }

    // Verificar permisos
    const usuario = req.user;
    if (usuario.rol === 'ciudadano' && tramite.ciudadano._id.toString() !== usuario._id.toString()) {
      return res.status(403).json({ 
        error: 'No tiene permisos para ver este trámite' 
      });
    }

    res.json({
      success: true,
      tramite
    });

  } catch (error) {
    console.error('Error obteniendo trámite:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Actualizar estado de trámite
router.put('/:id/estado', authMiddleware, requireRole(['administrativo', 'supervisor', 'admin']), async (req, res) => {
  try {
    const { estado, observaciones } = req.body;
    const usuario = req.user;

    if (!estado) {
      return res.status(400).json({ 
        error: 'Estado es requerido' 
      });
    }

    const tramite = await Tramite.findById(req.params.id);
    if (!tramite) {
      return res.status(404).json({ 
        error: 'Trámite no encontrado' 
      });
    }

    // Agregar al historial
    tramite.historial.push({
      estado,
      observaciones,
      funcionario: usuario._id,
      selloPersonal: usuario.generateSelloPersonal()
    });

    // Actualizar estado
    tramite.estado = estado;
    
    // Si se completa, registrar fecha de finalización
    if (estado === 'COMPLETADO') {
      tramite.fechaFinalizacion = new Date();
    }

    await tramite.save();

    // Crear alerta de cambio de estado
    const alerta = new Alerta({
      codigo: Alerta.generarCodigo(),
      tramite: tramite._id,
      tipo: 'CAMBIO_ESTADO',
      nivel: 'INFORMATIVO',
      titulo: `Estado actualizado: ${estado}`,
      mensaje: `El trámite ${tramite.codigo} ha cambiado su estado a ${estado}`,
      destinatarios: [{
        usuario: tramite.ciudadano,
        leida: false
      }]
    });

    await alerta.save();

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      tramite: await Tramite.findById(req.params.id).populate('ciudadano', 'dni nombres apellidos celular')
    });

  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Asignar trámite a funcionario
router.put('/:id/asignar', authMiddleware, requireRole(['supervisor', 'admin']), async (req, res) => {
  try {
    const { funcionarioId } = req.body;

    if (!funcionarioId) {
      return res.status(400).json({ 
        error: 'ID de funcionario es requerido' 
      });
    }

    const tramite = await Tramite.findByIdAndUpdate(
      req.params.id,
      { 
        funcionarioAsignado: funcionarioId,
        estado: 'EN_REVISION'
      },
      { new: true }
    ).populate('ciudadano', 'dni nombres apellidos celular')
     .populate('funcionarioAsignado', 'nombres apellidos cargo area');

    if (!tramite) {
      return res.status(404).json({ 
        error: 'Trámite no encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Trámite asignado exitosamente',
      tramite
    });

  } catch (error) {
    console.error('Error asignando trámite:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

export default router;