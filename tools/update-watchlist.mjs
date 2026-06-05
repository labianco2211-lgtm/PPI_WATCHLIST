import { readFile, writeFile } from "node:fs/promises";
import { fetchPublicPrices } from "./fetch-public-prices.mjs";

const WATCHLIST_PATH = new URL("../data/watchlist.json", import.meta.url);
const BLOCKING_RELIABILITY = new Set(["stale", "unreliable"]);
const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";
const SOURCE_NAME = "Yahoo Finance Chart publico via GitHub Actions";
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

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSpread(row) {
  const bid = toNumberOrNull(row.bid);
  const ask = toNumberOrNull(row.ask);
  return bid && ask ? ((ask - bid) / ((ask + bid) / 2)) * 100 : null;
}

function rawSignal(row) {
  if (row.priority === "Descartar") return "EVITAR";
  const price = toNumberOrNull(row.price);
  const buy = toNumberOrNull(row.buyTrigger);
  const sell = toNumberOrNull(row.sellTrigger);

  if (sell !== null && price !== null && price >= sell) return "REVISAR VENTA";
  if (buy !== null && price !== null && price <= buy) return "REVISAR COMPRA";
  if (buy !== null && price !== null && price <= buy * 1.015) return "CERCA DE COMPRA";
  return "MANTENER";
}

function getSignal(row) {
  const signal = rawSignal(row);
  if (signal === "EVITAR") return signal;
  if (BLOCKING_RELIABILITY.has(row.sourceReliability) && (signal === "REVISAR COMPRA" || signal === "REVISAR VENTA")) {
    return "MANTENER";
  }
  return signal;
}

function getSignalStatus(row) {
  const signal = rawSignal(row);
  if (BLOCKING_RELIABILITY.has(row.sourceReliability) && (signal === "REVISAR COMPRA" || signal === "REVISAR VENTA")) {
    return `senal ${signal} bloqueada por fuente ${row.sourceReliability}`;
  }
  return "senal calculada";
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

function runIdentity() {
  const runId = process.env.GITHUB_RUN_ID || `local-${Date.now()}`;
  const attempt = process.env.GITHUB_RUN_ATTEMPT ? `.${process.env.GITHUB_RUN_ATTEMPT}` : "";
  const shortSha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : "local";
  return {
    runId,
    buildId: `${runId}${attempt}-${shortSha}`
  };
}

function updateRunMetadata(payload, status, error = "") {
  const now = new Date();
  const nextUpdate = nextOperationalRun(now);
  const identity = runIdentity();
  payload.lastUpdated = now.toISOString();
  payload.lastUpdatedArgentina = formatArgentinaDate(now);
  payload.nextUpdate = nextUpdate ? nextUpdate.toISOString() : null;
  payload.nextUpdateArgentina = nextUpdate ? formatArgentinaDate(nextUpdate) : "-";
  payload.source = SOURCE_NAME;
  payload.runId = identity.runId;
  payload.buildId = identity.buildId;
  payload.updateStatus = status;
  payload.updateError = error;
  payload.timeZone = ARGENTINA_TIME_ZONE;
  payload.schedule = "cada 30 minutos, lunes a viernes, 10:35 a 17:05 America/Argentina/Buenos_Aires";
}

function comparableItem(item) {
  return JSON.stringify({
    price: item.price,
    dailyChange: item.dailyChange,
    bid: item.bid,
    ask: item.ask,
    updatedAt: item.updatedAt,
    source: item.source,
    sourceSymbol: item.sourceSymbol,
    sourceReliability: item.sourceReliability,
    sourceStatus: item.sourceStatus,
    bidAskStatus: item.bidAskStatus,
    spread: item.spread,
    signal: item.signal,
    signalStatus: item.signalStatus
  });
}

const payload = JSON.parse(await readFile(WATCHLIST_PATH, "utf8"));
let changed = false;

try {
  const updates = await fetchPublicPrices(payload.items);
  const byTicker = new Map(updates.map(update => [update.ticker, update]));

  payload.items = payload.items.map(item => {
    const before = comparableItem(item);
    const update = byTicker.get(item.ticker);
    const hasReliablePrice = update?.sourceReliability === "reliable" && update.price !== null && update.price !== undefined;
    const hasBidAsk = update?.bid !== null && update?.bid !== undefined && update?.ask !== null && update?.ask !== undefined;
    const merged = {
      ...item,
      price: hasReliablePrice ? update.price : item.price,
      dailyChange: hasReliablePrice && update.dailyChange !== null && update.dailyChange !== undefined ? update.dailyChange : item.dailyChange,
      bid: hasBidAsk ? update.bid : item.bid ?? null,
      ask: hasBidAsk ? update.ask : item.ask ?? null,
      updatedAt: hasReliablePrice ? update.updatedAt : item.updatedAt,
      source: update?.source || item.source || null,
      sourceSymbol: update?.sourceSymbol || item.sourceSymbol || null,
      sourceReliability: update?.sourceReliability || "unreliable",
      sourceStatus: update?.sourceStatus || "sin fuente publica confiable",
      bidAskStatus: update?.bidAskStatus || (item.bid !== null && item.ask !== null ? "bid/ask ultimo valor conocido" : "bid/ask no disponible")
    };

    const enriched = {
      ...merged,
      spread: getSpread(merged),
      signal: getSignal(merged)
    };
    enriched.signalStatus = getSignalStatus(enriched);

    if (before !== comparableItem(enriched)) changed = true;
    return enriched;
  });

  updateRunMetadata(payload, "OK");
} catch (error) {
  changed = true;
  updateRunMetadata(payload, "ERROR", error.message);
}

await writeFile(WATCHLIST_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Watchlist procesada desde fuentes publicas. Cambios de precios: ${changed ? "si" : "no"}. Estado: ${payload.updateStatus}.`);
if (payload.updateStatus === "ERROR") {
  process.exitCode = 1;
}
