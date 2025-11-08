const FALLBACK_CURRENCY = "₡";
const STORAGE_KEYS = {
  cart: "ts_cart",
  customer: "ts_customer"
};
const DEFAULT_PROTEINS = ["Carne", "Pollo", "Sin proteína"];
const DEFAULT_TOPPINGS = [
  { id: "aderezo", label: "Aderezo", default: true },
  { id: "queso", label: "Queso", default: true },
  { id: "salsas", label: "Salsas", default: true }
];

const qs = (selector, el = document) => el.querySelector(selector);
const qsa = (selector, el = document) => Array.from(el.querySelectorAll(selector));

const DOM = {
  products: qs("#products"),
  tabs: qs("#categoryTabs"),
  search: qs("#searchInput"),
  cartCount: qs("#cartCount"),
  cartTotal: qs("#cartTotal"),
  cartCurrency: qs("#cartCurrency"),
  cartModal: qs("#cartModal"),
  cartItems: qs("#cartItems"),
  cartTotalModal: qs("#cartTotalModal"),
  cartModalCurrency: qs("#cartModalCurrency"),
  orderNotes: qs("#orderNotes"),
  custName: qs("#custName"),
  deliveryType: qs("#deliveryType"),
  custAddress: qs("#custAddress"),
  payMethod: qs("#payMethod"),
  brandName: qs("#brand-name"),
  brandLogo: qs("#brand-logo"),
  brandTagline: qs("#brand-tagline")
};

const optionsModal = {
  wrapper: qs("#itemOptionsModal"),
  title: qs("#optTitle"),
  body: qs("#optBody"),
  closeBtn: qs("#optCloseBtn"),
  addBtn: qs("#optAddBtn"),
  qtyInput: qs("#optQty"),
  qtyMinus: qs("#optQtyMinus"),
  qtyPlus: qs("#optQtyPlus")
};

let DATA = null;
let currencySymbol = FALLBACK_CURRENCY;
let cart = loadCart();
let currentItemWithOptions = null;

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return parsed ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function loadCart() {
  const stored = localStorage.getItem(STORAGE_KEYS.cart);
  const parsed = safeParse(stored, []);
  return Array.isArray(parsed) ? parsed : [];
}

function persistCart() {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "opcion";
}

function cloneDefaultOptions() {
  return {
    protein: [...DEFAULT_PROTEINS],
    toppings: DEFAULT_TOPPINGS.map(t => ({ ...t })),
    selects: [],
    freeNote: null
  };
}

function normalizeTopping(raw) {
  if (!raw) return null;
  if (typeof raw === "string") {
    return {
      id: slugify(raw),
      label: raw,
      default: true
    };
  }
  const label = raw.label || raw.name || raw.id || "Opción";
  return {
    id: raw.id || slugify(label),
    label,
    default: raw.default !== false
  };
}

function normalizeOptions(raw, meta = {}) {
  if (raw === false) {
    return null;
  }

  const base = meta.defaults === false ? { protein: [], toppings: [], selects: [], freeNote: null } : cloneDefaultOptions();
  if (!raw) {
    return base;
  }

  const normalized = { ...base };

  if (Array.isArray(raw)) {
    const options = raw.map(String).filter(Boolean);
    if (options.length) {
      const label = meta.labelOverride || "Elige una opción";
      const selectId = `optSelect_${slugify(meta.itemId || label)}`;
      normalized.selects.push({
        id: selectId,
        label,
        options,
        multiple: Boolean(meta.multiple)
      });
    }
    return normalized;
  }

  if (Array.isArray(raw.protein)) {
    normalized.protein = raw.protein.map(String).filter(Boolean);
  } else if (raw.protein === false || raw.protein === null) {
    normalized.protein = [];
  }

  if (Array.isArray(raw.toppings)) {
    normalized.toppings = raw.toppings.map(normalizeTopping).filter(Boolean);
  } else if (raw.toppings === false || raw.toppings === null) {
    normalized.toppings = [];
  }

  const selectSources = [];
  if (Array.isArray(raw.selects)) {
    selectSources.push(...raw.selects);
  }
  if (Array.isArray(raw.extraSelect)) {
    selectSources.push({ options: raw.extraSelect, label: raw.extraLabel || raw.labelOverride });
  } else if (raw.extraSelect && typeof raw.extraSelect === "object") {
    selectSources.push(raw.extraSelect);
  }

  selectSources
    .map(source => {
      if (!source) return null;
      const options = Array.isArray(source.options) ? source.options.map(String).filter(Boolean) : [];
      if (!options.length) return null;
      const label = source.label || meta.labelOverride || "Elige una opción";
      return {
        id: source.id || `optSelect_${slugify(source.name || label || meta.itemId || "extra")}`,
        label,
        options,
        multiple: Boolean(source.multiple)
      };
    })
    .filter(Boolean)
    .forEach(select => {
      normalized.selects.push(select);
    });

  if (raw.freeNote) {
    if (typeof raw.freeNote === "object") {
      normalized.freeNote = {
        id: raw.freeNote.id || `optNote_${slugify(raw.freeNote.label || meta.itemId || "nota")}`,
        label: raw.freeNote.label || "Notas",
        placeholder: raw.freeNote.placeholder || ""
      };
    } else {
      normalized.freeNote = {
        id: `optNote_${slugify(meta.itemId || "nota")}`,
        label: typeof raw.freeNote === "string" ? raw.freeNote : "Notas",
        placeholder: ""
      };
    }
  } else if (meta.freeNote) {
    normalized.freeNote = {
      id: `optNote_${slugify(meta.itemId || "nota")}`,
      label: typeof meta.freeNote === "string" ? meta.freeNote : "Notas",
      placeholder: ""
    };
  }

  return normalized;
}

