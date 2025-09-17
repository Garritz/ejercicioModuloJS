# Lista de Tareas v2.0

Una aplicación web para gestionar tareas diarias, migrada de localStorage a PostgreSQL con backend Node.js.

## Descripción

Este proyecto representa la evolución de una aplicación de lista de tareas hacia una aplicación web completa con persistencia real de datos. Mantiene la simplicidad del diseño original mientras añade la robustez de una base de datos profesional.

## Estructura del Proyecto

```
ejercicioModuloJS/
├── database/
│   └── setup-database.sql      # Script de configuración de BD
├── v1-localStorage/            # Versión original
├── v2-postgresql/              # Versión con PostgreSQL
│   └── backend/
│       ├── package.json
│       ├── server.js           # Servidor Express.js
│       ├── test-connection.js
│       └── public/             # Frontend
│           ├── index.html
│           ├── style.css
│           └── script.js
└── README.md
```

## Stack Tecnológico

**Backend**: Node.js, Express.js, PostgreSQL
**Frontend**: HTML5, CSS3, JavaScript ES6+
**Base de Datos**: PostgreSQL 12+

## Instalación

### 1. Base de Datos

```sql
-- En PostgreSQL
CREATE DATABASE lista_tareas;
```

Ejecutar `database/setup-database.sql` en la base de datos creada.

### 2. Backend

```bash
cd v2-postgresql/backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de PostgreSQL

# Probar conexión
npm run test

# Iniciar aplicación
npm run dev
```

### 3. Variables de Entorno

Crear `.env` en `v2-postgresql/backend/`:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lista_tareas
DB_USER=postgres
DB_PASSWORD=tu_password
```

## Uso

La aplicación estará disponible en `http://localhost:3000`

### API Endpoints

- `GET /api/health` - Estado del servidor
- `GET /api/tareas` - Obtener tareas
- `POST /api/tareas` - Crear tarea
- `PUT /api/tareas/:id` - Actualizar tarea
- `DELETE /api/tareas/:id` - Eliminar tarea

### Scripts

- `npm run dev` - Modo desarrollo
- `npm start` - Modo producción
- `npm run test` - Probar conexión BD

## Base de Datos

### Tabla `tareas`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | Identificador único |
| texto | VARCHAR(500) | Contenido de la tarea |
| completada | BOOLEAN | Estado |
| fecha_creacion | TIMESTAMP | Fecha de creación |
| fecha_actualizacion | TIMESTAMP | Última actualización |

## Funcionalidades

- Crear, editar y eliminar tareas
- Marcar como completadas/pendientes
- Contadores automáticos
- Actualizaciones en tiempo real
- Persistencia en PostgreSQL

## Comparación de Versiones

| Característica | v1.0 localStorage | v2.0 PostgreSQL |
|----------------|-------------------|-----------------|
| Persistencia | Solo local | Base de datos |
| Escalabilidad | 1 usuario | Múltiples usuarios |
| Sincronización | No | Sí |
| Backup | Manual | Automático |