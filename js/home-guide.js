(async function () {
  "use strict";
  const P = window.PantanalGuides;
  const root = document.getElementById("random-guides");
  // Preserve legacy profile links that used /?guia=...#expedicao.
  const fromProfile = new URLSearchParams(location.search).get("guia");
  if (fromProfile) document.querySelectorAll('a[href*="explorer.html"]').forEach(link => {
    const url = new URL(link.href);
    url.searchParams.set("guia", fromProfile);
    link.href = url.href;
  });
  if (!root || !P?.db) return;
  try {
    const all = [];
    for (let start = 0; ; start += 100) {
      const { data, error } = await P.db.from("public_guide_profiles")
        .select("id,slug,nome,nome_profissional,foto_perfil,regioes,idiomas,whatsapp,vip,cadastur_verificado")
        .eq("vip", false).eq("cadastur_verificado", true).order("id", { ascending: true }).range(start, start + 99);
      if (error) throw error;
      all.push(...(data || []));
      if (!data || data.length < 100) break;
    }
    const guides = all.filter(guide => guide.vip === false && guide.cadastur_verificado === true);
    for (let i = guides.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [guides[i], guides[j]] = [guides[j], guides[i]];
    }
    root.innerHTML = guides.slice(0, 3).map(guide => {
      const name = P.displayName(guide);
      const photo = P.safeUrl(guide.foto_perfil);
      const regions = P.asArray(guide.regioes).slice(0, 2).join(" · ");
      const languages = P.asArray(guide.idiomas).slice(0, 3).join(" · ");
      const phone = P.normalizePhone(guide.whatsapp);
      const quote = encodeURIComponent(`Olá, ${name}! Encontrei seu perfil no Bento Pantanal e gostaria de cotar um passeio.`);
      return `<article class="home-guide-card"><div class="home-guide-photo" data-initials="${P.escapeHTML(P.initials(name))}">${photo ? `<img src="${P.escapeHTML(photo)}" alt="Foto de ${P.escapeHTML(name)}" loading="lazy">` : P.escapeHTML(P.initials(name))}</div><span>✓ Guia verificado</span><h3>${P.escapeHTML(name)}</h3>${regions ? `<p>${P.escapeHTML(regions)}</p>` : ""}${languages ? `<p>${P.escapeHTML(languages)}</p>` : ""}<div class="home-guide-links"><a href="${P.escapeHTML(P.guidePath(guide.slug))}">Ver perfil</a>${phone ? `<a href="https://wa.me/${phone}?text=${quote}" target="_blank" rel="noopener">Cotar passeio</a>` : ""}</div></article>`;
    }).join("");
    root.querySelectorAll("img").forEach(img => img.addEventListener("error", () => {
      const avatar = img.parentElement;
      avatar.textContent = avatar.dataset.initials;
    }, { once: true }));
    root.hidden = !guides.length;
  } catch (_) {
    root.hidden = true;
  }
})();
