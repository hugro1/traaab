import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

function respostaErro(status, mensagem) {
  return new Response(mensagem, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequest(context) {
  const request = context.request;

  // A ordem de validação deve seguir o contrato da atividade.
  if (request.method !== "POST") {
    return respostaErro(405, "Método não permitido. Use POST.");
  }

  let dados;
  try {
    const texto = await request.text();
    if (!texto.trim()) return respostaErro(400, "Corpo da requisição ausente.");
    dados = JSON.parse(texto);
  } catch {
    return respostaErro(400, "JSON inválido.");
  }

  if (
    !dados ||
    !Object.prototype.hasOwnProperty.call(dados, "numero") ||
    !numeroValido(dados.numero)
  ) {
    return respostaErro(400, "O número deve ser um inteiro entre 1 e 100.");
  }

  const autorizacao = request.headers.get("Authorization") || "";
  const correspondencia = autorizacao.match(/^Bearer\s+(.+)$/i);
  if (!correspondencia) {
    return respostaErro(401, "Token Google ausente ou inválido. Faça login novamente.");
  }

  const token = correspondencia[1];
  let verificacao;
  try {
    const url = new URL("https://oauth2.googleapis.com/tokeninfo");
    url.searchParams.set("id_token", token);
    verificacao = await fetch(url.toString(), { method: "GET" });
  } catch {
    return respostaErro(401, "Não foi possível validar o token Google.");
  }

  if (!verificacao.ok) {
    return respostaErro(401, "Token Google inválido ou expirado.");
  }

  let identidade;
  try {
    identidade = await verificacao.json();
  } catch {
    return respostaErro(401, "Resposta de autenticação inválida.");
  }

  if (
    !context.env.GOOGLE_CLIENT_ID ||
    identidade.aud !== context.env.GOOGLE_CLIENT_ID ||
    identidade.email_verified !== "true" ||
    typeof identidade.email !== "string" ||
    !identidade.email
  ) {
    return respostaErro(401, "Token não autorizado ou e-mail Google não verificado.");
  }

  const svg = gerarDesenho(dados.numero, identidade.email);
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
