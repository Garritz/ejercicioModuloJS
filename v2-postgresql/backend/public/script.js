// =====================================================
// FRONTEND ACTUALIZADO - LISTA DE TAREAS
// =====================================================

// Configuración de la API
const API_BASE_URL = window.location.origin + '/api';

// Variables globales para almacenar las tareas
let tareasPorHacer = []; 
let tareasTerminadas = [];

// =====================================================
// FUNCIONES DE UTILIDAD Y MANEJO DE ERRORES
// =====================================================

// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear elemento de mensaje si no existe
    let mensajeDiv = document.getElementById('mensaje-usuario');
    if (!mensajeDiv) {
        mensajeDiv = document.createElement('div');
        mensajeDiv.id = 'mensaje-usuario';
        document.body.appendChild(mensajeDiv);
    }
    
    // Limpiar clases anteriores
    mensajeDiv.className = '';
    
    // Asignar clase según el tipo de mensaje
    const clases = {
        error: 'mensaje-error',
        warning: 'mensaje-warning'
    };
    
    mensajeDiv.classList.add(clases[tipo] || clases.error);
    mensajeDiv.textContent = mensaje;
    mensajeDiv.style.opacity = '1';
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        mensajeDiv.style.opacity = '0';
    }, 3000);
}

// Función para manejar errores de la API
function manejarError(error, contexto = '') {
    console.error(`Error ${contexto}:`, error);
    
    let mensajeError = 'Ocurrió un error inesperado';
    
    if (error.message === 'Failed to fetch') {
        mensajeError = 'No se puede conectar con el servidor. Verifica que esté ejecutándose.';
    } else if (error.message.includes('NetworkError')) {
        mensajeError = 'Error de conexión de red';
    } else if (error.message) {
        mensajeError = error.message;
    }
    
    mostrarMensaje(mensajeError, 'error');
}

// Función para realizar peticiones HTTP
async function realizarPeticion(url, opciones = {}) {
    try {
        const respuesta = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...opciones.headers
            },
            ...opciones
        });
        
        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${respuesta.status}: ${respuesta.statusText}`);
        }
        
        return await respuesta.json();
    } catch (error) {
        throw error;
    }
}

// =====================================================
// FUNCIONES DE API - COMUNICACIÓN CON EL BACKEND
// =====================================================

// Cargar todas las tareas desde la API
async function cargarTareas() {
    try {
        mostrarCargando(true);
        
        const respuesta = await realizarPeticion(`${API_BASE_URL}/tareas`);
        
        if (respuesta.success) {
            tareasPorHacer = respuesta.data.tareasPorHacer || [];
            tareasTerminadas = respuesta.data.tareasTerminadas || [];
            
            mostrarTareas();
            actualizarContadores();
        } else {
            throw new Error(respuesta.error || 'Error al cargar tareas');
        }
        
    } catch (error) {
        manejarError(error, 'al cargar tareas');
        // En caso de error, mostrar interfaz vacía
        tareasPorHacer = [];
        tareasTerminadas = [];
        mostrarTareas();
        actualizarContadores();
    } finally {
        mostrarCargando(false);
    }
}

// Agregar una tarea nueva
async function agregarTarea() {
    const textarea = document.querySelector('textarea[name="ingresartarea"]');
    const textoTarea = textarea.value.trim();
    
    // Validación local
    if (textoTarea === '') {
        mostrarMensaje('Por favor escribe una tarea antes de agregar', 'warning');
        textarea.focus();
        return; 
    }
    
    if (textoTarea.length > 500) {
        mostrarMensaje('La tarea no puede exceder 500 caracteres', 'warning');
        return;
    }
    
    try {
        const respuesta = await realizarPeticion(`${API_BASE_URL}/tareas`, {
            method: 'POST',
            body: JSON.stringify({ texto: textoTarea })
        });
        
        if (respuesta.success) {
            // Limpiar formulario
            textarea.value = '';
            
            // Recargar tareas desde la base de datos
            await cargarTareas();
        } else {
            throw new Error(respuesta.error);
        }
        
    } catch (error) {
        manejarError(error, 'al crear tarea');
    }
}

// Eliminar una tarea
async function eliminarTarea(id) {
    // Confirmación antes de eliminar
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        return;
    }
    
    try {
        const respuesta = await realizarPeticion(`${API_BASE_URL}/tareas/${id}`, {
            method: 'DELETE'
        });
        
        if (respuesta.success) {
            // Recargar tareas desde la base de datos
            await cargarTareas();
        } else {
            throw new Error(respuesta.error);
        }
        
    } catch (error) {
        manejarError(error, 'al eliminar tarea');
    }
}

// Cambiar el estado de una tarea (completada/pendiente)
async function toggleTarea(id, completadaActual) {
    try {
        const respuesta = await realizarPeticion(`${API_BASE_URL}/tareas/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ completada: !completadaActual })
        });
        
        if (respuesta.success) {
            // Recargar tareas desde la base de datos
            await cargarTareas();
        } else {
            throw new Error(respuesta.error);
        }
        
    } catch (error) {
        manejarError(error, 'al actualizar tarea');
        // Revertir checkbox en caso de error
        const checkbox = document.querySelector(`input[onchange*="${id}"]`);
        if (checkbox) {
            checkbox.checked = completadaActual;
        }
    }
}

