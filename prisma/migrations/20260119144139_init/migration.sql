-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT,
    "content" TEXT,
    "url" TEXT,
    "published_at" BIGINT NOT NULL,
    "ai_note" TEXT,
    "sentiment_score" REAL,
    "created_at" BIGINT NOT NULL
);

-- CreateIndex
CREATE INDEX "News_source_published_at_idx" ON "News"("source", "published_at");
