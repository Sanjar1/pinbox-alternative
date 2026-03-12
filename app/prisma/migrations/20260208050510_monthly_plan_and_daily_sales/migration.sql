-- CreateTable
CREATE TABLE "MonthlyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "sumPlan" REAL NOT NULL DEFAULT 0,
    "checksPlan" INTEGER NOT NULL DEFAULT 0,
    "avgCheckPlan" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MonthlyPlan_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailySale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "saleDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "checks" INTEGER NOT NULL DEFAULT 0,
    "avgCheck" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailySale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailySale_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MonthlyPlan_tenantId_month_idx" ON "MonthlyPlan"("tenantId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyPlan_storeId_month_key" ON "MonthlyPlan"("storeId", "month");

-- CreateIndex
CREATE INDEX "DailySale_tenantId_saleDate_idx" ON "DailySale"("tenantId", "saleDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailySale_storeId_saleDate_key" ON "DailySale"("storeId", "saleDate");
