-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accountDeletionTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "accountDeletionTokenHash" TEXT;
