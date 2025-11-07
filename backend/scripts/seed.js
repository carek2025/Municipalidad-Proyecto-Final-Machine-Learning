import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Tramite from '../models/Tramite.js';

dotenv.config({ path: '../.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    console.log('🌱 Iniciando seed de datos...\n');

    // Limpiar datos existentes
    await User.deleteMany({});
    await Tramite.deleteMany({});
    console.log('🗑️  Datos anteriores eliminados');

    // Crear usuarios de prueba
    const usuarios = [
      {
        dni: '12345678',
        nombres: 'Juan Carlos',
        apellidos: 'Pérez García',
        email: 'juan.perez@email.com',
        celular: '987654321',
        direccion: 'Av. Principal 123',
        distrito: 'Huanuco',
        password: 'password123',
        rol: 'ciudadano',
        activo: true
      },
      {
        dni: '87654321',
        nombres: 'María Elena',
        apellidos: 'González López',
        email: 'maria.gonzalez@munihuanuco.gob.pe',
        celular: '987654322',
        direccion: 'Jr. Constitución 456',
        distrito: 'Huanuco',
        password: 'admin123',
        rol: 'admin',
        cargo: 'Administrador del Sistema',
        area: 'admin',
        activo: true
      },
      {
        dni: '11223344',
        nombres: 'Pedro',
        apellidos: 'Sánchez Rojas',
        email: 'pedro.sanchez@munihuanuco.gob.pe',
        celular: '987654323',
        direccion: 'Jr. Huánuco 789',
        distrito: 'Amarilis',
        password: 'admin123',
        rol: 'administrativo',
        cargo: 'Técnico Administrativo',
        area: 'licencias',
        activo: true
      },
      {
        dni: '44332211',
        nombres: 'Ana María',
        apellidos: 'Torres Vega',
        email: 'ana.torres@email.com',
        celular: '987654324',
        direccion: 'Av. Alameda 321',
        distrito: 'Pillco Marca',
        password: 'password123',
        rol: 'ciudadano',
        activo: true
      },
      {
        dni: '55667788',
        nombres: 'Roberto',
        apellidos: 'Díaz Flores',
        email: 'roberto.diaz@munihuanuco.gob.pe',
        celular: '987654325',
        direccion: 'Jr. Dos de Mayo 555',
        distrito: 'Huanuco',
        password: 'admin123',
        rol: 'supervisor',
        cargo: 'Supervisor de Área',
        area: 'registrocivil',
        activo: true
      }
    ];

    const usuariosCreados = await User.create(usuarios);
    console.log(`✅ ${usuariosCreados.length} usuarios creados`);

    // Crear trámites de ejemplo
    const ciudadano1 = usuariosCreados.find(u => u.dni === '12345678');
    const ciudadano2 = usuariosCreados.find(u => u.dni === '44332211');
    const funcionario1 = usuariosCreados.find(u => u.dni === '11223344');

    const tramites = [
      {
        codigo: 'LF250100001',
        tipo: 'LICENCIA_FUNCIONAMIENTO',
        ciudadano: ciudadano1._id,
        descripcion: 'Solicito licencia de funcionamiento para establecimiento comercial de abarrotes ubicado en Av. Principal 123, Huánuco. El local cuenta con todos los requisitos sanitarios y de seguridad.',
        estado: 'PENDIENTE',
        prioridad: 'MEDIA',
        puntuacionUrgencia: 45,
        palabrasClaveUrgencia: ['solicito', 'comercial'],
        areaAsignada: 'licencias',
        datosTramite: {
          tipoNegocio: 'Abarrotes',
          direccionLocal: 'Av. Principal 123',
          metraje: '45 m²'
        }
      },
      {
        codigo: 'PN250100002',
        tipo: 'PARTIDA_NACIMIENTO',
        ciudadano: ciudadano2._id,
        descripcion: 'Necesito con urgencia copia certificada de partida de nacimiento para trámite de pasaporte. Fecha de nacimiento: 15/03/1985.',
        estado: 'EN_REVISION',
        prioridad: 'ALTA',
        puntuacionUrgencia: 72,
        palabrasClaveUrgencia: ['urgencia', 'necesito'],
        funcionarioAsignado: funcionario1._id,
        areaAsignada: 'registrocivil',
        datosTramite: {
          fechaNacimiento: '1985-03-15',
          motivo: 'Trámite de pasaporte'
        }
      },
      {
        codigo: 'PC250100003',
        tipo: 'PERMISO_CONSTRUCCION',
        ciudadano: ciudadano1._id,
        descripcion: 'Solicito permiso para construcción de vivienda unifamiliar de 2 pisos en Jr. Los Álamos 456, con área de construcción de 180 m². Adjunto planos y documentos técnicos.',
        estado: 'PENDIENTE',
        prioridad: 'MEDIA',
        puntuacionUrgencia: 50,
        areaAsignada: 'construccion',
        datosTramite: {
          tipoObra: 'Vivienda unifamiliar',
          pisos: 2,
          areaTerreno: '200 m²',
          areaConstruccion: '180 m²'
        }
      },
      {
        codigo: 'RC250100004',
        tipo: 'RECLAMO',
        ciudadano: ciudadano2._id,
        descripcion: 'URGENTE: Reclamo por falta de recojo de basura en Jr. Constitución cuadra 4 desde hace 5 días. Hay riesgo de contaminación y malos olores. Solicito atención inmediata.',
        estado: 'PENDIENTE',
        prioridad: 'URGENTE',
        puntuacionUrgencia: 95,
        palabrasClaveUrgencia: ['urgente', 'riesgo', 'inmediato', 'contaminación'],
        areaAsignada: 'servicios',
        datosTramite: {
          tipoReclamo: 'Servicio de limpieza',
          ubicacion: 'Jr. Constitución cuadra 4',
          diasSinAtencion: 5
        }
      },
      {
        codigo: 'CV250100005',
        tipo: 'CONSTANCIA_VECINDAD',
        ciudadano: ciudadano1._id,
        descripcion: 'Solicito constancia de vecindad con una antigüedad de 5 años en la dirección Av. Principal 123 para trámite bancario.',
        estado: 'COMPLETADO',
        prioridad: 'BAJA',
        puntuacionUrgencia: 30,
        funcionarioAsignado: funcionario1._id,
        areaAsignada: 'registrocivil',
        fechaFinalizacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        datosTramite: {
          añosResidencia: 5,
          motivo: 'Trámite bancario'
        }
      }
    ];

    const tramitesCreados = await Tramite.create(tramites);
    console.log(`✅ ${tramitesCreados.length} trámites creados\n`);

    // Mostrar resumen
    console.log('📊 RESUMEN DE DATOS CREADOS:');
    console.log('═══════════════════════════════════════\n');
    
    console.log('👥 USUARIOS:');
    usuariosCreados.forEach(u => {
      console.log(`   ${u.rol.toUpperCase().padEnd(15)} - ${u.nombres} ${u.apellidos}`);
      console.log(`   DNI: ${u.dni} | Celular: ${u.celular}`);
      if (u.rol !== 'ciudadano') {
        console.log(`   Cargo: ${u.cargo} | Área: ${u.area}`);
      }
      console.log('');
    });

    console.log('📄 TRÁMITES:');
    tramitesCreados.forEach(t => {
      console.log(`   ${t.codigo} - ${t.tipo}`);
      console.log(`   Estado: ${t.estado} | Prioridad: ${t.prioridad}`);
      console.log(`   Ciudadano: ${t.ciudadano}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════');
    console.log('✅ Seed completado exitosamente!');
    console.log('\n🔑 CREDENCIALES DE ACCESO:\n');
    console.log('CIUDADANO:');
    console.log('  DNI: 12345678 | Password: password123');
    console.log('  DNI: 44332211 | Password: password123\n');
    console.log('PERSONAL:');
    console.log('  DNI: 87654321 | Password: admin123 (Admin)');
    console.log('  DNI: 11223344 | Password: admin123 (Administrativo)');
    console.log('  DNI: 55667788 | Password: admin123 (Supervisor)\n');

  } catch (error) {
    console.error('❌ Error en seed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
};

// Ejecutar seed
connectDB().then(() => {
  seedData();
});
