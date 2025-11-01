var Logic = (function () {
  function createError(code, message) {
    var error = new Error(message);
    error.code = code;
    return error;
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      throw createError('ENTRY_INVALID_TYPE', 'Name must be a string.');
    }
    return name.trim().toLowerCase();
  }

  function sanitizeName(rawName) {
    if (typeof rawName !== 'string') {
      throw createError('ENTRY_INVALID_TYPE', 'Name must be a string.');
    }
    var trimmed = rawName.trim();
    if (!trimmed) {
      throw createError('ENTRY_EMPTY', 'Name cannot be empty.');
    }
    return trimmed;
  }

  function sortEntries(entries) {
    return entries
      .slice()
      .sort(function (a, b) {
        var aTime = new Date(a.createdAt).getTime();
        var bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
  }

  function ensureUniqueEntry(entries, rawName, now) {
    if (!Array.isArray(entries)) {
      throw createError('ENTRY_INVALID_COLLECTION', 'Entries must be an array.');
    }
    var timestamp = now instanceof Date ? now.toISOString() : new Date().toISOString();
    var name = sanitizeName(rawName);
    var normalized = normalizeName(name);
    var duplicate = entries.some(function (entry) {
      return entry.normalizedName === normalized;
    });
    if (duplicate) {
      throw createError('ENTRY_DUPLICATE', 'This entry already exists.');
    }
    var entry = {
      name: name,
      normalizedName: normalized,
      createdAt: timestamp,
    };
    return {
      entries: [entry].concat(sortEntries(entries)),
      entry: entry,
    };
  }

  function validateAmount(value) {
    var number = typeof value === 'number' ? value : parseFloat(value);
    if (!isFinite(number) || isNaN(number)) {
      throw createError('ASSIGN_INVALID_NUMBER', 'Amount must be a valid number.');
    }
    return number;
  }

  function resolveEntry(entries, name) {
    var normalized = normalizeName(name);
    for (var i = 0; i < entries.length; i += 1) {
      if (entries[i].normalizedName === normalized) {
        return entries[i];
      }
    }
    throw createError('ASSIGN_UNKNOWN_ENTRY', 'Entry was not found.');
  }

  function recordAssignment(assignments, entries, name, amount, now) {
    if (!Array.isArray(assignments)) {
      throw createError('ASSIGN_INVALID_COLLECTION', 'Assignments must be an array.');
    }
    if (!Array.isArray(entries)) {
      throw createError('ASSIGN_INVALID_ENTRIES', 'Entries must be an array.');
    }
    var timestamp = now instanceof Date ? now.toISOString() : new Date().toISOString();
    var entry = resolveEntry(entries, name);
    var numericAmount = validateAmount(amount);
    var record = {
      name: entry.name,
      normalizedName: entry.normalizedName,
      amount: numericAmount,
      createdAt: timestamp,
    };
    return {
      assignments: assignments.concat([record]),
      record: record,
    };
  }

  function calculateTotals(assignments) {
    if (!Array.isArray(assignments)) {
      throw createError('SUMMARY_INVALID_COLLECTION', 'Assignments must be an array.');
    }
    var totalsMap = assignments.reduce(function (acc, record) {
      var key = record.normalizedName || normalizeName(record.name);
      if (!acc[key]) {
        acc[key] = {
          name: record.name,
          normalizedName: key,
          total: 0,
        };
      }
      acc[key].total += Number(record.amount) || 0;
      return acc;
    }, {});
    return Object.keys(totalsMap)
      .map(function (key) {
        return totalsMap[key];
      })
      .sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });
  }

  function getRecentAssignments(assignments, limit) {
    if (!Array.isArray(assignments)) {
      throw createError('SUMMARY_INVALID_COLLECTION', 'Assignments must be an array.');
    }
    var max = typeof limit === 'number' && limit > 0 ? Math.floor(limit) : 5;
    return assignments
      .slice()
      .sort(function (a, b) {
        var aTime = new Date(a.createdAt).getTime();
        var bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      })
      .slice(0, max);
  }

  return {
    ensureUniqueEntry: ensureUniqueEntry,
    recordAssignment: recordAssignment,
    calculateTotals: calculateTotals,
    getRecentAssignments: getRecentAssignments,
    sortEntries: sortEntries,
    normalizeName: normalizeName,
    sanitizeName: sanitizeName,
    validateAmount: validateAmount,
    createError: createError,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logic;
}
