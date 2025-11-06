import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Script para migrar datos o verificar conexión a MongoDB Atlas

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida en las variables de entorno');
  process.exit(1);
}

async function migrateDatabase() {
  let client;
  
  try {
    console.log('🔗 Conectando a MongoDB Atlas...');
    
    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await client.connect();
    console.log('✅ Conectado a MongoDB Atlas');
    
    const db = client.db();
    
    // Verificar conexión
    const adminDb = client.db().admin();
    const serverStatus = await adminDb.serverStatus();
    console.log('📊 Estado del servidor:', serverStatus.host);
    
    // Listar colecciones
    const collections = await db.listCollections().toArray();
    console.log('📚 Colecciones existentes:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    // Crear índices si no existen
    console.log('🔧 Creando índices...');
    
    // Índices para usuarios
    await db.collection('users').createIndex({ dni: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { sparse: true });
    await db.collection('users').createIndex({ rol: 1 });
    
    // Índices para trámites
    await db.collection('tramites').createIndex({ codigo: 1 }, { unique: true });
    await db.collection('tramites').createIndex({ ciudadano: 1, fechaSolicitud: -1 });
    await db.collection('tramites').createIndex({ estado: 1, prioridad: -1 });
    await db.collection('tramites').createIndex({ tipo: 1 });
    await db.collection('tramites').createIndex({ funcionarioAsignado: 1 });
    
    // Índices para alertas
    await db.collection('alertas').createIndex({ codigo: 1 }, { unique: true });
    await db.collection('alertas').createIndex({ tipo: 1, nivel: 1 });
    await db.collection('alertas').createIndex({ fechaGeneracion: -1 });
    
    console.log('✅ Índices creados correctamente');
    
    // Insertar datos iniciales si es necesario
    const usersCount = await db.collection('users').countDocuments();
    if (usersCount === 0) {
      console.log('👥 Insertando usuario administrador inicial...');
      
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await db.collection('users').insertOne({
        dni: '00000000',
        nombres: 'Administrador',
        apellidos: 'Sistema',
        email: 'admin@munihuanuco.gob.pe',
        celular: '999999999',
        direccion: 'Municipalidad Provincial de Huánuco',
        distrito: 'Huanuco',
        password: hashedPassword,
        rol: 'admin',
        cargo: 'Administrador del Sistema',
        area: 'admin',
        activo: true,
        fechaRegistro: new Date(),
        configuracion: {
          notificacionesEmail: true,
          notificacionesSMS: true,
          temaOscuro: false
        }
      });
      
      console.log('✅ Usuario administrador creado:');
      console.log('   DNI: 00000000');
      console.log('   Contraseña: admin123');
      console.log('   ⚠️  Cambia la contraseña después del primer login!');
    }
    
    console.log('🎉 Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔒 Conexión cerrada');
    }
  }
}

// Ejecutar migración
migrateDatabase().catch(console.error);