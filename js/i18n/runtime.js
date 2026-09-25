/* Local interface translations. Source language: pt-BR. No remote translation calls. */
(function () {
  'use strict';
  const dictionary = window.PANTANAL_TRANSLATIONS || {};
  const languages = {en:'English',pt:'Português',es:'Español',fr:'Français'};
  const key='pantanal.language';
  const normalize=s=>String(s).replace(/\s+/g,' ').trim();
  const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const patterns=Object.keys(dictionary).filter(s=>/\{\d+\}/.test(s)).map(source=>{
    const order=[];
    const re=source.split(/(\{\d+\})/).map(s=>/^\{\d+\}$/.test(s)?(order.push(Number(s.slice(1,-1))),'(.+?)'):escape(s)).join('');
    return {source,order,re:new RegExp('^'+re+'$')};
  }).sort((a,b)=>b.source.replace(/\{\d+\}/g,'').length-a.source.replace(/\{\d+\}/g,'').length);
  let language='en';
  try { const saved=localStorage.getItem(key);if(Object.hasOwn(languages,saved))language=saved; } catch (_) {}
  const requested=new URLSearchParams(location.search).get('lang');
  if(Object.hasOwn(languages,requested))language=requested;
  function translate(value,depth=0){
    const original=String(value),source=normalize(original);
    if(language==='pt'||depth>3||!source)return window.PantanalMoney?.localize(original,language)||original;
    let target=dictionary[source]?.[language];
    if(target==null){
      for(const pattern of patterns){
        const match=source.match(pattern.re);
        if(match){const vals={};pattern.order.forEach((n,i)=>vals[n]=translate(match[i+1],depth+1));target=pattern.source in dictionary?dictionary[pattern.source][language]:null;if(target)target=target.replace(/\{(\d+)\}/g,(_,n)=>vals[n]);break;}
      }
    }
    if(target==null){
      // Keep decorative icons and arrows without duplicating every translation.
      const middle=source.replace(/^[^\p{L}\p{N}]+/u,'').replace(/[^\p{L}\p{N}.?!…]+$/u,'').trim();
      if(middle!==source&&dictionary[middle]?.[language])target=source.replace(middle,dictionary[middle][language]);
    }
    if(target==null&&source.includes(' · ')){
      const pieces=source.split(' · ');const translated=pieces.map(s=>translate(s,depth+1));
      if(translated.some((s,i)=>s!==pieces[i]))target=translated.join(' · ');
    }
    if(target==null&&source.includes(' → ')){
      const pieces=source.split(' → ');const translated=pieces.map(s=>translate(s,depth+1));
      if(translated.some((s,i)=>s!==pieces[i]))target=translated.join(' → ');
    }
    if(target==null){
      const pieces=source.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/u);
      if(pieces.length>1){const translated=pieces.map(s=>translate(s,depth+1));if(translated.some((s,i)=>s!==pieces[i]))target=translated.join(' ');}
    }
    if(target==null)return window.PantanalMoney?.localize(original,language)||original;
    const output=original.match(/^\s*/)[0]+target+original.match(/\s*$/)[0];
    return window.PantanalMoney?.localize(output,language)||output;
  }
  const textCache=new WeakMap(),attributeCache=new WeakMap();
  const excluded='script,style,textarea,[contenteditable="true"],[translate="no"],[data-no-i18n],.language-switcher';
  function translateText(node){
    if(!node.parentElement||node.parentElement.closest(excluded))return;
    const current=node.nodeValue;
    let saved=textCache.get(node);
    if(!saved||current!==saved.output)saved={source:current};
    saved.output=translate(saved.source);textCache.set(node,saved);
    if(current!==saved.output)node.nodeValue=saved.output;
  }
  function translateAttributes(el){
    if(el.closest(excluded))return;
    const saved=attributeCache.get(el)||{};
    for(const name of ['aria-label','placeholder','title','alt']){
      if(!el.hasAttribute(name))continue;
      const current=el.getAttribute(name);let entry=saved[name];
      if(!entry||current!==entry.output)entry={source:current};
      entry.output=translate(entry.source);saved[name]=entry;
      if(entry.output!==current)el.setAttribute(name,entry.output);
    }
    attributeCache.set(el,saved);
  }
  function walk(root){
    if(root.nodeType===3){translateText(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9)return;
    if(root.nodeType===1&&root.closest(excluded))return;
    // Translating option labels must never change form values or filter keys.
    if(root.matches?.('option:not([value])'))root.setAttribute('value',root.textContent);
    root.querySelectorAll?.('option:not([value])').forEach(o=>o.setAttribute('value',o.textContent));
    if(root.nodeType===1)translateAttributes(root);
    root.querySelectorAll?.('[aria-label],[placeholder],[title],[alt]').forEach(translateAttributes);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;while((node=walker.nextNode()))translateText(node);
  }
  const observer=new MutationObserver(records=>{
    observer.disconnect();
    for(const r of records){
      if(r.type==='characterData')translateText(r.target);
      else if(r.type==='attributes')translateAttributes(r.target);
      else r.addedNodes.forEach(walk);
    }
    observe();
  });
  function observe(){observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title','alt']});}
  function setLanguage(code){
    if(!Object.hasOwn(languages,code))return;
    language=code;try{localStorage.setItem(key,code)}catch(_){}
    document.documentElement.lang=code==='pt'?'pt-BR':code;
    document.documentElement.dataset.language=code;
    observer.disconnect();walk(document.documentElement);observe();
    document.querySelectorAll('[data-language-button]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.languageButton===code)));
    const url=new URL(location.href);url.searchParams.set('lang',code);
    try{history.replaceState(null,'',url)}catch(_){}
    window.dispatchEvent(new CustomEvent('pantanal:languagechange',{detail:{language:code}}));
  }
  window.PantanalI18n=Object.freeze({t:translate,get language(){return language},setLanguage,translatePage:()=>{observer.disconnect();walk(document.documentElement);observe()}});
  function init(){
    const host=document.querySelector('header')||document.querySelector('main')||document.body;
    const label=document.createElement('div');label.className='language-switcher';label.setAttribute('translate','no');label.setAttribute('role','group');label.setAttribute('aria-label','Language / Idioma');
    const flags={
      en:'<rect width="60" height="40" fill="#fff"/>'+Array.from({length:7},(_,i)=>`<rect y="${i*80/13}" width="60" height="${40/13}" fill="#b22234"/>`).join('')+'<rect width="25" height="21.54" fill="#3c3b6e"/>'+Array.from({length:9},(_,row)=>Array.from({length:row%2?5:6},(_,col)=>`<text x="${2+col*4.1+(row%2?2:0)}" y="${2.5+row*2.25}" fill="white" font-size="3" text-anchor="middle">★</text>`).join('')).join(''),
      pt:'<rect width="60" height="40" fill="#009739"/><path d="M30 4 56 20 30 36 4 20Z" fill="#ffdf00"/><circle cx="30" cy="20" r="10" fill="#002776"/><path d="M21 16Q31 15 39 24" fill="none" stroke="white" stroke-width="2"/>',
      es:'<rect width="60" height="40" fill="#aa151b"/><rect y="10" width="60" height="20" fill="#f1bf00"/><path d="M17 16h6v9q-3 4-6 0z" fill="#aa151b" stroke="#fff" stroke-width=".6"/><path d="M17 14h6l-1-3-2 2-2-2z" fill="#b68522"/>',
      fr:'<rect width="60" height="40" fill="#fff"/><rect width="20" height="40" fill="#002654"/><rect x="40" width="20" height="40" fill="#ed2939"/>'
    };
    const countries={en:'United States — English',pt:'Brasil — Português',es:'España — Español',fr:'France — Français'};
    for(const [code,name] of Object.entries(languages)){const button=document.createElement('button');button.type='button';button.dataset.languageButton=code;button.setAttribute('aria-label',countries[code]);button.title=countries[code];button.lang=code;button.innerHTML=`<svg viewBox="0 0 60 40" aria-hidden="true" focusable="false">${flags[code]}</svg>`;button.addEventListener('click',()=>setLanguage(code));label.append(button);}
    if(host.tagName==='HEADER')host.append(label);else host.prepend(label);
    // URL propagation also covers environments where storage is disabled.
    document.addEventListener('click',event=>{const a=event.target.closest?.('a[href]');if(!a||a.hasAttribute('download'))return;const url=new URL(a.href,location.href);if(url.origin!==location.origin||!/^https?:$/.test(url.protocol))return;if(url.pathname===location.pathname&&url.hash)return;url.searchParams.set('lang',language);a.href=url.href;},true);
    setLanguage(language);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

