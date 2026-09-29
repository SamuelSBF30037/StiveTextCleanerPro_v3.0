/** Cópia para a área de transferência, com fallback para o elemento informado. */

export async function copiar(texto, elementoFallback) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (erro) {
    console.warn('Clipboard API indisponível, usando execCommand.', erro);
    return copiarViaExecCommand(texto, elementoFallback);
  }
}

function copiarViaExecCommand(texto, elemento) {
  if (!elemento) return false;

  const valorOriginal = elemento.value;
  const somenteLeitura = elemento.readOnly;

  elemento.value = texto;
  elemento.removeAttribute('readonly');
  elemento.select();

  let copiado = false;
  try {
    copiado = document.execCommand('copy');
  } catch (erro) {
    console.error('Falha ao copiar o texto.', erro);
  }

  elemento.value = valorOriginal;
  if (somenteLeitura) elemento.setAttribute('readonly', '');

  return copiado;
}
