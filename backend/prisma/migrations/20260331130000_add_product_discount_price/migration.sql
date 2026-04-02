-- AlterTable
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "discountPrice" DECIMAL(10,2);
