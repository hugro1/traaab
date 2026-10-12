// O token fica apenas na memória desta página e é enviado ao servidor por HTTPS.
let idTokenGoogle = null;
let svgAtual = null;

window.aoEntrarComGoogle = function (resposta) {
  idTokenGoogle = resposta && resposta.credential ? resposta.credential : null;
  const estado = document.getElementById("estado-login");
  const gerar = document.getElementById("gerar");
  if (idTokenGoogle) {
    estado.textContent = "Login Google recebido. Você já pode gerar o desenho.";
    gerar.disabled = false;
    document.getElementById("mensagem").textContent = "";
  } else {
    estado.textContent = "Não foi possível concluir o login Google.";
    gerar.disabled = true;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formulario");
  const mensagem = document.getElementById("mensagem");
  const figura = document.getElementById("desenho");
  const baixar = document.getElementById("baixar");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensagem.textContent = "";
    figura.replaceChildren();
    baixar.hidden = true;
    svgAtual = null;

    if (!idTokenGoogle) {
      mensagem.textContent = "Erro 401: entre com sua conta Google antes de gerar o desenho.";
      return;
    }

    const valor = document.getElementById("numero").value;
    const numero = Number(valor);
    if (valor.trim() === "" || !Number.isInteger(numero) || numero < 1 || numero > 100) {
      mensagem.textContent = "Erro 400: informe um número inteiro entre 1 e 100.";
      return;
    }

    const botao = document.getElementById("gerar");
    botao.disabled = true;
    botao.textContent = "Gerando…";

    try {
      const resposta = await fetch("/api/desenho", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idTokenGoogle}`
        },
        body: JSON.stringify({ numero })
      });

      if (!resposta.ok) {
        const detalhe = (await resposta.text()).trim();
        if (resposta.status === 400) {
          mensagem.textContent = `Erro 400: ${detalhe || "número ou corpo inválido."}`;
        } else if (resposta.status === 401) {
          mensagem.textContent = `Erro 401: ${detalhe || "faça login com uma conta Google válida."}`;
        } else {
          mensagem.textContent = `Erro ${resposta.status}: ${detalhe || "não foi possível gerar o desenho."}`;
        }
        return;
      }

      svgAtual = await resposta.text();
      const imagem = document.createElement("img");
      imagem.alt = `Desenho assinado para o número ${numero}`;
      imagem.src = URL.createObjectURL(new Blob([svgAtual], { type: "image/svg+xml" }));
      figura.appendChild(imagem);
      baixar.hidden = false;
    } catch {
      mensagem.textContent = "Não foi possível contactar o servidor. Tente novamente.";
    } finally {
      botao.disabled = !idTokenGoogle;
      botao.textContent = "Gerar desenho";
    }
  });

  baixar.addEventListener("click", () => {
    if (!svgAtual) return;
    const arquivo = new Blob([svgAtual], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = "exemplo.svg";
    link.click();
    URL.revokeObjectURL(url);
  });
});
