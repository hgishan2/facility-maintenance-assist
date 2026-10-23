/**
 * Facility Maintenance Assist — Apps Script starter.
 * Run setupWorkbook() once from the spreadsheet-bound Apps Script project.
 * This file creates the data schema only; production authentication and API
 * deployment must be implemented and tested before live use.
 */
const SHEETS = {
  Settings: ["key", "value"],
  Buildings: ["buildingId", "name", "active", "updatedAt"],
  Equipment: ["equipmentId", "buildingId", "name", "assetTag", "location", "category", "ppmType", "frequency", "vendor", "amcEnd", "lastServiced", "nextDue", "active", "updatedAt"],
  ServiceRecords: ["recordId", "staffId", "deviceId", "buildingId", "equipmentId", "serviceType", "date", "doneBy", "status", "jobRef", "cost", "notes", "createdAt", "receivedAt"],
  Staff: ["staffId", "displayName", "pinHash", "role", "buildingIdsJson", "active", "pinChangedAt", "createdAt", "updatedAt"],
  Devices: ["deviceId", "staffId", "label", "active", "lastSeenAt", "createdAt"],
  AuditLog: ["eventId", "actorStaffId", "deviceId", "action", "recordType", "recordId", "timestamp", "detailsJson"]
};

function setupWorkbook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.entries(SHEETS).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    } else {
      const existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
      if (headers.some((h, i) => existing[i] !== h)) {
        throw new Error("Header mismatch in sheet " + name + ". Do not overwrite existing data; inspect and migrate manually.");
      }
    }
  });
  const settings = ss.getSheetByName("Settings");
  if (settings.getLastRow() === 1) {
    settings.appendRow(["schemaVersion", "1"]);
    settings.appendRow(["timezone", Session.getScriptTimeZone()]);
  }
  return "Workbook schema created.";
}

/** Simple health check only; not an authenticated data endpoint. */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ok:true, app:"Facility Maintenance Assist", schemaVersion:1, message:"API scaffold deployed; authenticated endpoints not configured."}))
    .setMimeType(ContentService.MimeType.JSON);
}
