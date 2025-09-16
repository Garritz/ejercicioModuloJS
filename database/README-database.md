# Documentación de Base de Datos - Lista de Tareas

## Estructura de la Base de Datos

### Tabla Principal: `tareas`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL | Identificador único autoincremental |
| `texto` | VARCHAR(500) | Contenido de la tarea (máximo 500 caracteres) |
| `completada` | BOOLEAN | Estado: false=pendiente, true=completada |
| `fecha_creacion` | TIMESTAMP WITH TIME ZONE | Fecha/hora de creación (automática) |
| `fecha_actualizacion` | TIMESTAMP WITH TIME ZONE | Fecha/hora de última modificación (automática) |

### Índices Creados

1. `idx_tareas_completada` - Para filtros por estado
2. `idx_tareas_fecha_creacion` - Para ordenamiento por fecha
3. `idx_tareas_busqueda_texto` - Para búsquedas de texto en español

### Funciones Disponibles

#### `actualizar_timestamp()`
- **Propósito**: Actualiza automáticamente `fecha_actualizacion` en cada UPDATE
- **Trigger**: `trigger_actualizar_timestamp`
- **Uso**: Automático

#### `limpiar_tareas_completadas(dias_antiguedad)`
- **Propósito**: Elimina tareas completadas más antiguas que X días
- **Parámetro**: `dias_antiguedad` (default: 30)
- **Uso**: `SELECT * FROM limpiar_tareas_completadas(30);`

### Vista: `estadisticas_tareas`

Proporciona un resumen estadístico:
- `total_tareas`: Número total de tareas
- `completadas`: Tareas completadas
- `pendientes`: Tareas pendientes  
- `porcentaje_completado`: Porcentaje de completion

## Configuración Inicial

### Prerequisitos
- PostgreSQL 12+ instalado
- DBeaver o cliente SQL
- Permisos para crear bases de datos

### Instalación
1. Ejecutar `setup-database.sql` en PostgreSQL
2. Verificar que todas las estructuras se crearon correctamente
3. Probar con las consultas de ejemplo

### Datos de Prueba

El script incluye 5 tareas de ejemplo para facilitar las pruebas iniciales.

## Consultas Útiles

### Operaciones Básicas
```sql
-- Insertar nueva tarea
INSERT INTO tareas (texto) VALUES ('Mi nueva tarea');

-- Marcar como completada
UPDATE tareas SET completada = true WHERE id = 1;

-- Eliminar tarea
DELETE FROM tareas WHERE id = 1;
```

### Consultas de Reporte
```sql
-- Tareas pendientes
SELECT * FROM tareas WHERE completada = false ORDER BY fecha_creacion;

-- Tareas completadas hoy
SELECT * FROM tareas 
WHERE completada = true 
AND DATE(fecha_actualizacion) = CURRENT_DATE;

-- Estadísticas generales
SELECT * FROM estadisticas_tareas;
```

### Mantenimiento
```sql
-- Limpiar tareas completadas de más de 30 días
SELECT * FROM limpiar_tareas_completadas(30);

-- Ver espacio usado por la tabla
SELECT pg_size_pretty(pg_total_relation_size('tareas'));
```

## Backup y Restore

### Crear Backup
```bash
pg_dump -U postgres -h localhost lista_tareas > backup_tareas.sql
```

### Restaurar
```bash
psql -U postgres -h localhost -d lista_tareas < backup_tareas.sql
```

## Conexión desde Aplicación

### Variables de Entorno Requeridas
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lista_tareas
DB_USER=postgres
DB_PASSWORD=tu_password
```

### String de Conexión
```
postgresql://postgres:password@localhost:5432/lista_tareas
```