/**
 * CETAQUA 20 Aniversario - Backend Google Apps Script
 * 
 * Este script gestiona los compromisos de ahorro de agua, 
 * guarda las respuestas en Google Sheets y sirve los datos para el dashboard.
 */

const CONFIG = {
  SHEET_ID: '1g1r3Yac1KasJlXh1cC6VhkK5J4WtjFsGo71iAgb9u9I',
  TAB_CONFIG: 'CONFIG',
  TAB_RESPUESTAS: 'RESPUESTAS',
  TAB_FUENTE: 'FUENTE',
  TAB_DASHBOARD: 'DASHBOARD'
};

/**
 * Manejador de peticiones GET
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === 'ping') {
      return jsonResponse({ ok: true, ts: new Date().toISOString() });
    }
    if (action === 'commitments') {
      return getCommitments();
    }
    if (action === 'dashboard') {
      return getDashboardData();
    }
    return jsonResponse({ error: 'Acción no válida: ' + action }, 400);
  } catch (err) {
    console.error('doGet error:', err);
    return jsonResponse({ error: err.toString() }, 500);
  }
}

/**
 * Manejador de peticiones POST
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // FIX: El frontend envía action:'commit'
    if (data.action === 'commit') {
      return handleCommitment(data);
    }

    if (data.action === 'fuente') {
      return handleFuente(data);
    }
    
    return jsonResponse({ error: 'Acción no válida: ' + data.action }, 400);
  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse({ error: err.toString() }, 500);
  }
}

/**
 * Obtiene la lista de compromisos con sus niveles
 */
function getCommitments() {
  const commitments = [
    { 
      id: "cepillado", 
      label: "Cepillado 🪥", 
      icon: "🪥", 
      desc: "Cerrar el grifo al lavarse los dientes", 
      levels: [
        { label: "Sin cambios",       liters: 0   },
        { label: "Cierro 1 vez/día",  liters: 112 },
        { label: "Cierro 2 veces/día",liters: 224 },
        { label: "Cierro 3 veces/día",liters: 336 }
      ], 
      cat: "Higiene" 
    },
    { 
      id: "ducha", 
      label: "Ducha 🚿", 
      icon: "🚿", 
      desc: "Reducir tiempo de ducha (12L/min)", 
      levels: [
        { label: "Sin cambios",   liters: 0   },
        { label: "Reduzco 2 min", liters: 168 },
        { label: "Reduzco 4 min", liters: 336 },
        { label: "Reduzco 6 min", liters: 504 }
      ], 
      cat: "Higiene" 
    },
    { 
      id: "carne_roja", 
      label: "Carne Roja 🥩", 
      icon: "🥩", 
      desc: "Reducir consumo semanal", 
      levels: [
        { label: "Sin cambios",          liters: 0    },
        { label: "1 ración menos/sem",   liters: 3000 },
        { label: "2 raciones menos/sem", liters: 6000 },
        { label: "Sin carne roja",       liters: 9000 }
      ], 
      cat: "Alimentación" 
    },
    { 
      id: "desperdicio", 
      label: "Desperdicio 🗑️", 
      icon: "🗑️", 
      desc: "Evitar tirar comida", 
      levels: [
        { label: "Sin cambios",       liters: 0    },
        { label: "Evito tirar 0,5 kg",liters: 750  },
        { label: "Evito tirar 1 kg",  liters: 1500 },
        { label: "Planificación total",liters: 2000 }
      ], 
      cat: "Alimentación" 
    },
    { 
      id: "lavadora", 
      label: "Lavadora 🧺", 
      icon: "🧺", 
      desc: "Carga completa y agua fría", 
      levels: [
        { label: "Sin cambios",          liters: 0   },
        { label: "Carga completa",        liters: 50  },
        { label: "Lavado en frío",        liters: 100 },
        { label: "Carga completa + frío", liters: 150 }
      ], 
      cat: "Hogar" 
    },
    { 
      id: "lavavajillas", 
      label: "Lavavajillas 🍽️", 
      icon: "🍽️", 
      desc: "Uso eficiente y lleno", 
      levels: [
        { label: "Sin cambios",          liters: 0   },
        { label: "Solo cuando esté lleno",liters: 70  },
        { label: "Evito prelavado",       liters: 100 },
        { label: "Optimización total",    liters: 150 }
      ], 
      cat: "Hogar" 
    }
  ];
  
  return jsonResponse(commitments);
}

/**
 * Función auxiliar interna: compromisos sin envolver en respuesta HTTP
 */
