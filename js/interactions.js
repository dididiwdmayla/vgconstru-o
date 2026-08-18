// VG Construção — page-specific interactions. Loaded on every page but each
// block only wires up if the matching page/elements are present.
(function () {
  'use strict';

  var reducedMotion = !!window.osReducedMotion;
  var page = document.body.getAttribute('data-page');

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // ---- Shared: animated counters (index + sobre credibility numbers) ----
  function initCounters() {
    var grid = document.querySelector('.stats-grid');
    if (!grid) return;
    var nums = grid.querySelectorAll('[data-count-target]');
    if (!nums.length) return;
    function format(value) {
      return value.toLocaleString('pt-BR');
    }
    function run() {
      if (reducedMotion) {
        nums.forEach(function (el) { el.textContent = format(Number(el.getAttribute('data-count-target'))) + (el.getAttribute('data-count-suffix') || ''); });
        return;
      }
      var start = performance.now();
      var dur = 1200;
      function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var ease = 1 - Math.pow(1 - t, 3);
        nums.forEach(function (el) {
          var target = Number(el.getAttribute('data-count-target'));
          var suffix = el.getAttribute('data-count-suffix') || '';
          el.textContent = format(Math.round(target * ease)) + suffix;
        });
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (reducedMotion || !('IntersectionObserver' in window)) { run(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(); io.unobserve(entry.target); }
      });
    }, { threshold: 0.25 });
    io.observe(grid);
  }

  // ---- Index: hero reveal + hammer pulse on the hero CTA ----
  function initIndexHero() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    requestAnimationFrame(function () {
      setTimeout(function () { hero.classList.add('is-revealed'); }, reducedMotion ? 0 : 20);
    });

    var cta = document.querySelector('.hero__cta');
    if (!cta || reducedMotion) return;
    var interval;
    function trigger() {
      cta.classList.add('is-hammering');
      setTimeout(function () { cta.classList.remove('is-hammering'); }, 560);
    }
    function start() { if (!interval) { trigger(); interval = setInterval(trigger, 4000); } }
    function stop() { if (interval) { clearInterval(interval); interval = null; } }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting && !document.hidden) start(); else stop(); });
      }, { threshold: 0.4 });
      io.observe(cta);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });
    }
  }

  // ---- Index: service card press micro-gesture ----
  function initServiceCardGestures() {
    var cards = document.querySelectorAll('.service-card');
    if (!cards.length || reducedMotion) return;
    cards.forEach(function (card) {
      card.addEventListener('pointerdown', function () {
        var icon = card.querySelector('.service-card__icon');
        if (!icon) return;
        icon.style.animationName = '';
        void icon.offsetWidth;
        card.classList.add('is-pressed');
        setTimeout(function () { card.classList.remove('is-pressed'); }, 220);
      });
    });
  }

  // ---- Servicos: sticky sub-nav scrollspy ----
  function initServiceScrollspy() {
    var blocks = document.querySelectorAll('.service-block[id]');
    var navLinks = document.querySelectorAll('.subnav a');
    if (!blocks.length || !navLinks.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove('is-active'); });
          var link = byId[entry.target.id];
          if (link) link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    blocks.forEach(function (b) { io.observe(b); });
  }

  // ---- Galeria: category filters ----
  function initGalleryFilters() {
    var filterBar = document.querySelector('.filters');
    var grid = document.querySelector('.gallery-grid');
    if (!filterBar || !grid) return;
    var buttons = filterBar.querySelectorAll('.filter-btn');
    var tiles = grid.querySelectorAll('.tile');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-filter');
        if (btn.classList.contains('is-active')) return;
        buttons.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');

        var leaving = [];
        tiles.forEach(function (tile) {
          var matches = cat === 'todos' || tile.getAttribute('data-category') === cat;
          if (!matches && !tile.classList.contains('is-hidden')) {
            leaving.push(tile);
            if (!reducedMotion) tile.classList.add('is-leaving');
          }
        });
        var delay = reducedMotion ? 0 : 260;
        setTimeout(function () {
          tiles.forEach(function (tile) {
            var matches = cat === 'todos' || tile.getAttribute('data-category') === cat;
            tile.classList.toggle('is-hidden', !matches);
            tile.classList.remove('is-leaving');
            if (matches) {
              tile.style.animation = 'none';
              void tile.offsetWidth;
              tile.style.animation = '';
            }
          });
        }, delay);
      });
    });
  }

  // ---- Galeria: lightbox ----
  function initLightbox() {
    var grid = document.querySelector('.gallery-grid');
    var lightbox = document.querySelector('.lightbox');
    if (!grid || !lightbox) return;
    var tiles = Array.prototype.slice.call(grid.querySelectorAll('.tile'));
    var img = lightbox.querySelector('.lightbox__body img');
    var caption = lightbox.querySelector('.lightbox__caption');
    var counter = lightbox.querySelector('.lightbox__counter');
    var closeBtn = lightbox.querySelector('.lightbox__close');
    var prevBtn = lightbox.querySelector('.lightbox__nav--prev');
    var nextBtn = lightbox.querySelector('.lightbox__nav--next');
    var lastFocused = null;
    var index = 0;

    function visibleTiles() {
      return tiles.filter(function (t) { return !t.classList.contains('is-hidden'); });
    }

    function render() {
      var list = visibleTiles();
      var tile = list[index];
      if (!tile) return;
      var src = tile.querySelector('img').getAttribute('src');
      var title = tile.getAttribute('data-title') || '';
      img.setAttribute('src', src);
      img.setAttribute('alt', title);
      caption.textContent = title;
      counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(list.length).padStart(2, '0');
    }

    function open(tile) {
      var list = visibleTiles();
      index = list.indexOf(tile);
      if (index < 0) index = 0;
      lastFocused = document.activeElement;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      render();
      document.addEventListener('keydown', onKeyDown);
      setTimeout(function () { closeBtn.focus(); }, 30);
    }
    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onKeyDown);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }
    function prev() {
      var list = visibleTiles();
      index = (index - 1 + list.length) % list.length;
      render();
    }
    function next() {
      var list = visibleTiles();
      index = (index + 1) % list.length;
      render();
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowLeft') { prev(); return; }
      if (e.key === 'ArrowRight') { next(); return; }
      if (e.key === 'Tab') {
        var focusables = lightbox.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    tiles.forEach(function (tile) {
      tile.addEventListener('click', function () { open(tile); });
    });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
  }

  // ---- Galeria: before/after compare sliders ----
  function initCompareSliders() {
    document.querySelectorAll('.compare').forEach(function (compare) {
      var range = compare.querySelector('.compare__range');
      var beforeWrap = compare.querySelector('.compare__before-wrap');
      var beforeImg = beforeWrap ? beforeWrap.querySelector('img') : null;
      var handleLine = compare.querySelector('.compare__handle-line');
      var handle = compare.querySelector('.compare__handle');
      if (!range || !beforeWrap) return;
      function update(pct) {
        beforeWrap.style.width = pct + '%';
        if (beforeImg) beforeImg.style.width = (pct > 0 ? (10000 / pct).toFixed(2) : 10000) + '%';
        if (handleLine) handleLine.style.left = pct + '%';
        if (handle) handle.style.left = pct + '%';
      }
      range.addEventListener('input', function () { update(Number(range.value)); });
      update(Number(range.value));
    });
  }

  // ---- Sobre: timeline progress line while scrolling ----
  function initTimeline() {
    var timeline = document.querySelector('.timeline');
    var progress = document.querySelector('.timeline__progress');
    if (!timeline || !progress) return;
    if (reducedMotion) { progress.style.height = '100%'; return; }
    var raf = null;
    function update() {
      raf = null;
      var rect = timeline.getBoundingClientRect();
      var winH = window.innerHeight;
      var start = winH * 0.85;
      var end = -rect.height * 0.15;
      var p = (start - rect.top) / (start - end);
      p = Math.max(0, Math.min(1, p));
      progress.style.height = (p * 100) + '%';
    }
    window.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  // ---- Contato: FAQ accordion ----
  function initFaq() {
    document.querySelectorAll('.faq-item').forEach(function (item) {
      var btn = item.querySelector('.faq-item__q');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        document.querySelectorAll('.faq-item.is-open').forEach(function (other) {
          other.classList.remove('is-open');
          other.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  ready(function () {
    initCounters();
    if (page === 'index') {
      initIndexHero();
      initServiceCardGestures();
    }
    if (page === 'servicos') {
      initServiceScrollspy();
    }
    if (page === 'galeria') {
      initGalleryFilters();
      initLightbox();
      initCompareSliders();
    }
    if (page === 'sobre') {
      initTimeline();
    }
    if (page === 'contato') {
      initFaq();
    }
  });
})();
