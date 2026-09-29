/**
 * Classificação de números de 5 dígitos: RG/identidade funcional x legislação/ato normativo.
 * Módulo puro, sem dependências de DOM ou de APIs do Chrome.
 */

const JANELA_CONTEXTO = 80;

/** Grupos numéricos isolados por separadores, com pontuação interna (ex.: 89.388). */
const RE_NUMERO =
  /(^|[\s,;:(["'{\u2013\u2014])([0-9][0-9.\-]*[0-9])(?=[\s,;:.\!?)"'\]}\u2013\u2014\/\-]|$)/g;

/** Termos que introduzem legislação/ato normativo. Fonte única das duas regex abaixo. */
const TERMOS_LEGISLACAO = String.raw`lei(?:s)?|lc|l\.c\.|dl|d\.l\.|decreto(?:s)?|dec|portaria(?:s)?|port|resolu[cç][aã]o(?:es)?|res|instru[cç][aã]o\s+normativa(?:s)?|in|instru[cç][aã]o\s+de\s+servi[cç]o|is|ordem\s+de\s+servi[cç]o|os|medida\s+provis[oó]ria(?:s)?|mp|emenda\s+constitucional|ec|delibera[cç][aã]o(?:es)?|delib|ato(?:\s+normativo|\s+regulamentar)?|provimento(?:s)?|circular(?:s)?|regulamento(?:s)?|estatuto(?:s)?|c[oó]digo|artigo(?:s)?|art(?:s)?|par[aá]grafo(?:s)?|§+|inciso(?:s)?|al[ií]nea(?:s)?|item|itens|processo(?:s)?|proc|sei|protocolo(?:s)?|of[ií]cio(?:s)?|of|despacho(?:s)?|parecer(?:es)?|ac[oó]rd[aã]o(?:s)?|edital(?:is)?|nota\s+t[eé]cnica|boletim(?:\s+geral|\s+interno)?|bg|bi|bcg|di[aá]rio\s+oficial|doe|dou|certid[aã]o|requerimento|memorando|memo`;

/** Qualquer menção a um termo normativo, em qualquer posição. */
const RE_TERMO_NORMATIVO = new RegExp(String.raw`\b(?:${TERMOS_LEGISLACAO})\b`, 'i');

/** Termo normativo imediatamente antes do número, com qualificadores e numeração opcionais. */
const RE_TERMO_IMEDIATO = new RegExp(
  String.raw`\b(?:${TERMOS_LEGISLACAO})\b(?:\s+(?:estadual|estaduais|federal|federais|municipal|municipais|complementar|complementares|delegada|delegadas|ordin[aá]ria|ordin[aá]rias|org[aâ]nica|org[aâ]nicas|interministerial|conjunta|normativ[ao]|regulamentar|administrativo))*(?:[\s,]+e)?\s*(?:n[º°\.]+|n\.º|num(?:ero|\.º?)?|nr\.?)?\s*$`,
  'i'
);

/** Listas de normas: "Leis 10.460 e 20.756", "arts. 10.460, 20.756". */
const RE_TERMO_LISTA = /\b(?:lei(?:s)?|decreto(?:s)?|dec|portaria(?:s)?|resolu[cç][aã]o(?:es)?|art(?:igo)?(?:s)?)\b[^.\n;]{0,60}\b(?:e|ou|,)\s*(?:n[º°\.]+|n\.º|num(?:ero|\.º?)?|nr\.?)?\s*$/i;

const RE_NUMERACAO = /\b(?:n[º°\.]+|n\.º|num(?:ero|\.º?)?|nr\.?)\s*$/i;

const RE_IDENTIDADE = /\b(?:rg|r\.g\.|re|r\.e\.|matr[ií]cula|matr?\.?|identidade)\s*$/i;

/** Posto/graduação militar, delimitando a referência pessoal. */
const RE_POSTO_PRE = /\b(?:o\(a\)|o|a|do|da|ao|[aà])?\s*(?:capit[aã]o|cap|major|maj|ten(?:ente)?|1[º°]\s*ten(?:ente)?|2[º°]\s*ten(?:ente)?|coronel|cel|ten(?:ente)?[\s\-]+cel(?:onel)?|sargento|sgt|1[º°]\s*sgt|2[º°]\s*sgt|3[º°]\s*sgt|1[º°]\s*sargento|2[º°]\s*sargento|3[º°]\s*sargento|subten(?:ente)?|sub\s*ten|cabo|cb|soldado|sd|aluno(?:\s+sd|\s+soldado|\s+oficial)?|cadete|cad|aspirante|asp)(?:\s+(?:pm|bm|pmgo|bmgo))?\s*$/i;

/** Prefixos de identificação explícita: "RG 12345", "RE nº 12345". */
const RE_ID_PRE = /\b(?:rg|r\.g\.|re|r\.e\.|matr[ií]cula|matr?\.?|identidade)\s*(?:n[º°\.]+|n\.º|num(?:ero|\.º?)?|nr\.?|:)?\s*$/i;

const RE_POSTO_POS = /^\s*[\-\u2013\/]?\s*(?:capit[aã]o|cap|major|maj|ten(?:ente)?|coronel|cel|sargento|sgt|subten(?:ente)?|cabo|cb|soldado|sd|aluno|cadete|aspirante|asp)?(?:\s+(?:pm|bm|pmgo|bmgo))\b/i;

const RE_NOME_PROPRIO = /^\s*[\-\u2013]?\s*([A-Za-zÀ-ÖØ-öø-ÿ]+)/;

const RE_STOPWORDS =
  /^(?:de|da|do|dos|das|em|para|por|com|que|e|ou|a|o|os|as|no|na|nos|nas|pelo|pela|pelos|pelas|janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|lei|leis|decreto|decretos|portaria|portarias|artigo|art|resolu[cç][aã]o|processo|edital|of[ií]cio|boletim|di[aá]rio)$/i;

/** Sufixos que denunciam número normativo (ano, data da norma, cláusula relativa). */
const RE_SUFIXO_ANOS = /^\s*\/\s*(?:19|20)?\d{2}\b/;

const RE_SUFIXO_DATA =
  /^\s*,?\s*(?:de\s+)?\d{1,2}\s+de\s+[a-zA-ZÀ-ÿ]+\s+de\s+\d{4}\b|^\s*,?\s*(?:de\s+)?\d{1,2}\s+de\s+[a-zA-ZÀ-ÿ]+\b|^\s*,?\s*de\s+(?:19|20)\d{2}\b|^\s*,?\s*de\s+\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4}\b/i;

const RE_SUFIXO_CLAUSULA =
  /^\s*,?\s*que\s+(?:disp[oõ]e|institui|altera|regulamenta|estabelece|cria|disciplina|fixa|trata|reorganiza|concede)\b|^\s*,?\s*(?:combinad[oa]\s+com|c\/c)\b/i;

/**
 * Localiza todos os grupos numéricos com 5 dígitos, já classificados
 * como legislação (norma) ou RG (identidade).
 *
 * @param {string} texto
 * @returns {Array<{digitos: string, legislacao: boolean, rg: boolean}>}
 */
export function classificarNumeros(texto) {
  const numeros = [];

  for (const match of texto.matchAll(RE_NUMERO)) {
    const [full, prefixo, grupo] = match;
    const digitos = grupo.replace(/\D/g, '');
    if (digitos.length !== 5) continue;

    const inicio = match.index + prefixo.length;
    const fim = inicio + grupo.length;
    const preContexto = texto.slice(Math.max(0, inicio - JANELA_CONTEXTO), inicio);
    const postContexto = texto.slice(fim, Math.min(texto.length, fim + JANELA_CONTEXTO));

    numeros.push({
      indice: match.index,
      prefixo,
      grupo,
      digitos,
      legislacao: isLegislationNumber(preContexto, postContexto),
      rg: isRGNumber(preContexto, postContexto),
    });
  }

  return numeros;
}

/**
 * Indica se o número se refere a um ato normativo (lei, decreto, portaria, artigo etc.).
 *
 * @param {string} preContexto
 * @param {string} postContexto
 * @returns {boolean}
 */
export function isLegislationNumber(preContexto, postContexto) {
  if (RE_TERMO_IMEDIATO.test(preContexto)) return true;
  if (RE_TERMO_LISTA.test(preContexto)) return true;

  // "Nº 10460": numeração só indica norma se o termo de referência não for identidade.
  if (RE_NUMERACAO.test(preContexto)) {
    const preSemNumeracao = preContexto.replace(RE_NUMERACAO, '');
    if (!RE_IDENTIDADE.test(preSemNumeracao) && RE_TERMO_NORMATIVO.test(preSemNumeracao)) {
      return true;
    }
  }

  if (RE_SUFIXO_ANOS.test(postContexto)) return true;
  if (RE_SUFIXO_DATA.test(postContexto)) return true;
  if (RE_SUFIXO_CLAUSULA.test(postContexto)) return true;

  return false;
}

/**
 * Indica se o número se refere a um RG militar ou identidade funcional.
 *
 * @param {string} preContexto
 * @param {string} postContexto
 * @returns {boolean}
 */
export function isRGNumber(preContexto, postContexto) {
  if (RE_POSTO_PRE.test(preContexto)) return true;
  if (RE_ID_PRE.test(preContexto)) return true;
  if (RE_POSTO_POS.test(postContexto)) return true;

  const nome = postContexto.match(RE_NOME_PROPRIO);
  if (nome) {
    const palavra = nome[1];
    if (!RE_STOPWORDS.test(palavra) && /^[A-ZÀ-Þ]/.test(palavra)) return true;
  }

  return false;
}

/**
 * Mascara o 1º e o último dígito de RGs confirmados, preservando números de legislação.
 *
 * @param {string} texto
 * @returns {string}
 */
export function suprimirRGs(texto) {
  const numeros = classificarNumeros(texto).filter((n) => n.rg && !n.legislacao);
  if (numeros.length === 0) return texto;

  let saida = '';
  let cursor = 0;

  for (const { indice, prefixo, grupo } of numeros) {
    const mascarado = grupo.replace(/^\d/, '*').replace(/\d$/, '*');
    saida += texto.slice(cursor, indice) + prefixo + mascarado;
    cursor = indice + prefixo.length + grupo.length;
  }

  return saida + texto.slice(cursor);
}

/**
 * Extrai os RGs legítimos de 5 dígitos, ignorando números de legislação,
 * no formato "12345, 67890".
 *
 * @param {string} texto
 * @returns {string}
 */
export function filtrarRGs(texto) {
  return classificarNumeros(texto)
    .filter((n) => !n.legislacao)
    .map((n) => n.digitos)
    .join(', ');
}
