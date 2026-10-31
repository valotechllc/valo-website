/* VALO homepage behaviour: nav state, service gallery controls, and service films.
   Everything here is progressive enhancement; the page reads fully without it. */
(function () {
  'use strict';

  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  /* ---- nav: solid after leaving the top of the film stage, mobile menu toggle ---- */
  var nav = document.getElementById('topnav');
  var hb = document.getElementById('hamburger');
  var links = document.getElementById('navLinks');
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  function closeMenu() { if (links) links.classList.remove('open'); if (hb) hb.setAttribute('aria-expanded', 'false'); }
  if (hb && links) {
    hb.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      hb.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) { if (nav && !nav.contains(e.target)) closeMenu(); });
    links.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) closeMenu(); });
  }

  /* ---- service films ----
     A stage opts in with data-film-desktop (and optionally data-film-mobile).
     No stage does yet: the films are listed as outstanding in docs/media-manifest.md.
     Until then the page shows its poster images and no motion control. */
  var stages = Array.prototype.slice.call(document.querySelectorAll('[data-film-desktop]'));
  if (!stages.length) return;

  var KEY = 'valo-motion';
  var readPref = function () { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } };
  var savePref = function (v) { try { window.localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } };
  var small = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
  var films = [];

  stages.forEach(function (stage) {
    var media = stage.querySelector('.h-hero-media, .h-msp-media');
    if (!media) return;
    var img = media.querySelector('img');
    var v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.preload = 'metadata';
    if (img) v.poster = img.currentSrc || img.src;
    v.src = (small && stage.getAttribute('data-film-mobile')) || stage.getAttribute('data-film-desktop');
    v.className = 'h-film';
    media.appendChild(v);
    films.push({ el: v, stage: stage, visible: false });
  });
  if (!films.length) return;

  var paused = reduceMq.matches || readPref() === 'paused';
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'h-motion';
  document.body.appendChild(btn);

  var apply = function () {
    films.forEach(function (f) {
      if (!paused && f.visible && !document.hidden) {
        var p = f.el.play();
        if (p && p.catch) p.catch(function () { /* autoplay refused: poster stays */ });
      } else {
        f.el.pause();
      }
    });
    btn.textContent = paused ? 'Play motion' : 'Pause motion';
  };

  btn.addEventListener('click', function () { paused = !paused; savePref(paused ? 'paused' : 'playing'); apply(); });
  document.addEventListener('visibilitychange', apply);
  if (reduceMq.addEventListener) reduceMq.addEventListener('change', function () { if (reduceMq.matches) { paused = true; apply(); } });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { films.forEach(function (f) { if (f.stage === e.target) f.visible = e.isIntersecting; }); });
      apply();
    }, { threshold: 0.15 });
    films.forEach(function (f) { io.observe(f.stage); });
  } else {
    films.forEach(function (f) { f.visible = true; });
  }
  apply();
})();
