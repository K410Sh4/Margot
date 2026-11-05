/* V1.15 — aparência do cabeçalho, sem interferir no menu. */
(() => {'use strict';document.addEventListener('DOMContentLoaded',()=>{
const header=document.querySelector('.site-header');if(!header)return;
let compact=false,queued=false;
function update(){queued=false;const y=window.scrollY||window.pageYOffset||0;const next=compact?y>65:y>155;if(next===compact)return;compact=next;header.classList.toggle('is-compact',compact);document.documentElement.classList.toggle('has-compact-header',compact)}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(update)}
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});window.addEventListener('pageshow',schedule);update();
})})();