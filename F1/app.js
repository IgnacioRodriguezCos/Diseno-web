/* ============================================================
   STATE
   ============================================================ */
let map            = null;
let waypoints      = [];   // [{lat, lng, marker}]
let mainPoly       = null;
let closePoly      = null;
let sfLine         = null; // línea de largada/llegada (perpendicular)
let flowPoly       = null; // capa animada para visualizar sentido
let flowArrows     = [];   // marcadores flecha animados
let flowAnimFrame  = null; // requestAnimationFrame id
let segmentHitPolys = [];  // líneas invisibles para insertar puntos en tramos
let angleThreshold = 15;   // grados mínimos para contar una curva
let showFlowArrows = true; // visualización de flechas animadas
let flowArrowSpeed = 230;  // velocidad de flechas (max 300)
let flowArrowCount = 0;    // cantidad deseada de flechas (max = puntos)
let currentLang = 'es';
let layerControl = null;
let darkLayer = null;
let satelliteLayer = null;
let streetsLayer = null;

/* ============================================================
   UTILIDAD: selector por id
   ============================================================ */
const $ = id => document.getElementById(id);

const I18N = {
  es: {
    title: 'Circuit Creator',
    searchPlaceholder: 'Buscar ciudad, país, circuito…',
    clear: 'Limpiar',
    circuitOn: '● Circuito activo',
    circuitOff: '● Sin circuito',
    secStats: '📊 Estadísticas',
    lblDist: 'Distancia total',
    lblCurves: 'Cantidad de curvas',
    lblPoints: 'Puntos trazados',
    lblStart: 'Punto de largada',
    secDirection: '🔄 Sentido de recorrido',
    dirUndefined: 'Sin definir',
    dirNeed3: 'Agregá al menos 3 puntos',
    dirClockwise: 'Horario',
    dirCounter: 'Antihorario',
    dirClockwiseSub: 'Horario',
    dirCounterSub: 'Antihorario',
    btnFlip: '⇄ Invertir sentido',
    arrowsOn: '➤ Flechas: ON',
    arrowsOff: '➤ Flechas: OFF',
    lblArrowSpeed: 'Velocidad de flechas',
    lblArrowCount: 'Cantidad de flechas',
    secCurves: '⚙️ Sensibilidad de curvas',
    lblAngle: 'Ángulo mínimo para considerar una curva:',
    chip8: 'Muy sensible',
    chip15: 'Normal',
    chip25: 'Chicanas',
    chip40: 'Solo horquillas',
    secPoints: '📍 Puntos del circuito',
    lblPointHelp: 'Hacé clic en un punto para establecerlo como largada',
    wptEmpty: 'Hacé clic en el mapa para comenzar',
    startBadge: 'LARGADA',
    secControls: '🎮 Controles',
    btnUndo: '↩ Deshacer último punto',
    btnClear: '✕ Limpiar todo',
    secShare: '🔗 Compartir circuito',
    seedPlaceholder: 'Pegá una semilla para cargar un circuito',
    btnSeedGenerate: 'Generar semilla',
    btnSeedCopy: 'Copiar',
    btnSeedLoad: 'Cargar semilla',
    secInstructions: 'ℹ️ Instrucciones',
    insMapStrong: 'Clic en el mapa',
    insMapText: '→ Agregar punto al circuito',
    insDragStrong: 'Clic y arrastrar en marcador',
    insDragText: '→ Mover punto',
    insDblStrong: 'Doble clic en marcador',
    insDblText: '→ Establecer como largada',
    insFlipStrong: 'Invertir sentido',
    insFlipText: '→ Cambiar dirección de marcha',
    insClose: 'El circuito se cierra automáticamente con 3+ puntos',
    startNotDefined: 'No definido',
    startPointFmt: 'Pto 1 · {lat}, {lng}',
    pointLabel: 'Punto {n}',
    startTooltip: '🏁 Largada / Llegada',
    seedGenerated: 'Semilla generada.',
    seedNoValue: 'No hay semilla para copiar.',
    seedCopiedClipboard: 'Semilla copiada al portapapeles.',
    seedCopied: 'Semilla copiada.',
    seedPasteFirst: 'Pegá una semilla primero.',
    seedLoaded: 'Circuito cargado ({n} puntos).',
    seedInvalid: 'Semilla inválida: {msg}',
    seedBadFormat: 'Formato no reconocido',
    seedBadStructure: 'Estructura inválida',
    seedBadPoint: 'Punto {n} inválido',
    seedBadCoord: 'Coordenadas inválidas en punto {n}',
    seedOutRange: 'Coordenadas fuera de rango en punto {n}',
    searchNoResults: 'Sin resultados para esa búsqueda',
    searchSearching: 'Buscando…',
    searchError: 'Error al buscar. Revisá tu conexión.',
    layerDark: 'Oscuro',
    layerSat: 'Satelital',
    layerStreets: 'Calles (OSM)',
    langButton: 'EN',
  },
  en: {
    title: 'Circuit Creator',
    searchPlaceholder: 'Search city, country, circuit…',
    clear: 'Clear',
    circuitOn: '● Active circuit',
    circuitOff: '● No circuit',
    secStats: '📊 Stats',
    lblDist: 'Total distance',
    lblCurves: 'Curve count',
    lblPoints: 'Plotted points',
    lblStart: 'Start point',
    secDirection: '🔄 Track direction',
    dirUndefined: 'Undefined',
    dirNeed3: 'Add at least 3 points',
    dirClockwise: 'Clockwise',
    dirCounter: 'Counter-clockwise',
    dirClockwiseSub: 'Clockwise',
    dirCounterSub: 'Counter-clockwise',
    btnFlip: '⇄ Reverse direction',
    arrowsOn: '➤ Arrows: ON',
    arrowsOff: '➤ Arrows: OFF',
    lblArrowSpeed: 'Arrow speed',
    lblArrowCount: 'Arrow count',
    secCurves: '⚙️ Curve sensitivity',
    lblAngle: 'Minimum angle to count as a curve:',
    chip8: 'Very sensitive',
    chip15: 'Normal',
    chip25: 'Chicanes',
    chip40: 'Hairpins only',
    secPoints: '📍 Circuit points',
    lblPointHelp: 'Double-click a point to set it as start',
    wptEmpty: 'Click on the map to start',
    startBadge: 'START',
    secControls: '🎮 Controls',
    btnUndo: '↩ Undo last point',
    btnClear: '✕ Clear all',
    secShare: '🔗 Share circuit',
    seedPlaceholder: 'Paste a seed to load a circuit',
    btnSeedGenerate: 'Generate seed',
    btnSeedCopy: 'Copy',
    btnSeedLoad: 'Load seed',
    secInstructions: 'ℹ️ Instructions',
    insMapStrong: 'Map click',
    insMapText: '→ Add a point to the circuit',
    insDragStrong: 'Click and drag marker',
    insDragText: '→ Move point',
    insDblStrong: 'Double click marker',
    insDblText: '→ Set as start point',
    insFlipStrong: 'Reverse direction',
    insFlipText: '→ Change driving direction',
    insClose: 'The circuit closes automatically with 3+ points',
    startNotDefined: 'Not defined',
    startPointFmt: 'P1 · {lat}, {lng}',
    pointLabel: 'Point {n}',
    startTooltip: '🏁 Start / Finish',
    seedGenerated: 'Seed generated.',
    seedNoValue: 'No seed to copy.',
    seedCopiedClipboard: 'Seed copied to clipboard.',
    seedCopied: 'Seed copied.',
    seedPasteFirst: 'Paste a seed first.',
    seedLoaded: 'Circuit loaded ({n} points).',
    seedInvalid: 'Invalid seed: {msg}',
    seedBadFormat: 'Unrecognized format',
    seedBadStructure: 'Invalid structure',
    seedBadPoint: 'Invalid point {n}',
    seedBadCoord: 'Invalid coordinates at point {n}',
    seedOutRange: 'Out-of-range coordinates at point {n}',
    searchNoResults: 'No results for this search',
    searchSearching: 'Searching…',
    searchError: 'Search error. Check your connection.',
    layerDark: 'Dark',
    layerSat: 'Satellite',
    layerStreets: 'Streets (OSM)',
    langButton: 'ES',
  },
};

