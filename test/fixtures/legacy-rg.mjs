// Reimplementação ORIGINAL (extraída do popup.js pré-refatoração) para comparação de equivalência.
export function isLegislationNumber(preContext, postContext) {
  const regexPreTermos = /\b(?:lei(?:s)?|lc|l\.c\.|dl|d\.l\.|decreto(?:s)?|dec|portaria(?:s)?|port|resolu[cç][aã]o(?:es)?|res|instru[cç][aã]o\s+normativa(?:s)?|in|instru[cç][aã]o\s+de\s+servi[cç]o|is|ordem\s+de\s+servi[cç]o|os|medida\s+provis[oó]ria(?:s)?|mp|emenda\s+constitucional|ec|delibera[cç][aã]o(?:es)?|delib|ato(?:\s+normativo|\s+regulamentar)?|provimento(?:s)?|circular(?:es)?|regulamento(?:s)?|estatuto(?:s)?|c[oó]digo|artigo(?:s)?|art(?:s)?|par[aá]grafo(?:s)?|§+|inciso(?:s)?|al[ií]nea(?:s)?|item|itens|processo(?:s)?|proc|sei|protocolo(?:s)?|of[ií]cio(?:s)?|of|despacho(?:s)?|parecer(?:es)?|ac[oó]rd[aã]o(?:s)?|edital(?:is)?|nota\s+t[eé]cnica|boletim(?:\s+geral|\s+interno)?|bg|bi|bcg|di[aá]rio\s+oficial|doe|dou|certid[aã]o|requerimento|memorando|memo)\b/i;

  const regexPreCompleto = /\b(?:lei(?:s)?|lc|l\.c\.|dl|d\.l\.|decreto(?:s)?|dec|portaria(?:s)?|port|resolu[cç][aã]o(?:es)?|res|instru[cç][aã]o\s+normativa(?:s)?|in|instru[cç][aã]o\s+de\s+servi[cç]o|is|ordem\s+de\s+servi[cç]o|os|medida\s+provis[oó]ria(?:s)?|mp|emenda\s+constitucional|ec|delibera[cç][aã]o(?:es)?|delib|ato(?:\s+normativo|\s+regulamentar)?|provimento(?:s)?|circular(?:es)?|regulamento(?:s)?|estatuto(?:s)?|c[oó]digo|artigo(?:s)?|art(?:s)?|par[aá]grafo(?:s)?|§+|inciso(?:s)?|al[ií]nea(?:s)?|item|itens|processo(?:s)?|proc|sei|protocolo(?:s)?|of[ií]cio(?:s)?|of|despacho(?:s)?|parecer(?:es)?|ac[oó]rd[aã]o(?:s)?|edital(?:is)?|nota\s+t[eé]cnica|boletim(?:\s+geral|\s+interno)?|bg|bi|bcg|di[aá]rio\s+oficial|doe|dou|certid[aã]o|requerimento|memorando|memo)\b(?:\s+(?:estadual|estaduais|federal|federais|municipal|municipais|complementar|complementares|delegada|delegadas|ordin[aá]ria|ordin[aá]rias|org[aâ]nica|org[aâ]nicas|interministerial|conjunta|normativ[ao]|regulamentar|administrativo))*(?:[\s,]+e)?\s*(?:n[º°\.]+|n\.º|num(?:ero|\.º?)?|nr\.?)?\s*$/i;

  if (regexPreCompleto.test(preContext)) {
    return true;
  }

  const regexPreLista = /\b(?:lei(?:s)?|decreto(?:s)?|dec|portaria(?:s)?|resolu[cç][aã]o(?:es)?|art(?:igo)?(?:s)?)\b[^.\n;]{0,60}\b(?:e|ou|,)\s*(?:n[º°\.]+|n\.º|num(?:ero|\.º?)?|nr\.?)?\s*$/i;
  if (regexPreLista.test(preContext)) {
    return true;
  }

  if (/\b(?:n[º°\.]+|n\.º|num(?:ero|\.º?)?|nr\.?)\s*$/i.test(preContext)) {
    const preSemNumero = preContext.replace(/\b(?:n[º°\.]+|n\.º|num(?:ero|\.º?)?|nr\.?)\s*$/i, '');
    if (!/\b(?:rg|r\.g\.|re|r\.e\.|matr[ií]cula|matr?\.?|identidade)\s*$/i.test(preSemNumero)) {
      if (regexPreTermos.test(preSemNumero)) {
        return true;
      }
    }
  }

  if (/^\s*\/\s*(?:19|20)?\d{2}\b/.test(postContext)) {
    return true;
  }

  if (/^\s*,?\s*(?:de\s+)?\d{1,2}\s+de\s+[a-zA-ZÀ-ÿ]+\s+de\s+\d{4}\b/i.test(postContext) ||
      /^\s*,?\s*(?:de\s+)?\d{1,2}\s+de\s+[a-zA-ZÀ-ÿ]+\b/i.test(postContext) ||
      /^\s*,?\s*de\s+(?:19|20)\d{2}\b/i.test(postContext) ||
      /^\s*,?\s*de\s+\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4}\b/i.test(postContext)) {
    return true;
  }

  if (/^\s*,?\s*que\s+(?:disp[oõ]e|institui|altera|regulamenta|estabelece|cria|disciplina|fixa|trata|reorganiza|concede)\b/i.test(postContext) ||
      /^\s*,?\s*(?:combinad[oa]\s+com|c\/c)\b/i.test(postContext)) {
    return true;
  }

  return false;
}