function hasSelectableOptions(opts) {
  if (!opts) return false;
  const protein = Array.isArray(opts.protein) && opts.protein.length > 0;
  const toppings = Array.isArray(opts.toppings) && opts.toppings.length > 0;
  const selects = Array.isArray(opts.selects) && opts.selects.some(sel => Array.isArray(sel.options) && sel.options.length);
  return protein || toppings || selects || Boolean(opts.freeNote);
}

function money(value) {
  return new Intl.NumberFormat("es-CR").format(value || 0);
}

function applyCurrency() {
  if (DOM.cartCurrency) {
    DOM.cartCurrency.textContent = currencySymbol;
  }
  if (DOM.cartModalCurrency) {
    DOM.cartModalCurrency.textContent = currencySymbol;
  }
}

function applyBranding(brand = {}) {
  if (!brand) return;
  if (brand.name && DOM.brandName) {
    DOM.brandName.textContent = brand.name;
  }
  if (brand.logo && DOM.brandLogo) {
    DOM.brandLogo.src = brand.logo;
    DOM.brandLogo.alt = brand.name || "Logo";
  }
  if (brand.tagline && DOM.brandTagline) {
    DOM.brandTagline.textContent = brand.tagline;
  }

  const rootStyle = document.documentElement?.style;
  if (!rootStyle) return;

  if (brand.primary) {
    rootStyle.setProperty("--primary", brand.primary);
    rootStyle.setProperty("--ts-yellow", brand.primary);
  }
  if (brand.accent) {
    rootStyle.setProperty("--accent", brand.accent);
    rootStyle.setProperty("--ts-red", brand.accent);
  }
  if (brand.alt) {
    rootStyle.setProperty("--ts-orange", brand.alt);
  }
  if (brand.dark) {
    rootStyle.setProperty("--dark", brand.dark);
    rootStyle.setProperty("--ts-ink", brand.dark);
  }
  if (brand.light) {
    rootStyle.setProperty("--light", brand.light);
    rootStyle.setProperty("--ts-light", brand.light);
  }

  const themeMeta = qs('meta[name="theme-color"]');
  if (themeMeta && brand.accent) {
    themeMeta.setAttribute("content", brand.accent);
  }
}

async function loadData() {
  const res = await fetch(`data.json?_=${Date.now()}`);
  if (!res.ok) {
    throw new Error("No se pudo cargar data.json");
  }
  const data = await res.json();
  DATA = data;

  if (data.currency) {
    currencySymbol = data.currency;
    applyCurrency();
  }

  if (data.brand) {
    applyBranding(data.brand);
  }

  if (data.whatsapp_phone) {
    window.__WAPP = String(data.whatsapp_phone);
  } else if (!window.__WAPP) {
    window.__WAPP = "50624610007";
  }

  renderTabs();
  const firstCategory = data.categories?.[0]?.id || null;
  renderProducts(firstCategory);
  updateCartBadge();
}

function renderTabs() {
  if (!DOM.tabs) return;
  DOM.tabs.innerHTML = "";
  (DATA?.categories || []).forEach((cat, idx) => {
    const button = document.createElement("button");
    button.className = "tab" + (idx === 0 ? " active" : "");
    button.textContent = cat.name;
    button.dataset.cat = cat.id;
    button.addEventListener("click", () => {
      qsa(".tab", DOM.tabs).forEach(tab => tab.classList.remove("active"));
      button.classList.add("active");
      renderProducts(cat.id);
    });
    DOM.tabs.appendChild(button);
  });
}

