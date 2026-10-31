/* Mounts the live 3D service scenes in the homepage hero.
   Progressive enhancement: the hero is complete with its poster image and the first service's text.
   - No WebGL2 -> poster stays.
   - prefers-reduced-motion -> poster stays; a "Play motion" button lets the visitor opt in.
   - Offscreen or background tab -> rendering stops.
   - Services rotate after each scene until the visitor takes control (click or keyboard focus).
   - ?capture -> deterministic frame rendering for posters and recordings. */
import { createStage, webglAvailable } from './stage.js';
import { migrationScene } from './scene-migration.js';
import { segmentationScene } from './scene-segmentation.js';
import { assessmentScene } from './scene-assessment.js';
import { mspScene } from './scene-msp.js';

const SERVICES = [
  {
    scene: migrationScene, title: 'Firewall migration',
    sub: 'Migrations, configuration changes, VPN deployments and cutovers with rollback and validation steps.',
    cta: ['Discuss a migration', '/contact.html?service=firewall-migration'],
    steps: ['Inventory the current firewall: policy, NAT and dependencies.', 'Stage the replacement and map policy, with rollback ready.', 'Shift approved traffic inside the change window, cable by cable.', 'Test what should pass and what should not, then hand over.']
  },
  {
    scene: segmentationScene, title: 'Network segmentation',
    sub: 'Segmentation, Cisco switching and routing, and security remediation, so what should never talk, doesn’t.',
    cta: ['Explore network engineering', '/services/network-security.html'],
    steps: ['Workforce, applications and guest devices share one flat network.', 'Group systems into zones with clear boundaries.', 'Permit only the paths the business needs, through policy.', 'Test what is allowed and what is blocked, then document it.']
  },
  {
    scene: assessmentScene, title: 'Risk assessment',
    sub: 'Vendor-neutral, engineer-led review with risk-ranked findings and a remediation roadmap you can act on.',
    cta: ['See how assessments work', '/services/compliance.html'],
    steps: ['Review the environment’s configuration and architecture.', 'Record each finding with the evidence behind it.', 'Rank findings by risk: fix now, next 90 days, planned.', 'Deliver a remediation roadmap you can act on.']
  },
  {
    scene: mspScene, title: 'MSP white-label',
    sub: 'Cisco and Palo Alto engineering capacity behind your MSP. The client relationship stays with you.',
    cta: ['Discuss an MSP engagement', '/services/#msp'],
    steps: ['Scope, change windows and rollback are agreed with your team first.', 'Specialist work is done inside your process and your tools.', 'Every change is checked against what should pass and what should not.', 'Documentation goes out in your name. The client stays yours.']
  }
];

const hero = document.querySelector('.h-hero[data-stage]');
const media = hero && hero.querySelector('.h-hero-media');
const capture = new URLSearchParams(location.search).has('capture');
const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
const KEY = 'valo-motion';
const readPref = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
const savePref = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } };

if (hero && media && webglAvailable()) {
  const $ = (sel) => hero.querySelector(sel);
  const tabs = Array.from(hero.querySelectorAll('[data-service]'));
  const steps = Array.from(hero.querySelectorAll('[data-chapter]'));
  const caption = $('.h-chapter-caption');
  const fields = { title: $('[data-field="title"]'), sub: $('[data-field="sub"]'), cta: $('[data-field="cta"]') };
  const labelLayer = $('.h-labels');
  let stage = null;
  let paused = !capture && (reduceMq.matches || readPref() === 'paused');
  let visible = true;
  let auto = !capture;

  const showService = (i) => {
    const s = SERVICES[i];
    const swap = () => {
      fields.title.textContent = s.title;
      fields.sub.textContent = s.sub;
      fields.cta.textContent = s.cta[0];
      fields.cta.setAttribute('href', s.cta[1]);
      hero.classList.remove('is-switching');
    };
    if (capture) swap(); else { hero.classList.add('is-switching'); setTimeout(swap, 280); }
    tabs.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
  };

  const goTo = (i, t = 0) => { stage.setScene(i, t); showService(i); };
  const takeControl = () => { if (auto) { auto = false; if (stage) stage.loop = true; } };

  const mount = () => {
    if (stage) return stage;
    try {
      const q = new URLSearchParams(location.search);
      const extra = capture && q.has('shift') ? { shift: Number(q.get('shift')), shiftPortrait: Number(q.get('shift')) } : {};
      stage = createStage(media, SERVICES.map((s) => s.scene), { capture, labelLayer, ...extra });
    } catch (err) {
      hero.classList.add('stage-failed');
      return null;
    }
    stage.loop = !auto;
    stage.on(({ scene, progress, chapter, chapterProgress, changed, ended }) => {
      if (ended) { if (auto) goTo((scene + 1) % SERVICES.length); return; }
      tabs.forEach((b, k) => b.style.setProperty('--p', k === scene ? progress.toFixed(3) : 0));
      steps.forEach((b, k) => b.style.setProperty('--p', k < chapter ? 1 : k === chapter ? chapterProgress.toFixed(3) : 0));
      if (changed) {
        steps.forEach((b, k) => b.setAttribute('aria-current', k === chapter ? 'step' : 'false'));
        const ch = stage.chapters[chapter];
        if (caption) caption.innerHTML = `<b>${String(chapter + 1).padStart(2, '0')} ${ch.label}</b> ${SERVICES[scene].steps[chapter]}`;
      }
    });
    tabs.forEach((b, k) => b.addEventListener('click', () => { takeControl(); goTo(k, 0.35); if (!stage.running && !paused && visible) stage.play(); }));
    steps.forEach((b, k) => b.addEventListener('click', () => { takeControl(); stage.seek(stage.chapters[k].start + 0.4); if (!stage.running && !paused && visible) stage.play(); }));
    hero.addEventListener('focusin', (e) => { if (e.target.closest('.h-hero-foot, .h-actions')) takeControl(); });
    hero.classList.add('stage-live');
    return stage;
  };

  if (capture) {
    const s = mount();
    if (s) {
      s.renderAt(0);
      hero.classList.add('stage-ready');
      window.__valoStage = {
        get duration() { return s.duration; },
        setScene: (i) => { goTo(i, 0); },
        renderAt: (t) => s.renderAt(t)
      };
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
