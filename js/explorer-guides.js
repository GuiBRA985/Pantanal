(function () {
  "use strict";
  const P = window.PantanalGuides;
  const dialog = document.getElementById("guide-dialog");
  const status = document.getElementById("guide-status");
  const options = document.getElementById("vip-guide-options");
  const confirm = document.getElementById("confirm-guide");
  const retry = document.getElementById("retry-guides");
  const storageKey = "pantanal.explorer.guia";
  let guides = [];
  let selected = "";
  let loading;
  let returnFocus;
  let afterChoice;

  function storedSlug() {
    try { return sessionStorage.getItem(storageKey) || ""; } catch (_) { return ""; }
  }
  const params = new URLSearchParams(location.search);
  let desiredSlug = params.has("guia") ? params.get("guia") : storedSlug();
  function eligible(guide) {
    return guide.vip === true && guide.expedition_leader === true && guide.cadastur_verificado === true;
  }
  function getSelected() {
    return guides.find(guide => guide.slug === selected && eligible(guide)) || null;
  }
  function publishChoice() {
    const guide = getSelected();
    try {
      if (guide) sessionStorage.setItem(storageKey, guide.slug);
      else sessionStorage.removeItem(storageKey);
    } catch (_) { /* Preferences are optional; URL selection still works. */ }
    confirm.disabled = !guide;
    const name = guide ? P.displayName(guide) : "";
    document.getElementById("selected-guide-label").textContent = guide ? `Guia escolhido: ${name}` : "Escolha o guia da expedição";
    document.getElementById("catalog-guide-summary").textContent = guide
      ? `${name} foi escolhido. Você pode trocar de guia antes de preparar o pedido.`
      : "Escolha um dos guias VIP do site para qualquer uma das três expedições.";
    const url = new URL(location.href);
    if (guide) url.searchParams.set("guia", guide.slug);
    else url.searchParams.delete("guia");
    history.replaceState(null, "", url);
    window.dispatchEvent(new CustomEvent("explorer:guidechange", { detail: guide }));
  }
  function choose(slug) {
    const guide = guides.find(item => item.slug === slug && eligible(item));
    selected = guide ? guide.slug : "";
    desiredSlug = selected;
    options.querySelectorAll('input[name="vip-guide"]').forEach(input => { input.checked = input.value === selected; });
    publishChoice();
    if (guide) status.textContent = `${P.displayName(guide)} selecionado.`;
    return guide || null;
  }
  function render() {
    options.replaceChildren();
    guides.forEach((guide, index) => {
      const name = P.displayName(guide);
      const card = document.createElement("article");
      card.className = "vip-guide-card";
      const photo = P.safeUrl(guide.foto_perfil);
      const languages = P.asArray(guide.idiomas).join(" · ");
      card.innerHTML = `
        <label for="vip-guide-${index}" class="vip-choice">
          <input type="radio" name="vip-guide" id="vip-guide-${index}" value="${P.escapeHTML(guide.slug)}">
          <span class="vip-avatar">${photo ? `<img src="${P.escapeHTML(photo)}" alt="Foto de ${P.escapeHTML(name)}">` : P.escapeHTML(P.initials(name))}</span>
          <span class="vip-description"><span class="vip-badge">★ Guia VIP</span><strong>${P.escapeHTML(name)}</strong>${languages ? `<span>${P.escapeHTML(languages)}</span>` : ""}</span>
        </label>
        <a class="vip-profile-link" target="_blank" rel="noopener" href="${P.escapeHTML(P.guidePath(guide.slug))}">Ver perfil de ${P.escapeHTML(name)}</a>`;
      card.querySelector("input").addEventListener("change", () => choose(guide.slug));
      card.querySelector("img")?.addEventListener("error", event => {
        event.target.parentElement.textContent = P.initials(name);
      }, { once: true });
      options.append(card);
    });
  }
  async function fetchGuides() {
    if (!P?.db) throw new Error("Cadastro indisponível");
    const all = [];
    for (let start = 0; ; start += 100) {
      const { data, error } = await P.db.from("public_guide_profiles")
        .select("id,slug,nome,nome_profissional,foto_perfil,idiomas,vip,vip_position,expedition_leader,cadastur_verificado")
        .eq("vip", true).eq("expedition_leader", true).eq("cadastur_verificado", true)
        .order("id", { ascending: true }).range(start, start + 99);
      if (error) throw error;
      all.push(...(data || []));
      if (!data || data.length < 100) break;
    }
    return all.filter(eligible).sort((a, b) => (a.vip_position ?? 999) - (b.vip_position ?? 999) || P.displayName(a).localeCompare(P.displayName(b), "pt-BR"));
  }
  function load() {
    if (loading) return loading;
    status.textContent = "Carregando guias VIP...";
    retry.hidden = true;
    confirm.disabled = true;
    options.setAttribute("aria-busy", "true");
    loading = (async () => {
      try {
        guides = await fetchGuides();
        const requested = desiredSlug;
        render();
        const guide = choose(requested);
        if (!guides.length) status.textContent = "Nenhum guia VIP está habilitado para liderar no momento. Tente novamente mais tarde.";
        else if (requested && !guide) status.textContent = "O guia anterior não está habilitado para liderar. Escolha um dos VIPs disponíveis abaixo.";
        else if (!guide) status.textContent = "Selecione um guia para continuar.";
        return true;
      } catch (error) {
        guides = [];
        selected = "";
        options.replaceChildren();
        publishChoice();
        status.textContent = "Não foi possível consultar os guias agora. Tente novamente para escolher um guia.";
        retry.hidden = false;
        return false;
      } finally {
        options.removeAttribute("aria-busy");
        loading = null;
      }
    })();
    return loading;
  }
  function openPicker(callback) {
    afterChoice = typeof callback === "function" ? callback : null;
    returnFocus = document.activeElement;
    if (!dialog.open) dialog.showModal();
    if (!guides.length && !loading && retry.hidden) load();
  }
  confirm.addEventListener("click", () => {
    if (!getSelected()) return;
    const callback = afterChoice;
    afterChoice = null;
    dialog.close();
    if (callback) callback();
  });
  dialog.addEventListener("close", () => { afterChoice = null; returnFocus?.focus(); });
  retry.addEventListener("click", load);
  document.querySelectorAll("[data-open-guides]").forEach(button => button.addEventListener("click", () => openPicker()));
  document.querySelectorAll("[data-close-dialog]").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
  window.ExplorerGuides = Object.freeze({ load, openPicker, getSelected, choose });
  load();
})();
