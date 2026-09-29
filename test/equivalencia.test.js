import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filtrarRGs as filtrarAntigo, isLegislationNumber as isLegislationNumberAntigo, isRGNumber as isRGNumberAntigo, suprimirRGs as suprimirAntigo } from '../test/fixtures/legacy-rg.mjs';
import { filtrarRGs, isLegislationNumber, isRGNumber, suprimirRGs } from '../src/rg.js';

const CASOS = [
  'RG 12345',
  'RG 12345 e RG 67890',
  'RG 89.388 do Tenente SILVA',
  'Lei nº 10460 de 2002',
  'Lei nº 10.460, de 23 de julho de 2002',
  'Decreto 12345/2020',
  'Portaria 12345, de 28 de janeiro de 2020',
  'conforme o artigo 12345',
  'as Leis 10460 e 20756 de 2002',
  'arts. 10.460, 20.756',
  'Lei 10460 que dispõe sobre o tema',
  'Lei 10460 combinado com a Lei 20756',
  'processo 12345-2020',
  'SEI 12345/2020',
  'MATRICULA 12345',
  'RE nº 12345 do Soldado',
  'O CAPITÃO 12345 JOÃO DA SILVA',
  '1º TENENTE 12345 MARCOS',
  'SD 12345 PEDRO',
  'CB 12345 - JOÃO',
  'Aluno SD 12345 LUCAS',
  '12345',
  'Número 12345 qualquer coisa',
  'Processo nº 12345 em andamento',
  'Portaria 12345. Deferred.',
  '12345-2020',
  '(12345)',
  'Art. 5º, 12345 e 67890',
  'Diário Oficial 12345',
  'Instrução Normativa 12345',
  'Emenda Constitucional 12345',
  'Medida Provisória 12345',
  'Ato 12345',
  'Nota Técnica 12345',
  'Boletim Geral 12345',
  'no 12345 e no 67890',
  'verbas 12345, 67890 e 11111',
  'Lei Estadual 12345',
  'Decreto Estadual 12345 de 2020',
  'Portarias 12345 e 67890',
  'Resolução 12345',
  'Códigos 12345 e 67890',
  'Protocolo 12345/2021',
  'Ofício 12345',
  'Parecer 12345',
  'Acórdão 12345',
  'Edital 12345',
  'Certidão 12345',
  'requerimento 12345',
  'Memorando 12345',
  'múltiplos: RG 11111, RG 22222, Lei 33333, RG 44444',
  'RG 12345.\nO SARGENTO 67890 JOAO',
  'texto sem numeros',
  '',
  '   ',
  '1234',
  '123456',
  '89.388',
  'RG 12345 do soldado e Lei 67890/2020',
  'anexo I, item 12345',
  '§ 12345',
  'inciso 12345',
  'alínea 12345',
  'nº 12345 do RG',
  'MATR. 12345',
  'identidade 12345',
  'RE 12345',
  'R.E. 12345',
];

describe('equivalência com a implementação original', () => {
  it('suprimirRGs produz a mesma saída', () => {
    for (const caso of CASOS) {
      assert.equal(suprimirRGs(caso), suprimirAntigo(caso), `divergência em: ${JSON.stringify(caso)}`);
    }
  });

  it('filtrarRGs produz a mesma saída', () => {
    for (const caso of CASOS) {
      assert.equal(filtrarRGs(caso), filtrarAntigo(caso), `divergência em: ${JSON.stringify(caso)}`);
    }
  });

  it('isLegislationNumber concorda em janelas de contexto', () => {
    for (const caso of CASOS) {
      for (let i = 0; i <= caso.length; i++) {
        const pre = caso.slice(Math.max(0, i - 80), i);
        const post = caso.slice(i, i + 80);
        assert.equal(
          isLegislationNumber(pre, post),
          isLegislationNumberAntigo(pre, post),
          `legislação divergente em ${JSON.stringify(caso)} @ ${i}`
        );
      }
    }
  });

  it('isRGNumber concorda em janelas de contexto', () => {
    for (const caso of CASOS) {
      for (let i = 0; i <= caso.length; i++) {
        const pre = caso.slice(Math.max(0, i - 80), i);
        const post = caso.slice(i, i + 80);
        assert.equal(
          isRGNumber(pre, post),
          isRGNumberAntigo(pre, post),
          `RG divergente em ${JSON.stringify(caso)} @ ${i}`
        );
      }
    }
  });
});
