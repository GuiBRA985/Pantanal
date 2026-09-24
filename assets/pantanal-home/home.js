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
 return [tr("Olá! Gostaria de uma cotação de viagem."),"",`${tr("Nome")}: ${d.get("nome")}`,`E-mail: ${d.get("email")}`,`WhatsApp: ${d.get("telefone")}`,`${tr("Destino")}: ${tr(d.get("destino"))}`,`${tr("Chegada")}: ${date(d.get("chegada"))}`,`${tr("Saída")}: ${date(d.get("saida"))}`,`${tr("Pessoas")}: ${d.get("pessoas")}`,`${tr("Traslado")}: ${tr(transfer.value)}`,...(fields.hidden?[]:[`${tr("Origem")}: ${d.get("origem")||tr("A combinar")}`,`${tr("Destino do traslado")}: ${d.get("destino_traslado")||tr("A combinar")}`]),...chapadaRequestLines(),"",`${tr("Observações")}: ${d.get("observacoes")||tr("Nenhuma")}`].join("\n");
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


// Pacote da Chapada: ordem reversível, oito noites e cotação para duas pessoas.
const packageOrder=document.querySelector('#package-order'), quoteOrder=document.querySelector('#quote-order'), destination=document.querySelector('#destination'), packageFields=document.querySelector('#package-fields'), people=form.elements.pessoas;
function renderStays(){
 const stays=packageOrder.value==='penhasco'?[['Penhasco','1 noite · dias 1 a 2'],['Flor da Chapada','5 noites · dias 2 a 7'],['Pousada do Parque','2 noites · dias 7 a 9']]:[['Pousada do Parque','2 noites · dias 1 a 3'],['Flor da Chapada','5 noites · dias 3 a 8'],['Penhasco','1 noite · dias 8 a 9']];
 document.querySelector('#package-stays').replaceChildren(...stays.map(([name,days])=>{const li=document.createElement('li'),b=document.createElement('strong'),span=document.createElement('span');b.textContent=name;span.textContent=tr(days);li.append(b,span);return li;}));
 quoteOrder.value=packageOrder.value;
}
function packageDates(){if(destination.value!=='Chapada dos Guimarães')return;if(arrival.value){const date=new Date(arrival.value+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+8);departure.value=date.toISOString().slice(0,10);}else departure.value='';departure.setCustomValidity('');}
function updatePackage(){const active=destination.value==='Chapada dos Guimarães';packageFields.hidden=!active;quoteOrder.disabled=!active;people.readOnly=active;departure.readOnly=active;if(active){people.value='2';transfer.value='Sim';form.elements.origem.value='Aeroporto Marechal Rondon — Várzea Grande';form.elements.destino_traslado.value='Pousadas do pacote Chapada (ida, transferências e volta)';updateTransfer();packageDates();}transfer.disabled=active;}
function chapadaRequestLines(){if(destination.value!=='Chapada dos Guimarães')return [];return ['','Pacote Chapada: R$ 20.000 por casal — 8 noites / 9 dias.',quoteOrder.value==='penhasco'?'Ordem: Penhasco (1 noite) → Flor da Chapada (5 noites) → Pousada do Parque (2 noites).':'Ordem: Pousada do Parque (2 noites) → Flor da Chapada (5 noites) → Penhasco (1 noite).','Inclui hospedagem, traslados aeroporto/pousadas, transferências entre pousadas e contato do guia.','Passeios, transporte às atrações, acompanhamento e ingressos: contratar e pagar diretamente ao guia.','Passagens aéreas não incluídas. Pagamento em criptomoeda: moeda, rede e cotação a combinar.'];}
packageOrder.addEventListener('change',renderStays);quoteOrder.addEventListener('change',()=>{packageOrder.value=quoteOrder.value;renderStays()});destination.addEventListener('change',updatePackage);arrival.addEventListener('change',packageDates);
document.querySelector('#package-quote').addEventListener('click',()=>{destination.value='Chapada dos Guimarães';quoteOrder.value=packageOrder.value;updatePackage()});
document.querySelectorAll('[data-destino],#transfer-link').forEach(a=>a.addEventListener('click',updatePackage));
renderStays();updatePackage();
