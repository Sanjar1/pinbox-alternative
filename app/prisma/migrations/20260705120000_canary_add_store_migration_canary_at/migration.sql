-- Canary migration: proves schema changes auto-apply on deploy (2026-07-05 pipeline fix).
-- Nullable column, no data touched. Dropped again in the follow-up canary migration.
ALTER TABLE "Store" ADD COLUMN "migrationCanaryAt" TIMESTAMP(3);
