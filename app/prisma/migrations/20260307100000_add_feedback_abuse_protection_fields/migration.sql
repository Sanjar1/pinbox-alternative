-- Add anonymous abuse-protection fields for feedback voting.
ALTER TABLE "Feedback" ADD COLUMN "deviceHash" TEXT;
ALTER TABLE "Feedback" ADD COLUMN "ipHash" TEXT;
ALTER TABLE "Feedback" ADD COLUMN "userAgentHash" TEXT;

-- Query acceleration for per-device weekly limit and per-IP throttling.
CREATE INDEX "Feedback_storeId_deviceHash_createdAt_idx" ON "Feedback"("storeId", "deviceHash", "createdAt");
CREATE INDEX "Feedback_storeId_ipHash_createdAt_idx" ON "Feedback"("storeId", "ipHash", "createdAt");
