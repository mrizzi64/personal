import http from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DIR = path.join(__dirname, "app");
const DATA_DIR = path.join(__dirname, "data");
const TICKERS_FILE = path.join(DATA_DIR, "tickers.json");

const DEFAULT_TICKERS = ["NVDA", "PLTR", "QQQ", "SPY"];
const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;
const HOST = "0.0.0.0";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
};

let cachedTickers = [...DEFAULT_TICKERS];
let tickersLoaded = false;

function normalizeSymbol(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().toUpperCase();
  return cleaned || null;
}

function sanitizeSymbolList(rawSymbols) {
  if (!Array.isArray(rawSymbols)) {
    return null;
  }

  const unique = new Set();
  const result = [];
  for (const value of rawSymbols) {
    const normalized = normalizeSymbol(value);
    if (!normalized) continue;
    if (!/^[A-Z0-9.-]{1,10}$/.test(normalized)) continue;
    if (unique.has(normalized)) continue;
    unique.add(normalized);
    result.push(normalized);
  }

  return result;
}

async function saveTickersToDisk(symbols) {
  cachedTickers = symbols;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    TICKERS_FILE,
    JSON.stringify({ symbols }, null, 2),
    { encoding: "utf8" }
  );
}

async function loadTickersFromDisk() {
  try {
    const raw = await fs.readFile(TICKERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeSymbolList(parsed?.symbols);
    if (sanitized !== null) {
      cachedTickers = sanitized;
      return;
    }
    console.warn("Archivo de tickers inválido, se restauran valores por defecto");
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("No se pudo leer tickers persistidos", error);
    }
  }

  await saveTickersToDisk([...DEFAULT_TICKERS]);
}

async function ensureTickersLoaded() {
  if (!tickersLoaded) {
    await loadTickersFromDisk();
    tickersLoaded = true;
  }
}

function respondJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
  });
  res.end(JSON.stringify(body));
}

async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Payload demasiado grande"));
        req.destroy();
      }
    });

    req.on("end", () => {
      resolve(data);
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
}

function detectContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || "text/plain; charset=utf-8";
}

async function serveStatic(filePath, res) {
  try {
    const normalized = path.normalize(filePath);
    if (!normalized.startsWith(APP_DIR)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const data = await fs.readFile(normalized);
    res.writeHead(200, {
      "Content-Type": detectContentType(normalized),
      "Cache-Control": "no-cache",
    });
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Recurso no encontrado");
    } else {
      console.error("Error al servir estático:", error);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Error interno del servidor");
    }
  }
}

await ensureTickersLoaded();

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
    const date = dateRaw;
    const time = timeRaw;

    return {
      symbol,
      name,
      previousClose: Number.isFinite(previousClose) ? previousClose : null,
      close: Number.isFinite(close) ? close : null,
      date,
      time,
    };
  });
}

async function handleQuotesRequest(url, res) {
  const symbolsParam = url.searchParams.get("symbols");
  let symbols;

  if (symbolsParam) {
    const parsed = symbolsParam.split(",");
    const sanitized = sanitizeSymbolList(parsed);
    symbols = sanitized !== null ? sanitized : [...cachedTickers];
  } else {
    symbols = [...cachedTickers];
  }

  if (symbols.length === 0) {
    respondJson(res, 200, { quotes: [] });
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

    respondJson(res, 200, { quotes });
  } catch (error) {
    console.error("Error al consultar Stooq:", error);
    respondJson(res, 502, {
      error: "No se pudo obtener la información de mercado",
      details: error.message,
    });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    if (requestUrl.pathname === "/api/tickers") {
      if (req.method === "GET") {
        await ensureTickersLoaded();
        respondJson(res, 200, { symbols: cachedTickers });
        return;
      }

      if (req.method === "POST") {
        try {
          const rawBody = await readRequestBody(req);
          let parsed;
          try {
            parsed = rawBody ? JSON.parse(rawBody) : {};
          } catch (parseError) {
            respondJson(res, 400, {
              error: "JSON inválido",
              details: "No se pudo interpretar el cuerpo de la petición",
            });
            return;
          }

          const sanitized = sanitizeSymbolList(parsed?.symbols);

          if (sanitized === null) {
            respondJson(res, 400, {
              error: "Payload inválido",
              details: "Se esperaba un arreglo 'symbols' con strings",
            });
            return;
          }

          await ensureTickersLoaded();
          await saveTickersToDisk(sanitized);
          respondJson(res, 200, { symbols: cachedTickers });
        } catch (error) {
          console.error("No se pudo actualizar los tickers", error);
          respondJson(res, 500, {
            error: "No se pudo guardar la configuración de tickers",
            details: error.message,
          });
        }
        return;
      }

      res.writeHead(405, {
        "Allow": "GET, POST",
        "Access-Control-Allow-Origin": "*",
      });
      res.end("Method Not Allowed");
      return;
    }

    if (requestUrl.pathname === "/api/quotes") {
      await handleQuotesRequest(requestUrl, res);
      return;
    }

    let filePath = path.join(APP_DIR, requestUrl.pathname);
    if (requestUrl.pathname === "/") {
      filePath = path.join(APP_DIR, "index.html");
    }

    await serveStatic(filePath, res);
  } catch (error) {
    console.error("Error general del servidor:", error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Error interno del servidor");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
