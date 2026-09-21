"use strict";
const tr = value => window.PantanalI18n ? window.PantanalI18n.t(value) : value;
document.documentElement.classList.add("js");
const menu=document.querySelector(".menu"),nav=document.querySelector("#nav");
menu.hidden=false;
menu.addEventListener("click",()=>{const open=menu.getAttribute("aria-expanded")!=="true";menu.setAttribute("aria-expanded",String(open));nav.classList.toggle("open",open)});
nav.addEventListener("click",e=>{if(e.target.closest("a")){menu.setAttribute("aria-expanded","false");nav.classList.remove("open")}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("open")){menu.setAttribute("aria-expanded","false");nav.classList.remove("open");menu.focus()}});
const form=document.querySelector("#quote-form"),arrival=document.querySelector("#arrival"),departure=document.querySelector("#departure"),transfer=document.querySelector("#transfer"),fields=document.querySelector("#transfer-fields"),status=document.querySelector("#status"),fallback=document.querySelector("#fallback");
function updateTransfer(){fields.hidden=transfer.value==="Não";fields.querySelectorAll("input").forEach(i=>i.disabled=fields.hidden)}
transfer.addEventListener("change",updateTransfer);updateTransfer();
document.querySelectorAll("[data-destino]").forEach(a=>a.addEventListener("click",()=>document.querySelector("#destination").value=a.dataset.destino));
document.querySelector("#transfer-link").addEventListener("click",()=>{document.querySelector("#destination").value="Somente traslado";transfer.value="Sim";updateTransfer()});
arrival.addEventListener("change",()=>{departure.min=arrival.value;departure.setCustomValidity("")});
function request(){
 departure.setCustomValidity(arrival.value&&departure.value&&departure.value<arrival.value?tr("A saída deve ser igual ou posterior à chegada."):"");
 if(!form.reportValidity())return null;
 const d=new FormData(form);
 const date=v=>v?new Intl.DateTimeFormat(window.PantanalI18n?.language==='pt'?'pt-BR':window.PantanalI18n?.language||'pt-BR').format(new Date(v+'T12:00:00')):tr("A combinar");
 return [tr("Olá! Gostaria de uma cotação de viagem."),"",`${tr("Nome")}: ${d.get("nome")}`,`E-mail: ${d.get("email")}`,`WhatsApp: ${d.get("telefone")}`,`${tr("Destino")}: ${tr(d.get("destino"))}`,`${tr("Chegada")}: ${date(d.get("chegada"))}`,`${tr("Saída")}: ${date(d.get("saida"))}`,`${tr("Pessoas")}: ${d.get("pessoas")}`,`${tr("Traslado")}: ${tr(d.get("traslado"))}`,...(fields.hidden?[]:[`${tr("Origem")}: ${d.get("origem")||tr("A combinar")}`,`${tr("Destino do traslado")}: ${d.get("destino_traslado")||tr("A combinar")}`]),"",`${tr("Observações")}: ${d.get("observacoes")||tr("Nenhuma")}`].join("\n");
}
form.addEventListener("submit",e=>{e.preventDefault();const body=request();if(!body)return;window.location.href="mailto:gui@bento.host?subject="+encodeURIComponent(tr("Cotação")+" — "+tr(document.querySelector("#destination").value))+"&body="+encodeURIComponent(body);status.textContent="Pedido preparado. Conclua o envio no seu aplicativo de e-mail. Se ele não abrir, use ‘Copiar pedido’ e envie para gui@bento.host."});
document.querySelector("#copy").addEventListener("click",async()=>{const body=request();if(!body)return;try{await navigator.clipboard.writeText(body);status.textContent="Pedido copiado. Cole em um e-mail e envie para gui@bento.host."}catch{fallback.hidden=false;fallback.value=body;fallback.focus();fallback.select();status.textContent="Copie o texto abaixo e envie para gui@bento.host."}});

// Capa original: respeita a preferência por movimento reduzido.
const heroVideo=document.querySelector("#hero-video"),videoToggle=document.querySelector("#hero-video-toggle");
if(heroVideo&&videoToggle){
 const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
 const updateVideoButton=()=>{videoToggle.textContent=heroVideo.paused?"Reproduzir vídeo":"Pausar vídeo"};
 const motionPreference=()=>{if(reducedMotion.matches){heroVideo.autoplay=false;heroVideo.pause()}updateVideoButton()};
 videoToggle.hidden=false;heroVideo.muted=true;
 heroVideo.addEventListener("play",updateVideoButton);heroVideo.addEventListener("pause",updateVideoButton);
 videoToggle.addEventListener("click",async()=>{if(heroVideo.paused){try{await heroVideo.play()}catch{videoToggle.textContent="Tentar reproduzir"}}else{heroVideo.pause()}});
 reducedMotion.addEventListener("change",motionPreference);motionPreference();
 if(!reducedMotion.matches)heroVideo.play().catch(updateVideoButton);
}

window.addEventListener("pantanal:languagechange",()=>{departure.setCustomValidity("");if(!fallback.hidden){const body=request();if(body)fallback.value=body;}});
