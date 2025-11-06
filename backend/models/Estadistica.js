import mongoose from 'mongoose';

const estadisticaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: [
      'TRAMITES_DIARIOS',
      'TRAMITES_MENSUALES',
      'EFICIENCIA_AREAS',
      'TIEMPOS_RESOLUCION',
      'SATISFACCION_CIUDADANA',
      'ALERTAS_GENERADAS',
      'USUARIOS_ACTIVOS'
    ]
  },
  periodo: {
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    mes: { type: Number },
    año: { type: Number },
    semana: { type: Number }
  },
  datos: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  metricas: {
    total: { type: Number, default: 0 },
    promedio: { type: Number, default: 0 },
    maximo: { type: Number, default: 0 },
    minimo: { type: Number, default: 0 },
    tendencia: { type: String, enum: ['ALTA', 'MEDIA', 'BAJA', 'ESTABLE'] }
  },
  metadata: {
    generadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaGeneracion: { type: Date, default: Date.now },
    fechaActualizacion: { type: Date, default: Date.now },
    version: { type: String, default: '1.0' }
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
estadisticaSchema.index({ tipo: 1, 'periodo.año': 1, 'periodo.mes': 1 });
estadisticaSchema.index({ 'periodo.fechaInicio': 1, 'periodo.fechaFin': 1 });

// Método estático para obtener estadísticas del día actual
estadisticaSchema.statics.obtenerEstadisticasHoy = async function(tipo) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const mañana = new Date(hoy);
  mañana.setDate(hoy.getDate() + 1);

  return this.findOne({
    tipo,
    'periodo.fechaInicio': hoy,
    'periodo.fechaFin': mañana
  });
};

// Método estático para generar estadísticas de trámites diarios
estadisticaSchema.statics.generarEstadisticasDiarias = async function() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const mañana = new Date(hoy);
  mañana.setDate(hoy.getDate() + 1);

  // Estadísticas de trámites del día
  const tramitesHoy = await mongoose.model('Tramite').aggregate([
    {
      $match: {
        fechaSolicitud: { $gte: hoy, $lt: mañana }
      }
    },
    {
      $group: {
        _id: '$tipo',
        total: { $sum: 1 },
        completados: { $sum: { $cond: [{ $eq: ['$estado', 'COMPLETADO'] }, 1, 0] } },
        urgentes: { $sum: { $cond: [{ $eq: ['$prioridad', 'URGENTE'] }, 1, 0] } }
      }
    }
  ]);

  const totalTramites = tramitesHoy.reduce((sum, item) => sum + item.total, 0);
  const totalCompletados = tramitesHoy.reduce((sum, item) => sum + item.completados, 0);
  const totalUrgentes = tramitesHoy.reduce((sum, item) => sum + item.urgentes, 0);

  const datos = {
    totalTramites,
    totalCompletados,
    totalUrgentes,
    eficiencia: totalTramites > 0 ? (totalCompletados / totalTramites) * 100 : 0,
    distribucion: tramitesHoy
  };

  // Guardar estadística
  await this.findOneAndUpdate(
    {
      tipo: 'TRAMITES_DIARIOS',
      'periodo.fechaInicio': hoy,
      'periodo.fechaFin': mañana
    },
    {
      tipo: 'TRAMITES_DIARIOS',
      periodo: {
        fechaInicio: hoy,
        fechaFin: mañana,
        mes: hoy.getMonth() + 1,
        año: hoy.getFullYear(),
        semana: this.getSemanaDelAño(hoy)
      },
      datos: datos,
      metricas: {
        total: totalTramites,
        promedio: totalTramites,
        maximo: totalTramites,
        minimo: totalTramites,
        tendencia: 'ESTABLE'
      },
      metadata: {
        fechaActualizacion: new Date()
      }
    },
    { upsert: true, new: true }
  );

  return datos;
};

// Método para calcular la semana del año
estadisticaSchema.statics.getSemanaDelAño = function(fecha) {
  const firstDayOfYear = new Date(fecha.getFullYear(), 0, 1);
  const pastDaysOfYear = (fecha - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Middleware para actualizar fecha de actualización
estadisticaSchema.pre('save', function(next) {
  this.metadata.fechaActualizacion = new Date();
  next();
});

export default mongoose.model('Estadistica', estadisticaSchema);