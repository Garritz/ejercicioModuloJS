// =====================================================
// SERVIDOR BACKEND - LISTA DE TAREAS
// =====================================================

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// =====================================================
// CONFIGURACIÓN DE MIDDLEWARES
// =====================================================

// Seguridad básica
app.use(helmet({
  contentSecurityPolicy: false // Permitir scripts inline para desarrollo
}));

// CORS para desarrollo local
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Logging básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =====================================================
// CONFIGURACIÓN DE POSTGRESQL
// =====================================================

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lista_tareas',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  max: 20, // Máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Probar conexión inicial
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.stack);
    process.exit(1);
  } else {
    console.log('✅ Conectado exitosamente a PostgreSQL');
    release();
  }
});

// Manejo de errores de la pool
pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
});

// =====================================================
// RUTAS DE LA API
// =====================================================

// Ruta de salud del servidor
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      server_time: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: err.message
    });
  }
});

// Obtener todas las tareas
app.get('/api/tareas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        texto,
        completada,
        fecha_creacion,
        fecha_actualizacion
      FROM tareas 
      ORDER BY 
        CASE WHEN completada = false THEN 0 ELSE 1 END,
        fecha_creacion DESC
    `);
    
    // Separar tareas por estado para mantener compatibilidad con frontend
    const tareasPorHacer = result.rows.filter(tarea => !tarea.completada);
    const tareasTerminadas = result.rows.filter(tarea => tarea.completada);
    
    res.json({
      success: true,
      data: {
        tareasPorHacer,
        tareasTerminadas
      },
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error al obtener tareas:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener tareas',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Crear nueva tarea
app.post('/api/tareas', async (req, res) => {
  try {
    const { texto } = req.body;
    
    // Validaciones
    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'El campo "texto" es requerido y debe ser una cadena de texto'
      });
    }
    
    const textoLimpio = texto.trim();
    if (textoLimpio === '') {
      return res.status(400).json({
        success: false,
        error: 'El texto de la tarea no puede estar vacío'
      });
    }
    
    if (textoLimpio.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'El texto de la tarea no puede exceder 500 caracteres'
      });
    }
    
    // Insertar en la base de datos
    const result = await pool.query(
      'INSERT INTO tareas (texto) VALUES ($1) RETURNING *',
      [textoLimpio]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Tarea creada exitosamente'
    });
  } catch (err) {
    console.error('Error al crear tarea:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al crear la tarea',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Actualizar estado de tarea (completada/pendiente)
app.put('/api/tareas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completada, texto } = req.body;
    
    // Validar ID
    const tareaId = parseInt(id);
    if (isNaN(tareaId) || tareaId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID de tarea inválido'
      });
    }
    
    // Construir query dinámicamente
    let query = 'UPDATE tareas SET ';
    let values = [];
    let valueIndex = 1;
    
    if (typeof completada === 'boolean') {
      query += `completada = $${valueIndex}, `;
      values.push(completada);
      valueIndex++;
    }
    
    if (texto && typeof texto === 'string') {
      const textoLimpio = texto.trim();
      if (textoLimpio.length > 0 && textoLimpio.length <= 500) {
        query += `texto = $${valueIndex}, `;
        values.push(textoLimpio);
        valueIndex++;
      }
    }
    
    // Remover la última coma y espacio
    query = query.slice(0, -2);
    query += ` WHERE id = $${valueIndex} RETURNING *`;
    values.push(tareaId);
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Tarea actualizada exitosamente'
    });
  } catch (err) {
    console.error('Error al actualizar tarea:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al actualizar la tarea',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Eliminar tarea
app.delete('/api/tareas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    const tareaId = parseInt(id);
    if (isNaN(tareaId) || tareaId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID de tarea inválido'
      });
    }
    
    const result = await pool.query(
      'DELETE FROM tareas WHERE id = $1 RETURNING *',
      [tareaId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Tarea eliminada exitosamente'
    });
  } catch (err) {
    console.error('Error al eliminar tarea:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al eliminar la tarea',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Obtener estadísticas
app.get('/api/estadisticas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estadisticas_tareas');
    
    res.json({
      success: true,
      data: result.rows[0] || {
        total_tareas: 0,
        completadas: 0,
        pendientes: 0,
        porcentaje_completado: 0
      }
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener estadísticas'
    });
  }
});

// =====================================================
// RUTA PARA SERVIR EL FRONTEND
// =====================================================

// Servir index.html en la ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================================================
// MANEJO DE ERRORES Y RUTAS NO ENCONTRADAS
// =====================================================

// Manejo de rutas no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.path
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

const server = app.listen(port, () => {
  console.log('\n🚀 =====================================');
  console.log(`📱 Servidor corriendo en puerto ${port}`);
  console.log(`🌐 URL: http://localhost:${port}`);
  console.log(`📊 API: http://localhost:${port}/api/health`);
  console.log(`💾 Base de datos: PostgreSQL`);
  console.log('=====================================\n');
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n⏹️  Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    pool.end(() => {
      console.log('✅ Conexiones de base de datos cerradas');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  console.log('⏹️  Señal SIGTERM recibida, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    pool.end(() => {
      console.log('✅ Conexiones de base de datos cerradas');
      process.exit(0);
    });
  });
});