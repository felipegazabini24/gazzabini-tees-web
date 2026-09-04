/* ============================================================
   GAZZABINI TEES — main.js
   Vanilla JS, IIFE pattern, no build step, no ES modules.
   ============================================================ */
(function () {
  "use strict";

  var WHATSAPP_NUMBER = "595987367440";

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------------- Meta Pixel tracking ---------------- */
  function trackPixel(eventName, params) {
    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", eventName, params || {});
      }
    } catch (e) {
      // Píxel no disponible (bloqueador de anuncios, etc.) — no afecta el resto del sitio.
    }
  }

  function initPixelTracking() {
    // Cualquier link directo a WhatsApp (flotante, footer, botón de contacto) cuenta como contacto.
    document.querySelectorAll('a[href*="wa.me"]').forEach(function (link) {
      link.addEventListener("click", function () {
        trackPixel("Contact");
      });
    });
  }

  /* ---------------- Nav solidify + mobile menu ---------------- */
  function initNav() {
    var nav = document.querySelector("[data-nav]");
    if (!nav) return;
    function onScroll() {
      if (window.scrollY > 40) nav.classList.add("is-solid");
      else nav.classList.remove("is-solid");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var burger = document.querySelector("[data-burger]");
    var mobileNav = document.querySelector("[data-mobile-nav]");
    var mobileClose = document.querySelector("[data-mobile-close]");
    if (burger && mobileNav) {
      burger.addEventListener("click", function () {
        mobileNav.classList.add("is-open");
      });
    }
    if (mobileClose && mobileNav) {
      mobileClose.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
      });
    }
    if (mobileNav) {
      mobileNav.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          mobileNav.classList.remove("is-open");
        });
      });
    }
  }

  /* ---------------- Smooth anchor scroll ---------------- */
  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 76;
      var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth",
      });
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveals() {
    var targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;
    if (typeof IntersectionObserver === "undefined") {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.02, rootMargin: "0px 0px -2% 0px" });
    targets.forEach(function (el) { io.observe(el); });

    // Mandatory safety net
    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ---------------- Card tilt + halo ---------------- */
  function initCardTilt() {
    if (!matchMedia("(hover: hover)").matches) return;
    document.querySelectorAll(".card").forEach(function (card) {
      var rect;
      card.addEventListener("mouseover", function (e) {
        if (card.contains(e.relatedTarget)) return;
        rect = card.getBoundingClientRect();
      });
      card.addEventListener("mousemove", function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var tiltX = (py - 0.5) * -7;
        var tiltY = (px - 0.5) * 7;
        card.style.transform = "perspective(900px) rotateX(" + tiltX.toFixed(2) + "deg) rotateY(" + tiltY.toFixed(2) + "deg) translateY(-4px)";
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("mouseout", function (e) {
        if (card.contains(e.relatedTarget)) return;
        card.style.transform = "";
      });
    });
  }

  /* ---------------- Collection filters ---------------- */
  function initFilters() {
    var pills = document.querySelectorAll("[data-filter]");
    var cards = document.querySelectorAll("[data-grid] .card");
    if (!pills.length || !cards.length) return;

    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        pills.forEach(function (p) { p.classList.remove("is-active"); });
        pill.classList.add("is-active");
        var value = pill.getAttribute("data-filter");
        cards.forEach(function (card) {
          var matches = value === "todas" ||
            (value === "destacados" ? card.getAttribute("data-featured") === "true" : card.getAttribute("data-anime") === value);
          card.classList.toggle("is-filtered-out", !matches);
        });
      });
    });
  }

  /* ---------------- Image lightbox ---------------- */
  function initLightbox() {
    var overlay = document.querySelector("[data-lightbox-overlay]");
    var imgEl = document.querySelector("[data-lightbox-img]");
    var closeBtn = document.querySelector("[data-lightbox-close]");
    var relatedWrap = document.querySelector("[data-lightbox-related]");
    var relatedList = document.querySelector("[data-lightbox-related-list]");
    if (!overlay || !imgEl) return;

    function buildRelated(currentCard) {
      if (!relatedWrap || !relatedList) return;
      relatedList.innerHTML = "";
      if (!currentCard) {
        relatedWrap.hidden = true;
        return;
      }
      var anime = currentCard.getAttribute("data-anime");
      var currentProduct = currentCard.getAttribute("data-product");
      var allCards = Array.prototype.slice.call(document.querySelectorAll(".grid-products .card"));
      var picks = allCards
        .filter(function (c) {
          return c.getAttribute("data-anime") === anime && c.getAttribute("data-product") !== currentProduct;
        })
        .slice(0, 3);

      if (!picks.length) {
        relatedWrap.hidden = true;
        return;
      }

      picks.forEach(function (c) {
        var cardImg = c.querySelector(".card-media img");
        var name = c.getAttribute("data-name") || "";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "lightbox-related-item";

        var thumb = document.createElement("img");
        thumb.className = "lightbox-related-thumb";
        thumb.src = cardImg ? (cardImg.currentSrc || cardImg.getAttribute("src")) : "";
        thumb.alt = "";

        var label = document.createElement("span");
        label.className = "lightbox-related-name";
        label.textContent = name;

        btn.appendChild(thumb);
        btn.appendChild(label);

        btn.addEventListener("click", function () {
          closeLightbox();
          c.scrollIntoView({ behavior: "smooth", block: "center" });
          c.classList.add("card-highlight");
          window.setTimeout(function () {
            c.classList.remove("card-highlight");
          }, 1600);
        });

        relatedList.appendChild(btn);
      });

      relatedWrap.hidden = false;
    }

    function openLightbox(src, alt, card) {
      imgEl.setAttribute("src", src);
      imgEl.setAttribute("alt", alt || "");
      buildRelated(card);
      overlay.classList.add("is-open");
    }
    function closeLightbox() {
      overlay.classList.remove("is-open");
    }

    document.querySelectorAll(".card-media").forEach(function (media) {
      media.addEventListener("click", function () {
        var img = media.querySelector("img");
        if (!img) return;
        var card = media.closest(".card");
        var fullRes = (card && card.getAttribute("data-image")) || img.currentSrc || img.getAttribute("src");
        openLightbox(fullRes, img.getAttribute("alt"), card);
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

  /* ---------------- Size guide ---------------- */
  function initSizeGuide() {
    var trigger = document.querySelector("[data-sizeguide-open]");
    var overlay = document.querySelector("[data-sizeguide-overlay]");
    var closeBtn = document.querySelector("[data-sizeguide-close]");
    if (!trigger || !overlay) return;

    function open() { overlay.classList.add("is-open"); }
    function close() { overlay.classList.remove("is-open"); }

    trigger.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ---------------- FAQ accordion ---------------- */
  function initFaq() {
    var items = document.querySelectorAll("[data-faq-toggle]");
    if (!items.length) return;
    items.forEach(function (btn) {
      var answer = btn.parentElement.querySelector(".faq-answer");
      if (!answer) return;
      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";
        if (isOpen) {
          btn.setAttribute("aria-expanded", "false");
          answer.style.maxHeight = null;
        } else {
          btn.setAttribute("aria-expanded", "true");
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
      });
    });
  }

  /* ---------------- Cart ---------------- */
  var CART_STORAGE_KEY = "gazzabini_cart_v1";

  function loadCart() {
    try {
      var raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (it) {
        return it && typeof it.id === "string" && typeof it.qty === "number";
      });
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      // localStorage no disponible (modo privado, etc.) — el pedido sigue funcionando, solo no se guarda entre visitas.
    }
  }

  var cart = loadCart(); // { id, name, price, image, size, fit, qty }

  function money(n) {
    return n.toLocaleString("es-PY") + " Gs.";
  }

  function findCartLine(id, size, fit) {
    for (var i = 0; i < cart.length; i++) {
      var it = cart[i];
      if (it.id === id && it.size === size && it.fit === fit) return it;
    }
    return null;
  }

  function updateCartUI() {
    var countEls = document.querySelectorAll("[data-cart-count]");
    var totalQty = cart.reduce(function (s, it) { return s + it.qty; }, 0);
    countEls.forEach(function (el) { el.textContent = totalQty; });

    var itemsEl = document.querySelector("[data-cart-items]");
    var totalEl = document.querySelector("[data-cart-total]");
    if (!itemsEl) return;

    if (!cart.length) {
      itemsEl.innerHTML = '<p class="cart-empty">Todavía no agregaste ninguna remera. Elegí tu diseño en la colección.</p>';
    } else {
      itemsEl.innerHTML = cart.map(function (it, idx) {
        return (
          '<div class="cart-item">' +
            '<img src="' + it.image + '" alt="' + it.name + '">' +
            '<div class="cart-item-info">' +
              '<div class="cart-item-name">' + it.name + '</div>' +
              '<div class="cart-item-meta">Talle ' + it.size + ' · ' + it.fit + ' · x' + it.qty + '</div>' +
              '<div class="cart-item-price">' + money(it.price * it.qty) + '</div>' +
              '<button class="cart-item-remove" data-remove-index="' + idx + '">Quitar</button>' +
            '</div>' +
          '</div>'
        );
      }).join("");
    }

    var total = cart.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
    if (totalEl) totalEl.textContent = money(total);

    saveCart();

    itemsEl.querySelectorAll("[data-remove-index]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-remove-index"), 10);
        cart.splice(idx, 1);
        updateCartUI();
      });
    });
  }

  function buildWhatsAppMessage() {
    if (!cart.length) return "Hola! Quiero hacer un pedido en Gazzabini Tees.";
    var lines = ["Hola! Quiero hacer este pedido en Gazzabini Tees:", ""];
    cart.forEach(function (it) {
      lines.push("• " + it.name + " — Talle " + it.size + " · " + it.fit + " · x" + it.qty + " — " + money(it.price * it.qty));
    });
    var total = cart.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
    lines.push("");
    lines.push("Total: " + money(total));
    return lines.join("\n");
  }

  function initCart() {
    var overlay = document.querySelector("[data-cart-overlay]");
    var drawer = document.querySelector("[data-cart-drawer]");
    var openBtns = document.querySelectorAll("[data-cart-open]");
    var closeBtn = document.querySelector("[data-cart-close]");

    function openCart() {
      if (overlay) overlay.classList.add("is-open");
      if (drawer) drawer.classList.add("is-open");
    }
    function closeCart() {
      if (overlay) overlay.classList.remove("is-open");
      if (drawer) drawer.classList.remove("is-open");
    }

    openBtns.forEach(function (btn) { btn.addEventListener("click", openCart); });
    if (closeBtn) closeBtn.addEventListener("click", closeCart);
    if (overlay) overlay.addEventListener("click", closeCart);

    document.querySelectorAll("[data-add-to-cart]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest("[data-product]");
        if (!card) return;
        var id = card.getAttribute("data-product");
        var name = card.getAttribute("data-name");
        var price = parseInt(card.getAttribute("data-price"), 10);
        var image = card.getAttribute("data-image");
        var sizeSel = card.querySelector('[data-select="size"]');
        var fitSel = card.querySelector('[data-select="fit"]');
        var size = sizeSel ? sizeSel.value : "M";
        var fit = fitSel ? fitSel.value : "Oversized";

        var existing = findCartLine(id, size, fit);
        if (existing) existing.qty += 1;
        else cart.push({ id: id, name: name, price: price, image: image, size: size, fit: fit, qty: 1 });

        trackPixel("AddToCart", {
          content_name: name,
          content_ids: [id],
          content_type: "product",
          value: price,
          currency: "PYG"
        });

        updateCartUI();
        openCart();

        btn.classList.add("is-added");
        var original = btn.textContent;
        btn.textContent = "Agregado ✓";
        setTimeout(function () {
          btn.classList.remove("is-added");
          btn.textContent = original;
        }, 1400);
      });
    });

    var waBtn = document.querySelector("[data-cart-whatsapp]");
    if (waBtn) {
      waBtn.addEventListener("click", function () {
        var total = cart.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
        var numItems = cart.reduce(function (s, it) { return s + it.qty; }, 0);
        trackPixel("InitiateCheckout", {
          value: total,
          currency: "PYG",
          num_items: numItems,
          content_type: "product",
          content_ids: cart.map(function (it) { return it.id; })
        });
        var msg = encodeURIComponent(buildWhatsAppMessage());
        window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + msg, "_blank", "noopener");
      });
    }

    updateCartUI();
  }

  /* ---------------- Personalizador de remeras ---------------- */
  function initCustomizer() {
    var stage = document.querySelector("[data-cz-stage]");
    var canvas = document.querySelector("[data-cz-canvas]");
    if (!stage || !canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var CW = canvas.width;
    var CH = canvas.height;

    var BASE_IMAGES = {
      blanco: "assets/img/customizer-blanco.webp",
      crema: "assets/img/customizer-crema.webp",
      negro: "assets/img/customizer-negro.webp"
    };

    var emptyEl = document.querySelector("[data-cz-empty]");
    var uploadInput = document.querySelector("[data-cz-upload]");
    var colorButtons = document.querySelectorAll("[data-cz-colors] .cz-color");
    var sizeRow = document.querySelector("[data-cz-size-row]");
    var sizeSlider = document.querySelector("[data-cz-size]");
    var hint = document.querySelector("[data-cz-hint]");
    var actions = document.querySelector("[data-cz-actions]");
    var downloadBtn = document.querySelector("[data-cz-download]");
    var sendBtn = document.querySelector("[data-cz-send]");

    var currentColor = "blanco";
    var baseImg = null;
    var designImg = null;
    var design = { xRatio: 0.5, yRatio: 0.34, widthRatio: 0.32 };
    var dragging = false;
    var dragOffsetX = 0, dragOffsetY = 0;

    function loadImage(src, cb) {
      var img = new Image();
      img.onload = function () { cb(img); };
      img.src = src;
    }

    function drawContain(img, w, h) {
      var scale = Math.min(CW / w, CH / h);
      var dw = w * scale, dh = h * scale;
      var dx = (CW - dw) / 2, dy = (CH - dh) / 2;
      ctx.fillStyle = "#efe8db";
      ctx.fillRect(0, 0, CW, CH);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    function designBox() {
      var dw = design.widthRatio * CW;
      var dh = dw * (designImg.naturalHeight / designImg.naturalWidth);
      var dx = design.xRatio * CW - dw / 2;
      var dy = design.yRatio * CH - dh / 2;
      return { dw: dw, dh: dh, dx: dx, dy: dy };
    }

    function redraw() {
      ctx.clearRect(0, 0, CW, CH);
      if (baseImg) drawContain(baseImg, baseImg.naturalWidth, baseImg.naturalHeight);
      if (designImg) {
        var box = designBox();
        ctx.drawImage(designImg, box.dx, box.dy, box.dw, box.dh);
      }
    }

    function setColor(color) {
      currentColor = color;
      colorButtons.forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-color") === color);
      });
      loadImage(BASE_IMAGES[color], function (img) {
        baseImg = img;
        redraw();
      });
    }

    colorButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setColor(btn.getAttribute("data-color"));
      });
    });

    if (uploadInput) {
      uploadInput.addEventListener("change", function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          loadImage(ev.target.result, function (img) {
            designImg = img;
            design.xRatio = 0.5;
            design.yRatio = 0.34;
            design.widthRatio = (parseFloat(sizeSlider && sizeSlider.value) || 32) / 100;
            if (emptyEl) emptyEl.hidden = true;
            if (sizeRow) sizeRow.hidden = false;
            if (hint) hint.hidden = false;
            if (actions) actions.hidden = false;
            redraw();
          });
        };
        reader.readAsDataURL(file);
      });
    }

    if (sizeSlider) {
      sizeSlider.addEventListener("input", function () {
        design.widthRatio = parseFloat(sizeSlider.value) / 100;
        redraw();
      });
    }

    function pointerToCanvas(e) {
      var rect = canvas.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * CW;
      var y = ((e.clientY - rect.top) / rect.height) * CH;
      return { x: x, y: y };
    }

    canvas.addEventListener("pointerdown", function (e) {
      if (!designImg) return;
      var pos = pointerToCanvas(e);
      var box = designBox();
      if (pos.x >= box.dx && pos.x <= box.dx + box.dw && pos.y >= box.dy && pos.y <= box.dy + box.dh) {
        dragging = true;
        dragOffsetX = pos.x - design.xRatio * CW;
        dragOffsetY = pos.y - design.yRatio * CH;
        stage.classList.add("is-dragging");
        canvas.setPointerCapture(e.pointerId);
      }
    });

    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var pos = pointerToCanvas(e);
      var xRatio = (pos.x - dragOffsetX) / CW;
      var yRatio = (pos.y - dragOffsetY) / CH;
      design.xRatio = Math.min(1, Math.max(0, xRatio));
      design.yRatio = Math.min(1, Math.max(0, yRatio));
      redraw();
    });

    function stopDrag() {
      dragging = false;
      stage.classList.remove("is-dragging");
    }
    canvas.addEventListener("pointerup", stopDrag);
    canvas.addEventListener("pointercancel", stopDrag);

    function downloadDesign() {
      var link = document.createElement("a");
      link.download = "gazzabini-tees-personalizada-" + currentColor + ".png";
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    if (downloadBtn) {
      downloadBtn.addEventListener("click", function () {
        if (!designImg) return;
        downloadDesign();
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", function () {
        if (!designImg) return;
        downloadDesign();
        trackPixel("Contact", { content_name: "Personalizador" });
        var colorLabel = currentColor.charAt(0).toUpperCase() + currentColor.slice(1);
        var msg = encodeURIComponent(
          "Hola! Quiero pedir una remera personalizada (color " + colorLabel + "). " +
          "Ya se descargó mi diseño, te lo adjunto en este chat."
        );
        window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + msg, "_blank", "noopener");
      });
    }

    setColor(currentColor);
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    safe(initNav, "initNav");
    safe(initSmoothScroll, "initSmoothScroll");
    safe(initReveals, "initReveals");
    safe(initCardTilt, "initCardTilt");
    safe(initFilters, "initFilters");
    safe(initLightbox, "initLightbox");
    safe(initSizeGuide, "initSizeGuide");
    safe(initFaq, "initFaq");
    safe(initCart, "initCart");
    safe(initCustomizer, "initCustomizer");
    safe(initPixelTracking, "initPixelTracking");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
