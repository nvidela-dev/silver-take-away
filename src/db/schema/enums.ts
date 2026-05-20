import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "owner",
  "ap_clerk",
  "approver",
  "employee",
]);

export const billStatusEnum = pgEnum("bill_status", [
  "draft",
  "awaiting_approval",
  "approved",
  "scheduled",
  "initiated",
  "paid",
  "archived",
  "rejected",
  "payment_failed",
]);

export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "ach",
  "wire",
  "check",
  "card",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "scheduled",
  "initiated",
  "in_transit",
  "paid",
  "failed",
  "cancelled",
]);
