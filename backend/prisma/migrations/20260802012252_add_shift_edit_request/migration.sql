-- CreateEnum
CREATE TYPE "ShiftEditRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "autoClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "extendedAt" TIMESTAMP(3),
ADD COLUMN     "extendedCutoffAt" TIMESTAMP(3),
ADD COLUMN     "extensionNote" TEXT,
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "shift_edit_requests" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "proposedClockOut" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ShiftEditRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByUserId" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_edit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shift_edit_requests_shiftId_idx" ON "shift_edit_requests"("shiftId");

-- CreateIndex
CREATE INDEX "shift_edit_requests_status_idx" ON "shift_edit_requests"("status");

-- AddForeignKey
ALTER TABLE "shift_edit_requests" ADD CONSTRAINT "shift_edit_requests_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_edit_requests" ADD CONSTRAINT "shift_edit_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_edit_requests" ADD CONSTRAINT "shift_edit_requests_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
