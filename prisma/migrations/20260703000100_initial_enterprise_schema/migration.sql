-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."RoleName" AS ENUM ('GUEST', 'AUTHOR', 'REVIEWER', 'COMMITTEE_MEMBER', 'SPONSOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."PermissionKey" AS ENUM ('BROWSE_WEBSITE', 'REGISTER', 'SUBMIT_CONTACT_FORM', 'SUBMIT_ABSTRACT', 'EDIT_OWN_SUBMISSION', 'UPLOAD_FINAL_PAPER', 'DOWNLOAD_ACCEPTANCE_LETTER', 'VIEW_ASSIGNED_PAPERS', 'SUBMIT_REVIEW', 'MANAGE_ASSIGNED_TRACKS', 'MANAGE_CONFERENCE_CONTENT', 'MANAGE_SPEAKERS', 'MANAGE_SPONSORS', 'MANAGE_AGENDA', 'APPROVE_SUBMISSIONS', 'MANAGE_REGISTRATIONS', 'MANAGE_USERS', 'MANAGE_SETTINGS', 'FULL_ACCESS');

-- CreateEnum
CREATE TYPE "public"."ConferenceMode" AS ENUM ('OFFLINE', 'VIRTUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."AttendanceMode" AS ENUM ('ONSITE', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'REVISION_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."ReviewRecommendation" AS ENUM ('ACCEPT', 'MINOR_REVISION', 'MAJOR_REVISION', 'REJECT');

-- CreateEnum
CREATE TYPE "public"."FileVisibility" AS ENUM ('PRIVATE', 'PROTECTED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Profile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID,
    "countryId" UUID,
    "title" TEXT,
    "designation" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" UUID NOT NULL,
    "name" "public"."RoleName" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" UUID NOT NULL,
    "key" "public"."PermissionKey" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conference" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "mode" "public"."ConferenceMode" NOT NULL DEFAULT 'HYBRID',
    "venueId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Speaker" (
    "id" UUID NOT NULL,
    "conferenceId" UUID NOT NULL,
    "organizationId" UUID,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "bio" TEXT,
    "imageAssetId" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Speaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommitteeMember" (
    "id" UUID NOT NULL,
    "conferenceId" UUID NOT NULL,
    "organizationId" UUID,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "email" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Track" (
    "id" UUID NOT NULL,
    "conferenceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" UUID NOT NULL,
    "trackId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgendaDay" (
    "id" UUID NOT NULL,
    "conferenceId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AgendaDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgendaItem" (
    "id" UUID NOT NULL,
    "agendaDayId" UUID NOT NULL,
    "sessionId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AgendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Venue" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "countryId" UUID,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SponsorTier" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SponsorTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sponsor" (
    "id" UUID NOT NULL,
    "conferenceId" UUID NOT NULL,
    "sponsorTierId" UUID NOT NULL,
    "organizationId" UUID,
    "name" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "website" TEXT,
    "logoAssetId" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RegistrationPackage" (
    "id" UUID NOT NULL,
    "conferenceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "attendanceMode" "public"."AttendanceMode" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RegistrationPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Registration" (
    "id" UUID NOT NULL,
    "conferenceId" UUID NOT NULL,
    "userId" UUID,
    "registrationPackageId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT,
    "countryId" UUID,
    "status" "public"."RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "paymentId" UUID,
    "invoiceNumber" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AbstractSubmission" (
    "id" UUID NOT NULL,
    "conferenceId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "trackId" UUID,
    "title" TEXT NOT NULL,
    "abstractText" TEXT NOT NULL,
    "keywords" TEXT[],
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AbstractSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Paper" (
    "id" UUID NOT NULL,
    "abstractSubmissionId" UUID NOT NULL,
    "finalFileAssetId" UUID,
    "title" TEXT NOT NULL,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewerAssignment" (
    "id" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "abstractSubmissionId" UUID NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReviewerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "abstractSubmissionId" UUID NOT NULL,
    "assignmentId" UUID,
    "recommendation" "public"."ReviewRecommendation" NOT NULL,
    "comments" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewScore" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "criterion" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Announcement" (
    "id" UUID NOT NULL,
    "conferenceId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactMessage" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "channel" "public"."NotificationChannel" NOT NULL,
    "status" "public"."NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileAsset" (
    "id" UUID NOT NULL,
    "ownerId" UUID,
    "abstractSubmissionId" UUID,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "visibility" "public"."FileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Country" (
    "id" UUID NOT NULL,
    "iso2" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HotelPartner" (
    "id" UUID NOT NULL,
    "venueId" UUID,
    "countryId" UUID,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "HotelPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TravelGuide" (
    "id" UUID NOT NULL,
    "venueId" UUID,
    "countryId" UUID,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TravelGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FAQ" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "id" UUID NOT NULL,
    "conferenceId" UUID,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ThemeSetting" (
    "id" UUID NOT NULL,
    "conferenceId" UUID,
    "name" TEXT NOT NULL,
    "tokens" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "public"."User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_clerkUserId_idx" ON "public"."User"("clerkUserId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "public"."User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "public"."Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_organizationId_idx" ON "public"."Profile"("organizationId");

-- CreateIndex
CREATE INDEX "Profile_countryId_idx" ON "public"."Profile"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "public"."Permission"("key");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "public"."UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "public"."UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "public"."RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "public"."RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Conference_slug_key" ON "public"."Conference"("slug");

-- CreateIndex
CREATE INDEX "Conference_slug_idx" ON "public"."Conference"("slug");

-- CreateIndex
CREATE INDEX "Conference_startDate_endDate_idx" ON "public"."Conference"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Conference_deletedAt_idx" ON "public"."Conference"("deletedAt");

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "public"."Organization"("name");

-- CreateIndex
CREATE INDEX "Organization_deletedAt_idx" ON "public"."Organization"("deletedAt");

-- CreateIndex
CREATE INDEX "Speaker_conferenceId_sortOrder_idx" ON "public"."Speaker"("conferenceId", "sortOrder");

-- CreateIndex
CREATE INDEX "Speaker_name_idx" ON "public"."Speaker"("name");

-- CreateIndex
CREATE INDEX "Speaker_deletedAt_idx" ON "public"."Speaker"("deletedAt");

-- CreateIndex
CREATE INDEX "CommitteeMember_conferenceId_sortOrder_idx" ON "public"."CommitteeMember"("conferenceId", "sortOrder");

-- CreateIndex
CREATE INDEX "CommitteeMember_name_idx" ON "public"."CommitteeMember"("name");

-- CreateIndex
CREATE INDEX "CommitteeMember_deletedAt_idx" ON "public"."CommitteeMember"("deletedAt");

-- CreateIndex
CREATE INDEX "Track_name_idx" ON "public"."Track"("name");

-- CreateIndex
CREATE INDEX "Track_deletedAt_idx" ON "public"."Track"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Track_conferenceId_slug_key" ON "public"."Track"("conferenceId", "slug");

-- CreateIndex
CREATE INDEX "Session_trackId_startsAt_idx" ON "public"."Session"("trackId", "startsAt");

-- CreateIndex
CREATE INDEX "Session_title_idx" ON "public"."Session"("title");

-- CreateIndex
CREATE INDEX "Session_deletedAt_idx" ON "public"."Session"("deletedAt");

-- CreateIndex
CREATE INDEX "AgendaDay_conferenceId_date_idx" ON "public"."AgendaDay"("conferenceId", "date");

-- CreateIndex
CREATE INDEX "AgendaDay_deletedAt_idx" ON "public"."AgendaDay"("deletedAt");

-- CreateIndex
CREATE INDEX "AgendaItem_agendaDayId_sortOrder_idx" ON "public"."AgendaItem"("agendaDayId", "sortOrder");

-- CreateIndex
CREATE INDEX "AgendaItem_sessionId_idx" ON "public"."AgendaItem"("sessionId");

-- CreateIndex
CREATE INDEX "AgendaItem_startsAt_idx" ON "public"."AgendaItem"("startsAt");

-- CreateIndex
CREATE INDEX "AgendaItem_deletedAt_idx" ON "public"."AgendaItem"("deletedAt");

-- CreateIndex
CREATE INDEX "Venue_city_idx" ON "public"."Venue"("city");

-- CreateIndex
CREATE INDEX "Venue_countryId_idx" ON "public"."Venue"("countryId");

-- CreateIndex
CREATE INDEX "Venue_deletedAt_idx" ON "public"."Venue"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SponsorTier_name_key" ON "public"."SponsorTier"("name");

-- CreateIndex
CREATE INDEX "Sponsor_conferenceId_sortOrder_idx" ON "public"."Sponsor"("conferenceId", "sortOrder");

-- CreateIndex
CREATE INDEX "Sponsor_sponsorTierId_idx" ON "public"."Sponsor"("sponsorTierId");

-- CreateIndex
CREATE INDEX "Sponsor_name_idx" ON "public"."Sponsor"("name");

-- CreateIndex
CREATE INDEX "Sponsor_deletedAt_idx" ON "public"."Sponsor"("deletedAt");

-- CreateIndex
CREATE INDEX "RegistrationPackage_conferenceId_idx" ON "public"."RegistrationPackage"("conferenceId");

-- CreateIndex
CREATE INDEX "RegistrationPackage_attendanceMode_idx" ON "public"."RegistrationPackage"("attendanceMode");

-- CreateIndex
CREATE INDEX "RegistrationPackage_deletedAt_idx" ON "public"."RegistrationPackage"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationPackage_conferenceId_name_key" ON "public"."RegistrationPackage"("conferenceId", "name");

-- CreateIndex
CREATE INDEX "Registration_conferenceId_status_idx" ON "public"."Registration"("conferenceId", "status");

-- CreateIndex
CREATE INDEX "Registration_email_idx" ON "public"."Registration"("email");

-- CreateIndex
CREATE INDEX "Registration_userId_idx" ON "public"."Registration"("userId");

-- CreateIndex
CREATE INDEX "Registration_deletedAt_idx" ON "public"."Registration"("deletedAt");

-- CreateIndex
CREATE INDEX "Payment_registrationId_idx" ON "public"."Payment"("registrationId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_providerRef_idx" ON "public"."Payment"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_paymentId_key" ON "public"."Invoice"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "public"."Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_registrationId_idx" ON "public"."Invoice"("registrationId");

-- CreateIndex
CREATE INDEX "AbstractSubmission_conferenceId_status_idx" ON "public"."AbstractSubmission"("conferenceId", "status");

-- CreateIndex
CREATE INDEX "AbstractSubmission_authorId_idx" ON "public"."AbstractSubmission"("authorId");

-- CreateIndex
CREATE INDEX "AbstractSubmission_trackId_idx" ON "public"."AbstractSubmission"("trackId");

-- CreateIndex
CREATE INDEX "AbstractSubmission_title_idx" ON "public"."AbstractSubmission"("title");

-- CreateIndex
CREATE INDEX "AbstractSubmission_deletedAt_idx" ON "public"."AbstractSubmission"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Paper_abstractSubmissionId_key" ON "public"."Paper"("abstractSubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Paper_finalFileAssetId_key" ON "public"."Paper"("finalFileAssetId");

-- CreateIndex
CREATE INDEX "ReviewerAssignment_abstractSubmissionId_idx" ON "public"."ReviewerAssignment"("abstractSubmissionId");

-- CreateIndex
CREATE INDEX "ReviewerAssignment_dueAt_idx" ON "public"."ReviewerAssignment"("dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerAssignment_reviewerId_abstractSubmissionId_key" ON "public"."ReviewerAssignment"("reviewerId", "abstractSubmissionId");

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "public"."Review"("reviewerId");

-- CreateIndex
CREATE INDEX "Review_abstractSubmissionId_idx" ON "public"."Review"("abstractSubmissionId");

-- CreateIndex
CREATE INDEX "Review_recommendation_idx" ON "public"."Review"("recommendation");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewScore_reviewId_criterion_key" ON "public"."ReviewScore"("reviewId", "criterion");

-- CreateIndex
CREATE INDEX "Announcement_conferenceId_publishedAt_idx" ON "public"."Announcement"("conferenceId", "publishedAt");

-- CreateIndex
CREATE INDEX "Announcement_title_idx" ON "public"."Announcement"("title");

-- CreateIndex
CREATE INDEX "Announcement_deletedAt_idx" ON "public"."Announcement"("deletedAt");

-- CreateIndex
CREATE INDEX "ContactMessage_email_idx" ON "public"."ContactMessage"("email");

-- CreateIndex
CREATE INDEX "ContactMessage_category_idx" ON "public"."ContactMessage"("category");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "public"."ContactMessage"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_status_idx" ON "public"."Notification"("userId", "status");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "public"."AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_storageKey_key" ON "public"."FileAsset"("storageKey");

-- CreateIndex
CREATE INDEX "FileAsset_ownerId_idx" ON "public"."FileAsset"("ownerId");

-- CreateIndex
CREATE INDEX "FileAsset_abstractSubmissionId_idx" ON "public"."FileAsset"("abstractSubmissionId");

-- CreateIndex
CREATE INDEX "FileAsset_mimeType_idx" ON "public"."FileAsset"("mimeType");

-- CreateIndex
CREATE INDEX "FileAsset_deletedAt_idx" ON "public"."FileAsset"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Country_iso2_key" ON "public"."Country"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "public"."Country"("name");

-- CreateIndex
CREATE INDEX "HotelPartner_venueId_idx" ON "public"."HotelPartner"("venueId");

-- CreateIndex
CREATE INDEX "HotelPartner_countryId_idx" ON "public"."HotelPartner"("countryId");

-- CreateIndex
CREATE INDEX "HotelPartner_deletedAt_idx" ON "public"."HotelPartner"("deletedAt");

-- CreateIndex
CREATE INDEX "TravelGuide_title_idx" ON "public"."TravelGuide"("title");

-- CreateIndex
CREATE INDEX "TravelGuide_venueId_idx" ON "public"."TravelGuide"("venueId");

-- CreateIndex
CREATE INDEX "TravelGuide_deletedAt_idx" ON "public"."TravelGuide"("deletedAt");

-- CreateIndex
CREATE INDEX "FAQ_category_sortOrder_idx" ON "public"."FAQ"("category", "sortOrder");

-- CreateIndex
CREATE INDEX "FAQ_deletedAt_idx" ON "public"."FAQ"("deletedAt");

-- CreateIndex
CREATE INDEX "SystemSetting_key_idx" ON "public"."SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_conferenceId_key_key" ON "public"."SystemSetting"("conferenceId", "key");

-- CreateIndex
CREATE INDEX "ThemeSetting_conferenceId_isActive_idx" ON "public"."ThemeSetting"("conferenceId", "isActive");

-- CreateIndex
CREATE INDEX "ThemeSetting_name_idx" ON "public"."ThemeSetting"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeSetting_conferenceId_name_key" ON "public"."ThemeSetting"("conferenceId", "name");

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conference" ADD CONSTRAINT "Conference_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Speaker" ADD CONSTRAINT "Speaker_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Speaker" ADD CONSTRAINT "Speaker_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Speaker" ADD CONSTRAINT "Speaker_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "public"."FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommitteeMember" ADD CONSTRAINT "CommitteeMember_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommitteeMember" ADD CONSTRAINT "CommitteeMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Track" ADD CONSTRAINT "Track_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "public"."Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgendaDay" ADD CONSTRAINT "AgendaDay_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgendaItem" ADD CONSTRAINT "AgendaItem_agendaDayId_fkey" FOREIGN KEY ("agendaDayId") REFERENCES "public"."AgendaDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgendaItem" ADD CONSTRAINT "AgendaItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Venue" ADD CONSTRAINT "Venue_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sponsor" ADD CONSTRAINT "Sponsor_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sponsor" ADD CONSTRAINT "Sponsor_sponsorTierId_fkey" FOREIGN KEY ("sponsorTierId") REFERENCES "public"."SponsorTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sponsor" ADD CONSTRAINT "Sponsor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sponsor" ADD CONSTRAINT "Sponsor_logoAssetId_fkey" FOREIGN KEY ("logoAssetId") REFERENCES "public"."FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegistrationPackage" ADD CONSTRAINT "RegistrationPackage_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Registration" ADD CONSTRAINT "Registration_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Registration" ADD CONSTRAINT "Registration_registrationPackageId_fkey" FOREIGN KEY ("registrationPackageId") REFERENCES "public"."RegistrationPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Registration" ADD CONSTRAINT "Registration_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AbstractSubmission" ADD CONSTRAINT "AbstractSubmission_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AbstractSubmission" ADD CONSTRAINT "AbstractSubmission_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AbstractSubmission" ADD CONSTRAINT "AbstractSubmission_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "public"."Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Paper" ADD CONSTRAINT "Paper_abstractSubmissionId_fkey" FOREIGN KEY ("abstractSubmissionId") REFERENCES "public"."AbstractSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Paper" ADD CONSTRAINT "Paper_finalFileAssetId_fkey" FOREIGN KEY ("finalFileAssetId") REFERENCES "public"."FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewerAssignment" ADD CONSTRAINT "ReviewerAssignment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewerAssignment" ADD CONSTRAINT "ReviewerAssignment_abstractSubmissionId_fkey" FOREIGN KEY ("abstractSubmissionId") REFERENCES "public"."AbstractSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_abstractSubmissionId_fkey" FOREIGN KEY ("abstractSubmissionId") REFERENCES "public"."AbstractSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."ReviewerAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewScore" ADD CONSTRAINT "ReviewScore_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Announcement" ADD CONSTRAINT "Announcement_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileAsset" ADD CONSTRAINT "FileAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileAsset" ADD CONSTRAINT "FileAsset_abstractSubmissionId_fkey" FOREIGN KEY ("abstractSubmissionId") REFERENCES "public"."AbstractSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HotelPartner" ADD CONSTRAINT "HotelPartner_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HotelPartner" ADD CONSTRAINT "HotelPartner_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TravelGuide" ADD CONSTRAINT "TravelGuide_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TravelGuide" ADD CONSTRAINT "TravelGuide_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemSetting" ADD CONSTRAINT "SystemSetting_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ThemeSetting" ADD CONSTRAINT "ThemeSetting_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

