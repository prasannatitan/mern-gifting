-- Legacy SUPER_ADMIN users become corporate admins
UPDATE "User" SET role = 'CORPORATE_ADMIN' WHERE role::text = 'SUPER_ADMIN';

-- PostgreSQL: replace enum (drop SUPER_ADMIN label)
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('CORPORATE_ADMIN', 'CEE', 'VENDOR', 'STORE_OWNER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");
DROP TYPE "UserRole_old";
