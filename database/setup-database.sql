-- =====================================================
-- CONFIGURACIÓN BASE DE DATOS - LISTA DE TAREAS
-- Migración desde localStorage a PostgreSQL
-- =====================================================

-- PASO 1: CREAR BASE DE DATOS
CREATE DATABASE lista_tareas
WITH 
OWNER = postgres
ENCODING = 'UTF8'
CONNECTION LIMIT = -1;

-- =====================================================
-- PASO 2: CONFIGURACIÓN DE TABLAS Y ESTRUCTURA
-- =====================================================

-- Crear tabla principal de tareas
CREATE TABLE IF NOT EXISTS tareas (
    id SERIAL PRIMARY KEY,
    texto VARCHAR(500) NOT NULL CHECK (LENGTH(TRIM(texto)) > 0),
    completada BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Comentarios para documentar la estructura
COMMENT ON TABLE tareas IS 'Tabla principal que almacena todas las tareas del usuario';
COMMENT ON COLUMN tareas.id IS 'Identificador único autoincremental';
COMMENT ON COLUMN tareas.texto IS 'Contenido de la tarea (máximo 500 caracteres)';
COMMENT ON COLUMN tareas.completada IS 'Estado: false=pendiente, true=completada';
COMMENT ON COLUMN tareas.fecha_creacion IS 'Fecha y hora de creación (automática)';
COMMENT ON COLUMN tareas.fecha_actualizacion IS 'Fecha y hora de última modificación (automática)';

-- =====================================================
-- PASO 3: ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice para filtrar por estado de completada
CREATE INDEX IF NOT EXISTS idx_tareas_completada 
ON tareas(completada);

-- Índice para ordenar por fecha de creación
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_creacion 
ON tareas(fecha_creacion DESC);

-- Índice para búsquedas de texto en español
CREATE INDEX IF NOT EXISTS idx_tareas_busqueda_texto 
ON tareas USING gin(to_tsvector('spanish', texto));

-- =====================================================
-- PASO 4: FUNCIÓN Y TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función en cada UPDATE
DROP TRIGGER IF EXISTS trigger_actualizar_timestamp ON tareas;
CREATE TRIGGER trigger_actualizar_timestamp
    BEFORE UPDATE ON tareas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- =====================================================
-- PASO 5: DATOS DE PRUEBA INICIALES
-- =====================================================

-- Insertar algunas tareas de ejemplo
INSERT INTO tareas (texto, completada) VALUES 
    ('Configurar base de datos PostgreSQL', true),
    ('Crear API REST con Node.js', false),
    ('Actualizar frontend para usar API', false),
    ('Probar la migración completa', false),
    ('Documentar los cambios realizados', false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PASO 6: VISTA DE ESTADÍSTICAS (OPCIONAL PERO ÚTIL)
-- =====================================================

CREATE OR REPLACE VIEW estadisticas_tareas AS
SELECT 
    COUNT(*) as total_tareas,
    COUNT(*) FILTER (WHERE completada = true) as completadas,
    COUNT(*) FILTER (WHERE completada = false) as pendientes,
    CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((COUNT(*) FILTER (WHERE completada = true)::numeric / COUNT(*)) * 100, 1)
    END as porcentaje_completado
FROM tareas;

-- =====================================================
-- PASO 7: FUNCIONES ÚTILES PARA MANTENIMIENTO
-- =====================================================

-- Función para limpiar tareas completadas antiguas
CREATE OR REPLACE FUNCTION limpiar_tareas_completadas(dias_antiguedad INTEGER DEFAULT 30)
RETURNS TABLE(eliminadas INTEGER, mensaje TEXT) AS $$
DECLARE
    count_eliminadas INTEGER;
BEGIN
    DELETE FROM tareas 
    WHERE completada = true 
      AND fecha_actualizacion < CURRENT_DATE - INTERVAL '1 day' * dias_antiguedad;
    
    GET DIAGNOSTICS count_eliminadas = ROW_COUNT;
    
    RETURN QUERY SELECT 
        count_eliminadas,
        CASE 
            WHEN count_eliminadas = 0 THEN 'No hay tareas completadas para eliminar'
            ELSE format('Se eliminaron %s tareas completadas de más de %s días', count_eliminadas, dias_antiguedad)
        END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PASO 8: VERIFICACIONES Y CONSULTAS DE PRUEBA
-- =====================================================

-- Verificar que la tabla se creó correctamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tareas') THEN
        RAISE NOTICE '✅ Tabla "tareas" creada exitosamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Tabla "tareas" no fue creada';
    END IF;
END $$;

-- Mostrar la estructura de la tabla
SELECT 
    column_name as "Columna",
    data_type as "Tipo de Dato",
    is_nullable as "Permite NULL",
    column_default as "Valor por Defecto"
FROM information_schema.columns 
WHERE table_name = 'tareas' 
ORDER BY ordinal_position;

-- Mostrar las tareas de prueba insertadas
SELECT 
    id,
    texto,
    completada,
    fecha_creacion,
    fecha_actualizacion
FROM tareas 
ORDER BY id;

-- Mostrar estadísticas iniciales
SELECT * FROM estadisticas_tareas;

-- Mensaje final de confirmación
SELECT '🎉 ¡Configuración de base de datos completada exitosamente!' as resultado;