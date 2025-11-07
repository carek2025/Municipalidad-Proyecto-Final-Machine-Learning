import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.set('trust proxy', true);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS Configuration
app.use(cors({
  origin: [
    'https://municipal.huancacode.com', 
    'https://www.municipal.huancacode.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
const uploadsPath = process.env.UPLOAD_PATH || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// MongoDB Connection
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
    console.log(`📁 Base de datos: ${conn.connection.name}`);
    
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
    console.log('💡 Verifica:');
    console.log('   1. La cadena de conexión en .env');
    console.log('   2. Que el cluster esté activo');
    console.log('   3. Network Access (0.0.0.0/0)');
    process.exit(1);
  }
};

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

// Health check mejorado
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
    domain: 'municipal.huancacode.com',
    database: {
      status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };
  
  res.json(health);
});

// System info
app.get('/api/system/info', (req, res) => {
  res.json({
    name: 'Sistema de Gestión Municipal',
    version: '2.0.0',
    domain: 'municipal.huancacode.com',
    municipality: 'Municipalidad Provincial de Huánuco',
    features: [
      'Gestión de trámites',
      'Sistema de alertas ML',
      'Generación de PDFs',
      'Dashboard en tiempo real'
    ],
    support: {
      email: 'soporte@huancacode.com',
      phone: '(062) 512255'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    domain: 'municipal.huancacode.com'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    domain: 'municipal.huancacode.com'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('🛑 Servidor cerrado');
    mongoose.connection.close(false, () => {
      console.log('🛑 MongoDB desconectado');
      process.exit(0);
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Servidor Municipal de Huánuco - Backend Activo');
  console.log('='.repeat(60));
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 Dominio: https://municipal.huancacode.com`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Conectado' : '❌ Desconectado'}`);
  console.log('='.repeat(60) + '\n');
});

export default app;
