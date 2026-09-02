(function () {
  "use strict";

  const menu =
    document.querySelector("#nav-menu");

  const toggle =
    document.querySelector("#menu-toggle");

  const panel =
    document.querySelector("#menu-panel");

  if (!menu || !toggle || !panel) {
    return;
  }

  function setMenu(open) {
    menu.classList.toggle("is-open", open);

    toggle.setAttribute(
      "aria-expanded",
      String(open)
    );

    toggle.setAttribute(
      "aria-label",
      open ? "Fechar menu" : "Abrir menu"
    );
  }

  toggle.addEventListener("click", () => {
    const isOpen =
      menu.classList.contains("is-open");

    setMenu(!isOpen);
  });

  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setMenu(false);
    }
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target)) {
      setMenu(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenu(false);
      toggle.focus();
    }
  });
})();
