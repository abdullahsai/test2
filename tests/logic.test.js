const Logic = require('../Logic.js');

describe('Logic.ensureUniqueEntry', () => {
  test('adds a new entry with normalized name and timestamp', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const result = Logic.ensureUniqueEntry([], ' Alice ', now);
    expect(result.entry).toMatchObject({
      name: 'Alice',
      normalizedName: 'alice',
      createdAt: now.toISOString(),
    });
    expect(result.entries).toHaveLength(1);
  });

  test('throws on duplicate entry regardless of case', () => {
    const existing = [
      { name: 'Alice', normalizedName: 'alice', createdAt: '2024-01-01T12:00:00Z' },
    ];
    expect(() => Logic.ensureUniqueEntry(existing, 'alice')).toThrow(/already exists/i);
  });

  test('throws when entries is not an array', () => {
    expect(() => Logic.ensureUniqueEntry(null, 'Bob')).toThrow('Entries must be an array');
  });

  test('throws when name is empty', () => {
    expect(() => Logic.ensureUniqueEntry([], '  ')).toThrow('cannot be empty');
  });
});

describe('Logic.recordAssignment', () => {
  const entries = [
    { name: 'Alice', normalizedName: 'alice', createdAt: '2024-01-01T12:00:00Z' },
    { name: 'Bob', normalizedName: 'bob', createdAt: '2024-01-02T12:00:00Z' },
  ];

  test('records assignment and uses entry casing', () => {
    const now = new Date('2024-02-01T00:00:00Z');
    const result = Logic.recordAssignment([], entries, 'bob', '15.5', now);
    expect(result.record).toMatchObject({
      name: 'Bob',
      normalizedName: 'bob',
      amount: 15.5,
      createdAt: now.toISOString(),
    });
    expect(result.assignments).toHaveLength(1);
  });

  test('rejects unknown entry', () => {
    expect(() => Logic.recordAssignment([], entries, 'carol', 10)).toThrow('Entry was not found');
  });

  test('rejects invalid number', () => {
    expect(() => Logic.recordAssignment([], entries, 'alice', 'abc')).toThrow('valid number');
  });

  test('throws when assignments is not an array', () => {
    expect(() => Logic.recordAssignment({}, entries, 'alice', 10)).toThrow('Assignments must be an array');
  });
});

describe('Logic.calculateTotals', () => {
  test('aggregates totals per normalized name', () => {
    const assignments = [
      { name: 'Alice', normalizedName: 'alice', amount: 10 },
      { name: 'alice', normalizedName: 'alice', amount: 5 },
      { name: 'Bob', normalizedName: 'bob', amount: 7 },
    ];
    const totals = Logic.calculateTotals(assignments);
    expect(totals).toEqual([
      { name: 'Alice', normalizedName: 'alice', total: 15 },
      { name: 'Bob', normalizedName: 'bob', total: 7 },
    ]);
  });

  test('throws when assignments is not an array', () => {
    expect(() => Logic.calculateTotals(null)).toThrow('Assignments must be an array');
  });
});

describe('Logic.getRecentAssignments', () => {
  test('returns latest assignments sorted by date descending', () => {
    const assignments = [
      { name: 'Alice', createdAt: '2024-01-01T00:00:00Z' },
      { name: 'Bob', createdAt: '2024-01-03T00:00:00Z' },
      { name: 'Carol', createdAt: '2024-01-02T00:00:00Z' },
    ];
    const result = Logic.getRecentAssignments(assignments, 2);
    expect(result.map((item) => item.name)).toEqual(['Bob', 'Carol']);
  });

  test('defaults to five items and validates array input', () => {
    expect(() => Logic.getRecentAssignments(null, 3)).toThrow('Assignments must be an array');
    const assignments = new Array(7).fill(null).map((_, index) => ({
      name: `Name ${index}`,
      createdAt: `2024-01-0${index + 1}T00:00:00Z`,
    }));
    const result = Logic.getRecentAssignments(assignments);
    expect(result).toHaveLength(5);
  });
});
