/**
 * CETAQUA 20 Aniversario - Backend Google Apps Script
 * 
 * Este script gestiona los compromisos de ahorro de agua, 
 * guarda las respuestas en Google Sheets y sirve los datos para el dashboard.
 */

const CONFIG = {
  SHEET_ID: '1g1r3Yac1KasJlXh1cC6VhkK5J4WtjFsGo71iAgb9u9I', // Cambiar por el ID real
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
      return jsonResponse({ ok: true });
    }
    
    if (action === 'commitments') {
      return getCommitments();
    }
    
    if (action === 'dashboard') {
      return getDashboardData();
    }
    
    return jsonResponse({ error: 'Acción no válida' }, 400);
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

/**
 * Manejador de peticiones POST
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'commit') {
      return handleCommitment(data);
    }
    
    return jsonResponse({ error: 'Acción no válida' }, 400);
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

/**
 * Obtiene la lista de compromisos con sus niveles y valores hardcoded (o desde CONFIG)
 */
function getCommitments() {
  // Definición de niveles y valores según requerimiento
  const commitments = [
    { 
      id: "cepillado", 
      label: "Cepillado 🪥", 
      icon: "🪥", 
      desc: "Cerrar el grifo al lavarse los dientes", 
      levels: [
        { label: "Sin cambios", liters: 0 },
        { label: "Cierro 1 vez/día", liters: 112 },
        { label: "Cierro 2 veces/día", liters: 224 },
        { label: "Cierro 3 veces/día", liters: 336 }
      ], 
      cat: "Higiene" 
    },
    { 
      id: "ducha", 
      label: "Ducha 🚿", 
      icon: "🚿", 
      desc: "Reducir tiempo de ducha (12L/min)", 
      levels: [
        { label: "Sin cambios", liters: 0 },
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
        { label: "Sin cambios", liters: 0 },
        { label: "1 ración menos/sem", liters: 3000 },
        { label: "2 raciones menos/sem", liters: 6000 },
        { label: "Sin carne roja", liters: 9000 }
      ], 
      cat: "Alimentación" 
    },
    { 
      id: "desperdicio", 
      label: "Desperdicio 🗑️🍎", 
      icon: "🗑️🍎", 
      desc: "Evitar tirar comida", 
      levels: [
        { label: "Sin cambios", liters: 0 },
        { label: "Evito tirar 0,5 kg", liters: 750 },
        { label: "Evito tirar 1 kg", liters: 1500 },
        { label: "Planificación total", liters: 2000 }
      ], 
      cat: "Alimentación" 
    },
    { 
      id: "lavadora", 
      label: "Lavadora 🧺", 
      icon: "🧺", 
      desc: "Carga completa y agua fría", 
      levels: [
        { label: "Sin cambios", liters: 0 },
        { label: "Carga completa", liters: 50 },
        { label: "Lavado en frío", liters: 100 },
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
        { label: "Sin cambios", liters: 0 },
        { label: "Solo cuando esté lleno", liters: 70 },
        { label: "Evito prelavado", liters: 100 },
        { label: "Optimización total", liters: 150 }
      ], 
      cat: "Hogar" 
    }
  ];
  
  return jsonResponse(commitments);
}

/**
 * Función auxiliar para obtener datos de compromisos sin envolver en JSON
 */
function getCommitmentsData() {
  return [
    { 
      id: "cepillado", label: "Cepillado 🪥", levels: [
        { label: "Sin cambios", liters: 0 },
        { label: "Cierro 1 vez/día", liters: 112 },
        { label: "Cierro 2 veces/día", liters: 224 },
        { label: "Cierro 3 veces/día", liters: 336 }
      ]
    },
    { 
      id: "ducha", label: "Ducha 🚿", levels: [
        { label: "Sin cambios", liters: 0 },
        { label: "Reduzco 2 min", liters: 168 },
        { label: "Reduzco 4 min", liters: 336 },
        { label: "Reduzco 6 min", liters: 504 }
      ]
    },
    { 
      id: "carne_roja", label: "Carne Roja 🥩", levels: [
        { label: "Sin cambios", liters: 0 },
        { label: "1 ración menos/sem", liters: 3000 },
        { label: "2 raciones menos/sem", liters: 6000 },
        { label: "Sin carne roja", liters: 9000 }
      ]
    },
    { 
      id: "desperdicio", label: "Desperdicio 🗑️🍎", levels: [
        { label: "Sin cambios", liters: 0 },
        { label: "Evito tirar 0,5 kg", liters: 750 },
        { label: "Evito tirar 1 kg", liters: 1500 },
        { label: "Planificación total", liters: 2000 }
      ]
    },
    { 
      id: "lavadora", label: "Lavadora 🧺", levels: [
        { label: "Sin cambios", liters: 0 },
        { label: "Carga completa", liters: 50 },
        { label: "Lavado en frío", liters: 100 },
        { label: "Carga completa + frío", liters: 150 }
      ]
    },
    { 
      id: "lavavajillas", label: "Lavavajillas 🍽️", levels: [
        { label: "Sin cambios", liters: 0 },
        { label: "Solo cuando esté lleno", liters: 70 },
        { label: "Evito prelavado", liters: 100 },
        { label: "Optimización total", liters: 150 }
      ]
    }
  ];
}

/**
 * Procesa un nuevo compromiso con niveles
 */
