import { copiar } from './src/clipboard.js';
import { carregarPreferencias, limparEntrada, registrarUso, salvarEntrada, salvarSigla } from './src/storage.js';
import { OPCOES, processarTexto } from './src/texto.js';

const element = {
  input: document.getElementById('inputText'),
  output: document.getElementById('outputText'),
  sigla: document.getElementById('customSigla'),
  botaoProcessar: document.getElementById('processButton'),
  botaoLimpar: document.getElementById('clearButton'),
  stats: document.getElementById('stats'),
};

let usos = 0;
let temporizadorEntrada = null;

function opcaoSelecionada() {
  const marcada = document.querySelector('input[name="option"]:checked');
  return marcada ? marcada.value : OPCOES.removerQuebras;
}

function renderizarStats({ linhasOriginais, linhasFinais }) {
  element.stats.textContent =
    `Linhas originais: ${linhasOriginais}\n` +
    `Linhas finais: ${linhasFinais}\n` +
    `Usos totais (global): ${usos}`;
}

function confirmarCopia() {
  const botao = element.botaoProcessar;
  botao.classList.add('copied');
  botao.textContent = 'Copiado!';
  setTimeout(() => {
    botao.classList.remove('copied');
    botao.textContent = '▶ PROCESSAR';
  }, 2000);
}

async function processar() {
  const resultado = processarTexto({
    entrada: element.input.value,
    opcao: opcaoSelecionada(),
    sigla: element.sigla.value,
  });

  element.output.value = resultado.temRelatorio
    ? resultado.texto + resultado.relatorio
    : resultado.texto;

  salvarSigla(element.sigla.value);
  usos = await registrarUso(usos);
  renderizarStats(resultado);

  if (await copiar(resultado.texto, element.output)) {
    confirmarCopia();
  }
}

function limpar() {
  clearTimeout(temporizadorEntrada);
  element.input.value = '';
  element.output.value = '';
  limparEntrada();
  element.input.focus();
}

function agendarSalvamentoEntrada() {
  clearTimeout(temporizadorEntrada);
  temporizadorEntrada = setTimeout(() => salvarEntrada(element.input.value), 300);
}

async function inicializar() {
  const { sigla, usos: contador, entrada } = await carregarPreferencias();
  usos = contador;
  element.sigla.value = sigla;
  element.input.value = entrada;
  renderizarStats({ linhasOriginais: entrada.split('\n').length, linhasFinais: entrada.split('\n').length });

  element.botaoProcessar.addEventListener('click', processar);
  element.botaoLimpar.addEventListener('click', limpar);
  element.input.addEventListener('input', agendarSalvamentoEntrada);
}

inicializar();
