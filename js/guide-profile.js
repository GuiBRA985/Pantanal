(async function () {
  "use strict";

  const P = window.PantanalGuides;
  const slug = P.currentGuideSlug();

  const loading =
    document.querySelector("#profile-loading");

  const errorBox =
    document.querySelector("#profile-error");

  const view =
    document.querySelector("#profile-view");

  function addImage(container, src, alt) {
    const url = P.safeUrl(src);

    if (!url) {
      return false;
    }

    const image = document.createElement("img");

    image.src = url;
    image.alt = alt;

    container.append(image);

    return true;
  }

  function socialUrl(value, base) {
    if (!value) {
      return "";
    }

    const text = String(value).trim();

    if (/^https?:\/\//i.test(text)) {
      return P.safeUrl(text);
    }

    const handle = text
      .replace(/^@/, "")
      .replace(
        /^(?:www\.)?instagram\.com\//i,
        ""
      )
      .replace(/\/$/, "");

    return handle
      ? `${base}${encodeURIComponent(handle)}`
      : "";
  }

  function updateMeta(guide, name) {
    const canonical =
      `${location.origin}${P.guidePath(guide.slug)}`;

    document.title =
      `${name} | Guia verificado no Pantanal`;

    document
      .querySelector("#canonical-link")
      ?.setAttribute("href", canonical);

    const description = (
      guide.bio ||
      `${name}, guia de turismo verificado no Pantanal.`
    ).slice(0, 180);

    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);

    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute(
        "content",
        `${name} | Bento Pantanal`
      );

    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", description);

    const image = P.safeUrl(
      guide.foto_capa || guide.foto_perfil
    );

    if (image) {
      document
        .querySelector('meta[property="og:image"]')
        ?.setAttribute("content", image);
    }
  }

  if (!slug) {
    loading.classList.add("hidden");
    errorBox.classList.remove("hidden");
    return;
  }

  try {
    const { data: guide, error } = await P.db
      .from("public_guide_profiles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !guide) {
      throw error || new Error("Perfil não encontrado");
    }

    const name = P.displayName(guide);

    updateMeta(guide, name);

    document.querySelector(
      "#profile-name"
    ).textContent = name;

    document.querySelector(
      "#profile-regions"
    ).textContent =
      P.asArray(guide.regioes).join(" · ") ||
      "Pantanal Mato-Grossense";

    if (guide.vip && guide.bio) {
      document.querySelector(
        "#profile-bio"
      ).textContent = guide.bio;

      document
        .querySelector("#profile-about")
        .classList.remove("hidden");
    }

    const profileBadge =
      document.querySelector("#profile-badge");

    if (guide.vip) {
      profileBadge.textContent = "★ Guia VIP";
      profileBadge.classList.add("vip-badge");
    }

    const avatar =
      document.querySelector("#profile-avatar");

    if (
      !addImage(
        avatar,
        guide.foto_perfil,
        `Foto de ${name}`
      )
    ) {
      avatar.textContent = P.initials(name);
    }

    addImage(
      document.querySelector("#profile-cover"),
      guide.foto_capa,
      `Paisagem de capa de ${name}`
    );

    const phone =
      P.normalizePhone(guide.whatsapp);

    const whatsapp = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(
          `Olá, ${name}! Encontrei seu perfil na Rede de Guias Bento Pantanal.`
        )}`
      : "";

    const whatsappButton =
      document.querySelector(
        "#profile-whatsapp-top"
      );

    if (whatsapp) {
      whatsappButton.href = whatsapp;
    } else {
      whatsappButton.classList.add("hidden");
    }

    const instagram = socialUrl(
      guide.instagram,
      "https://instagram.com/"
    );

    const instagramButton =
      document.querySelector(
        "#profile-instagram-top"
      );

    if (instagram) {
      instagramButton.href = instagram;
    } else {
      instagramButton.classList.add("hidden");
    }

    if (guide.vip) {
      const vipActions =
        document.querySelector(
          "#profile-vip-actions"
        );

      const personalDomain =
        document.querySelector(
          "#profile-personal-domain"
        );

      const domain = P.safeUrl(
        guide.personal_domain || guide.site
      );

      if (domain) {
        personalDomain.href = domain;
      } else {
        personalDomain.classList.add("hidden");
      }

      const expedition =
        document.querySelector(
          "#profile-expedition"
        );

      expedition.href =
        `/?guia=${encodeURIComponent(
          guide.slug
        )}#expedicao`;

      expedition.classList.toggle(
        "hidden",
        !guide.expedition_leader
      );

      vipActions.classList.remove("hidden");
    }

    document
      .querySelector("#share-profile")
      .addEventListener("click", async () => {
        const share = {
          title: `${name} | Bento Pantanal`,

          text:
            `Conheça o perfil profissional de ${name}.`,

          url:
            `${location.origin}${P.guidePath(
              guide.slug
            )}`
        };

        try {
          if (navigator.share) {
            await navigator.share(share);
          } else {
            await navigator.clipboard.writeText(
              share.url
            );

            document.querySelector(
              "#share-profile"
            ).textContent = "Link copiado ✓";
          }
        } catch (shareError) {
          if (shareError.name !== "AbortError") {
            console.error(shareError);
          }
        }
      });

    loading.classList.add("hidden");
    view.classList.remove("hidden");
  } catch (profileError) {
    console.error(profileError);

    loading.classList.add("hidden");
    errorBox.classList.remove("hidden");
  }
})();
