-- Add soft-delete support: stores are archived, not deleted, so QR codes never break
ALTER TABLE "Store" ADD COLUMN "archivedAt" TIMESTAMP(3);
