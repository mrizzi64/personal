const DEFAULT_TICKERS = process.env.DEFAULT_TICKERS
  ? process.env.DEFAULT_TICKERS.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean)
  : ["NVDA", "PLTR", "QQQ", "SPY"];

const KV_REST_API_URL = process.env.KV_REST_API_URL?.replace(/\/$/, "");
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;
const KV_REST_API_READ_ONLY_TOKEN = process.env.KV_REST_API_READ_ONLY_TOKEN;
const KV_TICKERS_KEY = process.env.KV_TICKERS_KEY || "ticker-landing:symbols";

const KV_ENABLED = Boolean(KV_REST_API_URL && KV_REST_API_TOKEN);

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

    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function kvFetch(path, { method = "GET", useReadOnly = false } = {}) {
  if (!KV_ENABLED) {
    throw new Error("KV no está configurado");
  }

  const token = useReadOnly && KV_REST_API_READ_ONLY_TOKEN
    ? KV_REST_API_READ_ONLY_TOKEN
    : KV_REST_API_TOKEN;

  const url = `${KV_REST_API_URL}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`KV request ${method} ${path} respondió ${response.status}: ${text}`);
  }

  return response.json();
}

async function kvGetSymbols() {
  const encodedKey = encodeURIComponent(KV_TICKERS_KEY);
  const data = await kvFetch(`/get/${encodedKey}`, { useReadOnly: true });
  if (!("result" in data)) {
    return null;
  }

  const raw = data.result;
  if (raw == null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeSymbolList(parsed);
    return sanitized !== null ? sanitized : null;
  } catch (error) {
    console.warn("No se pudo parsear el valor guardado en KV", error);
    return null;
  }
}

async function kvSetSymbols(symbols) {
  const payload = encodeURIComponent(JSON.stringify(symbols));
  const encodedKey = encodeURIComponent(KV_TICKERS_KEY);
  await kvFetch(`/set/${encodedKey}/${payload}`, { method: "POST" });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    if (KV_ENABLED) {
      try {
        const stored = await kvGetSymbols();
        if (stored && stored.length > 0) {
          res.status(200).json({ symbols: stored, persistence: "kv" });
          return;
        }
      } catch (error) {
        console.error("Error leyendo símbolos desde KV", error);
        res.setHeader("X-Persistence-Error", "kv-read-failed");
      }
    }

    res.status(200).json({ symbols: [...DEFAULT_TICKERS], persistence: "static" });
    return;
  }

  if (req.method === "POST") {
    if (!KV_ENABLED) {
      res.status(501).json({
        error: "Persistencia no configurada",
        details: "Configura Vercel KV para habilitar guardar tickers",
      });
      return;
    }

    try {
      const rawBody = await readRequestBody(req);
      let parsed;

      try {
        parsed = rawBody ? JSON.parse(rawBody) : {};
      } catch (parseError) {
        res.status(400).json({
          error: "JSON inválido",
          details: "No se pudo interpretar el cuerpo de la petición",
        });
        return;
      }

      const sanitized = sanitizeSymbolList(parsed?.symbols);
      if (sanitized === null) {
        res.status(400).json({
          error: "Payload inválido",
          details: "Se esperaba un arreglo 'symbols' con strings",
        });
        return;
      }

      await kvSetSymbols(sanitized);
      res.status(200).json({ symbols: sanitized, persistence: "kv" });
      return;
    } catch (error) {
      console.error("Error guardando símbolos en KV", error);
      res.status(500).json({
        error: "No se pudo guardar la configuración de tickers",
        details: error.message,
      });
      return;
    }
  }

  res.setHeader("Allow", "GET, POST, OPTIONS");
  res.status(405).json({ error: "Method Not Allowed" });
}
