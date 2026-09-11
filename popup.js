document.addEventListener('DOMContentLoaded', () => {
  let usageCounter = 0;

  // Verifica se estamos na janela separada verificando o parâmetro da URL
  const urlParams = new URLSearchParams(window.location.search);
  const isWindow = urlParams.get('window') === '1';

  const keepOpenCheckbox = document.getElementById('keepOpenCheckbox');
  const inputEl = document.getElementById('inputText');

  // Se já estivermos na janela separada, o checkbox deve aparecer marcado
  if (isWindow && keepOpenCheckbox) {
    keepOpenCheckbox.checked = true;
  }

  // Monitora digitação para manter o estado caso mude para janela separada
  inputEl.addEventListener('input', () => {
    chrome.storage.local.set({ savedInput: inputEl.value });
  });

  if (keepOpenCheckbox) {
    keepOpenCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        // Salva o estado atual
        const selectedOption = document.querySelector('input[name="option"]:checked')?.value || 'remove-all';
        chrome.storage.local.set({ 
          tempInput: inputEl.value,
          tempOption: selectedOption
        }, () => {
          // Abre nova janela solta e fecha o popup
          chrome.windows.create({
            url: chrome.runtime.getURL("popup.html?window=1"),
            type: "popup",
            width: 480,
            height: 720
          });
          window.close();
        });
      } else {
        // Se desmarcou e estamos na janela separada, fechamos
        if (isWindow) {
          window.close();
        }
      }
    });
  }

  // Carrega configurações salvas
  chrome.storage.local.get(['usageCounter', 'customSigla', 'tempInput', 'tempOption', 'savedInput'], (result) => {
    if (result.usageCounter) {
      usageCounter = parseInt(result.usageCounter);
    }
    if (result.customSigla) {
      document.getElementById('customSigla').value = result.customSigla;
    }
    
    // Se acabou de abrir a janela separada, recupera o texto que estava sendo digitado
    if (isWindow && result.tempInput !== undefined) {
      inputEl.value = result.tempInput;
      if (result.tempOption) {
        const opt = document.querySelector(`input[name="option"][value="${result.tempOption}"]`);
        if (opt) opt.checked = true;
      }
      chrome.storage.local.remove(['tempInput', 'tempOption']); // limpa após usar
    } else if (result.savedInput !== undefined) {
      // Caso apenas reabra a extensão
      inputEl.value = result.savedInput;
    }
  });

  const processBtn = document.getElementById('processButton');
  if (processBtn) {
    processBtn.addEventListener('click', processText);
  }

  const clearBtn = document.getElementById('clearButton');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      inputEl.value = '';
      document.getElementById('outputText').value = '';
      chrome.storage.local.remove(['savedInput', 'tempInput']);
    });
  }

  function verificarFerias(texto) {
    const agora = new Date();
    const limite60Dias = new Date();
    limite60Dias.setDate(agora.getDate() + 60);

    function normalizarTexto(t) {
        if (typeof t !== 'string') return '';
        return t.replace(/\u00A0/g, ' ').trim().toUpperCase().replace(/\s+/g, ' ')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
    }

    function parseData(dataStr) {
        if (!dataStr) return null;
        const partes = dataStr.split('/');
        if (partes.length !== 3) return null;
        return new Date(partes[2], partes[1] - 1, partes[0]);
    }

    // Dividir os blocos usando patentes como delimitadores de pessoas
    const regexDivisor = /(?=\b(?:O\(A\)|O|A)\s+(?:CAPIT[AÃ]O|MAJOR|TEN(?:ENTE)?|CORONEL|CEL|SARGENTO|SGT|CABO|CB|SOLDADO|SD|ALUNO|CADETE|MAJ)\b)/i;
    const blocos = texto.split(regexDivisor);
    
    const registros = [];
    let index = 1;

    // Atualizado para suportar "A SD PM..." e "está autorizada"
    const regexAssinatura = /\b(?:O\(A\)|O|A)\s+([\s\S]*?)\s+EST[AÁ]\s+AUTORIZAD[OA]/i; 
    const regexPeriodo = /PER[IÍ]ODO\s+AQUISITIVO\s*(?:DE\s*)?(\d{2}\/\d{2}\/\d{4})\s*A\s*(\d{2}\/\d{2}\/\d{4})/i; 
    const regexExercicio = /EXERC[IÍ]CIO:\s*(\d{4})/i; 
    const regexDatasAfastamento = /(?:DE|A PARTIR DE|PER[IÍ]ODO DE)?\s*(\d{2}\/\d{2}\/\d{4})\s*(?:A|AT[EÉ])\s*(\d{2}\/\d{2}\/\d{4})/gi;

    let encontrouAlgo = false;

    blocos.forEach(bloco => {
        const matchAssinatura = bloco.match(regexAssinatura);
        if (!matchAssinatura) return; 
        
        encontrouAlgo = true;
        const assinaturaCompleta = matchAssinatura[1].trim();
        const nomeCompleto = assinaturaCompleta.replace(/(CAPIT[AÃ]O|MAJOR|TENENTE|CORONEL|SARGENTO|CABO|SOLDADO|SD|CB|SGT|TEN|CEL|MAJ)\s*[\*\d\.\s]+/i, '').trim();

        const matchPeriodo = bloco.match(regexPeriodo);
        const dataInicioStr = matchPeriodo ? matchPeriodo[1] : null;
        const dataFimStr = matchPeriodo ? matchPeriodo[2] : null;
        
        const matchExercicio = bloco.match(regexExercicio);
        const exercicioAno = matchExercicio ? matchExercicio[1].trim() : 'ANO-NA';
        
        // Remove a primeira ocorrência do período aquisitivo para procurar o período de afastamento que vem depois
        const blocoSemAquisitivo = matchPeriodo ? bloco.replace(matchPeriodo[0], '') : bloco;
        
        let diasAfastamento = null;
        const matchesAfastamento = [...blocoSemAquisitivo.matchAll(regexDatasAfastamento)];
        if (matchesAfastamento.length > 0) {
            const afInicio = parseData(matchesAfastamento[0][1]);
            const afFim = parseData(matchesAfastamento[0][2]);
            if (afInicio && afFim) {
                diasAfastamento = Math.round((afFim - afInicio) / (1000 * 60 * 60 * 24)) + 1;
            }
        }

        registros.push({
            numero: index,
            nomeCompleto: nomeCompleto, 
            assinatura: normalizarTexto(assinaturaCompleta), 
            periodoOriginal: matchPeriodo ? matchPeriodo[0] : 'NÃO ENCONTRADO',
            dataInicio: dataInicioStr ? parseData(dataInicioStr) : null,
            dataFim: dataFimStr ? parseData(dataFimStr) : null,
            dataFimStr: dataFimStr,
            exercicioAno: exercicioAno,
            anoAquisitivoInicio: dataInicioStr ? dataInicioStr.split('/')[2] : 'ANO-NA',
            diasAfastamento: diasAfastamento
        });
        index++;
    });

    if (!encontrouAlgo) return ""; 

    let relatorioTxt = "\n\n=== RELATÓRIO DE CONFERÊNCIA: AQUISITIVO E AFASTAMENTO ===\n";

    // 1. DIVERGÊNCIAS EM DUPLICATAS
    const mapa = {};
    registros.forEach(r => {
        if (!mapa[r.assinatura]) mapa[r.assinatura] = [];
        mapa[r.assinatura].push(r);
    });

    const divergenciasDuplicatas = [];
    Object.values(mapa).filter(g => g.length > 1).forEach(grupo => {
        const primeiro = grupo[0].periodoOriginal;
        if (grupo.some(reg => reg.periodoOriginal !== primeiro)) {
            divergenciasDuplicatas.push(grupo);
        }
    });

    relatorioTxt += "\n[1] DIVERGÊNCIAS EM DUPLICATAS\n";
    if (divergenciasDuplicatas.length > 0) {
        divergenciasDuplicatas.forEach(g => {
            relatorioTxt += `⚠️ Divergência na chave: ${g[0].assinatura}\n`;
            g.forEach(r => relatorioTxt += `  - Registro ${r.numero}: ${r.periodoOriginal}\n`);
        });
    } else { relatorioTxt += "✅ Nenhuma divergência encontrada.\n"; }

    // 2. INCOERÊNCIA: EXERCÍCIO VS INÍCIO AQUISITIVO
    const incoerenciasExercicio = registros.filter(r => 
        r.exercicioAno !== 'ANO-NA' && r.anoAquisitivoInicio !== 'ANO-NA' && r.exercicioAno !== r.anoAquisitivoInicio
    );

    relatorioTxt += "\n----------------------------------------------------------------------\n";
    relatorioTxt += "[2] INCOERÊNCIA: EXERCÍCIO VS INÍCIO AQUISITIVO\n";
    if (incoerenciasExercicio.length > 0) {
        incoerenciasExercicio.forEach(r => {
            relatorioTxt += `⚠️ Registro ${r.numero} (${r.nomeCompleto}): Exercício ${r.exercicioAno} != Início Aquisitivo ${r.anoAquisitivoInicio}\n`;
        });
    } else { relatorioTxt += "✅ Exercício e início aquisitivo correspondem (OK).\n"; }

    // 3. ALERTA: FIM DO AQUISITIVO > 60 DIAS
    const prazosExcedidos = registros.filter(r => 
        r.dataFim && r.dataFim > limite60Dias
    );

    relatorioTxt += "\n----------------------------------------------------------------------\n";
    relatorioTxt += "[3] ALERTA: PERÍODO AQUISITIVO COM FIM SUPERIOR A 60 DIAS DA DATA ATUAL\n";
    if (prazosExcedidos.length > 0) {
        prazosExcedidos.forEach(r => {
            const diasDiferenca = Math.floor((r.dataFim - agora) / (1000 * 60 * 60 * 24));
            relatorioTxt += `⚠️ Registro ${r.numero} (${r.nomeCompleto}): Data Fim ${r.dataFimStr} (${diasDiferenca} dias à frente)\n`;
        });
    } else { 
        relatorioTxt += "✅ Nenhum período aquisitivo termina além de 60 dias (OK).\n"; 
    }

    // 4. PERÍODO INCOMPLETO
    const periodoIncompleto = registros.filter(r => r.dataFim && r.dataFim > agora);
    relatorioTxt += "\n----------------------------------------------------------------------\n";
    relatorioTxt += "[4] PERÍODO AQUISITIVO INCOMPLETO (Data Fim > Data Atual)\n";
    if (periodoIncompleto.length > 0) {
        periodoIncompleto.forEach(r => {
            relatorioTxt += `⚠️ Registro ${r.numero} (${r.nomeCompleto}): Período incompleto, termina em ${r.dataFimStr}\n`;
        });
    } else {
        relatorioTxt += "✅ Nenhum período incompleto encontrado (OK).\n";
    }

    // 5. PERÍODO DE AFASTAMENTO
    const afastamentoIrregular = registros.filter(r => r.diasAfastamento !== null && r.diasAfastamento !== 30);
    const afastamentoOk = registros.filter(r => r.diasAfastamento === 30);
    const semAfastamento = registros.filter(r => r.diasAfastamento === null);

    relatorioTxt += "\n----------------------------------------------------------------------\n";
    relatorioTxt += "[5] QUANTIDADE DE DIAS DE FÉRIAS (AFASTAMENTO)\n";
    if (afastamentoIrregular.length > 0) {
        afastamentoIrregular.forEach(r => {
            relatorioTxt += `⚠️ Registro ${r.numero} (${r.nomeCompleto}): Afastamento divergente! Tem ${r.diasAfastamento} dias.\n`;
        });
    } else if (afastamentoOk.length > 0) {
        relatorioTxt += "✅ Todos os afastamentos localizados possuem exatos 30 dias (OK).\n";
    }

    if (semAfastamento.length > 0) {
        semAfastamento.forEach(r => {
            relatorioTxt += `❓ Registro ${r.numero} (${r.nomeCompleto}): Não foi possível ler as datas de afastamento.\n`;
        });
    }

    return relatorioTxt;
  }

  async function processText() {
    const input = document.getElementById('inputText').value;
    const selectedOption = document.querySelector('input[name="option"]:checked').value;
    const customSiglaInput = document.getElementById('customSigla').value;
    const customSigla = customSiglaInput || 'EPA';
    let processedText = '';

    const originalLines = input.split('\n').length;

    // Salva a sigla escolhida para a próxima vez
    chrome.storage.local.set({ customSigla: customSiglaInput });

    if (selectedOption === 'remove-all') {
      processedText = input.replace(/\n+/g, ' ');
    } else if (selectedOption === 'remove-empty') {
      processedText = input
        .split('\n')
        .map(line => line.replace(/\t+/g, '').trim())
        .filter(line => line !== '')
        .join('\n');
        
      // Supressão de 1º e último dígito de RGs (5 dígitos) antes de nome próprio (Ex: 89.388 -> *9.38*)
      processedText = processedText.replace(/(^|\s)([0-9][0-9.\-]*[0-9])(?=\s+[A-Za-zÀ-ÖØ-öø-ÿ])/g, (match, space, numberGroup) => {
          let digits = numberGroup.replace(/\D/g, '');
          if (digits.length === 5) {
              return space + numberGroup.replace(/^\d/, '*').replace(/\d$/, '*');
          }
          return match;
      });

      // Verificação de férias (relatório separado — não entra no texto copiado)
      var relatorioFerias = verificarFerias(processedText);
    } else if (selectedOption === 'filter-rgs') {
      const regex = /\b(?:\d[.\-]?)+\b/g;
      let matched = input.match(regex) || [];
      // Extrai apenas os números puros para contar e limpar a pontuação
      let cleanRgs = [];
      matched.forEach(m => {
          let clean = m.replace(/\D/g, '');
          if (clean.length === 5) {
              cleanRgs.push(clean);
          }
      });
      processedText = cleanRgs.join(', ');
    }

    if (selectedOption !== 'filter-rgs') {
      // Supressão de CPFs (oculta 3 primeiros e 2 últimos)
      processedText = processedText.replace(/\b(\d{3})([.\s]?\d{3}[.\s]?\d{3}[-\s]?)(\d{2})\b/g, '***$2**');
      processedText += `\n${customSigla}.`;
    }

    // textoCopia = apenas o texto processado (sem relatório), é o que vai para o clipboard
    const textoCopia = processedText;

    // Se existir relatório de férias, adiciona SOMENTE no textarea para visualização
    const textoExibicao = (selectedOption === 'remove-empty' && relatorioFerias)
      ? processedText + relatorioFerias
      : processedText;

    document.getElementById('outputText').value = textoExibicao;

    // Copia para a área de transferência APENAS o texto processado (sem relatório)
    try {
      await navigator.clipboard.writeText(textoCopia);
      const oldText = processBtn.innerText;
      processBtn.innerText = "Copiado!";
      setTimeout(() => processBtn.innerText = oldText, 2000);
    } catch (err) {
      // Fallback: copia apenas o texto limpo
      const textArea = document.getElementById('outputText');
      textArea.value = textoCopia;
      textArea.select();
      document.execCommand('copy');
      textArea.value = textoExibicao;
      const oldText = processBtn.innerText;
      processBtn.innerText = "Copiado!";
      setTimeout(() => processBtn.innerText = oldText, 2000);
    }

    usageCounter++;
    chrome.storage.local.set({ usageCounter: usageCounter });

    document.getElementById('stats').innerText = `Linhas originais: ${originalLines}\nLinhas finais: ${textoCopia.split('\n').length}\nUsos totais (global): ${usageCounter}`;
  }
});
