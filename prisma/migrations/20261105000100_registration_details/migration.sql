BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_registrationPackageId_fkey";

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "abstractReference" TEXT,
ADD COLUMN     "accommodationFeeCents" INTEGER DEFAULT 0,
ADD COLUMN     "accommodationNotes" TEXT,
ADD COLUMN     "bedPreference" TEXT,
ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingOrg" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "checkInDate" TIMESTAMP(3),
ADD COLUMN     "checkOutDate" TIMESTAMP(3),
ADD COLUMN     "countryName" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "guestsPerRoom" TEXT,
ADD COLUMN     "hasStay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isQuoteRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "needsInvoice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "participationRole" TEXT,
ADD COLUMN     "partnerInterests" TEXT,
ADD COLUMN     "partnerPackage" TEXT,
ADD COLUMN     "poNumber" TEXT,
ADD COLUMN     "referenceNumber" TEXT,
ADD COLUMN     "registrationFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "representativesCount" INTEGER,
ADD COLUMN     "roomCount" INTEGER DEFAULT 1,
ADD COLUMN     "roomType" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "registrationPackageId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Registration_referenceNumber_key" ON "Registration"("referenceNumber");

-- CreateIndex
CREATE INDEX "Registration_referenceNumber_idx" ON "Registration"("referenceNumber");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_registrationPackageId_fkey" FOREIGN KEY ("registrationPackageId") REFERENCES "RegistrationPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;


COMMIT;
