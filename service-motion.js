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

  function createSceneOverlay(canvas,c){
    const host=canvas.parentElement,root=host.closest('[data-motion-scene]');
    const mode=host.dataset.renderScene;let clock=0,width=0,height=0;
    const phases={migration:['Policy review','Replacement staging','Controlled cutover','Post-change validation'],segmentation:['Map trust zones','Define access policies','Validate permitted paths'],assessment:['Review the evidence','Prioritize findings','Build the remediation roadmap'],msp:['Scope the client project','Engineer under your brand','Document and hand over']};
    const phase=host.querySelector('.scene-phase');
    function draw(dt=0){
      const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
      width=rect.width;height=rect.height;
      if(canvas.width!==Math.round(width)||canvas.height!==Math.round(height)){canvas.width=Math.round(width);canvas.height=Math.round(height);}
      clock+=dt;c.clearRect(0,0,width,height);
      const list=phases[mode];if(phase&&list){const index=Math.floor(clock/5)%list.length;phase.textContent=`0${index+1} / ${list[index]}`;}
      // Light runs through the environment; captions explain the service sequence.
      const start=mode==='migration'?.39:.48;
      for(let i=0;i<7;i++){
        const t=(clock*.045+i*.14)%1;
        const x=width*(start+t*.5),y=height*(.48+i*.041-t*.08);
        const gradient=c.createLinearGradient(x-80,y+9,x,y);
        gradient.addColorStop(0,'rgba(228,155,119,0)');gradient.addColorStop(1,i%2?'rgba(137,190,209,.5)':'rgba(228,155,119,.55)');
        c.strokeStyle=gradient;c.lineWidth=.7;c.beginPath();c.moveTo(x-80,y+9);c.quadraticCurveTo(x-25,y+5,x,y);c.stroke();
      }
      if(mode==='assessment'){
        const x=width*(.34+(Math.sin(clock*.22)+1)*.26);
        const beam=c.createLinearGradient(x-75,0,x+15,0);beam.addColorStop(0,'rgba(136,195,214,0)');beam.addColorStop(.85,'rgba(136,195,214,.035)');beam.addColorStop(1,'rgba(136,195,214,0)');
        c.fillStyle=beam;c.fillRect(x-75,height*.08,90,height*.7);
        c.strokeStyle='rgba(154,215,230,.22)';c.lineWidth=.7;c.beginPath();c.moveTo(x,height*.12);c.lineTo(x,height*.78);c.stroke();
      }
      if(mode==='segmentation'){
        for(let zone=0;zone<3;zone++){
          const x=width*(.42+zone*.18),y=height*(.52-zone*.045),rx=width*.1,ry=height*.045;
          c.strokeStyle=`rgba(${zone===1?'138,197,214':'228,155,119'},${.08+.06*Math.sin(clock*.7+zone)**2})`;c.lineWidth=.7;c.beginPath();c.ellipse(x,y,rx,ry,-.15,0,Math.PI*2);c.stroke();
        }
      }
    }
    return{root,draw};
  }
  const canvases=[...document.querySelectorAll('.spatial-canvas')];
  const renderers=[];
  canvases.forEach(canvas=>{
    const context=canvas.getContext('2d');
    if(context){renderers.push(createSceneOverlay(canvas,context));canvas.parentElement.classList.add('scene-overlay','scene-rendered');}
  });
  if(renderers.length)document.documentElement.classList.add('canvas-ready');
  let frame=null,lastFrame=0,redrawAll=true;
  function requestDraw(){redrawAll=true;if(frame===null)frame=requestAnimationFrame(renderFrame)}
  function renderFrame(now){
    frame=null;if(now-lastFrame<40){frame=requestAnimationFrame(renderFrame);return;}
    const dt=Math.min((now-lastFrame)/1000,.07);lastFrame=now;let running=false;
    renderers.forEach(renderer=>{if(renderer.root.hidden)return;const active=renderer.root.classList.contains('motion-running');if(active||redrawAll)renderer.draw(active?dt:0);running=running||active;});
    redrawAll=false;if(running)frame=requestAnimationFrame(renderFrame);
  }
  if('ResizeObserver' in window){const resizer=new ResizeObserver(requestDraw);canvases.forEach(canvas=>resizer.observe(canvas));}

  function updateMotion() {
    document.documentElement.classList.toggle('motion-stopped',paused || reduced.matches);
    scenes.forEach(scene => scene.classList.toggle('motion-running',
      !paused && !reduced.matches && !document.hidden && visible.has(scene) && !scene.hidden));
    requestDraw();
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
