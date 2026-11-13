/* Honestly Texas — theme scripts */
(function () {
  'use strict';

  var overlay = document.querySelector('[data-overlay]');
  var lastFocus = null;

  function lock(on) { document.body.classList.toggle('is-locked', on); if (overlay) overlay.hidden = !on; }

  function trapFocus(el) {
    var f = el.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
    if (f.length) f[0].focus();
  }

  /* ---------- Panels: mobile menu + cart drawer ---------- */
  function openPanel(el) {
    if (!el) return;
    lastFocus = document.activeElement;
    closeAll();
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    lock(true);
    document.querySelectorAll('[aria-controls="' + el.id + '"]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    setTimeout(function () { trapFocus(el); }, 50);
  }
  function closeAll() {
    document.querySelectorAll('.drawer.is-open, .mobile-menu.is-open').forEach(function (el) {
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
      document.querySelectorAll('[aria-controls="' + el.id + '"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    });
    lock(false);
  }
  function closePanels() { closeAll(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  document.addEventListener('click', function (e) {
    var openMenu = e.target.closest('[data-open-menu]');
    if (openMenu) { e.preventDefault(); openPanel(document.getElementById('MobileMenu')); return; }
    var openCart = e.target.closest('[data-open-cart]');
    if (openCart && document.getElementById('CartDrawer')) { e.preventDefault(); openPanel(document.getElementById('CartDrawer')); return; }
    if (e.target.closest('[data-close-panel]') || e.target === overlay) { e.preventDefault(); closePanels(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanels(); });

  /* ---------- Money ---------- */
  function formatMoney(cents) {
    var fmt = (window.HT && window.HT.moneyFormat) || '${{amount}}';
    var v = (cents / 100).toFixed(2);
    var parts = v.split('.');
    var withCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1];
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, k) {
      if (k === 'amount_no_decimals') return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      if (k === 'amount_with_comma_separator') return withCommas.replace('.', ',');
      return withCommas;
    });
  }
  window.HT = window.HT || {}; window.HT.formatMoney = formatMoney;

  /* ---------- Cart ---------- */
  var sectionsToRender = ['cart-drawer', 'header'];

  function updateCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = count; });
  }

  function renderSections(sections) {
    if (!sections) return;
    if (sections['cart-drawer']) {
      var html = new DOMParser().parseFromString(sections['cart-drawer'], 'text/html');
      var fresh = html.querySelector('#CartDrawerInner');
      var cur = document.getElementById('CartDrawerInner');
      if (fresh && cur) cur.replaceWith(fresh);
    }
    if (sections.header) {
      var h = new DOMParser().parseFromString(sections.header, 'text/html');
      var c = h.querySelector('[data-cart-count]');
      if (c) updateCount(c.textContent.trim());
    }
  }

  function drawer() { return document.getElementById('CartDrawer'); }
  function setBusy(on) { var d = drawer(); if (d) d.setAttribute('aria-busy', on ? 'true' : 'false'); }
  function setStatus(msg) { var s = document.getElementById('CartDrawerStatus'); if (s) s.textContent = msg || ''; }

  function cartRequest(url, body) {
    body.sections = sectionsToRender;
    body.sections_url = window.location.pathname;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok || data.status) { var err = new Error(data.description || data.message || 'Something went wrong. Please try again.'); err.data = data; throw err; }
        return data;
      });
    });
  }

  function addToCart(items, btn, errEl) {
    if (btn) { btn.classList.add('is-loading'); btn.setAttribute('aria-disabled', 'true'); }
    if (errEl) errEl.textContent = '';
    return cartRequest(window.HT.routes.cartAdd + '.js', { items: items })
      .then(function (data) {
        renderSections(data.sections);
        var d = drawer();
        if (d) openPanel(d); else window.location.href = window.HT.routes.cart;
      })
      .catch(function (err) {
        if (errEl) errEl.textContent = err.message; else alert(err.message);
      })
      .finally(function () {
        if (btn) { btn.classList.remove('is-loading'); btn.removeAttribute('aria-disabled'); }
      });
  }

  function changeLine(line, quantity) {
    setBusy(true); setStatus('');
    return cartRequest(window.HT.routes.cartChange + '.js', { line: line, quantity: quantity })
      .then(function (data) {
        renderSections(data.sections);
        updateCount(data.item_count);
        var d = drawer();
        if (d && d.classList.contains('is-open')) setTimeout(function () {
          var target = d.querySelector('[data-line="' + line + '"] input') || d.querySelector('.drawer__close');
          if (target) target.focus();
        }, 30);
      })
      .catch(function (err) { setStatus(err.message || 'We couldn’t update your bag. Please try again.'); })
      .finally(function () { setBusy(false); });
  }

  // Product forms (PDP + quick add)
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-product-form]');
    if (!form || !drawer()) return;
    e.preventDefault();
    var fd = new FormData(form);
    var qty = parseInt(fd.get('quantity') || '1', 10);
    if (!qty || qty < 1) qty = 1;
    var btn = form.querySelector('[type="submit"]');
    var errEl = form.querySelector('[data-form-error]');
    addToCart([{ id: fd.get('id'), quantity: qty }], btn, errEl);
  });

  document.addEventListener('click', function (e) {
    var q = e.target.closest('[data-quick-add]');
    if (q && drawer()) {
      e.preventDefault();
      addToCart([{ id: q.getAttribute('data-quick-add'), quantity: 1 }], q, null);
      return;
    }
    var step = e.target.closest('[data-cart-step]');
    if (step) {
      var row = step.closest('[data-line]');
      var input = row.querySelector('input');
      var next = Math.max(0, parseInt(input.value || '0', 10) + parseInt(step.getAttribute('data-cart-step'), 10));
      input.value = next;
      changeLine(parseInt(row.getAttribute('data-line'), 10), next);
      return;
    }
    var rm = e.target.closest('[data-cart-remove]');
    if (rm) {
      e.preventDefault();
      changeLine(parseInt(rm.closest('[data-line]').getAttribute('data-line'), 10), 0);
      return;
    }
    var qs = e.target.closest('[data-qty-step]');
    if (qs) {
      var inp = qs.parentElement.querySelector('input');
      var min = parseInt(inp.min || '1', 10);
      inp.value = Math.max(min, (parseInt(inp.value, 10) || min) + parseInt(qs.getAttribute('data-qty-step'), 10));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  document.addEventListener('change', function (e) {
    var input = e.target.closest('[data-line] input[data-cart-qty]');
    if (!input) return;
    var v = parseInt(input.value, 10);
    if (isNaN(v) || v < 0) { setStatus('Enter a quantity of 0 or more.'); input.setAttribute('aria-invalid', 'true'); return; }
    input.removeAttribute('aria-invalid');
    changeLine(parseInt(input.closest('[data-line]').getAttribute('data-line'), 10), v);
  });

  /* ---------- PDP: gallery + variants ---------- */
  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var main = g.querySelector('[data-gallery-main]');
    g.addEventListener('click', function (e) {
      var t = e.target.closest('[data-gallery-thumb]');
      if (!t) return;
      main.src = t.getAttribute('data-src');
      main.srcset = t.getAttribute('data-srcset') || '';
      main.alt = t.getAttribute('data-alt') || '';
      main.classList.toggle('is-photo', t.hasAttribute('data-photo'));
      g.querySelectorAll('[data-gallery-thumb]').forEach(function (b) { b.setAttribute('aria-current', b === t ? 'true' : 'false'); });
    });
  });

  document.querySelectorAll('[data-variant-picker]').forEach(function (picker) {
    var root = picker.closest('[data-product]');
    var data = JSON.parse(root.querySelector('[data-variants-json]').textContent);
    picker.addEventListener('change', function () {
      var selected = Array.prototype.map.call(picker.querySelectorAll('fieldset'), function (fs) {
        var c = fs.querySelector('input:checked'); return c ? c.value : null;
      });
      var v = data.find(function (x) { return x.options.every(function (o, i) { return o === selected[i]; }); });
      var btn = root.querySelector('[data-add-button]');
      var idInput = root.querySelector('input[name="id"]');
      var price = root.querySelector('[data-price]');
      if (!v) { btn.disabled = true; btn.textContent = 'Unavailable'; return; }
      idInput.value = v.id;
      btn.disabled = !v.available;
      btn.innerHTML = v.available ? btn.getAttribute('data-label') : 'Sold out';
      if (price) price.innerHTML = formatMoney(v.price) + (v.compare_at_price > v.price ? ' <s>' + formatMoney(v.compare_at_price) + '</s>' : '');
      var url = new URL(window.location.href); url.searchParams.set('variant', v.id);
      window.history.replaceState({}, '', url.toString());
      if (v.featured_image) {
        var main = root.querySelector('[data-gallery-main]');
        if (main) { main.src = v.featured_image.src + (v.featured_image.src.indexOf('?') > -1 ? '&' : '?') + 'width=1200'; main.srcset = ''; }
      }
    });
  });

  /* ---------- FAQ search ---------- */
  document.querySelectorAll('[data-faq-search]').forEach(function (input) {
    var list = document.querySelector(input.getAttribute('data-faq-search'));
    var empty = document.querySelector('[data-faq-empty]');
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      list.querySelectorAll('.faq-item').forEach(function (item) {
        var match = !q || item.textContent.toLowerCase().indexOf(q) > -1;
        item.hidden = !match;
        if (match) { shown++; if (q) item.open = true; }
      });
      if (empty) empty.hidden = shown !== 0;
    });
  });

  /* ---------- Sort select ---------- */
  document.querySelectorAll('[data-sort]').forEach(function (s) {
    s.addEventListener('change', function () {
      var url = new URL(window.location.href); url.searchParams.set('sort_by', s.value); url.searchParams.delete('page');
      window.location.href = url.toString();
    });
  });

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }
})();
document.addEventListener('shopify:section:load', function (e) {
  e.target.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
});
