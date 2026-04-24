const DEFAULT_SYMBOLS = ["NVDA", "PLTR", "QQQ", "SPY"];

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

exports.handler = async (event) => {
  const symbolsParam = event.queryStringParameters?.symbols;
  const symbols = symbolsParam
    ? symbolsParam.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean)
    : DEFAULT_SYMBOLS;

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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ quotes }),
    };
  } catch (error) {
    console.error("Error en función Netlify /quotes", error);
    return {
      statusCode: 502,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "No se pudo obtener la información de mercado",
        details: error.message,
      }),
    };
  }
};
