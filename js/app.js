import { fetchProducts } from "./api.js";
import {
  addToCart,
  calculateCart,
  removeFromCart,
  setCartQuantity,
  validateCartForConfirmation
} from "./cart.js";
import { restoreCart, saveCart } from "./storage.js";
import "./components/product-card.js";
import "./components/product-list.js";
import "./components/shopping-cart.js";

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const elements = {
  message: document.querySelector("#app-message"),
  loading: document.querySelector("#catalog-loading"),
  catalogError: document.querySelector("#catalog-error"),
  catalogErrorText: document.querySelector("#catalog-error-text"),
  retry: document.querySelector("#retry-catalog"),
  list: document.querySelector("#product-list"),
  filters: document.querySelector("#filters"),
  search: document.querySelector("#search"),
  category: document.querySelector("#category"),
  sort: document.querySelector("#sort"),
  availableOnly: document.querySelector("#available-only"),
  clearFilters: document.querySelector("#clear-filters"),
  productCount: document.querySelector("#product-count"),
  cart: document.querySelector("#shopping-cart"),
  headerUnits: document.querySelector("#header-units"),
  cartUnitCount: document.querySelector("#cart-unit-count"),
  summaryUnits: document.querySelector("#summary-units"),
  summarySubtotal: document.querySelector("#summary-subtotal"),
  summaryDiscount: document.querySelector("#summary-discount"),
  summaryTotal: document.querySelector("#summary-total"),
  confirmOrder: document.querySelector("#confirm-order"),
  dialog: document.querySelector("#order-dialog"),
  closeDialog: document.querySelector("#close-dialog"),
  orderConfirmation: document.querySelector("#order-confirmation")
};

let products = [];
let cart = new Map();
let catalogLoaded = false;
let messageTimer;

function showMessage(text, type = "info") {
  window.clearTimeout(messageTimer);
  elements.message.textContent = text;
  elements.message.className = `app-message ${type}`;
  elements.message.hidden = false;
  messageTimer = window.setTimeout(() => {
    elements.message.hidden = true;
  }, 6000);
}

function renderCart() {
  const summary = calculateCart(cart, products);
  elements.cart.summary = summary;
  elements.headerUnits.textContent = String(summary.units);
  elements.cartUnitCount.textContent = `${summary.units} ${summary.units === 1 ? "unidad" : "unidades"}`;
  elements.summaryUnits.textContent = String(summary.units);
  elements.summarySubtotal.textContent = money.format(summary.subtotal);
  elements.summaryDiscount.textContent = money.format(summary.discount);
  elements.summaryTotal.textContent = money.format(summary.total);
  elements.confirmOrder.disabled = !catalogLoaded;
}

