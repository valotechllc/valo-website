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

  const worlds = new Map();
  document.querySelectorAll('[data-render-scene]').forEach(figure => {
    const world=window.ValoWorlds?.create(figure);
    if(world)worlds.set(figure,world);
    figure.addEventListener('worldfallback',()=>{worlds.delete(figure);updateMotion();});
    const legend=document.createElement('div');legend.className='world-legend';legend.setAttribute('aria-hidden','true');
    const labels={hero:['Users & devices','Policy gateway','Applications'],migration:['Existing path','Staged gateway','Validated traffic'],segmentation:['Workforce','Applications','Guest access'],assessment:['High priority','Next actions','Planned work'],msp:['Client environments','Your MSP','Specialist engineering']};
    labels[figure.dataset.renderScene].forEach(label=>{const item=document.createElement('span');item.textContent=label;legend.append(item);});

    const caption=figure.querySelector('figcaption');
    if(caption){const bar=document.createElement('div');bar.className='scene-timeline';bar.setAttribute('aria-hidden','true');bar.append(document.createElement('span'));caption.prepend(bar);caption.prepend(legend);}
  });
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
      const world=worlds.get(film.parentElement);
      if(world){world.setRunning(root.classList.contains('motion-running'));film.pause();return;}
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
  const worldPhases={hero:['Map the environment','Define the policy','Protect the connection','Validate the path'],migration:['Review the existing policy','Stage the replacement','Shift approved traffic','Validate and hand over'],segmentation:['Map the flat network','Separate trust zones','Enforce access policy','Validate permitted paths'],assessment:['Collect evidence','Identify exposure','Prioritize findings','Build the roadmap'],msp:['Scope the client project','Bring in the specialist','Deliver under your brand','Document and hand over']};
  setInterval(()=>worlds.forEach((world,figure)=>{
    const i=Math.floor(world.time%24/6),caption=figure.querySelector('.scene-phase'),bar=figure.querySelector('.scene-timeline span');
    if(caption)caption.textContent=`0${i+1} / ${worldPhases[figure.dataset.renderScene][i]}`;
    if(bar)bar.style.transform=`translateX(${i*100}%)`;
  }),350);
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
