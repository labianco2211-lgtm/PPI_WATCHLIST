const DATA_URL = "data/watchlist.json";

let WATCHLIST = [];
let LAST_UPDATED = "-";

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
  document.getElementById("lastUpdated").textContent = LAST_UPDATED;
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

async function loadWatchlist() {
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${DATA_URL}`);
  }
  const payload = await response.json();
  LAST_UPDATED = payload.lastUpdated || "-";
  WATCHLIST = Array.isArray(payload.items) ? payload.items : [];
  render();
}

["searchInput", "groupFilter", "priorityFilter", "signalFilter"].forEach(id => {
  document.getElementById(id).addEventListener("input", render);
});

document.getElementById("resetButton").addEventListener("click", resetFilters);

loadWatchlist().catch(error => {
  document.getElementById("lastUpdated").textContent = "Error de carga";
  document.getElementById("watchlistBody").innerHTML = `<tr><td colspan="16">${escapeHtml(error.message)}</td></tr>`;
});