function renderProducts(categoryId) {
  if (!DOM.products) return;
  DOM.products.innerHTML = "";
  const term = (DOM.search?.value || "").toLowerCase();
  const items = [];

  (DATA?.categories || []).forEach(category => {
    if (categoryId && category.id !== categoryId) {
      return;
    }
    (category.items || []).forEach(item => {
      const normalizedOptions = normalizeOptions(item.options, {
        labelOverride: item.optionLabel || item.option_label,
        itemId: item.id,
        multiple: item.optionMultiple || item.option_multiple,
        defaults: item.useDefaultOptions,
        freeNote: item.freeNoteLabel || item.free_note_label
      });
      items.push({
        ...item,
        category,
        normalizedOptions,
        hasOptions: hasSelectableOptions(normalizedOptions)
      });
    });
  });

  const filtered = term
    ? items.filter(item => item.name.toLowerCase().includes(term))
    : items;

  filtered.forEach(item => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${item.img || "assets/placeholder.jpg"}" alt="${item.name}">
      <div class="p16">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
          <div>
            <div style="font-weight:700">${item.name}</div>
            <div class="price">${currencySymbol}${money(item.price)}</div>
          </div>
          <button class="cta add-btn">Agregar</button>
        </div>
      </div>
    `;

    const addBtn = qs(".add-btn", card);
    addBtn?.addEventListener("click", () => {
      if (item.hasOptions) {
        openItemOptions(item);
      } else {
        addToCart({ id: item.id, name: item.name, price: item.price, quantity: 1, note: "" });
        openCartButtonPulse();
      }
    });

    DOM.products.appendChild(card);
  });
}

function openCartButtonPulse() {
  const footerBtn = qs("#openCartBtnFooter");
  if (!footerBtn) return;
  footerBtn.classList.add("pulse");
  setTimeout(() => footerBtn.classList.remove("pulse"), 400);
}

function openItemOptions(item) {
  currentItemWithOptions = item;
  if (optionsModal.title) {
    optionsModal.title.textContent = item.name;
  }
  if (optionsModal.qtyInput) {
    optionsModal.qtyInput.value = 1;
  }

  const opts = item.normalizedOptions || cloneDefaultOptions();
  let html = "";

  if (Array.isArray(opts.protein) && opts.protein.length) {
    const selectId = "optProtein";
    html += `
      <div class="option-group">
        <h4>Proteína</h4>
        <select id="${selectId}" class="opt-protein-select">
          ${opts.protein.map(protein => `<option value="${protein}">${protein}</option>`).join("")}
        </select>
      </div>
    `;
  }

  if (Array.isArray(opts.toppings) && opts.toppings.length) {
    html += `
      <div class="option-group">
        <h4>Preferencias</h4>
        <div class="opt-toppings">
          ${opts.toppings
            .map(topping => `
              <label class="opt-chip">
                <input type="checkbox" class="opt-top" value="${topping.id}" data-label="${topping.label}" ${topping.default !== false ? "checked" : ""}>
                <span>${topping.label}</span>
              </label>
            `)
            .join("")}
        </div>
      </div>
    `;
  }

  if (Array.isArray(opts.selects) && opts.selects.length) {
    opts.selects.forEach((select, idx) => {
      const selectId = select.id || `optSelect_${idx}`;
      html += `
        <div class="option-group">
          <h4>${select.label}</h4>
          <select id="${selectId}" ${select.multiple ? "multiple" : ""} data-note-label="${select.label}">
            ${select.options.map(option => `<option value="${option}">${option}</option>`).join("")}
          </select>
        </div>
      `;
    });
  }

  if (opts.freeNote) {
    html += `
      <div class="option-group">
        <h4>${opts.freeNote.label}</h4>
        <input id="${opts.freeNote.id}" type="text" placeholder="${opts.freeNote.placeholder || ""}" />
      </div>
    `;
  }

  optionsModal.body.innerHTML = html || "<p>Personaliza tu pedido como prefieras.</p>";
  optionsModal.wrapper?.classList.add("show");
  optionsModal.wrapper?.setAttribute("aria-hidden", "false");
}

function closeItemOptions() {
  optionsModal.wrapper?.classList.remove("show");
  optionsModal.wrapper?.setAttribute("aria-hidden", "true");
  currentItemWithOptions = null;
}

function collectOptionNote(opts) {
  const parts = [];

  const proteinSelect = qs("#optProtein", optionsModal.body);
  if (proteinSelect && opts.protein?.length) {
    const value = proteinSelect.value;
    if (value) {
      parts.push(value);
    }
  }

  if (opts.toppings?.length) {
    const disabled = qsa(".opt-top", optionsModal.body)
      .filter(input => !input.checked && input.dataset.label)
      .map(input => input.dataset.label.trim())
      .filter(Boolean);

    if (disabled.length === 1) {
      parts.push(`sin ${disabled[0].toLowerCase()}`);
    } else if (disabled.length > 1) {
      const last = disabled.pop();
      parts.push(`sin ${disabled.map(str => str.toLowerCase()).join(", ")} y ${last.toLowerCase()}`);
    }
  }

  if (opts.selects?.length) {
    opts.selects.forEach(select => {
      const el = qs(`#${select.id}`, optionsModal.body);
      if (!el) return;
      const label = el.dataset.noteLabel || select.label;
      if (select.multiple) {
        const selected = Array.from(el.selectedOptions).map(opt => opt.value).filter(Boolean);
        if (selected.length) {
          parts.push(`${label}: ${selected.join(", ")}`);
        }
      } else if (el.value) {
        parts.push(`${label}: ${el.value}`);
      }
    });
  }

  if (opts.freeNote) {
    const noteInput = qs(`#${opts.freeNote.id}`, optionsModal.body);
    if (noteInput && noteInput.value.trim()) {
      parts.push(noteInput.value.trim());
    }
  }

  return parts.join(", ");
}

