export class PaymentNotFoundError extends Error {
  readonly code = 'PAYMENT_NOT_FOUND';

  constructor(message: string = 'Payment was not found.') {
    super(message);
    this.name = 'PaymentNotFoundError';
  }
}

export class PaymentConflictError extends Error {
  readonly code = 'PAYMENT_CONFLICT';

  constructor(message: string = 'Payment changed before this operation completed.') {
    super(message);
    this.name = 'PaymentConflictError';
  }
}

export class PaymentBulkConflictError extends Error {
  readonly code = 'PAYMENT_BULK_CONFLICT';

  constructor(
    readonly expected: number,
    readonly actual: number,
    message: string = `Expected ${expected} payments to match, but only ${actual} did. `
      + 'Some payments changed before this operation completed.',
  ) {
    super(message);
    this.name = 'PaymentBulkConflictError';
  }
}
