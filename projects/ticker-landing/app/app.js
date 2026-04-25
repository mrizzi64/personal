const DEFAULT_TICKERS = ["NVDA", "PLTR", "QQQ", "SPY"];

const API_URL = "/api/quotes";
const TICKERS_API_URL = "/api/tickers";
const LOCAL_STORAGE_KEY = "ticker-landing.symbols";
const REFRESH_INTERVAL_MS = 300_000; // 5 minutos
const tickerContainer = document.getElementById("tickers");
const refreshBtn = document.getElementById("refresh-btn");
const addTickerBtn = document.getElementById("add-ticker-btn");
const lastUpdatedEl = document.getElementById("last-updated");

const tickerTemplate = document.getElementById("ticker-template");
const errorTemplate = document.getElementById("error-template");
const emptyTemplate = document.getElementById("empty-template");

let refreshTimerId = null;
let selectedTickers = [];
let isSyncingTickers = false;
let isFetchingQuotes = false;

function normalizeTicker(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().toUpperCase();
  return cleaned || null;
}

function isValidTicker(value) {
  return /^[A-Z0-9.-]{1,10}$/.test(value);
}

function sanitizeSymbolList(rawSymbols) {
  if (!Array.isArray(rawSymbols)) {
    return null;
  }

  const unique = new Set();
  const result = [];

  rawSymbols.forEach((value) => {
    const normalized = normalizeTicker(value);
    if (!normalized) return;
    if (!isValidTicker(normalized)) return;
    if (unique.has(normalized)) return;
    unique.add(normalized);
    result.push(normalized);
  });

  return result;
}

function hasLocalStorage() {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch (error) {
    console.warn("No se pudo acceder a localStorage", error);
    return false;
  }
}

function loadLocalSymbols() {
  if (!hasLocalStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeSymbolList(parsed);
    return sanitized !== null ? sanitized : null;
  } catch (error) {
    console.warn("No se pudo leer símbolos desde localStorage", error);
    return null;
  }
}

function saveLocalSymbols(symbols) {
  if (!hasLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(symbols));
  } catch (error) {
    console.warn("No se pudo guardar símbolos en localStorage", error);
  }
}

function clearLocalSymbols() {
  if (!hasLocalStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.warn("No se pudo limpiar símbolos en localStorage", error);
  }
}

function buildDetailsUrl(symbol) {
  const normalized = encodeURIComponent(symbol);
  return `https://finance.yahoo.com/quote/${normalized}`;
}

function renderEmptyState() {
  tickerContainer.innerHTML = "";
  const emptyNode = emptyTemplate.content.cloneNode(true);
  tickerContainer.appendChild(emptyNode);
  lastUpdatedEl.textContent = "Última actualización: --";
}

function setSelectedTickers(symbols) {
  selectedTickers = symbols;
  updateActionButtonsState();
}

function updateActionButtonsState() {
  const hasTickers = selectedTickers.length > 0;
  const disableRefresh = isSyncingTickers || isFetchingQuotes || !hasTickers;
  const disableAdd = isSyncingTickers || isFetchingQuotes;

  refreshBtn.disabled = disableRefresh;
  addTickerBtn.disabled = disableAdd;

  if (!hasTickers) {
    refreshBtn.textContent = "Actualizar ahora";
  }

  if (isSyncingTickers || isFetchingQuotes) {
    refreshBtn.setAttribute("aria-busy", "true");
  } else {
    refreshBtn.removeAttribute("aria-busy");
  }
}

