import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filtrarRGs, suprimirRGs } from '../src/rg.js';

describe('suprimirRGs', () => {
  it('mascara o primeiro e o último dígito de RG após prefixo explícito', () => {
    assert.equal(suprimirRGs('RG 12345'), 'RG *234*');
  });

  it('mascara RGs com pontuação interna', () => {
    assert.equal(suprimirRGs('RG 89.388 do Tenente'), 'RG *9.38* do Tenente');
  });

  it('mascara múltiplos RGs', () => {
    assert.equal(suprimirRGs('RG 12345 e RG 67890'), 'RG *234* e RG *789*');
  });

  it('não mascara números de legislação', () => {
    assert.equal(suprimirRGs('Lei nº 10460 de 2002'), 'Lei nº 10460 de 2002');
  });

  it('não mascara números em listas de normas', () => {
    assert.equal(
      suprimirRGs('as Leis 10460 e 20756 de 2002'),
      'as Leis 10460 e 20756 de 2002'
    );
  });

  it('não mascara artigo com numeração por extenso', () => {
    assert.equal(suprimirRGs('conforme o artigo 12345'), 'conforme o artigo 12345');
  });

  it('não mascara número de portaria com data de publicação', () => {
    assert.equal(
      suprimirRGs('Portaria 12345, de 28 de janeiro de 2020'),
      'Portaria 12345, de 28 de janeiro de 2020'
    );
  });

  it('não mascara número seguido de barra e ano', () => {
    assert.equal(suprimirRGs('Decreto 12345/2020'), 'Decreto 12345/2020');
  });

  it('não mascara número seguido de cláusula "que dispõe sobre"', () => {
    assert.equal(
      suprimirRGs('Lei 10460 que dispõe sobre o tema'),
      'Lei 10460 que dispõe sobre o tema'
    );
  });

  it('preserva o texto ao redor do número mascarado', () => {
    assert.equal(
      suprimirRGs('Início: RG 12345. Fim.'),
      'Início: RG *234*. Fim.'
    );
  });

  it('ignora grupos que não tenham exatamente 5 dígitos', () => {
    assert.equal(suprimirRGs('RG 1234'), 'RG 1234');
    assert.equal(suprimirRGs('RG 123456'), 'RG 123456');
  });

  it('devolve o texto intacto quando não há números', () => {
    const texto = 'nenhum número de cinco dígitos aqui';
    assert.equal(suprimirRGs(texto), texto);
  });

  it('trata entrada vazia', () => {
    assert.equal(suprimirRGs(''), '');
  });
});

describe('filtrarRGs', () => {
  it('extrai apenas os RGs confirmados', () => {
    assert.equal(filtrarRGs('RG 12345 e RG 67890'), '12345, 67890');
  });

  it('descarta números de legislação', () => {
    assert.equal(
      filtrarRGs('Lei 10460/2002, Decreto 20756, RG 12345'),
      '12345'
    );
  });

  it('ignora a pontuação interna ao extrair os dígitos', () => {
    assert.equal(filtrarRGs('RG 89.388'), '89388');
  });

  it('devolve string vazia quando não há RGs', () => {
    assert.equal(filtrarRGs('sem números relevantes'), '');
  });
});
