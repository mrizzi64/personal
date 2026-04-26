const DEFAULT_TICKERS = process.env.DEFAULT_TICKERS
  ? process.env.DEFAULT_TICKERS.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean)
  : ["NVDA", "PLTR", "QQQ", "SPY"];

const KV_REST_API_URL = process.env.KV_REST_API_URL?.replace(/\/$/, "");
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;
const KV_REST_API_READ_ONLY_TOKEN = process.env.KV_REST_API_READ_ONLY_TOKEN;
const KV_TICKERS_KEY = process.env.KV_TICKERS_KEY || "ticker-landing:symbols";

const BLOB_URL = process.env.BLOB_URL?.replace(/\/$/, "");
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_READ_ONLY_TOKEN = process.env.BLOB_READ_ONLY_TOKEN;
const BLOB_TICKERS_KEY = (process.env.BLOB_TICKERS_KEY || "ticker-landing/tickers.json").replace(/^\/+/, "");

const KV_ENABLED = Boolean(KV_REST_API_URL && KV_REST_API_TOKEN);
const BLOB_ENABLED = Boolean(BLOB_URL && (BLOB_READ_ONLY_TOKEN || BLOB_READ_WRITE_TOKEN));
const BLOB_WRITE_ENABLED = Boolean(BLOB_URL && BLOB_READ_WRITE_TOKEN);

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

function buildBlobObjectUrl() {
  if (!BLOB_URL) {
    throw new Error("BLOB_URL no está configurada");
  }

  const segments = BLOB_TICKERS_KEY.split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));

  const objectPath = segments.length > 0 ? segments.join("/") : "ticker-landing.json";
  return `${BLOB_URL}/${objectPath}`;
}

async function blobGetSymbols() {
  if (!BLOB_ENABLED) {
    return null;
  }

  const url = buildBlobObjectUrl();
  const headers = {};
  const token = BLOB_READ_ONLY_TOKEN || BLOB_READ_WRITE_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Blob GET respondió ${response.status}: ${text}`);
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    const symbols = Array.isArray(parsed?.symbols) ? parsed.symbols : parsed;
    const sanitized = sanitizeSymbolList(symbols);
    return sanitized !== null ? sanitized : null;
  } catch (error) {
    console.warn("No se pudo parsear el valor guardado en Blob", error);
    return null;
  }
}

async function blobSetSymbols(symbols) {
  if (!BLOB_WRITE_ENABLED) {
    throw new Error("Blob no está configurado para escritura");
  }

  const url = buildBlobObjectUrl();
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${BLOB_READ_WRITE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ symbols }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Blob PUT respondió ${response.status}: ${text}`);
  }
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

    if (BLOB_ENABLED) {
      try {
        const stored = await blobGetSymbols();
        if (stored && stored.length > 0) {
          res.status(200).json({ symbols: stored, persistence: "blob" });
          return;
        }
      } catch (error) {
        console.error("Error leyendo símbolos desde Blob", error);
        res.setHeader("X-Persistence-Error", "blob-read-failed");
      }
    }

    res.status(200).json({ symbols: [...DEFAULT_TICKERS], persistence: "static" });
    return;
  }

  if (req.method === "POST") {
    const hasPersistence = KV_ENABLED || BLOB_WRITE_ENABLED;

    if (!hasPersistence) {
      res.status(501).json({
        error: "Persistencia no configurada",
        details: "Configura Vercel KV o Vercel Blob para habilitar guardar tickers",
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

      if (KV_ENABLED) {
        await kvSetSymbols(sanitized);
        res.status(200).json({ symbols: sanitized, persistence: "kv" });
        return;
      }

      if (BLOB_WRITE_ENABLED) {
        await blobSetSymbols(sanitized);
        res.status(200).json({ symbols: sanitized, persistence: "blob" });
        return;
      }

      throw new Error("No hay mecanismos de persistencia disponibles");
    } catch (error) {
      console.error("Error guardando símbolos", error);
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
