// VG Construção — shared site chrome: header, footer, WhatsApp links,
// scroll-reveal, broken-image fallback and the CTA button loop.
// Runs on every page. Page-specific behaviour lives in js/interactions.js.
(function () {
  'use strict';

  // Fonte única das mensagens de WhatsApp: todo CTA do site sai daqui, então
  // editar uma mensagem — ou adicionar uma origem nova — é mudar uma linha só.
  var WA_DATA = {
    PHONE: '5545988431052',
    MESSAGES: {
      geral: 'Olá! Vim pelo site da VG Construção e quero fazer um orçamento.',
      construcao: 'Olá! Vim pelo site da VG Construção e quero um orçamento de construção e ampliação.',
      reforma: 'Olá! Vim pelo site da VG Construção e quero um orçamento de reforma e acabamento.',
      pintura: 'Olá! Vim pelo site da VG Construção e quero um orçamento de pintura.',
      ceramica: 'Olá! Vim pelo site da VG Construção e quero um orçamento de cerâmica e porcelanato.',
      eletrica: 'Olá! Vim pelo site da VG Construção e quero um orçamento de elétrica.',
      instalacoes: 'Olá! Vim pelo site da VG Construção e quero um orçamento de instalações.',
      telhado: 'Olá! Vim pelo site da VG Construção e quero um orçamento de telhado e impermeabilização.',
      manutencao: 'Olá! Vim pelo site da VG Construção e quero um orçamento de manutenção geral.'
    },
    link: function (key) {
      var msg = this.MESSAGES[key] || this.MESSAGES.geral;
      return 'https://wa.me/' + this.PHONE + '?text=' + encodeURIComponent(msg);
    }
  };
  window.WA_DATA = WA_DATA;

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // ---- WhatsApp links: any element with data-wa="key" gets its href set ----
  function wireWaLinks() {
    document.querySelectorAll('[data-wa]').forEach(function (el) {
      el.setAttribute('href', WA_DATA.link(el.getAttribute('data-wa')));
    });
  }

  // ---- Header: scroll shrink + progress bar + mobile menu ----
  function initHeader() {
    var header = document.getElementById('siteHeader');
    if (!header) return;
    var progress = document.querySelector('.scroll-progress');
    var bubble = document.getElementById('scrollBubble');
    var hamburger = document.getElementById('hamburgerBtn');
    var menu = document.getElementById('mobileMenu');
    var closeBtn = menu ? menu.querySelector('.mobile-menu__close') : null;
    var lastFocused = null;
    var scrollLocked = false;

    function onScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var scrolled = window.scrollY > 40;
      header.classList.toggle('is-scrolled', scrolled);
      if (bubble) {
        var pct = max > 0 ? Math.min(99, Math.max(1, Math.round((window.scrollY / max) * 100))) : 0;
        bubble.style.left = pct + '%';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!hamburger || !menu) return;

    function onKeyDown(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (e.key === 'Tab') {
        var focusables = menu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    function openMenu() {
      lastFocused = document.activeElement;
      menu.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      scrollLocked = true;
      document.addEventListener('keydown', onKeyDown);
      if (progress) progress.classList.add('is-hidden');
      window.dispatchEvent(new CustomEvent('os:menu', { detail: { open: true } }));
      setTimeout(function () { if (closeBtn) closeBtn.focus(); }, 30);
    }
    function closeMenu() {
      menu.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      if (scrollLocked) { document.body.style.overflow = ''; scrollLocked = false; }
      document.removeEventListener('keydown', onKeyDown);
      if (progress) progress.classList.remove('is-hidden');
      window.dispatchEvent(new CustomEvent('os:menu', { detail: { open: false } }));
      hamburger.focus();
    }
    hamburger.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) closeMenu(); else openMenu();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    menu.querySelectorAll('.nav-link, .mobile-menu__wa').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900 && menu.classList.contains('is-open')) closeMenu();
    });
  }

  // ---- Footer year ----
  function initFooterYear() {
    var el = document.getElementById('footerYear');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ---- Reveal-on-scroll: adds .is-visible once an element enters the viewport ----
  function initReveal() {
    var targets = document.querySelectorAll('.reveal, .hero-stripes, .steps-wrap, .service-card');
    if (!targets.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      document.dispatchEvent(new CustomEvent('os:reveal', { detail: { reducedMotion: true } }));
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          document.dispatchEvent(new CustomEvent('os:reveal', { detail: { target: entry.target } }));
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    targets.forEach(function (el) { io.observe(el); });
  }

  // ---- Broken image fallback: any .photo-frame / .service-block__frame with an <img> ----
  function initPhotoFallback() {
    document.querySelectorAll('.photo-frame img, .service-block__frame img').forEach(function (img) {
      img.addEventListener('error', function () {
        var wrap = img.closest('.photo-frame, .service-block__frame');
        if (wrap) wrap.classList.add('is-broken');
      });
    });
  }

  // ---- CTA "paint roller" buttons: hover-trigger + slow auto-loop while visible ----
  function initCtaButtons() {
    var buttons = document.querySelectorAll('.btn-cta');
    if (!buttons.length) return;
    buttons.forEach(function (btn) {
      var paintTimeout, loopInterval, visible = false;
      function paintOnce() {
        btn.classList.add('is-painted');
        clearTimeout(paintTimeout);
        paintTimeout = setTimeout(function () { btn.classList.remove('is-painted'); }, 1800);
      }
      function startLoop() {
        if (loopInterval || reducedMotion) return;
        paintOnce();
        loopInterval = setInterval(paintOnce, 6000);
      }
      function stopLoop() {
        if (loopInterval) { clearInterval(loopInterval); loopInterval = null; }
      }
      btn.addEventListener('mouseenter', paintOnce);
      if ('IntersectionObserver' in window && !reducedMotion) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            visible = entry.isIntersecting;
            if (visible && !document.hidden) startLoop(); else stopLoop();
          });
        }, { threshold: 0.35 });
        io.observe(btn);
        document.addEventListener('visibilitychange', function () {
          if (document.hidden) stopLoop(); else if (visible) startLoop();
        });
      }
    });
  }

  // ---- Floating WhatsApp button (mobile only, shown after scrolling) ----
  function initFloatingWa() {
    var fab = document.querySelector('.fab-wa');
    if (!fab) return;
    var menuOpen = false;
    window.addEventListener('os:menu', function (e) { menuOpen = e.detail.open; update(); });
    function update() {
      var show = window.innerWidth < 780 && window.scrollY > 480 && !menuOpen;
      fab.classList.toggle('is-visible', show);
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  window.osReducedMotion = reducedMotion;

  ready(function () {
    wireWaLinks();
    initHeader();
    initFooterYear();
    initReveal();
    initPhotoFallback();
    initCtaButtons();
    initFloatingWa();
  });
})();
