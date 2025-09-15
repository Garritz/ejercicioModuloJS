Ejercicio final Módulo JS

# Mi Lista de Tareas

Una aplicación web simple para organizar mis tareas diarias. Mi primer proyecto usando HTML, CSS y JavaScript.

## ¿Qué hace?

- Puedo escribir tareas nuevas y agregarlas
- Marco las tareas cuando las termino
- Elimino las que ya no necesito
- Se actualiza la fecha y hora automáticamente

## Cómo JavaScript lo hace funcionar

### 1. Cambia lo que veo en pantalla (DOM)

En lugar de tener que recargar la página cada vez, JavaScript cambia directamente lo que está en el HTML:

```javascript
// Cuando escribo una tarea nueva, JavaScript la agrega a la lista
const li = document.createElement('li');
lista.appendChild(li);
```

**Lo que aprendí:** JavaScript puede crear elementos HTML nuevos y ponerlos donde yo quiera, sin recargar nada.

### 2. Toma decisiones (Control de flujo)

Mi aplicación verifica cosas antes de hacer acciones:

```javascript
// Si no escribí nada, me avisa
if (textoTarea === '') {
    alert('Por favor escribe una tarea antes de agregar');
    return; 
}

// Decide si la tarea va a "Por hacer" o "Terminadas"
if (esCompletada) {
    // La mueve a terminadas
} else {
    // La mantiene en por hacer
}
```

**Lo que aprendí:** Con `if/else` puedo hacer que mi aplicación tome decisiones automáticamente.

### 3. Guarda mis tareas (Estructuras de datos)

Uso dos listas para organizar mis tareas:

```javascript
let tareasPorHacer = [];     // Lista de tareas pendientes
let tareasTerminadas = [];   // Lista de tareas completadas

// Cada tarea es un objeto con información
const nuevaTarea = {
    id: Math.random() * 1000,
    texto: textoTarea,
    fecha: new Date().toLocaleDateString()
};
```

**Lo que aprendí:** Los arrays me permiten guardar muchas tareas, y los objetos me ayudan a organizar la información de cada una.

### 4. Responde a mis clics (Eventos)

JavaScript "escucha" cuando hago clic en botones o escribo:

```javascript
// Cuando envío el formulario
formulario.addEventListener('submit', function(evento) {
    evento.preventDefault();  // Evita que se recargue la página
    agregarTarea();          // Ejecuta mi función
});
```

**Lo que aprendí:** Con eventos puedo hacer que mi aplicación reaccione a lo que hago (clics, escribir, etc.).

## Las funciones principales que creé

**`agregarTarea()`**: Toma lo que escribí, lo valida, y crea una tarea nueva.

**`eliminarTarea()`**: Busca una tarea por su ID y la elimina de la lista.

**`toggleTarea()`**: Mueve tareas entre "Por hacer" y "Terminadas".

**`mostrarTareas()`**: Actualiza lo que veo en pantalla con las tareas actuales.

## Archivos del proyecto

- `index.html`
- `style.css`
- `script.js`

## Cómo usarlo

Solo abrir `index.html` en el navegador y empezar a escribir tareas.
