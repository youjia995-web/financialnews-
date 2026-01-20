-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start_time" BIGINT NOT NULL,
    "end_time" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL
);

-- CreateIndex
CREATE INDEX "Report_created_at_idx" ON "Report"("created_at");
