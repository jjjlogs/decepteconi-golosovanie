/**
 * Этот код нужно вставить в Google Таблицу:
 * Расширения → Apps Script → вставить сюда (заменить весь код) → Deploy →
 * Manage deployments → изменить существующий деплой на New version → Deploy.
 * (Если меняешь код уже после первого деплоя — обязательно нужна New version,
 * иначе изменения не подтянутся на старом URL.)
 */

var SHEET_NAME = 'Votes';
var HEADERS = ['Дата/время', 'ID голосующего', 'Ник', 'Категория (id)', 'Категория (название)', 'Тип', 'ID варианта', 'Ответ', 'Действие'];

function getSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

// Ищет строку с тем же voterId + categoryId (у каждого человека в каждой
// категории может быть только один актуальный голос).
function findRowIndex_(sheet, voterId, categoryId) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === voterId && data[i][3] === categoryId) {
      return i + 1; // строки в Sheets нумеруются с 1
    }
  }
  return -1;
}

function doPost(e) {
  var sheet = getSheet_();
  var data = JSON.parse(e.postData.contents);
  var rowIndex = findRowIndex_(sheet, data.voterId, data.categoryId);

  if (data.action === 'unvote') {
    if (rowIndex !== -1) sheet.deleteRow(rowIndex);
  } else {
    var rowValues = [
      new Date(),
      data.voterId || '',
      data.nickname || '',
      data.categoryId || '',
      data.categoryTitle || '',
      data.type || '',
      data.optionId || '',
      data.answer || '',
      data.action || 'vote'
    ];
    if (rowIndex !== -1) {
      // Перезаписываем существующий голос (человек передумал и выбрал другое).
      sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var params = (e && e.parameter) || {};

  if (params.action === 'results') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var results = {}; // { "Категория": { "Вариант": количество } }

    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var categoryTitle = data[i][4];
        var answer = data[i][7];
        if (!categoryTitle || !answer) continue;
        if (!results[categoryTitle]) results[categoryTitle] = {};
        results[categoryTitle][answer] = (results[categoryTitle][answer] || 0) + 1;
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, results: results }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, info: 'Decepticon Awards voting endpoint is alive' }))
    .setMimeType(ContentService.MimeType.JSON);
}
