/*
  Warnings:

  - You are about to drop the `PlatformLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StoreSyncConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlatformLink";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StoreSyncConfig";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "StoreMasterProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "lat" REAL,
    "lng" REAL,
    "phone" TEXT,
    "hours" TEXT,
    "description" TEXT,
    "website" TEXT,
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoreMasterProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StorePhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StorePhoto_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StoreMasterProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformPhotoRef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "photoId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformPhotoRef_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "StorePhoto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformLocationLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT,
    "url" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "lastSyncHash" TEXT,
    "capabilityLevel" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlatformLocationLink_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "lat" REAL,
    "lng" REAL,
    "distanceMeters" REAL,
    "score" REAL NOT NULL,
    "matchData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchCandidate_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "dataOld" TEXT,
    "dataNew" TEXT,
    "diffSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovalTask_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SyncStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorDetails" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncStep_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "SyncJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChangeSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "snapshotData" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "restoredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChangeSnapshot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoryMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "internalId" TEXT NOT NULL,
    "tenantId" TEXT,
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreMasterProfile_storeId_key" ON "StoreMasterProfile"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformLocationLink_storeId_platform_key" ON "PlatformLocationLink"("storeId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryMapping_internalId_platform_tenantId_key" ON "CategoryMapping"("internalId", "platform", "tenantId");
