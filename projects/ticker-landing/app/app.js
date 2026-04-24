const TICKERS = ["NVDA", "PLTR", "QQQ", "SPY"];

const API_URL = "/api/quotes";
const REFRESH_INTERVAL_MS = 60_000; // 1 minuto
const tickerContainer = document.getElementById("tickers");
const refreshBtn = document.getElementById("refresh-btn");
const lastUpdatedEl = document.getElementById("last-updated");

const tickerTemplate = document.getElementById("ticker-template");
const errorTemplate = document.getElementById("error-template");
let refreshTimerId = null;

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

  if (!Array.isArray(quotes) || quotes.length === 0) {
    const errorNode = errorTemplate.content.cloneNode(true);
    tickerContainer.appendChild(errorNode);
    return;
  }

  quotes.forEach((quote) => {
    const template = tickerTemplate.content.cloneNode(true);

    const card = template.querySelector(".ticker-card");
    const symbolEl = template.querySelector(".ticker-symbol");
    const nameEl = template.querySelector(".ticker-name");
    const priceEl = template.querySelector(".price");
    const changeValueEl = template.querySelector(".change-value");
    const changePercentEl = template.querySelector(".change-percent");
    const updatedAtEl = template.querySelector(".updated-at");

    const price = quote.close;
    const prevClose = quote.previousClose;
    const change = price != null && prevClose != null ? price - prevClose : null;
    const changePercent = change != null && prevClose
      ? (change / prevClose) * 100
      : null;

    const lastUpdateDate = parseTimestamp(quote.date, quote.time);

    symbolEl.textContent = quote.symbol;
    nameEl.textContent = quote.name || "";
    priceEl.textContent = formatCurrency(price);

    const changeClass = determineChangeClass(change || 0);

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

    updatedAtEl.textContent = `Actualizado: ${formatDisplayDate(lastUpdateDate)} (UTC)`;

    tickerContainer.appendChild(template);
  });
}

function updateLastUpdatedLabel(date = new Date()) {
  lastUpdatedEl.textContent = `Última actualización: ${date.toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}

async function fetchQuotes() {
  const url = `${API_URL}?symbols=${TICKERS.join(",")}`;

  try {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Actualizando...";
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
    refreshBtn.disabled = false;
    refreshBtn.textContent = "Actualizar ahora";
  }
}

function scheduleAutoRefresh() {
  if (refreshTimerId) {
    clearInterval(refreshTimerId);
  }
  refreshTimerId = setInterval(fetchQuotes, REFRESH_INTERVAL_MS);
}

refreshBtn.addEventListener("click", () => {
  fetchQuotes();
});

fetchQuotes();
scheduleAutoRefresh();
