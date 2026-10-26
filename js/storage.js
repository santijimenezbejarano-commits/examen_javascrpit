const STORAGE_KEY = "tecnostock-cart-v1";

export function restoreCart(products) {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { cart: new Map(), warning: "No se pudo acceder al almacenamiento local. El carrito no se conservará al recargar." };
  }

  if (saved === null) return { cart: new Map(), warning: "" };

  let parsed;
  try {
    parsed = JSON.parse(saved);
  } catch {
    discardSavedCart();
    return { cart: new Map(), warning: "El carrito guardado estaba dañado y se inició uno vacío." };
  }

  if (!Array.isArray(parsed)) {
    discardSavedCart();
    return { cart: new Map(), warning: "El carrito guardado tenía un formato inválido y se inició uno vacío." };
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const cart = new Map();
  let discarded = false;

  for (const line of parsed) {
    if (!line || !Number.isInteger(line.id) || !Number.isInteger(line.quantity) || line.quantity < 1) {
      discarded = true;
      continue;
    }

    const product = productById.get(line.id);
    if (!product || !product.active || product.stock < 1 || cart.has(line.id)) {
      discarded = true;
      continue;
    }

    const quantity = Math.min(line.quantity, product.stock);
    if (quantity !== line.quantity) discarded = true;
    cart.set(line.id, quantity);
  }

  if (discarded) {
    const savedResult = saveCart(cart);
    return {
      cart,
      warning: savedResult.ok
        ? "Se descartaron o ajustaron líneas no válidas del carrito guardado."
        : "Se descartaron o ajustaron líneas no válidas. No se pudo guardar el carrito corregido."
    };
  }

  return { cart, warning: "" };
}

export function saveCart(cart) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(
      Array.from(cart, ([id, quantity]) => ({ id, quantity }))
    ));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

function discardSavedCart() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}
