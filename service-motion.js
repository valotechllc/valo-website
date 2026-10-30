/* Cinematic service chapters; all descriptions remain usable without JavaScript. */
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

  const films=[...document.querySelectorAll('.service-film')];
  const phases={migration:['Review the existing policy','Stage the replacement','Shift approved traffic','Validate and hand over'],segmentation:['Map the flat network','Separate trust zones','Enforce access policy','Validate permitted paths'],assessment:['Collect evidence','Identify findings','Prioritize risk','Build the roadmap'],msp:['Scope the client project','Bring in the specialist','Deliver under your brand','Document and hand over']};
  films.forEach(film=>{
    film.autoplay=false;
    film.muted=true;
    film.addEventListener('timeupdate',()=>{
      const caption=film.parentElement.querySelector('.scene-phase');
      const sequence=phases[film.dataset.serviceFilm];
      if(caption&&sequence){const index=Math.min(3,Math.floor(film.currentTime/3));caption.textContent=`0${index+1} / ${sequence[index]}`;}
    });
    film.addEventListener('error',()=>{film.parentElement.classList.add('film-unavailable');});
  });

  function updateMotion() {
    document.documentElement.classList.toggle('motion-stopped',paused || reduced.matches);
    scenes.forEach(scene => scene.classList.toggle('motion-running',
      !paused && !reduced.matches && !document.hidden && visible.has(scene) && !scene.hidden));
    films.forEach(film=>{
      const root=film.closest('[data-motion-scene]');
      if(root.classList.contains('motion-running'))film.play().catch(()=>{film.parentElement.classList.add('film-awaiting-play');});
      else film.pause();
    });
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
