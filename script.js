const DATA_URL = "data/watchlist.json";
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const STALE_ALERT_MINUTES = 35;
const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";
const SOURCE_FALLBACK = "Yahoo Finance Chart publico via GitHub Actions";
const RUN_SLOTS = [
  [10, 35],
  [11, 5],
  [11, 35],
  [12, 5],
  [12, 35],
  [13, 5],
  [13, 35],
  [14, 5],
  [14, 35],
  [15, 5],
  [15, 35],
  [16, 5],
  [16, 35],
  [17, 5]
];

let WATCHLIST = [];
let LAST_UPDATED = "-";
let META = {
  lastUpdated: null,
  lastUpdatedArgentina: "-",
  nextUpdate: null,
  nextUpdateArgentina: "-",
  source: SOURCE_FALLBACK,
  runId: "-",
  buildId: "-",
  updateStatus: "DESACTUALIZADO",
  updateError: ""
};
let lastLoadError = null;
let refreshTimer = null;

const SIGNAL_ORDER = {
  "REVISAR COMPRA": 0,
  "CERCA DE COMPRA": 1,
  "REVISAR VENTA": 2,
  "MANTENER": 3,
  "EVITAR": 4
};

function toNumber(value) {
  return value === null || value === undefined || value === "" || Number.isNaN(Number(value)) ? null : Number(value);
}

function getSpread(row) {
  const bid = toNumber(row.bid);
  const ask = toNumber(row.ask);
  return bid && ask ? ((ask - bid) / ((ask + bid) / 2)) * 100 : null;
}

function getSignal(row) {
  if (row.signal) return row.signal;
  if (row.priority === "Descartar") return "EVITAR";
  const price = toNumber(row.price);
  const ask = toNumber(row.ask);
  const buy = toNumber(row.buyTrigger);
  const sell = toNumber(row.sellTrigger);

  if (sell !== null && price !== null && price >= sell) return "REVISAR VENTA";
  if (buy !== null && ((price !== null && price <= buy) || (ask !== null && ask <= buy))) return "REVISAR COMPRA";
  if (buy !== null && price !== null && price <= buy * 1.015) return "CERCA DE COMPRA";
  return "MANTENER";
}

function getSourceLabel(row) {
  const reliability = row.sourceReliability || "unreliable";
  if (reliability === "reliable") return "Actualizada";
  if (reliability === "stale") return "Ultimo conocido";
  return "No confiable";
}

function sourceClass(row) {
  const reliability = row.sourceReliability || "unreliable";
  if (reliability === "reliable") return "source-reliable";
  if (reliability === "stale") return "source-stale";
  return "source-unreliable";
}

function formatMoney(value, currency) {
  const number = toNumber(value);
  if (number === null) return "-";
  const decimals = currency === "AR$" ? 0 : (Math.abs(number) < 10 ? 3 : 2);
  return `${currency} ${number.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function formatPct(value) {
  const number = toNumber(value);
  if (number === null) return "-";
  return `${number.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatArgentinaDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date) + " America/Argentina/Buenos_Aires";
}

function argentinaParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ARGENTINA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute)
  };
}

function argentinaDateToUtc(year, month, day, hour, minute) {
  return new Date(Date.UTC(year, month - 1, day, hour + 3, minute));
}

function addArgentinaDays(parts, days) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 15));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: 0,
    minute: 0
  };
}

function isBusinessDayArgentina(parts) {
  const noonUtc = argentinaDateToUtc(parts.year, parts.month, parts.day, 12, 0);
  const weekday = noonUtc.getUTCDay();
  return weekday >= 1 && weekday <= 5;
}

function isMarketOpenArgentina(date = new Date()) {
  const parts = argentinaParts(date);
  if (!isBusinessDayArgentina(parts)) return false;
  const minutes = parts.hour * 60 + parts.minute;
  return minutes >= 10 * 60 + 30 && minutes <= 17 * 60 + 5;
}

function nextOperationalRun(from = new Date()) {
  let parts = argentinaParts(from);
  for (let offset = 0; offset < 8; offset += 1) {
    if (!isBusinessDayArgentina(parts)) {
      parts = addArgentinaDays(parts, 1);
      continue;
    }

    for (const [hour, minute] of RUN_SLOTS) {
      const candidate = argentinaDateToUtc(parts.year, parts.month, parts.day, hour, minute);
      if (candidate.getTime() > from.getTime()) return candidate;
    }
    parts = addArgentinaDays(parts, 1);
  }
  return null;
}

