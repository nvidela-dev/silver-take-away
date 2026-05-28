// ---- Enums ----

export type UserRole = 'admin' | 'owner' | 'ap_clerk' | 'approver' | 'employee';

export type BillStatus = | 'draft'
  | 'awaiting_approval'
  | 'approved'
  | 'scheduled'
  | 'initiated'
  | 'paid'
  | 'archived'
  | 'rejected'
  | 'payment_failed';

export type PaymentMethodType = 'ach' | 'wire' | 'check' | 'card';

export type PaymentStatus = | 'pending'
  | 'scheduled'
  | 'initiated'
  | 'in_transit'
  | 'paid'
  | 'failed'
  | 'cancelled';

// ---- Core Entities ----

export interface User {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorPaymentMethod {
  id: string;
  vendorId: string;
  methodType: PaymentMethodType;
  isDefault: boolean;
  bankName: string | null;
  accountNumberLast4: string | null;
  routingNumberLast4: string | null;
  mailingAddress: string | null;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Bill {
  id: string;
  vendorId: string;
  createdBy: string;
  status: BillStatus;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  amount: string;
  currency: string;
  description: string | null;
  invoiceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillLineItem {
  id: string;
  billId: string;
  description: string | null;
  amount: string;
  categoryId: string | null;
  sortOrder: number;
}

export interface Payment {
  id: string;
  billId: string;
  createdBy: string;
  amount: string;
  paymentMethod: PaymentMethodType;
  status: PaymentStatus;
  scheduledDate: string | null;
  initiatedDate: Date | null;
  arrivalDate: string | null;
  cancelledAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillActivityLog {
  id: string;
  billId: string;
  actorId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ---- Composite / View Types ----

export interface BillWithRelations extends Bill {
  vendor: Vendor;
  creator: User;
  lineItems: BillLineItem[];
  payments: Payment[];
}

export interface DraftBillListItem extends Bill {
  vendor: Pick<Vendor, 'id' | 'name' | 'email' | 'ownerId'>;
  creator: Pick<User, 'id' | 'email' | 'fullName' | 'role'>;
  lineItems: (BillLineItem & { category: Category | null })[];
  lineItemCount: number;
}

export interface BillFormOptions {
  vendors: Pick<Vendor, 'id' | 'name' | 'email' | 'ownerId'>[];
  categories: Pick<Category, 'id' | 'name'>[];
}

export interface PaymentWithRelations extends Payment {
  bill: Bill & { vendor: Vendor };
  creator: User;
}

export interface VendorWithRelations extends Vendor {
  owner: User | null;
  paymentMethods: VendorPaymentMethod[];
}

// ---- Table / Filter Types ----

export type BillTab = | 'overview'
  | 'drafts'
  | 'approvals'
  | 'payment'
  | 'history';

export type PaymentTab = 'overview' | 'needs_review' | 'pending' | 'history';

export interface BillFilters {
  search?: string;
  vendorId?: string;
  vendorOwnerId?: string;
  status?: BillStatus[];
  isUnscheduled?: boolean;
  amountMin?: number;
  amountMax?: number;
  paymentMethod?: PaymentMethodType;
  categoryId?: string;
  excludeCategoryId?: string;
  invoiceDateFrom?: string;
  invoiceDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface PaymentFilters {
  search?: string;
  vendorId?: string;
  status?: PaymentStatus[];
  amountMin?: number;
  amountMax?: number;
  paymentMethod?: PaymentMethodType;
  arrivalDateFrom?: string;
  arrivalDateTo?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

// ---- Server Action Input Types ----

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

export interface SchedulePaymentInput {
  billId: string;
  paymentMethod: PaymentMethodType;
  scheduledDate: string;
}

export interface ApproveRejectInput {
  billId: string;
  note?: string;
}

export interface CreateVendorInput {
  name: string;
  email?: string;
  ownerId?: string;
  paymentMethods?: {
    methodType: PaymentMethodType;
    isDefault?: boolean;
    bankName?: string;
    accountNumberLast4?: string;
    routingNumberLast4?: string;
    mailingAddress?: string;
  }[];
}

export interface UpdateVendorInput {
  id: string;
  name?: string;
  email?: string;
  ownerId?: string | null;
}

export * from './ui';

// ---- State Machine ----

export type BillActionType = | 'submit_for_approval'
  | 'approve'
  | 'reject'
  | 'schedule_payment'
  | 'initiate_payment'
  | 'mark_as_paid'
  | 'cancel_payment'
  | 'retry_payment'
  | 'archive'
  | 'unschedule'
  | 'delete';

// ---- Server Action Signatures (reference, implemented in lib/actions/*) ----
//
// Bills:
//   createBill(input: CreateBillInput)
//   updateBill(input: UpdateBillInput)
//   submitForApproval(billId: string)
//   approveBill(input: ApproveRejectInput)
//   rejectBill(input: ApproveRejectInput)
//   schedulePayment(input: SchedulePaymentInput)
//   initiatePayment(billId: string)
//   markBillAsPaid(billId: string)
//   cancelPayment(billId: string)
//   retryPayment(billId: string)
//   archiveBill(billId: string)
//   unschedulePayment(billId: string)
//   deleteBill(billId: string)
//   bulkApproveBills(billIds: string[])
//   bulkEditBills(input: BulkEditBillsInput)
//   bulkDeleteBills(billIds: string[])
//
// Vendors:
//   createVendor(input: CreateVendorInput)
//   updateVendor(input: UpdateVendorInput)
//   deleteVendor(id: string)
//   setDefaultPaymentMethod(vendorId: string, paymentMethodId: string)

// ---- Result envelope ----

export type ActionResult<T> = | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
