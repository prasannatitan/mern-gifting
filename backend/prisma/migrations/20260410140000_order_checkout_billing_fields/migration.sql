-- Store checkout billing / location details on the order for CEE and vendor visibility.

ALTER TABLE "Order" ADD COLUMN "contactName" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingState" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingCity" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingPincode" TEXT;
ALTER TABLE "Order" ADD COLUMN "gstNumber" TEXT;
