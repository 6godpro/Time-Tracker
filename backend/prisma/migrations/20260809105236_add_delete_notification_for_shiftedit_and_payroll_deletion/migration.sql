-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_payrollPaymentId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_shiftEditRequestId_fkey";

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_shiftEditRequestId_fkey" FOREIGN KEY ("shiftEditRequestId") REFERENCES "shift_edit_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_payrollPaymentId_fkey" FOREIGN KEY ("payrollPaymentId") REFERENCES "payroll_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
