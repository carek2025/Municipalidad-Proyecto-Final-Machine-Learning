import mongoose from 'mongoose';

const alertaSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  tramite: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tramite', 
    required: true 
  },
  tipo: { 
    type: String, 
    enum: [
      'URGENCIA_ML',
      'VENCIMIENTO',
      'DOCUMENTACION_INCOMPLETA',
      'REVISION_PENDIENTE',
      'CAMBIO_ESTADO',
      'SISTEMA'
    ],
    required: true 
  },
  nivel: {
    type: String,
    enum: ['INFORMATIVO', 'BAJO', 'MEDIO', 'ALTO', 'CRITICO'],
    default: 'MEDIO'
  },
  titulo: {
    type: String,
    required: true,
    maxlength: 200
  },
  mensaje: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  datosAdicionales: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  destinatarios: [{
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    leida: { type: Boolean, default: false },
    fechaLectura: Date
  }],
  leidaGlobal: { 
    type: Boolean, 
    default: false 
  },
  fechaGeneracion: { 
    type: Date, 
    default: Date.now 
  },
  fechaResolucion: { 
    type: Date 
  },
  fechaExpiracion: {
    type: Date
  },
  resueltaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acciones: [{
    tipo: String,
    descripcion: String,
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, {
  timestamps: true
});

// Índices
alertaSchema.index({ tipo: 1, nivel: 1 });
alertaSchema.index({ fechaGeneracion: -1 });
alertaSchema.index({ leidaGlobal: 1 });
alertaSchema.index({ 'destinatarios.usuario': 1 });

// Método para marcar como leída por usuario
alertaSchema.methods.marcarLeida = function(usuarioId) {
  const destinatario = this.destinatarios.find(d => d.usuario.toString() === usuarioId.toString());
  if (destinatario) {
    destinatario.leida = true;
    destinatario.fechaLectura = new Date();
  }
};

// Método para verificar si todos han leído
alertaSchema.methods.todosHanLeido = function() {
  return this.destinatarios.every(d => d.leida);
};

// Generar código de alerta
alertaSchema.statics.generarCodigo = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ALT-${timestamp}-${random}`.toUpperCase();
};

export default mongoose.model('Alerta', alertaSchema);