async function loadTickersConfig() {
  isSyncingTickers = true;
  updateActionButtonsState();

  let resolvedSymbols = null;

  try {
    const response = await fetch(TICKERS_API_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const sanitized = sanitizeSymbolList(data?.symbols);

    if (sanitized !== null) {
      resolvedSymbols = sanitized;
    } else {
      console.warn("Configuración de tickers inválida desde API, se buscarán valores locales");
    }
  } catch (error) {
    console.error("No se pudo obtener la configuración de tickers", error);
  } finally {
    isSyncingTickers = false;
    updateActionButtonsState();
  }

  if (resolvedSymbols === null) {
    const localSymbols = loadLocalSymbols();
    if (localSymbols !== null) {
      resolvedSymbols = localSymbols;
    } else {
      resolvedSymbols = [...DEFAULT_TICKERS];
    }
  }

  saveLocalSymbols(resolvedSymbols);
  setSelectedTickers(resolvedSymbols);
  return resolvedSymbols;
}

async function persistTickersConfig(symbols) {
  const sanitizedInput = sanitizeSymbolList(symbols);
  if (sanitizedInput === null) {
    throw new Error("Listado de tickers inválido");
  }

  isSyncingTickers = true;
  updateActionButtonsState();

  try {
    const response = await fetch(TICKERS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbols: sanitizedInput }),
    });

    if (response.status === 501) {
      console.info("Persistencia remota no disponible, se usará almacenamiento local");
      saveLocalSymbols(sanitizedInput);
      setSelectedTickers(sanitizedInput);
      return sanitizedInput;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const sanitizedResponse = sanitizeSymbolList(data?.symbols);
    const effective = sanitizedResponse !== null ? sanitizedResponse : sanitizedInput;
    saveLocalSymbols(effective);
    setSelectedTickers(effective);
    return effective;
  } catch (error) {
    console.error("No se pudo guardar la configuración de tickers", error);
    saveLocalSymbols(sanitizedInput);
    setSelectedTickers(sanitizedInput);
    return sanitizedInput;
  } finally {
    isSyncingTickers = false;
    updateActionButtonsState();
  }
}

function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseTimestamp(dateStr, timeStr) {
  if (!dateStr) return null;
  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(4, 6)) - 1;
  const day = Number(dateStr.slice(6, 8));

  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  if (timeStr && timeStr.length >= 6) {
    hours = Number(timeStr.slice(0, 2));
    minutes = Number(timeStr.slice(2, 4));
    seconds = Number(timeStr.slice(4, 6));
  }

  const utcDate = Date.UTC(year, month, day, hours, minutes, seconds);
  return new Date(utcDate);
}