function t(key, vars = null) {
  const dict = I18N[currentLang] || I18N.es;
  let str = dict[key] ?? I18N.es[key] ?? key;
  if (vars) {
    Object.keys(vars).forEach(k => {
      str = str.replaceAll(`{${k}}`, String(vars[k]));
    });
  }
  return str;
}

function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.title = t('title');
  $('app-title').textContent = t('title');
  $('search-input').placeholder = t('searchPlaceholder');
  $('search-clear').setAttribute('aria-label', t('clear'));
  $('sec-stats-title').textContent = t('secStats');
  $('lbl-dist').textContent = t('lblDist');
  $('lbl-curves').textContent = t('lblCurves');
  $('lbl-points').textContent = t('lblPoints');
  $('lbl-start').textContent = t('lblStart');
  $('sec-direction-title').textContent = t('secDirection');
  $('sec-curves-title').textContent = t('secCurves');
  $('lbl-angle-threshold').textContent = t('lblAngle');
  $('chip-8').textContent = t('chip8');
  $('chip-15').textContent = t('chip15');
  $('chip-25').textContent = t('chip25');
  $('chip-40').textContent = t('chip40');
  $('sec-points-title').textContent = t('secPoints');
  $('lbl-point-help').textContent = t('lblPointHelp');
  $('sec-controls-title').textContent = t('secControls');
  $('sec-share-title').textContent = t('secShare');
  $('seed-input').placeholder = t('seedPlaceholder');
  $('btn-seed-generate').textContent = t('btnSeedGenerate');
  $('btn-seed-copy').textContent = t('btnSeedCopy');
  $('btn-seed-load').textContent = t('btnSeedLoad');
  $('sec-instructions-title').textContent = t('secInstructions');
  $('ins-map-click-strong').textContent = t('insMapStrong');
  $('ins-map-click-text').textContent = t('insMapText');
  $('ins-drag-strong').textContent = t('insDragStrong');
  $('ins-drag-text').textContent = t('insDragText');
  $('ins-dbl-strong').textContent = t('insDblStrong');
  $('ins-dbl-text').textContent = t('insDblText');
  $('ins-flip-strong').textContent = t('insFlipStrong');
  $('ins-flip-text').textContent = t('insFlipText');
  $('ins-close-text').textContent = t('insClose');
  $('lbl-arrow-speed').textContent = t('lblArrowSpeed');
  $('lbl-arrow-count').textContent = t('lblArrowCount');
  $('btn-flip').textContent = t('btnFlip');
  $('btn-undo').textContent = t('btnUndo');
  $('btn-clear').textContent = t('btnClear');
  $('btn-lang').textContent = t('langButton');
  renderLayerControl();
  updateArrowsToggleUI();
  updateUI();
}

function renderLayerControl() {
  if (!map || !darkLayer || !satelliteLayer || !streetsLayer) return;
  if (layerControl) map.removeControl(layerControl);
  layerControl = L.control.layers(
    { [t('layerDark')]: darkLayer, [t('layerSat')]: satelliteLayer, [t('layerStreets')]: streetsLayer },
    {},
    { position: 'topright', collapsed: true }
  );
  layerControl.addTo(map);
}

function enableMiddleMousePan(mapInstance) {
  const container = mapInstance.getContainer();
  let isPanning = false;
  let lastX = 0;
  let lastY = 0;

  const stopPan = () => {
    isPanning = false;
    container.style.cursor = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('blur', stopPan);
  };

  const onMouseMove = e => {
    if (!isPanning) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    mapInstance.panBy([-dx, -dy], { animate: false });
    e.preventDefault();
  };

  const onMouseUp = e => {
    if (!isPanning) return;
    if (e.button !== 1 && e.buttons !== 0) return;
    stopPan();
  };

  container.addEventListener('mousedown', e => {
    if (e.button !== 1) return; // solo click medio
    if (e.target.closest('.leaflet-control')) return;
    isPanning = true;
    lastX = e.clientX;
    lastY = e.clientY;
    container.style.cursor = 'grabbing';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', stopPan);
    e.preventDefault();
  });

  // Evita autoscroll del navegador al clickear la rueda.
  container.addEventListener('auxclick', e => {
    if (e.button === 1) e.preventDefault();
  });
}

