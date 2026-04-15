-- Widen money columns so large quantity × unitPrice orders do not overflow NUMERIC(10,2).

ALTER TABLE "Order" ALTER COLUMN "totalAmount" TYPE DECIMAL(18,2);

ALTER TABLE "OrderItem" ALTER COLUMN "unitPrice" TYPE DECIMAL(18,2);
ALTER TABLE "OrderItem" ALTER COLUMN "totalPrice" TYPE DECIMAL(18,2);

ALTER TABLE "Estimate" ALTER COLUMN "subtotal" TYPE DECIMAL(18,2);
ALTER TABLE "Estimate" ALTER COLUMN "taxAmount" TYPE DECIMAL(18,2);
ALTER TABLE "Estimate" ALTER COLUMN "shippingAmount" TYPE DECIMAL(18,2);
ALTER TABLE "Estimate" ALTER COLUMN "grandTotal" TYPE DECIMAL(18,2);