function handleCommitment(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const configSheet = ss.getSheetByName(CONFIG.TAB_CONFIG);
  
  // 1. Validar Token
  const validToken = configSheet.getRange("B2").getValue();
  if (data.token !== validToken) {
    return jsonResponse({ error: 'Token de evento inválido' }, 403);
  }
  
  // 2. Honeypot
  if (data.hp && data.hp.length > 0) {
    return jsonResponse({ ok: true, message: 'Spam detectado' });
  }
  
  // 3. Rate Limiting (30s por IP)
  const cache = CacheService.getScriptCache();
  const cacheKey = 'rate_' + (data.ip || 'unknown');
  if (cache.get(cacheKey)) {
    return jsonResponse({ error: 'Demasiadas peticiones. Espera 30 segundos.' }, 429);
  }
  cache.put(cacheKey, '1', 30);
  
  // 4. Calcular m3 totales y generar string legible
  let totalLiters = 0;
  let summaryParts = [];
  let emailDetails = [];
  
  // Obtenemos los compromisos para tener las etiquetas de los niveles
  const allCommitments = getCommitmentsData();
  
  data.selections.forEach(sel => {
    if (sel.level > 0) {
      const commitment = allCommitments.find(c => c.id === sel.id);
      if (commitment) {
        const levelInfo = commitment.levels[sel.level];
        totalLiters += Number(sel.liters);
        // Guardamos "Nombre: LitrosL" para que sea legible en la excel
        summaryParts.push(commitment.label + ":" + sel.liters + "L");
      }
    }
  });
  
  const totalM3 = totalLiters / 1000;
  
  // 5. Guardar en RESPUESTAS
  const respSheet = ss.getSheetByName(CONFIG.TAB_RESPUESTAS);
  respSheet.appendRow([
    new Date(),
    data.nombre || '',
    data.organizacion || '',
    data.email || '',
    data.token,
    summaryParts.join('; '),
    totalM3,
    data.ip || '',
    data.ua || ''
  ]);
  
  return jsonResponse({ ok: true, added_m3: totalM3, added_liters: totalLiters });
}

/**
 * Obtiene los KPIs para el dashboard
 */
function getDashboardData() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  
  const configSheet = ss.getSheetByName(CONFIG.TAB_CONFIG);
  const respSheet = ss.getSheetByName(CONFIG.TAB_RESPUESTAS);
  const fuenteSheet = ss.getSheetByName(CONFIG.TAB_FUENTE);
  
  const huella_total_m3 = configSheet.getRange("B1").getValue();
  
  // Suma col G (m3_total) en RESPUESTAS
  const respData = respSheet.getRange("G2:G" + Math.max(2, respSheet.getLastRow())).getValues();
  const comp_m3_asist = respData.reduce((acc, row) => acc + (Number(row[0]) || 0), 0);
  
  // Suma col B (litros) en FUENTE / 1000
  const fuenteData = fuenteSheet.getRange("B2:B" + Math.max(2, fuenteSheet.getLastRow())).getValues();
  const comp_m3_fuente = fuenteData.reduce((acc, row) => acc + (Number(row[0]) || 0), 0) / 1000;
  
  const comp_m3_total = comp_m3_asist + comp_m3_fuente;
  const pct_compensado = (comp_m3_total / huella_total_m3) * 100;
  const restante_m3 = Math.max(0, huella_total_m3 - comp_m3_total);
  
  // Top Compromisos
  const commitmentsData = respSheet.getRange("F2:F" + Math.max(2, respSheet.getLastRow())).getValues();
  const allCommitments = getCommitmentsData();
  const idToLabel = {};
  allCommitments.forEach(c => idToLabel[c.id] = c.label);

  let counts = {};
  commitmentsData.forEach(row => {
    if (row[0]) {
      // Formato: "Nombre: 100L; Nombre: 200L" o "id:Acción"
      row[0].split('; ').forEach(part => {
        if (part.includes(':')) {
          let label = part.split(':')[0].trim();
          // Si es un ID, lo mapeamos al label
          if (idToLabel[label]) {
            label = idToLabel[label];
          }
          // Filtramos labels genéricos que no tengan sentido como compromiso
          const genericLabels = ["Oro", "Plata", "Bronce", "Sin cambios"];
          if (!genericLabels.includes(label)) {
            // Extraer litros: buscamos cualquier número en la parte después de los dos puntos
            let liters = 0;
            const parts = part.split(':');
            if (parts.length > 1) {
              const valPart = parts[1].trim();
              const numMatch = valPart.match(/(\d+)/);
              if (numMatch) {
                liters = parseInt(numMatch[1], 10);
              }
            }
            
            // Si por algún motivo liters sigue siendo 0 o no se pudo parsear, 
            // intentamos buscar el número en toda la parte por si acaso
            if (liters === 0) {
              const globalMatch = part.match(/(\d+)L/);
              if (globalMatch) {
                liters = parseInt(globalMatch[1], 10);
              }
            }

            counts[label] = (counts[label] || 0) + liters;
          }
        }
      });
    }
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
    restante_m3: restante_m3.toFixed(2),
    top_compromisos
  };
  
  // Escribir en DASHBOARD fila 2
  const dashSheet = ss.getSheetByName(CONFIG.TAB_DASHBOARD);
  dashSheet.getRange("A2:F2").setValues([[
    comp_m3_asist,
    comp_m3_fuente,
    comp_m3_total,
    pct_compensado.toFixed(2) + '%',
    restante_m3.toFixed(2),
    JSON.stringify(top_compromisos)
  ]]);
  
  return jsonResponse(result);
}

/**
 * Utilidad para devolver JSON
 */
function jsonResponse(data, code = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
