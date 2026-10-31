/* Mounts the live 3D service scene in the homepage hero.
   Progressive enhancement: the hero is complete with its poster image; this only adds motion.
   - No WebGL2 -> poster stays.
   - prefers-reduced-motion -> poster stays, a "Play motion" button lets the visitor opt in.
   - Offscreen or background tab -> rendering stops.
   - ?capture -> deterministic frame rendering for posters and recordings. */
import { createStage, webglAvailable } from './stage.js';
import { migrationScene } from './scene-migration.js';

const hero = document.querySelector('.h-hero[data-stage]');
const media = hero && hero.querySelector('.h-hero-media');
const capture = new URLSearchParams(location.search).has('capture');
const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
const KEY = 'valo-motion';
const readPref = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
const savePref = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } };

if (hero && media && webglAvailable()) {
  const chapterBtns = Array.from(hero.querySelectorAll('[data-chapter]'));
  const caption = hero.querySelector('.h-chapter-caption');
  let stage = null;
  let paused = !capture && (reduceMq.matches || readPref() === 'paused');
  let visible = true;

  const mount = () => {
    if (stage) return stage;
    try {
      stage = createStage(media, migrationScene, { capture });
    } catch (err) {
      hero.classList.add('stage-failed');
      return null;
    }
    stage.on(({ chapter, progress, changed }) => {
      chapterBtns.forEach((b, i) => {
        b.style.setProperty('--p', i < chapter ? 1 : i === chapter ? progress.toFixed(3) : 0);
        if (changed) b.setAttribute('aria-current', i === chapter ? 'step' : 'false');
      });
      if (changed && caption) caption.textContent = chapterBtns[chapter] ? chapterBtns[chapter].getAttribute('data-caption') : '';
    });
    chapterBtns.forEach((b, i) => b.addEventListener('click', () => {
      stage.seek(stage.chapters[i].start + 0.4);
      if (!stage.running && !paused && visible) stage.play();
    }));
    hero.classList.add('stage-live');
    return stage;
  };

  if (capture) {
    const s = mount();
    if (s) {
      s.renderAt(0);
      hero.classList.add('stage-ready');
      window.__valoStage = { duration: s.duration, renderAt: (t) => s.renderAt(t) };
    }
  } else {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'h-motion';
    hero.appendChild(btn);

    const apply = () => {
      if (!paused && !stage) mount();
      if (stage) {
        if (!paused && visible && !document.hidden) stage.play(); else stage.pause();
        if (!hero.classList.contains('stage-ready')) { if (!stage.running) stage.renderAt(0.6); requestAnimationFrame(() => hero.classList.add('stage-ready')); }
      }
      btn.textContent = paused ? 'Play motion' : 'Pause motion';
    };
    btn.addEventListener('click', () => { paused = !paused; savePref(paused ? 'paused' : 'playing'); apply(); });
    document.addEventListener('visibilitychange', apply);
    if (reduceMq.addEventListener) reduceMq.addEventListener('change', () => { if (reduceMq.matches) { paused = true; apply(); } });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; apply(); }, { threshold: 0.05 }).observe(hero);
    }
    apply();
  }
}
