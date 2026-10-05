# Requisitos del Proyecto: Calendario de Agua

## 1. Objetivo del Proyecto

El proyecto **Calendario de Agua** consiste en una aplicación web interactiva y liviana para seleccionar fechas previstas de llegada del suministro de agua potable y consultar dichas fechas en una vista de calendario mensual. La solución debe funcionar de forma autónoma en el navegador del cliente mediante almacenamiento local, sin dependencias externas ni backend.

## 2. Usuarios y Contexto de Uso

Usuarios residenciales o comunitarios que necesitan llevar un registro y planificación visual de los días en que dispondrán de agua potable en su localidad, navegando libremente entre meses y administrando sus fechas de manera sencilla tanto desde dispositivos móviles como de escritorio.

---

## 3. Requisitos Funcionales (RF)

- **RF-001 (Vista inicial del mes actual):** La aplicación debe iniciar mostrando automáticamente el mes y año en curso según la fecha del sistema.
- **RF-002 (Localización en español y semanas de lunes a domingo):** La interfaz debe estar completamente en español (nombres de meses y días). La cuadrícula semanal debe comenzar obligatoriamente el día **Lunes** y finalizar en **Domingo**.
- **RF-003 (Interacción de marcado/desmarcado de fechas):** El usuario puede hacer clic (o activar con teclado) sobre cualquier día del mes para alternar su estado entre marcado y desmarcado.
- **RF-004 (Semántica de estados de fecha):**
  - *Fecha marcada:* Representa "Llegará agua".
  - *Fecha desmarcada:* Representa "Sin programación".
- **RF-005 (Diferenciación visual y día actual):**
  - Las fechas marcadas deben destacarse visualmente de forma clara (color, badge o indicador gráfico).
  - El día actual ("hoy") debe tener un distintivo visual propio que lo identifique dentro del calendario.
  - Los días pertenecientes al mes visible deben distinguirse de posibles días de relleno de meses adyacentes.
- **RF-006 (Navegación temporal sin pérdida de cambios):** Debe permitir navegar hacia meses anteriores y posteriores (e incrementar/decrementar años) manteniendo intactas en memoria las selecciones y deselecciones realizadas, sin importar si han sido guardadas o están pendientes de guardar.
- **RF-007 (Mantenimiento de estado en memoria):** Los cambios efectuados en cualquier mes navegado deben acumularse en memoria viva (`staged state`) hasta que el usuario decida guardarlos o recargar la página.
- **RF-008 (Guardado explícito por lotes multimes):** La aplicación dispondrá de un botón "Guardar cambios" que consolidará y persistirá en `localStorage` el estado completo de todas las fechas seleccionadas, abarcando todos los meses modificados en la sesión.
- **RF-009 (Indicador de cambios pendientes):** La interfaz debe mostrar un indicador visible cuando existan modificaciones pendientes de guardar respecto al último estado persistido.
- **RF-010 (Retroalimentación al guardar):** Al presionar "Guardar cambios", la interfaz debe mostrar un mensaje claro de confirmación de éxito o un mensaje de error si ocurre un fallo (ej. almacenamiento deshabilitado o cuota excedida).
- **RF-011 (Recuperación en carga):** Al abrir o recargar la página, la aplicación debe leer `localStorage` y recuperar el conjunto de fechas guardadas.
- **RF-012 (Conservación indefinida de meses):** No debe existir ninguna regla de depuración, poda o eliminación automática de fechas pasadas o futuras. Todas las fechas guardadas se conservan de forma indefinida hasta que el usuario decida desmarcarlas y guardar.
- **RF-013 (Comportamiento ante recarga):** Una recarga de página (*refresh*) descartará los cambios pendientes en memoria y restaurará fielmente el último estado persistido en `localStorage`.

---

## 4. Requisitos No Funcionales (RNF)

- **RNF-001 (Cero Dependencias):** Implementación exclusiva en HTML5 semántico, CSS3 puro y JavaScript nativo (Vanilla JS). Prohibido el uso de frameworks (React, Vue, etc.), bibliotecas de utilidades (date-fns, moment, lodash) o dependencias npm.
- **RNF-002 (Accesibilidad y Uso por Teclado):** Los días interactivos y controles deben ser accesibles mediante teclado (teclas `Tab`, `Enter`, `Espacio`), disponer de atributos ARIA adecuados (como `aria-label`, `aria-pressed`, `aria-live` para mensajes) y un indicador de foco claramente visible.
- **RNF-003 (Diseño Responsivo):** La interfaz debe adaptarse de manera fluida y legible a pantallas pequeñas (smartphones), medianas (tablets) y grandes (escritorio).
- **RNF-004 (Robustez de Almacenamiento):** Lectura y escritura defensiva en `localStorage` mediante serialización JSON estructurada y versionada, manejando excepciones para evitar que errores de almacenamiento congelen la interfaz.
- **RNF-005 (Mantenibilidad y Código Limpio):** Separación modular de responsabilidades dentro de una arquitectura sencilla y directa (`index.html`, `styles.css`, `app.js`).