function addToCart(item) {
  const key = `${item.id}::${item.note || ""}`;
  const found = cart.find(cartItem => `${cartItem.id}::${cartItem.note || ""}` === key);
  if (found) {
    found.quantity = (found.quantity || 1) + (item.quantity || 1);
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      note: item.note || "",
      quantity: item.quantity || 1
    });
  }
  persistCart();
  updateCartBadge();
}

function renderCart() {
  if (!DOM.cartItems) return;
  DOM.cartItems.innerHTML = "";

  if (!cart.length) {
    DOM.cartItems.innerHTML = "<p>Tu carrito está vacío.</p>";
  } else {
    cart.forEach((item, index) => {
      const line = document.createElement("div");
      line.className = "line";
      line.innerHTML = `
        <div>
          <div><strong>${item.name}</strong> x${item.quantity || 1} — ${currencySymbol}${money(item.price * (item.quantity || 1))}</div>
          ${item.note ? `<div class="note">(${item.note})</div>` : ""}
        </div>
        <div style="display:flex;gap:6px">
          <button class="icon-btn" data-act="minus">−</button>
          <button class="icon-btn" data-act="plus">+</button>
          <button class="icon-btn" data-act="del">🗑️</button>
        </div>
      `;

      const minusBtn = qs('[data-act="minus"]', line);
      const plusBtn = qs('[data-act="plus"]', line);
      const delBtn = qs('[data-act="del"]', line);

      minusBtn?.addEventListener("click", () => {
        item.quantity = Math.max(1, (item.quantity || 1) - 1);
        persistCart();
        renderCart();
        updateCartBadge();
      });

      plusBtn?.addEventListener("click", () => {
        item.quantity = (item.quantity || 1) + 1;
        persistCart();
        renderCart();
        updateCartBadge();
      });

      delBtn?.addEventListener("click", () => {
        cart.splice(index, 1);
        persistCart();
        renderCart();
        updateCartBadge();
      });

      DOM.cartItems.appendChild(line);
    });
  }

  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  if (DOM.cartTotalModal) {
    DOM.cartTotalModal.textContent = money(total);
  }
}

function updateCartBadge() {
  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalSum = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  if (DOM.cartCount) {
    DOM.cartCount.textContent = totalQty;
  }
  if (DOM.cartTotal) {
    DOM.cartTotal.textContent = money(totalSum);
  }

  applyCurrency();
}

function openCartModal() {
  renderCart();
  DOM.cartModal?.classList.add("show");
  DOM.cartModal?.setAttribute("aria-hidden", "false");
}

function closeCartModal() {
  DOM.cartModal?.classList.remove("show");
  DOM.cartModal?.setAttribute("aria-hidden", "true");
}