function formatDisplayDate(date) {
  if (!date) return "--";
  return date.toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function determineChangeClass(diff) {
  const EPSILON = 0.0001;
  if (diff > EPSILON) return "positive";
  if (diff < -EPSILON) return "negative";
  return "neutral";
}

function applyChangeStyles(element, changeClass) {
  element.classList.remove("positive", "negative", "neutral");
  element.classList.add(changeClass);
}

function renderTickers(quotes) {
  tickerContainer.innerHTML = "";

  if (selectedTickers.length === 0) {
    renderEmptyState();
    return;
  }

  const quoteMap = new Map();
  if (Array.isArray(quotes)) {
    quotes.forEach((quote) => {
      if (quote?.symbol) {
        quoteMap.set(quote.symbol.toUpperCase(), quote);
      }
    });
  }

  let renderedCount = 0;

  selectedTickers.forEach((symbol) => {
    const quote = quoteMap.get(symbol) ?? {
      symbol,
      name: "",
      close: null,
      previousClose: null,
      date: null,
      time: null,
    };

    const template = tickerTemplate.content.cloneNode(true);

    const card = template.querySelector(".ticker-card");
    const symbolEl = template.querySelector(".ticker-symbol");
    const nameEl = template.querySelector(".ticker-name");
    const priceEl = template.querySelector(".price");
    const changeValueEl = template.querySelector(".change-value");
    const changePercentEl = template.querySelector(".change-percent");
    const updatedAtEl = template.querySelector(".updated-at");
    const removeBtn = template.querySelector(".remove-ticker-btn");
    const detailsLink = template.querySelector(".details-link");

    const price = Number.isFinite(quote.close) ? quote.close : null;
    const prevClose = Number.isFinite(quote.previousClose) ? quote.previousClose : null;
    const change = price != null && prevClose != null ? price - prevClose : null;
    const changePercent = change != null && prevClose
      ? (change / prevClose) * 100
      : null;

    const lastUpdateDate = parseTimestamp(quote.date, quote.time);

    symbolEl.textContent = symbol;
    nameEl.textContent = quote.name || "";
    priceEl.textContent = formatCurrency(price);

    const changeClass = determineChangeClass(change ?? 0);

    if (change != null) {
      changeValueEl.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}`;
    } else {
      changeValueEl.textContent = "--";
    }

    if (changePercent != null && Number.isFinite(changePercent)) {
      changePercentEl.textContent = `(${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%)`;
    } else {
      changePercentEl.textContent = "";
    }

    applyChangeStyles(changeValueEl, changeClass);
    applyChangeStyles(changePercentEl, changeClass);

    card.classList.remove("positive", "negative", "neutral");
    card.classList.add(changeClass);

    if (lastUpdateDate) {
      updatedAtEl.textContent = `Actualizado: ${formatDisplayDate(lastUpdateDate)} (UTC)`;
    } else {
      updatedAtEl.textContent = "Datos no disponibles";
    }

    removeBtn.addEventListener("click", () => {
      removeTicker(symbol);
    });

    detailsLink.href = buildDetailsUrl(symbol);

    tickerContainer.appendChild(template);
    renderedCount += 1;
  });

  if (renderedCount === 0) {
    const errorNode = errorTemplate.content.cloneNode(true);
    tickerContainer.appendChild(errorNode);
  }
}

async function removeTicker(symbol) {
  const nextTickers = selectedTickers.filter((value) => value !== symbol);
  if (nextTickers.length === selectedTickers.length) {
    return;
  }

  try {
    await persistTickersConfig(nextTickers);
    await fetchQuotes();
  } catch (error) {
    window.alert("No pudimos actualizar la lista de tickers. Intentá nuevamente.");
  }
}

async function promptAndAddTicker() {
  const input = window.prompt("Ingresá el ticker que querés seguir (ej: NVDA)");
  if (!input) {
    return;
  }

  const normalized = normalizeTicker(input);
  if (!normalized) {
    window.alert("No ingresaste ningún valor.");
    return;
  }

  if (!isValidTicker(normalized)) {
    window.alert("El ticker puede contener letras, números, punto o guion y hasta 10 caracteres.");
    return;
  }

  if (selectedTickers.includes(normalized)) {
    window.alert("Ese ticker ya está en la lista.");
    return;
  }

  const nextTickers = [...selectedTickers, normalized];

  try {
    await persistTickersConfig(nextTickers);
    await fetchQuotes();
  } catch (error) {
    window.alert("No pudimos guardar el ticker nuevo. Intentá nuevamente.");
  }
}

function updateLastUpdatedLabel(date = new Date()) {
  lastUpdatedEl.textContent = `Última actualización: ${date.toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}

async function fetchQuotes() {
  if (selectedTickers.length === 0) {
    renderEmptyState();
    updateActionButtonsState();
    return;
  }

  if (isFetchingQuotes) {
    return;
  }

  const url = `${API_URL}?symbols=${selectedTickers.join(",")}`;

  try {
    isFetchingQuotes = true;
    refreshBtn.textContent = "Actualizando...";
    updateActionButtonsState();

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const quotes = data?.quotes || [];
    renderTickers(quotes);
    updateLastUpdatedLabel();
  } catch (error) {
    console.error("Error al obtener cotizaciones", error);
    tickerContainer.innerHTML = "";
    const errorNode = errorTemplate.content.cloneNode(true);
    tickerContainer.appendChild(errorNode);
    lastUpdatedEl.textContent = "Última actualización: error";
  } finally {
    isFetchingQuotes = false;
    refreshBtn.textContent = "Actualizar ahora";
    updateActionButtonsState();
  }
}

function scheduleAutoRefresh() {
  if (refreshTimerId) {
    clearInterval(refreshTimerId);
  }
  refreshTimerId = setInterval(fetchQuotes, REFRESH_INTERVAL_MS);
}

refreshBtn.addEventListener("click", () => {
  if (!refreshBtn.disabled) {
    fetchQuotes();
  }
});

addTickerBtn.addEventListener("click", () => {
  if (!addTickerBtn.disabled) {
    promptAndAddTicker();
  }
});

updateActionButtonsState();

(async function init() {
  await loadTickersConfig();
  await fetchQuotes();
  scheduleAutoRefresh();
})();
