# 💧 Cetaqua 20º Aniversario — Huella Hídrica del Evento

> Mini-app interactiva para que los asistentes al 20º aniversario de Cetaqua calculen y compensen su huella hídrica individual, con un dashboard en tiempo real que muestra el impacto colectivo del evento.

🔗 **Demo en vivo:** [al16gm.github.io/Cetaqua20aniversario](https://al16gm.github.io/Cetaqua20aniversario/index)

---

## ¿Qué es esto?

Durante el evento del 20º aniversario de **Cetaqua** (Barcelona, 2026), los asistentes pueden escanear un QR, comprometerse con hasta 6 acciones de ahorro de agua en su vida diaria, y ver en pantalla grande cómo sus compromisos individuales se suman para compensar la huella hídrica del propio evento.

---

## 📁 Estructura del proyecto

```
├── index.html          # Portada / landing del evento
├── form.html           # Formulario de compromisos de ahorro
├── panel.html          # Dashboard en tiempo real (modo escritorio + móvil)
└── Code.gs             # Backend Google Apps Script (API + Google Sheets)
```

---

## 🖥️ Pantallas

### `index.html` — Portada
Pantalla de bienvenida con animaciones de entrada. Acceso directo al formulario de compromisos y al panel de impacto.

### `form.html` — Misiones de Ahorro
Los asistentes seleccionan su nivel de compromiso (Bronce / Plata / Oro) en 6 categorías de ahorro de agua:

| Misión | Descripción | Máx. ahorro/semana |
|---|---|---|
| 🪥 Cepillado | Cerrar el grifo al lavarse los dientes | 336 L |
| 🚿 Ducha | Reducir el tiempo de ducha | 504 L |
| 🥩 Carne Roja | Reducir el consumo semanal | 9.000 L |
| 🗑️ Desperdicio | Evitar tirar comida | 2.000 L |
| 🧺 Lavadora | Carga completa y agua fría | 150 L |
| 🍽️ Lavavajillas | Uso eficiente y lleno | 150 L |

Los datos se envían al backend y quedan registrados en Google Sheets.

### `panel.html` — Dashboard en tiempo real
Diseñado para proyectarse en pantalla grande durante el evento. Se actualiza automáticamente cada 10 segundos. Incluye:

- Huella total del evento vs. huella compensada
- % de compensación (circular progress)
- Barra de progreso global
- Gráfico de origen de la compensación (asistentes vs. fuente externa)
- Ranking Top 5 de compromisos más impactantes

**Vista adaptativa:** detecta automáticamente si se accede desde móvil o escritorio y ajusta el layout. Un botón flotante permite cambiar entre vistas con un clic.

---

## ⚙️ Backend — Google Apps Script

El fichero `Code.gs` se despliega como **Web App** en Google Apps Script y actúa como API REST ligera conectada a una Google Sheet.

### Endpoints

| Método | `action` | Descripción |
|---|---|---|
| GET | `commitments` | Devuelve la lista de compromisos y sus niveles en JSON |
| GET | `dashboard` | Devuelve los KPIs agregados para el panel |
| POST | `commit` | Registra los compromisos de un asistente |
| GET | `ping` | Health check |

### Estructura de la Google Sheet

| Pestaña | Contenido |
|---|---|
| `CONFIG` | `B1` → Huella total del evento (m³) · `B2` → Token de validación |
| `RESPUESTAS` | Un registro por asistente con fecha, datos opcionales, compromisos y m³ totales |
| `FUENTE` | Compensaciones de fuentes externas (columna B en litros) |
| `DASHBOARD` | Snapshot del último cálculo agregado |

### Despliegue del script

1. Abre [script.google.com](https://script.google.com) y crea un nuevo proyecto.
2. Copia el contenido de `Code.gs`.
3. Actualiza `CONFIG.SHEET_ID` con el ID de tu Google Sheet.
4. Despliega como **Web App**: ejecutar como *tú*, acceso *cualquier persona* (anónimo).
5. Copia la URL del despliegue y actualiza `SCRIPT_URL` en `form.html` y `panel.html`.

---

## 🚀 Despliegue del frontend

El frontend es HTML estático, sin dependencias de build. Se puede servir desde cualquier hosting estático.

### GitHub Pages (recomendado)
1. Sube `index.html`, `form.html` y `panel.html` a la rama `main`.
2. En *Settings → Pages*, selecciona la rama `main` como fuente.
3. La app queda disponible en `https://<usuario>.github.io/<repo>/`.

---

## 🔒 Seguridad

- **Token de evento:** cada envío incluye un token (`20cetaqua`) que se valida contra la Google Sheet. Peticiones sin token válido son rechazadas con `403`.
- **Honeypot anti-spam:** campo oculto en el formulario; si contiene valor, la petición se ignora silenciosamente.
- **Rate limiting:** máximo 1 envío cada 30 segundos por dispositivo (basado en hash del User-Agent via `CacheService`).

---

## 🛠️ Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + Tailwind CSS (CDN) + Motion.js |
| Backend | Google Apps Script (V8) |
| Base de datos | Google Sheets |
| Hosting | GitHub Pages |
| Fuente | Inter (Google Fonts) |
| QR | api.qrserver.com |

---

## 📄 Licencia

Proyecto interno desarrollado para el **20º Aniversario de Cetaqua**, Barcelona 2026.