function minutesSince(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
}

function signalClass(signal) {
  if (signal === "REVISAR COMPRA") return "signal-buy";
  if (signal === "CERCA DE COMPRA") return "signal-near";
  if (signal === "REVISAR VENTA") return "signal-sell";
  if (signal === "EVITAR") return "signal-avoid";
  return "signal-hold";
}

function priorityClass(priority) {
  if (priority === "Alta" || priority === "Media/Alta") return "priority-high";
  if (priority === "Media" || priority === "Baja/Media") return "priority-mid";
  if (priority === "Descartar") return "priority-discard";
  return "priority-low";
}

function stateClass(state) {
  if (state === "OK") return "state-ok";
  if (state === "DESACTUALIZADO") return "state-stale";
  if (state === "ERROR") return "state-error";
  return "state-unknown";
}

function getDisplayNote(row) {
  const details = [row.note];
  if (row.bidAskStatus) details.push(`Bid/ask: ${row.bidAskStatus}.`);
  if (row.sourceStatus) details.push(`Fuente: ${row.sourceStatus}.`);
  if (row.signalStatus) details.push(`Senal: ${row.signalStatus}.`);
  return details.filter(Boolean).join(" ");
}

function getFilters() {
  return {
    query: document.getElementById("searchInput").value.trim().toLowerCase(),
    group: document.getElementById("groupFilter").value,
    priority: document.getElementById("priorityFilter").value,
    signal: document.getElementById("signalFilter").value
  };
}

function getRows() {
  const filters = getFilters();
  return WATCHLIST
    .map(row => ({ ...row, spread: getSpread(row), signal: getSignal(row) }))
    .filter(row => !filters.group || row.group === filters.group)
    .filter(row => !filters.priority || row.priority === filters.priority)
    .filter(row => !filters.signal || row.signal === filters.signal)
    .filter(row => {
      if (!filters.query) return true;
      const text = `${row.group} ${row.ticker} ${row.name} ${row.priority} ${row.signal} ${row.note}`.toLowerCase();
      return text.includes(filters.query);
    })
    .sort((a, b) => (
      SIGNAL_ORDER[a.signal] - SIGNAL_ORDER[b.signal]
      || a.group.localeCompare(b.group)
      || a.ticker.localeCompare(b.ticker)
    ));
}

function currentPanelState(ageMinutes) {
  if (lastLoadError || META.updateStatus === "ERROR") return "ERROR";
  if (isMarketOpenArgentina() && ageMinutes !== null && ageMinutes > STALE_ALERT_MINUTES) return "DESACTUALIZADO";
  return "OK";
}

function renderStatus() {
  const ageMinutes = minutesSince(META.lastUpdated);
  const nextUpdateDate = META.nextUpdate ? new Date(META.nextUpdate) : nextOperationalRun();
  const state = currentPanelState(ageMinutes);
  const lastUpdatedLabel = META.lastUpdatedArgentina || formatArgentinaDate(META.lastUpdated);
  const nextUpdateLabel = META.nextUpdateArgentina || formatArgentinaDate(nextUpdateDate);
  const ageLabel = ageMinutes === null ? "-" : `${ageMinutes} min`;
  const buildLabel = META.buildId || META.runId || "-";
  const alert = document.getElementById("staleAlert");
  const alertDetail = document.getElementById("staleAlertDetail");
  const updateState = document.getElementById("updateState");

  document.getElementById("lastUpdated").textContent = lastUpdatedLabel;
  document.getElementById("nextUpdate").textContent = nextUpdateLabel;
  document.getElementById("dataAge").textContent = ageLabel;
  document.getElementById("dataSource").textContent = META.source || SOURCE_FALLBACK;
  document.getElementById("buildId").textContent = buildLabel;
  updateState.textContent = state;
  updateState.className = `state ${stateClass(state)}`;

  if (state === "DESACTUALIZADO") {
    alert.hidden = false;
    alertDetail.textContent = `El JSON tiene ${ageLabel} de antiguedad durante horario de mercado.`;
  } else if (state === "ERROR") {
    alert.hidden = false;
    alertDetail.textContent = META.updateError || lastLoadError?.message || "Fallo la lectura o actualizacion del JSON.";
  } else {
    alert.hidden = true;
  }
}