/* ============================================================
   INICIALIZACIÓN DEL MAPA (Leaflet + OpenStreetMap / CartoDB)
   ============================================================ */
function initMap() {
  map = L.map('map', {
    center: [-34.6037, -58.3816], // Buenos Aires
    zoom: 13,
    doubleClickZoom: false,
    zoomControl: true,
  });

  darkLayer = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }
  );

  satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
    }
  ).addTo(map);

  streetsLayer = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }
  );

  renderLayerControl();

  // Desactiva paneo con click izquierdo y habilita paneo solo con rueda.
  map.dragging.disable();
  enableMiddleMousePan(map);

  // ── Alta de puntos (con zona de seguridad alrededor de marcadores) ─
  // Si el click cae cerca de un punto existente, no agrega uno nuevo.
  // Esto evita altas accidentales cuando se intenta seleccionar/arrastrar.
  const ADD_GUARD_PX = 18;

  map.on('click', e => {
    const clickPt = e.containerPoint;
    const clickedNearExisting = waypoints.some(w => {
      const pt = map.latLngToContainerPoint([w.lat, w.lng]);
      return pt.distanceTo(clickPt) <= ADD_GUARD_PX;
    });
    if (clickedNearExisting) return;

    addWaypoint(e.latlng.lat, e.latlng.lng);
  });
}

// Inicializar inmediatamente (Leaflet no necesita API key)
initMap();

/* ============================================================
   GESTIÓN DE WAYPOINTS
   ============================================================ */
function addWaypoint(lat, lng) {
  const idx     = waypoints.length;
  const isStart = idx === 0;
  const marker  = makeMarker(lat, lng, idx, isStart);

  waypoints.push({ lat, lng, marker });
  render();
}

function insertWaypointAt(index, lat, lng) {
  const safeIndex = Math.max(0, Math.min(index, waypoints.length));
  const marker = makeMarker(lat, lng, safeIndex, safeIndex === 0);
  waypoints.splice(safeIndex, 0, { lat, lng, marker });
  render();
}

function circleStyle(isStart) {
  return {
    radius: isStart ? 11 : 7,
    color: isStart ? '#ffd700' : '#e10600',
    weight: isStart ? 3 : 2,
    opacity: 1,
    fillColor: isStart ? '#ffd700' : '#e10600',
    fillOpacity: 0.95,
    bubblingMouseEvents: false,
  };
}

