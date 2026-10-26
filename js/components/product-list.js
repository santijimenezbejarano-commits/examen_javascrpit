export class ProductList extends HTMLElement {
  set products(value) {
    this._products = value;
    this.render();
  }

  render() {
    const products = this._products ?? [];
    this.replaceChildren();

    if (products.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-state";
      emptyState.textContent = this.dataset.catalogEmpty === "true"
        ? "El catálogo está disponible, pero aún no tiene productos."
        : "No encontramos productos con esos filtros. Prueba con otra búsqueda.";
      this.append(emptyState);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "product-grid";
    for (const product of products) {
      const card = document.createElement("product-card");
      card.product = product;
      grid.append(card);
    }
    this.append(grid);
  }
}

customElements.define("product-list", ProductList);
