// Confere que o fixture legacy-rg.mjs reproduz o código original pré-refatoração.
// Sem este teste, equivalência.test.js seria circular: compararia o fixture contra si mesmo.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { readFileSync } from 'node:fs';

import * as fixture from './fixtures/legacy-rg.mjs';

const ORIGINAL = new URL('./fixtures/legacy-original.js', import.meta.url);
const CASOS = [
  'RG 12345',
  'Lei nº 10460 de 2002',
  'Decreto 12345/2020',
  'O CAPITÃO 12345 JOÃO',
  'conforme o artigo 12345',
  'as Leis 10460 e 20756 de 2002',
  'Lei 10460 que dispõe sobre o tema',
  'MATR. 12345',
  'Portaria 12345, de 28 de janeiro de 2020',
  '12345-2020',
  'SEI 12345/2020',
  'RG 12345 e RG 67890',
  'texto sem números',
];

async function carregarOriginal() {
  const corpo = readFileSync(ORIGINAL, 'utf8')
    .replace(/function isLegislationNumber/, 'export function isLegislationNumber')
    .replace(/function isRGNumber/, 'export function isRGNumber')
    .replace(/function suprimirRGs/, 'export function suprimirRGs')
    .replace(/function filtrarRGs/, 'export function filtrarRGs');

  const destino = new URL('./fixtures/legacy-run.mjs', import.meta.url);
  writeFileSync(destino, corpo);
  const mod = await import(destino.href);
  return mod;
}

describe('fixture de referência', () => {
  it('espelha o código original pré-refatoração', async () => {
    const original = await carregarOriginal();

    for (const caso of CASOS) {
      assert.equal(
        fixture.suprimirRGs(caso),
        original.suprimirRGs(caso),
        `suprimirRGs divergiu em: ${caso}`
      );
      assert.equal(
        fixture.filtrarRGs(caso),
        original.filtrarRGs(caso),
        `filtrarRGs divergiu em: ${caso}`
      );
    }
  });
});