function makeMarker(lat, lng, idx, isStart) {
  const marker = L.circleMarker([lat, lng], circleStyle(isStart)).addTo(map);

  marker.bindTooltip(
    isStart ? t('startTooltip') : t('pointLabel', { n: idx + 1 }),
    { direction: 'top', offset: [0, -8] }
  );

  // Doble clic sobre un punto => convertirlo en largada.
  marker.on('dblclick', e => {
    if (e && e.originalEvent) e.originalEvent.stopPropagation();
    const i = waypoints.findIndex(w => w.marker === marker);
    if (i > 0) setStart(i);
  });

  // Click derecho sobre un punto => eliminarlo.
  marker.on('contextmenu', e => {
    if (e && e.originalEvent) {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
    }
    const i = waypoints.findIndex(w => w.marker === marker);
    if (i < 0) return;
    waypoints[i].marker.remove();
    waypoints.splice(i, 1);
    render();
  });

  // ── Drag y click sobre el marcador ───────────────────────
  marker.on('mousedown', e => {
    e.originalEvent.stopPropagation(); // evitar que Leaflet panee

    const startPx  = map.latLngToContainerPoint(marker.getLatLng());
    let wasDragged = false;

    const onMove = ev => {
      const curPx = map.mouseEventToContainerPoint(ev);
      if (!wasDragged && startPx.distanceTo(curPx) < 5) return;
      wasDragged = true;
      map.getContainer().style.cursor = 'grabbing';
      const latlng = map.mouseEventToLatLng(ev);
      const i = waypoints.findIndex(w => w.marker === marker);
      if (i < 0) return;
      marker.setLatLng(latlng);
      waypoints[i].lat = latlng.lat;
      waypoints[i].lng = latlng.lng;
      redrawPolylines();
      updateUI();
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      map.getContainer().style.cursor = '';
      // Clic simple: no cambia largada (ahora se usa doble clic).
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  return marker;
}

function refreshMarkers() {
  waypoints.forEach((w, i) => {
    const iS = i === 0;
    w.marker.setStyle(circleStyle(iS));
    w.marker.setRadius(iS ? 11 : 7);
    w.marker.setTooltipContent(iS ? t('startTooltip') : t('pointLabel', { n: i + 1 }));
    // Prioridad de interacción: los marcadores siempre por encima de líneas.
    w.marker.bringToFront();
  });
}

/* ============================================================
   ESTABLECER PUNTO DE LARGADA
   Rota el array para que el punto elegido quede en el índice 0
   ============================================================ */
function setStart(idx) {
  if (idx <= 0 || idx >= waypoints.length) return;

  const rotated = [
    ...waypoints.slice(idx),
    ...waypoints.slice(0, idx),
  ];

  // Eliminar marcadores actuales del mapa
  waypoints.forEach(w => w.marker.remove());

  // Recrear marcadores en el nuevo orden (los handlers los registra makeMarker)
  waypoints = rotated.map((w, i) => {
    const marker = makeMarker(w.lat, w.lng, i, i === 0);
    return { lat: w.lat, lng: w.lng, marker };
  });

  render();
}

/* ============================================================
   INVERTIR SENTIDO
   Mantiene el índice 0 (largada) y revierte el resto
   ============================================================ */
$('btn-flip').addEventListener('click', flipDirection);
$('btn-toggle-arrows').addEventListener('click', () => {
  showFlowArrows = !showFlowArrows;
  updateArrowsToggleUI();
  if (!showFlowArrows) {
    stopFlowArrows();
  } else {
    redrawPolylines();
  }
});

$('btn-lang').addEventListener('click', () => {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  applyTranslations();
});

$('arrow-speed').addEventListener('input', e => {
  const v = parseInt(e.target.value, 10);
  flowArrowSpeed = Math.max(20, Math.min(300, Number.isFinite(v) ? v : 230));
  updateArrowControlsUI();
  if (showFlowArrows && waypoints.length >= 3) redrawPolylines();
});

$('arrow-count').addEventListener('input', e => {
  const v = parseInt(e.target.value, 10);
  const pointCap = Math.max(0, waypoints.length);
  flowArrowCount = Math.max(0, Math.min(pointCap, Number.isFinite(v) ? v : 0));
  updateArrowControlsUI();
  if (showFlowArrows && waypoints.length >= 3) redrawPolylines();
});

$('btn-seed-generate').addEventListener('click', () => {
  const seed = generateCircuitSeed();
  $('seed-input').value = seed;
  setSeedStatus(t('seedGenerated'), false);
});

$('btn-seed-copy').addEventListener('click', async () => {
  const input = $('seed-input');
  const value = input.value.trim();
  if (!value) {
    setSeedStatus(t('seedNoValue'), true);
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    setSeedStatus(t('seedCopiedClipboard'), false);
  } catch (_) {
    input.select();
    document.execCommand('copy');
    setSeedStatus(t('seedCopied'), false);
  }
});

$('btn-seed-load').addEventListener('click', () => {
  const seed = $('seed-input').value.trim();
  if (!seed) {
    setSeedStatus(t('seedPasteFirst'), true);
    return;
  }
  try {
    const data = decodeCircuitSeed(seed);
    applySeedPoints(data.points, data.settings);
    setSeedStatus(t('seedLoaded', { n: data.points.length }), false);
  } catch (err) {
    setSeedStatus(t('seedInvalid', { msg: err.message }), true);
  }
});

function flipDirection() {
  if (waypoints.length < 2) return;

  const [first, ...rest] = waypoints;
  const reordered = [first, ...rest.reverse()];

  waypoints.forEach(w => w.marker.remove());

  // Recrear marcadores en el nuevo orden (los handlers los registra makeMarker)
  waypoints = reordered.map((w, i) => {
    const marker = makeMarker(w.lat, w.lng, i, i === 0);
    return { lat: w.lat, lng: w.lng, marker };
  });

  render();
}

/* ============================================================
   DESHACER / LIMPIAR
   ============================================================ */
$('btn-undo').addEventListener('click', () => {
  if (!waypoints.length) return;
  waypoints.pop().marker.remove();
  render();
});

$('btn-clear').addEventListener('click', () => {
  waypoints.forEach(w => w.marker.remove());
  waypoints = [];
  clearOverlays();
  updateUI();
});

function clearOverlays() {
  [mainPoly, closePoly, sfLine, flowPoly].forEach(o => { if (o) o.remove(); });
  stopFlowArrows();
  segmentHitPolys.forEach(o => { if (o) o.remove(); });
  segmentHitPolys = [];
  mainPoly = closePoly = sfLine = flowPoly = null;
}

/* ============================================================
   RENDERIZADO (polilíneas + línea de largada)
   ============================================================ */

/**
 * Render completo: polilíneas + marcadores + UI.
 * Usar al agregar/quitar/reordenar puntos.
 */
function render() {
  redrawPolylines();
  refreshMarkers();
  updateUI();
}

/**
 * Solo redibuja polilíneas y línea de largada, SIN tocar marcadores.
 * Se llama en tiempo real durante el drag.
 */
function redrawPolylines() {
  [mainPoly, closePoly, sfLine, flowPoly].forEach(o => { if (o) o.remove(); });
  stopFlowArrows();
  segmentHitPolys.forEach(o => { if (o) o.remove(); });
  segmentHitPolys = [];
  mainPoly = closePoly = sfLine = flowPoly = null;

  const n = waypoints.length;
  if (n < 2) return;

  const path = waypoints.map(w => [w.lat, w.lng]);

  // Trazado principal
  mainPoly = L.polyline(path, {
    color: '#e10600', opacity: 0.95, weight: 4,
    interactive: false,
    bubblingMouseEvents: false,
  }).addTo(map);

  // Segmento de cierre (último punto → primer punto)
  const closed = n >= 3;
  closePoly = L.polyline(
    [[waypoints[n - 1].lat, waypoints[n - 1].lng], [waypoints[0].lat, waypoints[0].lng]],
    {
      color:     closed ? '#e10600' : '#666666',
      opacity:   closed ? 0.9 : 0.5,
      weight:    closed ? 4 : 2,
      dashArray: !closed ? '8, 10' : null,
      interactive: false,
      bubblingMouseEvents: false,
    }
  ).addTo(map);

  // Capa animada para visualizar el sentido del recorrido.
  // Se dibuja solo cuando el circuito está cerrado.
  if (closed) {
    const dir = circuitDirection(); // 'cw' | 'ccw'
    const flowClass = `track-flow ${dir === 'ccw' ? 'flow-ccw' : 'flow-cw'}`;
    const closedPath = [...path, path[0]];
    flowPoly = L.polyline(closedPath, {
      color: '#ffffff',
      opacity: 0.9,
      weight: 3,
      className: flowClass,
      interactive: false,
      bubblingMouseEvents: false,
    }).addTo(map);

    if (showFlowArrows) {
      const closedPathObjs = [...waypoints.map(w => ({ lat: w.lat, lng: w.lng })), { lat: waypoints[0].lat, lng: waypoints[0].lng }];
      startFlowArrows(closedPathObjs);
    }
  }

  // Zonas clicables invisibles por segmento para insertar puntos "entre dos".
  for (let i = 0; i < n - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const hit = L.polyline([[a.lat, a.lng], [b.lat, b.lng]], {
      color: '#000000',
      opacity: 0,
      weight: 22,
      interactive: true,
      bubblingMouseEvents: false,
    }).addTo(map);
    hit.on('click', e => {
      if (e && e.originalEvent) e.originalEvent.stopPropagation();
      insertWaypointAt(i + 1, e.latlng.lat, e.latlng.lng);
    });
    hit.on('contextmenu', e => {
      if (e && e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
    });
    segmentHitPolys.push(hit);
  }

  // Segmento de cierre: insertar al final para mantener la largada en índice 0.
  if (n >= 3) {
    const a = waypoints[n - 1];
    const b = waypoints[0];
    const hitClose = L.polyline([[a.lat, a.lng], [b.lat, b.lng]], {
      color: '#000000',
      opacity: 0,
      weight: 22,
      interactive: true,
      bubblingMouseEvents: false,
    }).addTo(map);
    hitClose.on('click', e => {
      if (e && e.originalEvent) e.originalEvent.stopPropagation();
      insertWaypointAt(waypoints.length, e.latlng.lat, e.latlng.lng);
    });
    hitClose.on('contextmenu', e => {
      if (e && e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
    });
    segmentHitPolys.push(hitClose);
  }

  // Línea de largada/llegada (barra blanca perpendicular al trazado)
  drawSFLine();
}

function drawSFLine() {
  const start    = waypoints[0];
  const approach = waypoints[waypoints.length - 1]; // último punto se acerca a la largada
  const hdg      = bearing(approach, start);
  const perp     = (hdg + 90) % 360;

  const p1 = computeOffset(start, 18, perp);
  const p2 = computeOffset(start, 18, (perp + 180) % 360);

  sfLine = L.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], {
    color: '#ffffff', opacity: 1, weight: 5,
    interactive: false,
    bubblingMouseEvents: false,
  }).addTo(map);

  // Tras redibujar líneas, aseguramos marcadores arriba para drag/contextmenu.
  waypoints.forEach(w => w.marker.bringToFront());
}

function stopFlowArrows() {
  if (flowAnimFrame !== null) {
    cancelAnimationFrame(flowAnimFrame);
    flowAnimFrame = null;
  }
  flowArrows.forEach(a => { if (a.marker) a.marker.remove(); });
  flowArrows = [];
}

function startFlowArrows(path) {
  stopFlowArrows();
  if (!map || !path || path.length < 2) return;

  const totalLen = polylineLengthMeters(path);
  if (!isFinite(totalLen) || totalLen <= 1) return;

  const pointCount = Math.max(0, path.length - 1); // path cerrado: último = primero
  const arrowCount = Math.max(0, Math.min(flowArrowCount, pointCount));
  if (arrowCount === 0) return;
  const speedMps = Math.max(20, Math.min(300, flowArrowSpeed));

  const icon = L.divIcon({
    className: 'flow-arrow-icon',
    html: '<div class="flow-arrow-inner"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  for (let i = 0; i < arrowCount; i++) {
    const marker = L.marker([path[0].lat, path[0].lng], {
      icon,
      interactive: false,
      keyboard: false,
      zIndexOffset: 2000,
    }).addTo(map);
    flowArrows.push({ marker, phase: i / arrowCount });
  }

  let lastTs = null;
  let offset = 0;

  const animate = ts => {
    if (lastTs == null) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    offset = (offset + speedMps * dt) % totalLen;

    flowArrows.forEach(a => {
      const dist = (offset + a.phase * totalLen) % totalLen;
      const pos = pointAtDistance(path, dist);
      if (!pos) return;
      a.marker.setLatLng([pos.lat, pos.lng]);
      const el = a.marker.getElement();
      if (!el) return;
      const inner = el.querySelector('.flow-arrow-inner');
      if (inner) inner.style.transform = `rotate(${pos.heading}deg)`;
    });

    flowAnimFrame = requestAnimationFrame(animate);
  };

  flowAnimFrame = requestAnimationFrame(animate);
}

function polylineLengthMeters(path) {
  let d = 0;
  for (let i = 0; i < path.length - 1; i++) {
    d += haversine(path[i], path[i + 1]);
  }
  return d;
}

function pointAtDistance(path, distanceM) {
  if (!path || path.length < 2) return null;

  let remaining = distanceM;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const segLen = haversine(a, b);
    if (segLen <= 0) continue;

    if (remaining <= segLen) {
      const t = remaining / segLen;
      return {
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t,
        heading: bearing(a, b),
      };
    }
    remaining -= segLen;
  }

  const prev = path[path.length - 2];
  const last = path[path.length - 1];
  return { lat: last.lat, lng: last.lng, heading: bearing(prev, last) };
}

function updateArrowsToggleUI() {
  const btn = $('btn-toggle-arrows');
  if (!btn) return;
  btn.textContent = showFlowArrows ? t('arrowsOn') : t('arrowsOff');
}

function updateArrowControlsUI() {
  const speedInput = $('arrow-speed');
  const speedVal = $('arrow-speed-val');
  const countInput = $('arrow-count');
  const countVal = $('arrow-count-val');
  if (!speedInput || !speedVal || !countInput || !countVal) return;

  flowArrowSpeed = Math.max(20, Math.min(300, flowArrowSpeed));
  speedInput.max = '300';
  speedInput.value = String(flowArrowSpeed);
  speedVal.textContent = String(flowArrowSpeed);

  const pointCap = Math.max(0, waypoints.length);
  flowArrowCount = Math.max(0, Math.min(pointCap, flowArrowCount));
  countInput.min = '0';
  countInput.max = String(pointCap);
  countInput.value = String(flowArrowCount);
  countVal.textContent = `${flowArrowCount} / ${pointCap}`;
}

function setSeedStatus(msg, isError) {
  const el = $('seed-status');
  if (!el) return;
  el.textContent = msg || '';
  el.style.color = isError ? '#ff8a80' : 'var(--muted)';
}

function generateCircuitSeed() {
  const dir = circuitDirection(); // cw | ccw | null
  const payload = {
    v: 2,
    points: waypoints.map(w => [
      Number(w.lat.toFixed(6)),
      Number(w.lng.toFixed(6)),
    ]),
    arrows: {
      speed: flowArrowSpeed,
      count: flowArrowCount,
    },
    dir: dir || null,
  };
  const json = JSON.stringify(payload);
  return b64UrlEncode(json);
}

function decodeCircuitSeed(seed) {
  let parsed;
  try {
    parsed = JSON.parse(b64UrlDecode(seed));
  } catch (_) {
    throw new Error(t('seedBadFormat'));
  }

  if (!parsed || !Array.isArray(parsed.points) || (parsed.v !== 1 && parsed.v !== 2)) {
    throw new Error(t('seedBadStructure'));
  }

  const points = parsed.points.map((p, idx) => {
    if (!Array.isArray(p) || p.length !== 2) {
      throw new Error(t('seedBadPoint', { n: idx + 1 }));
    }
    const lat = Number(p[0]);
    const lng = Number(p[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error(t('seedBadCoord', { n: idx + 1 }));
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error(t('seedOutRange', { n: idx + 1 }));
    }
    return { lat, lng };
  });

  const settings = {
    speed: flowArrowSpeed,
    count: flowArrowCount,
    dir: null,
  };

  // Retrocompatible: v1 no traía configuraciones extras.
  if (parsed.v === 2) {
    const speed = Number(parsed?.arrows?.speed);
    const count = Number(parsed?.arrows?.count);
    const dir = parsed?.dir;

    if (Number.isFinite(speed)) settings.speed = Math.max(20, Math.min(300, Math.round(speed)));
    if (Number.isFinite(count)) settings.count = Math.max(0, Math.round(count));
    if (dir === 'cw' || dir === 'ccw') settings.dir = dir;
  }

  return { points, settings };
}

function applySeedPoints(points, settings = null) {
  waypoints.forEach(w => w.marker.remove());
  waypoints = [];
  clearOverlays();

  const applied = points.map(p => ({ lat: p.lat, lng: p.lng }));

  // Si la semilla define un sentido explícito y no coincide, invertimos
  // manteniendo el punto inicial (índice 0) como largada.
  if (settings && settings.dir && applied.length >= 3) {
    const currentDir = directionFromPoints(applied);
    if (currentDir && currentDir !== settings.dir) {
      const [first, ...rest] = applied;
      const reordered = [first, ...rest.reverse()];
      applied.length = 0;
      reordered.forEach(p => applied.push(p));
    }
  }

  if (settings) {
    flowArrowSpeed = Math.max(20, Math.min(300, Number(settings.speed) || flowArrowSpeed));
    const pointCap = Math.max(0, applied.length);
    flowArrowCount = Math.max(0, Math.min(pointCap, Number(settings.count)));
    if (!Number.isFinite(flowArrowCount)) flowArrowCount = 0;
  }

  applied.forEach((p, i) => {
    const marker = makeMarker(p.lat, p.lng, i, i === 0);
    waypoints.push({ lat: p.lat, lng: p.lng, marker });
  });

  render();

  if (!applied.length) return;
  if (applied.length === 1) {
    map.flyTo([applied[0].lat, applied[0].lng], Math.max(map.getZoom(), 15), { duration: 0.7 });
    return;
  }
  const bounds = L.latLngBounds(applied.map(p => [p.lat, p.lng]));
  map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
}

function directionFromPoints(points) {
  const n = points.length;
  if (n < 3) return null;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const c = points[i];
    const nx = points[(i + 1) % n];
    area += c.lng * nx.lat - nx.lng * c.lat;
  }
  return area > 0 ? 'ccw' : 'cw';
}

function b64UrlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64UrlDecode(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* ============================================================
   GEOMETRÍA PROPIA (reemplaza a Google Maps Geometry Library)
   ============================================================ */

/**
 * Distancia geodésica entre dos puntos (fórmula de Haversine).
 * @param {{lat: number, lng: number}} from
 * @param {{lat: number, lng: number}} to
 * @returns {number} Distancia en metros
 */
function haversine(from, to) {
  const R  = 6371000; // radio terrestre en metros
  const φ1 = from.lat * Math.PI / 180;
  const φ2 = to.lat   * Math.PI / 180;
  const Δφ = (to.lat - from.lat) * Math.PI / 180;
  const Δλ = (to.lng - from.lng) * Math.PI / 180;
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Punto destino dado un origen, distancia y rumbo.
 * @param {{lat: number, lng: number}} from
 * @param {number} distanceM  - Distancia en metros
 * @param {number} bearingDeg - Rumbo en grados [0, 360)
 * @returns {{lat: number, lng: number}}
 */
function computeOffset(from, distanceM, bearingDeg) {
  const R  = 6371000;
  const δ  = distanceM / R;
  const θ  = bearingDeg * Math.PI / 180;
  const φ1 = from.lat * Math.PI / 180;
  const λ1 = from.lng * Math.PI / 180;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: φ2 * 180 / Math.PI, lng: λ2 * 180 / Math.PI };
}

/**
 * Rumbo geodésico (azimut) entre dos puntos.
 * @param {{lat: number, lng: number}} from
 * @param {{lat: number, lng: number}} to
 * @returns {number} Ángulo en grados [0, 360)
 */
function bearing(from, to) {
  const φ1 = from.lat * Math.PI / 180;
  const φ2 = to.lat   * Math.PI / 180;
  const dλ = (to.lng - from.lng) * Math.PI / 180;
  const y  = Math.sin(dλ) * Math.cos(φ2);
  const x  = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/* ============================================================
   CÁLCULO DE DISTANCIA TOTAL (incluyendo segmento de cierre)
   ============================================================ */
function totalDistance() {
  if (waypoints.length < 2) return 0;
  let d = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    d += haversine(waypoints[i], waypoints[i + 1]);
  }
  // Segmento de cierre
  d += haversine(waypoints[waypoints.length - 1], waypoints[0]);
  return d;
}

/* ============================================================
   DETECCIÓN DE CURVAS
   Cuenta los cambios de rumbo que superan el umbral angular
   ============================================================ */
function countCurves() {
  const n = waypoints.length;
  if (n < 3) return 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    const prev = waypoints[(i - 1 + n) % n];
    const curr = waypoints[i];
    const next = waypoints[(i + 1) % n];
    const b1   = bearing(prev, curr);
    const b2   = bearing(curr, next);
    let diff   = Math.abs(b2 - b1);
    if (diff > 180) diff = 360 - diff;
    if (diff >= angleThreshold) count++;
  }
  return count;
}

/* ============================================================
   DETECCIÓN DEL SENTIDO DE CIRCULACIÓN
   Fórmula de Gauss (Shoelace) sobre lat/lng:
   Área positiva → Antihorario, negativa → Horario
   ============================================================ */
function circuitDirection() {
  const n = waypoints.length;
  if (n < 3) return null;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const c  = waypoints[i];
    const nx = waypoints[(i + 1) % n];
    area += c.lng * nx.lat - nx.lng * c.lat;
  }
  return area > 0 ? 'ccw' : 'cw';
}

/* ============================================================
   ACTUALIZACIÓN DE LA INTERFAZ
   ============================================================ */
function updateUI() {
  const n      = waypoints.length;
  const closed = n >= 3;

  $('s-pts').textContent = n;

  // Distancia
  if (n >= 2) {
    const km = (totalDistance() / 1000).toFixed(3);
    $('s-dist').textContent = `${km} km`;
  } else {
    $('s-dist').textContent = '—';
  }

  // Curvas y sentido
  if (closed) {
    $('s-curves').textContent = countCurves();

    const dir = circuitDirection();
    if (dir === 'cw') {
      $('dir-icon').textContent = '↻';
      $('dir-name').textContent = t('dirClockwise');
      $('dir-sub').textContent  = t('dirClockwiseSub');
    } else {
      $('dir-icon').textContent = '↺';
      $('dir-name').textContent = t('dirCounter');
      $('dir-sub').textContent  = t('dirCounterSub');
    }

    $('circuit-badge').textContent = t('circuitOn');
    $('circuit-badge').className   = 'badge on';
  } else {
    $('s-curves').textContent      = n < 3 ? '—' : '0';
    $('dir-icon').textContent      = '—';
    $('dir-name').textContent      = t('dirUndefined');
    $('dir-sub').textContent       = t('dirNeed3');
    $('circuit-badge').textContent = t('circuitOff');
    $('circuit-badge').className   = 'badge off';
  }

  // Punto de largada
  if (n > 0) {
    $('s-start').textContent = t('startPointFmt', {
      lat: waypoints[0].lat.toFixed(5),
      lng: waypoints[0].lng.toFixed(5),
    });
  } else {
    $('s-start').textContent = t('startNotDefined');
  }

  // Botones
  $('btn-undo').disabled  = n === 0;
  $('btn-clear').disabled = n === 0;
  $('btn-flip').disabled  = n < 2;

  updateArrowControlsUI();
  updateWptList();
}

function updateWptList() {
  const el = $('wpt-list');

  if (!waypoints.length) {
    el.innerHTML = `<div class="wpt-empty">${t('wptEmpty')}</div>`;
    return;
  }

  el.innerHTML = waypoints.map((w, i) => `
    <div class="wpt-item ${i === 0 ? 'is-start' : ''}"
         onclick="${i > 0 ? `setStart(${i})` : ''}">
      <div class="wpt-dot ${i === 0 ? 'start' : ''}">${i === 0 ? '🏁' : i + 1}</div>
      <div class="wpt-coords">${w.lat.toFixed(5)}, ${w.lng.toFixed(5)}</div>
      ${i === 0 ? `<span class="wpt-badge">${t('startBadge')}</span>` : ''}
    </div>
  `).join('');
}

/* ============================================================
   SIDEBAR RESIZABLE
   ============================================================ */
(function () {
  const resizer = $('sidebar-resizer');
  const sidebar = $('sidebar');
  let startX     = 0;
  let startWidth = 0;
  let overlay    = null;

  function clearResizeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    resizer.classList.remove('dragging');
  }

  resizer.addEventListener('mousedown', e => {
    startX     = e.clientX;
    startWidth = sidebar.offsetWidth;
    resizer.classList.add('dragging');

    // Overlay transparente para mantener el cursor durante el drag
    clearResizeOverlay();
    overlay = document.createElement('div');
    overlay.id = 'resize-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0',
      zIndex: '9999', cursor: 'col-resize',
    });
    document.body.appendChild(overlay);

    function onMouseMove(e) {
      const delta    = e.clientX - startX;
      const newWidth = Math.min(600, Math.max(200, startWidth + delta));
      sidebar.style.width = newWidth + 'px';
    }

    function onMouseUp() {
      clearResizeOverlay();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',  onMouseUp);
      window.removeEventListener('blur', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',  onMouseUp);
    window.addEventListener('blur', onMouseUp);
    e.preventDefault();
  });

  // Limpieza defensiva por si quedó un overlay colgado.
  clearResizeOverlay();
})();

/* ============================================================
   BUSCADOR DE LUGARES (Nominatim / OpenStreetMap — gratuito)
   ============================================================ */
const searchInput   = $('search-input');
const searchResults = $('search-results');
const searchClear   = $('search-clear');

let searchTimer     = null;
let focusIdx        = -1;

// Íconos según el tipo de lugar devuelto por Nominatim
const PLACE_ICONS = {
  country:        '🌍',
  state:          '🗺️',
  city:           '🏙️',
  town:           '🏘️',
  village:        '🏡',
  municipality:   '🏛️',
  suburb:         '📍',
  quarter:        '📍',
  neighbourhood:  '📍',
  road:           '🛣️',
  motorway:       '🛣️',
  aerodrome:      '✈️',
  circuit:        '🏎️',
  track:          '🏎️',
  stadium:        '🏟️',
  default:        '📍',
};

function placeIcon(type, cls) {
  if (PLACE_ICONS[type]) return PLACE_ICONS[type];
  if (cls === 'boundary' || cls === 'place') return '🗺️';
  if (cls === 'highway') return '🛣️';
  if (cls === 'leisure') return '🏟️';
  return PLACE_ICONS.default;
}

// ── Evento: escritura en el input ─────────────────────
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  searchClear.classList.toggle('visible', q.length > 0);
  clearTimeout(searchTimer);
  if (q.length < 2) { hideResults(); return; }
  showLoading();
  searchTimer = setTimeout(() => fetchPlaces(q), 380);
});

