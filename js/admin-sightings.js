(async function () {
  "use strict";
  const P = window.PantanalGuides;
  const loading = document.querySelector("#review-loading");
  const area = document.querySelector("#review-area");
  const message = document.querySelector("#review-message");
  const list = document.querySelector("#review-list");
  const filter = document.querySelector("#review-filter");
  const refresh = document.querySelector("#review-refresh");
  const previous = document.querySelector("#review-previous");
  const next = document.querySelector("#review-next");
  const pageLabel = document.querySelector("#review-page");
  let page = 0, busy = false, hasNext = false;
  const pageSize = 25;
  const dateLabel = value => new Date(value).toLocaleString("pt-BR");
  const labels = { pending: "Aguardando aprovação", approved: "Aprovado e publicado", rejected: "Não aprovado" };
  const fields = "sighting_id,guide_id,species,public_notes,observed_at,public_latitude,public_longitude,review_status,submitted_at,reviewed_at,submission_version";
  function setBusy(value) { busy = value; refresh.disabled = value; filter.disabled = value; previous.disabled = value || page === 0; next.disabled = value || !hasNext; }
  async function verifyAdmin() {
    const { data: user, error: userError } = await P.db.auth.getUser();
    if (userError || !user.user) throw new Error("Entre novamente na conta administrativa.");
    const { data, error } = await P.db.rpc("is_admin");
    if (error || data !== true) throw new Error("Somente administradores podem aprovar avistamentos.");
  }
  async function decide(row, status, card) {
    if (busy) return;
    setBusy(true);
    const buttons = list.querySelectorAll("button"); buttons.forEach(button => { button.disabled = true; });
    message.textContent = status === "approved" ? "Aprovando avistamento…" : "Registrando decisão…";
    try {
      await verifyAdmin();
      const { data, error } = await P.db.from("guide_sighting_publications").update({ review_status: status })
        .eq("sighting_id", row.sighting_id).eq("submission_version", row.submission_version).eq("review_status", row.review_status)
        .select("sighting_id,review_status").maybeSingle();
      if (error) throw new Error("Não foi possível salvar a decisão. Tente novamente.");
      if (!data) throw new Error("O guia alterou ou retirou esta solicitação. Atualize a fila antes de decidir.");
      if (data.review_status !== status) throw new Error("A decisão não foi confirmada. Atualize a fila.");
      row.review_status = data.review_status;
      card.querySelector(".publication-state").textContent = labels[status];
      card.querySelector(".review-actions").replaceChildren();
      message.textContent = status === "approved" ? "Aprovado. O avistamento está disponível no mapa público." : "Não aprovado. O avistamento permanece fora do mapa público.";
    } catch (error) { message.textContent = error.message || "Não foi possível salvar a decisão."; }
    finally { setBusy(false); buttons.forEach(button => { button.disabled = false; }); }
  }
  function render(rows, guides) {
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const guide = guides.get(row.guide_id);
      const card = document.createElement("article"); card.className = "sighting-card";
      const title = document.createElement("h2"); title.textContent = row.species;
      const name = document.createElement("p"); name.textContent = `Guia: ${guide ? P.displayName(guide) : row.guide_id}`;
      const state = document.createElement("p"); state.className = "publication-state"; state.textContent = labels[row.review_status];
      const time = document.createElement("p"); time.textContent = `Avistamento: ${dateLabel(row.observed_at)} · Solicitado: ${dateLabel(row.submitted_at)}`;
      const notes = document.createElement("p"); notes.textContent = row.public_notes || "Sem descrição pública.";
      const coordinates = document.createElement("p"); coordinates.textContent = `Ponto proposto: ${row.public_latitude}, ${row.public_longitude}`;
      const point = document.createElement("a"); point.className = "button button-outline"; point.textContent = "Conferir ponto no mapa"; point.target = "_blank"; point.rel = "noopener noreferrer";
      point.href = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(row.public_latitude)}&mlon=${encodeURIComponent(row.public_longitude)}#map=14/${encodeURIComponent(row.public_latitude)}/${encodeURIComponent(row.public_longitude)}`;
      const actions = document.createElement("div"); actions.className = "publication-actions review-actions";
      for (const [status, label] of [["approved", "Aprovar e publicar"], ["rejected", row.review_status === "approved" ? "Retirar aprovação" : "Não aprovar"]]) {
        if (status === row.review_status) continue;
        const button = document.createElement("button"); button.type = "button"; button.className = status === "approved" ? "button" : "button button-outline"; button.textContent = label;
        button.addEventListener("click", () => decide(row, status, card)); actions.append(button);
      }
      card.append(title, name, state, time, notes, coordinates, point, actions); fragment.append(card);
    }
    list.replaceChildren(fragment);
  }
  async function load() {
    if (busy) return;
    setBusy(true); message.textContent = "Carregando solicitações…";
    try {
      await verifyAdmin();
      const { data, error } = await P.db.from("guide_sighting_publications").select(fields).eq("review_status", filter.value)
        .order("submitted_at", { ascending: false }).order("sighting_id").range(page * pageSize, page * pageSize + pageSize);
      if (error) throw new Error("Não foi possível carregar a fila. Tente novamente.");
      const rows = data.slice(0, pageSize);
      const ids = [...new Set(rows.map(row => row.guide_id))];
      const guides = new Map();
      if (ids.length) {
        const { data: names, error: nameError } = await P.db.from("guides").select("id,nome,nome_profissional,slug").in("id", ids);
        if (nameError) throw new Error("Não foi possível consultar os guias. Tente novamente.");
        for (const guide of names) guides.set(guide.id, guide);
      }
      render(rows, guides); pageLabel.textContent = `Página ${page + 1}`;
      message.textContent = rows.length ? `${rows.length} solicitação(ões) nesta página.` : "Nenhum avistamento nesta situação.";
      hasNext = data.length > pageSize; setBusy(false);
    } catch (error) { list.replaceChildren(); message.textContent = error.message || "Não foi possível carregar a fila."; setBusy(false); }
  }
  document.querySelector("#review-signout").addEventListener("click", async () => { await P.db.auth.signOut(); location.replace("/guias/login/"); });
  try {
    const session = await P.requireSession(); if (!session) return;
    await verifyAdmin(); loading.classList.add("hidden"); area.classList.remove("hidden");
    refresh.addEventListener("click", load);
    filter.addEventListener("change", () => { page = 0; load(); });
    previous.addEventListener("click", () => { if (page > 0) { page--; load(); } });
    next.addEventListener("click", () => { page++; load(); });
    P.db.auth.onAuthStateChange((event, current) => { if (!current || current.user.id !== session.user.id) location.reload(); });
    await load();
  } catch (error) { loading.classList.add("hidden"); document.querySelector("#review-denied").classList.remove("hidden"); message.textContent = error.message; }
})();
