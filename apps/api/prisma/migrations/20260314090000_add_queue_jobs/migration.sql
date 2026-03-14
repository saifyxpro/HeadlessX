-- CreateEnum
CREATE TYPE "QueueJobType" AS ENUM ('SCRAPE', 'EXTRACT', 'INDEX');

-- CreateEnum
CREATE TYPE "QueueJobStatus" AS ENUM ('QUEUED', 'ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "QueueJob" (
    "id" TEXT NOT NULL,
    "api_key_id" TEXT,
    "type" "QueueJobType" NOT NULL,
    "status" "QueueJobStatus" NOT NULL DEFAULT 'QUEUED',
    "queue_name" TEXT NOT NULL DEFAULT 'headlessx-jobs',
    "target" TEXT,
    "request_payload" JSONB NOT NULL,
    "progress_payload" JSONB,
    "result_payload" JSONB,
    "error_message" TEXT,
    "attempts_made" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "cancel_requested" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QueueJob_status_created_at_idx" ON "QueueJob"("status", "created_at");

-- CreateIndex
CREATE INDEX "QueueJob_type_created_at_idx" ON "QueueJob"("type", "created_at");

-- CreateIndex
CREATE INDEX "QueueJob_cancel_requested_idx" ON "QueueJob"("cancel_requested");

-- AddForeignKey
ALTER TABLE "QueueJob" ADD CONSTRAINT "QueueJob_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
