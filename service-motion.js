/* Progressive enhancement: diagrams and service descriptions work without JS. */
(() => {
  const lab = document.querySelector('.service-lab');
  if (!lab) return;
  const tabs = [...lab.querySelectorAll('[role="tab"]')];
  const panels = [...lab.querySelectorAll('[role="tabpanel"]')];
  const toggles = [...document.querySelectorAll('.motion-toggle')];
  const scenes = [...document.querySelectorAll('[data-motion-scene]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set();
  let paused = false;

  function updateMotion() {
    scenes.forEach(scene => scene.classList.toggle('motion-running',
      !paused && !reduced.matches && !document.hidden && visible.has(scene) && !scene.hidden));
  }
  function selectTab(tab, focus = false) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (focus) tab.focus();
    updateMotion();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
    });
  });
  toggles.forEach(toggle => toggle.addEventListener('click', () => {
    paused = !paused;
    toggles.forEach(control => {
      control.textContent = paused ? 'Resume animations' : 'Pause animations';
      control.setAttribute('aria-pressed', String(paused));
    });
    updateMotion();
  }));
  selectTab(tabs[0]);
  document.documentElement.classList.add('motion-ready');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target); });
      updateMotion();
    }, { threshold: 0.12 });
    scenes.forEach(scene => observer.observe(scene));
  } else {
    scenes.forEach(scene => visible.add(scene));
  }
  reduced.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  updateMotion();
})();