function updateMetrics(allRows) {
  document.getElementById("metricTotal").textContent = WATCHLIST.length;
  document.getElementById("metricBuy").textContent = allRows.filter(row => row.signal === "REVISAR COMPRA").length;
  document.getElementById("metricNear").textContent = allRows.filter(row => row.signal === "CERCA DE COMPRA").length;
  document.getElementById("metricSell").textContent = allRows.filter(row => row.signal === "REVISAR VENTA").length;
  document.getElementById("metricAvoid").textContent = allRows.filter(row => row.signal === "EVITAR").length;
}

function render() {
  const allRows = WATCHLIST.map(row => ({ ...row, spread: getSpread(row), signal: getSignal(row) }));
  const rows = getRows();
  updateMetrics(allRows);
  renderStatus();
  document.getElementById("watchlistBody").innerHTML = rows.map(row => `
    <tr>
      <td>${escapeHtml(row.group)}</td>
      <td class="ticker">${escapeHtml(row.ticker)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td class="muted">${escapeHtml(row.currency)}</td>
      <td class="num">${formatMoney(row.price, row.currency)}</td>
      <td class="num ${row.dailyChange > 0 ? "pos" : row.dailyChange < 0 ? "neg" : "muted"}">${formatPct(row.dailyChange)}</td>
      <td class="num">${formatMoney(row.bid, row.currency)}</td>
      <td class="num">${formatMoney(row.ask, row.currency)}</td>
      <td class="num">${formatPct(row.spread)}</td>
      <td class="num">${formatMoney(row.buyTrigger, row.currency)}</td>
      <td class="num">${formatMoney(row.sellTrigger, row.currency)}</td>
      <td class="priority ${priorityClass(row.priority)}">${escapeHtml(row.priority)}</td>
      <td><span class="badge ${signalClass(row.signal)}">${escapeHtml(row.signal)}</span></td>
      <td class="source ${sourceClass(row)}">${escapeHtml(getSourceLabel(row))}</td>
      <td class="note">${escapeHtml(getDisplayNote(row))}</td>
      <td class="muted">${escapeHtml(row.updatedAt || LAST_UPDATED)}</td>
    </tr>
  `).join("");
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("groupFilter").value = "";
  document.getElementById("priorityFilter").value = "";
  document.getElementById("signalFilter").value = "";
  render();
}

function applyPayloadMeta(payload) {
  const payloadNextUpdate = payload.nextUpdate ? new Date(payload.nextUpdate) : null;
  const nextUpdate = payloadNextUpdate && payloadNextUpdate.getTime() > Date.now()
    ? payloadNextUpdate.toISOString()
    : nextOperationalRun()?.toISOString() || null;
  META = {
    lastUpdated: payload.lastUpdated || null,
    lastUpdatedArgentina: payload.lastUpdatedArgentina || formatArgentinaDate(payload.lastUpdated),
    nextUpdate,
    nextUpdateArgentina: formatArgentinaDate(nextUpdate),
    source: payload.source || SOURCE_FALLBACK,
    runId: payload.runId || "-",
    buildId: payload.buildId || payload.runId || "-",
    updateStatus: payload.updateStatus || "OK",
    updateError: payload.updateError || ""
  };
  LAST_UPDATED = META.lastUpdatedArgentina || META.lastUpdated || "-";
}

async function loadWatchlist() {
  const refreshButton = document.getElementById("refreshNowButton");
  refreshButton.disabled = true;
  refreshButton.textContent = "Actualizando";

  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${DATA_URL}: HTTP ${response.status}`);
    }
    const payload = await response.json();
    lastLoadError = null;
    applyPayloadMeta(payload);
    WATCHLIST = Array.isArray(payload.items) ? payload.items : [];
    render();
  } catch (error) {
    lastLoadError = error;
    META.updateStatus = "ERROR";
    META.updateError = error.message;
    renderStatus();
    if (!WATCHLIST.length) {
      document.getElementById("watchlistBody").innerHTML = `<tr><td colspan="16">${escapeHtml(error.message)}</td></tr>`;
    }
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "Actualizar ahora";
  }
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(loadWatchlist, REFRESH_INTERVAL_MS);
}

["searchInput", "groupFilter", "priorityFilter", "signalFilter"].forEach(id => {
  document.getElementById(id).addEventListener("input", render);
});

document.getElementById("resetButton").addEventListener("click", resetFilters);
document.getElementById("refreshNowButton").addEventListener("click", loadWatchlist);

loadWatchlist();
startAutoRefresh();
setInterval(renderStatus, 60 * 1000);
