/* Margot — carrossel acessível com pausa por interação e movimento reduzido */
document.addEventListener('DOMContentLoaded', () => {
  const carousel=document.querySelector('.hero-carousel');
  if(!carousel)return;
  const slides=[...carousel.querySelectorAll('.hero-slide')];
  const dots=[...carousel.querySelectorAll('.hero-pagination button')];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const rotation=document.getElementById('hero-rotation');
  let paused=reduced.matches;
  let current=0, timer=null;
  function show(next,announce=false){
    current=(next+slides.length)%slides.length;
    slides.forEach((slide,i)=>{
      const active=i===current;
      slide.classList.toggle('is-active',active);
      slide.setAttribute('aria-hidden',String(!active));
      slide.inert=!active;
      dots[i].classList.toggle('is-active',active);
      if(active)dots[i].setAttribute('aria-current','true');
      else dots[i].removeAttribute('aria-current');
    });
    if(announce)document.getElementById('hero-announcement').textContent=`Destaque ${current+1} de ${slides.length}`;
  }
  function stop(){if(timer!==null){clearInterval(timer);timer=null}}
  function syncRotation(){
    rotation.textContent=paused?'Reproduzir':'Pausar';
    rotation.setAttribute('aria-label',paused?'Reproduzir destaques automáticos':'Pausar destaques automáticos');
  }
  function start(){stop();if(!paused&&!document.hidden&&!carousel.matches(':hover')&&!carousel.contains(document.activeElement)){timer=setInterval(()=>show(current+1),6500)}}
  rotation.addEventListener('click',()=>{paused=!paused;syncRotation();start()});
  carousel.querySelector('.hero-prev').addEventListener('click',()=>{show(current-1,true);stop()});
  carousel.querySelector('.hero-next').addEventListener('click',()=>{show(current+1,true);stop()});
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i,true);stop()}));
  carousel.addEventListener('mouseenter',stop);
  carousel.addEventListener('mouseleave',start);
  carousel.addEventListener('focusin',stop);
  carousel.addEventListener('focusout',()=>setTimeout(start,0));
  document.addEventListener('visibilitychange',start);
  reduced.addEventListener('change',()=>{paused=reduced.matches;syncRotation();start()});
  carousel.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      e.preventDefault();
      const next=e.key==='ArrowRight';
      const insideSlide=e.target.closest('.hero-slide');
      show(current+(next?1:-1),true);
      stop();
      if(insideSlide)carousel.querySelector(next?'.hero-next':'.hero-prev').focus({preventScroll:true});
    }
  });
  show(0);syncRotation();start();
});