// =====================================================
// FUNCIONES DE INTERFAZ DE USUARIO
// =====================================================

// Mostrar indicador de carga
function mostrarCargando(mostrar) {
    let indicador = document.getElementById('indicador-carga');
    
    if (mostrar && !indicador) {
        indicador = document.createElement('div');
        indicador.id = 'indicador-carga';
        indicador.innerHTML = 'Cargando...';
        document.body.appendChild(indicador);
    } else if (!mostrar && indicador) {
        indicador.remove();
    }
}

// Mostrar todas las tareas
function mostrarTareas() {
    mostrarTareasPorHacer();
    mostrarTareasTerminadas();
}

// Mostrar tareas pendientes
function mostrarTareasPorHacer() {
    const lista = document.querySelector('#porhacer ul');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    if (tareasPorHacer.length === 0) {
        lista.innerHTML = '<li class="estado-vacio">Todo listo!</li>';
        return;
    }
    
    tareasPorHacer.forEach((tarea, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="tarea">
                <p class="tareaID">${index + 1}.</p>
                <p class="tareaNombre" title="${tarea.texto}">${tarea.texto}</p>
            </div>
            <div class="opciones">
                <button onclick="eliminarTarea(${tarea.id})" title="Eliminar tarea">
                    Eliminar
                </button>
                <input 
                    type="checkbox" 
                    onchange="toggleTarea(${tarea.id}, ${tarea.completada})"
                    title="Marcar como completada"
                >
            </div>
        `;
        lista.appendChild(li);
    });
}

// Mostrar tareas completadas
function mostrarTareasTerminadas() {
    const lista = document.querySelector('#terminadas ul');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    if (tareasTerminadas.length === 0) {
        lista.innerHTML = '<li class="estado-vacio">Ni una papa pelá.</li>';
        return;
    }

    tareasTerminadas.forEach((tarea, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="tarea">
                <p class="tareaID">${index + 1}.</p>
                <p class="tareaNombre tarea-completada-texto" title="${tarea.texto}">
                    ${tarea.texto}
                </p>
            </div>
            <div class="opciones">
                <button onclick="eliminarTarea(${tarea.id})" title="Eliminar tarea">
                    Eliminar
                </button>
                <input 
                    type="checkbox" 
                    checked 
                    onchange="toggleTarea(${tarea.id}, ${tarea.completada})"
                    title="Marcar como pendiente"
                >
            </div>
        `;
        lista.appendChild(li);
    });
}

// Actualizar contadores en los títulos
function actualizarContadores() {
    const tituloPorHacer = document.querySelector('#porhacer h1');
    const tituloTerminadas = document.querySelector('#terminadas h1');
    
    if (tituloPorHacer) {
        tituloPorHacer.textContent = `Tengo (${tareasPorHacer.length}) tareas por hacer`;
    }
    
    if (tituloTerminadas) {
        tituloTerminadas.textContent = `Ya terminé (${tareasTerminadas.length}) tareas`;
    }
}

