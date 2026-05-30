// Vendor domain. Mirrors the `vendors` and `vendor_payment_methods`
// tables in the database schema.

import type { PaymentMethodType } from './enums';
import type { User } from './user';

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

export interface VendorWithRelations extends Vendor {
  owner: User | null;
  paymentMethods: VendorPaymentMethod[];
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
