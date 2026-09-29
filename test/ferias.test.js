import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { gerarRelatorioFerias } from '../src/ferias.js';

const AGORA = new Date(2026, 0, 15);

function bloco({ nome, inicio, fim, exercicio, afastamento }) {
  return [
    `O CAPITÃO 12345 ${nome} ESTÁ AUTORIZADO`,
    `PERÍODO AQUISITIVO DE ${inicio} A ${fim}`,
    `EXERCÍCIO: ${exercicio}`,
    afastamento ? `AFASTAMENTO DE ${afastamento}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

describe('gerarRelatorioFerias', () => {
  it('devolve string vazia quando não há blocos reconhecíveis', () => {
    assert.equal(gerarRelatorioFerias('texto solto sem pessoa', AGORA), '');
  });

  it('inclui as cinco seções do relatório', () => {
    const relatorio = gerarRelatorioFerias(
      bloco({ nome: 'JOÃO DA SILVA', inicio: '01/01/2020', fim: '31/12/2020', exercicio: 2020 }),
      AGORA
    );

    for (const secao of [
      '[1] DIVERGÊNCIAS EM DUPLICATAS',
      '[2] INCOERÊNCIA: EXERCÍCIO VS INÍCIO AQUISITIVO',
      '[3] ALERTA: PERÍODO AQUISITIVO COM FIM SUPERIOR A 60 DIAS',
      '[4] PERÍODO AQUISITIVO INCOMPLETO',
      '[5] QUANTIDADE DE DIAS DE FÉRIAS (AFASTAMENTO)',
    ]) {
      assert.ok(relatorio.includes(secao), `seção ausente: ${secao}`);
    }
  });

  it('reporta OK quando não há divergências', () => {
    const relatorio = gerarRelatorioFerias(
      bloco({ nome: 'JOÃO', inicio: '01/01/2020', fim: '31/12/2020', exercicio: 2020 }),
      AGORA
    );
    assert.ok(relatorio.includes('✅ Nenhuma divergência encontrada.'));
    assert.ok(relatorio.includes('✅ Exercício e início aquisitivo correspondem (OK).'));
  });

  it('sinaliza incoerência entre exercício e início do aquisitivo', () => {
    const relatorio = gerarRelatorioFerias(
      bloco({ nome: 'MARIA', inicio: '01/01/2021', fim: '31/12/2021', exercicio: 2020 }),
      AGORA
    );
    assert.match(relatorio, /⚠️ Registro 1 \(MARIA\): Exercício 2020 != Início Aquisitivo 2021/);
  });

  it('sinaliza período aquisitivo incompleto', () => {
    const relatorio = gerarRelatorioFerias(
      bloco({ nome: 'PEDRO', inicio: '01/01/2026', fim: '31/12/2026', exercicio: 2026 }),
      AGORA
    );
    assert.ok(relatorio.includes('PERÍODO AQUISITIVO INCOMPLETO'));
    assert.ok(relatorio.includes('Período incompleto, termina em 31/12/2026'));
  });

  it('sinaliza fim do aquisitivo além de 60 dias', () => {
    const relatorio = gerarRelatorioFerias(
      bloco({ nome: 'ANA', inicio: '01/01/2026', fim: '31/12/2026', exercicio: 2026 }),
      AGORA
    );
    assert.match(relatorio, /Data Fim 31\/12\/2026 \(\d+ dias à frente\)/);
  });

  it('aponta afastamento de exatamente 30 dias como conforme', () => {
    const relatorio = gerarRelatorioFerias(
      bloco({
        nome: 'LUCAS',
        inicio: '01/01/2020',
        fim: '31/12/2020',
        exercicio: 2020,
        afastamento: '01/07/2020 A 30/07/2020',
      }),
      AGORA
    );
    assert.ok(relatorio.includes('✅ Todos os afastamentos localizados possuem exatos 30 dias (OK).'));
  });

  it('aponta afastamento com contagem de dias divergente', () => {
    const relatorio = gerarRelatorioFerias(
      bloco({
        nome: 'BRUNA',
        inicio: '01/01/2020',
        fim: '31/12/2020',
        exercicio: 2020,
        afastamento: '01/07/2020 A 15/07/2020',
      }),
      AGORA
    );
    assert.match(relatorio, /⚠️ Registro 1 \(BRUNA\): Afastamento divergente! Tem 15 dias\./);
  });

  it('avisa quando não consegue ler as datas de afastamento', () => {
    const relatorio = gerarRelatorioFerias(
      bloco({ nome: 'CARLOS', inicio: '01/01/2020', fim: '31/12/2020', exercicio: 2020 }),
      AGORA
    );
    assert.ok(
      relatorio.includes('❓ Registro 1 (CARLOS): Não foi possível ler as datas de afastamento.')
    );
  });

  it('detecta divergências entre registros com a mesma assinatura', () => {
    const texto = [
      bloco({ nome: 'DA SILVA', inicio: '01/01/2020', fim: '31/12/2020', exercicio: 2020 }),
      bloco({ nome: 'DA SILVA', inicio: '01/01/2021', fim: '31/12/2021', exercicio: 2021 }),
    ].join('\n\n');

    const relatorio = gerarRelatorioFerias(texto, AGORA);
    assert.ok(relatorio.includes('⚠️ Divergência na chave:'));
    assert.ok(relatorio.includes('  - Registro 1:'));
    assert.ok(relatorio.includes('  - Registro 2:'));
  });

  it('numera os registros sequencialmente', () => {
    const texto = [
      bloco({ nome: 'UM', inicio: '01/01/2020', fim: '31/12/2020', exercicio: 2020 }),
      bloco({ nome: 'DOIS', inicio: '01/01/2020', fim: '31/12/2020', exercicio: 2020 }),
    ].join('\n\n');

    const relatorio = gerarRelatorioFerias(texto, AGORA);
    assert.ok(relatorio.includes('Registro 1 (UM)'));
    assert.ok(relatorio.includes('Registro 2 (DOIS)'));
  });

  it('usa a data atual quando nenhuma é informada', () => {
    const relatorio = gerarRelatorioFerias(
      bloco({ nome: 'JOÃO', inicio: '01/01/2020', fim: '31/12/2020', exercicio: 2020 })
    );
    assert.match(relatorio, /RELATÓRIO DE CONFERÊNCIA/);
  });
});