---

## 5. Alcance

### Dentro del Alcance Inicial
- Vista mensual del calendario con navegación temporal hacia atrás y adelante.
- Selección interactiva de fechas de llegada de agua.
- Distinción del día de hoy y de días seleccionados.
- Acumulación de selecciones multimes en memoria.
- Guardado explícito en `localStorage` con indicador de cambios y mensajes de estado.
- Recuperación de datos persistidos al cargar.
- Soporte para navegación accesible por teclado y diseño adaptable.

### Fuera del Alcance Inicial (Excluido Explícitamente)
- Asignación de personas, miembros del hogar o tareas de limpieza (pertenecientes a plantillas previas).
- Generación automática de recurrencias semanales o patrones fijos.
- Cuentas de usuario, perfiles y autenticación.
- Sincronización remota, API REST o base de datos externa.
- Notificaciones push o alarmas locales.
- Exportación del calendario a formatos de imagen (PNG/SVG) o PDF.
- Integraciones con servicios de mensajería (WhatsApp, Telegram, etc.).

---

## 6. Fases de Desarrollo y Criterios de Aceptación

El proyecto se estructura en 4 fases secuenciales:

### Fase 1: Definición y Documentación (Fase Actual)
- **Objetivo:** Definir requisitos, arquitectura, modelo de dominio, log de decisiones y estado del proyecto sin escribir código de la aplicación.
- **Criterios de Aceptación:**
  - `README.md`, `docs/requirements.md`, `docs/architecture.md`, `docs/domain-model.md`, `docs/decision-log.md` y `docs/project-state.md` reflejan con precisión la nueva definición de "Calendario de Agua".
  - Las decisiones y conceptos del anterior "Planificador de Limpieza" quedan identificados explícitamente como obsoletos/plantilla previa.
  - Se define la arquitectura mínima (`index.html`, `styles.css`, `app.js`), clave de almacenamiento y esquema JSON versionado.
  - Se documenta el estado real: la implementación del código fuente aún no ha comenzado.

### Fase 2: Calendario e Interacción en Memoria
- **Objetivo:** Construir la interfaz base (`index.html`, `styles.css`) y el motor de calendario con selección en memoria (`app.js`).
- **Criterios de Aceptación:**
  - Muestra el mes y año actual en español al iniciar, con semanas de lunes a domingo.
  - Permite navegar a meses previos y futuros sin errores en años bisiestos o cambios de año.
  - Permite marcar y desmarcar fechas mediante clic o teclado (Enter/Espacio).
  - Destaca visualmente el día actual ("hoy") y las fechas seleccionadas.
  - Al cambiar de mes y regresar, las fechas seleccionadas en memoria permanecen activas.
  - El indicador visual muestra cuando hay cambios pendientes respecto al estado inicial.
  - No interactúa con `localStorage` todavía.

### Fase 3: Persistencia y Manejo de Errores
- **Objetivo:** Integrar el almacenamiento en `localStorage` mediante esquema JSON versionado y control de guardado/recarga.
- **Criterios de Aceptación:**
  - Al pulsar "Guardar cambios", el conjunto de fechas seleccionadas de todos los meses se guarda en `localStorage` bajo el esquema versionado.
  - Se muestra mensaje de éxito al guardar satisfactoriamente y el indicador de pendientes se desactiva.
  - Se capturan y manejan errores de `localStorage` (como `QuotaExceededError` o modo incógnito restringido), mostrando mensaje de error al usuario sin perder el estado en memoria.
  - Al recargar la página, se recuperan exactamente las fechas guardadas previamente.
  - Los cambios no guardados se descartan al recargar.
  - Todas las fechas de cualquier mes o año se conservan sin límite de tiempo ni borrado automático.

### Fase 4: Verificación Funcional y Visual
- **Objetivo:** Validar la experiencia de usuario, diseño responsivo, accesibilidad por teclado y robustez global.
- **Criterios de Aceptación:**
  - Verificación en viewports móviles (ej. 320px - 480px) y escritorio (pantallas amplias) sin desbordamientos ni elementos rotos.
  - Navegación completa por teclado con focos visibles y soporte de lectores de pantalla básico (`aria-live`, etiquetas semánticas).
  - Pruebas de borde: meses bisiestos (febrero 2028), cambio de siglo/año, meses con 31 días.
  - Revisión de consistencia de estados: navegación, guardado y recarga.
