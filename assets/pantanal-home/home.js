"use strict";
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
function request(){departure.setCustomValidity(arrival.value&&departure.value&&departure.value<arrival.value?"A saída deve ser igual ou posterior à chegada.":"");if(!form.reportValidity())return null;const d=new FormData(form);const date=v=>v?v.split("-").reverse().join("/"):"A combinar";return ["Olá! Gostaria de uma cotação de viagem.","",`Nome: ${d.get("nome")}`,`E-mail: ${d.get("email")}`,`WhatsApp: ${d.get("telefone")}`,`Destino: ${d.get("destino")}`,`Chegada: ${date(d.get("chegada"))}`,`Saída: ${date(d.get("saida"))}`,`Pessoas: ${d.get("pessoas")}`,`Traslado: ${d.get("traslado")}`,...(fields.hidden?[]:[`Origem: ${d.get("origem")||"A combinar"}`,`Destino do traslado: ${d.get("destino_traslado")||"A combinar"}`]),"",`Observações: ${d.get("observacoes")||"Nenhuma"}`].join("\n")}
form.addEventListener("submit",e=>{e.preventDefault();const body=request();if(!body)return;window.location.href="mailto:gui@bento.host?subject="+encodeURIComponent("Cotação — "+document.querySelector("#destination").value)+"&body="+encodeURIComponent(body);status.textContent="Pedido preparado. Conclua o envio no seu aplicativo de e-mail. Se ele não abrir, use ‘Copiar pedido’ e envie para gui@bento.host."});
document.querySelector("#copy").addEventListener("click",async()=>{const body=request();if(!body)return;try{await navigator.clipboard.writeText(body);status.textContent="Pedido copiado. Cole em um e-mail e envie para gui@bento.host."}catch{fallback.hidden=false;fallback.value=body;fallback.focus();fallback.select();status.textContent="Copie o texto abaixo e envie para gui@bento.host."}});
