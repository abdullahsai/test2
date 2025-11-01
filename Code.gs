/* global Logic */

var SPREADSHEET_NAME = 'Entries Assignments Store';
var ENTRIES_SHEET_NAME = 'Entries';
var ASSIGNMENTS_SHEET_NAME = 'Assignments';
var RECENT_ASSIGNMENTS_LIMIT = 5;

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet() {
  var data = getInitialState_();
  var template = HtmlService.createTemplateFromFile('Index');
  template.appData = data;
  return template
    .evaluate()
    .setTitle('Entries Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function fetchEntries() {
  return handleRequest_(function () {
    return { entries: loadEntries_() };
  });
}

function createEntry(name) {
  return handleRequest_(function () {
    return withLock_(function () {
      var entries = loadEntries_();
      var result = Logic.ensureUniqueEntry(entries, name, new Date());
      persistEntry_(result.entry);
      return { entries: loadEntries_() };
    });
  });
}

function fetchRecentAssignments(limit) {
  return handleRequest_(function () {
    var assignments = loadAssignments_();
    return {
      recentAssignments: Logic.getRecentAssignments(assignments, limit || RECENT_ASSIGNMENTS_LIMIT),
    };
  });
}

function createAssignment(name, amount) {
  return handleRequest_(function () {
    return withLock_(function () {
      var entries = loadEntries_();
      var assignments = loadAssignments_();
      var result = Logic.recordAssignment(assignments, entries, name, amount, new Date());
      persistAssignment_(result.record);
      var freshAssignments = loadAssignments_();
      return {
        recentAssignments: Logic.getRecentAssignments(freshAssignments, RECENT_ASSIGNMENTS_LIMIT),
        totals: Logic.calculateTotals(freshAssignments),
      };
    });
  });
}

function fetchDashboard() {
  return handleRequest_(function () {
    return { totals: Logic.calculateTotals(loadAssignments_()) };
  });
}

function handleRequest_(callback) {
  try {
    return { success: true, data: callback() };
  } catch (error) {
    return {
      success: false,
      message: error && error.message ? error.message : 'Unexpected error',
      code: error && error.code ? error.code : 'UNKNOWN',
    };
  }
}

function withLock_(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function getInitialState_() {
  var entries = loadEntries_();
  var assignments = loadAssignments_();
  return {
    entries: entries,
    recentAssignments: Logic.getRecentAssignments(assignments, RECENT_ASSIGNMENTS_LIMIT),
    totals: Logic.calculateTotals(assignments),
  };
}

function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('PRIMARY_SPREADSHEET_ID');
  var spreadsheet;
  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    props.setProperty('PRIMARY_SPREADSHEET_ID', spreadsheet.getId());
  }
  ensureSheets_(spreadsheet);
  return spreadsheet;
}

function ensureSheets_(spreadsheet) {
  if (!spreadsheet.getSheetByName(ENTRIES_SHEET_NAME)) {
    var entriesSheet = spreadsheet.insertSheet(ENTRIES_SHEET_NAME);
    entriesSheet.getRange(1, 1, 1, 3).setValues([['Name', 'Normalized', 'Created At']]);
  }
  if (!spreadsheet.getSheetByName(ASSIGNMENTS_SHEET_NAME)) {
    var assignmentsSheet = spreadsheet.insertSheet(ASSIGNMENTS_SHEET_NAME);
    assignmentsSheet.getRange(1, 1, 1, 4).setValues([['Name', 'Normalized', 'Amount', 'Created At']]);
  }
}

function loadEntries_() {
  var sheet = getSpreadsheet_().getSheetByName(ENTRIES_SHEET_NAME);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  var values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  var entries = values
    .filter(function (row) {
      return row[0];
    })
    .map(function (row) {
      return {
        name: row[0],
        normalizedName: row[1] || Logic.normalizeName(row[0]),
        createdAt: row[2],
      };
    });
  return Logic.sortEntries(entries);
}

function persistEntry_(entry) {
  var sheet = getSpreadsheet_().getSheetByName(ENTRIES_SHEET_NAME);
  sheet.insertRowsAfter(1, 1);
  sheet.getRange(2, 1, 1, 3).setValues([[entry.name, entry.normalizedName, entry.createdAt]]);
}

function loadAssignments_() {
  var sheet = getSpreadsheet_().getSheetByName(ASSIGNMENTS_SHEET_NAME);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  var values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  return values
    .filter(function (row) {
      return row[0];
    })
    .map(function (row) {
      return {
        name: row[0],
        normalizedName: row[1] || Logic.normalizeName(row[0]),
        amount: Number(row[2]),
        createdAt: row[3],
      };
    });
}

function persistAssignment_(record) {
  var sheet = getSpreadsheet_().getSheetByName(ASSIGNMENTS_SHEET_NAME);
  sheet.appendRow([record.name, record.normalizedName, record.amount, record.createdAt]);
}
