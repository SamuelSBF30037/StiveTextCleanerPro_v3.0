/** Persistência das preferências e do contador de uso em chrome.storage.local. */

const CHAVE_USOS = 'usageCounter';
const CHAVE_SIGLA = 'customSigla';
const CHAVE_ENTRADA = 'savedInput';

export async function carregarPreferencias() {
  const [sigla, usos, entrada] = await Promise.all([
    chrome.storage.local.get(CHAVE_SIGLA),
    chrome.storage.local.get(CHAVE_USOS),
    chrome.storage.local.get(CHAVE_ENTRADA),
  ]);
  return {
    sigla: sigla[CHAVE_SIGLA] ?? '',
    usos: Number.parseInt(usos[CHAVE_USOS], 10) || 0,
    entrada: entrada[CHAVE_ENTRADA] ?? '',
  };
}

export function salvarSigla(sigla) {
  return chrome.storage.local.set({ [CHAVE_SIGLA]: sigla });
}

export function salvarEntrada(entrada) {
  return chrome.storage.local.set({ [CHAVE_ENTRADA]: entrada });
}

export function limparEntrada() {
  return chrome.storage.local.remove(CHAVE_ENTRADA);
}

export async function registrarUso(usos) {
  const total = usos + 1;
  await chrome.storage.local.set({ [CHAVE_USOS]: total });
  return total;
}
