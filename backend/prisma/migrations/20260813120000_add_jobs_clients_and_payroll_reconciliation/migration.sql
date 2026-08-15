-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_name_key" ON "clients"("name");

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minimumWorkMinutes" INTEGER NOT NULL,
    "breakIsPaidByDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_name_key" ON "jobs"("name");

-- Backfill: one Job row per distinct jobTitle value already in use,
-- carrying over the same daily-minimum assumptions the app used to
-- hardcode (Cold Caller: 4h, everything else: 8h). Admins can adjust
-- these from the new Job management screen afterwards.
INSERT INTO "jobs" ("id", "name", "minimumWorkMinutes", "breakIsPaidByDefault", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text,
       "jobTitle",
       CASE "jobTitle"
         WHEN 'Cold Caller' THEN 240
         ELSE 480
       END,
       false,
       true,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "jobTitle" FROM "users") AS distinct_titles;

-- In case no user rows exist yet (fresh database), seed the same three
-- jobs the static JOB_TITLES array used to define, so registration has
-- something to select from.
INSERT INTO "jobs" ("id", "name", "minimumWorkMinutes", "breakIsPaidByDefault", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.name, v.minutes, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('Cold Caller', 240),
  ('Customer Care Representative', 480),
  ('DevOps Engineer', 480),
  ('Telemarketer', 120)
) AS v(name, minutes)
WHERE NOT EXISTS (SELECT 1 FROM "jobs" WHERE "jobs"."name" = v.name);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentJobId" TEXT,
ADD COLUMN     "breakIsPaidOverride" BOOLEAN,
ADD COLUMN     "clientId" TEXT;

UPDATE "users" SET "currentJobId" = "jobs"."id"
FROM "jobs"
WHERE "jobs"."name" = "users"."jobTitle";

ALTER TABLE "users" ALTER COLUMN "currentJobId" SET NOT NULL;

ALTER TABLE "users" DROP COLUMN "jobTitle";

-- CreateIndex
CREATE INDEX "users_currentJobId_idx" ON "users"("currentJobId");

-- CreateIndex
CREATE INDEX "users_clientId_idx" ON "users"("clientId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_currentJobId_fkey" FOREIGN KEY ("currentJobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "minimumWorkMinutesAtClockIn" INTEGER;

-- Historical shifts never recorded which job was active at clock-in, so
-- this backfills from each shift's user's CURRENT job — a documented
-- approximation (see the schema comment on Shift.jobId), not a true
-- historical reconstruction.
UPDATE "shifts" SET "jobId" = "users"."currentJobId",
                     "minimumWorkMinutesAtClockIn" = "jobs"."minimumWorkMinutes"
FROM "users", "jobs"
WHERE "shifts"."userId" = "users"."id"
  AND "jobs"."id" = "users"."currentJobId";

ALTER TABLE "shifts" ALTER COLUMN "jobId" SET NOT NULL,
ALTER COLUMN "minimumWorkMinutesAtClockIn" SET NOT NULL;

ALTER TABLE "shifts" DROP COLUMN "extendedCutoffAt",
DROP COLUMN "extensionNote",
DROP COLUMN "extendedAt";

-- CreateIndex
CREATE INDEX "shifts_jobId_idx" ON "shifts"("jobId");

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'CLEAN', 'FLAGGED', 'RESOLVED');

-- CreateTable
CREATE TABLE "payroll_reconciliations" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "systemRegularDurationMs" DOUBLE PRECISION NOT NULL,
    "systemBreakDurationMs" DOUBLE PRECISION NOT NULL,
    "systemOvertimeDurationMs" DOUBLE PRECISION NOT NULL,
    "clientRegularDurationMs" DOUBLE PRECISION,
    "clientBreakDurationMs" DOUBLE PRECISION,
    "clientOvertimeDurationMs" DOUBLE PRECISION,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedRegularDurationMs" DOUBLE PRECISION,
    "resolvedBreakDurationMs" DOUBLE PRECISION,
    "resolvedOvertimeDurationMs" DOUBLE PRECISION,
    "resolutionReason" TEXT,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_reconciliations_employeeId_idx" ON "payroll_reconciliations"("employeeId");

-- CreateIndex
CREATE INDEX "payroll_reconciliations_status_idx" ON "payroll_reconciliations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_reconciliations_employeeId_periodFrom_periodTo_key" ON "payroll_reconciliations"("employeeId", "periodFrom", "periodTo");

-- AddForeignKey
ALTER TABLE "payroll_reconciliations" ADD CONSTRAINT "payroll_reconciliations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_reconciliations" ADD CONSTRAINT "payroll_reconciliations_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "payroll_payments" ADD COLUMN     "regularDurationMs" DOUBLE PRECISION,
ADD COLUMN     "overtimeDurationMs" DOUBLE PRECISION,
ADD COLUMN     "compensatedBreakDurationMs" DOUBLE PRECISION,
ADD COLUMN     "reconciliationId" TEXT;

-- Existing payments predate the regular/overtime split and paid-break
-- concept entirely — treat their full workedDurationMs as regular time
-- with no overtime or compensated break, rather than guessing a split.
UPDATE "payroll_payments" SET "regularDurationMs" = "workedDurationMs",
                               "overtimeDurationMs" = 0,
                               "compensatedBreakDurationMs" = 0;

ALTER TABLE "payroll_payments" ALTER COLUMN "regularDurationMs" SET NOT NULL,
ALTER COLUMN "overtimeDurationMs" SET NOT NULL,
ALTER COLUMN "compensatedBreakDurationMs" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payroll_payments_reconciliationId_key" ON "payroll_payments"("reconciliationId");

-- AddForeignKey
ALTER TABLE "payroll_payments" ADD CONSTRAINT "payroll_payments_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "payroll_reconciliations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
