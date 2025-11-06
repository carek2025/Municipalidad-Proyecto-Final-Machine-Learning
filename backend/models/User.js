import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  dni: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\d{8}$/, 'DNI debe tener 8 dígitos']
  },
  nombres: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  apellidos: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  email: { 
    type: String, 
    sparse: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  celular: { 
    type: String, 
    required: true,
    match: [/^\d{9}$/, 'Celular debe tener 9 dígitos']
  },
  direccion: { 
    type: String, 
    required: true,
    maxlength: 200
  },
  distrito: { 
    type: String, 
    required: true,
    enum: [
      'Huanuco', 'Amarilis', 'Pillco Marca', 'Yacus', 'Chinchao',
      'Churubamba', 'Santa María del Valle', 'San Francisco de Cayrán', 'San Pedro de Chaulan'
    ]
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  rol: { 
    type: String, 
    enum: ['ciudadano', 'administrativo', 'supervisor', 'admin'],
    default: 'ciudadano'
  },
  cargo: { 
    type: String,
    maxlength: 100
  },
  area: {
    type: String,
    enum: ['licencias', 'construccion', 'registrocivil', 'tributaria', 'servicios', 'admin'],
    default: 'admin'
  },
  activo: { 
    type: Boolean, 
    default: true 
  },
  fechaRegistro: { 
    type: Date, 
    default: Date.now 
  },
  ultimoAcceso: { 
    type: Date 
  },
  configuracion: {
    notificacionesEmail: { type: Boolean, default: true },
    notificacionesSMS: { type: Boolean, default: true },
    temaOscuro: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Índices para mejor performance
userSchema.index({ dni: 1 });
userSchema.index({ rol: 1 });
userSchema.index({ distrito: 1 });

// Middleware para hash de password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener nombre completo
userSchema.methods.getFullName = function() {
  return `${this.nombres} ${this.apellidos}`;
};

// Método para generar sello personal
userSchema.methods.generateSelloPersonal = function() {
  const inicial = this.nombres.charAt(0).toUpperCase();
  const apellido = this.apellidos.split(' ')[0];
  const dniSegment = this.dni.slice(-6);
  return `${inicial}.${apellido}-${dniSegment}`;
};

// Virtual para datos públicos
userSchema.virtual('publicData').get(function() {
  return {
    id: this._id,
    dni: this.dni,
    nombres: this.nombres,
    apellidos: this.apellidos,
    email: this.email,
    celular: this.celular,
    direccion: this.direccion,
    distrito: this.distrito,
    rol: this.rol,
    cargo: this.cargo,
    area: this.area,
    fechaRegistro: this.fechaRegistro
  };
});

export default mongoose.model('User', userSchema);