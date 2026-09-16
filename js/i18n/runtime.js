/* Local interface translations. Source language: pt-BR. No remote translation calls. */
(function () {
  'use strict';
  const dictionary = window.PANTANAL_TRANSLATIONS || {};
  const languages = {pt:'Português',de:'Deutsch',en:'English',es:'Español',fr:'Français',hi:'हिन्दी',ja:'日本語'};
  const key='pantanal.language';
  const normalize=s=>String(s).replace(/\s+/g,' ').trim();
  const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const patterns=Object.keys(dictionary).filter(s=>/\{\d+\}/.test(s)).map(source=>{
    const order=[];
    const re=source.split(/(\{\d+\})/).map(s=>/^\{\d+\}$/.test(s)?(order.push(Number(s.slice(1,-1))),'(.+?)'):escape(s)).join('');
    return {source,order,re:new RegExp('^'+re+'$')};
  }).sort((a,b)=>b.source.replace(/\{\d+\}/g,'').length-a.source.replace(/\{\d+\}/g,'').length);
  let language='pt';
  try { const saved=localStorage.getItem(key);if(Object.hasOwn(languages,saved))language=saved; } catch (_) {}
  const requested=new URLSearchParams(location.search).get('lang');
  if(Object.hasOwn(languages,requested))language=requested;
  function translate(value,depth=0){
    const original=String(value),source=normalize(original);
    if(language==='pt'||depth>3||!source)return original;
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
    if(target==null)return original;
    return original.match(/^\s*/)[0]+target+original.match(/\s*$/)[0];
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
    document.querySelectorAll('[data-language-select]').forEach(s=>{s.value=code;s.setAttribute('aria-label',translate('Idioma'))});
    const url=new URL(location.href);url.searchParams.set('lang',code);
    try{history.replaceState(null,'',url)}catch(_){}
    window.dispatchEvent(new CustomEvent('pantanal:languagechange',{detail:{language:code}}));
  }
  window.PantanalI18n=Object.freeze({t:translate,get language(){return language},setLanguage,translatePage:()=>{observer.disconnect();walk(document.documentElement);observe()}});
  function init(){
    const host=document.querySelector('header')||document.querySelector('main')||document.body;
    const label=document.createElement('label');label.className='language-switcher';label.setAttribute('translate','no');
    const icon=document.createElement('span');icon.textContent='🌐';icon.setAttribute('aria-hidden','true');
    const select=document.createElement('select');select.dataset.languageSelect='';select.setAttribute('aria-label','Idioma');
    for(const [code,name] of Object.entries(languages)){const option=document.createElement('option');option.value=code;option.textContent=name;option.lang=code;select.append(option)}
    label.append(icon,select);if(host.tagName==='HEADER')host.append(label);else host.prepend(label);
    select.addEventListener('change',()=>setLanguage(select.value));
    // URL propagation also covers environments where storage is disabled.
    document.addEventListener('click',event=>{const a=event.target.closest?.('a[href]');if(!a||a.hasAttribute('download'))return;const url=new URL(a.href,location.href);if(url.origin!==location.origin||!/^https?:$/.test(url.protocol))return;if(url.pathname===location.pathname&&url.hash)return;url.searchParams.set('lang',language);a.href=url.href;},true);
    setLanguage(language);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