function initCartControls() {
  qs("#openCartBtn")?.addEventListener("click", openCartModal);
  qs("#openCartBtnFooter")?.addEventListener("click", openCartModal);
  qs("#closeCartBtn")?.addEventListener("click", closeCartModal);
  DOM.cartModal?.addEventListener("click", event => {
    if (event.target === DOM.cartModal) {
      closeCartModal();
    }
  });
  qs("#clearCartBtn")?.addEventListener("click", () => {
    cart = [];
    persistCart();
    renderCart();
    updateCartBadge();
  });

  optionsModal.closeBtn?.addEventListener("click", closeItemOptions);
  optionsModal.wrapper?.addEventListener("click", event => {
    if (event.target === optionsModal.wrapper) {
      closeItemOptions();
    }
  });

  optionsModal.qtyMinus?.addEventListener("click", () => {
    const current = parseInt(optionsModal.qtyInput?.value || "1", 10);
    if (optionsModal.qtyInput) {
      optionsModal.qtyInput.value = Math.max(1, current - 1);
    }
  });

  optionsModal.qtyPlus?.addEventListener("click", () => {
    const current = parseInt(optionsModal.qtyInput?.value || "1", 10);
    if (optionsModal.qtyInput) {
      optionsModal.qtyInput.value = Math.max(1, current + 1);
    }
  });

  optionsModal.addBtn?.addEventListener("click", () => {
    if (!currentItemWithOptions) return;
    const quantity = Math.max(1, parseInt(optionsModal.qtyInput?.value || "1", 10));
    const options = currentItemWithOptions.normalizedOptions || cloneDefaultOptions();
    const note = collectOptionNote(options);
    addToCart({
      id: currentItemWithOptions.id,
      name: currentItemWithOptions.name,
      price: currentItemWithOptions.price,
      quantity,
      note
    });
    closeItemOptions();
    openCartModal();
  });
}

function restoreCustomerInfo() {
  const stored = safeParse(localStorage.getItem(STORAGE_KEYS.customer), {});
  if (!stored) return;
  if (stored.name && DOM.custName) DOM.custName.value = stored.name;
  if (stored.delivery && DOM.deliveryType) DOM.deliveryType.value = stored.delivery;
  if (stored.address && DOM.custAddress) DOM.custAddress.value = stored.address;
  if (stored.payMethod && DOM.payMethod) DOM.payMethod.value = stored.payMethod;
}

function persistCustomerInfo() {
  const payload = {
    name: DOM.custName?.value || "",
    delivery: DOM.deliveryType?.value || "",
    address: DOM.custAddress?.value || "",
    payMethod: DOM.payMethod?.value || ""
  };
  localStorage.setItem(STORAGE_KEYS.customer, JSON.stringify(payload));
}

function initCustomerForm() {
  restoreCustomerInfo();
  const listeners = [
    [DOM.custName, "input"],
    [DOM.deliveryType, "change"],
    [DOM.custAddress, "input"],
    [DOM.payMethod, "change"]
  ];
  listeners.forEach(([field, event]) => {
    field?.addEventListener(event, persistCustomerInfo);
  });
}

function handleSendWhatsApp() {
  if (!cart.length) return;
  const lines = cart.map(item => `- ${item.name} x${item.quantity}${item.note ? ` (${item.note})` : ""} = ${currencySymbol}${money(item.price * item.quantity)}`);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const info = [
    `Nombre: ${DOM.custName?.value || "-"}`,
    `Entrega: ${DOM.deliveryType?.value || "-"}`,
    `Dirección/Mesa: ${DOM.custAddress?.value || "-"}`,
    `Pago: ${DOM.payMethod?.value || "-"}`
  ].join("\n");
  const note = DOM.orderNotes?.value ? `Notas: ${DOM.orderNotes.value}\n` : "";
  const text = `*Pedido Taco's Serrano*\n\n${lines.join("\n")}\n\n*Total:* ${currencySymbol}${money(total)}\n\n${info}\n\n${note}`;
  const url = `https://wa.me/${encodeURIComponent(window.__WAPP || "50624610007")}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener");
}

function initSearch() {
  DOM.search?.addEventListener("input", () => {
    const active = DOM.tabs?.querySelector(".tab.active");
    renderProducts(active?.dataset.cat || null);
  });
}

function initWhatsAppButton() {
  qs("#sendWhatsAppBtn")?.addEventListener("click", handleSendWhatsApp);
}

function init() {
  applyCurrency();
  updateCartBadge();
  initCartControls();
  initCustomerForm();
  initSearch();
  initWhatsAppButton();

  loadData().catch(error => {
    if (DOM.products) {
      DOM.products.innerHTML = `<div style="padding:16px;color:#b00">No se pudo cargar el menú (data.json). ${error.message || ""}</div>`;
    }
  });
}

init();
