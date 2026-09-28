async function carregarSessao() {
  const status = document.getElementById("status");

  try {
    const response = await fetch("/api/me", {
      cache: "no-store"
    });

    if (response.status === 401) {
      status.textContent = "Você não está autenticado.";
      return;
    }

    if (!response.ok) {
      status.textContent = "Não foi possível consultar a sessão.";
      return;
    }

    const user = await response.json();

    status.textContent =
      `Autenticado como ${user.displayName || user.email || user.subject}.`;
  } catch {
    status.textContent =
      "Não foi possível consultar a sessão.";
  }
}

carregarSessao();
