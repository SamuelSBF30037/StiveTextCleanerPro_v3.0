/**
 * Relatório de conferência de período aquisitivo e afastamento.
 * Módulo puro: a data de referência é injetada para tornar a função testável.
 */

/** Posto/graduação que inicia um novo bloco de pessoa. */
const RE_DIVISOR_BLOCO =
  /(?=\b(?:O\(A\)|O|A)\s+(?:CAPIT[AÃ]O|MAJOR|TEN(?:ENTE)?|CORONEL|CEL|SARGENTO|SGT|CABO|CB|SOLDADO|SD|ALUNO|CADETE|MAJ)\b)/i;

const RE_ASSINATURA = /\b(?:O\(A\)|O|A)\s+([\s\S]*?)\s+EST[AÁ]\s+AUTORIZAD[OA]/i;

const RE_PERIODO =
  /PER[IÍ]ODO\s+AQUISITIVO\s*(?:DE\s*)?(\d{2}\/\d{2}\/\d{4})\s*A\s*(\d{2}\/\d{2}\/\d{4})/i;

const RE_EXERCICIO = /EXERC[IÍ]CIO:\s*(\d{4})/i;

/** Sem flag global: o estado de lastIndex vazaria entre blocos. */
const RE_PERIODO_AFASTAMENTO =
  /(?:DE|A PARTIR DE|PER[IÍ]ODO DE)?\s*(\d{2}\/\d{2}\/\d{4})\s*(?:A|AT[EÉ])\s*(\d{2}\/\d{2}\/\d{4})/i;

const RE_POSTO_ASSINATURA =
  /(CAPIT[AÃ]O|MAJOR|TENENTE|CORONEL|SARGENTO|CABO|SOLDADO|SD|CB|SGT|TEN|CEL|MAJ)\s*[*\d\.\s]+/i;

const SEPARADOR = '\n----------------------------------------------------------------------\n';
const MS_DIA = 1000 * 60 * 60 * 24;
const DIAS_AFASTAMENTO_PREVISTOS = 30;
const DIAS_LIMITE_PERIODO = 60;

const ANO_NA = 'ANO-NA';
const SEM_PERIODO = 'NÃO ENCONTRADO';

