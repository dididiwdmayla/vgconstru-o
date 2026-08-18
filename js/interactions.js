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

  // ---- Contato: formulário -> WhatsApp ----
  // O select sai do mesmo registro que monta os CTAs do site (window.VG.SERVICES),
  // e o parâmetro ?servico da URL diz qual opção já vem escolhida.
  function initContactForm() {
    var form = document.querySelector('.form');
    if (!form) return;
    var card = document.getElementById('formulario');
    var context = document.getElementById('formContext');
    var contextNome = context ? context.querySelector('strong') : null;
    var success = document.getElementById('formSuccess');
    var successLink = document.getElementById('formSuccessLink');
    var successTitle = document.getElementById('formSuccessTitle');
    var refazer = document.getElementById('formRefazer');
    var VG = window.VG;

    var nome = form.querySelector('#os-nome');
    var telefone = form.querySelector('#os-telefone');
    var servico = form.querySelector('#os-servico');
    var bairro = form.querySelector('#os-bairro');
    var descricao = form.querySelector('#os-descricao');
    var campos = [nome, telefone, servico, bairro, descricao];

    // ---- select montado a partir do registro de serviços ----
    if (VG) {
      VG.SERVICES.forEach(function (sv) {
        var opt = document.createElement('option');
        opt.value = sv.nome;
        opt.textContent = sv.nome;
        opt.setAttribute('data-slug', sv.slug);
        servico.appendChild(opt);
      });
      var outro = document.createElement('option');
      outro.value = VG.OUTRO;
      outro.textContent = VG.OUTRO;
      outro.setAttribute('data-slug', 'outro');
      servico.appendChild(outro);
    }

    function fieldWrap(input) { return input.closest('.field'); }
    function setError(input, message) {
      var wrap = fieldWrap(input);
      if (!wrap) return;
      wrap.classList.toggle('has-error', !!message);
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      var err = wrap.querySelector('.field__error');
      if (err) err.textContent = message || '';
    }
    function limpaErros() {
      campos.forEach(function (el) { setError(el, ''); });
    }

    // ---- contexto vindo da URL (ou de um CTA clicado na própria página) ----
    function aplicaServico(slug) {
      var sv = VG && VG.find(slug);
      if (sv) {
        servico.value = sv.nome;
        setError(servico, '');
        if (context && contextNome) {
          contextNome.textContent = sv.nome;
          context.hidden = false;
        }
      } else if (context) {
        context.hidden = true;
      }
    }
    function primeiroVazio() {
      for (var i = 0; i < campos.length; i++) {
        if (!campos[i].value.trim()) return campos[i];
      }
      return campos[0];
    }
    function irParaFormulario(slug) {
      if (success && !success.hidden) { mostraForm(); }
      aplicaServicoSeConhecido(slug);
      var alvo = card || form;
      alvo.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { primeiroVazio().focus({ preventScroll: true }); }, reducedMotion ? 0 : 420);
    }
    function aplicaServicoSeConhecido(slug) {
      // 'geral' (ou ausente) mantém o campo no estado padrão e sem a linha de contexto
      if (slug && slug !== 'geral') aplicaServico(slug);
    }

    ['input', 'change'].forEach(function (evt) {
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        el.addEventListener(evt, function () { setError(el, ''); });
      });
    });

    // ---- estados da tela ----
    function mostraSucesso(link) {
      if (!success) return;
      if (successLink) successLink.setAttribute('href', link);
      form.hidden = true;
      success.hidden = false;
      if (successTitle) successTitle.focus();
    }
    function mostraForm() {
      if (!success) return;
      success.hidden = true;
      form.hidden = false;
      form.reset();
      limpaErros();
      if (context) context.hidden = true;
    }
    if (refazer) {
      refazer.addEventListener('click', function () {
        mostraForm();
        nome.focus();
      });
    }

    // ---- envio ----
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var digitos = telefone.value.replace(/\D/g, '');
      var errors = {};
      if (!nome.value.trim()) errors.nome = 'Diga como podemos te chamar.';
      else if (nome.value.trim().length < 2) errors.nome = 'Nome muito curto.';
      if (!telefone.value.trim()) errors.telefone = 'Informe um telefone para retorno.';
      else if (digitos.length < 10 || digitos.length > 13) errors.telefone = 'Informe o telefone com DDD, por exemplo (45) 98843-1052.';
      if (!servico.value) errors.servico = 'Escolha o serviço desejado.';
      if (!bairro.value.trim()) errors.bairro = 'Informe o bairro para calcularmos o deslocamento.';
      if (!descricao.value.trim()) errors.descricao = 'Conte em poucas palavras o que precisa.';
      else if (descricao.value.trim().length < 10) errors.descricao = 'Descreva com um pouco mais de detalhe.';

      campos.forEach(function (el) {
        setError(el, errors[el.id.replace('os-', '')] || '');
      });

      var primeiroErro = campos.filter(function (el) { return errors[el.id.replace('os-', '')]; })[0];
      if (primeiroErro) { primeiroErro.focus(); return; }

      var texto = 'Olá! Vim pelo site da VG Construção.' +
        ' Nome: ' + nome.value.trim() + '.' +
        ' Telefone: ' + telefone.value.trim() + '.' +
        ' Serviço: ' + servico.value + '.' +
        ' Bairro: ' + bairro.value.trim() + '.' +
        ' Descrição: ' + descricao.value.trim().replace(/\.+$/, '') + '.';
      var link = (window.VG && window.VG.waLink(texto)) ||
        ('https://wa.me/5545988431052?text=' + encodeURIComponent(texto));
      window.open(link, '_blank', 'noopener');
      mostraSucesso(link);
    });

    // ---- entrada na página: ?servico=<slug> / #formulario / CTA da própria página ----
    document.addEventListener('vg:pedir', function (e) { irParaFormulario(e.detail.slug); });

    var slugUrl = null;
    try {
      slugUrl = new URLSearchParams(window.location.search).get('servico');
    } catch (err) {
      var m = window.location.search.match(/[?&]servico=([^&]*)/);
      slugUrl = m ? decodeURIComponent(m[1]) : null;
    }
    if (slugUrl || window.location.hash === '#formulario') {
      setTimeout(function () { irParaFormulario(slugUrl); }, 80);
    }
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
      initContactForm();
    }
  });
})();