function renderFilteredProducts() {
  const term = elements.search.value.trim().toLocaleLowerCase("es");
  const category = elements.category.value;
  const availableOnly = elements.availableOnly.checked;
  const sort = elements.sort.value;

  const filtered = products.filter((product) => {
    const matchesSearch = `${product.name} ${product.description}`.toLocaleLowerCase("es").includes(term);
    const matchesCategory = category === "" || product.category === category;
    const matchesAvailability = !availableOnly || (product.active && product.stock > 0);
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  if (sort === "asc") filtered.sort((first, second) => first.price - second.price || first.id - second.id);
  if (sort === "desc") filtered.sort((first, second) => second.price - first.price || first.id - second.id);

  elements.list.dataset.catalogEmpty = String(catalogLoaded && products.length === 0);
  elements.list.products = filtered;
  elements.productCount.textContent = catalogLoaded
    ? `${filtered.length} ${filtered.length === 1 ? "producto" : "productos"}`
    : "";
}

function renderCategories() {
  const selected = elements.category.value;
  const categories = [...new Set(products.map((product) => product.category))]
    .sort((first, second) => first.localeCompare(second, "es"));
  elements.category.replaceChildren(new Option("Todas las categorías", ""));
  for (const category of categories) {
    elements.category.add(new Option(category, category));
  }
  elements.category.value = categories.includes(selected) ? selected : "";
}

function persistCart() {
  const result = saveCart(cart);
  if (!result.ok) {
    showMessage("No se pudo guardar el carrito en este navegador. Puedes continuar, pero no se conservará al recargar.", "warning");
  }
}

function handleProductAdd(event) {
  try {
    cart = addToCart(cart, event.detail?.productId, products);
    persistCart();
    renderCart();
    showMessage("Producto agregado al carrito.", "success");
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function handleCartChange(event) {
  const { action, productId } = event.detail ?? {};
  try {
    const currentQuantity = cart.get(productId);
    if (!Number.isInteger(currentQuantity)) {
      throw new Error("El producto ya no está en el carrito.");
    }

    if (action === "remove") {
      cart = removeFromCart(cart, productId);
    } else if (action === "increase") {
      cart = setCartQuantity(cart, productId, currentQuantity + 1, products);
    } else if (action === "decrease") {
      cart = setCartQuantity(cart, productId, currentQuantity - 1, products);
    } else {
      throw new Error("La operación solicitada no es válida.");
    }

    persistCart();
    renderCart();
    if (action === "remove") showMessage("Producto eliminado del carrito.", "success");
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function handleClearCart() {
  if (cart.size === 0) return;
  cart = new Map();
  persistCart();
  renderCart();
  showMessage("El carrito se vació.", "success");
}

function createOrderId() {
  if (typeof crypto.randomUUID === "function") return `TS-${crypto.randomUUID()}`;
  return `TS-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function appendOrderLine(parent, label, value, className = "") {
  const row = document.createElement("div");
  row.className = `order-line ${className}`.trim();
  const title = document.createElement("span");
  title.textContent = label;
  const amount = document.createElement("strong");
  amount.textContent = value;
  row.append(title, amount);
  parent.append(row);
}

function confirmOrder() {
  try {
    validateCartForConfirmation(cart, products);
    const summary = calculateCart(cart, products);
    const orderId = createOrderId();
    elements.orderConfirmation.replaceChildren();

    const success = document.createElement("p");
    success.className = "confirmation-message";
    success.textContent = "Pedido confirmado correctamente.";
    const id = document.createElement("p");
    id.className = "order-id";
    id.textContent = `Identificador: ${orderId}`;
    const lines = document.createElement("ul");
    lines.className = "order-lines";
    for (const line of summary.lines) {
      const item = document.createElement("li");
      item.textContent = `${line.quantity} × ${line.product.name} — ${money.format(line.subtotal)}`;
      lines.append(item);
    }
    const totals = document.createElement("div");
    totals.className = "order-totals";
    appendOrderLine(totals, "Subtotal", money.format(summary.subtotal));
    appendOrderLine(totals, "Descuento", `−${money.format(summary.discount)}`);
    appendOrderLine(totals, "Total", money.format(summary.total), "order-grand-total");
    elements.orderConfirmation.append(success, id, lines, totals);

    cart = new Map();
    persistCart();
    renderCart();
    elements.dialog.showModal();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function loadCatalog() {
  elements.loading.hidden = false;
  elements.catalogError.hidden = true;
  elements.list.hidden = true;
  elements.retry.disabled = true;

  try {
    products = await fetchProducts();
    catalogLoaded = true;
    const restored = restoreCart(products);
    cart = restored.cart;
    renderCategories();
    renderFilteredProducts();
    renderCart();
    if (restored.warning) showMessage(restored.warning, "warning");
  } catch (error) {
    products = [];
    catalogLoaded = false;
    renderFilteredProducts();
    renderCart();
    elements.catalogErrorText.textContent = error instanceof TypeError
      ? "No se pudo conectar con el catálogo. Comprueba que la aplicación se esté ejecutando desde un servidor HTTP local."
      : error.message || "Ocurrió un error al cargar el catálogo.";
    elements.catalogError.hidden = false;
  } finally {
    elements.loading.hidden = true;
    elements.list.hidden = !catalogLoaded;
    elements.retry.disabled = false;
  }
}

elements.filters.addEventListener("input", renderFilteredProducts);
elements.filters.addEventListener("change", renderFilteredProducts);
elements.clearFilters.addEventListener("click", () => {
  elements.filters.reset();
  renderFilteredProducts();
});
elements.retry.addEventListener("click", loadCatalog);
elements.list.addEventListener("product:add", handleProductAdd);
elements.cart.addEventListener("cart:change", handleCartChange);
elements.cart.addEventListener("cart:clear", handleClearCart);
elements.confirmOrder.addEventListener("click", confirmOrder);
elements.closeDialog.addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});

renderCart();
loadCatalog();
