/*
  Warnings:

  - The values [SUPER_ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('CORPORATE_ADMIN', 'CEE', 'VENDOR', 'STORE_OWNER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "assignedCeeId" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "ceeUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_ceeUserId_fkey" FOREIGN KEY ("ceeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedCeeId_fkey" FOREIGN KEY ("assignedCeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
