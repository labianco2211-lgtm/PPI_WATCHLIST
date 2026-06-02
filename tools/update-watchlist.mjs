import { readFile, writeFile } from "node:fs/promises";

const WATCHLIST_PATH = new URL("../data/watchlist.json", import.meta.url);
const ALLOWED_FIELDS = new Set(["ticker", "price", "dailyChange", "bid", "ask", "updatedAt"]);
const SENSITIVE_FIELD_PATTERN = /(user|usuario|pass|password|clave|secret|token|cookie|email|mail|cuit|dni|account|cuenta|comitente|patrimonio|liquidez|quantity|cantidad|operacion|order|orden)/i;

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase();
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value).trim();
  const normalized = raw.includes(",") && raw.includes(".")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function assertSafeFields(row) {
  for (const key of Object.keys(row)) {
    if (SENSITIVE_FIELD_PATTERN.test(key)) {
      throw new Error(`Campo no permitido por seguridad: ${key}`);
    }
    if (!ALLOWED_FIELDS.has(key)) {
      throw new Error(`Campo no reconocido: ${key}. Usar solo: ${Array.from(ALLOWED_FIELDS).join(", ")}`);
    }
  }
}

function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/);
  if (rows.length < 2) return [];
  const headers = rows[0].split(",").map(header => header.trim());
  return rows.slice(1).filter(Boolean).map(line => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
  });
}

async function readSource(source) {
  if (!source) {
    return "";
  }

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`No se pudo leer feed publico: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  return readFile(source, "utf8");
}

function parseSource(text, source) {
  const trimmed = text.trim();
  if (source.endsWith(".csv") || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return parseCsv(text);
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : parsed.items || parsed.prices || [];
}

function normalizeUpdates(rows) {
  return rows.map(row => {
    assertSafeFields(row);
    const ticker = normalizeTicker(row.ticker);
    if (!ticker) throw new Error("Cada fila debe incluir ticker.");
    return {
      ticker,
      price: toNumberOrNull(row.price),
      dailyChange: toNumberOrNull(row.dailyChange),
      bid: toNumberOrNull(row.bid),
      ask: toNumberOrNull(row.ask),
      updatedAt: row.updatedAt || null
    };
  });
}

const source = process.argv[2] || process.env.PUBLIC_PRICE_FEED_URL;
const sourceText = await readSource(source);
const updates = sourceText ? normalizeUpdates(parseSource(sourceText, source)) : [];
const payload = JSON.parse(await readFile(WATCHLIST_PATH, "utf8"));
const byTicker = new Map(updates.map(row => [row.ticker, row]));
const now = new Date().toISOString();
let changed = false;

function getSpread(row) {
  const bid = toNumberOrNull(row.bid);
  const ask = toNumberOrNull(row.ask);
  return bid && ask ? ((ask - bid) / ((ask + bid) / 2)) * 100 : null;
}

function getSignal(row) {
  if (row.priority === "Descartar") return "EVITAR";
  const price = toNumberOrNull(row.price);
  const ask = toNumberOrNull(row.ask);
  const buy = toNumberOrNull(row.buyTrigger);
  const sell = toNumberOrNull(row.sellTrigger);

  if (sell !== null && price !== null && price >= sell) return "REVISAR VENTA";
  if (buy !== null && ((price !== null && price <= buy) || (ask !== null && ask <= buy))) return "REVISAR COMPRA";
  if (buy !== null && price !== null && price <= buy * 1.015) return "CERCA DE COMPRA";
  return "MANTENER";
}

payload.items = payload.items.map(item => {
  const update = byTicker.get(item.ticker);
  const sourceStatus = update
    ? "actualizado desde fuente publica sanitizada"
    : source ? "sin dato nuevo para este ticker en la fuente publica" : "sin fuente publica configurada";
  const bidAskStatus = update
    ? update.bid !== null && update.ask !== null
      ? "bid/ask actualizado desde fuente publica"
      : "bid/ask no provisto por la fuente; se conserva ultimo valor conocido"
    : item.bid !== null && item.ask !== null
      ? "bid/ask ultimo valor conocido"
      : "bid/ask no disponible";

  const hasMarketChange = Boolean(update) && (
    (update.price !== null && update.price !== item.price)
    || (update.dailyChange !== null && update.dailyChange !== item.dailyChange)
    || (update.bid !== null && update.bid !== item.bid)
    || (update.ask !== null && update.ask !== item.ask)
  );

  const merged = update ? {
    ...item,
    price: update.price ?? item.price,
    dailyChange: update.dailyChange ?? item.dailyChange,
    bid: update.bid ?? item.bid,
    ask: update.ask ?? item.ask,
    updatedAt: hasMarketChange ? update.updatedAt || now : item.updatedAt,
    sourceStatus,
    bidAskStatus
  } : {
    ...item,
    sourceStatus,
    bidAskStatus
  };

  const enriched = {
    ...merged,
    spread: getSpread(merged),
    signal: getSignal(merged)
  };

  if (
    hasMarketChange
    || item.sourceStatus !== enriched.sourceStatus
    || item.bidAskStatus !== enriched.bidAskStatus
    || item.spread !== enriched.spread
    || item.signal !== enriched.signal
  ) {
    changed = true;
  }

  return enriched;
});

if (changed) payload.lastUpdated = now;
await writeFile(WATCHLIST_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Watchlist procesada con ${updates.length} filas publicas sanitizadas. Cambios reales: ${changed ? "si" : "no"}.`);
