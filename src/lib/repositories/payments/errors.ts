export class PaymentNotFoundError extends Error {
  readonly code = 'PAYMENT_NOT_FOUND';

  constructor(message = 'Payment was not found.') {
    super(message);
    this.name = 'PaymentNotFoundError';
  }
}

export class PaymentConflictError extends Error {
  readonly code = 'PAYMENT_CONFLICT';

  constructor(message = 'Payment changed before this operation completed.') {
    super(message);
    this.name = 'PaymentConflictError';
  }
}