function getCommitmentsData() {
  return [
    { id: "cepillado", label: "Cepillado 🪥", levels: [
        { label: "Sin cambios", liters: 0 }, { label: "Cierro 1 vez/día", liters: 112 },
        { label: "Cierro 2 veces/día", liters: 224 }, { label: "Cierro 3 veces/día", liters: 336 }
    ]},
    { id: "ducha", label: "Ducha 🚿", levels: [
        { label: "Sin cambios", liters: 0 }, { label: "Reduzco 2 min", liters: 168 },
        { label: "Reduzco 4 min", liters: 336 }, { label: "Reduzco 6 min", liters: 504 }
    ]},
    { id: "carne_roja", label: "Carne Roja 🥩", levels: [
        { label: "Sin cambios", liters: 0 }, { label: "1 ración menos/sem", liters: 3000 },
        { label: "2 raciones menos/sem", liters: 6000 }, { label: "Sin carne roja", liters: 9000 }
    ]},
    { id: "desperdicio", label: "Desperdicio 🗑️", levels: [
        { label: "Sin cambios", liters: 0 }, { label: "Evito tirar 0,5 kg", liters: 750 },
        { label: "Evito tirar 1 kg", liters: 1500 }, { label: "Planificación total", liters: 2000 }
    ]},
    { id: "lavadora", label: "Lavadora 🧺", levels: [
        { label: "Sin cambios", liters: 0 }, { label: "Carga completa", liters: 50 },
        { label: "Lavado en frío", liters: 100 }, { label: "Carga completa + frío", liters: 150 }
    ]},
    { id: "lavavajillas", label: "Lavavajillas 🍽️", levels: [
        { label: "Sin cambios", liters: 0 }, { label: "Solo cuando esté lleno", liters: 70 },
        { label: "Evito prelavado", liters: 100 }, { label: "Optimización total", liters: 150 }
    ]}
  ];
}

/**
 * Procesa un nuevo compromiso
 */
function handleCommitment(data) {
  // 1. Honeypot anti-spam (antes del lock, no consume recursos)
  if (data.hp && data.hp.length > 0) {
    return jsonResponse({ ok: true, message: 'OK' });
  }

  // 2. LockService — permite hasta ~20 envíos simultáneos sin corrupción de datos
  //    Cada escritura espera hasta 10s a que la anterior termine
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // espera máx. 10s
  } catch (e) {
    return jsonResponse({ error: 'El servidor está ocupado, inténtalo de nuevo en unos segundos.' }, 503);
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const configSheet = ss.getSheetByName(CONFIG.TAB_CONFIG);

    // 3. Validar Token
    const validToken = configSheet.getRange("B2").getValue();
    if (data.token !== validToken) {
      return jsonResponse({ error: 'Token de evento inválido' }, 403);
    }

    // 4. Calcular totales
    let totalLiters = 0;
    const summaryParts = [];
    const allCommitments = getCommitmentsData();

    data.selections.forEach(sel => {
      if (sel.level > 0) {
        const commitment = allCommitments.find(c => c.id === sel.id);
        if (commitment) {
          totalLiters += Number(sel.liters);
          summaryParts.push(commitment.label + ':' + sel.liters + 'L');
        }
      }
    });

    const totalM3 = totalLiters / 1000;

    // 5. Guardar en RESPUESTAS (protegido por lock)
    const respSheet = ss.getSheetByName(CONFIG.TAB_RESPUESTAS);
    respSheet.appendRow([
      new Date(),
      data.nombre       || '',
      data.organizacion || '',
      data.email        || '',
      data.token,
      summaryParts.join('; '),
      totalM3,
      '',
      (data.ua || '').substring(0, 200)
    ]);

    console.log('Commitment saved: ' + summaryParts.join('; ') + ' → ' + totalM3 + ' m³');
    return jsonResponse({ ok: true, added_m3: totalM3, added_liters: totalLiters });

  } finally {
    // Siempre liberar el lock, incluso si hay error
    lock.releaseLock();
  }
}

/**
 * Obtiene los KPIs para el dashboard
 */
