/* BRL is the pricing source. Foreign prices use dated daily reference rates. */
(function(){
'use strict';
const prices=Object.freeze({chapada:20000,jaguar:50000}),key='pantanal.fx.brl.v1';
let rates={},loading=true;
const language=()=>window.PantanalI18n?.language||'en';
const currency=lang=>({pt:'BRL',en:'USD',es:'EUR',fr:'EUR'}[lang]||'USD');
const locale=lang=>({pt:'pt-BR',en:'en-US',es:'es-ES',fr:'fr-FR'}[lang]||'en-US');
function valid(row,quote){return row&&String(row.base).toUpperCase()==='BRL'&&String(row.quote).toUpperCase()===quote&&Number.isFinite(row.rate)&&row.rate>0&&/^\d{4}-\d{2}-\d{2}$/.test(row.date)&&Number.isFinite(Date.parse(row.date))&&Date.parse(row.date)<=Date.now()+86400000;}
try{const cached=JSON.parse(localStorage.getItem(key)||'{}');for(const q of ['USD','EUR'])if(valid(cached[q],q))rates[q]=cached[q];}catch{}
function amount(brl,lang=language()){const q=currency(lang),row=rates[q];if(q==='BRL')return new Intl.NumberFormat(locale(lang),{style:'currency',currency:q}).format(brl);if(row)return new Intl.NumberFormat(locale(lang),{style:'currency',currency:q,currencyDisplay:'code'}).format(brl*row.rate);const words={en:loading?'checking exchange rate':'conversion unavailable',es:loading?'consultando cambio':'conversión no disponible',fr:loading?'taux en cours':'conversion indisponible'};return `${q} — ${words[lang]||words.en} (BRL ${brl.toFixed(2)})`;}
function localize(text,lang=language()){
return String(text).replace(/R\$\s*(?:20[.,\s\u00a0]?000(?:[.,]00)?|50[.,\s\u00a0]?000(?:[.,]00)?)|(?:20[.,\s\u00a0]?000(?:[.,]00)?|50[.,\s\u00a0]?000(?:[.,]00)?)\s*R\$/g,match=>amount(/50/.test(match)?prices.jaguar:prices.chapada,lang));
}
function note(lang=language()){
const q=currency(lang),r=rates[q];
if(q==='BRL')return 'Preços por casal. Base em reais: Chapada R$ 20.000,00 · Jaguar R$ 50.000,00.';
const text={en:{base:'Prices per couple, converted from BRL.',rate:'Reference rate',missing:'Exchange rate unavailable. Base prices: Chapada BRL 20000; Jaguar BRL 50000.',wait:'Loading exchange rates…',end:'Converted amounts may change with the exchange rate.'},es:{base:'Precios por pareja, convertidos desde BRL.',rate:'Tipo de cambio de referencia',missing:'Cambio no disponible. Precios base: Chapada BRL 20000; Jaguar BRL 50000.',wait:'Consultando tipos de cambio…',end:'Los importes convertidos pueden variar con el cambio.'},fr:{base:'Prix par couple, convertis depuis le BRL.',rate:'Taux de référence',missing:'Taux indisponible. Prix de base : Chapada BRL 20000 ; Jaguar BRL 50000.',wait:'Chargement des taux…',end:'Les montants convertis peuvent varier selon le taux de change.'}}[lang]||{};
if(!r)return loading?text.wait:text.missing;
return `${text.base} ${text.rate}: 1 BRL = ${r.rate} ${q} · ${r.date} · Frankfurter. ${text.end}`;
}
function update(){window.PantanalI18n?.translatePage();document.querySelectorAll('[data-fx-note]').forEach(n=>n.textContent=note());window.dispatchEvent(new CustomEvent('pantanal:rateschange'));}
function init(){document.querySelectorAll('[data-fx-note]').forEach(n=>n.textContent=note());const host=document.querySelector('footer')||document.body;const p=document.createElement('p');p.className='fx-note';p.setAttribute('data-fx-note','');p.setAttribute('translate','no');p.setAttribute('role','status');p.textContent=note();host.append(p);}
window.PantanalMoney=Object.freeze({prices,currency,amount,localize,note});
window.addEventListener('pantanal:languagechange',()=>document.querySelectorAll('[data-fx-note]').forEach(n=>n.textContent=note()));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
Promise.allSettled(['USD','EUR'].map(async q=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{const response=await fetch(`https://api.frankfurter.dev/v2/rate/BRL/${q}`,{signal:controller.signal});if(!response.ok)throw Error('Rate unavailable');const row=await response.json();if(!valid(row,q))throw Error('Invalid rate');rates[q]=row;}finally{clearTimeout(timer);}})).then(()=>{loading=false;try{localStorage.setItem(key,JSON.stringify(rates));}catch{}update();});
})();
