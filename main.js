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

    // Safety net: catches any .reveal element the observer missed (e.g. a
    // jump-scroll landing straight on it before it was ever observed as
    // intersecting). Runs repeatedly and briefly instead of a single
    // one-shot 6s check, so a card can't stay invisible for seconds after
    // becoming visible on screen.
    var safetyChecks = 0;
    var safetyTimer = setInterval(function () {
      safetyChecks++;
      var pending = document.querySelectorAll(".reveal:not(.is-visible)");
      pending.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
      if (safetyChecks >= 8) clearInterval(safetyTimer);
    }, 700);
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
          // A card revealed by a filter (or by the "world card" jump-scroll)
          // may never have crossed the IntersectionObserver's viewport check
          // if it was far below the fold before reflowing into view here.
          // Left to the scroll-reveal alone, it can sit at opacity:0 looking
          // like a blank hole in the grid. Filtered-in results should show
          // immediately anyway, so force them visible instead of waiting.
          if (matches) card.classList.add("is-visible");
        });
      });
    });
  }

  /* ---------------- Contadores en vivo por anime ---------------- */
  function initCollectionCounts() {
    var cards = document.querySelectorAll("[data-grid] .card[data-anime]");
    if (!cards.length) return;
    var counts = {};
    cards.forEach(function (card) {
      var anime = card.getAttribute("data-anime");
      counts[anime] = (counts[anime] || 0) + 1;
    });

    function label(n) {
      return n + (n === 1 ? " diseño" : " diseños");
    }

    document.querySelectorAll("[data-anime-count]").forEach(function (el) {
      var anime = el.getAttribute("data-anime-count");
      el.textContent = counts[anime] ? "(" + counts[anime] + ")" : "";
    });
    document.querySelectorAll("[data-world-count]").forEach(function (el) {
      var anime = el.getAttribute("data-world-count");
      el.textContent = counts[anime] ? label(counts[anime]) : "Próximamente";
    });
    document.querySelectorAll("[data-total-count]").forEach(function (el) {
      el.textContent = cards.length;
    });
  }

  /* ---------------- Vitrinas en vivo ("Más pedidas" / "Ofertas") ---------------- */
  function initSpotlights() {
    var allCards = Array.prototype.slice.call(document.querySelectorAll(".grid-products .card"));
    if (!allCards.length) return;

    var configs = [
      { key: "best", limit: 8, match: function (c) { return !!c.querySelector(".card-badge-best"); } },
      { key: "offers", limit: 6, match: function (c) { return !!c.querySelector(".card-price-old"); } }
    ];

    configs.forEach(function (cfg) {
      var wrap = document.querySelector('[data-spotlight="' + cfg.key + '"]');
      var list = wrap ? wrap.querySelector("[data-spotlight-list]") : null;
      if (!wrap || !list) return;

      var picks = allCards.filter(cfg.match).slice(0, cfg.limit);
      if (!picks.length) {
        wrap.hidden = true;
        return;
      }

      list.innerHTML = "";
      picks.forEach(function (card) {
        var cardImg = card.querySelector(".card-media img");
        var priceEl = card.querySelector(".card-price");
        var name = card.getAttribute("data-name") || "";

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "spotlight-item";

        var thumb = document.createElement("img");
        thumb.className = "spotlight-thumb";
        thumb.loading = "lazy";
        thumb.alt = "";
        thumb.src = cardImg ? (cardImg.currentSrc || cardImg.getAttribute("src")) : "";

        var label = document.createElement("span");
        label.className = "spotlight-name";
        label.textContent = name;

        var price = document.createElement("span");
        price.className = "spotlight-price";
        if (priceEl) price.innerHTML = priceEl.innerHTML;

        btn.appendChild(thumb);
        btn.appendChild(label);
        btn.appendChild(price);

        btn.addEventListener("click", function () {
          // If an anime filter currently hides this card, clear it first —
          // otherwise scrollIntoView on a display:none element does nothing.
          if (card.classList.contains("is-filtered-out")) {
            var pill = document.querySelector('[data-filter="todas"]');
            if (pill) pill.click();
          }
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.classList.add("card-highlight");
          window.setTimeout(function () {
            card.classList.remove("card-highlight");
          }, 1600);
        });

        list.appendChild(btn);
      });

      wrap.hidden = false;
    });
  }

  /* ---------------- Tarjetas de colección ("mundos") ---------------- */
  function initWorldCards() {
    var worldButtons = document.querySelectorAll("[data-world-filter]");
    if (!worldButtons.length) return;
    worldButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var anime = btn.getAttribute("data-world-filter");
        var pill = document.querySelector('[data-filter="' + anime + '"]');
        if (pill) pill.click();
        var filters = document.querySelector("[data-filters]");
        if (filters) {
          var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
          window.scrollTo({
            top: filters.getBoundingClientRect().top + window.scrollY - 90,
            behavior: reduced ? "auto" : "smooth"
          });
        }
      });
    });
  }

  /* ---------------- Video de clientes ("en movimiento") ---------------- */
  // Estilo Tachima: los videos se reproducen solos (mudos) apenas entran en
  // pantalla, sin que el visitante tenga que tocar play — el botón central
  // pasa a ser un toggle de sonido, con un aviso "Sin sonido"/"Con sonido".
  function initMovementVideos() {
    var cards = document.querySelectorAll(".movement-card");
    if (!cards.length) return;

    var observer = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (entry.isIntersecting) {
            v.play().catch(function () { /* el navegador puede bloquear autoplay hasta que haya interacción; no es un error del sitio */ });
          } else {
            v.pause();
          }
        });
      }, { threshold: 0.4 });
    }

    cards.forEach(function (cardEl) {
      var video = cardEl.querySelector("[data-movement-video]");
      var fallback = cardEl.querySelector("[data-movement-fallback]");
      var soundBtn = cardEl.querySelector("[data-movement-sound]");
      var soundBadge = cardEl.querySelector("[data-movement-sound-badge]");
      if (!video) return;

      var fallbackShown = false;
      function showFallback() {
        if (fallbackShown) return;
        fallbackShown = true;
        video.style.display = "none";
        if (fallback) fallback.hidden = false;
        if (soundBtn) soundBtn.style.display = "none";
        if (soundBadge) soundBadge.style.display = "none";
      }

      // Señal real de fallo: el evento "error" (se dispara si el archivo no
      // existe o el navegador no puede decodificarlo).
      //
      // OJO — bug real que estuvo así desde la Entrega 1 y recién se detectó
      // ahora: antes acá también se chequeaba video.networkState === 3
      // (NETWORK_NO_SOURCE) de forma SINCRÓNICA apenas arrancaba este script.
      // Medido con precisión: justo al parsear el HTML, un <video> con fuente
      // válida pasa por networkState 3 durante el primer instante (todavía no
      // arrancó el algoritmo de selección de recurso) y recién baja a 2
      // (cargando) uno o dos milisegundos después. Ese chequeo inmediato leía
      // ese estado transitorio como "falló" y ocultaba el video para siempre
      // (fallbackShown es candado de una sola vía) — un falso positivo que no
      // tiene nada que ver con que el archivo esté bien o mal. Por eso a veces
      // el video "nunca cargaba": el sitio lo escondía solo, antes de que
      // tuviera la más mínima chance de reproducirse. Se saca ese chequeo
      // inmediato/por timeout y se deja solo el evento "error", que es la
      // señal correcta y la única que el spec garantiza que es fiable.
      video.addEventListener("error", showFallback, true);

      if (soundBtn) {
        soundBtn.addEventListener("click", function () {
          video.muted = !video.muted;
          soundBtn.textContent = video.muted ? "🔇" : "🔊";
          soundBtn.setAttribute("aria-label", video.muted ? "Activar sonido" : "Silenciar");
          if (soundBadge) soundBadge.textContent = video.muted ? "Sin sonido" : "Con sonido";
        });
      }

      if (observer) {
        observer.observe(video);
      } else {
        // Sin soporte de IntersectionObserver (muy poco probable): reproducir directo.
        video.play().catch(function () {});
      }
    });
  }

  /* ---------------- Image lightbox ---------------- */
  /* ---------------- Hero carousel ---------------- */
  function initHeroCarousel() {
    var bg = document.querySelector("[data-hero-bg]");
    if (!bg) return;
    var slides = Array.prototype.slice.call(bg.querySelectorAll("[data-hero-slide]"));
    if (slides.length < 2) return;

    var prevBtn = document.querySelector("[data-hero-prev]");
    var nextBtn = document.querySelector("[data-hero-next]");
    var current = slides.findIndex(function (s) { return s.classList.contains("is-active"); });
    if (current < 0) current = 0;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var timer = null;

    function show(index) {
      slides[current].classList.remove("is-active");
      current = (index + slides.length) % slides.length;
      slides[current].classList.add("is-active");
    }

    function next() { show(current + 1); }
    function prev() { show(current - 1); }

    function startAutoplay() {
      if (reduceMotion) return;
      stopAutoplay();
      timer = window.setInterval(next, 5500);
    }
    function stopAutoplay() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    if (nextBtn) nextBtn.addEventListener("click", function () { next(); startAutoplay(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); startAutoplay(); });

    var heroSection = document.getElementById("inicio");
    if (heroSection) {
      heroSection.addEventListener("mouseenter", stopAutoplay);
      heroSection.addEventListener("mouseleave", startAutoplay);
    }

    startAutoplay();
  }

  function initLightbox() {
    var overlay = document.querySelector("[data-lightbox-overlay]");
    var imgEl = document.querySelector("[data-lightbox-img]");
    var closeBtn = document.querySelector("[data-lightbox-close]");
    var relatedWrap = document.querySelector("[data-lightbox-related]");
    var relatedList = document.querySelector("[data-lightbox-related-list]");
    var infoWrap = document.querySelector("[data-lightbox-info]");
    var animeEl = document.querySelector("[data-lightbox-anime]");
    var nameEl = document.querySelector("[data-lightbox-name]");
    var priceEl = document.querySelector("[data-lightbox-price]");
    var sizeSel = document.querySelector('[data-lightbox-select="size"]');
    var fitSel = document.querySelector('[data-lightbox-select="fit"]');
    var qtyValueEl = document.querySelector("[data-lightbox-qty-value]");
    var qtyMinusBtn = document.querySelector("[data-lightbox-qty-minus]");
    var qtyPlusBtn = document.querySelector("[data-lightbox-qty-plus]");
    var addBtn = document.querySelector("[data-lightbox-add]");
    if (!overlay || !imgEl) return;

    var currentCard = null;
    var qty = 1;

    function renderQty() {
      qty = Math.max(1, qty);
      if (qtyValueEl) qtyValueEl.textContent = qty;
    }

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
        var price = parseInt(c.getAttribute("data-price"), 10);
        var cardSizeSel = c.querySelector('[data-select="size"]');
        var cardFitSel = c.querySelector('[data-select="fit"]');

        var item = document.createElement("div");
        item.className = "lightbox-related-item";

        var viewBtn = document.createElement("button");
        viewBtn.type = "button";
        viewBtn.className = "lightbox-related-view";
        viewBtn.setAttribute("aria-label", "Ver " + name);

        var thumb = document.createElement("img");
        thumb.className = "lightbox-related-thumb";
        thumb.src = cardImg ? (cardImg.currentSrc || cardImg.getAttribute("src")) : "";
        thumb.alt = "";
        viewBtn.appendChild(thumb);

        viewBtn.addEventListener("click", function () {
          closeLightbox();
          c.scrollIntoView({ behavior: "smooth", block: "center" });
          c.classList.add("card-highlight");
          window.setTimeout(function () {
            c.classList.remove("card-highlight");
          }, 1600);
        });

        var body = document.createElement("div");
        body.className = "lightbox-related-body";

        var label = document.createElement("button");
        label.type = "button";
        label.className = "lightbox-related-name";
        label.textContent = name;
        label.addEventListener("click", function () { viewBtn.click(); });

        var priceEl2 = document.createElement("span");
        priceEl2.className = "lightbox-related-price";
        if (!isNaN(price)) priceEl2.textContent = money(price);

        var controls = document.createElement("div");
        controls.className = "lightbox-related-controls";

        var sizeSel2 = document.createElement("select");
        sizeSel2.className = "lightbox-related-select";
        sizeSel2.setAttribute("aria-label", "Talle de " + name);
        ["S", "M", "L", "XL", "XXL"].forEach(function (opt) {
          var o = document.createElement("option");
          o.textContent = opt;
          sizeSel2.appendChild(o);
        });
        if (cardSizeSel) sizeSel2.value = cardSizeSel.value;

        var fitSel2 = document.createElement("select");
        fitSel2.className = "lightbox-related-select";
        fitSel2.setAttribute("aria-label", "Corte de " + name);
        ["Oversized", "Corte Normal"].forEach(function (opt) {
          var o = document.createElement("option");
          o.textContent = opt;
          fitSel2.appendChild(o);
        });
        if (cardFitSel) fitSel2.value = cardFitSel.value;

        var addBtn2 = document.createElement("button");
        addBtn2.type = "button";
        addBtn2.className = "lightbox-related-add";
        addBtn2.textContent = "Agregar";
        addBtn2.addEventListener("click", function () {
          addProductToCart(c, { size: sizeSel2.value, fit: fitSel2.value, qty: 1 });
          closeLightbox();
        });

        controls.appendChild(sizeSel2);
        controls.appendChild(fitSel2);
        controls.appendChild(addBtn2);

        body.appendChild(label);
        if (priceEl2.textContent) body.appendChild(priceEl2);
        body.appendChild(controls);

        item.appendChild(viewBtn);
        item.appendChild(body);

        relatedList.appendChild(item);
      });

      relatedWrap.hidden = false;
    }

    function openLightbox(src, alt, card) {
      imgEl.setAttribute("src", src);
      imgEl.setAttribute("alt", alt || "");
      buildRelated(card);

      currentCard = card || null;
      qty = 1;
      renderQty();

      if (currentCard && infoWrap) {
        if (animeEl) animeEl.textContent = currentCard.getAttribute("data-anime") || "";
        if (nameEl) nameEl.textContent = currentCard.getAttribute("data-name") || "";
        var cardPriceEl = currentCard.querySelector(".card-price");
        if (priceEl) priceEl.innerHTML = cardPriceEl ? cardPriceEl.innerHTML : "";

        var cardSizeSel = currentCard.querySelector('[data-select="size"]');
        var cardFitSel = currentCard.querySelector('[data-select="fit"]');
        if (sizeSel && cardSizeSel) sizeSel.value = cardSizeSel.value;
        if (fitSel && cardFitSel) fitSel.value = cardFitSel.value;

        infoWrap.hidden = false;
      } else if (infoWrap) {
        infoWrap.hidden = true;
      }

      overlay.classList.add("is-open");
    }
    function closeLightbox() {
      overlay.classList.remove("is-open");
    }

    if (qtyMinusBtn) {
      qtyMinusBtn.addEventListener("click", function () {
        qty -= 1;
        renderQty();
      });
    }
    if (qtyPlusBtn) {
      qtyPlusBtn.addEventListener("click", function () {
        qty += 1;
        renderQty();
      });
    }
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        if (!currentCard) return;
        addProductToCart(currentCard, {
          size: sizeSel ? sizeSel.value : undefined,
          fit: fitSel ? fitSel.value : undefined,
          qty: qty
        });
        closeLightbox();
      });
    }

    var tabBtns = document.querySelectorAll("[data-lightbox-tab]");
    tabBtns.forEach(function (tabBtn) {
      tabBtn.addEventListener("click", function () {
        var key = tabBtn.getAttribute("data-lightbox-tab");
        tabBtns.forEach(function (b) {
          var active = b === tabBtn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        document.querySelectorAll("[data-lightbox-tabpanel]").forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-lightbox-tabpanel") !== key;
        });
      });
    });

    // La tarjeta entera es clickeable (antes solo la foto) — ya no tiene
    // selects ni botón propios, así que no hay riesgo de "robarle" el click
    // a ningún control interno.
    document.querySelectorAll(".grid-products .card").forEach(function (card) {
      card.addEventListener("click", function () {
        var img = card.querySelector(".card-media img");
        if (!img) return;
        var fullRes = card.getAttribute("data-image") || img.currentSrc || img.getAttribute("src");
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
    var triggers = document.querySelectorAll("[data-sizeguide-open]");
    var overlay = document.querySelector("[data-sizeguide-overlay]");
    var closeBtn = document.querySelector("[data-sizeguide-close]");
    if (!triggers.length || !overlay) return;

    function open() { overlay.classList.add("is-open"); }
    function close() { overlay.classList.remove("is-open"); }

    triggers.forEach(function (trigger) { trigger.addEventListener("click", open); });
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

  // Reuses each product card's own real stock line (".card-stock") instead of
  // duplicating/fabricating that data in the cart — if the card doesn't show a
  // stock note (most don't), the cart line simply doesn't show one either.
  function getStockNoteForProduct(id) {
    if (!id || !window.CSS || !window.CSS.escape) {
      var card = document.querySelector('[data-product="' + id + '"]');
      var stockEl = card ? card.querySelector(".card-stock") : null;
      return stockEl ? stockEl.textContent.trim() : null;
    }
    var safeId = window.CSS.escape(id);
    var card2 = document.querySelector('[data-product="' + safeId + '"]');
    var stockEl2 = card2 ? card2.querySelector(".card-stock") : null;
    return stockEl2 ? stockEl2.textContent.trim() : null;
  }

  // "Si pedís hoy, te llega <fecha>" — computed from today's real date plus
  // Felipe's already-stated "Entrega en 3 días" policy. Not a fabricated ETA.
  function formatDeliveryEstimate() {
    var d = new Date();
    d.setDate(d.getDate() + 3);
    var text = d.toLocaleDateString("es-PY", { weekday: "short", day: "numeric", month: "long" });
    return text.charAt(0).toUpperCase() + text.slice(1);
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
        var stockNote = getStockNoteForProduct(it.id);
        return (
          '<div class="cart-item">' +
            '<img src="' + it.image + '" alt="' + it.name + '">' +
            '<div class="cart-item-info">' +
              '<div class="cart-item-name">' + it.name + '</div>' +
              '<div class="cart-item-meta">Talle ' + it.size + ' · ' + it.fit + '</div>' +
              (stockNote ? '<div class="cart-item-stock">' + stockNote + '</div>' : '') +
              '<div class="cart-item-row">' +
                '<div class="cart-item-qty">' +
                  '<button type="button" class="cart-item-qty-btn" data-qty-minus="' + idx + '" aria-label="Restar cantidad">−</button>' +
                  '<span class="cart-item-qty-value">' + it.qty + '</span>' +
                  '<button type="button" class="cart-item-qty-btn" data-qty-plus="' + idx + '" aria-label="Sumar cantidad">+</button>' +
                '</div>' +
                '<div class="cart-item-price">' + money(it.price * it.qty) + '</div>' +
              '</div>' +
              '<button class="cart-item-remove" data-remove-index="' + idx + '">Quitar</button>' +
            '</div>' +
          '</div>'
        );
      }).join("");
    }

    var total = cart.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
    if (totalEl) totalEl.textContent = money(total);

    var deliveryWrap = document.querySelector("[data-cart-delivery]");
    var deliveryText = document.querySelector("[data-cart-delivery-text]");
    if (deliveryWrap && deliveryText) {
      if (cart.length) {
        deliveryText.textContent = "Si pedís hoy, te llega " + formatDeliveryEstimate();
        deliveryWrap.hidden = false;
      } else {
        deliveryWrap.hidden = true;
      }
    }

    saveCart();

    itemsEl.querySelectorAll("[data-remove-index]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-remove-index"), 10);
        cart.splice(idx, 1);
        updateCartUI();
      });
    });
    itemsEl.querySelectorAll("[data-qty-minus]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-qty-minus"), 10);
        var it = cart[idx];
        if (!it) return;
        if (it.qty <= 1) cart.splice(idx, 1);
        else it.qty -= 1;
        updateCartUI();
      });
    });
    itemsEl.querySelectorAll("[data-qty-plus]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-qty-plus"), 10);
        var it = cart[idx];
        if (!it) return;
        it.qty += 1;
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

  // Shared by the per-card "Agregar al pedido" button and the lightbox's
  // own add button, so both paths write to the exact same cart array with
  // identical pixel tracking — one source of truth, no duplicated logic.
  function addProductToCart(card, opts) {
    opts = opts || {};
    if (!card) return null;
    var id = card.getAttribute("data-product");
    var name = card.getAttribute("data-name");
    var price = parseInt(card.getAttribute("data-price"), 10);
    var image = card.getAttribute("data-image");
    var cardSizeSel = card.querySelector('[data-select="size"]');
    var cardFitSel = card.querySelector('[data-select="fit"]');
    var size = opts.size || (cardSizeSel ? cardSizeSel.value : "M");
    var fit = opts.fit || (cardFitSel ? cardFitSel.value : "Oversized");
    var qty = opts.qty || 1;

    var existing = findCartLine(id, size, fit);
    if (existing) existing.qty += qty;
    else cart.push({ id: id, name: name, price: price, image: image, size: size, fit: fit, qty: qty });

    trackPixel("AddToCart", {
      content_name: name,
      content_ids: [id],
      content_type: "product",
      value: price,
      currency: "PYG"
    });

    updateCartUI();

    var overlay = document.querySelector("[data-cart-overlay]");
    var drawer = document.querySelector("[data-cart-drawer]");
    if (overlay) overlay.classList.add("is-open");
    if (drawer) drawer.classList.add("is-open");

    return { id: id, name: name, price: price, size: size, fit: fit, qty: qty };
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
        addProductToCart(card, {});

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
    safe(initHeroCarousel, "initHeroCarousel");
    safe(initNav, "initNav");
    safe(initSmoothScroll, "initSmoothScroll");
    safe(initReveals, "initReveals");
    safe(initCardTilt, "initCardTilt");
    safe(initFilters, "initFilters");
    safe(initCollectionCounts, "initCollectionCounts");
    safe(initSpotlights, "initSpotlights");
    safe(initWorldCards, "initWorldCards");
    safe(initMovementVideos, "initMovementVideos");
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
