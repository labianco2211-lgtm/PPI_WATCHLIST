const LAST_UPDATED = "2026-06-02 17:25:10 America/Buenos_Aires";

const WATCHLIST = [
  { group: "PORTAFOLIO", ticker: "AMZND", name: "Amazon", currency: "US$", price: 1.86, dailyChange: -1.33, bid: 1.845, ask: 1.86, buyTrigger: null, sellTrigger: null, priority: "Media", note: "No prioridad. Mirar solo si profundiza la baja." },
  { group: "PORTAFOLIO", ticker: "AVGOD", name: "Broadcom", currency: "US$", price: 12.71, dailyChange: 3.25, bid: 12.67, ask: 12.70, buyTrigger: null, sellTrigger: null, priority: "Alta", note: "Activo de calidad, pero no perseguir con suba fuerte." },
  { group: "PORTAFOLIO", ticker: "CEGD", name: "Constellation Energy", currency: "US$", price: 6.32, dailyChange: 2.43, bid: 6.29, ask: 6.35, buyTrigger: null, sellTrigger: null, priority: "Media", note: "Fuerte, pero evitar comprar despues de la suba." },
  { group: "PORTAFOLIO", ticker: "FSLRD", name: "First Solar", currency: "US$", price: 17.97, dailyChange: 4.48, bid: 17.72, ask: 17.97, buyTrigger: null, sellTrigger: null, priority: "Media", note: "Muy en verde. No perseguir tras suba fuerte." },
  { group: "PORTAFOLIO", ticker: "GLDD", name: "SPDR Gold Trust", currency: "US$", price: 8.55, dailyChange: 0.12, bid: 8.52, ask: 8.55, buyTrigger: 8.50, sellTrigger: null, priority: "Media/Alta", note: "Cobertura. Sumar solo en retroceso o si mejora la punta." },
  { group: "PORTAFOLIO", ticker: "GOOGLD", name: "Alphabet", currency: "US$", price: 6.51, dailyChange: -4.41, bid: 6.50, ask: 6.52, buyTrigger: 6.50, sellTrigger: 7.20, priority: "Alta", note: "Principal candidata. Zona ideal: 6,50; revisar ejecucion si mejora la punta." },
  { group: "PORTAFOLIO", ticker: "IBITD", name: "iShares Bitcoin Trust", currency: "US$", price: 3.93, dailyChange: -7.10, bid: 3.91, ask: 3.925, buyTrigger: null, sellTrigger: null, priority: "Baja", note: "Riesgo alto. Solo seguimiento tactico." },
  { group: "PORTAFOLIO", ticker: "ITAD", name: "iShares U.S. Aerospace & Defense ETF", currency: "US$", price: 4.69, dailyChange: 0.11, bid: 4.69, ask: 4.755, buyTrigger: null, sellTrigger: null, priority: "Baja", note: "Fuera de cartera salvo nuevo gatillo claro." },
  { group: "PORTAFOLIO", ticker: "LACD", name: "Lithium Americas", currency: "US$", price: 5.97, dailyChange: 4.74, bid: 5.95, ask: 5.97, buyTrigger: null, sellTrigger: null, priority: "Baja", note: "Especulativa y volatil. No perseguir." },
  { group: "PORTAFOLIO", ticker: "MELID", name: "MercadoLibre", currency: "US$", price: 14.51, dailyChange: -2.88, bid: 14.48, ask: 14.51, buyTrigger: 14.38, sellTrigger: 15.30, priority: "Alta", note: "Cerca de zona. Mejor esperar 14,38/14,40 salvo caida adicional." },
  { group: "PORTAFOLIO", ticker: "METAD", name: "Meta Platforms", currency: "US$", price: 25.98, dailyChange: -0.61, bid: 25.96, ask: 25.98, buyTrigger: null, sellTrigger: null, priority: "Media", note: "Mantener. Baja leve, no es oportunidad principal." },
  { group: "PORTAFOLIO", ticker: "MSFTD", name: "Microsoft", currency: "US$", price: 15.30, dailyChange: -3.95, bid: 15.25, ask: 15.30, buyTrigger: 15.20, sellTrigger: 16.20, priority: "Alta", note: "Cerca. Recompra atractiva solo en 15,25/15,20." },
  { group: "PORTAFOLIO", ticker: "NVDAD", name: "NVIDIA", currency: "US$", price: 9.61, dailyChange: -0.62, bid: 9.61, ask: 9.64, buyTrigger: 9.50, sellTrigger: null, priority: "Alta", note: "Nucleo. Sumar solo si corrige mas." },
  { group: "PORTAFOLIO", ticker: "ORCLD", name: "Oracle", currency: "US$", price: 84.30, dailyChange: -1.63, bid: 84.10, ask: 84.50, buyTrigger: null, sellTrigger: null, priority: "Media", note: "Spread alto. Revisar solo si baja mas." },
  { group: "PORTAFOLIO", ticker: "QQQD", name: "Invesco QQQ Trust", currency: "US$", price: 38.58, dailyChange: 0.05, bid: 38.58, ask: 38.72, buyTrigger: null, sellTrigger: null, priority: "Media", note: "Indice tech. No prioridad frente a CEDEARs puntuales." },
  { group: "PORTAFOLIO", ticker: "SPYD", name: "SPDR S&P 500", currency: "US$", price: 13.16, dailyChange: 0.46, bid: 13.13, ask: 13.16, buyTrigger: null, sellTrigger: null, priority: "Media", note: "Base de mercado. Mantener." },
  { group: "PORTAFOLIO", ticker: "TSLAD", name: "Tesla", currency: "US$", price: 29.06, dailyChange: 1.75, bid: 29.18, ask: 29.29, buyTrigger: null, sellTrigger: null, priority: "Media", note: "Volatil. No perseguir suba." },
  { group: "PORTAFOLIO", ticker: "VSTD", name: "Vistra", currency: "US$", price: 6.36, dailyChange: 2.58, bid: 6.31, ask: 6.36, buyTrigger: null, sellTrigger: null, priority: "Media", note: "Fuerte, pero no entrar despues de suba." },
  { group: "PORTAFOLIO", ticker: "XLPD", name: "Consumer Staples Select Sector SPDR", currency: "US$", price: 5.29, dailyChange: -0.94, bid: 5.30, ask: 5.33, buyTrigger: null, sellTrigger: null, priority: "Baja/Media", note: "Defensiva. No prioridad para compra agresiva." },
  { group: "ANALISIS", ticker: "CATD", name: "Caterpillar", currency: "US$", price: 46.98, dailyChange: 5.01, bid: 47.00, ask: 47.24, buyTrigger: null, sellTrigger: null, priority: "Media", note: "Buen activo, pero esta demasiado en verde." },
  { group: "ANALISIS", ticker: "CRM", name: "Salesforce", currency: "AR$", price: 16730, dailyChange: -3.96, bid: 16730, ask: 16750, buyTrigger: 16720, sellTrigger: 18000, priority: "Alta", note: "Interesante. Orden preferida cerca de 16.720; no pagar de mas." },
  { group: "ANALISIS", ticker: "KEEL", name: "Keel Infrastructure", currency: "AR$", price: 46100, dailyChange: 1.59, bid: 46020, ask: 46100, buyTrigger: null, sellTrigger: null, priority: "Baja", note: "Solo seguimiento." },
  { group: "ANALISIS", ticker: "NMR", name: "Nomura Holdings", currency: "AR$", price: 12580, dailyChange: 4.23, bid: 12540, ask: 12580, buyTrigger: null, sellTrigger: null, priority: "Baja/Media", note: "Viene fuerte; no prioridad frente a CRM/PANW." },
  { group: "ANALISIS", ticker: "PANW", name: "Palo Alto Networks", currency: "AR$", price: 8920, dailyChange: -0.78, bid: 8890, ask: 8915, buyTrigger: 8830, sellTrigger: 9600, priority: "Media/Alta", note: "Buena empresa, pero todavia no esta en precio ideal." },
  { group: "ANALISIS", ticker: "TSMD", name: "Taiwan Semiconductor", currency: "US$", price: 51.70, dailyChange: 2.58, bid: 51.40, ask: 51.80, buyTrigger: null, sellTrigger: null, priority: "Alta", note: "Calidad, pero no perseguir en verde." },
  { group: "ANALISIS", ticker: "URAD", name: "Global X Uranium ETF", currency: "US$", price: 11.02, dailyChange: 3.18, bid: 11.01, ask: 11.04, buyTrigger: null, sellTrigger: null, priority: "Media", note: "Volatil. Mirar solo en retroceso." },
  { group: "ANALISIS", ticker: "XLVD", name: "Health Care Select Sector SPDR", currency: "US$", price: 5.25, dailyChange: -1.13, bid: 5.23, ask: 5.28, buyTrigger: null, sellTrigger: null, priority: "Media", note: "Defensiva. No prioridad para compra agresiva." }
];

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
      <td class="note">${escapeHtml(row.note)}</td>
      <td class="muted">${escapeHtml(LAST_UPDATED)}</td>
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

["searchInput", "groupFilter", "priorityFilter", "signalFilter"].forEach(id => {
  document.getElementById(id).addEventListener("input", render);
});

document.getElementById("resetButton").addEventListener("click", resetFilters);
render();
