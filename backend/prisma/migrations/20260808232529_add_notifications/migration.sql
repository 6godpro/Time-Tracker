-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SHIFT_EDIT_REQUEST_APPROVED', 'SHIFT_EDIT_REQUEST_REJECTED', 'PAYROLL_PAYMENT_RECORDED');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "shiftEditRequestId" TEXT,
    "payrollPaymentId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_shiftEditRequestId_fkey" FOREIGN KEY ("shiftEditRequestId") REFERENCES "shift_edit_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_payrollPaymentId_fkey" FOREIGN KEY ("payrollPaymentId") REFERENCES "payroll_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
