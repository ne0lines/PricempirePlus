(function (createFeature) {
  const feature = createFeature();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      formatUsd: feature.formatUsd,
      summarizePriceRange: feature.summarizePriceRange,
    };
    return;
  }

  feature.init();
})(function () {
  const rangeUiId = "pepp-all-time-range";
  const chartPath = "/api-data/v1/item/chart";

  function formatUsd(cents) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }

  function summarizePriceRange(points, currentCents) {
    const prices = points
      .map((point) => point && point[1])
      .filter((cents) => Number.isFinite(cents) && cents > 0);
    if (!prices.length || !Number.isFinite(currentCents)) {
      return null;
    }

    const lowCents = Math.min(...prices);
    const highCents = Math.max(...prices);
    const spread = highCents - lowCents;
    const position = spread === 0 ? 100 : ((currentCents - lowCents) / spread) * 100;

    return {
      lowCents,
      highCents,
      positionPercent: Math.round(Math.max(0, Math.min(100, position)) * 100) / 100,
    };
  }

  function findAllTimeChartUrl() {
    const entries = performance.getEntriesByType("resource");
    const chartEntry = entries.slice().reverse().find((entry) => {
      try {
        return new URL(entry.name).pathname === chartPath;
      } catch (_error) {
        return false;
      }
    });
    if (!chartEntry) {
      return null;
    }

    const url = new URL(chartEntry.name);
    url.searchParams.set("days", "10000");
    return url.toString();
  }

  function findCurrentPrice() {
    const priceHistory = document.getElementById("price-history");
    if (!priceHistory) {
      return null;
    }

    const priceNode = Array.from(priceHistory.querySelectorAll("span")).find((node) =>
      /^\$[\d,]+\.\d{2}$/.test((node.textContent || "").trim())
    );
    if (!priceNode || !priceNode.parentElement || !priceNode.parentElement.parentElement) {
      return null;
    }

    const dollars = Number.parseFloat(priceNode.textContent.replace(/[$,]/g, ""));
    if (!Number.isFinite(dollars)) {
      return null;
    }

    return {
      cents: Math.round(dollars * 100),
      priceBlock: priceNode.parentElement.parentElement,
      priceRow: priceNode.parentElement,
    };
  }

  function metric(label, value, labelAfterValue) {
    const item = document.createElement("span");
    item.style.cssText =
      "display:inline-flex;align-items:center;justify-content:center;align-self:stretch;gap:4px;" +
      "font-size:12px;line-height:1;color:#94a3b8;white-space:nowrap;";

    const name = document.createElement("span");
    name.textContent = label;
    name.style.cssText =
      "display:inline-flex;align-items:center;line-height:1;font-weight:600;" +
      "font-size:12px;text-transform:uppercase;letter-spacing:.04em;";

    const price = document.createElement("strong");
    price.textContent = value;
    price.style.cssText =
      "display:inline-flex;align-items:center;line-height:1;color:#e2e8f0;" +
      "font-size:12px;font-weight:600;";

    if (labelAfterValue) {
      item.append(price, name);
    } else {
      item.append(name, price);
    }
    return item;
  }

  function renderPriceRange(currentPrice, summary) {
    document.getElementById(rangeUiId)?.remove();

    const range = document.createElement("span");
    range.id = rangeUiId;
    range.style.cssText =
      "display:inline-flex;align-items:center;align-self:stretch;gap:8px;flex:1 1 auto;" +
      "max-width:75%;min-width:0;margin-left:auto;justify-content:flex-end;white-space:nowrap;";

    const track = document.createElement("span");
    track.style.cssText =
      "position:relative;display:block;flex:1 1 auto;min-width:64px;height:6px;" +
      "border-radius:999px;background:#334155;overflow:visible;";
    track.setAttribute(
      "aria-label",
      `Current price is ${summary.positionPercent.toFixed(1)}% between ATL and ATH`
    );

    const fill = document.createElement("span");
    fill.style.cssText =
      `display:block;height:100%;width:${summary.positionPercent}%;border-radius:999px;background:#38bdf8;`;

    const marker = document.createElement("span");
    marker.title = `Current price: ${formatUsd(currentPrice.cents)}`;
    marker.style.cssText =
      `position:absolute;left:${summary.positionPercent}%;top:50%;width:12px;height:12px;` +
      "transform:translate(-50%,-50%);border-radius:999px;background:#38bdf8;" +
      "border:2px solid #0f172a;box-shadow:0 0 0 1px #38bdf8;";

    track.append(fill, marker);
    range.append(
      metric("ATL", formatUsd(summary.lowCents)),
      track,
      metric("ATH", formatUsd(summary.highCents), true)
    );
    currentPrice.priceRow.style.alignItems = "stretch";
    currentPrice.priceRow.style.width = "100%";
    currentPrice.priceRow.style.flexWrap = "nowrap";
    currentPrice.priceRow.appendChild(range);
  }

  async function enhancePriceHistory() {
    const currentPrice = findCurrentPrice();
    const chartUrl = findAllTimeChartUrl();
    if (!currentPrice || !chartUrl) {
      return false;
    }

    const response = await fetch(chartUrl, { credentials: "same-origin" });
    if (!response.ok) {
      return false;
    }

    const points = await response.json();
    const summary = summarizePriceRange(points, currentPrice.cents);
    if (!summary) {
      return false;
    }

    renderPriceRange(currentPrice, summary);
    return true;
  }

  function init() {
    let attempts = 0;
    let running = false;
    const maxAttempts = 480;

    async function apply() {
      if (running) {
        return;
      }
      running = true;
      attempts += 1;

      try {
        if (await enhancePriceHistory()) {
          clearInterval(intervalId);
          observer.disconnect();
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          observer.disconnect();
        }
      } catch (_error) {
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          observer.disconnect();
        }
      } finally {
        running = false;
      }
    }

    const observer = new MutationObserver(() => {
      apply();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    const intervalId = setInterval(apply, 250);
    apply();
  }

  return {
    formatUsd,
    init,
    summarizePriceRange,
  };
});
