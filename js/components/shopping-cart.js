const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

export class ShoppingCart extends HTMLElement {
  set summary(value) {
    this._summary = value;
    this.render();
  }

  render() {
    const summary = this._summary ?? { lines: [], units: 0, subtotal: 0, discount: 0, total: 0 };
    this.replaceChildren();

    if (summary.lines.length === 0) {
      const empty = document.createElement("p");
      empty.className = "cart-empty";
      empty.textContent = "Tu carrito está vacío. Agrega productos para preparar tu pedido.";
      this.append(empty);
      return;
    }

    const list = document.createElement("ul");
    list.className = "cart-lines";

    for (const line of summary.lines) {
      const item = document.createElement("li");
      item.className = "cart-line";

      const info = document.createElement("div");
      info.className = "cart-line-info";
      const name = document.createElement("strong");
      name.textContent = line.product.name;
      const unitPrice = document.createElement("span");
      unitPrice.textContent = `${money.format(line.product.price)} c/u`;
      const lineSubtotal = document.createElement("span");
      lineSubtotal.className = "line-subtotal";
      lineSubtotal.textContent = money.format(line.subtotal);
      info.append(name, unitPrice, lineSubtotal);

      const actions = document.createElement("div");
      actions.className = "cart-line-actions";
      const decrease = this.createActionButton("−", `Disminuir cantidad de ${line.product.name}`, "decrease", line.product.id);
      const quantity = document.createElement("span");
      quantity.className = "line-quantity";
      quantity.setAttribute("aria-label", `Cantidad: ${line.quantity}`);
      quantity.textContent = String(line.quantity);
      const increase = this.createActionButton("+", `Aumentar cantidad de ${line.product.name}`, "increase", line.product.id);
      const remove = this.createActionButton("Eliminar", `Eliminar ${line.product.name} del carrito`, "remove", line.product.id);
      remove.className = "remove-button";
      actions.append(decrease, quantity, increase, remove);
      item.append(info, actions);
      list.append(item);
    }

    const totals = document.createElement("div");
    totals.className = "cart-totals";
    totals.append(
      this.createTotalRow("Subtotal", money.format(summary.subtotal)),
      this.createTotalRow("Descuento", `−${money.format(summary.discount)}`, "discount-row"),
      this.createTotalRow("Total", money.format(summary.total), "cart-grand-total")
    );

    const footer = document.createElement("div");
    footer.className = "cart-footer";
    const clearButton = document.createElement("button");
    clearButton.className = "button button-quiet clear-cart";
    clearButton.type = "button";
    clearButton.textContent = "Vaciar carrito";
    clearButton.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("cart:clear", { bubbles: true, composed: true }));
    });
    footer.append(clearButton);
    this.append(list, totals, footer);
  }

  createActionButton(label, accessibleLabel, action, productId) {
    const button = document.createElement("button");
    button.className = "quantity-button";
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-label", accessibleLabel);
    button.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("cart:change", {
        bubbles: true,
        composed: true,
        detail: { action, productId }
      }));
    });
    return button;
  }

  createTotalRow(label, value, className = "") {
    const row = document.createElement("div");
    row.className = `cart-total-row ${className}`.trim();
    const title = document.createElement("span");
    title.textContent = label;
    const amount = document.createElement("strong");
    amount.textContent = value;
    row.append(title, amount);
    return row;
  }
}

customElements.define("shopping-cart", ShoppingCart);
