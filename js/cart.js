export const DISCOUNT_THRESHOLD = 300000;
export const DISCOUNT_RATE = 0.1;

function findProduct(products, productId) {
  return products.find((product) => product.id === productId);
}

function validateAvailableProduct(product) {
  if (!product || !product.active || product.stock < 1) {
    throw new Error("Este producto no está disponible para agregar al carrito.");
  }
}

export function addToCart(cart, productId, products) {
  const product = findProduct(products, productId);
  validateAvailableProduct(product);

  const quantity = (cart.get(productId) ?? 0) + 1;
  if (quantity > product.stock) {
    throw new Error(`No hay existencias suficientes. Disponibles: ${product.stock}.`);
  }

  const updatedCart = new Map(cart);
  updatedCart.set(productId, quantity);
  return updatedCart;
}

export function setCartQuantity(cart, productId, quantity, products) {
  const product = findProduct(products, productId);
  validateAvailableProduct(product);

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("La cantidad debe ser un número entero de al menos 1.");
  }
  if (quantity > product.stock) {
    throw new Error(`La cantidad supera las existencias disponibles (${product.stock}).`);
  }

  const updatedCart = new Map(cart);
  updatedCart.set(productId, quantity);
  return updatedCart;
}

export function removeFromCart(cart, productId) {
  const updatedCart = new Map(cart);
  updatedCart.delete(productId);
  return updatedCart;
}

export function calculateCart(cart, products) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const lines = [];
  let units = 0;
  let subtotal = 0;

  for (const [productId, quantity] of cart) {
    const product = productById.get(productId);
    if (!product) continue;
    const lineSubtotal = product.price * quantity;
    units += quantity;
    subtotal += lineSubtotal;
    lines.push({ product, quantity, subtotal: lineSubtotal });
  }

  const discount = subtotal >= DISCOUNT_THRESHOLD ? Math.round(subtotal * DISCOUNT_RATE) : 0;
  return { lines, units, subtotal, discount, total: subtotal - discount };
}

export function validateCartForConfirmation(cart, products) {
  if (cart.size === 0) {
    throw new Error("Agrega al menos un producto antes de confirmar el pedido.");
  }

  for (const [productId, quantity] of cart) {
    const product = findProduct(products, productId);
    validateAvailableProduct(product);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
      throw new Error(`La cantidad de ${product.name} ya no es válida respecto al inventario.`);
    }
  }
}
