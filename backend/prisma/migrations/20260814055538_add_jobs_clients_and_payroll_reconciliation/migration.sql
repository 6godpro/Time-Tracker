-- DropIndex
DROP INDEX "users_clientId_idx";

-- DropIndex
DROP INDEX "users_currentJobId_idx";

-- AlterTable
ALTER TABLE "shifts" ALTER COLUMN "clockIn" DROP DEFAULT;
