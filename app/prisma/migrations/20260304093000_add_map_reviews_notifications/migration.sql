-- CreateTable
CREATE TABLE "MapReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "storeId" TEXT,
    "placeId" TEXT,
    "externalReviewId" TEXT NOT NULL,
    "reviewUrl" TEXT NOT NULL,
    "authorName" TEXT,
    "rating" INTEGER,
    "reviewText" TEXT NOT NULL,
    "reviewTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "rawPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MapReview_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TelegramNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "messageId" TEXT,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "errorDetails" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelegramNotification_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "MapReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MapReview_source_externalReviewId_key" ON "MapReview"("source", "externalReviewId");

-- CreateIndex
CREATE INDEX "MapReview_status_createdAt_idx" ON "MapReview"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MapReview_storeId_createdAt_idx" ON "MapReview"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "TelegramNotification_reviewId_createdAt_idx" ON "TelegramNotification"("reviewId", "createdAt");
