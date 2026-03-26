/*
Google Apps Script для общего журнала заявок.

Как использовать:
1) Создайте Google Sheet, назовите лист "Bookings".
2) Вставьте этот код в script.google.com.
3) В PROJECT SETTINGS добавьте Script property:
   SPREADSHEET_ID = <ID вашей таблицы>
4) Deploy -> New deployment -> Web app:
   - Execute as: Me
   - Who has access: Anyone
5) Скопируйте URL веб-приложения и вставьте в config.js:
   window.BOOKINGS_API_URL = "https://script.google.com/macros/s/.../exec";
*/

function getSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("SPREADSHEET_ID is not configured");

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getSheetByName("Bookings");
  if (!sheet) sheet = spreadsheet.insertSheet("Bookings");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["id", "createdAt", "createdAtLocal", "name", "phone", "service"]);
  }

  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const sheet = getSheet_();

    const id = payload.id || new Date().getTime();
    const createdAt = payload.createdAt || new Date().toISOString();
    const createdAtLocal = payload.createdAtLocal || Utilities.formatDate(new Date(), "Europe/Moscow", "dd.MM.yyyy HH:mm:ss");
    const name = payload.name || "";
    const phone = payload.phone || "";
    const service = payload.service || "";

    sheet.appendRow([id, createdAt, createdAtLocal, name, phone, service]);

    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    const mode = (e.parameter.mode || "").toLowerCase();
    const sheet = getSheet_();

    if (mode !== "list") {
      return jsonResponse_({ ok: true, message: "Use ?mode=list to get bookings" });
    }

    const values = sheet.getDataRange().getValues();
    const rows = values.slice(1).map(function (row) {
      return {
        id: row[0],
        createdAt: row[1],
        createdAtLocal: row[2],
        name: row[3],
        phone: row[4],
        service: row[5],
      };
    });

    return jsonResponse_({ ok: true, bookings: rows });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err), bookings: [] });
  }
}

