(function () {
  "use strict";

  const D = window.ChapadaWaterfalls;
  const G = window.ExplorerGuides;
  const P = window.PantanalGuides;
  const daysKey = "pantanal.explorer.chapada.dias";
  let map;
  let regional;
  let transferLayer;
  let attractionLayer;
  let fuelLayer;
  let lodgeMarker;
  let stage = "transfer";
  let fuelVisible = false;
  let openPanel;
  let showPlace;
  let prepareRequest;

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  }

  function storedDays() {
    try {
      const value = Number(sessionStorage.getItem(daysKey));
      return Number.isInteger(value) && value >= 1 && value <= 14 ? value : 0;
    } catch (_) {
      return 0;
    }
  }

  function getDays() {
    return storedDays();
  }

  function setDays(value) {
    const days = Number(value);
    try {
      if (Number.isInteger(days) && days >= 1 && days <= 14) sessionStorage.setItem(daysKey, String(days));
      else sessionStorage.removeItem(daysKey);
    } catch (_) { /* A seleção também permanece visível no campo durante a visita. */ }
    return Number.isInteger(days) && days >= 1 && days <= 14 ? days : 0;
  }

  function mapsSearch(place) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.lat},${place.lng}`)}`;
  }

  function directionsTo(place) {
    return `https://www.google.com/maps/dir/?api=1&origin=${D.pousada.lat},${D.pousada.lng}&destination=${place.lat},${place.lng}`;
  }

  function distanceFromLodge(place) {
    const radius = 6371;
    const radians = degrees => degrees * Math.PI / 180;
    const deltaLat = radians(place.lat - D.pousada.lat);
    const deltaLng = radians(place.lng - D.pousada.lng);
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(D.pousada.lat)) * Math.cos(radians(place.lat)) * Math.sin(deltaLng / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function pin(symbol, type) {
    return L.divIcon({
      className: "regional-marker",
      html: `<span class="map-pin ${type}">${symbol}</span>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }

  function addMarker(layer, place, symbol, type, title, onClick) {
    const marker = L.marker([place.lat, place.lng], { icon: pin(symbol, type), title: `${title}: ${place.nome}` }).addTo(layer);
    marker.on("click", onClick);
    return marker;
  }

  function showAttraction(place) {
    const distance = distanceFromLodge(place);
    openPanel(`
      <span class="eyebrow">ATRAÇÃO DA CHAPADA</span>
      <h2>${escapeHTML(place.nome)}</h2>
      <p class="chapada-place-type">${escapeHTML(place.tipo)} · aproximadamente ${distance.toFixed(1).replace(".", ",")} km da pousada em linha reta</p>
      <p>${escapeHTML(place.descricao)}</p>
      <div class="chapada-panel-actions">
        <a class="action-button" href="${directionsTo(place)}" target="_blank" rel="noopener">Traçar rota desde a pousada</a>
        <a class="action-button light" href="${mapsSearch(place)}" target="_blank" rel="noopener">Abrir localização</a>
      </div>
      <p class="small-note">Distância aproximada em linha reta. Acesso, horários e necessidade de acompanhamento devem ser confirmados com o guia escolhido.</p>`);
  }

  function guideSuggestionHTML(guide) {
    const selected = G.getSelected()?.slug === guide.slug;
    const name = P.displayName(guide);
    const photo = P.safeUrl(guide.foto_perfil);
    const avatar = photo
      ? `<img src="${escapeHTML(photo)}" alt="Foto de ${escapeHTML(name)}">`
      : escapeHTML(P.initials(name));
    return `
      <article class="chapada-guide-card${selected ? " selected" : ""}">
        <span class="chapada-guide-avatar">${avatar}</span>
        <span><small>★ GUIA VIP</small><strong>${escapeHTML(name)}</strong></span>
        <button type="button" data-chapada-guide="${escapeHTML(guide.slug)}"${selected ? " aria-pressed=\"true\"" : ""}>${selected ? "Escolhido" : "Escolher"}</button>
      </article>`;
  }

  function renderGuideSuggestions(event) {
    const target = document.getElementById("chapada-guide-suggestions");
    if (!target) return;
    const guides = typeof G.getGuides === "function" ? G.getGuides().slice(0, 2) : [];
    if (!guides.length) {
      target.innerHTML = event?.type === "explorer:guidesloaded"
        ? `<p class="small-note">${event.detail?.error ? "Não foi possível consultar os guias agora." : "Nenhum guia VIP está habilitado para liderar no momento."}</p>`
        : '<p class="small-note">Carregando os guias VIP disponíveis…</p>';
      return;
    }
    target.innerHTML = guides.map(guideSuggestionHTML).join("");
    target.querySelectorAll("[data-chapada-guide]").forEach(button => button.addEventListener("click", () => {
      G.choose(button.dataset.chapadaGuide);
      renderGuideSuggestions();
    }));
    target.querySelectorAll("img").forEach(image => image.addEventListener("error", event => {
      const card = event.target.closest(".chapada-guide-card");
      const guide = guides.find(item => item.slug === card?.querySelector("[data-chapada-guide]")?.dataset.chapadaGuide);
      event.target.parentElement.textContent = guide ? P.initials(P.displayName(guide)) : "VIP";
    }, { once: true }));
  }

  function openLodge(options = {}) {
    const savedDays = getDays();
    const dayOptions = ['<option value="">Selecione</option>'];
    for (let day = 1; day <= 14; day += 1) {
      dayOptions.push(`<option value="${day}"${savedDays === day ? " selected" : ""}>${day} ${day === 1 ? "dia" : "dias"}</option>`);
    }
    openPanel(`
      <span class="eyebrow">BASE DA EXPEDIÇÃO</span>
      <h2>${escapeHTML(D.pousada.nome)}</h2>
      <p>Pousada e agência de turismo escolhida como ponto de partida para as atrações da Chapada.</p>
      <dl class="chapada-lodge-facts">
        <div><dt>Endereço</dt><dd>${escapeHTML(D.pousada.endereco)}</dd></div>
        <div><dt>Telefone</dt><dd>${escapeHTML(D.pousada.telefone)}</dd></div>
        <div><dt>Traslado</dt><dd>${D.traslado.distanciaKm.toLocaleString("pt-BR")} km · cerca de ${D.traslado.duracaoMinutos} min</dd></div>
      </dl>
      <div class="chapada-panel-actions">
        <a class="action-button" href="${escapeHTML(D.pousada.site)}" target="_blank" rel="noopener">Abrir site da pousada</a>
        <a class="action-button light" href="${escapeHTML(D.pousada.localizacao)}" target="_blank" rel="noopener">Abrir localização</a>
      </div>
      <section class="chapada-planner" aria-labelledby="chapada-planner-title">
        <span class="eyebrow">PLANEJE A ESTADIA</span>
        <h3 id="chapada-planner-title">${D.atracoes.length} atrações mapeadas ao redor da pousada</h3>
        <label for="chapada-days">Quantos dias deseja ficar?</label>
        <select id="chapada-days">${dayOptions.join("")}</select>
        <h3>Guias VIP sugeridos</h3>
        <p class="small-note">São exibidos os dois primeiros guias VIP atualmente habilitados para liderar expedições.</p>
        <div id="chapada-guide-suggestions" class="chapada-guide-suggestions" aria-live="polite"></div>
        <button id="chapada-all-guides" class="action-button light" type="button">Ver todos os guias VIP</button>
        <button id="chapada-request-quote" class="action-button" type="button">Solicitar orçamento</button>
        <p id="chapada-planner-notice" class="small-note" role="status"></p>
      </section>`);

    const days = document.getElementById("chapada-days");
    days.addEventListener("change", () => setDays(days.value));
    document.getElementById("chapada-all-guides").addEventListener("click", () => G.openPicker(() => openLodge()));
    document.getElementById("chapada-request-quote").addEventListener("click", () => {
      if (!setDays(days.value)) {
        document.getElementById("chapada-planner-notice").textContent = "Escolha quantos dias deseja ficar antes de solicitar o orçamento.";
        days.focus();
        return;
      }
      prepareRequest();
    });
    renderGuideSuggestions();
    if (options.focusDays) setTimeout(() => days.focus(), 0);
  }

  function fitStage() {
    if (!map) return;
    const group = stage === "transfer" ? transferLayer : attractionLayer;
    const bounds = group.getBounds();
    bounds.extend([D.pousada.lat, D.pousada.lng]);
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [35, 35] });
  }

  function selectStage(nextStage) {
    stage = nextStage;
    if (stage === "transfer") {
      if (!map.hasLayer(transferLayer)) transferLayer.addTo(map);
      if (map.hasLayer(attractionLayer)) map.removeLayer(attractionLayer);
    } else {
      if (map.hasLayer(transferLayer)) map.removeLayer(transferLayer);
      if (!map.hasLayer(attractionLayer)) attractionLayer.addTo(map);
    }
    document.getElementById("chapada-transfer-button").setAttribute("aria-pressed", String(stage === "transfer"));
    document.getElementById("chapada-attractions-button").setAttribute("aria-pressed", String(stage === "attractions"));
    fitStage();
  }

  function toggleFuel() {
    fuelVisible = !fuelVisible;
    if (fuelVisible) fuelLayer.addTo(map);
    else map.removeLayer(fuelLayer);
    document.getElementById("chapada-fuel-button").setAttribute("aria-pressed", String(fuelVisible));
  }

  function init(options) {
    if (!D || !window.L) throw new Error("Dados da Chapada ou mapa indisponíveis");
    regional = options.regional;
    openPanel = options.openPanel;
    showPlace = options.showPlace;
    prepareRequest = options.prepareRequest;
    map = L.map("map");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · rota OSRM'
    }).addTo(map);

    transferLayer = L.featureGroup();
    attractionLayer = L.featureGroup();
    fuelLayer = L.featureGroup();
    L.geoJSON(D.traslado.rota, { style: { color: "#176da0", weight: 5, opacity: 0.88 } }).addTo(transferLayer);
    addMarker(transferLayer, D.origem, "✈", "airport-pin", "Partida", () => showPlace(D.origem, "Partida do traslado"));
    D.atracoes.forEach((place, index) => addMarker(attractionLayer, place, String(index + 1), "attraction-pin", "Atração", () => showAttraction(place)));
    regional.postos.forEach((station, index) => addMarker(fuelLayer, station, "⛽", "fuel-pin", "Posto", () => showPlace(station, "Posto de combustível")));

    lodgeMarker = addMarker(map, D.pousada, "⌂", "lodge-pin", "Base", openLodge);
    lodgeMarker.bindTooltip("Pousada Flor da Chapada", { direction: "top", offset: [0, -18] });
    transferLayer.addTo(map);
    document.getElementById("chapada-transfer-button").addEventListener("click", () => selectStage("transfer"));
    document.getElementById("chapada-attractions-button").addEventListener("click", () => selectStage("attractions"));
    document.getElementById("chapada-fuel-button").addEventListener("click", toggleFuel);
    document.getElementById("chapada-plan-button").addEventListener("click", () => openLodge({ focusDays: true }));
    window.addEventListener("explorer:guidesloaded", renderGuideSuggestions);
    window.addEventListener("explorer:guidechange", renderGuideSuggestions);
    selectStage("transfer");
    setTimeout(() => map.invalidateSize(), 0);
  }

  window.ChapadaExplorer = Object.freeze({ init, getDays, openLodge, attractionCount: () => D?.atracoes?.length || 0 });
})();
