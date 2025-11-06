import express from 'express';
import Tramite from '../models/Tramite.js';
import Alerta from '../models/Alerta.js';
import User from '../models/User.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Estadísticas generales del dashboard
router.get('/estadisticas', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    let tramitesQuery = {};
    
    // Ciudadanos solo ven sus trámites
    if (user.rol === 'ciudadano') {
      tramitesQuery.ciudadano = user._id;
    }

    const totalTramites = await Tramite.countDocuments(tramitesQuery);
    const tramitesPendientes = await Tramite.countDocuments({ 
      ...tramitesQuery,
      estado: 'PENDIENTE' 
    });
    const tramitesUrgentes = await Tramite.countDocuments({ 
      ...tramitesQuery,
      prioridad: 'URGENTE' 
    });
    const tramitesCompletados = await Tramite.countDocuments({ 
      ...tramitesQuery,
      estado: 'COMPLETADO' 
    });

    // Estadísticas por tipo de trámite
    const tramitesPorTipo = await Tramite.aggregate([
      {
        $match: tramitesQuery
      },
      {
        $group: {
          _id: '$tipo',
          count: { $sum: 1 },
          completados: {
            $sum: { $cond: [{ $eq: ['$estado', 'COMPLETADO'] }, 1, 0] }
          }
        }
      }
    ]);

    // Tiempo promedio de resolución
    const tiempoPromedio = await Tramite.aggregate([
      {
        $match: {
          ...tramitesQuery,
          estado: 'COMPLETADO',
          fechaFinalizacion: { $exists: true },
          fechaSolicitud: { $exists: true }
        }
      },
      {
        $project: {
          duracion: {
            $divide: [
              { $subtract: ['$fechaFinalizacion', '$fechaSolicitud'] },
              1000 * 60 * 60 * 24 // Convertir a días
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          promedio: { $avg: '$duracion' }
        }
      }
    ]);

    // Alertas activas (solo para personal)
    let alertasActivas = 0;
    if (user.rol !== 'ciudadano') {
      alertasActivas = await Alerta.countDocuments({ leidaGlobal: false });
    }

    res.json({
      success: true,
      metricasGenerales: {
        totalTramites,
        tramitesPendientes,
        tramitesUrgentes,
        tramitesCompletados,
        tiempoPromedioDias: tiempoPromedio[0]?.promedio || 0
      },
      tramitesPorTipo,
      alertasActivas
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Métricas en tiempo real
router.get('/metricas-tiempo-real', authMiddleware, async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const user = req.user;
    let tramitesQuery = {};
    
    if (user.rol === 'ciudadano') {
      tramitesQuery.ciudadano = user._id;
    }

    const tramitesHoy = await Tramite.countDocuments({
      ...tramitesQuery,
      fechaSolicitud: { $gte: hoy }
    });

    const completadosHoy = await Tramite.countDocuments({
      ...tramitesQuery,
      estado: 'COMPLETADO',
      fechaFinalizacion: { $gte: hoy }
    });

    const urgentesActivos = await Tramite.countDocuments({
      ...tramitesQuery,
      prioridad: 'URGENTE',
      estado: { $in: ['PENDIENTE', 'EN_REVISION'] }
    });

    // Simular usuarios conectados (en un sistema real, esto se haría con sesiones)
    const usuariosConectados = await User.countDocuments({
      ultimoAcceso: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // últimos 15 minutos
    });

    res.json({
      success: true,
      tramitesHoy,
      completadosHoy,
      urgentesActivos,
      usuariosConectados
    });

  } catch (error) {
    console.error('Error obteniendo métricas en tiempo real:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Trámites recientes
router.get('/tramites-recientes', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const user = req.user;

    let query = {};
    if (user.rol === 'ciudadano') {
      query.ciudadano = user._id;
    }

    const tramites = await Tramite.find(query)
      .populate('ciudadano', 'dni nombres apellidos celular distrito')
      .sort({ fechaSolicitud: -1 })
      .limit(limit);

    res.json({
      success: true,
      tramites
    });

  } catch (error) {
    console.error('Error obteniendo trámites recientes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Alertas urgentes
router.get('/alertas-urgentes', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // Solo personal puede ver alertas urgentes
    if (user.rol === 'ciudadano') {
      return res.json({
        success: true,
        alertas: []
      });
    }

    const alertas = await Alerta.find({
      nivel: { $in: ['ALTO', 'CRITICO'] },
      leidaGlobal: false
    })
      .populate({
        path: 'tramite',
        populate: {
          path: 'ciudadano',
          select: 'dni nombres apellidos'
        }
      })
      .sort({ fechaGeneracion: -1 })
      .limit(5);

    res.json({
      success: true,
      alertas
    });

  } catch (error) {
    console.error('Error obteniendo alertas urgentes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Distribución de trámites por área (solo para personal)
router.get('/distribucion-areas', authMiddleware, requireRole(['administrativo', 'supervisor', 'admin']), async (req, res) => {
  try {
    const distribucion = await Tramite.aggregate([
      {
        $group: {
          _id: '$areaAsignada',
          total: { $sum: 1 },
          pendientes: {
            $sum: { $cond: [{ $eq: ['$estado', 'PENDIENTE'] }, 1, 0] }
          },
          completados: {
            $sum: { $cond: [{ $eq: ['$estado', 'COMPLETADO'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      distribucion
    });

  } catch (error) {
    console.error('Error obteniendo distribución por áreas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

export default router;