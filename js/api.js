function isValidProduct(product) {
  return product !== null
    && typeof product === "object"
    && Number.isInteger(product.id)
    && product.id > 0
    && typeof product.name === "string"
    && product.name.trim().length > 0
    && typeof product.category === "string"
    && product.category.trim().length > 0
    && typeof product.price === "number"
    && Number.isFinite(product.price)
    && product.price > 0
    && Number.isInteger(product.stock)
    && product.stock >= 0
    && typeof product.description === "string"
    && typeof product.active === "boolean";
}

export async function fetchProducts() {
  const response = await fetch("./data/products.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No fue posible consultar el catálogo (HTTP ${response.status}).`);
  }

  let products;
  try {
    products = await response.json();
  } catch {
    throw new Error("El catálogo no contiene un JSON válido.");
  }

  if (!Array.isArray(products) || !products.every(isValidProduct)) {
    throw new Error("Los datos del catálogo tienen un formato inválido.");
  }

  const ids = new Set(products.map((product) => product.id));
  if (ids.size !== products.length) {
    throw new Error("El catálogo contiene identificadores de producto duplicados.");
  }

  return products.map((product) => ({ ...product }));
}
