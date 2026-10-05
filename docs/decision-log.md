# Registro de Decisiones (Decision Log)

## Decisiones de la Plantilla Previa (Obsoletas / No Aplicables)

> [!NOTE]
> Las decisiones 001 a 008 pertenecían a la plantilla del proyecto anterior ("Planificador de Limpieza"). Se conservan únicamente como registro histórico de la plantilla original y **no son aplicables** a este proyecto.

### Decisión 001 (Plantilla Anterior)
- **Estado:** Obsoleta.
- **Detalle:** Creación de un planificador de limpieza familiar con personas asignadas.

### Decisiones 002, 004, 008 (Plantilla Anterior)
- **Estado:** Obsoletas.
- **Detalle:** Políticas de retención de asignaciones restringidas a ventanas de 2 meses.

### Decisión 003 (Plantilla Anterior)
- **Estado:** Obsoleta.
- **Detalle:** Regla de una sola persona asignada por día de semana.

### Decisión 005 (Plantilla Anterior)
- **Estado:** Obsoleta.
- **Detalle:** Botón "Guardar mes" con guardado automático simultáneo para limpieza.

### Decisión 006 (Plantilla Anterior)
- **Estado:** Obsoleta.
- **Detalle:** Persistencia de tema en clave separada para la plantilla de limpieza.

### Decisión 007 (Plantilla Anterior)
- **Estado:** Obsoleta.
- **Detalle:** Exportación a imagen PNG de calendario con iniciales de personas.

---

## Decisiones del Proyecto: Calendario de Agua

---

### Decisión 009: Adopción del Proyecto "Calendario de Agua"

- **Fecha:** 2026-10-04
- **Estado:** Aprobada
- **Decisión:**
  Reemplazar por completo el alcance y requisitos de la plantilla anterior para desarrollar la aplicación **Calendario de Agua**, cuyo único objetivo es registrar y consultar fechas de suministro de agua en un calendario mensual interactivo.
- **Razón:**
  Reorientación del proyecto a un caso de uso directo, útil y enfocado en la necesidad de calendarizar fechas de abastecimiento de agua sin intermediación de roles de usuario o tareas del hogar.
- **Consecuencias:**
  - Se eliminan del dominio las personas, tareas de limpieza, temas y exportación de imágenes.
  - La interfaz se simplifica para centrarse en la interacción mensual con días marcados ("Llegará agua") y desmarcados ("Sin programación").

---

### Decisión 010: Arquitectura Mínima sin Dependencias (Vanilla Web)

- **Fecha:** 2026-10-04
- **Estado:** Aprobada
- **Decisión:**
  Estructurar el código fuente de la aplicación en tres archivos estándar: `index.html`, `styles.css` y `app.js`, sin herramientas de construcción (*build tools*), sin gestor de paquetes (*npm*) y sin frameworks.
- **Razón:**
  Garantiza máxima portabilidad, ligereza, facilidad de inspección, ejecución directa en cualquier navegador y simplicidad de mantenimiento según el estándar ProgramingAssistedAI.
- **Consecuencias:**
  - Cero dependencias en el repositorio.
  - Fácil despliegue y ejecución local mediante cualquier servidor estático (ej. `python3 -m http.server`).

---

### Decisión 011: Esquema de Persistencia Versionado en `localStorage`

- **Fecha:** 2026-10-04
- **Estado:** Aprobada
- **Decisión:**
  Utilizar una clave única de almacenamiento `calendar_water_state_v1` con un esquema JSON estructurado y versionado que almacene una lista de fechas únicas en formato ISO `YYYY-MM-DD`.
  ```json
  {
    "version": 1,
    "waterDates": ["2026-10-05", "2026-10-12"],
    "updatedAt": "2026-10-04T22:52:00.000Z"
  }
  ```
- **Razón:**
  - Evitar colisiones de nombres con otras aplicaciones en el mismo origen.
  - Facilitar migraciones futuras si el esquema evoluciona (gracias al campo `version`).
  - El formato `YYYY-MM-DD` es canónico, no sufre problemas de huso horario y permite ordenación natural.
- **Consecuencias:**
  - Almacenamiento limpio, ligero y fácil de validar defensivamente.

---

### Decisión 012: Conservación Indefinida de Fechas (Sin Poda ni Caducidad Automática)

- **Fecha:** 2026-10-04
- **Estado:** Aprobada
- **Decisión:**
  Conservar de forma indefinida todas las fechas guardadas de cualquier mes o año (pasado, presente o futuro), eliminando cualquier política de depuración automática o ventana móvil de retención.
- **Razón:**
  El usuario necesita poder consultar el historial de cuándo llegó el agua en meses pasados y planificar meses futuros sin que el sistema borre datos automáticamente.
- **Consecuencias:**
  - Los datos permanecen en `localStorage` hasta que el usuario desmarque las fechas expresamente o limpie los datos de su navegador.

---

### Decisión 013: Ciclo de Vida del Estado: Navegación Inocua, Estado en Memoria y Guardado Explícito Multimes

- **Fecha:** 2026-10-04
- **Estado:** Aprobada
- **Decisión:**
  Separar estrictamente el estado en memoria (`stagedDates`) del estado persistido (`persistedDates`).
  - La navegación entre meses no ejecuta guardados ni borrados en storage; preserva las selecciones acumuladas en memoria.
  - El botón "Guardar cambios" consolida de forma atómica todas las selecciones pendientes (incluso a través de varios meses) en `localStorage` y muestra feedback de éxito o error.
  - La recarga de la página descarta selecciones no guardadas y restablece el estado persistido.
  - Se incluye un indicador visual de cambios pendientes para advertir al usuario si hay ediciones no guardadas.
- **Razón:**
  Prevenir escrituras accidentales, dar control total al usuario sobre cuándo confirmar sus cambios y evitar que la navegación entre meses sobreescriba o descarte el trabajo en curso.
- **Consecuencias:**
  - Flujo de usuario predecible, robusto y consistente.

---

### Decisión 014: Política de Validación Defensiva y Manejo de Datos Corruptos o Incompatibles

- **Fecha:** 2026-10-04
- **Estado:** Aprobada
- **Decisión:**
  Establecer una política defensiva para la lectura y escritura en `localStorage`:
  1. Validar fechas reales con chequeo estricto del calendario (rechazando fechas inexistentes como `2026-02-30`).
  2. Normalizar duplicados mediante conjuntos (`Set`).
  3. Descartar elementos corruptos individuales preservando los válidos cuando el array es interpretable.
  4. Ante JSON malformado o versión incompatible (`version !== 1`), **no borrar ni sobrescribir automáticamente el almacenamiento al iniciar**, sino notificar al usuario y permitir la operación en memoria.
  5. Exigir confirmación explícita del usuario (`window.confirm`) si posteriormente decide guardar cambios cuando existían datos dañados o incompatibles previos.
  6. Prohibir el uso de `localStorage.clear()` para no impactar otras aplicaciones del mismo origen.
- **Razón:**
  Evitar pérdida silenciosa de datos ante eventuales problemas de serialización o cambios de versión, y garantizar que la aplicación funcione incluso con almacenamiento restringido.
- **Consecuencias:**
  - Máxima resiliencia y protección contra corrupción involuntaria de datos.