// Actualizar fecha y hora en el header
function actualizarFecha() {
    const ahora = new Date();
    const opciones = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const fechaTexto = ahora.toLocaleDateString('es-ES', opciones);
    const hora = ahora.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const header = document.querySelector('header h2');
    if (header) {
        header.textContent = `Hoy es ${fechaTexto} y son las ${hora}`;
    }
}

// =====================================================
// FUNCIONES DE VERIFICACIÓN Y ESTADO
// =====================================================

// Verificar conexión con el servidor
async function verificarConexionServidor() {
    try {
        const respuesta = await realizarPeticion(`${API_BASE_URL}/health`);
        
        if (respuesta.status === 'OK') {
            console.log('Conexión con servidor: OK');
            console.log('Base de datos:', respuesta.database);
            return true;
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarMensaje('No se puede conectar con el servidor', 'error');
        return false;
    }
}

// Cargar estadísticas (función adicional)
async function cargarEstadisticas() {
    try {
        const respuesta = await realizarPeticion(`${API_BASE_URL}/estadisticas`);
        
        if (respuesta.success) {
            console.log('Estadísticas:', respuesta.data);
            // Podrías mostrar estas estadísticas en la interfaz si quieres
        }
    } catch (error) {
        console.log('Info: No se pudieron cargar las estadísticas');
    }
}

// =====================================================
// INICIALIZACIÓN Y EVENTOS
// =====================================================

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Iniciando aplicación Lista de Tareas v2.0...');
    
    // Verificar conexión con el servidor
    const conexionOK = await verificarConexionServidor();
    
    if (!conexionOK) {
        mostrarMensaje('Problemas de conexión. Algunas funciones pueden no estar disponibles.', 'warning');
    }
    
    // Actualizar fecha inicial
    actualizarFecha();
    
    // Cargar tareas desde la base de datos
    await cargarTareas();
    
    // Cargar estadísticas (opcional)
    await cargarEstadisticas();
    
    // Configurar eventos del formulario
    const formulario = document.querySelector('form');
    if (formulario) {
        formulario.addEventListener('submit', async function(evento) {
            evento.preventDefault();
            await agregarTarea();
        });
    }
    
    // Configurar botón limpiar
    const botonLimpiar = document.querySelector('button[type="reset"]');
    if (botonLimpiar) {
        botonLimpiar.addEventListener('click', function() {
            const textarea = document.querySelector('textarea[name="ingresartarea"]');
            if (textarea) {
                textarea.value = '';
                textarea.focus();
            }
        });
    }
    
    // Actualizar la hora cada minuto
    setInterval(actualizarFecha, 60000);
    
    // Recargar tareas cada 5 minutos para mantener sincronización
    setInterval(cargarTareas, 300000);
    
    console.log('Aplicación inicializada correctamente');
});

// Manejar errores globales no capturados
window.addEventListener('error', function(event) {
    console.error('Error global:', event.error);
    mostrarMensaje('Ocurrió un error inesperado', 'error');
});

// Manejar promesas rechazadas no capturadas
window.addEventListener('unhandledrejection', function(event) {
    console.error('Promesa rechazada:', event.reason);
    mostrarMensaje('Error de conexión', 'error');
    event.preventDefault();
});

// =====================================================
// FUNCIONES ADICIONALES PARA DEBUGGING (DESARROLLO)
// =====================================================

// Función para desarrolladores - accesible desde la consola
window.debugTareas = {
    mostrarTareas: () => console.log('Tareas por hacer:', tareasPorHacer, 'Terminadas:', tareasTerminadas),
    recargarTareas: cargarTareas,
    verificarConexion: verificarConexionServidor,
    limpiarMensajes: () => {
        const mensaje = document.getElementById('mensaje-usuario');
        if (mensaje) mensaje.remove();
    }
};

console.log('Debug: Usa window.debugTareas para funciones de desarrollo');