-- CreateEnum
CREATE TYPE "SeedTermStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateTable
CREATE TABLE "SeedTerm" (
    "id" TEXT NOT NULL,
    "flavorId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "status" "SeedTermStatus" NOT NULL DEFAULT 'pending',
    "tracksFound" INTEGER NOT NULL DEFAULT 0,
    "lastTriedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeedTerm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeedTerm_flavorId_status_idx" ON "SeedTerm"("flavorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SeedTerm_flavorId_term_key" ON "SeedTerm"("flavorId", "term");

-- AddForeignKey
ALTER TABLE "SeedTerm" ADD CONSTRAINT "SeedTerm_flavorId_fkey" FOREIGN KEY ("flavorId") REFERENCES "Flavor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
