/* Only #msp. The other cinematic controllers are intentionally independent. */
const root=document.querySelector('#msp.msp-studio');
if(root){
 const film=root.querySelector('[data-msp-film]'),toggle=root.querySelector('.msp-play'),steps=[...root.querySelectorAll('[data-msp-step]')],phase=root.querySelector('.msp-phase-name');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),narrow=matchMedia('(max-width:760px)');
 const names=['Scope','Engineer','Validate','Hand over'];let paused=reduced.matches,visible=false,pendingSeek=null;
 try{paused=paused||localStorage.getItem('valo-msp-motion')==='paused'}catch{}
 film.muted=true;film.defaultMuted=true;
 const setSource=()=>{const t=film.currentTime||0;film.poster=narrow.matches?'/media/msp-portfolio-mobile.webp?v=msp2':'/media/msp-feature.webp?v=msp2';film.src=narrow.matches?film.dataset.mobile:film.dataset.desktop;if(t)pendingSeek=t};
 const apply=()=>{toggle.textContent=paused?'Play film':'Pause film';toggle.setAttribute('aria-pressed',String(paused));if(visible&&!paused&&!document.hidden)film.play().then(()=>root.dataset.motion='playing').catch(error=>{if(error.name==='AbortError')return;paused=true;root.dataset.motion='paused';toggle.textContent='Play film';toggle.setAttribute('aria-pressed','true')});else{film.pause();root.dataset.motion='paused'}};
 const update=()=>{const duration=film.duration||24,t=film.currentTime||0,i=Math.min(3,Math.floor(t/(duration/4)));steps.forEach((step,k)=>{step.setAttribute('aria-current',k===i?'step':'false');step.style.setProperty('--msp-progress',k===i?String(Math.max(.02,(t-i*duration/4)/(duration/4))):'0')});phase.textContent=`0${i+1} / ${names[i]}`};
 toggle.hidden=false;toggle.addEventListener('click',()=>{paused=!paused;try{localStorage.setItem('valo-msp-motion',paused?'paused':'playing')}catch{}apply()});
 steps.forEach((step,i)=>step.addEventListener('click',()=>{const t=i*6+.4;if(film.readyState)film.currentTime=t;else pendingSeek=t;update();apply()}));
 film.addEventListener('loadedmetadata',()=>{if(pendingSeek!==null){film.currentTime=pendingSeek;pendingSeek=null}update()});
 film.addEventListener('timeupdate',update);
 film.addEventListener('error',()=>{root.dataset.motion='unavailable';toggle.hidden=true;phase.textContent='Delivery portfolio';steps.forEach(step=>step.disabled=true)});
 reduced.addEventListener('change',()=>{if(reduced.matches)paused=true;apply()});narrow.addEventListener('change',()=>{setSource();apply()});document.addEventListener('visibilitychange',apply);
 setSource();
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[entries.length-1].isIntersecting;apply()},{threshold:.12}).observe(root.querySelector('.msp-screen'));else{visible=true;apply()}
 update();
}