// ── Evento: teclado (flechas + Enter + Escape) ────────
searchInput.addEventListener('keydown', e => {
  const items = searchResults.querySelectorAll('.search-item');

  if (e.key === 'ArrowDown') {
    focusIdx = Math.min(focusIdx + 1, items.length - 1);
    applyFocus(items);
    e.preventDefault();
  } else if (e.key === 'ArrowUp') {
    focusIdx = Math.max(focusIdx - 1, 0);
    applyFocus(items);
    e.preventDefault();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (focusIdx >= 0 && items[focusIdx]) {
      items[focusIdx].click();
    } else if (searchInput.value.trim().length >= 2) {
      clearTimeout(searchTimer);
      fetchPlaces(searchInput.value.trim(), true);
    }
  } else if (e.key === 'Escape') {
    hideResults();
    searchInput.blur();
  }
});

// ── Botón limpiar ─────────────────────────────────────
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.classList.remove('visible');
  hideResults();
  searchInput.focus();
});

// ── Cerrar dropdown al hacer clic fuera ───────────────
document.addEventListener('click', e => {
  if (!e.target.closest('#search-wrap')) hideResults();
});

// ── Llamada a la API de Nominatim ─────────────────────
async function fetchPlaces(query, navigateFirst = false) {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '6');
    url.searchParams.set('addressdetails', '1');

    const res = await fetch(url.toString(), {
      headers: {
        'Accept-Language': currentLang,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const places = await res.json();

    if (navigateFirst && places.length > 0) {
      navigateTo(places[0]);
    } else {
      renderResults(places);
    }
  } catch (err) {
    renderError();
    console.error('[Buscador] Error al consultar Nominatim:', err);
  }
}

// ── Renderizar resultados ─────────────────────────────
function renderResults(places) {
  focusIdx = -1;

  if (!places.length) {
    searchResults.innerHTML = `<div class="search-empty">${t('searchNoResults')}</div>`;
    searchResults.classList.add('visible');
    return;
  }

  searchResults.innerHTML = places.map((p, i) => {
    const name    = p.name || p.display_name.split(',')[0].trim();
    const subtext = p.display_name;
    const icon    = placeIcon(p.type, p.class);
    return `
      <div class="search-item"
           data-lat="${p.lat}"
           data-lon="${p.lon}"
           data-name="${escapeHtml(name)}"
           data-display="${escapeHtml(p.display_name)}"
           data-bbox="${p.boundingbox ? p.boundingbox.join(',') : ''}">
        <span class="search-place-icon">${icon}</span>
        <div class="search-text">
          <div class="search-name">${escapeHtml(name)}</div>
          <div class="search-sub">${escapeHtml(subtext)}</div>
        </div>
      </div>
    `;
  }).join('');

  searchResults.querySelectorAll('.search-item').forEach(item => {
    item.addEventListener('click', () => navigateTo({
      lat:          item.dataset.lat,
      lon:          item.dataset.lon,
      display_name: item.dataset.display,
      name:         item.dataset.name,
      boundingbox:  item.dataset.bbox ? item.dataset.bbox.split(',') : null,
    }));
  });

  searchResults.classList.add('visible');
}

function showLoading() {
  searchResults.innerHTML = `
    <div class="search-loading">
      <div class="search-spinner"></div>
      ${t('searchSearching')}
    </div>`;
  searchResults.classList.add('visible');
}

function renderError() {
  searchResults.innerHTML = `<div class="search-empty">${t('searchError')}</div>`;
  searchResults.classList.add('visible');
}

function hideResults() {
  searchResults.classList.remove('visible');
  searchResults.innerHTML = '';
  focusIdx = -1;
}

function applyFocus(items) {
  items.forEach(i => i.classList.remove('focused'));
  if (items[focusIdx]) {
    items[focusIdx].classList.add('focused');
    items[focusIdx].scrollIntoView({ block: 'nearest' });
  }
}

// ── Navegar al lugar seleccionado ─────────────────────
function navigateTo(place) {
  const lat = parseFloat(place.lat);
  const lng = parseFloat(place.lon);

  // Si Nominatim devolvió un bounding box, ajustamos la vista a él
  if (place.boundingbox && place.boundingbox.length === 4) {
    const [s, n, w, e] = place.boundingbox.map(Number);
    map.flyToBounds([[s, w], [n, e]], { duration: 1.2, maxZoom: 16 });
  } else {
    map.flyTo([lat, lng], 14, { duration: 1.2 });
  }

  // Mostrar nombre limpio en el input
  const shortName = (place.name || place.display_name.split(',').slice(0, 2).join(', ')).trim();
  searchInput.value = shortName;
  searchClear.classList.add('visible');
  hideResults();
}

// ── Escape HTML para evitar XSS en innerHTML ──────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   CHIPS DE SENSIBILIDAD DE CURVAS
   ============================================================ */
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    angleThreshold = parseInt(chip.dataset.val, 10);
    if (waypoints.length >= 3) updateUI(); // recalcular solo curvas
  });
});

updateArrowsToggleUI();
updateArrowControlsUI();
applyTranslations();
