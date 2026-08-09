export type NotificationType =
  | "SHIFT_EDIT_REQUEST_SUBMITTED"
  | "SHIFT_EDIT_REQUEST_APPROVED"
  | "SHIFT_EDIT_REQUEST_REJECTED"
  | "PAYROLL_PAYMENT_RECORDED"
  | "HOURLY_RATE_CHANGED";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  shiftEditRequestId: string | null;
  payrollPaymentId: string | null;
  read: boolean;
  createdAt: string;
}
