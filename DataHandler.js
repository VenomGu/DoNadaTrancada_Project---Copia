// DataHandler.gs
/**
 * Obtém a aba de trabalho principal do Google Sheet.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} O objeto da aba da planilha.
 * @throws {Error} Se a aba ou a planilha não forem encontradas.
 */
function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(`A aba '${SHEET_NAME}' não foi encontrada na planilha com ID '${SPREADSHEET_ID}'.`);
  }
  return sheet;
}

/**
 * Cria um mapa dos cabeçalhos das colunas para seus respectivos índices (base 0).
 * Isso permite acessar dados da linha por nome da coluna (ex: row[headerMap['nomedoitem']]).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet O objeto da aba da planilha.
 * @returns {Object.<string, number>} Um mapa de cabeçalhos normalizados para índices.
 */
function getHeaderMap(sheet) {
  // Pega os cabeçalhos da linha definida por HEADER_ROW (ex: linha 1)
  const headers = sheet.getRange(HEADER_ROW, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  headers.forEach((header, index) => {
    // Normaliza o cabeçalho (remove espaços e torna minúsculo) para uso consistente
    headerMap[header.replace(/\s+/g, '').toLowerCase()] = index;
  });
  return headerMap;
}

/**
 * Gera um novo ID de item sequencial, lendo o último ID numérico da planilha.
 * Começa com "1" se não houver itens de dados.
 * @returns {string} O novo ID sequencial gerado.
 * @throws {Error} Se a coluna 'ID Item' não for encontrada.
 */
function generateNewItemId() {
    const sheet = getSheet();
    const range = sheet.getDataRange();
    const values = range.getValues(); // Todos os valores da planilha, incluindo cabeçalhos

    // Se o número total de linhas é igual ou menor que a linha do cabeçalho, não há dados de item.
    if (values.length <= HEADER_ROW) {
        return "1"; // Começa com ID 1
    }

    const headerMap = getHeaderMap(sheet);
    const idColIndex = headerMap['iditem']; // Índice da coluna 'ID Item' normalizada

    if (idColIndex === undefined) {
        // Log detalhado para depuração se a coluna não for encontrada
        Logger.log('Cabeçalhos detectados: ' + JSON.stringify(sheet.getRange(HEADER_ROW, 1, 1, sheet.getLastColumn()).getValues()[0]));
        Logger.log('HeaderMap gerado: ' + JSON.stringify(headerMap));
        throw new Error(`Erro: Coluna 'ID Item' não encontrada no cabeçalho da planilha na linha ${HEADER_ROW}. Verifique a ortografia.`);
    }

    let lastId = 0;
    // Percorre as linhas de dados de baixo para cima para encontrar o último ID numérico válido.
    // Começa do final do array de valores até a linha *após* o cabeçalho.
    // O índice do array `values` para a primeira linha de dados é `HEADER_ROW` (se HEADER_ROW for 1, é o índice 1).
    for (let i = values.length - 1; i >= HEADER_ROW; i--) {
        const currentId = parseInt(values[i][idColIndex]); // Pega o valor na coluna ID Item
        if (!isNaN(currentId)) { // Se for um número válido
            lastId = currentId;
            break; // Encontrou o último ID, pode sair do loop
        }
    }
    return String(lastId + 1); // Retorna o próximo ID sequencial
}