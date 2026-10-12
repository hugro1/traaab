// Função pura para gerar a tabuada modular no círculo.
// Mantém as dimensões, cores, coordenadas e textos do desenho original.
const LARGURA = 800;
const ALTURA = 880;
const CENTRO_X = 400;
const CENTRO_Y = 400;
const RAIO = 360;
const PONTOS = 240;

export function escaparXml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function numeroValido(valor) {
  return Number.isInteger(valor) && valor >= 1 && valor <= 100;
}

function ponto(i) {
  const angulo = (2 * Math.PI * i) / PONTOS - Math.PI / 2;
  return {
    x: (CENTRO_X + RAIO * Math.cos(angulo)).toFixed(2),
    y: (CENTRO_Y + RAIO * Math.sin(angulo)).toFixed(2),
  };
}

export function gerarDesenho(numero, email) {
  if (!numeroValido(numero)) {
    throw new RangeError("O numero deve ser um inteiro entre 1 e 100.");
  }

  const k = numero + 1;
  const linhas = [];

  for (let i = 0; i < PONTOS; i++) {
    const j = (k * i) % PONTOS;
    if (i === j) continue;
    const a = ponto(i);
    const b = ponto(j);
    const matiz = Math.round((360 * i) / PONTOS);
    linhas.push(
      `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="hsl(${matiz} 85% 62%)"/>`
    );
  }

  const assinatura = escaparXml(email);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARGURA} ${ALTURA}" width="${LARGURA}" height="${ALTURA}" data-numero="${numero}">`,
    `<rect width="${LARGURA}" height="${ALTURA}" fill="#0d1117"/>`,
    `<circle cx="${CENTRO_X}" cy="${CENTRO_Y}" r="${RAIO}" fill="none" stroke="#30363d" stroke-width="1"/>`,
    `<g stroke-width="0.8" stroke-opacity="0.75" stroke-linecap="round">`,
    ...linhas,
    `</g>`,
    `<text x="${CENTRO_X}" y="820" fill="#e6edf3" font-family="Georgia, serif" font-size="26" text-anchor="middle">n = ${numero}</text>`,
    `<text x="${CENTRO_X}" y="855" fill="#8b949e" font-family="Georgia, serif" font-size="18" font-style="italic" text-anchor="middle">assinado por ${assinatura}</text>`,
    `</svg>`,
  ].join("\n");
}
