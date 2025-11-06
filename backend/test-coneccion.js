// test-connection-esm.js
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://integerserial_db_user:OymsP6HB4Ziv6i5C@cluster0.lz26yxf.mongodb.net/techstore?retryWrites=true&w=majority";

async function test() {
  console.log('🔌 Probando conexión FINAL...');
  console.log('👤 Usuario: integerserial_db_user');
  console.log('🌐 Host: cluster0.lz26yxf.mongodb.net');
  console.log('📁 Base de datos: techstore');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ ¡CONEXIÓN EXITOSA!');
    
    const db = client.db('techstore');
    console.log('📊 Conectado a base de datos:', db.databaseName);
    
    // Listar colecciones
    const collections = await db.listCollections().toArray();
    console.log('📁 Colecciones existentes:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    if (collections.length === 0) {
      console.log('ℹ️ La base de datos está vacía - se crearán colecciones automáticamente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Posibles soluciones:');
    console.log('1. Verifica que el cluster esté activo en MongoDB Atlas');
    console.log('2. Revisa Network Access (debe tener 0.0.0.0/0)');
    console.log('3. Confirma usuario y contraseña');
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

test();