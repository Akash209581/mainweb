-- CreateTable
CREATE TABLE "PublicAbstractSubmission" (
    "id" UUID NOT NULL,
    "conferenceId" UUID NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileData" BYTEA NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicAbstractSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicAbstractSubmission_referenceNumber_key" ON "PublicAbstractSubmission"("referenceNumber");

-- CreateIndex
CREATE INDEX "PublicAbstractSubmission_conferenceId_createdAt_idx" ON "PublicAbstractSubmission"("conferenceId", "createdAt");

-- AddForeignKey
ALTER TABLE "PublicAbstractSubmission" ADD CONSTRAINT "PublicAbstractSubmission_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

