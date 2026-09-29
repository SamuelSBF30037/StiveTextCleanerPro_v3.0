import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OPCOES, SIGLA_PADRAO, processarTexto } from '../src/texto.js';

const AGORA = new Date(2026, 0, 15);

describe('processarTexto', () => {
  it('usa EPA como sigla padrão quando nada é informado', () => {
    const { texto } = processarTexto({
      entrada: 'texto qualquer',
      opcao: OPCOES.removerQuebras,
      sigla: '',
    });
    assert.ok(texto.endsWith(`\n${SIGLA_PADRAO}.`));
  });

  it('usa a sigla informada', () => {
    const { texto } = processarTexto({
      entrada: 'texto qualquer',
      opcao: OPCOES.removerQuebras,
      sigla: 'EPA',
    });
    assert.ok(texto.endsWith('\nEPA.'));
  });

  it('conta linhas originais antes do processamento', () => {
    const { linhasOriginais, linhasFinais } = processarTexto({
      entrada: 'a\nb\nc',
      opcao: OPCOES.removerQuebras,
      sigla: 'EPA',
    });
    assert.equal(linhasOriginais, 3);
    assert.equal(linhasFinais, 2);
  });

  describe('remover quebras', () => {
    it('colapsa quebras de linha em um único espaço', () => {
      const { texto } = processarTexto({
        entrada: 'linha um\n\nlinha dois\nlinha tres',
        opcao: OPCOES.removerQuebras,
        sigla: 'EPA',
      });
      assert.equal(texto, 'linha um linha dois linha tres\nEPA.');
    });

    it('suprime CPF preservando os dígitos centrais', () => {
      const { texto } = processarTexto({
        entrada: 'CPF 123.456.789-09 pago',
        opcao: OPCOES.removerQuebras,
        sigla: 'EPA',
      });
      assert.match(texto, /\*\*\*\.456\.789-\*\*/);
      assert.ok(!texto.includes('123'));
      assert.ok(!texto.includes('09'));
    });

    it('não gera relatório de férias', () => {
      const { relatorio, temRelatorio } = processarTexto({
        entrada: 'texto',
        opcao: OPCOES.removerQuebras,
        sigla: 'EPA',
      });
      assert.equal(relatorio, '');
      assert.equal(temRelatorio, false);
    });
  });

  describe('remover vazias', () => {
    it('remove tabs, apara e descarta linhas vazias', () => {
      const { texto } = processarTexto({
        entrada: '  \t \nprimeira  \n\t\n   \nsegunda\t\n',
        opcao: OPCOES.removerVazias,
        sigla: 'EPA',
      });
      assert.equal(texto, 'primeira\nsegunda\nEPA.');
    });

    it('preserva o texto final sem relatório para cópia', () => {
      const { texto, relatorio, temRelatorio } = processarTexto({
        entrada: 'linha um\nlinha dois',
        opcao: OPCOES.removerVazias,
        sigla: 'EPA',
        agora: AGORA,
      });
      assert.equal(texto, 'linha um\nlinha dois\nEPA.');
      assert.equal(temRelatorio, false);
      assert.equal(relatorio, '');
    });

    it('gera relatório quando há blocos reconhecíveis, sem contaminar o texto', () => {
      const entrada = [
        'O CAPITÃO 12345 JOÃO DA SILVA, ESTÁ AUTORIZADO',
        'PERÍODO AQUISITIVO DE 01/01/2025 A 31/12/2025',
        'EXERCÍCIO: 2025',
        'AFASTAMENTO DE 01/07/2025 A 30/07/2025',
      ].join('\n');

      const { texto, relatorio, temRelatorio } = processarTexto({
        entrada,
        opcao: OPCOES.removerVazias,
        sigla: 'EPA',
        agora: AGORA,
      });

      assert.equal(temRelatorio, true);
      assert.match(relatorio, /RELATÓRIO DE CONFERÊNCIA/);
      assert.ok(!texto.includes('RELATÓRIO'));
    });
  });

  describe('filtrar RGs', () => {
    it('não anexa a sigla no modo de filtragem', () => {
      const { texto } = processarTexto({
        entrada: 'RG 12345 do Soldado JOÃO',
        opcao: OPCOES.filtrarRgs,
        sigla: 'EPA',
      });
      assert.equal(texto, '12345');
    });

    it('ignora números de legislação', () => {
      const { texto } = processarTexto({
        entrada: 'Lei nº 10460 de 2002 e o RG 98765 do Capitão SILVA',
        opcao: OPCOES.filtrarRgs,
        sigla: 'EPA',
      });
      assert.equal(texto, '98765');
    });

    it('separa múltiplos RGs por vírgula e espaço', () => {
      const { texto } = processarTexto({
        entrada: 'RG 12345 e RG 67890 e RG 11111',
        opcao: OPCOES.filtrarRgs,
        sigla: 'EPA',
      });
      assert.equal(texto, '12345, 67890, 11111');
    });

    it('não suprime CPFs no modo de filtragem', () => {
      const { texto } = processarTexto({
        entrada: 'CPF 123.456.789-09',
        opcao: OPCOES.filtrarRgs,
        sigla: 'EPA',
      });
      assert.equal(texto, '');
    });
  });
});