function getDashboardData() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  
  const configSheet = ss.getSheetByName(CONFIG.TAB_CONFIG);
  const respSheet   = ss.getSheetByName(CONFIG.TAB_RESPUESTAS);
  const fuenteSheet = ss.getSheetByName(CONFIG.TAB_FUENTE);
  
  const huella_total_m3 = configSheet.getRange("B1").getValue();
  
  // Suma col G (m³) en RESPUESTAS
  const lastRespRow = Math.max(2, respSheet.getLastRow());
  const respData = respSheet.getRange("G2:G" + lastRespRow).getValues();
  const comp_m3_asist = respData.reduce((acc, row) => acc + (Number(row[0]) || 0), 0);
  
  // Suma col B en FUENTE / 1000
  const lastFuenteRow = Math.max(2, fuenteSheet.getLastRow());
  const fuenteData = fuenteSheet.getRange("B2:B" + lastFuenteRow).getValues();
  const comp_m3_fuente = fuenteData.reduce((acc, row) => acc + (Number(row[0]) || 0), 0) / 1000;
  
  const comp_m3_total  = comp_m3_asist + comp_m3_fuente;
  const pct_compensado = huella_total_m3 > 0 ? (comp_m3_total / huella_total_m3) * 100 : 0;
  const restante_m3    = Math.max(0, huella_total_m3 - comp_m3_total);
  
  // Top compromisos: agrupamos litros por etiqueta
  const commitmentsData = respSheet.getRange("F2:F" + lastRespRow).getValues();
  const allCommitments  = getCommitmentsData();
  const idToLabel = {};
  allCommitments.forEach(c => { idToLabel[c.id] = c.label; });

  const counts = {};
  commitmentsData.forEach(row => {
    if (!row[0]) return;
    row[0].split('; ').forEach(part => {
      if (!part.includes(':')) return;
      let label = part.split(':')[0].trim();
      if (idToLabel[label]) label = idToLabel[label]; // normalizar ID → etiqueta
      
      const skip = ["Oro", "Plata", "Bronce", "Sin cambios"];
      if (skip.includes(label)) return;
      
      // Extraer litros del formato "Etiqueta:NNNl"
      const numMatch = part.match(/:(\d+)L?/i);
      const liters   = numMatch ? parseInt(numMatch[1], 10) : 0;
      counts[label]  = (counts[label] || 0) + liters;
    });
  });
  
  const top_compromisos = Object.keys(counts)
    .map(label => ({ label, count: counts[label] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
    
  const result = {
    huella_total_m3,
    comp_m3_asist,
    comp_m3_fuente,
    comp_m3_total,
    pct_compensado: pct_compensado.toFixed(2),
    restante_m3:    restante_m3.toFixed(2),
    top_compromisos
  };
  
  // Escribir snapshot en DASHBOARD fila 2
  try {
    const dashSheet = ss.getSheetByName(CONFIG.TAB_DASHBOARD);
    if (dashSheet) {
      dashSheet.getRange("A2:F2").setValues([[
        comp_m3_asist,
        comp_m3_fuente,
        comp_m3_total,
        pct_compensado.toFixed(2) + '%',
        restante_m3.toFixed(2),
        JSON.stringify(top_compromisos)
      ]]);
    }
  } catch(e) {
    console.warn('No se pudo escribir en DASHBOARD:', e.message);
  }
  
  return jsonResponse(result);
}


/**
 * Registra una pulsación de la fuente de agua refrigerada.
 * - Primera pulsación: fila baseline (delta=0, acumulado=0)
 * - Siguientes: delta=250L, acumulado += 0.250 m³
 */
function handleFuente(data) {
  // Token validation
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const configSheet = ss.getSheetByName(CONFIG.TAB_CONFIG);
  const validToken = configSheet.getRange("B2").getValue();
  if (data.token !== validToken) {
    return jsonResponse({ error: 'Token inválido' }, 403);
  }

  // LockService to prevent concurrent writes
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch(e) {
    return jsonResponse({ error: 'Servidor ocupado, inténtalo de nuevo.' }, 503);
  }

  try {
    const sheet = ss.getSheetByName(CONFIG.TAB_FUENTE);
    const lastRow = sheet.getLastRow();

    let delta = 250;
    let acumulado_litros = 0;

    if (lastRow < 2) {
      // Primera pulsación → baseline
      delta = 0;
      acumulado_litros = 0;
    } else {
      // Leer último acumulado (col C, en litros)
      const lastAcum = Number(sheet.getRange(lastRow, 3).getValue()) || 0;
      delta = 250;
      acumulado_litros = lastAcum + delta;
    }

    const acumulado_m3 = acumulado_litros / 1000;

    sheet.appendRow([
      new Date(),          // col A: timestamp
      delta,               // col B: litros delta (lo que suma al total del dashboard)
      acumulado_litros     // col C: litros acumulados totales
    ]);

    return jsonResponse({
      ok: true,
      delta,
      acumulado_litros,
      acumulado_m3: acumulado_m3.toFixed(3),
      is_baseline: delta === 0
    });

  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper: devolver JSON con cabeceras CORS
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
