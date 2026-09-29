// Smoke test do popup.js com DOM e APIs do Chrome simulados (sem jsdom).
import assert from 'node:assert/strict';

class El {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.value = '';
    this.textContent = '';
    this.innerText = '';
    this.classList = {
      _set: new Set(),
      add: (c) => this.classList._set.add(c),
      remove: (c) => this.classList._set.delete(c),
      contains: (c) => this.classList._set.has(c),
    };
    this.listeners = {};
    this.readOnly = false;
  }
  addEventListener(evt, fn) {
    (this.listeners[evt] ||= []).push(fn);
  }
  dispatch(evt) {
    for (const fn of this.listeners[evt] || []) fn();
  }
  focus() {}
  select() {}
  setAttribute() {}
  removeAttribute() {}
}

const el = {
  inputText: new El('textarea'),
  outputText: new El('textarea'),
  customSigla: new El('input'),
  processButton: new El('button'),
  clearButton: new El('button'),
  stats: new El('div'),
};

const radios = [
  { value: 'remove-all', checked: true },
  { value: 'remove-empty', checked: false },
  { value: 'filter-rgs', checked: false },
];

const storage = { usageCounter: 7, customSigla: 'OLD', savedInput: 'texto anterior' };

globalThis.chrome = {
  storage: {
    local: {
      async get(chave) {
        if (Array.isArray(chave)) {
          return Object.fromEntries(chave.filter((k) => k in storage).map((k) => [k, storage[k]]));
        }
        return chave in storage ? { [chave]: storage[chave] } : {};
      },
      async set(obj) {
        Object.assign(storage, obj);
      },
      async remove(chave) {
        for (const k of [chave].flat()) delete storage[k];
      },
    },
  },
};

globalThis.document = {
  getElementById: (id) => el[id] || null,
  querySelectorAll: () => radios,
  querySelector: (sel) => (sel.includes(':checked') ? radios.find((r) => r.checked) : null),
  execCommand: () => true,
};

let copiado = null;
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: {
    clipboard: {
      writeText: async (t) => {
        copiado = t;
      },
    },
  },
});

await import('../popup.js');
await new Promise((r) => setTimeout(r, 10));

assert.equal(el.customSigla.value, 'OLD', 'sigla salva deve ser restaurada');
assert.equal(el.inputText.value, 'texto anterior', 'entrada salva deve ser restaurada');
assert.match(el.stats.textContent, /Usos totais \(global\): 7/);

// Processa
el.inputText.value = 'linha um\n\t\nRG 12345 do Capitão SILVA\nLei 10460/2002';
radios[0].checked = true;
el.processButton.dispatch('click');
await new Promise((r) => setTimeout(r, 20));

assert.equal(
  el.outputText.value,
  'linha um \t RG *234* do Capitão SILVA Lei 10460/2002\nOLD.',
  `saída inesperada: ${JSON.stringify(el.outputText.value)}`
);
assert.equal(copiado, el.outputText.value, 'clipboard recebe o texto processado');
assert.equal(el.processButton.textContent, 'Copiado!', 'botão deve confirmar a cópia');
assert.equal(storage.usageCounter, 8, 'contador de usos deve incrementar');
assert.match(el.stats.textContent, /Linhas originais: 4/);
assert.match(el.stats.textContent, /Linhas finais: 2/);

// Filtro de RGs
el.inputText.value = 'RG 12345 e Lei 67890/2020';
radios[0].checked = false;
radios[2].checked = true;
el.processButton.dispatch('click');
await new Promise((r) => setTimeout(r, 20));
assert.equal(el.outputText.value, '12345', `filtro: ${JSON.stringify(el.outputText.value)}`);

// Limpar
el.clearButton.dispatch('click');
assert.equal(el.inputText.value, '', 'entrada deve ser limpa');
assert.equal(el.outputText.value, '', 'saída deve ser limpa');
assert.ok(!('savedInput' in storage), 'persistência deve ser removida');

// Fallback de cópia: Clipboard API indisponível
copiado = null;
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: {
    clipboard: {
      writeText: async () => {
        throw new Error('sem permissão');
      },
    },
  },
});
let execCommandTexto = null;
globalThis.document.execCommand = () => {
  execCommandTexto = el.outputText.value;
  return true;
};

el.inputText.value = 'RG 12345 do Capitão SILVA';
radios[0].checked = true;
radios[2].checked = false;
el.processButton.dispatch('click');
await new Promise((r) => setTimeout(r, 20));

assert.equal(
  execCommandTexto,
  'RG *234* do Capitão SILVA\nOLD.',
  'execCommand deve copiar o texto limpo'
);
assert.equal(
  el.outputText.value,
  'RG *234* do Capitão SILVA\nOLD.',
  'o valor exibido deve ser restaurado após o fallback'
);

console.log('popup.js: smoke test OK');
