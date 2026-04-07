-- Add CORPORATE_ADMIN to UserRole (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'CORPORATE_ADMIN'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'CORPORATE_ADMIN';
  END IF;
END $$;

-- Store → assigned CEE (territory manager)
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "ceeUserId" TEXT;

-- Order → CEE queue (snapshot at placement)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "assignedCeeId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Store_ceeUserId_fkey'
  ) THEN
    ALTER TABLE "Store"
    ADD CONSTRAINT "Store_ceeUserId_fkey"
    FOREIGN KEY ("ceeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Order_assignedCeeId_fkey'
  ) THEN
    ALTER TABLE "Order"
    ADD CONSTRAINT "Order_assignedCeeId_fkey"
    FOREIGN KEY ("assignedCeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Store_ceeUserId_idx" ON "Store"("ceeUserId");
CREATE INDEX IF NOT EXISTS "Order_assignedCeeId_idx" ON "Order"("assignedCeeId");
