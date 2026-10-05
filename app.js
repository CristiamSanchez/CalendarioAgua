/**
 * Calendario de Agua - app.js
 * Fase 4: Verificación Funcional y Visual / Accesibilidad
 *
 * Implementación en JavaScript nativo puro (ES6+).
 * Sin frameworks, dependencias externas ni backend.
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. Constantes y Configuración de Persistencia
     ========================================================================== */

  const STORAGE_KEY = 'calendar_water_state_v1';
  const CURRENT_SCHEMA_VERSION = 1;

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  /* ==========================================================================
     2. Estado de la Aplicación en Memoria (AppState)
     ========================================================================== */

  const today = new Date();
  const state = {
    // Año y mes visibles actualmente (0 = Enero, 11 = Diciembre)
    viewYear: today.getFullYear(),
    viewMonth: today.getMonth(),

    // Fecha actual del sistema local para marcar "Hoy" (YYYY-MM-DD)
    todayKey: formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()),

    // Copia independiente del último estado persistido y validado
    persistedDates: new Set(),

    // Conjunto de fechas seleccionadas en memoria (área de trabajo activa)
    stagedDates: new Set(),

    // Flag que advierte si el almacenamiento contenía datos corruptos o de versión no compatible
    storageHasCorruptedData: false,

    // Flag que indica si el almacenamiento local está completamente inhabilitado
    storageAvailable: true
  };

  /* ==========================================================================
     3. Utilidades de Validación y Manejo de Fechas
     ========================================================================== */

  /**
   * Genera una clave canónica de fecha en formato "YYYY-MM-DD"
   * usando exclusivamente componentes locales.
   *
   * @param {number} year - Año de 4 dígitos (ej. 2026)
   * @param {number} monthIndex - Índice del mes (0 a 11)
   * @param {number} day - Día del mes (1 a 31)
   * @returns {string} Fecha en formato "YYYY-MM-DD"
   */
  function formatDateKey(year, monthIndex, day) {
    const y = String(year).padStart(4, '0');
    const m = String(monthIndex + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Valida estrictamente que una cadena cumpla el formato ISO YYYY-MM-DD
   * y corresponda a un día real del calendario gregoriano (ej. rechaza 2026-02-30).
   *
   * @param {unknown} dateStr - Cadena a validar
   * @returns {boolean} Verdadero si es una fecha real válida
   */
  function isValidDateString(dateStr) {
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return false;
    }

    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return false;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    // Verificar coincidencia exacta con el calendario local para evitar desbordes de días
    const testDate = new Date(year, month - 1, day);
    return (
      testDate.getFullYear() === year &&
      testDate.getMonth() === (month - 1) &&
      testDate.getDate() === day
    );
  }

  /**
   * Obtiene la cantidad de días de un mes específico (considera años bisiestos).
   *
   * @param {number} year - Año
   * @param {number} monthIndex - Índice del mes (0 a 11)
   * @returns {number} Días totales en el mes (28, 29, 30 o 31)
   */
  function getDaysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  /**
   * Obtiene el índice del día de la semana para el 1er día del mes,
   * donde Lunes = 0 y Domingo = 6.
   *
   * @param {number} year - Año
   * @param {number} monthIndex - Índice del mes (0 a 11)
   * @returns {number} Desplazamiento desde el lunes (0 a 6)
   */
  function getFirstDayOfWeekMonday(year, monthIndex) {
    const sundayBasedDay = new Date(year, monthIndex, 1).getDay();
    return (sundayBasedDay + 6) % 7;
  }

  /**
   * Compara dos conjuntos de fechas para determinar si existen cambios pendientes.
   * Evalúa contenido exacto elemento a elemento, no solo el tamaño.
   *
   * @param {Set<string>} stagedSet - Conjunto en memoria
   * @param {Set<string>} persistedSet - Conjunto persistido
   * @returns {boolean} Verdadero si stagedSet difiere de persistedSet
   */
  function computeIsDirty(stagedSet, persistedSet) {
    if (stagedSet.size !== persistedSet.size) {
      return true;
    }
    for (const date of stagedSet) {
      if (!persistedSet.has(date)) {
        return true;
      }
    }
    return false;
  }

  /* ==========================================================================
     4. Módulo de Persistencia (StorageManager)
     ========================================================================== */

  /**
   * Carga y valida defensivamente el estado almacenado en localStorage.
   * No sobrescribe ni borra automáticamente registros corruptos al iniciar.
   *
   * @returns {{ dates: Set<string>, warning: string|null, isCorrupted: boolean }}
   */
  function loadPersistedState() {
    let rawData = null;

    try {
      rawData = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      // Manejar navegadores con almacenamiento bloqueado (modo incógnito estricto / SecurityError)
      state.storageAvailable = false;
      return {
        dates: new Set(),
        warning: 'El almacenamiento local no está disponible en este navegador. Las selecciones funcionarán únicamente en memoria durante esta sesión.',
        isCorrupted: false
      };
    }

    // Si no hay datos previos, iniciar con estado vacío válido
    if (rawData === null || rawData === undefined) {
      return {
        dates: new Set(),
        warning: null,
        isCorrupted: false
      };
    }

    let parsed = null;
    try {
      parsed = JSON.parse(rawData);
    } catch (parseError) {
      // JSON corrupto / malformado
      return {
        dates: new Set(),
        warning: 'Aviso: Los datos guardados previamente contenían un formato JSON corrupto. Se inició con el calendario en memoria sin modificar los datos existentes.',
        isCorrupted: true
      };
    }

    // Validar tipo y estructura básica
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        dates: new Set(),
        warning: 'Aviso: La estructura de los datos almacenados es inválida. Se inició con el calendario en memoria sin sobrescribir el almacenamiento.',
        isCorrupted: true
      };
    }

    // Validar versión del esquema
    if (parsed.version !== CURRENT_SCHEMA_VERSION) {
      return {
        dates: new Set(),
        warning: `Aviso: La versión de datos encontrada (${parsed.version}) no es compatible con la versión actual (${CURRENT_SCHEMA_VERSION}). Se preservan los datos existentes sin sobrescribir.`,
        isCorrupted: true
      };
    }

    // Validar array de fechas
    if (!Array.isArray(parsed.waterDates)) {
      return {
        dates: new Set(),
        warning: 'Aviso: La lista de fechas guardadas no tiene un formato de lista válido. Se inició en memoria sin sobrescribir.',
        isCorrupted: true
      };
    }

    // Filtrar y normalizar fechas válidas y eliminar duplicados
    const validDates = new Set();
    let discardedCount = 0;

    for (const item of parsed.waterDates) {
      if (isValidDateString(item)) {
        validDates.add(item);
      } else {
        discardedCount++;
      }
    }

    let warningMessage = null;
    if (discardedCount > 0) {
      warningMessage = `Aviso: Se recuperaron ${validDates.size} fechas válidas y se descartaron ${discardedCount} entradas inválidas del registro.`;
    }

    return {
      dates: validDates,
      warning: warningMessage,
      isCorrupted: false
    };
  }

  /**
   * Guarda el estado completo de stagedDates en localStorage bajo el esquema versionado.
   * Solo actualiza persistedDates si setItem tiene éxito.
   *
   * @returns {boolean} Verdadero si el guardado fue exitoso
   */
  function saveState() {
    // Si los datos previos en storage estaban corruptos o en otra versión, solicitar confirmación
    if (state.storageHasCorruptedData) {
      const confirmOverwrite = window.confirm(
        'Los datos almacenados previamente estaban dañados o en una versión incompatible.\n\n' +
        '¿Deseas sobrescribir el registro con las fechas seleccionadas actualmente?'
      );
      if (!confirmOverwrite) {
        showStatus('Guardado cancelado. Tus selecciones siguen disponibles en memoria.', 'warning');
        return false;
      }
    }

    // Ordenar cronológicamente para consistencia determinista
    const sortedDates = Array.from(state.stagedDates).sort();

    const payload = {
      version: CURRENT_SCHEMA_VERSION,
      waterDates: sortedDates,
      updatedAt: new Date().toISOString()
    };

    try {
      const serialized = JSON.stringify(payload);
      localStorage.setItem(STORAGE_KEY, serialized);

      // Sincronizar estado persistido solamente tras éxito de setItem
      state.persistedDates = new Set(state.stagedDates);
      state.storageHasCorruptedData = false;

      const count = sortedDates.length;
      const countText = count === 1 ? '1 fecha registrada' : `${count} fechas registradas`;
      showStatus(`Cambios guardados correctamente (${countText}).`, 'success');

      updateFooterUI();
      return true;
    } catch (writeError) {
      // Si ocurre un error (QuotaExceededError, SecurityError, etc.), conservar stagedDates y dirty state
      showStatus(
        'Error al guardar: No se pudo escribir en el almacenamiento local (cuota excedida o almacenamiento inhabilitado). Tus cambios permanecen en memoria.',
        'error'
      );
      return false;
    }
  }

  /* ==========================================================================
     5. Elementos del DOM y Notificaciones
     ========================================================================== */

  const elements = {
    monthLabel: document.getElementById('current-month-label'),
    daysGrid: document.getElementById('calendar-days'),
    btnPrevMonth: document.getElementById('btn-prev-month'),
    btnNextMonth: document.getElementById('btn-next-month'),
    btnToday: document.getElementById('btn-today'),
    selectedCountBadge: document.getElementById('selected-count-badge'),
    dirtyStateBadge: document.getElementById('dirty-state-badge'),
    btnSaveChanges: document.getElementById('btn-save-changes'),
    statusMessage: document.getElementById('status-message')
  };

  /**
   * Muestra un mensaje accesible en el área de estado con aria-live.
   *
   * @param {string} text - Texto del mensaje
   * @param {'success'|'error'|'warning'} type - Tipo de notificación
   */
  function showStatus(text, type) {
    if (!elements.statusMessage) return;

    elements.statusMessage.textContent = text;
    elements.statusMessage.className = `status-message status-${type}`;
    elements.statusMessage.classList.remove('hidden');
  }

  /**
   * Limpia el mensaje de estado visible.
   */
  function clearStatus() {
    if (!elements.statusMessage) return;
    elements.statusMessage.textContent = '';
    elements.statusMessage.className = 'status-message hidden';
  }

  /* ==========================================================================
     6. Lógica de Interacción, Accesibilidad y Renderizado
     ========================================================================== */

  /**
   * Alterna la selección de una fecha en memoria viva (stagedDates).
   * Conserva el foco del teclado en el botón del día accionado tras el re-render.
   *
   * @param {string} dateKey - Fecha "YYYY-MM-DD"
   */
  function toggleDate(dateKey) {
    if (state.stagedDates.has(dateKey)) {
      state.stagedDates.delete(dateKey);
    } else {
      state.stagedDates.add(dateKey);
    }

    renderCalendar(dateKey);
  }

  /**
   * Avanza al mes siguiente.
   */
  function nextMonth() {
    if (state.viewMonth === 11) {
      state.viewMonth = 0;
      state.viewYear += 1;
    } else {
      state.viewMonth += 1;
    }
    renderCalendar();
  }

  /**
   * Retrocede al mes anterior.
   */
  function prevMonth() {
    if (state.viewMonth === 0) {
      state.viewMonth = 11;
      state.viewYear -= 1;
    } else {
      state.viewMonth -= 1;
    }
    renderCalendar();
  }

  /**
   * Regresa la vista al mes y año actual del sistema sin modificar selecciones.
   */
  function goToToday() {
    const now = new Date();
    state.viewYear = now.getFullYear();
    state.viewMonth = now.getMonth();
    renderCalendar();
  }

  /**
   * Actualiza los badges de conteo y dirty state y el estado del botón Guardar.
   */
  function updateFooterUI() {
    // 1. Conteo de fechas seleccionadas en memoria
    const count = state.stagedDates.size;
    const countText = count === 1 ? '1 fecha con agua' : `${count} fechas con agua`;
    elements.selectedCountBadge.textContent = countText;

    // 2. Cálculo de Dirty State
    const isDirty = computeIsDirty(state.stagedDates, state.persistedDates);

    if (isDirty) {
      elements.dirtyStateBadge.textContent = 'Cambios pendientes sin guardar';
      elements.dirtyStateBadge.className = 'badge badge-dirty';
      elements.btnSaveChanges.disabled = false;
    } else {
      elements.dirtyStateBadge.textContent = 'Sin cambios pendientes';
      elements.dirtyStateBadge.className = 'badge badge-clean';
      elements.btnSaveChanges.disabled = true;
    }
  }

  /**
   * Renderiza el encabezado del mes y la cuadrícula de celdas de días.
   *
   * @param {string} [focusTargetDateKey] - Clave de fecha opcional para restaurar el foco del teclado
   */
  function renderCalendar(focusTargetDateKey) {
    // 1. Actualizar título del mes y año
    const monthName = MONTH_NAMES[state.viewMonth];
    elements.monthLabel.textContent = `${monthName} ${state.viewYear}`;

    // 2. Limpiar cuadrícula
    elements.daysGrid.innerHTML = '';

    // 3. Obtener métricas del mes
    const daysInMonth = getDaysInMonth(state.viewYear, state.viewMonth);
    const startOffset = getFirstDayOfWeekMonday(state.viewYear, state.viewMonth);

    const fragment = document.createDocumentFragment();
    let buttonToFocus = null;

    // 4. Celdas vacías de alineación de inicio de semana
    for (let i = 0; i < startOffset; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'day-cell-empty';
      emptyCell.setAttribute('aria-hidden', 'true');
      fragment.appendChild(emptyCell);
    }

    // 5. Celdas de los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(state.viewYear, state.viewMonth, day);
      const isSelected = state.stagedDates.has(dateKey);
      const isToday = (dateKey === state.todayKey);

      const dayButton = document.createElement('button');
      dayButton.type = 'button';
      dayButton.className = 'day-cell';
      dayButton.dataset.date = dateKey;

      if (isSelected) {
        dayButton.classList.add('is-water-scheduled');
      }

      if (isToday) {
        dayButton.classList.add('is-today');
      }

      // Atributos de accesibilidad ARIA
      dayButton.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      const statusText = isSelected ? 'Llegará agua' : 'Sin programación';
      const todayText = isToday ? ', Día actual' : '';
      dayButton.setAttribute('aria-label', `${day} de ${monthName} de ${state.viewYear}, ${statusText}${todayText}`);

      // Contenido interno del botón
      const numberSpan = document.createElement('span');
      numberSpan.className = 'day-number';
      numberSpan.textContent = String(day);

      const indicatorSpan = document.createElement('span');
      indicatorSpan.className = 'day-indicator';
      indicatorSpan.setAttribute('aria-hidden', 'true');
      indicatorSpan.textContent = isSelected ? '💧' : '';

      dayButton.appendChild(numberSpan);
      dayButton.appendChild(indicatorSpan);

      // Evento de activación
      dayButton.addEventListener('click', function () {
        toggleDate(dateKey);
      });

      if (focusTargetDateKey && focusTargetDateKey === dateKey) {
        buttonToFocus = dayButton;
      }

      fragment.appendChild(dayButton);
    }

    elements.daysGrid.appendChild(fragment);

    // Restaurar el foco accesible si corresponde
    if (buttonToFocus && typeof buttonToFocus.focus === 'function') {
      buttonToFocus.focus();
    }

    // 6. Actualizar badges y botón Guardar
    updateFooterUI();
  }

  /* ==========================================================================
     7. Inicialización y Carga de Estado
     ========================================================================== */

  function init() {
    // 1. Cargar estado persistido desde localStorage
    const loaded = loadPersistedState();
    state.persistedDates = new Set(loaded.dates);
    state.stagedDates = new Set(loaded.dates); // Clonar conjunto independiente
    state.storageHasCorruptedData = loaded.isCorrupted;

    // 2. Asociar listeners de eventos
    elements.btnPrevMonth.addEventListener('click', prevMonth);
    elements.btnNextMonth.addEventListener('click', nextMonth);
    elements.btnToday.addEventListener('click', goToToday);
    elements.btnSaveChanges.addEventListener('click', saveState);

    // 3. Renderizar vista inicial
    renderCalendar();

    // 4. Mostrar aviso si hubo alguna advertencia durante la carga inicial
    if (loaded.warning) {
      showStatus(loaded.warning, loaded.isCorrupted ? 'error' : 'warning');
    }
  }

  // Ejecutar inicialización al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
