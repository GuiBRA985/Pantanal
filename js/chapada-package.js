/* Regras compartilhadas da oferta; mapas e demais destinos usam seus dados originais. */
(function(){
'use strict';
const D=window.ChapadaWaterfalls, key='pantanal.chapada20k.ordem';
const valid=v=>v==='penhasco'?'penhasco':'parque';
let saved='parque';try{saved=sessionStorage.getItem(key)||saved;}catch{}
let order=valid(new URLSearchParams(location.search).get('ordem')||saved);
const facts={
 'pousada-do-parque':{nights:2,short:'Pousada do Parque',description:'Nos limites do Parque Nacional, a pousada reúne trilhas, torre de observação e duas cachoeiras sazonais em uma área privada de 500 hectares.',email:'pousada@pousadadoparque.com.br',features:'Natureza, trilhas e observação da paisagem. As cachoeiras dependem da estação e das chuvas.',source:'https://www.pousadadoparque.com.br/'},
 'flor-da-chapada':{nights:5,short:'Flor da Chapada',description:'Pousada parceira da Chapada Expeditions, com quartos confortáveis, áreas comuns integradas à natureza e gastronomia regional.',email:'ciliane@chapadaexp.com',phone:'+55 65 9966-3050',features:'Base para os passeios da região e para conhecer o centro da Chapada.',source:'https://www.chapadaexp.com/'},
 'pousada-penhasco':{nights:1,short:'Penhasco',description:'Hospedagem com vista para o penhasco e estrutura de lazer aquático, incluindo piscinas aquecidas, hidromassagem e toboáguas.',email:'atendimento@penhasco.com.br',features:'Piscinas, sauna, salão de jogos, trilha ecológica e deck de observação. Consulte horários e condições de uso para sua reserva.',source:'https://penhasco.com.br/hospedagem'}
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stops(){let ids=['pousada-do-parque','flor-da-chapada','pousada-penhasco'];if(order==='penhasco')ids.reverse();let day=1;return ids.map(id=>{const info=facts[id],l={...D.pousadas.find(x=>x.id===id),...info};l.telefone=info.phone||l.telefone;l.start=day;day+=l.nights;l.end=day;return l;});}
function setOrder(v){order=valid(v);try{sessionStorage.setItem(key,order);}catch{}return order;}
function lodgeHTML(l,open=false){return `<details class="lodge-detail"${open?' open':''}><summary>${esc(l.short)} · ${l.nights} ${l.nights===1?'noite':'noites'}</summary><p>${esc(l.description)}</p><p>${esc(l.features)}</p><dl><dt>No seu roteiro</dt><dd>Dias ${l.start} a ${l.end} · ${l.nights} noites</dd><dt>Endereço</dt><dd>${esc(l.endereco)}</dd><dt>Contato</dt><dd><a href="tel:${l.telefone.replace(/[^+0-9]/g,'')}">${esc(l.telefone)}</a><br><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></dd><dt>Referência desde o aeroporto</dt><dd>${l.traslado.distanciaKm.toLocaleString('pt-BR')} km · cerca de ${l.traslado.duracaoMinutos} min</dd>${l.codigoLocalizacao?`<dt>Código de localização</dt><dd>${esc(l.codigoLocalizacao)}</dd>`:''}</dl><div class="lodge-links"><a href="${esc(l.site)}" target="_blank" rel="noopener">Site oficial ↗</a><a href="${esc(l.localizacao)}" target="_blank" rel="noopener">Localização ↗</a></div><p class="small-note">Estrutura e contatos: <a href="${esc(l.source)}" target="_blank" rel="noopener">informações da hospedagem</a>. Categoria do quarto, refeições, horários e acesso ao lazer serão confirmados na proposta.</p></details>`;}
function directions(a,b){return `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&travelmode=driving`;}
// Liga os ramais rodoviários existentes no último ponto comum, sem linhas retas entre pousadas.
function between(a,b){const x=a.traslado.rota.coordinates,y=b.traslado.rota.coordinates;let pair=[0,0],score=-1;for(let i=0;i<x.length;i++)for(let j=0;j<y.length;j++)if(x[i][0]===y[j][0]&&x[i][1]===y[j][1]&&i/x.length+j/y.length>score){pair=[i,j];score=i/x.length+j/y.length;}return x.slice(pair[0]).reverse().concat(y.slice(pair[1]+1));}
function legs(){const s=stops(),a=D.origem;return [{from:a,to:s[0],day:1,coordinates:s[0].traslado.rota.coordinates},{from:s[0],to:s[1],day:s[1].start,coordinates:between(s[0],s[1])},{from:s[1],to:s[2],day:s[2].start,coordinates:between(s[1],s[2])},{from:s[2],to:a,day:9,coordinates:s[2].traslado.rota.coordinates.slice().reverse()}];}
window.ChapadaPackage=Object.freeze({get order(){return order;},setOrder,stops,legs,lodgeHTML,directions,esc});
})();
