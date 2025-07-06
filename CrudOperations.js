// CrudOperations.gs

/**
 * Adiciona um novo item à planilha.
 * @param {Object} itemData Dados do item a ser adicionado (enviados do frontend).
 * @returns {string} O ID do item recém-adicionado.
 */
function adicionarItem(itemData) {
  const sheet = getSheet();
  const headerMap = getHeaderMap(sheet);

  Logger.log('---------- Início de adicionarItem ----------');
  Logger.log('Dados recebidos (itemData): ' + JSON.stringify(itemData));
  Logger.log('HeaderMap (cabeçalho da planilha mapeado): ' + JSON.stringify(headerMap));

  const itemId = generateNewItemId(); // Gera o novo ID sequencial
  itemData.iditem = itemId; // Atribui o ID gerado ao objeto de dados

  // Cria uma nova linha para ser inserida, com o tamanho total das colunas mapeadas.
  const newRow = new Array(Object.keys(headerMap).length).fill('');

  // Preenche a nova linha com os dados do itemData, na ordem correta das colunas.
  for (const key in itemData) {
    const colIndex = headerMap[key.toLowerCase()]; // Usa a chave normalizada para encontrar o índice
    if (colIndex !== undefined) {
      newRow[colIndex] = itemData[key];
    }
  }

  sheet.appendRow(newRow); // Adiciona a nova linha no final da aba
  return itemId;
}

/**
 * Busca e retorna todos os itens da planilha.
 * @returns {Array<Object>} Uma array de objetos, onde cada objeto representa um item.
 */
function listarItens() {
  const sheet = getSheet();
  const range = sheet.getDataRange(); // Pega todos os dados da aba
  const values = range.getValues(); // Converte em um array bidimensional

  // Se o número total de linhas é igual ou menor que a linha do cabeçalho, não há dados de item.
  if (values.length <= HEADER_ROW) {
    return []; // Retorna um array vazio
  }

  const headerMap = getHeaderMap(sheet);
  const data = [];

  // Itera sobre as linhas de dados, começando *após* o cabeçalho.
  // HEADER_ROW é o índice do array para a primeira linha de dados.
  for (let i = HEADER_ROW; i < values.length; i++) {
    const row = values[i];
    const item = {};

    // Mapeia os valores da linha para as propriedades do objeto 'item' usando o headerMap.
    item.iditem = String(row[headerMap['iditem']] || '');
    item.nomedoitem = row[headerMap['nomedoitem']] || '';
    item.tipo = row[headerMap['tipo']] || '';
    item.preco = parseFloat(row[headerMap['preco']] || 0);
    item.estoque = parseInt(row[headerMap['estoque']] || 0);
    item.status = row[headerMap['status']] || '';
    item.observacoes = row[headerMap['observacoes']] || '';
    
    // Adiciona o item ao array de dados se o ID não for vazio (evita linhas em branco no final)
    if (item.iditem.trim() !== '') {
        data.push(item);
    }
  }
  return data;
}

/**
 * Busca um item específico na planilha pelo seu ID.
 * @param {string} id O ID do item a ser buscado.
 * @returns {Object|null} O objeto do item se encontrado, ou null caso contrário.
 */
function buscarItem(id) {
    const sheet = getSheet();
    const range = sheet.getDataRange();
    const values = range.getValues();

    if (values.length <= HEADER_ROW) {
        return null;
    }

    const headerMap = getHeaderMap(sheet);
    const idColIndex = headerMap['iditem'];
    
    if (idColIndex === undefined) {
        throw new Error("Coluna 'ID Item' não encontrada no cabeçalho para busca.");
    }

    // Itera sobre as linhas de dados, começando *após* o cabeçalho.
    for (let i = HEADER_ROW; i < values.length; i++) {
        const row = values[i];
        // Compara o ID da linha com o ID procurado (ambos como string para evitar problemas de tipo)
        if (String(row[idColIndex]) === String(id)) {
            const item = {};
            item.iditem = String(row[headerMap['iditem']] || '');
            item.nomedoitem = row[headerMap['nomedoitem']] || '';
            item.tipo = row[headerMap['tipo']] || '';
            item.preco = parseFloat(row[headerMap['preco']] || 0);
            item.estoque = parseInt(row[headerMap['estoque']] || 0);
            item.status = row[headerMap['status']] || '';
            item.observacoes = row[headerMap['observacoes']] || '';
            return item; // Retorna o item encontrado
        }
    }
    return null; // Item não encontrado
}

/**
 * Edita um item existente na planilha com base no seu ID.
 * @param {Object} itemData Os dados atualizados do item (deve incluir o ID do item).
 * @returns {boolean} True se a edição foi bem-sucedida, false caso contrário.
 */
function editarItem(itemData) {
    const sheet = getSheet();
    const range = sheet.getDataRange();
    const values = range.getValues();

    if (values.length <= HEADER_ROW) {
        return false;
    }

    const headerMap = getHeaderMap(sheet);
    const idColIndex = headerMap['iditem'];
    
    if (idColIndex === undefined) {
        throw new Error("Coluna 'ID Item' não encontrada no cabeçalho para edição.");
    }

    // Itera sobre as linhas de dados, começando *após* o cabeçalho.
    for (let i = HEADER_ROW; i < values.length; i++) {
        const row = values[i];
        // Compara o ID da linha com o ID do item a ser editado
        if (String(row[idColIndex]) === String(itemData.iditem)) {
            const rowNumber = i + 1; // Calcula o número da linha real na planilha (base 1)

            // Cria uma array com os novos valores, na ordem correta das colunas
            const updatedRow = new Array(Object.keys(headerMap).length);
            updatedRow[headerMap['iditem']] = String(itemData.iditem); // Garante que o ID é string
            updatedRow[headerMap['nomedoitem']] = itemData.nomedoitem;
            updatedRow[headerMap['tipo']] = itemData.tipo;
            updatedRow[headerMap['preco']] = itemData.preco;
            updatedRow[headerMap['estoque']] = itemData.estoque;
            updatedRow[headerMap['status']] = itemData.status;
            updatedRow[headerMap['observacoes']] = itemData.observacoes;

            // Define os valores na linha específica da planilha
            sheet.getRange(rowNumber, 1, 1, Object.keys(headerMap).length).setValues([updatedRow]);
            return true; // Edição bem-sucedida
        }
    }
    return false; // Item não encontrado
}

/**
 * Exclui um item da planilha pelo seu ID.
 * @param {string} id O ID do item a ser excluído.
 * @returns {boolean} True se a exclusão foi bem-sucedida, false caso contrário.
 */
function excluirItem(id) {
    const sheet = getSheet();
    const range = sheet.getDataRange();
    const values = range.getValues();

    if (values.length <= HEADER_ROW) {
        return false;
    }

    const headerMap = getHeaderMap(sheet);
    const idColIndex = headerMap['iditem'];
    
    if (idColIndex === undefined) {
        throw new Error("Coluna 'ID Item' não encontrada no cabeçalho para exclusão.");
    }

    // Itera sobre as linhas de dados, começando *após* o cabeçalho.
    for (let i = HEADER_ROW; i < values.length; i++) {
        const row = values[i];
        // Compara o ID da linha com o ID a ser excluído
        if (String(row[idColIndex]) === String(id)) {
            const rowNumber = i + 1; // Calcula o número da linha real na planilha (base 1)
            sheet.deleteRow(rowNumber); // Exclui a linha inteira
            return true; // Exclusão bem-sucedida
        }
    }
    return false; // Item não encontrado
}