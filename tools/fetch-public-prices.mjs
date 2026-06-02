const YAHOO_SYMBOL_OVERRIDES = {
  GOOGLD: "GOGLD.BA"
};

const SOURCE_NAME = "Yahoo Finance Chart publico";
const MAX_FRESH_AGE_MINUTES = 90;

function yahooSymbolFor(ticker) {
  return YAHOO_SYMBOL_OVERRIDES[ticker] || `${ticker}.BA`;
}

function minutesSince(unixSeconds) {
  if (!unixSeconds) return Infinity;
  return (Date.now() - unixSeconds * 1000) / 60000;
}

function dailyChangeFromMeta(meta) {
  const price = Number(meta?.regularMarketPrice);
  const previousClose = Number(meta?.chartPreviousClose || meta?.previousClose);
  if (!Number.isFinite(price) || !Number.isFinite(previousClose) || previousClose === 0) return null;
  return ((price - previousClose) / previousClose) * 100;
}

async function fetchYahooChart(item) {
  const symbol = yahooSymbolFor(item.ticker);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2d&interval=1d`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "PPI_WATCHLIST_PUBLIC_STATIC_UPDATER"
    }
  });

  if (!response.ok) {
    return {
      ticker: item.ticker,
      source: SOURCE_NAME,
      sourceSymbol: symbol,
      sourceReliability: "unreliable",
      sourceStatus: `sin fuente publica confiable (${SOURCE_NAME} ${response.status})`,
      bidAskStatus: item.bid !== null && item.ask !== null ? "bid/ask ultimo valor conocido" : "bid/ask no disponible"
    };
  }

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta;
  const price = Number(meta?.regularMarketPrice);
  const ageMinutes = minutesSince(meta?.regularMarketTime);
  const isFresh = ageMinutes <= MAX_FRESH_AGE_MINUTES;

  if (!Number.isFinite(price)) {
    return {
      ticker: item.ticker,
      source: SOURCE_NAME,
      sourceSymbol: symbol,
      sourceReliability: "unreliable",
      sourceStatus: `sin precio publico confiable en ${SOURCE_NAME}`,
      bidAskStatus: item.bid !== null && item.ask !== null ? "bid/ask ultimo valor conocido" : "bid/ask no disponible"
    };
  }

  return {
    ticker: item.ticker,
    price,
    dailyChange: dailyChangeFromMeta(meta),
    bid: null,
    ask: null,
    updatedAt: meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
    source: SOURCE_NAME,
    sourceSymbol: symbol,
    sourceReliability: isFresh ? "reliable" : "stale",
    sourceStatus: isFresh
      ? `precio actualizado desde ${SOURCE_NAME} (${symbol})`
      : `fuente publica stale: ultimo dato de ${SOURCE_NAME} (${symbol})`,
    bidAskStatus: "bid/ask no provisto por la fuente publica; se conserva ultimo valor conocido"
  };
}

export async function fetchPublicPrices(items) {
  const updates = [];
  for (const item of items) {
    try {
      updates.push(await fetchYahooChart(item));
    } catch (error) {
      updates.push({
        ticker: item.ticker,
        source: SOURCE_NAME,
        sourceSymbol: yahooSymbolFor(item.ticker),
        sourceReliability: "unreliable",
        sourceStatus: `sin fuente publica confiable: ${error.message}`,
        bidAskStatus: item.bid !== null && item.ask !== null ? "bid/ask ultimo valor conocido" : "bid/ask no disponible"
      });
    }
  }
  return updates;
}
