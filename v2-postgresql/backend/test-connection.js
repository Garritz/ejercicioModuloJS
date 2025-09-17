// =====================================================
// SCRIPT DE PRUEBA DE CONEXIÓN A POSTGRESQL
// Ejecutar con: npm run test
// =====================================================

const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Probando conexión a PostgreSQL...\n');

// Configuración de la conexión
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lista_tareas',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

async function probarConexion() {
  let client;
  
  try {
    console.log('📡 Intentando conectar con:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Puerto: ${process.env.DB_PORT || 5432}`);
    console.log(`   Base de datos: ${process.env.DB_NAME || 'lista_tareas'}`);
    console.log(`   Usuario: ${process.env.DB_USER || 'postgres'}\n`);

    // Conectar
    client = await pool.connect();
    console.log('✅ Conexión exitosa!\n');

    // Probar consulta básica
    const timeResult = await client.query('SELECT NOW()');
    console.log('⏰ Hora del servidor:', timeResult.rows[0].now);

    // Probar si existe la tabla tareas
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tareas'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabla "tareas" encontrada');
      
      // Contar registros
      const countResult = await client.query('SELECT COUNT(*) FROM tareas');
      console.log(`📊 Número de tareas: ${countResult.rows[0].count}`);
      
      // Mostrar algunas tareas
      const sampleResult = await client.query('SELECT id, texto, completada FROM tareas LIMIT 3');
      console.log('\n📝 Ejemplo de tareas:');
      sampleResult.rows.forEach(tarea => {
        const estado = tarea.completada ? '✅' : '⏳';
        console.log(`   ${estado} ${tarea.id}: ${tarea.texto}`);
      });
      
      // Probar la vista de estadísticas
      const statsResult = await client.query('SELECT * FROM estadisticas_tareas');
      console.log('\n📈 Estadísticas:');
      const stats = statsResult.rows[0];
      console.log(`   Total: ${stats.total_tareas}`);
      console.log(`   Completadas: ${stats.completadas}`);
      console.log(`   Pendientes: ${stats.pendientes}`);
      console.log(`   Progreso: ${stats.porcentaje_completado}%`);
      
    } else {
      console.log('❌ Tabla "tareas" no encontrada');
      console.log('💡 Asegúrate de haber ejecutado el script setup-database.sql');
    }

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error de conexión:');
    console.error('   Mensaje:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Solución: Verifica que PostgreSQL esté ejecutándose');
    } else if (error.code === '28P01') {
      console.error('💡 Solución: Verifica tu contraseña en el archivo .env');
    } else if (error.code === '3D000') {
      console.error('💡 Solución: Verifica que la base de datos "lista_tareas" existe');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Ejecutar prueba
probarConexion();