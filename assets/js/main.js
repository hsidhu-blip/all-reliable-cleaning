/* All Reliable Cleaning site script. Loaded with defer on every page. No libraries. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     CONFIG: the only values to edit. Anything still containing "{{" is
     treated as not configured and stays switched off.
     --------------------------------------------------------------------- */
  var CONFIG = {
    GA4_ID: '{{GA4_ID}}',                         // e.g. G-XXXXXXXXXX
    GADS_ID_AND_LABEL: '{{GADS_ID_AND_LABEL}}',   // lead form conversion, e.g. AW-123456789/AbCdEfGhIjk
    GADS_CALL_ID_AND_LABEL: '{{GADS_CALL_ID_AND_LABEL}}', // optional: website call-click conversion
    THANK_YOU_URL: 'thank-you.html',
    REDIRECT_AFTER_MS: 1500,
    LEAD_FLAG: 'arc_lead',
    EC_KEY: 'arc_ec',             // enhanced conversions: phone held until the thank-you page, then deleted
    ATTR_KEY: 'arc_attr',         // ad click attribution (gclid / UTM), kept 90 days
    ATTR_DAYS: 90,
    SUBMITTED_KEY: 'arc_submitted', // set once a lead is sent: exit-intent pop-up stops for this visit
    EXIT_REARM_MS: 2000,            // pause after closing before the pop-up can show again
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
     Open every new page at the top. Browsers do this anyway, but some
     embedded viewers (e.g. a preview frame that grows to the page height)
     keep the outer scroll position between pages. Links to a section
     (#hash), back/forward and reload keep their normal behaviour.
     --------------------------------------------------------------------- */
  (function startAtTop() {
    if (window.location.hash) return;
    var nav = window.performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    var type = nav ? nav.type : (window.performance && performance.navigation ? ['navigate', 'reload', 'back_forward'][performance.navigation.type] : 'navigate');
    if (type === 'back_forward' || type === 'reload') return;
    window.scrollTo(0, 0);
    var pad = root.style.scrollPaddingTop;
    root.style.scrollPaddingTop = '0px'; // the sticky-header offset is for #section links, not for the top of the page
    try { root.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' }); } catch (e) { root.scrollIntoView(true); }
    root.style.scrollPaddingTop = pad;
  })();

  /* ---------------------------------------------------------------------
     Tracking: gtag.js is injected only once real IDs are in CONFIG.
     --------------------------------------------------------------------- */
  var ga4On = isConfigured(CONFIG.GA4_ID);
  var adsOn = isConfigured(CONFIG.GADS_ID_AND_LABEL);
  var callOn = isConfigured(CONFIG.GADS_CALL_ID_AND_LABEL);
  var adsAccount = adsOn ? CONFIG.GADS_ID_AND_LABEL.split('/')[0] : (callOn ? CONFIG.GADS_CALL_ID_AND_LABEL.split('/')[0] : '');
  var trackingOn = ga4On || !!adsAccount;

  if (trackingOn) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    if (ga4On) window.gtag('config', CONFIG.GA4_ID);
    if (adsAccount) window.gtag('config', adsAccount, { allow_enhanced_conversions: true });
    var tag = doc.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4On ? CONFIG.GA4_ID : adsAccount);
    doc.head.appendChild(tag);
  }

  function track(eventName, params) {
    if (trackingOn && typeof window.gtag === 'function') window.gtag('event', eventName, params || {});
  }

  /* Ad click attribution: capture gclid / gbraid / wbraid / UTMs from the
     landing URL so every lead in GHL says which campaign and keyword it came from. */
  var ATTR_FIELDS = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  function readAttribution() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(CONFIG.ATTR_KEY) || 'null');
      if (saved && Date.now() - saved.ts < CONFIG.ATTR_DAYS * 864e5) return saved;
    } catch (e) { /* blocked or corrupt: ignore */ }
    return null;
  }
  (function captureAttribution() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
    var found = { ts: Date.now(), landing_page: window.location.pathname };
    var any = false;
    ATTR_FIELDS.forEach(function (key) {
      var value = (params.get(key) || '').slice(0, 200);
      found[key] = value;
      if (value) any = true;
    });
    if (!any) return; // keep the earlier click; a plain visit doesn't overwrite it
    try { window.localStorage.setItem(CONFIG.ATTR_KEY, JSON.stringify(found)); } catch (e) { /* ignore */ }
  })();

  // Australian numbers to E.164 for enhanced conversions (+61412345678).
  function toE164(raw) {
    var digits = raw.replace(/[^\d+]/g, '');
    if (/^\+61[23478]\d{8}$/.test(digits)) return digits;
    if (/^61[23478]\d{8}$/.test(digits)) return '+' + digits;
    if (/^0[23478]\d{8}$/.test(digits)) return '+61' + digits.slice(1);
    return '';
  }

  // click_to_call on every tel: tap, via one delegated listener.
  doc.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[href^="tel:"]') : null;
    if (!link) return;
    track('click_to_call', {
      link_location: link.getAttribute('data-call-location') || 'inline',
      page_path: window.location.pathname
    });
    if (callOn) track('conversion', { send_to: CONFIG.GADS_CALL_ID_AND_LABEL });
  });

  // Conversion: thank-you page only, once per submitted lead.
  if (doc.body && doc.body.hasAttribute('data-thank-you')) {
    if (storage('get', CONFIG.LEAD_FLAG)) {
      storage('remove', CONFIG.LEAD_FLAG); // reloads must not double-count
      var ecPhone = storage('get', CONFIG.EC_KEY);
      storage('remove', CONFIG.EC_KEY);
      if (adsOn) {
        if (ecPhone) window.gtag('set', 'user_data', { phone_number: ecPhone });
        track('conversion', { send_to: CONFIG.GADS_ID_AND_LABEL });
      }
      if (ga4On) track('generate_lead', { send_to: CONFIG.GA4_ID });
    }
  }

  /* ---------------------------------------------------------------------
     Landing pages: match the headline to a suburb ad group (?area=Joondalup).
     Only suburbs already listed on the page are accepted.
     --------------------------------------------------------------------- */
  (function personaliseArea() {
    var targets = doc.querySelectorAll('[data-area]');
    if (!targets.length) return;
    var wanted;
    var norm = function (t) { return t.trim().toLowerCase().replace(/[\u2018\u2019`]/g, "'").replace(/[\s_-]+/g, ' '); };
    try { wanted = norm(new URLSearchParams(window.location.search).get('area') || ''); } catch (e) { return; }
    if (!wanted) return;
    var match = null;
    Array.prototype.forEach.call(doc.querySelectorAll('.suburbs li'), function (li) {
      if (!match && norm(li.textContent) === wanted) match = li.textContent.trim();
    });
    if (!match) return;
    Array.prototype.forEach.call(targets, function (el) { el.textContent = match; });
    var suburb = doc.getElementById('q-suburb');
    if (suburb && !suburb.value) suburb.value = match;
  })();

  /* ---------------------------------------------------------------------
     Mobile navigation toggle (full-site pages only)
     --------------------------------------------------------------------- */
  var navToggle = doc.querySelector('.nav-toggle');
  if (navToggle) {
    var navLabel = navToggle.querySelector('.nav-toggle-label');
    var setNav = function (open) {
      navToggle.setAttribute('aria-expanded', String(open));
      root.classList.toggle('nav-open', open);
      if (navLabel) navLabel.textContent = open ? 'Close' : 'Menu';
    };
    navToggle.addEventListener('click', function () {
      setNav(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && root.classList.contains('nav-open')) { setNav(false); navToggle.focus(); }
    });
  }

  // Services dropdown: click or tap to open, Escape or outside click to close. Hover and focus also open it (CSS).
  var menu = doc.querySelector('.has-menu');
  if (menu) {
    var menuBtn = menu.querySelector('.menu-btn');
    var setMenu = function (open) { menu.classList.toggle('is-open', open); menuBtn.setAttribute('aria-expanded', String(open)); };
    menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    doc.addEventListener('click', function (event) { if (!menu.contains(event.target)) setMenu(false); });
    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    });
    menu.addEventListener('focusout', function (event) { if (!menu.contains(event.relatedTarget)) setMenu(false); });
  }

  /* ---------------------------------------------------------------------
     Quote form: inline validation, honeypot, Web3Forms POST, redirect.
     Each form posts to its own action (Web3Forms) with its hidden access_key.
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

  /* Fewer visible fields = more leads. On ad landing pages the service is
     already known, so it collapses to a one-line summary; the optional note
     collapses to a link on every form. Without JS the full form shows. */
  function compactForm(form) {
    var select = form.elements.service;
    if (form.hasAttribute('data-lock-service') && select && select.value) {
      var field = select.closest('.field');
      var summary = doc.createElement('p');
      summary.className = 'svc-summary';
      summary.innerHTML = '<span>Service: <strong></strong></span><button type="button" class="link-btn">Change</button>';
      summary.querySelector('strong').textContent = select.value;
      field.parentNode.insertBefore(summary, field);
      field.hidden = true;
      summary.querySelector('button').addEventListener('click', function () {
        field.hidden = false;
        summary.parentNode.removeChild(summary);
        select.focus();
      });
    }
    var note = form.elements.message;
    if (note && !note.value) {
      var noteField = note.closest('.field');
      var toggle = doc.createElement('button');
      toggle.type = 'button';
      toggle.className = 'link-btn note-toggle';
      toggle.textContent = '+ Add a note (optional)';
      noteField.parentNode.insertBefore(toggle, noteField);
      noteField.hidden = true;
      toggle.addEventListener('click', function () {
        noteField.hidden = false;
        toggle.parentNode.removeChild(toggle);
        note.focus();
      });
    }
  }

  Array.prototype.forEach.call(doc.querySelectorAll('form[data-quote-form]'), function (form) {
    compactForm(form);
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

      var key = form.elements.access_key ? form.elements.access_key.value : '';
      if (!isConfigured(key)) {
        console.error('Quote form: the WEB3FORMS_ACCESS_KEY placeholder has not been replaced, so this lead was NOT sent. Add the Web3Forms access key before launch.');
        goToThankYou(state);
        return;
      }

      var body = new URLSearchParams();
      body.append('access_key', key);
      FIELDS.forEach(function (name) {
        var input = form.elements[name];
        body.append(name, input ? input.value.trim() : '');
      });
      var service = form.elements.service ? form.elements.service.value : '';
      var suburb = form.elements.suburb ? form.elements.suburb.value.trim() : '';
      body.append('subject', 'New quote request' + (service ? ': ' + service : '') + (suburb ? ', ' + suburb : ''));
      body.append('from_name', 'All Reliable Cleaning website');
      // Ad attribution only when present, so the lead email stays short.
      var attribution = readAttribution() || {};
      ATTR_FIELDS.concat('landing_page').forEach(function (key) { if (attribution[key]) body.append(key, attribution[key]); });
      body.append('submitted_from', window.location.pathname);
      body.append('form_type', form.getAttribute('data-form-type') || 'main');
      storage('set', CONFIG.SUBMITTED_KEY, '1');

      storage('set', CONFIG.LEAD_FLAG, '1');
      if (adsOn) {
        var e164 = toE164(form.elements.phone.value);
        if (e164) storage('set', CONFIG.EC_KEY, e164);
      }
      window.setTimeout(function () { goToThankYou(state); }, CONFIG.REDIRECT_AFTER_MS);
      try {
        fetch(form.getAttribute('action'), {
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
    var wanted = link.getAttribute('data-service');
    var select = doc.getElementById('q-service');
    if (wanted && select) { select.value = wanted; validate(select); }
    window.setTimeout(function () {
      try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); }
    }, reducedMotion ? 0 : 450);
  });

  // contact.html?service=Office%20cleaning#quote preselects that service.
  (function preselectService() {
    var select = doc.getElementById('q-service');
    if (!select) return;
    var wanted;
    try { wanted = new URLSearchParams(window.location.search).get('service'); } catch (e) { return; }
    if (!wanted) return;
    Array.prototype.forEach.call(select.options, function (opt) { if (opt.value && opt.value === wanted) select.value = wanted; });
  })();

  /* ---------------------------------------------------------------------
     Exit-intent pop-up (desktop only). Opens every time the pointer leaves
     through the top of the window. Easy to close; never blocks leaving, never
     touches the back button (both required by Google Ads policy). Re-arms
     EXIT_REARM_MS after closing.
     --------------------------------------------------------------------- */
  (function exitIntent() {
    var modal = doc.getElementById('exit-modal');
    if (!modal || typeof modal.showModal !== 'function') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var armed = false;
    window.setTimeout(function () { armed = true; }, 1500); // ignore a cursor that starts at the top edge

    function open() {
      if (!armed || modal.open || storage('get', CONFIG.SUBMITTED_KEY)) return;
      armed = false;
      modal.showModal();
      track('exit_intent_shown', { page_path: window.location.pathname });
      var first = modal.querySelector('input[name="name"]');
      if (first) first.focus();
    }
    function close() { if (modal.open) modal.close(); }

    doc.addEventListener('mouseout', function (event) {
      if (event.relatedTarget || event.toElement) return; // still inside the page
      if (event.clientY > 0) return;                     // left through the sides or bottom
      open();
    });
    // Re-arm only by timer. Leaving through the top again needs the pointer back on the page anyway.
    modal.addEventListener('close', function () {
      window.setTimeout(function () { armed = true; }, CONFIG.EXIT_REARM_MS);
    });
    Array.prototype.forEach.call(modal.querySelectorAll('[data-exit-close]'), function (btn) { btn.addEventListener('click', close); });
    modal.addEventListener('click', function (event) { // click on the dimmed backdrop closes it
      if (event.target !== modal) return;
      var box = modal.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
    });
  })();

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
     3D tilt: fine pointers with hover only. The quote card tilts gently (data-tilt-max) and
     stops while a field in it has focus.
     --------------------------------------------------------------------- */
  var canTilt = !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canTilt) {
    root.classList.add('has-tilt');
    var resetters = [];
    Array.prototype.forEach.call(doc.querySelectorAll('[data-tilt]'), function (card) {
      var cardMax = Math.min(CONFIG.TILT_MAX_DEG, parseFloat(card.getAttribute('data-tilt-max')) || CONFIG.TILT_MAX_DEG);
      var typing = false; // the quote card holds still while someone is filling it in
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
        var max = cardMax;
        var rx = Math.max(-max, Math.min(max, -y * 2 * max));
        var ry = Math.max(-max, Math.min(max, x * 2 * max));
        next = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        if (!frame) {
          frame = window.requestAnimationFrame(function () { frame = 0; if (box) card.style.transform = next; });
        }
      }
      card.addEventListener('pointerenter', function (event) {
        if (box || typing || event.pointerType !== 'mouse') return;
        box = card.getBoundingClientRect();
        doc.addEventListener('pointermove', onMove);
        onMove(event);
      });
      card.addEventListener('focusin', function (event) {
        if (/^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)) { typing = true; reset(); }
      });
      card.addEventListener('focusout', function () {
        window.setTimeout(function () { if (!card.contains(doc.activeElement)) typing = false; }, 0);
      });
      resetters.push(reset);
    });
    window.addEventListener('scroll', function () { resetters.forEach(function (fn) { fn(); }); }, { passive: true });
  }
})();
