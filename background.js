chrome.runtime.onInstalled.addListener(configurarPainel);
chrome.runtime.onStartup.addListener(configurarPainel);

function configurarPainel() {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((erro) => console.error('Falha ao configurar o painel lateral.', erro));
}
