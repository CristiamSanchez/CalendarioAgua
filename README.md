# CalendarioAgua

Aplicación web ligera e interactiva para registrar, planificar y consultar las fechas previstas de llegada del suministro de agua potable mediante un calendario mensual.

---

## Características

- **Visualización mensual en español:** Cuadrícula de calendario clara con semanas comenzando en día Lunes.
- **Interacción intuitiva:** Clic o uso de teclado (`Tab`, `Enter`, `Espacio`) para alternar días entre *Llegará agua* (💧) y *Sin programación*.
- **Diseño oscuro nativo:** Interfaz moderna con alto contraste, visualización adaptable a móviles y pantallas de escritorio.
- **Navegación temporal libre:** Avanza y retrocede entre meses y años manteniendo intactas las selecciones pendientes en memoria.
- **Persistencia local en el navegador:** Guarda las fechas seleccionadas en `localStorage` de forma atómica y versionada (`calendar_water_state_v1`).
- **Historial ilimitado:** Conserva indefinidamente las fechas de meses pasados y futuros sin políticas de eliminación automática.
- **Cero dependencias:** Construida exclusivamente con HTML5 semántico, CSS3 puro y JavaScript nativo (ES6+). Sin frameworks, bundlers, npm ni backend.

> [!NOTE]
> **Privacidad y Almacenamiento Local:**
> Todos los datos se guardan de forma exclusiva en el almacenamiento local (`localStorage`) del navegador en el dispositivo actual. La aplicación no utiliza servidores remotos, cuentas ni bases de datos en la nube, por lo que **los datos no se sincronizan entre diferentes dispositivos o navegadores**.

---

## Tecnologías Utilizadas

- **HTML5:** Marcado semántico y estructura accesible.
- **CSS3:** Variables CSS para el tema oscuro, CSS Grid responsivo y foco accesible (`:focus-visible`).
- **JavaScript nativo (ES6+):** Motor de cálculo de calendario, gestión de estado en memoria y persistencia defensiva.
- **Web Storage API (`localStorage`):** Almacenamiento local persistente en el cliente.

---

## Estructura del Proyecto

```text
CalendarioAgua/
├── index.html              # Estructura de la interfaz y marcado accesible
├── styles.css              # Tema oscuro responsivo y estilos de estados
├── app.js                  # Lógica del calendario, interacción y persistencia
├── docs/
│   ├── requirements.md     # Especificación de requisitos y criterios de aceptación
│   ├── architecture.md     # Arquitectura cliente, esquema JSON y ciclo de vida
│   ├── domain-model.md     # Modelo de dominio y reglas de negocio
│   ├── decision-log.md     # Registro cronológico de decisiones técnicas
│   └── project-state.md    # Estado del proyecto, verificaciones y fases
├── AGENTS.md               # Metodología y directrices para agentes IA
├── PROJECT-START-GUIDE.md  # Guía del estándar de desarrollo asistido
├── .gitignore              # Exclusión de archivos temporales y locales
└── README.md               # Documentación general del proyecto
```

---

## Ejecución Local

Dado que la aplicación consta únicamente de archivos estáticos, se puede ejecutar localmente con cualquier servidor HTTP sencillo:

### Con Python:
```bash
python3 -m http.server 8000
```
Luego, abre tu navegador en:
[http://localhost:8000](http://localhost:8000)

### O directamente:
Abre el archivo `index.html` en cualquier navegador web moderno.

---

## Uso del Calendario

1. **Seleccionar fechas:** Haz clic sobre los días del mes en los que está previsto que llegue el agua. Aparecerá el icono `💧` y el día se resaltará en azul.
2. **Navegar:** Usa los botones **Anterior** y **Siguiente** para moverte entre meses, o **Hoy** para regresar al mes actual. Tus selecciones permanecerán en memoria mientras navegas.
3. **Guardar cambios:** Cuando tengas selecciones o deselecciones pendientes, el botón **Guardar cambios** se habilitará y el indicador mostrará *"Cambios pendientes sin guardar"*. Haz clic en **Guardar cambios** para persistir el estado.
4. **Recuperación:** Al recargar la página (**F5**) o volver a abrir el navegador, tus fechas guardadas se recuperarán automáticamente.
