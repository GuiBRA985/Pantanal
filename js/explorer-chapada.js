(function () {
  "use strict";

  const D = window.ChapadaWaterfalls;
  const G = window.ExplorerGuides;
  const daysKey = "pantanal.explorer.chapada.dias";
  const lodgeKey = "pantanal.explorer.chapada.pousada";
  let map;
  let transferPointsLayer;
  let transferRouteLayer;
  let attractionLayer;
  let selectedLodgeLayer;
  let stage = "transfer";
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
    } catch (_) { /* A escolha continua válida durante a visita atual. */ }
    return Number.isInteger(days) && days >= 1 && days <= 14 ? days : 0;
  }

  function storedLodgeId() {
    try { return sessionStorage.getItem(lodgeKey) || ""; } catch (_) { return ""; }
  }

  function getSelectedLodge() {
    const id = storedLodgeId();
    return D?.pousadas?.find(lodge => lodge.id === id) || null;
  }

  function setSelectedLodge(id) {
    const lodge = D.pousadas.find(item => item.id === id) || null;
    try {
      if (lodge) sessionStorage.setItem(lodgeKey, lodge.id);
      else sessionStorage.removeItem(lodgeKey);
    } catch (_) { /* A escolha também fica refletida na interface. */ }
    return lodge;
  }

  function isReady() {
    return Boolean(getSelectedLodge() && getDays());
  }

  function mapsSearch(place) {
    return place.localizacao || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.lat},${place.lng}`)}`;
  }

  function directionsTo(place) {
    const lodge = getSelectedLodge();
    if (!lodge) return mapsSearch(place);
    return `https://www.google.com/maps/dir/?api=1&origin=${lodge.lat},${lodge.lng}&destination=${place.lat},${place.lng}`;
  }

  function distanceFromLodge(place) {
    const lodge = getSelectedLodge();
    if (!lodge) return 0;
    const radius = 6371;
    const radians = degrees => degrees * Math.PI / 180;
    const deltaLat = radians(place.lat - lodge.lat);
    const deltaLng = radians(place.lng - lodge.lng);
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(lodge.lat)) * Math.cos(radians(place.lat)) * Math.sin(deltaLng / 2) ** 2;
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

  function clearLayer(layer) {
    if (layer) layer.clearLayers();
  }

  function renderTransferRoute() {
    clearLayer(transferRouteLayer);
    const lodge = getSelectedLodge();
    if (!lodge) return;
    L.geoJSON(lodge.traslado.rota, { style: { color: "#176da0", weight: 5, opacity: 0.88 } }).addTo(transferRouteLayer);
  }

  function renderSelectedLodgeMarker() {
    clearLayer(selectedLodgeLayer);
    const lodge = getSelectedLodge();
    if (!lodge) return;
    const marker = addMarker(selectedLodgeLayer, lodge, "⌂", "lodge-pin selected-lodge", "Base escolhida", () => openTransferPlanner());
    marker.bindTooltip(lodge.nome, { direction: "top", offset: [0, -18] });
  }

  function lodgeOptionHTML(lodge, checked) {
    const code = lodge.codigoLocalizacao ? `<p><b>Código de localização:</b> ${escapeHTML(lodge.codigoLocalizacao)}</p>` : "";
    return `
      <article class="chapada-lodge-option${checked ? " selected" : ""}">
        <label>
          <input type="radio" name="chapada-lodge" value="${escapeHTML(lodge.id)}"${checked ? " checked" : ""}>
          <span><strong>${escapeHTML(lodge.nome)}</strong><small>${lodge.traslado.distanciaKm.toLocaleString("pt-BR")} km · cerca de ${lodge.traslado.duracaoMinutos} min do aeroporto</small></span>
        </label>
        <p>${escapeHTML(lodge.endereco)}</p>
        ${code}
        <div class="chapada-lodge-links">
          <a href="${escapeHTML(lodge.site)}" target="_blank" rel="noopener">Abrir site</a>
          <a href="${escapeHTML(mapsSearch(lodge))}" target="_blank" rel="noopener">Abrir localização</a>
        </div>
      </article>`;
  }

  function dayOptionsHTML(savedDays) {
    const options = ['<option value="">Selecione</option>'];
    for (let day = 1; day <= 14; day += 1) {
      options.push(`<option value="${day}"${savedDays === day ? " selected" : ""}>${day} ${day === 1 ? "dia" : "dias"}</option>`);
    }
    return options.join("");
  }

  function openTransferPlanner(options = {}) {
    const current = getSelectedLodge();
    const preferredId = options.preferredLodgeId || current?.id || "";
    openPanel(`
      <span class="eyebrow">ESCOLHA A POUSADA</span>
      <h2>Escolha onde deseja se hospedar</h2>
      <p>Selecione uma das três pousadas e informe quantos dias pretende ficar. Você poderá alterar essas escolhas antes de solicitar o orçamento.</p>
      <div id="chapada-lodge-options" class="chapada-lodge-options">
        ${D.pousadas.map(lodge => lodgeOptionHTML(lodge, lodge.id === preferredId)).join("")}
      </div>
      <section class="chapada-planner" aria-labelledby="chapada-planner-title">
        <span class="eyebrow">PLANEJE A ESTADIA</span>
        <h3 id="chapada-planner-title">${D.atracoes.length} atrações mapeadas ao redor da pousada escolhida</h3>
        <label for="chapada-days">Quantos dias deseja ficar?</label>
        <select id="chapada-days">${dayOptionsHTML(getDays())}</select>
        <button id="chapada-confirm-stay" class="action-button" type="button">Confirmar pousada e dias</button>
        <p id="chapada-planner-notice" class="small-note" role="status"></p>
      </section>`);

    const optionsBox = document.getElementById("chapada-lodge-options");
    const days = document.getElementById("chapada-days");
    const notice = document.getElementById("chapada-planner-notice");
    optionsBox.querySelectorAll('input[name="chapada-lodge"]').forEach(input => input.addEventListener("change", () => {
      optionsBox.querySelectorAll(".chapada-lodge-option").forEach(card => card.classList.toggle("selected", card.contains(input)));
    }));
    document.getElementById("chapada-confirm-stay").addEventListener("click", () => {
      const selected = optionsBox.querySelector('input[name="chapada-lodge"]:checked');
      if (!selected) {
        notice.textContent = "Escolha uma pousada para continuar.";
        optionsBox.querySelector("input")?.focus();
        return;
      }
      if (!setDays(days.value)) {
        notice.textContent = "Escolha quantos dias deseja ficar antes de continuar.";
        days.focus();
        return;
      }
      const lodge = setSelectedLodge(selected.value);
      renderTransferRoute();
      renderSelectedLodgeMarker();
      selectStage("transfer", true);
      notice.textContent = "Sua escolha foi salva. Agora você pode ver as atrações ou escolher o guia.";
      document.getElementById("selected-lodge-label").textContent = lodge ? `Pousada escolhida: ${lodge.nome}` : "";
    });
    if (options.focusMissing) {
      setTimeout(() => (preferredId ? days : optionsBox.querySelector("input"))?.focus(), 0);
    }
  }

  function showAttraction(place) {
    const lodge = getSelectedLodge();
    if (!lodge) {
      openTransferPlanner({ focusMissing: true });
      return;
    }
    const distance = distanceFromLodge(place);
    openPanel(`
      <span class="eyebrow">ATRAÇÃO DA CHAPADA</span>
      <h2>${escapeHTML(place.nome)}</h2>
      <p class="chapada-place-type">${escapeHTML(place.tipo)} · aproximadamente ${distance.toFixed(1).replace(".", ",")} km de ${escapeHTML(lodge.nome)} em linha reta</p>
      <p>${escapeHTML(place.descricao)}</p>
      <div class="chapada-panel-actions">
        <a class="action-button" href="${directionsTo(place)}" target="_blank" rel="noopener">Traçar rota desde a pousada escolhida</a>
        <a class="action-button light" href="${mapsSearch(place)}" target="_blank" rel="noopener">Abrir localização</a>
      </div>
      <p class="small-note">Distância aproximada em linha reta. Acesso, horários e necessidade de acompanhamento devem ser confirmados com o guia escolhido.</p>`);
  }

  function fitStage() {
    if (!map) return;
    const lodge = getSelectedLodge();
    let bounds;
    if (stage === "transfer") {
      bounds = lodge && transferRouteLayer.getLayers().length
        ? transferRouteLayer.getBounds()
        : transferPointsLayer.getBounds();
    } else {
      bounds = attractionLayer.getBounds();
      if (lodge) bounds.extend([lodge.lat, lodge.lng]);
    }
    if (bounds?.isValid()) map.fitBounds(bounds, { padding: [35, 35] });
  }

  function selectStage(nextStage, preservePanel = false) {
    if (nextStage === "attractions" && !getSelectedLodge()) {
      openTransferPlanner({ focusMissing: true });
      return;
    }
    stage = nextStage;
    const transfer = stage === "transfer";
    [transferPointsLayer, transferRouteLayer].forEach(layer => {
      if (transfer && !map.hasLayer(layer)) layer.addTo(map);
      if (!transfer && map.hasLayer(layer)) map.removeLayer(layer);
    });
    if (!transfer && !map.hasLayer(attractionLayer)) attractionLayer.addTo(map);
    if (transfer && map.hasLayer(attractionLayer)) map.removeLayer(attractionLayer);
    if (!map.hasLayer(selectedLodgeLayer)) selectedLodgeLayer.addTo(map);
    document.getElementById("chapada-transfer-button").setAttribute("aria-pressed", String(transfer));
    document.getElementById("chapada-attractions-button").setAttribute("aria-pressed", String(!transfer));
    fitStage();
    if (!preservePanel && transfer) openTransferPlanner();
  }

  function chooseGuideAndQuote() {
    if (!isReady()) {
      openTransferPlanner({ focusMissing: true });
      const notice = document.getElementById("chapada-planner-notice");
      if (notice) notice.textContent = "Escolha a pousada e a quantidade de dias antes de escolher o guia.";
      return;
    }
    G.openPicker(prepareRequest);
  }

  function init(options) {
    if (!D?.pousadas?.length || !window.L) throw new Error("Dados da Chapada ou mapa indisponíveis");
    openPanel = options.openPanel;
    showPlace = options.showPlace;
    prepareRequest = options.prepareRequest;
    map = L.map("map");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · rotas OSRM'
    }).addTo(map);

    transferPointsLayer = L.featureGroup();
    transferRouteLayer = L.featureGroup();
    attractionLayer = L.featureGroup();
    selectedLodgeLayer = L.featureGroup();
    addMarker(transferPointsLayer, D.origem, "✈", "airport-pin", "Partida", () => showPlace(D.origem, "Partida do traslado"));
    D.pousadas.forEach(lodge => {
      const marker = addMarker(transferPointsLayer, lodge, "⌂", "lodge-pin", "Pousada", () => openTransferPlanner({ preferredLodgeId: lodge.id }));
      marker.bindTooltip(lodge.nome, { direction: "top", offset: [0, -18] });
    });
    D.atracoes.forEach((place, index) => addMarker(attractionLayer, place, String(index + 1), "attraction-pin", "Atração", () => showAttraction(place)));
    renderTransferRoute();
    renderSelectedLodgeMarker();

    document.getElementById("chapada-transfer-button").addEventListener("click", () => selectStage("transfer"));
    document.getElementById("chapada-attractions-button").addEventListener("click", () => selectStage("attractions"));
    document.getElementById("chapada-guide-button").addEventListener("click", chooseGuideAndQuote);
    document.getElementById("chapada-plan-button").addEventListener("click", () => openTransferPlanner({ focusMissing: true }));
    const lodge = getSelectedLodge();
    document.getElementById("selected-lodge-label").textContent = lodge ? `Pousada escolhida: ${lodge.nome}` : "Escolha sua pousada e os dias";
    selectStage("transfer", true);
    setTimeout(() => {
      map.invalidateSize();
      if (!isReady()) openTransferPlanner({ focusMissing: true });
    }, 0);
  }

  window.ChapadaExplorer = Object.freeze({
    init,
    getDays,
    getSelectedLodge,
    isReady,
    openTransferPlanner,
    attractionCount: () => D?.atracoes?.length || 0
  });
})();
