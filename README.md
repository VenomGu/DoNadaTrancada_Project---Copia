📦 Controle de Estoque DoNadaTrancada
Bem-vindo ao sistema de Controle de Estoque DoNadaTrancada! Este projeto é uma aplicação web simples e eficaz, construída com Google Apps Script, que permite gerenciar o inventário de produtos usando uma planilha Google Sheets como banco de dados. A interface é amigável e otimizada para dispositivos móveis, apresentando os itens em um formato de cards de fácil visualização.

✨ Recursos
Listagem de Itens em Cards: Visualize seu estoque de forma clara e intuitiva, com cada item exibido em um card individual.

Valor Total do Estoque: Acompanhe o valor monetário total do seu inventário em tempo real.

Pesquisa Dinâmica: Encontre itens rapidamente pesquisando por nome, ID ou tipo.

Filtro por Status: Filtre os itens com base em seu status (Em estoque, Comprar novamente, Esgotado).

Gerenciamento Completo (CRUD):

Adicionar Novos Itens: Inclua novos produtos ao seu estoque através de um formulário intuitivo, com geração automática de ID sequencial.

Editar Itens Existentes: Atualize informações de produtos já cadastrados.

Excluir Itens: Remova produtos do inventário com confirmação.

Status Visuais: Cores distintas para os status dos produtos nos cards, facilitando a identificação rápida:

Em estoque: Azul

Comprar novamente: Amarelo

Esgotado: Vermelho

Design Responsivo: Interface otimizada para funcionar bem em diferentes tamanhos de tela, desde desktops até smartphones.

Feedback ao Usuário: Mensagens de sucesso ou erro são exibidas para orientar as ações do usuário.

🚀 Como Usar
Para configurar e usar este projeto, você precisará de uma conta Google e acesso ao Google Sheets e Google Apps Script.

1. Preparar a Planilha Google Sheets
Este projeto usa uma planilha Google Sheets como seu banco de dados.

Crie uma nova planilha no Google Sheets (ex: "Estoque DoNadaTrancada").

Anote o ID da Planilha (o longo código alfanumérico na URL da planilha, entre /d/ e /edit). Você precisará dele para configurar o SPREADSHEET_ID no código.

Renomeie a primeira aba da planilha para Estoque.

Na primeira linha (HEADER_ROW = 1) da aba Estoque, crie as seguintes colunas exatamente com esses nomes:

ID Item

Nome do Item

Tipo

Preço

Estoque

Status

Observações

Importante:

Os valores da coluna Status devem ser padronizados para Em estoque, Comprar novamente ou Esgotado para que a coloração da interface funcione corretamente.

Certifique-se de que não há acentos nessas palavras na planilha, assim como nos values do HTML para garantir a correspondência com as classes CSS.

2. Configurar o Google Apps Script
No Google Sheets, vá em Extensões > Apps Script. Isso abrirá o editor de Apps Script em uma nova aba.

No editor, crie os seguintes arquivos de código (se ainda não existirem) e cole o conteúdo fornecido:

GlobalConfig.gs:

JavaScript

const SPREADSHEET_ID = "SEU_ID_DA_PLANILHA_AQUI"; // ID da sua planilha Google Sheets
const SHEET_NAME = "Estoque"; // Nome da aba onde os dados de estoque estão
const HEADER_ROW = 1; // Linha onde o cabeçalho da tabela de dados começa (normalmente a primeira linha)
ATENÇÃO: Substitua "SEU_ID_DA_PLANILHA_AQUI" pelo ID real da sua planilha Google Sheets.

WebApp.gs:

JavaScript

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
DataHandler.gs:

JavaScript

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
CrudOperations.gs:

JavaScript

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
Crie um novo arquivo HTML: Clique em Arquivo > Novo > Arquivo HTML. Nomeie-o como Index.html (note o "I" maiúsculo, correspondendo ao doGet).

Cole todo o código HTML e JavaScript (que você me forneceu anteriormente, incluindo o CSS dentro das tags <style> e JS dentro das tags <script>) dentro deste Index.html recém-criado.

Salve todos os arquivos (Ctrl + S ou Cmd + S).

3. Publicar o Aplicativo Web
No editor do Apps Script, clique em Implantar (canto superior direito) > Nova implantação.

Clique no ícone de engrenagem (⚙️) e selecione Aplicativo da web.

Configure:

Executar como: Minha própria conta (seu e-mail).

Quem tem acesso: Qualquer pessoa (para facilitar o acesso; você pode restringir para "Qualquer pessoa com conta Google" se preferir mais segurança).

Clique em Implantar.

Na primeira vez, o Google pedirá autorização. Siga os passos:

Clique em Autorizar acesso.

Selecione sua conta Google.

Clique em Avançado e depois em Acessar Controle de Estoque DoNadaTrancada (não seguro).

Clique em Permitir.

Após a autorização, você receberá a URL do aplicativo web. Copie esta URL.

🔗 Acessando o Aplicativo
Cole a URL do aplicativo web que você copiou no seu navegador. Você verá a interface do controle de estoque, pronta para ser usada!

🛠️ Estrutura do Código
O projeto está dividido em vários arquivos .gs para melhor organização e modularidade do código backend:

GlobalConfig.gs: Contém variáveis de configuração globais, como o ID da planilha, o nome da aba e a linha do cabeçalho.

WebApp.gs: Lida com a parte de servidor web do Google Apps Script, servindo o arquivo Index.html para o navegador.

DataHandler.gs: Contém funções utilitárias para interagir com a planilha, como obter a aba correta, mapear cabeçalhos de coluna e gerar novos IDs de item.

CrudOperations.gs: Implementa as principais operações de gerenciamento de dados (Create, Read, Update, Delete) com a planilha.

O frontend (Index.html) inclui HTML para a estrutura, CSS para o estilo responsivo e JavaScript para a interatividade e comunicação com as funções do Google Apps Script.

🤝 Contribuição
Contribuições são bem-vindas! Se você tiver sugestões de melhorias, detecção de bugs ou novas funcionalidades, sinta-se à vontade para:

Abrir uma Issue descrevendo sua sugestão ou problema.

Criar um Pull Request com suas alterações (se for um desenvolvedor).

📝 Licença
Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
