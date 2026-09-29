/**
 * Pipeline de processamento de texto. Módulo puro: recebe texto e devolve
 * o resultado copiado, o relatório opcional e as estatísticas.
 */

import { gerarRelatorioFerias } from './ferias.js';
import { filtrarRGs, suprimirRGs } from './rg.js';

export const OPCOES = Object.freeze({
  removerQuebras: 'remove-all',
  removerVazias: 'remove-empty',
  filtrarRgs: 'filter-rgs',
});

export const SIGLA_PADRAO = 'EPA';

const RE_CPF = /\b(\d{3})([.\s]?\d{3}[.\s]?\d{3}[-\s]?)(\d{2})\b/g;

/** Colapsa todas as quebras de linha em espaços. */
function removerQuebras(texto) {
  return texto.replace(/\n+/g, ' ');
}

/** Remove tabs, apara e descarta linhas vazias. */
function removerLinhasVazias(texto) {
  return texto
    .split('\n')
    .map((linha) => linha.replace(/\t+/g, '').trim())
    .filter((linha) => linha !== '')
    .join('\n');
}

/** Oculta os 3 primeiros e os 2 últimos dígitos de CPFs. */
function suprimirCpfs(texto) {
  return texto.replace(RE_CPF, '***$2**');
}

/**
 * @typedef {object} Resultado
 * @property {string} texto texto a ser copiado (nunca inclui o relatório)
 * @property {string} relatorio relatório de férias, quando aplicável
 * @property {boolean} temRelatorio
 * @property {number} linhasOriginais
 * @property {number} linhasFinais
 */

/**
 * Processa o texto conforme a opção selecionada.
 *
 * @param {object} params
 * @param {string} params.entrada
 * @param {string} params.opcao uma das OPCOES
 * @param {string} [params.sigla] sigla da unidade; usa SIGLA_PADRAO se vazia
 * @param {Date} [params.agora] data de referência do relatório de férias
 * @returns {Resultado}
 */
export function processarTexto({ entrada, opcao, sigla, agora }) {
  const linhasOriginais = entrada.split('\n').length;
  const unidade = sigla || SIGLA_PADRAO;

  if (opcao === OPCOES.filtrarRgs) {
    const texto = filtrarRGs(entrada);
    return montarResultado(texto, '', false, linhasOriginais);
  }

  if (opcao === OPCOES.removerVazias) {
    const limpo = suprimirRGs(removerLinhasVazias(entrada));
    const relatorio = gerarRelatorioFerias(limpo, agora);
    const texto = `${suprimirCpfs(limpo)}\n${unidade}.`;
    return montarResultado(texto, relatorio, true, linhasOriginais);
  }

  const texto = `${suprimirCpfs(suprimirRGs(removerQuebras(entrada)))}\n${unidade}.`;
  return montarResultado(texto, '', false, linhasOriginais);
}

function montarResultado(texto, relatorio, geraRelatorio, linhasOriginais) {
  return {
    texto,
    relatorio: geraRelatorio ? relatorio : '',
    temRelatorio: geraRelatorio && relatorio !== '',
    linhasOriginais,
    linhasFinais: texto.split('\n').length,
  };
}
