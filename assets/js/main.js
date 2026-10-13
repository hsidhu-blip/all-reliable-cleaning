/* {{BUSINESS_NAME}} site script. Loaded with defer on every page. No libraries. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     CONFIG: the only values to edit. Anything still containing "{{" is
     treated as not configured and stays switched off.
     --------------------------------------------------------------------- */
  var CONFIG = {
    GA4_ID: '{{GA4_ID}}',                         // e.g. G-XXXXXXXXXX
    GADS_ID_AND_LABEL: '{{GADS_ID_AND_LABEL}}',   // e.g. AW-123456789/AbCdEfGhIjk
    GHL_WEBHOOK_URL: '{{GHL_WEBHOOK_URL}}',       // GoHighLevel inbound webhook URL
    THANK_YOU_URL: 'thank-you.html',
    REDIRECT_AFTER_MS: 1500,
    LEAD_FLAG: 'arc_lead',
    TILT_MAX_DEG: 6
  };

  var doc = document;
  var root = doc.documentElement;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isConfigured(value) {
    return typeof value === 'string' && value.length > 0 && value.indexOf('{{') === -1;
  }

  function storage(action, key, value) {
    try {
      if (action === 'get') return window.sessionStorage.getItem(key);
      if (action === 'set') window.sessionStorage.setItem(key, value);
      if (action === 'remove') window.sessionStorage.removeItem(key);
    } catch (e) { /* storage blocked: carry on */ }
    return null;
  }

  /* ---------------------------------------------------------------------
     Tracking: gtag.js is injected only once real IDs are in CONFIG.
     --------------------------------------------------------------------- */
  var ga4On = isConfigured(CONFIG.GA4_ID);
  var adsOn = isConfigured(CONFIG.GADS_ID_AND_LABEL);
  var adsAccount = adsOn ? CONFIG.GADS_ID_AND_LABEL.split('/')[0] : '';

  if (ga4On || adsOn) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    if (ga4On) window.gtag('config', CONFIG.GA4_ID);
    if (adsOn) window.gtag('config', adsAccount);
    var tag = doc.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4On ? CONFIG.GA4_ID : adsAccount);
    doc.head.appendChild(tag);
  }

  function track(eventName, params) {
    if (typeof window.gtag === 'function' && (ga4On || adsOn)) window.gtag('event', eventName, params || {});
  }

  // click_to_call on every tel: tap, via one delegated listener.
  doc.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[href^="tel:"]') : null;
    if (!link) return;
    track('click_to_call', {
      link_location: link.getAttribute('data-call-location') || 'inline',
      page_path: window.location.pathname
    });
  });

  // Conversion: thank-you page only, once per submitted lead.
  if (doc.body && doc.body.hasAttribute('data-thank-you')) {
    if (storage('get', CONFIG.LEAD_FLAG)) {
      storage('remove', CONFIG.LEAD_FLAG); // reloads must not double-count
      if (adsOn) track('conversion', { send_to: CONFIG.GADS_ID_AND_LABEL });
      if (ga4On) track('generate_lead', { send_to: CONFIG.GA4_ID });
    }
  }

  /* ---------------------------------------------------------------------
     Mobile navigation toggle (full-site pages only)
     --------------------------------------------------------------------- */
  var navToggle = doc.querySelector('.nav-toggle');
  if (navToggle) {
    var setNav = function (open) {
      navToggle.setAttribute('aria-expanded', String(open));
      root.classList.toggle('nav-open', open);
    };
    navToggle.addEventListener('click', function () {
      setNav(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && root.classList.contains('nav-open')) { setNav(false); navToggle.focus(); }
    });
  }

  /* ---------------------------------------------------------------------
     Quote form: inline validation, honeypot, webhook POST, redirect.
     --------------------------------------------------------------------- */
  var FIELDS = ['name', 'phone', 'suburb', 'service', 'message'];

  function isAustralianPhone(raw) {
    var digits = raw.replace(/[\s\-().]/g, '');
    return /^(?:\+?61|0)[23478]\d{8}$/.test(digits) || // mobiles and landlines
      /^1[38]00\d{6}$/.test(digits) ||                 // 1300 / 1800
      /^13\d{4}$/.test(digits);                         // 13 numbers
  }

  var RULES = {
    name: function (v) { return v.length >= 2 ? '' : 'Enter your name so we know who to ask for.'; },
    phone: function (v) {
      if (!v) return 'Enter your phone number so we can send your quote.';
      return isAustralianPhone(v) ? '' : 'Enter an Australian number, e.g. 04XX XXX XXX or 08 XXXX XXXX.';
    },
    suburb: function (v) { return v.length >= 2 ? '' : 'Enter your suburb so we can confirm we cover it.'; },
    service: function (v) { return v ? '' : 'Choose the service you need.'; }
  };

  function validate(input) {
    var rule = RULES[input.name];
    if (!rule) return true;
    var message = rule(input.value.trim());
    var error = doc.getElementById(input.id + '-error');
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (error) error.textContent = message;
      return false;
    }
    input.removeAttribute('aria-invalid');
    if (error) error.textContent = '';
    return true;
  }

  function goToThankYou(state) {
    if (state.done) return;
    state.done = true;
    window.location.href = CONFIG.THANK_YOU_URL; // no personal data in the URL
  }

  Array.prototype.forEach.call(doc.querySelectorAll('form[data-quote-form]'), function (form) {
    form.addEventListener('focusout', function (event) {
      if (RULES[event.target.name]) validate(event.target);
    });
    form.addEventListener('change', function (event) {
      if (event.target.tagName === 'SELECT') validate(event.target);
    });
    form.addEventListener('input', function (event) {
      if (event.target.getAttribute('aria-invalid') === 'true') validate(event.target);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (form.getAttribute('data-sending')) return;

      var firstInvalid = null;
      Object.keys(RULES).forEach(function (name) {
        var input = form.elements[name];
        if (input && !validate(input) && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

      form.setAttribute('data-sending', '1');
      var button = form.querySelector('button[type="submit"]');
      if (button) button.setAttribute('aria-busy', 'true');
      var state = { done: false };

      // Honeypot filled: act as if it worked, send nothing, record no lead.
      var trap = form.querySelector('[data-hp]');
      if (trap && trap.value) { goToThankYou(state); return; }

      if (!isConfigured(CONFIG.GHL_WEBHOOK_URL)) {
        console.error('Quote form: the GHL_WEBHOOK_URL placeholder in assets/js/main.js has not been replaced, so this lead was NOT sent. Add the GoHighLevel webhook URL before launch.');
        goToThankYou(state);
        return;
      }

      var body = new URLSearchParams();
      FIELDS.forEach(function (name) {
        var input = form.elements[name];
        body.append(name, input ? input.value.trim() : '');
      });

      storage('set', CONFIG.LEAD_FLAG, '1');
      window.setTimeout(function () { goToThankYou(state); }, CONFIG.REDIRECT_AFTER_MS);
      try {
        fetch(CONFIG.GHL_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          keepalive: true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: body.toString()
        }).then(function () { goToThankYou(state); }, function () { goToThankYou(state); });
      } catch (err) {
        goToThankYou(state);
      }
    });
  });

  // "Get My Free Quote" links to an on-page form: focus the first field after the scroll.
  doc.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[href="#quote"]') : null;
    if (!link) return;
    var first = doc.querySelector('#quote input[name="name"]');
    if (!first) return;
    window.setTimeout(function () {
      try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); }
    }, reducedMotion ? 0 : 450);
  });

  /* ---------------------------------------------------------------------
     Scroll reveal: replays every time (class added on enter, removed on leave).
     --------------------------------------------------------------------- */
  var revealEls = doc.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(revealEls, function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------
     3D tilt: fine pointers with hover only, never on the quote form card.
     --------------------------------------------------------------------- */
  var canTilt = !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canTilt) {
    root.classList.add('has-tilt');
    var resetters = [];
    Array.prototype.forEach.call(doc.querySelectorAll('[data-tilt]'), function (card) {
      if (card.closest('.quote-card')) return;
      var frame = 0;
      var next = '';
      var box = null; // untransformed rect, captured on enter, so the tilt itself can't trigger a leave

      function reset() {
        if (!box) return;
        box = null;
        doc.removeEventListener('pointermove', onMove);
        if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
        card.style.transform = '';
      }
      function onMove(event) {
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) { reset(); return; }
        var x = (event.clientX - box.left) / box.width - 0.5;
        var y = (event.clientY - box.top) / box.height - 0.5;
        var max = CONFIG.TILT_MAX_DEG;
        var rx = Math.max(-max, Math.min(max, -y * 2 * max));
        var ry = Math.max(-max, Math.min(max, x * 2 * max));
        next = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        if (!frame) {
          frame = window.requestAnimationFrame(function () { frame = 0; if (box) card.style.transform = next; });
        }
      }
      card.addEventListener('pointerenter', function (event) {
        if (box || event.pointerType !== 'mouse') return;
        box = card.getBoundingClientRect();
        doc.addEventListener('pointermove', onMove);
        onMove(event);
      });
      resetters.push(reset);
    });
    window.addEventListener('scroll', function () { resetters.forEach(function (fn) { fn(); }); }, { passive: true });
  }
})();
