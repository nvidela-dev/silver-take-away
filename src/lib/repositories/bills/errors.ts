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
