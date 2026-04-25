const DEFAULT_TICKERS = process.env.DEFAULT_TICKERS
  ? process.env.DEFAULT_TICKERS.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean)
  : ["NVDA", "PLTR", "QQQ", "SPY"];

function sanitizeSymbolList(rawSymbols) {
  if (!Array.isArray(rawSymbols)) {
    return null;
  }

  const unique = new Set();
  const result = [];

  rawSymbols.forEach((value) => {
    if (typeof value !== "string") return;
    const normalized = value.trim().toUpperCase();
    if (!normalized) return;
    if (!/^[A-Z0-9.-]{1,10}$/.test(normalized)) return;
    if (unique.has(normalized)) return;
    unique.add(normalized);
    result.push(normalized);
  });

  return result;
}

function parseCsvQuotes(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift();
  if (!header || lines.length === 0) {
    return [];
  }

  return lines.map((line) => {
    const parts = line.split(",");
    const [symbolRaw, nameRaw, timeRaw, dateRaw, prevRaw, closeRaw] = parts;

    const symbol = symbolRaw.replace(".US", "");
    const name = nameRaw;
    const previousClose = Number(prevRaw);
    const close = Number(closeRaw);

    return {
      symbol,
      name,
      previousClose: Number.isFinite(previousClose) ? previousClose : null,
      close: Number.isFinite(close) ? close : null,
      date: dateRaw,
      time: timeRaw,
    };
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  const symbolsParam = Array.isArray(req.query.symbols)
    ? req.query.symbols.join(",")
    : req.query.symbols;

  let symbols;

  if (symbolsParam) {
    const parsed = symbolsParam.split(",");
    const sanitized = sanitizeSymbolList(parsed);
    symbols = sanitized !== null && sanitized.length > 0 ? sanitized : [...DEFAULT_TICKERS];
  } else {
    symbols = [...DEFAULT_TICKERS];
  }

  if (symbols.length === 0) {
    res.status(200).json({ quotes: [] });
    return;
  }

  const stooqSymbols = symbols
    .map((s) => (s.endsWith(".US") ? s : `${s}.US`))
    .join("+");
  const apiUrl = `https://stooq.com/q/l/?s=${stooqSymbols}&f=snt1d1pc&h&e=csv`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (TickerLanding/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Stooq respondió ${response.status}`);
    }

    const body = await response.text();
    const quotes = parseCsvQuotes(body);

    res.status(200).json({ quotes });
  } catch (error) {
    console.error("Error al consultar Stooq desde Vercel", error);
    res.status(502).json({
      error: "No se pudo obtener la información de mercado",
      details: error.message,
    });
  }
}
