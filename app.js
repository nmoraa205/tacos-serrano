const currency = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0
});

const form = document.querySelector('#calcForm');
const inputs = {
  ingredients: document.querySelector('#foodCost'),
  portions: document.querySelector('#portions'),
  wastage: document.querySelector('#wastage'),
  markup: document.querySelector('#markup'),
  platform: document.querySelector('#platform'),
  overhead: document.querySelector('#overhead'),
  orders: document.querySelector('#orders')
};

const ui = {
  priceResult: document.querySelector('#priceResult'),
  portionCost: document.querySelector('#portionCost'),
  marginResult: document.querySelector('#marginResult'),
  breakevenResult: document.querySelector('#breakevenResult'),
  heroPrice: document.querySelector('#heroPrice'),
  heroFood: document.querySelector('#heroFoodCost'),
  heroMargin: document.querySelector('#heroMargin'),
  heroBreakEven: document.querySelector('#heroBreakEven')
};

const navToggle = document.querySelector('#navToggle');
const siteNav = document.querySelector('#siteNav');
const faqButtons = document.querySelectorAll('.faq__question');
const downloadBtn = document.querySelector('#downloadReport');
const shareBtn = document.querySelector('#shareResult');
const yearEl = document.querySelector('#currentYear');

function toNumber(input, fallback = 0) {
  const value = parseFloat(String(input?.value ?? '').replace(/,/g, ''));
  return Number.isFinite(value) ? value : fallback;
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) return '—';
  return currency.format(Math.round(value));
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value)}%`;
}

function calculate() {
  const ingredients = Math.max(0, toNumber(inputs.ingredients));
  const portions = Math.max(1, toNumber(inputs.portions, 1));
  const wastageRate = Math.max(0, toNumber(inputs.wastage));
  const markupRate = Math.max(0, toNumber(inputs.markup));
  const platformRate = Math.max(0, toNumber(inputs.platform));
  const overhead = Math.max(0, toNumber(inputs.overhead));
  const orders = Math.max(1, toNumber(inputs.orders, 1));

  const wastageMultiplier = 1 + (wastageRate / 100);
  const platformMultiplier = platformRate >= 100 ? 1 : 1 - (platformRate / 100);
  const markupMultiplier = 1 + (markupRate / 100);

  const ingredientCost = (ingredients / portions) * wastageMultiplier;
  const overheadPerPortion = overhead / orders;

  const baseCostBeforeCommission = ingredientCost + overheadPerPortion;
  const costIncludingCommission = platformMultiplier > 0
    ? baseCostBeforeCommission / platformMultiplier
    : baseCostBeforeCommission * 2;

  const recommendedPrice = costIncludingCommission * markupMultiplier;

  const platformCost = recommendedPrice * (platformRate / 100);
  const totalCostPerUnit = ingredientCost + overheadPerPortion + platformCost;
  const grossMargin = recommendedPrice - totalCostPerUnit;
  const grossMarginPercent = recommendedPrice > 0
    ? (grossMargin / recommendedPrice) * 100
    : 0;

  const breakEven = grossMargin > 0 && overhead > 0
    ? Math.ceil(overhead / grossMargin)
    : null;

  ui.priceResult.textContent = formatCurrency(recommendedPrice);
  ui.portionCost.textContent = formatCurrency(totalCostPerUnit);
  const marginText = `${formatCurrency(grossMargin)} (${formatPercent(grossMarginPercent)})`;
  ui.marginResult.textContent = marginText;
  ui.breakevenResult.textContent = breakEven ? `${breakEven} platos` : '—';

  ui.heroPrice.textContent = formatCurrency(recommendedPrice);
  const foodPercent = recommendedPrice > 0 ? (ingredientCost / recommendedPrice) : 0;
  ui.heroFood.textContent = formatPercent(foodPercent * 100);
  ui.heroMargin.textContent = formatPercent(grossMarginPercent);
  ui.heroBreakEven.textContent = breakEven ? `${breakEven} platos` : '—';

  return {
    recommendedPrice,
    totalCostPerUnit,
    grossMargin,
    grossMarginPercent,
    breakEven
  };
}

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculate();
  });

  Object.values(inputs).forEach((input) => {
    input?.addEventListener('input', () => {
      const results = calculate();
      if (results) {
        ui.priceResult.classList.add('is-updated');
        setTimeout(() => ui.priceResult.classList.remove('is-updated'), 320);
      }
    });
  });

  calculate();
}

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const expanded = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

faqButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq__item');
    if (!item) return;
    item.classList.toggle('active');
  });
});

if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    const { recommendedPrice, totalCostPerUnit, grossMargin, grossMarginPercent, breakEven } = calculate();
    const lines = [
      'Resumen de simulación CostoChef',
      `Precio sugerido: ${formatCurrency(recommendedPrice)}`,
      `Costo por porción (ingredientes + gastos): ${formatCurrency(totalCostPerUnit)}`,
      `Margen bruto estimado: ${formatCurrency(grossMargin)} (${formatPercent(grossMarginPercent)})`,
      `Punto de equilibrio: ${breakEven ? `${breakEven} platos` : 'No aplica'}`,
      '',
      'Generado con la calculadora instantánea de CostoChef.'
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'costochef-resumen.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const { recommendedPrice, grossMarginPercent } = calculate();
    const message = `Precio sugerido: ${formatCurrency(recommendedPrice)}\nMargen bruto: ${formatPercent(grossMarginPercent)}\nCalculado con CostoChef.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Resultados CostoChef',
          text: message
        });
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error('No se pudo compartir', err);
        }
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(message);
        shareBtn.textContent = 'Copiado ✅';
        setTimeout(() => (shareBtn.textContent = 'Compartir'), 1800);
      } catch (err) {
        console.error('No se pudo copiar', err);
      }
    } else {
      alert(message);
    }
  });
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(console.error);
  });
}
