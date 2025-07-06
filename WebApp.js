// WebApp.gs
/**
 * Função principal que serve a interface web do aplicativo.
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Controle de Estoque DoNadaTrancada');
}

/**
 * Função utilitária para incluir outros arquivos HTML (se necessário, para modularidade do frontend).
 * No nosso caso, Index.html contém tudo, então esta função é mantida para compatibilidade futura.
 * @param {string} filename The name of the file to include.
 * @returns {string} The HTML content of the file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}