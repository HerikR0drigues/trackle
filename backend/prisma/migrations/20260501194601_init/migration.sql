-- CreateTable
CREATE TABLE "Flavor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flavor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "itunesId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT NOT NULL,
    "year" INTEGER,
    "genre" TEXT,
    "artworkUrl" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "flavorId" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPuzzleCache" (
    "id" TEXT NOT NULL,
    "flavorId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPuzzleCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Track_itunesId_key" ON "Track"("itunesId");

-- CreateIndex
CREATE INDEX "Track_flavorId_idx" ON "Track"("flavorId");

-- CreateIndex
CREATE INDEX "Track_artist_idx" ON "Track"("artist");

-- CreateIndex
CREATE INDEX "Track_year_idx" ON "Track"("year");

-- CreateIndex
CREATE INDEX "Track_genre_idx" ON "Track"("genre");

-- CreateIndex
CREATE INDEX "DailyPuzzleCache_flavorId_idx" ON "DailyPuzzleCache"("flavorId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPuzzleCache_flavorId_date_key" ON "DailyPuzzleCache"("flavorId", "date");

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_flavorId_fkey" FOREIGN KEY ("flavorId") REFERENCES "Flavor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
