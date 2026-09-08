(function () {
  "use strict";
  const params = new URLSearchParams(location.search);
  const routeId = params.get("expedicao") || (params.get("montar") === "1" ? "porto-jofre" : "");
  const isJaguar = routeId === "porto-jofre";
  const expeditions = window.PantanalExpeditions || {};
  const regional = Object.hasOwn(expeditions, routeId) ? expeditions[routeId] : null;
  const expeditionName = isJaguar ? "Expedição Jaguar — Porto Jofre" : regional ? `Expedição ${regional.nome}` : "";
  const P = window.PantanalGuides;
  const G = window.ExplorerGuides;
  const infoPanel = document.getElementById("info-panel");
  const panelContent = document.getElementById("panel-content");
  let requestBusy = false;
  let returnFocus;

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function syncLinks() {
    const guide = G.getSelected();
    document.querySelectorAll("[data-expedition]").forEach(link => {
      const url = new URL("explorer.html", location.href);
      url.searchParams.set("expedicao", link.dataset.expedition);
      if (guide) url.searchParams.set("guia", guide.slug);
      link.href = url.href;
    });
    const catalog = new URL("explorer.html", location.href);
    if (guide) catalog.searchParams.set("guia", guide.slug);
    document.getElementById("catalog-link").href = catalog.href;
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Arquivo indisponível: ${src}`));
      document.body.append(script);
    });
  }
  function showMapError() {
    document.getElementById("map-error").hidden = false;
  }
  function openPanel(content) {
    panelContent.innerHTML = content;
    infoPanel.classList.add("show");
    document.getElementById("close-panel").focus();
  }
  function mapsUrl(local) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${local.lat},${local.lng}`)}`;
  }
  function showFuelList() {
    const list = regional.postos.map((station, index) => `<li><button type="button" class="fuel-item" data-fuel-index="${index}"><b>${index + 1}. ${escapeHTML(station.nome)}</b>${station.endereco ? `<span>${escapeHTML(station.endereco)}</span>` : ""}</button></li>`).join("");
    openPanel(`<span class="eyebrow">ABASTECIMENTO</span><h2>Postos no caminho</h2><p>${regional.postos.length} pontos mapeados próximos ao trajeto para ${escapeHTML(regional.nome)}.</p><ol class="fuel-list">${list}</ol><p class="small-note">Dados do OpenStreetMap consultados em ${regional.consultadoEm}. Consulte o posto antes da viagem para confirmar funcionamento e acesso.</p>`);
    panelContent.querySelectorAll("[data-fuel-index]").forEach(button => button.addEventListener("click", () => showPlace(regional.postos[Number(button.dataset.fuelIndex)], "Posto de combustível")));
  }
  function showPlace(place, label) {
    openPanel(`<span class="eyebrow">${escapeHTML(label)}</span><h2>${escapeHTML(place.nome)}</h2>${place.endereco ? `<p>${escapeHTML(place.endereco)}</p>` : ""}<a class="action-button" href="${mapsUrl(place)}" target="_blank" rel="noopener">Abrir localização</a>${place.source ? `<p><a href="${escapeHTML(place.source)}" target="_blank" rel="noopener">Ver no OpenStreetMap</a></p>` : ""}`);
  }
  function regionalMap() {
    const map = L.map("map");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · rota OSRM'
    }).addTo(map);
    L.geoJSON(regional.rota, { style: { color: "#173a2b", weight: 5, opacity: 0.85 } }).addTo(map);
    const points = [];
    function marker(place, symbol, type, label) {
      const icon = L.divIcon({ className: "regional-marker", html: `<span class="map-pin ${type}">${symbol}</span>`, iconSize: [36, 36], iconAnchor: [18, 18] });
      const point = L.marker([place.lat, place.lng], { icon, title: `${label}: ${place.nome}` }).addTo(map);
      point.on("click", () => showPlace(place, label));
      points.push(point);
    }
    marker(regional.origem, "✈", "airport-pin", "Partida");
    marker(regional.destino, "⚑", "destination-pin", "Destino");
    regional.postos.forEach((station, index) => marker(station, String(index + 1), "fuel-pin", "Posto de combustível"));
    map.fitBounds(L.featureGroup(points).getBounds(), { padding: [35, 35] });
    setTimeout(() => map.invalidateSize(), 0);
  }
  function composeRequest(guide) {
    const lines = ["Olá, Bento Pantanal! Quero uma cotação para:", "", expeditionName,
      `Guia VIP escolhido: ${P.displayName(guide)}`, `Perfil do guia: ${new URL(P.guidePath(guide.slug), location.origin).href}`, ""];
    if (isJaguar) {
      lines.push("Duração: 10 dias / 9 noites", "Paradas:");
      window.JaguarExpedition.stops().forEach((stop, index) => lines.push(`${index + 1}. ${stop.nome} — ${stop.noites} noites`));
    } else {
      lines.push(`Saída: ${regional.origem.nome}, Várzea Grande — MT`, `Destino: ${regional.nome} — MT`, "Duração e detalhes do roteiro: a combinar com o Bento Pantanal.");
    }
    lines.push("", "Quero combinar datas, número de viajantes, orçamento e logística com o Bento Pantanal.", "Guia e reserva sujeitos à confirmação de disponibilidade.");
    return lines.join("\n");
  }
  function showRequest(guide) {
    const summary = composeRequest(guide);
    document.getElementById("request-summary").value = summary;
    const config = window.EXPLORER_CONFIG || {};
    const phone = String(config.whatsapp || "").replace(/\D/g, "");
    const email = String(config.email || "").trim();
    const link = document.getElementById("send-request");
    const notice = document.getElementById("request-notice");
    document.getElementById("copy-request").textContent = "Copiar pedido";
    if (/^\d{10,15}$/.test(phone)) {
      link.href = `https://wa.me/${phone}?text=${encodeURIComponent(summary)}`;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Continuar pelo WhatsApp";
      link.hidden = false;
      notice.textContent = "Confirme o envio no WhatsApp do Bento Pantanal. Reserva e disponibilidade dependem de confirmação.";
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      link.href = `mailto:${email}?subject=${encodeURIComponent(`Cotação — ${expeditionName}`)}&body=${encodeURIComponent(summary)}`;
      link.removeAttribute("target");
      link.textContent = "Continuar por e-mail";
      link.hidden = false;
      notice.textContent = "O pedido só será enviado quando você confirmar no aplicativo de e-mail. Reserva e disponibilidade dependem de confirmação.";
    } else {
      link.hidden = true;
      link.removeAttribute("href");
      notice.textContent = "Copie o pedido para combinar a viagem com o Bento Pantanal.";
    }
    returnFocus = document.activeElement;
    document.getElementById("request-dialog").showModal();
  }
  async function prepareRequest() {
    if (requestBusy || !expeditionName) return;
    if (isJaguar && !window.JaguarExpedition?.isComplete()) {
      window.JaguarExpedition?.openItinerary();
      return;
    }
    if (!G.getSelected()) { G.openPicker(prepareRequest); return; }
    requestBusy = true;
    document.getElementById("regional-request").disabled = true;
    try {
      // Always re-read eligibility before preparing a quote; never trust a URL or stored profile.
      const success = await G.load();
      const guide = G.getSelected();
      if (!success || !guide) { G.openPicker(prepareRequest); return; }
      showRequest(guide);
    } finally {
      requestBusy = false;
      document.getElementById("regional-request").disabled = false;
    }
  }
  document.getElementById("copy-request").addEventListener("click", async event => {
    const text = document.getElementById("request-summary");
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(text.value);
      button.textContent = "Pedido copiado";
    } catch (_) {
      text.focus();
      text.select();
      document.getElementById("request-notice").textContent = "O texto está selecionado. Use a opção Copiar do seu dispositivo.";
    }
  });
  document.getElementById("request-dialog").addEventListener("close", () => returnFocus?.focus());
  document.getElementById("regional-request").addEventListener("click", prepareRequest);
  document.getElementById("fuel-list-button").addEventListener("click", showFuelList);
  document.getElementById("close-panel").addEventListener("click", () => infoPanel.classList.remove("show"));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      infoPanel.classList.remove("show");
      document.getElementById("roteiro-panel").classList.remove("show");
    }
  });
  window.addEventListener("explorer:guidechange", syncLinks);
  window.ExplorerApp = Object.freeze({ prepareRequest, composeRequest, routeId });
  syncLinks();

  if (!expeditionName) {
    if (routeId) document.querySelector(".catalog-heading p").textContent = "Escolha uma das três expedições disponíveis abaixo.";
    return;
  }
  document.title = `${expeditionName} | Pantanal Explorer`;
  document.body.className = isJaguar ? "jaguar-mode" : "regional-mode";
  document.getElementById("expedition-catalog").hidden = true;
  document.getElementById("route-bar").hidden = false;
  document.getElementById("route-name").textContent = expeditionName;
  document.getElementById("map").hidden = false;
  infoPanel.hidden = false;
  if (isJaguar) {
    ["roteiro-panel", "roteiro-btn", "jaguar-menu"].forEach(id => { document.getElementById(id).hidden = false; });
    (async () => {
      try {
        if (!window.L) throw new Error("Mapa indisponível");
        for (const file of ["cidades", "pousadas", "destinos", "pontes"]) await loadScript(`js/data/${file}.js`);
        await loadScript("js/explorer-jaguar.js");
      } catch (_) { showMapError(); }
    })();
  } else {
    document.getElementById("regional-actions").hidden = false;
    try { regionalMap(); } catch (_) { showMapError(); }
  }
})();
