(function(){
'use strict';
const maps=new Set();
// Runs after Leaflet and before the expedition creates its map.
if(window.L?.Map){L.Map.addInitHook(function(){const map=this;maps.add(map);const fit=map.fitBounds;let requested=null,automatic=false;
map.fitBounds=function(bounds,options){requested=bounds;automatic=true;try{return fit.call(this,bounds,options);}finally{automatic=false;}};
map.on('dragstart zoomstart',()=>{if(!automatic)requested=null;});
let frame=0;const resize=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(!map._loaded)return;map.invalidateSize({pan:false,animate:false});if(requested){automatic=true;try{fit.call(map,requested,{padding:[24,24],animate:false});}finally{automatic=false;}}});};
if(window.ResizeObserver){const observer=new ResizeObserver(resize);observer.observe(map.getContainer());map.on('unload',()=>{observer.disconnect();maps.delete(map);});}window.addEventListener('resize',resize);});}
function init(){
const body=document.body,info=document.getElementById('info-panel'),itinerary=document.getElementById('roteiro-panel'),bar=document.getElementById('route-bar');
if(!bar)return;
// Keep all existing information accessible without letting it consume the map.
const details=document.createElement('details');details.className='route-meta';const summary=document.createElement('summary');summary.setAttribute('translate','no');details.append(summary);
['selected-lodge-label','selected-guide-label'].forEach(id=>{const node=document.getElementById(id);if(node)details.append(node);});const note=bar.querySelector('[data-fx-note]');if(note)details.append(note);bar.firstElementChild.append(details);
function language(){const code=window.PantanalI18n?.language||'en';summary.textContent=({en:'Trip details & exchange rate',pt:'Detalhes da viagem e câmbio',es:'Detalles del viaje y cambio',fr:'Détails du voyage et taux'})[code]||'Trip details & exchange rate';}
language();window.addEventListener('pantanal:languagechange',language);
function layout(){if(body.classList.contains('catalog-mode'))return;body.classList.toggle('has-detail-panel',Boolean(info?.classList.contains('show')||itinerary?.classList.contains('show')));
const header=body.querySelector('.topbar'),menus=['chapada-menu','jaguar-menu','regional-actions'].map(id=>document.getElementById(id));const menu=menus.find(n=>n&&!n.hidden);const height=window.visualViewport?.height||window.innerHeight;const available=Math.max(80,height-(header?.getBoundingClientRect().height||0)-bar.getBoundingClientRect().height-(menu?.getBoundingClientRect().height||0)-160);body.style.setProperty('--panel-space',available+'px');}
const observer=new MutationObserver(layout);[info,itinerary].filter(Boolean).forEach(node=>observer.observe(node,{attributes:true,attributeFilter:['class','hidden']}));if(window.ResizeObserver){const sizing=new ResizeObserver(layout);[bar,body.querySelector('.topbar')].filter(Boolean).forEach(node=>sizing.observe(node));}window.addEventListener('resize',layout);window.visualViewport?.addEventListener('resize',layout);details.addEventListener('toggle',layout);layout();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
