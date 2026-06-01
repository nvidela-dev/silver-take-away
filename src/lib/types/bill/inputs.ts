// Server-action / use-case input shapes for the bill workspace. These
// are wire-format types (decimal amounts as strings, dates as ISO
// strings) consumed by the Zod schemas in lib/validators.

export interface CreateBillInput {
  vendorId: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount: string;
  currency?: string;
  description?: string;
  invoiceUrl?: string;
  lineItems: {
    description?: string;
    amount: string;
    categoryId?: string;
  }[];
}

export interface UpdateBillInput {
  id: string;
  expectedUpdatedAt?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount?: string;
  currency?: string;
  description?: string;
  invoiceUrl?: string;
  lineItems?: {
    id?: string;
    description?: string;
    amount: string;
    categoryId?: string;
  }[];
}

export interface BulkEditBillsInput {
  billIds: string[];
  dueDate?: string;
  invoiceDate?: string;
  amount?: string;
  description?: string;
  categoryId?: string;
}

export interface SubmitForApprovalInput {
  billId: string;
}

export interface ApproveBillInput {
  billId: string;
  note?: string;
}

export interface RejectBillInput {
  billId: string;
  note: string;
}

export interface BulkSubmitForApprovalInput {
  billIds: string[];
}

export interface BulkApproveBillsInput {
  billIds: string[];
  note?: string;
}

export interface BulkRejectBillsInput {
  billIds: string[];
  note: string;
}

export interface BulkDeleteDraftsInput {
  billIds: string[];
}
