import { readFile, writeFile } from "node:fs/promises";
import { fetchPublicPrices } from "./fetch-public-prices.mjs";

const WATCHLIST_PATH = new URL("../data/watchlist.json", import.meta.url);
const BLOCKING_RELIABILITY = new Set(["stale", "unreliable"]);

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
const updates = await fetchPublicPrices(payload.items);
const byTicker = new Map(updates.map(update => [update.ticker, update]));
let changed = false;

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

if (changed) payload.lastUpdated = new Date().toISOString();

await writeFile(WATCHLIST_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Watchlist procesada desde fuentes publicas. Cambios reales: ${changed ? "si" : "no"}.`);
