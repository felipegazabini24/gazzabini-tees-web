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
          var matches = value === "todas" || card.getAttribute("data-anime") === value;
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
    if (!overlay || !imgEl) return;

    function openLightbox(src, alt) {
      imgEl.setAttribute("src", src);
      imgEl.setAttribute("alt", alt || "");
      overlay.classList.add("is-open");
    }
    function closeLightbox() {
      overlay.classList.remove("is-open");
    }

    document.querySelectorAll(".card-media").forEach(function (media) {
      media.addEventListener("click", function () {
        var img = media.querySelector("img");
        if (!img) return;
        openLightbox(img.currentSrc || img.getAttribute("src"), img.getAttribute("alt"));
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

  /* ---------------- Cart ---------------- */
  var cart = []; // { id, name, price, image, size, fit, qty }

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
    lines.push("");
    lines.push("Mi nombre es: ");
    lines.push("Mi ciudad / zona de entrega es: ");
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
        var msg = encodeURIComponent(buildWhatsAppMessage());
        window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + msg, "_blank", "noopener");
      });
    }

    updateCartUI();
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    safe(initNav, "initNav");
    safe(initSmoothScroll, "initSmoothScroll");
    safe(initReveals, "initReveals");
    safe(initCardTilt, "initCardTilt");
    safe(initFilters, "initFilters");
    safe(initLightbox, "initLightbox");
    safe(initCart, "initCart");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
