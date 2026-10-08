(async function () {
  "use strict";
  const P = window.PantanalGuides;
  const slug = P.currentGuideSlug();
  const status = document.querySelector("#sightings-status");
  const refresh = document.querySelector("#refresh-sightings");
  const list = document.querySelector("#sightings-list");
  const contacts = document.querySelector("#guide-contacts");
  let guide, owner = false, map, markers;
  const dateLabel = value => new Date(value).toLocaleString("pt-BR");

  function contact(label, url) {
    if (!url) return;
    const a = document.createElement("a");
    a.className = "button button-outline";
    a.textContent = label;
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    contacts.append(a);
  }
  function social(value, base) {
    if (!value) return "";
    const text = String(value).trim();
    if (/^https?:\/\//i.test(text)) return P.safeUrl(text);
    const handle = text.replace(/^@/, "").replace(/^(?:www\.)?(?:instagram|facebook)\.com\//i, "").replace(/\/$/, "");
    return handle ? base + encodeURIComponent(handle) : "";
  }
  async function showMedia(row, container, button) {
    button.disabled = true;
    button.textContent = "Carregando mídias…";
    try {
      const fragment = document.createDocumentFragment();
      for (const [path, tag] of [[row.photo_path, "img"], [row.audio_path, "audio"]]) {
        if (!path) continue;
        const { data, error } = await P.db.storage.from("guide-sightings").createSignedUrl(path, 600);
        if (error) throw error;
        const media = document.createElement(tag);
        media.src = data.signedUrl;
        if (tag === "img") { media.alt = `Foto original: ${row.species}`; media.loading = "lazy"; }
        else { media.controls = true; media.preload = "none"; }
        fragment.append(media);
      }
      container.replaceChildren(fragment);
      button.remove();
    } catch (error) {
      button.disabled = false;
      button.textContent = "Tentar carregar mídias novamente";
      console.error(error);
    }
  }
  async function fetchRows() {
    const table = owner ? "guide_sightings" : "guide_sighting_publications";
    const fields = owner
      ? "id,species,notes,observed_at,latitude,longitude,photo_path,audio_path"
      : "sighting_id,species,public_notes,observed_at,public_latitude,public_longitude";
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await P.db.from(table).select(fields).eq("guide_id", guide.id)
        .order("observed_at", { ascending: false }).order(owner ? "id" : "sighting_id")
        .range(offset, offset + 499);
      if (error) throw error;
      rows.push(...data);
      if (data.length < 500) return rows;
    }
  }
  async function load() {
    refresh.disabled = true;
    status.textContent = "Buscando avistamentos…";
    try {
      const rows = await fetchRows();
      const nextMarkers = L.featureGroup();
      const fragment = document.createDocumentFragment();
      let located = 0;
      for (const row of rows) {
        const latitude = owner ? row.latitude : row.public_latitude;
        const longitude = owner ? row.longitude : row.public_longitude;
        const notes = owner ? row.notes : row.public_notes;
        const hasPosition = Number.isFinite(latitude) && Number.isFinite(longitude);
        const card = document.createElement("article");
        card.className = "sighting-card";
        const title = document.createElement("h3"); title.textContent = row.species;
        const time = document.createElement("time"); time.dateTime = row.observed_at; time.textContent = dateLabel(row.observed_at);
        const detail = document.createElement("p"); detail.textContent = notes;
        card.append(title, time, detail);
        if (hasPosition) {
          const popup = document.createElement("div");
          const strong = document.createElement("strong"); strong.textContent = row.species;
          const p = document.createElement("p"); p.textContent = `${dateLabel(row.observed_at)}\n${notes}`;
          popup.append(strong, p);
          const marker = L.marker([latitude, longitude]).bindPopup(popup).addTo(nextMarkers);
          const locate = document.createElement("button"); locate.type = "button"; locate.className = "button button-outline"; locate.textContent = "Ver no mapa";
          locate.addEventListener("click", () => { map.setView([latitude, longitude], 14); marker.openPopup(); document.querySelector("#sightings-map").scrollIntoView({ behavior: "smooth", block: "center" }); });
          card.append(locate);
          located++;
        } else {
          const noGps = document.createElement("p"); noGps.textContent = "Registro sem localização GPS."; card.append(noGps);
        }
        if (owner && row.photo_path) {
          const button = document.createElement("button"); button.type = "button"; button.className = "button button-outline"; button.textContent = "Ver foto e áudio originais";
          const media = document.createElement("div"); media.className = "sighting-media";
          button.addEventListener("click", () => showMedia(row, media, button));
          card.append(button, media);
        }
        fragment.append(card);
      }
      markers.clearLayers(); markers.addLayer(nextMarkers);
      list.replaceChildren(fragment);
      if (located) map.fitBounds(nextMarkers.getBounds(), { padding: [30, 30], maxZoom: 13 });
      else map.setView([-16.56, -56.71], 9);
      status.textContent = rows.length
        ? `${rows.length} avistamento(s) · ${located} no mapa${owner ? " · Visão privada do guia" : ""}`
        : owner ? "Nenhum avistamento recebido do aplicativo ainda." : "Este guia ainda não publicou avistamentos.";
    } catch (error) {
      status.textContent = "Não foi possível atualizar os avistamentos. Toque em Atualizar mapa para tentar novamente.";
      console.error(error);
    } finally { refresh.disabled = false; }
  }
  try {
    if (!slug) throw new Error("Abra o mapa pelo perfil de um guia VIP.");
    const { data, error } = await P.db.from("public_guide_profiles").select("*").eq("slug", slug).maybeSingle();
    if (error) throw new Error("Não foi possível consultar o guia. Recarregue a página.");
    if (!data || !data.vip) throw new Error("Mapa disponível apenas para guias VIP aprovados e verificados.");
    guide = data;
    document.querySelector("#guide-name").textContent = P.displayName(guide);
    document.title = `Avistamentos de ${P.displayName(guide)} | Bento Pantanal`;
    document.querySelector("#back-profile").href = P.guidePath(guide.slug);
    const { data: sessionData, error: sessionError } = await P.db.auth.getSession();
    if (sessionError) throw new Error("Não foi possível verificar seu acesso. Recarregue a página.");
    if (sessionData.session) {
      const { data: own, error: ownError } = await P.db.from("guides").select("id").eq("id", guide.id).eq("user_id", sessionData.session.user.id).maybeSingle();
      if (ownError) throw new Error("Não foi possível verificar o acesso privado. Recarregue a página.");
      owner = Boolean(own);
    }
    if (!owner) {
      const login = document.querySelector("#owner-login");
      login.href = `/guias/login/?next=${encodeURIComponent(location.pathname + location.search)}`;
      login.classList.remove("hidden");
    }
    document.querySelector("#visibility-note").textContent = owner
      ? "Você está vendo seus registros privados. Fotos, áudios e coordenadas originais são acessíveis apenas na sua conta. A sincronização exige uma versão compatível do aplicativo."
      : "Este mapa mostra apenas os avistamentos e as localizações escolhidos pelo guia para publicação.";
    const phone = P.normalizePhone(guide.whatsapp);
    contact("WhatsApp", phone ? `https://wa.me/${phone}` : "");
    contact("Instagram", social(guide.instagram, "https://instagram.com/"));
    contact("Facebook", social(guide.facebook, "https://facebook.com/"));
    contact("Site do guia", P.safeUrl(guide.personal_domain || guide.site));
    if (!contacts.children.length) contacts.textContent = "Este guia ainda não informou contatos.";
    map = L.map("sightings-map").setView([-16.56, -56.71], 9);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    markers = L.featureGroup().addTo(map);
    refresh.addEventListener("click", load);
    await load();
    // Uma troca de conta não deve deixar mídias privadas na tela.
    P.db.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (session?.user.id || null) !== (sessionData.session?.user.id || null)) location.reload();
    });
  } catch (error) {
    status.textContent = error.message || "Não foi possível abrir o mapa.";
    document.querySelector("#sightings-map").hidden = true;
    document.querySelector(".sightings-records").hidden = true;
  }
})();
