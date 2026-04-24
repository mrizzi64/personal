import http from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DIR = path.join(__dirname, "app");
const DEFAULT_SYMBOLS = ["NVDA.US", "PLTR.US", "QQQ.US", "SPY.US"];
const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;
const HOST = "0.0.0.0";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
};

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
  const symbols = symbolsParam
    ? symbolsParam.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean)
    : DEFAULT_SYMBOLS;

  const stooqSymbols = symbols.map((s) => (s.endsWith(".US") ? s : `${s}.US`)).join("+");
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

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    });
    res.end(JSON.stringify({ quotes }));
  } catch (error) {
    console.error("Error al consultar Stooq:", error);
    res.writeHead(502, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(
      JSON.stringify({
        error: "No se pudo obtener la información de mercado",
        details: error.message,
      })
    );
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
