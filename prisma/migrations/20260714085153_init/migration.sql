-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleCn" TEXT,
    "publicationYear" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'NOVEL',
    "description" TEXT,
    "descriptionCn" TEXT,
    "coverImage" TEXT,
    "goodreadsUrl" TEXT,
    "amazonUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Adaptation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleCn" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MOVIE',
    "releaseYear" INTEGER,
    "releaseDate" TEXT,
    "runtime" INTEGER,
    "tagline" TEXT,
    "overview" TEXT,
    "overviewCn" TEXT,
    "posterImage" TEXT,
    "posterBlurData" TEXT,
    "tmdbId" INTEGER,
    "imdbId" TEXT,
    "rating" REAL,
    "ratingCount" INTEGER,
    "mpaaRating" TEXT,
    "language" TEXT DEFAULT 'en',
    "country" TEXT DEFAULT 'US',
    "bookId" TEXT,
    "directorId" TEXT,
    "review" TEXT,
    "trivia" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Adaptation_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Adaptation_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameCn" TEXT,
    "photoImage" TEXT,
    "tmdbId" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'ACTOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CastMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adaptationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "characterName" TEXT,
    "order" INTEGER,
    CONSTRAINT "CastMember_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "Adaptation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CastMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adaptationId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "maxScore" REAL NOT NULL,
    "voteCount" INTEGER,
    CONSTRAINT "Rating_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "Adaptation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StreamingLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adaptationId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "linkType" TEXT NOT NULL DEFAULT 'SUBSCRIPTION',
    "url" TEXT NOT NULL,
    "price" TEXT,
    "quality" TEXT,
    "lastVerified" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StreamingLink_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "Adaptation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookDifference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adaptationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "BookDifference_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "Adaptation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CollectionMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "CollectionMember_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionMember_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_slug_key" ON "Book"("slug");

-- CreateIndex
CREATE INDEX "Book_publicationYear_idx" ON "Book"("publicationYear");

-- CreateIndex
CREATE UNIQUE INDEX "Adaptation_slug_key" ON "Adaptation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Adaptation_tmdbId_key" ON "Adaptation"("tmdbId");

-- CreateIndex
CREATE INDEX "Adaptation_releaseYear_idx" ON "Adaptation"("releaseYear");

-- CreateIndex
CREATE INDEX "Adaptation_type_idx" ON "Adaptation"("type");

-- CreateIndex
CREATE INDEX "Adaptation_rating_idx" ON "Adaptation"("rating");

-- CreateIndex
CREATE INDEX "Adaptation_bookId_idx" ON "Adaptation"("bookId");

-- CreateIndex
CREATE INDEX "Adaptation_directorId_idx" ON "Adaptation"("directorId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_slug_key" ON "Person"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Person_tmdbId_key" ON "Person"("tmdbId");

-- CreateIndex
CREATE INDEX "CastMember_adaptationId_idx" ON "CastMember"("adaptationId");

-- CreateIndex
CREATE INDEX "CastMember_personId_idx" ON "CastMember"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "CastMember_adaptationId_personId_key" ON "CastMember"("adaptationId", "personId");

-- CreateIndex
CREATE INDEX "Rating_adaptationId_idx" ON "Rating"("adaptationId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_adaptationId_source_key" ON "Rating"("adaptationId", "source");

-- CreateIndex
CREATE INDEX "StreamingLink_adaptationId_idx" ON "StreamingLink"("adaptationId");

-- CreateIndex
CREATE INDEX "StreamingLink_platform_idx" ON "StreamingLink"("platform");

-- CreateIndex
CREATE INDEX "StreamingLink_lastVerified_idx" ON "StreamingLink"("lastVerified");

-- CreateIndex
CREATE UNIQUE INDEX "StreamingLink_adaptationId_platform_country_linkType_key" ON "StreamingLink"("adaptationId", "platform", "country", "linkType");

-- CreateIndex
CREATE INDEX "BookDifference_adaptationId_idx" ON "BookDifference"("adaptationId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionMember_collectionId_bookId_key" ON "CollectionMember"("collectionId", "bookId");
