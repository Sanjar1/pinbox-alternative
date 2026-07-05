-- Drop the canary column added by 20260705120000. Reviewed destructive change:
-- the column was created empty minutes earlier and never written to.
-- This also proves a reviewed DROP flows safely through migrate deploy
-- (unlike db push, which would demand --accept-data-loss).
ALTER TABLE "Store" DROP COLUMN "migrationCanaryAt";
