-- Add checkout phone and address fields on orders.

ALTER TABLE "Order" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingAddress" TEXT;
