-- CreateTable
CREATE TABLE "StoreSyncConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "googleLocationName" TEXT,
    "yandexCardUrl" TEXT,
    "twogisCardUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoreSyncConfig_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreSyncConfig_storeId_key" ON "StoreSyncConfig"("storeId");
