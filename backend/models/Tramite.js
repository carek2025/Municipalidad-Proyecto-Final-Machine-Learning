import mongoose from 'mongoose';

const documentoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  url: { type: String, required: true },
  tipo: { type: String, required: true },
  tamaño: Number,
  fechaSubida: { type: Date, default: Date.now },
  verificado: { type: Boolean, default: false }
});

const historialSchema = new mongoose.Schema({
  estado: { type: String, required: true },
  observaciones: String,
  funcionario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fecha: { type: Date, default: Date.now },
  selloPersonal: String,
  documentos: [documentoSchema]
});

const tramiteSchema = new mongoose.Schema({
  codigo: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true
  },
  tipo: { 
    type: String, 
    enum: [
      'LICENCIA_FUNCIONAMIENTO',
      'PERMISO_CONSTRUCCION', 
      'PARTIDA_NACIMIENTO',
      'MATRIMONIO_CIVIL',
      'DEFUNCION',
      'CONSTANCIA_VECINDAD',
      'RECLAMO',
      'SOLICITUD_SERVICIO',
      'PAGO_ARBITRIOS',
      'AUTORIZACION_EVENTO',
      'LICENCIA_CONDUCIR',
      'VERIFICACION_VEHICULAR'
    ],
    required: true
  },
  ciudadano: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  descripcion: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  datosTramite: { 
    type: Map, 
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  estado: {
    type: String,
    enum: ['PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO', 'COMPLETADO', 'CANCELADO'],
    default: 'PENDIENTE'
  },
  prioridad: {
    type: String,
    enum: ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'],
    default: 'MEDIA'
  },
  puntuacionUrgencia: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100
  },
  palabrasClaveUrgencia: [String],
  funcionarioAsignado: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  areaAsignada: {
    type: String,
    enum: ['licencias', 'construccion', 'registrocivil', 'tributaria', 'servicios', 'admin']
  },
  fechaSolicitud: { 
    type: Date, 
    default: Date.now 
  },
  fechaFinalizacion: { 
    type: Date 
  },
  fechaVencimiento: {
    type: Date
  },
  tiempoEstimado: { // en días
    type: Number,
    default: 15
  },
  documentosAdjuntos: [documentoSchema],
  historial: [historialSchema],
  notificaciones: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    ultimaNotificacion: Date
  },
  metadata: {
    ipSolicitud: String,
    userAgent: String,
    dispositivo: String
  }
}, {
  timestamps: true
});

// Índices compuestos para mejor performance
tramiteSchema.index({ ciudadano: 1, fechaSolicitud: -1 });
tramiteSchema.index({ estado: 1, prioridad: -1 });
tramiteSchema.index({ tipo: 1, fechaSolicitud: -1 });
tramiteSchema.index({ funcionarioAsignado: 1, estado: 1 });
tramiteSchema.index({ 'datosTramite.ruc': 1 }, { sparse: true });

// Método para calcular días transcurridos
tramiteSchema.methods.diasTranscurridos = function() {
  return Math.floor((new Date() - this.fechaSolicitud) / (1000 * 60 * 60 * 24));
};

// Método para verificar si está vencido
tramiteSchema.methods.estaVencido = function() {
  if (!this.fechaVencimiento) return false;
  return new Date() > this.fechaVencimiento;
};

// Virtual para progreso
tramiteSchema.virtual('progreso').get(function() {
  const estados = ['PENDIENTE', 'EN_REVISION', 'APROBADO', 'COMPLETADO'];
  const progreso = (estados.indexOf(this.estado) + 1) / estados.length * 100;
  return Math.round(progreso);
});

// Middleware para asignar área automáticamente
tramiteSchema.pre('save', function(next) {
  const areaMap = {
    'LICENCIA_FUNCIONAMIENTO': 'licencias',
    'PERMISO_CONSTRUCCION': 'construccion',
    'PARTIDA_NACIMIENTO': 'registrocivil',
    'MATRIMONIO_CIVIL': 'registrocivil',
    'DEFUNCION': 'registrocivil',
    'CONSTANCIA_VECINDAD': 'registrocivil',
    'PAGO_ARBITRIOS': 'tributaria',
    'LICENCIA_CONDUCIR': 'servicios',
    'VERIFICACION_VEHICULAR': 'servicios'
  };
  
  if (!this.areaAsignada && areaMap[this.tipo]) {
    this.areaAsignada = areaMap[this.tipo];
  }
  next();
});

export default mongoose.model('Tramite', tramiteSchema);