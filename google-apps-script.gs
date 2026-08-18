/**
 * Этот код нужно вставить в Google Таблицу:
 * Расширения → Apps Script → вставить сюда → Deploy → New deployment → Web app.
 * Подробная инструкция — в README.md.
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Votes');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Votes');
    sheet.appendRow(['Дата/время', 'ID голосующего', 'Категория (id)', 'Категория (название)', 'Тип', 'ID варианта', 'Ответ', 'Действие']);
  }

  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.voterId || '',
    data.categoryId || '',
    data.categoryTitle || '',
    data.type || '',
    data.optionId || '',
    data.answer || '',
    data.action || 'vote'
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, info: 'Decepticon Awards voting endpoint is alive' }))
    .setMimeType(ContentService.MimeType.JSON);
}
