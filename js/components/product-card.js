const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

export class ProductCard extends HTMLElement {
  set product(value) {
    this._product = value;
    this.render();
  }

  render() {
    if (!this._product) return;

    const product = this._product;
    const card = document.createElement("article");
    card.className = "product-card";

    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = product.category;

    const name = document.createElement("h3");
    name.textContent = product.name;

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description;

    const availability = document.createElement("p");
    availability.className = product.active && product.stock > 0 ? "stock-status" : "stock-status unavailable";
    availability.textContent = !product.active
      ? "No disponible"
      : product.stock === 0
        ? "Agotado"
        : `${product.stock} disponibles`;

    const footer = document.createElement("div");
    footer.className = "product-card-footer";

    const price = document.createElement("strong");
    price.className = "product-price";
    price.textContent = money.format(product.price);

    const addButton = document.createElement("button");
    addButton.className = "button button-add";
    addButton.type = "button";
    addButton.textContent = product.active && product.stock > 0 ? "Agregar" : "No disponible";
    addButton.disabled = !product.active || product.stock === 0;
    addButton.setAttribute("aria-label", `Agregar ${product.name} al carrito`);
    addButton.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("product:add", {
        bubbles: true,
        composed: true,
        detail: { productId: product.id }
      }));
    });

    footer.append(price, addButton);
    card.append(category, name, description, availability, footer);
    this.replaceChildren(card);
  }
}

customElements.define("product-card", ProductCard);
