// Lista de Tareas con almacenamiento local
let tareasPorHacer = []; 
let tareasTerminadas = []; 

// Cargar tareas desde localStorage
function cargarTareas() {
    const tareasPorHacerGuardadas = localStorage.getItem('tareasPorHacer');
    const tareasTerminadasGuardadas = localStorage.getItem('tareasTerminadas');
    
    if (tareasPorHacerGuardadas) {
        tareasPorHacer = JSON.parse(tareasPorHacerGuardadas);
    }
    
    if (tareasTerminadasGuardadas) {
        tareasTerminadas = JSON.parse(tareasTerminadasGuardadas);
    }
}

// Guardar tareas en localStorage
function guardarTareas() {
    localStorage.setItem('tareasPorHacer', JSON.stringify(tareasPorHacer));
    localStorage.setItem('tareasTerminadas', JSON.stringify(tareasTerminadas));
}

// Agregar una tarea nueva
function agregarTarea() {
    const textarea = document.querySelector('textarea[name="ingresartarea"]');
    const textoTarea = textarea.value.trim();
    
    // Validación
    if (textoTarea === '') {
        alert('Por favor escribe una tarea antes de agregar');
        return; 
    }
    
    // Objeto nuevo
    const nuevaTarea = {
        id: Date.now() + Math.random(), // ID más único
        texto: textoTarea,
        fecha: new Date().toLocaleDateString()
    };
    
    tareasPorHacer.push(nuevaTarea);
    
    // Limpiar formulario
    textarea.value = '';
    
    // Guardar y actualizar
    guardarTareas();
    mostrarTareas();
    actualizarContadores();
}

// Eliminar una tarea
function eliminarTarea(id, esCompletada) {
    if (esCompletada) {
        tareasTerminadas = tareasTerminadas.filter(tarea => tarea.id !== id);
    } else {
        tareasPorHacer = tareasPorHacer.filter(tarea => tarea.id !== id);
    }
    
    // Guardar y actualizar
    guardarTareas();
    mostrarTareas();
    actualizarContadores();
}

// Marcar una tarea como completada o pendiente
function toggleTarea(id, esCompletada) {
    if (esCompletada) {
        const tareaIndex = tareasTerminadas.findIndex(tarea => tarea.id === id);
        const tarea = tareasTerminadas[tareaIndex];
        tareasPorHacer.push(tarea);
        tareasTerminadas.splice(tareaIndex, 1);
    } else {
        const tareaIndex = tareasPorHacer.findIndex(tarea => tarea.id === id);
        const tarea = tareasPorHacer[tareaIndex];
        tareasTerminadas.push(tarea);
        tareasPorHacer.splice(tareaIndex, 1);
    }
    
    // Guardar y actualizar
    guardarTareas();
    mostrarTareas();
    actualizarContadores();
}

// Mostrar todas las tareas
function mostrarTareas() {
    mostrarTareasPorHacer();
    mostrarTareasTerminadas();
}

// Mostrar pendientes
function mostrarTareasPorHacer() {
    const lista = document.querySelector('#porhacer ul');
    lista.innerHTML = '';
    
    tareasPorHacer.forEach((tarea, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="tarea">
                <p class="tareaID">${index + 1}.</p>
                <p class="tareaNombre">${tarea.texto}</p>
            </div>
            <div class="opciones">
                <button onclick="eliminarTarea(${tarea.id}, false)">Eliminar</button>
                <input type="checkbox" onchange="toggleTarea(${tarea.id}, false)">
            </div>
        `;
        lista.appendChild(li);
    });
    
    if (tareasPorHacer.length === 0) {
        lista.innerHTML = '<li>Todo listo!</li>';
    }
}

// Mostrar completadas
function mostrarTareasTerminadas() {
    const lista = document.querySelector('#terminadas ul');
    lista.innerHTML = '';

    tareasTerminadas.forEach((tarea, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="tarea">
                <p class="tareaID">${index + 1}.</p>
                <p class="tareaNombre" style="text-decoration: line-through;">${tarea.texto}</p>
            </div>
            <div class="opciones">
                <button onclick="eliminarTarea(${tarea.id}, true)">Eliminar</button>
                <input type="checkbox" checked onchange="toggleTarea(${tarea.id}, true)">
            </div>
        `;
        lista.appendChild(li);
    });
    
    if (tareasTerminadas.length === 0) {
        lista.innerHTML = '<li>Ni una papa pelá.</li>';
    }
}

// Actualizar números de los títulos
function actualizarContadores() {
    const tituloPorHacer = document.querySelector('#porhacer h1');
    tituloPorHacer.textContent = `Tengo (${tareasPorHacer.length}) tareas por hacer`;
    
    const tituloTerminadas = document.querySelector('#terminadas h1');
    tituloTerminadas.textContent = `Ya terminé (${tareasTerminadas.length}) tareas`;
}

// Actualizar fecha
function actualizarFecha() {
    const ahora = new Date();
    const fechaTexto = ahora.toLocaleDateString('es-ES');
    const hora = ahora.toLocaleTimeString('es-ES');
    
    const header = document.querySelector('header h2');
    header.textContent = `Hoy es ${fechaTexto} y son las ${hora}`;
}

// Función para exportar tareas (opcional)
function exportarTareas() {
    const datos = {
        tareasPorHacer: tareasPorHacer,
        tareasTerminadas: tareasTerminadas,
        fechaExportacion: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(datos, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'mis-tareas.json';
    link.click();
}

// Eventos
document.addEventListener('DOMContentLoaded', function() {
    // Cargar tareas guardadas al inicio
    cargarTareas();
    
    actualizarFecha();
    
    const formulario = document.querySelector('form');
    formulario.addEventListener('submit', function(evento) {
        evento.preventDefault();
        agregarTarea();
    });
    
    const botonLimpiar = document.querySelector('button[type="reset"]');
    botonLimpiar.addEventListener('click', function() {
        document.querySelector('textarea[name="ingresartarea"]').value = '';
    });
    
    mostrarTareas();
    actualizarContadores();
});