# Gazzabini Tees — sitio web

Vitrina de la colección Bleach con pedido por WhatsApp. Sitio estático (HTML/CSS/JS), sin backend, listo para GitHub Pages.

## Cómo verlo en tu compu
Abrí `index.html` haciendo doble clic. Funciona sin instalar nada.

## Cómo subirlo a GitHub Pages
1. Entrá a github.com y creá un repositorio nuevo (público), por ejemplo `gazzabini-tees`.
2. Subí todos los archivos de esta carpeta al repositorio (arrastrando los archivos en la web de GitHub, o con git).
3. En el repo: Settings → Pages → Source: selecciona la rama `main` y carpeta `/ (root)`. Guardá.
4. En un par de minutos tu sitio queda en `https://tu-usuario.github.io/gazzabini-tees/`.

## Para cambiar algo después
- Precios, talles o textos: editá `index.html` (buscá el producto por nombre).
- Colores o estilos: `styles.css`.
- Cada vez que cambies `styles.css` o `main.js`, actualizá el número `?v=20260901` en `index.html` por la fecha del día — así los navegadores no muestran una versión vieja guardada en caché.
- El número de WhatsApp de los botones de compra está en `main.js` (línea `WHATSAPP_NUMBER`) y repetido en `index.html`.

## Si en algún momento agregás pago real con tarjeta
Este sitio arma el pedido y lo manda por WhatsApp — no cobra online. Para cobrar con tarjeta/Bancard necesitás un backend aparte; avisame cuando quieras dar ese paso.

## Vista previa al compartir el link
`index.html` tiene las etiquetas para que, al pegar el link en WhatsApp/Instagram/Facebook, se vea una tarjeta con imagen y texto (no solo el link pelado). Esa imagen es `assets/img/og-cover.jpg`.

Si en algún momento cambiás el nombre del repositorio o lo publicás en otro dominio, esa vista previa deja de funcionar hasta que actualices la URL en `index.html`: buscá `felipegazabini24.github.io/gazzabini-tees-web` (aparece 3 veces, en las etiquetas `og:url`, `og:image` y `twitter:image`) y reemplazá por la URL nueva.
