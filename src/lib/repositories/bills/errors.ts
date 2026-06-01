export class BillNotFoundError extends Error {
  readonly code = 'BILL_NOT_FOUND';

  constructor(message = 'Bill was not found.') {
    super(message);
    this.name = 'BillNotFoundError';
  }
}

export class BillConflictError extends Error {
  readonly code = 'BILL_CONFLICT';

  constructor(message = 'Bill changed before this operation completed.') {
    super(message);
    this.name = 'BillConflictError';
  }
}

export class BillBulkConflictError extends Error {
  readonly code = 'BILL_BULK_CONFLICT';

  constructor(
    readonly expected: number,
    readonly actual: number,
    message = `Expected ${expected} bills to match, but only ${actual} did. `
      + 'Some bills changed before this operation completed.',
  ) {
    super(message);
    this.name = 'BillBulkConflictError';
  }
}