export function isRGNumber(preContext, postContext) {
  const regexRankPre = /\b(?:o\(a\)|o|a|do|da|ao|[aà])?\s*(?:capit[aã]o|cap|major|maj|ten(?:ente)?|1[º°]\s*ten(?:ente)?|2[º°]\s*ten(?:ente)?|coronel|cel|ten(?:ente)?[\s\-]+cel(?:onel)?|sargento|sgt|1[º°]\s*sgt|2[º°]\s*sgt|3[º°]\s*sgt|1[º°]\s*sargento|2[º°]\s*sargento|3[º°]\s*sargento|subten(?:ente)?|sub\s*ten|cabo|cb|soldado|sd|aluno(?:\s+sd|\s+soldado|\s+oficial)?|cadete|cad|aspirante|asp)(?:\s+(?:pm|bm|pmgo|bmgo))?\s*$/i;
  if (regexRankPre.test(preContext)) {
    return true;
  }

  const regexIdPre = /\b(?:rg|r\.g\.|re|r\.e\.|matr[ií]cula|matr?\.?|identidade)\s*(?:n[º°\.]+|n\.º|num(?:ero|\.º?)?|nr\.?|:)?\s*$/i;
  if (regexIdPre.test(preContext)) {
    return true;
  }

  const regexRankPost = /^\s*[\-–\/]?\s*(?:capit[aã]o|cap|major|maj|ten(?:ente)?|coronel|cel|sargento|sgt|subten(?:ente)?|cabo|cb|soldado|sd|aluno|cadete|aspirante|asp)?(?:\s+(?:pm|bm|pmgo|bmgo))\b/i;
  if (regexRankPost.test(postContext)) {
    return true;
  }

  const matchNome = postContext.match(/^\s*[\-–]?\s*([A-Za-zÀ-ÖØ-öø-ÿ]+)/);
  if (matchNome) {
    const primeiraPalavra = matchNome[1];
    const stopwords = /^(?:de|da|do|dos|das|em|para|por|com|que|e|ou|a|o|os|as|no|na|nos|nas|pelo|pela|pelos|pelas|janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|lei|leis|decreto|decretos|portaria|portarias|artigo|art|resolu[cç][aã]o|processo|edital|of[ií]cio|boletim|di[aá]rio)$/i;

    if (!stopwords.test(primeiraPalavra) && /^[A-ZÀ-Þ]/.test(primeiraPalavra)) {
      return true;
    }
  }

  return false;
}

export function suprimirRGs(texto) {
  return texto.replace(/(^|[\s,;:(["'{\u2013\u2014])([0-9][0-9.\-]*[0-9])(?=[\s,;:.\!?)"'\]}\u2013\u2014\/\-]|$)/g, (match, prefix, numberGroup, offset, fullStr) => {
    const digits = numberGroup.replace(/\D/g, '');
    if (digits.length !== 5) {
      return match;
    }

    const numberStart = offset + prefix.length;
    const numberEnd = numberStart + numberGroup.length;

    const preStart = Math.max(0, numberStart - 80);
    const preContext = fullStr.substring(preStart, numberStart);

    const postEnd = Math.min(fullStr.length, numberEnd + 80);
    const postContext = fullStr.substring(numberEnd, postEnd);

    if (isLegislationNumber(preContext, postContext)) {
      return match;
    }

    if (isRGNumber(preContext, postContext)) {
      const masked = numberGroup.replace(/^\d/, '*').replace(/\d$/, '*');
      return prefix + masked;
    }

    return match;
  });
}

export function filtrarRGs(texto) {
  const regex = /(^|[\s,;:(["'{\u2013\u2014])([0-9][0-9.\-]*[0-9])(?=[\s,;:.\!?)"'\]}\u2013\u2014\/\-]|$)/g;
  const cleanRgs = [];
  let match;
  while ((match = regex.exec(texto)) !== null) {
    const prefix = match[1];
    const numberGroup = match[2];
    const digits = numberGroup.replace(/\D/g, '');
    if (digits.length === 5) {
      const numberStart = match.index + prefix.length;
      const numberEnd = numberStart + numberGroup.length;

      const preStart = Math.max(0, numberStart - 80);
      const preContext = texto.substring(preStart, numberStart);

      const postEnd = Math.min(texto.length, numberEnd + 80);
      const postContext = texto.substring(numberEnd, postEnd);

      if (!isLegislationNumber(preContext, postContext)) {
        cleanRgs.push(digits);
      }
    }
  }
  return cleanRgs.join(', ');
}