/** Normaliza texto para comparação: sem acento, maiúsculo, espaços colapsados. */
function normalizar(valor) {
  if (typeof valor !== 'string') return '';
  return valor
    .replace(/\u00A0/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Converte "dd/mm/aaaa" em Date, ou null se o formato não for válido. */
function parseData(data) {
  if (!data) return null;
  const partes = data.split('/');
  if (partes.length !== 3) return null;
  return new Date(partes[2], partes[1] - 1, partes[0]);
}

/** Extrai os registros individuais de período aquisitivo presentes no texto. */
function extrairRegistros(texto) {
  const registros = [];
  let numero = 1;

  for (const bloco of texto.split(RE_DIVISOR_BLOCO)) {
    const assinatura = bloco.match(RE_ASSINATURA);
    if (!assinatura) continue;

    const assinaturaCompleta = assinatura[1].trim();
    const nomeCompleto = assinaturaCompleta.replace(RE_POSTO_ASSINATURA, '').trim();

    const periodo = bloco.match(RE_PERIODO);
    const exercicio = bloco.match(RE_EXERCICIO);
    const inicioStr = periodo ? periodo[1] : null;
    const fimStr = periodo ? periodo[2] : null;

    // O período aquisitivo também casa com o padrão de afastamento: removê-lo para buscar o real.
    const semAquisitivo = periodo ? bloco.replace(periodo[0], '') : bloco;
    const afastamento = RE_PERIODO_AFASTAMENTO.exec(semAquisitivo);

    let diasAfastamento = null;
    if (afastamento) {
      const inicio = parseData(afastamento[1]);
      const fim = parseData(afastamento[2]);
      if (inicio && fim) {
        diasAfastamento = Math.round((fim - inicio) / MS_DIA) + 1;
      }
    }
    registros.push({
      numero: numero++,
      nomeCompleto,
      assinatura: normalizar(assinaturaCompleta),
      periodoOriginal: periodo ? periodo[0] : SEM_PERIODO,
      dataInicio: parseData(inicioStr),
      dataFim: parseData(fimStr),
      dataFimStr: fimStr,
      exercicioAno: exercicio ? exercicio[1].trim() : ANO_NA,
      anoAquisitivoInicio: inicioStr ? inicioStr.split('/')[2] : ANO_NA,
      diasAfastamento,
    });
  }

  return registros;
}

/** Grupos com a mesma assinatura e período aquisitivo divergente entre si. */
function chavesDivergentes(registros) {
  const mapa = new Map();

  for (const registro of registros) {
    const grupo = mapa.get(registro.assinatura);
    if (grupo) grupo.push(registro);
    else mapa.set(registro.assinatura, [registro]);
  }

  return [...mapa.values()].filter(
    (grupo) =>
      grupo.length > 1 && grupo.some((r) => r.periodoOriginal !== grupo[0].periodoOriginal)
  );
}

/**
 * Gera o relatório de conferência. Retorna string vazia quando o texto
 * não contém nenhum bloco reconhecível.
 *
 * @param {string} texto texto já limpo de quebras de linha desnecessárias
 * @param {Date} [agora] data de referência
 * @returns {string}
 */
export function gerarRelatorioFerias(texto, agora = new Date()) {
  const registros = extrairRegistros(texto);
  if (registros.length === 0) return '';

  const limite = new Date(agora);
  limite.setDate(limite.getDate() + DIAS_LIMITE_PERIODO);

  let relatorio = '\n\n=== RELATÓRIO DE CONFERÊNCIA: AQUISITIVO E AFASTAMENTO ===\n';

  relatorio += '\n[1] DIVERGÊNCIAS EM DUPLICATAS\n';
  const divergencias = chavesDivergentes(registros);
  if (divergencias.length > 0) {
    for (const grupo of divergencias) {
      relatorio += `⚠️ Divergência na chave: ${grupo[0].assinatura}\n`;
      for (const registro of grupo) {
        relatorio += `  - Registro ${registro.numero}: ${registro.periodoOriginal}\n`;
      }
    }
  } else {
    relatorio += '✅ Nenhuma divergência encontrada.\n';
  }

  relatorio += SEPARADOR;
  relatorio += '[2] INCOERÊNCIA: EXERCÍCIO VS INÍCIO AQUISITIVO\n';
  const incoerencias = registros.filter(
    (r) =>
      r.exercicioAno !== ANO_NA &&
      r.anoAquisitivoInicio !== ANO_NA &&
      r.exercicioAno !== r.anoAquisitivoInicio
  );
  if (incoerencias.length > 0) {
    for (const r of incoerencias) {
      relatorio += `⚠️ Registro ${r.numero} (${r.nomeCompleto}): Exercício ${r.exercicioAno} != Início Aquisitivo ${r.anoAquisitivoInicio}\n`;
    }
  } else {
    relatorio += '✅ Exercício e início aquisitivo correspondem (OK).\n';
  }

  relatorio += SEPARADOR;
  relatorio += `[3] ALERTA: PERÍODO AQUISITIVO COM FIM SUPERIOR A ${DIAS_LIMITE_PERIODO} DIAS DA DATA ATUAL\n`;
  const prazosExcedidos = registros.filter((r) => r.dataFim && r.dataFim > limite);
  if (prazosExcedidos.length > 0) {
    for (const r of prazosExcedidos) {
      const diasDiferenca = Math.floor((r.dataFim - agora) / MS_DIA);
      relatorio += `⚠️ Registro ${r.numero} (${r.nomeCompleto}): Data Fim ${r.dataFimStr} (${diasDiferenca} dias à frente)\n`;
    }
  } else {
    relatorio += `✅ Nenhum período aquisitivo termina além de ${DIAS_LIMITE_PERIODO} dias (OK).\n`;
  }

  relatorio += SEPARADOR;
  relatorio += '[4] PERÍODO AQUISITIVO INCOMPLETO (Data Fim > Data Atual)\n';
  const incompletos = registros.filter((r) => r.dataFim && r.dataFim > agora);
  if (incompletos.length > 0) {
    for (const r of incompletos) {
      relatorio += `⚠️ Registro ${r.numero} (${r.nomeCompleto}): Período incompleto, termina em ${r.dataFimStr}\n`;
    }
  } else {
    relatorio += '✅ Nenhum período incompleto encontrado (OK).\n';
  }

  relatorio += SEPARADOR;
  relatorio += '[5] QUANTIDADE DE DIAS DE FÉRIAS (AFASTAMENTO)\n';
  const irregulares = registros.filter(
    (r) => r.diasAfastamento !== null && r.diasAfastamento !== DIAS_AFASTAMENTO_PREVISTOS
  );
  const regulares = registros.filter((r) => r.diasAfastamento === DIAS_AFASTAMENTO_PREVISTOS);
  const semAfastamento = registros.filter((r) => r.diasAfastamento === null);

  if (irregulares.length > 0) {
    for (const r of irregulares) {
      relatorio += `⚠️ Registro ${r.numero} (${r.nomeCompleto}): Afastamento divergente! Tem ${r.diasAfastamento} dias.\n`;
    }
  } else if (regulares.length > 0) {
    relatorio += `✅ Todos os afastamentos localizados possuem exatos ${DIAS_AFASTAMENTO_PREVISTOS} dias (OK).\n`;
  }

  for (const r of semAfastamento) {
    relatorio += `❓ Registro ${r.numero} (${r.nomeCompleto}): Não foi possível ler as datas de afastamento.\n`;
  }

  return relatorio;
}
