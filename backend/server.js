import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import Estadistica from './models/Estadistica.js';
import notificacionesService from './utils/notificaciones.js';

// Configuración ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000 // límite de peticiones
});
app.use(limiter);

// Middleware
app.use(cors({
  origin: ['https://municipal.huancacode.com', 'https://www.municipal.huancacode.com', process.env.FRONTEND_URL],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(process.env.UPLOAD_PATH || path.join(__dirname, 'uploads')));

// Conexión optimizada para MongoDB Atlas
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB Atlas conectado: ${conn.connection.host}`);
    
    // Manejar eventos de conexión
    mongoose.connection.on('error', err => {
      console.error('❌ Error de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconectado');
    });

  } catch (error) {
    console.error('❌ Error conectando a MongoDB Atlas:', error);
    process.exit(1);
  }
};

// Conectar a la base de datos
connectDB();

// Importar rutas
import authRoutes from './routes/auth.js';
import tramitesRoutes from './routes/tramites.js';
import alertasRoutes from './routes/alertas.js';
import dashboardRoutes from './routes/dashboard.js';
import pdfRoutes from './routes/pdf.js';

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/tramites', tramitesRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pdf', pdfRoutes);

// Ruta de health check mejorada
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV,
    domain: 'municipal.huancacode.com',
    mongodb: {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState
    }
  };
  res.json(health);
});


// Ruta de información del sistema
app.get('/api/system/info', (req, res) => {
  res.json({
    name: 'Sistema de Gestión Municipal',
    version: '2.0.0',
    domain: 'municipal.huancacode.com',
    municipality: 'Municipalidad Provincial de Huánuco',
    support: {
      email: 'soporte@huancacode.com',
      phone: '(062) 512255'
    }
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error del servidor:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
    domain: 'municipal.huancacode.com'
  });
});

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    domain: 'municipal.huancacode.com'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🏛️  Sistema Municipal de Huánuco - Backend activo`);
  console.log(`🌐 Dominio: https://municipal.huancacode.com`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
});