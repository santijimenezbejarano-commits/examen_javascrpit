# TecnoStock

Aplicación web local para consultar un catálogo de productos, administrar un carrito persistente y simular la confirmación de un pedido. Está construida con HTML, CSS y JavaScript nativo, sin frameworks.

## Ejecutar localmente

La aplicación carga el catálogo mediante `fetch()`, por lo que debe abrirse desde un servidor HTTP local y no directamente con `file://`. Desde la raíz del proyecto se puede iniciar, por ejemplo:

```bash
python3 -m http.server 8000
```

Luego abre `http://localhost:8000` en el navegador.

## Estructura

- `index.html`: estructura y controles de la interfaz.
- `css/styles.css`: estilos adaptables a pantallas estrechas.
- `data/products.json`: catálogo validado al cargar.
- `js/api.js`: consulta HTTP y validación de productos.
- `js/cart.js`: reglas del carrito, inventario y cálculo del descuento.
- `js/storage.js`: recuperación y persistencia segura del carrito.
- `js/components/`: Web Components para tarjetas, catálogo y carrito.
- `js/app.js`: coordinación de eventos, filtros y confirmación simulada.

El pedido de demostración no procesa pagos ni modifica el inventario del catálogo.