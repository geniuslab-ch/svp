-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FOUNDER', 'BUYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "BuyerCategory" AS ENUM ('ENTREPRENEUR', 'HOLDING_COMPANY', 'STRATEGIC_BUYER', 'INVESTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "BuyerVerification" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "VerificationKind" AS ENUM ('IDENTITY', 'OWNERSHIP', 'FINANCIAL', 'BUYER_FUNDS');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VentureStage" AS ENUM ('IDEA', 'PROTOTYPE', 'MVP', 'EARLY_TRACTION', 'REVENUE', 'PROFITABLE');

-- CreateEnum
CREATE TYPE "RevenueStatus" AS ENUM ('PRE_REVENUE', 'OCCASIONAL', 'RECURRING', 'PROFITABLE');

-- CreateEnum
CREATE TYPE "BusinessModel" AS ENUM ('SAAS', 'MARKETPLACE', 'ECOMMERCE', 'SUBSCRIPTION', 'TRANSACTIONAL', 'ADVERTISING', 'SERVICES', 'HARDWARE', 'LICENSING', 'OTHER');

-- CreateEnum
CREATE TYPE "AcquisitionType" AS ENUM ('FULL_COMPANY', 'ASSET_ACQUISITION', 'INTELLECTUAL_PROPERTY', 'PROJECT_TRANSFER');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'RANGE', 'ON_REQUEST');

-- CreateEnum
CREATE TYPE "VentureStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'SOLD', 'REMOVED');

-- CreateEnum
CREATE TYPE "Confidentiality" AS ENUM ('STANDARD', 'CONFIDENTIAL', 'STEALTH');

-- CreateEnum
CREATE TYPE "MetricKey" AS ENUM ('MRR', 'MONTHLY_REVENUE', 'ANNUAL_REVENUE', 'MONTHLY_EXPENSES', 'MONTHLY_NET_PROFIT', 'CUSTOMERS', 'ACTIVE_USERS', 'GROWTH_RATE');

-- CreateEnum
CREATE TYPE "MetricSource" AS ENUM ('VERIFIED', 'FOUNDER_REPORTED', 'ESTIMATED', 'NOT_DISCLOSED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "MetricNature" AS ENUM ('HISTORICAL', 'PROJECTION');

-- CreateEnum
CREATE TYPE "InfoTier" AS ENUM ('TEASER', 'DETAILS', 'DATA_ROOM');

-- CreateEnum
CREATE TYPE "InteractionKind" AS ENUM ('SAVED', 'PASSED');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('DETAILS', 'DATA_ROOM');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('DISCOVERED', 'INTERESTED', 'INFO_REQUESTED', 'IN_DISCUSSION', 'DUE_DILIGENCE', 'OFFER_SUBMITTED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('MESSAGE', 'OFFER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('EXPRESSION_OF_INTEREST', 'INDICATIVE_OFFER');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('OPEN', 'WITHDRAWN', 'DECLINED', 'ACKNOWLEDGED');

-- CreateEnum
CREATE TYPE "ReportTarget" AS ENUM ('VENTURE', 'MESSAGE', 'USER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "notifyEmailRequests" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmailMessages" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmailUpdates" BOOLEAN NOT NULL DEFAULT false,
    "privacyAcceptedAt" TIMESTAMP(3),
    "privacyVersion" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "FounderProfile" (
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "companyRole" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "linkedinUrl" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "BuyerProfile" (
    "userId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "category" "BuyerCategory" NOT NULL,
    "industries" TEXT[],
    "stages" TEXT[],
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "experience" TEXT,
    "thesis" TEXT,
    "discloseCategory" BOOLEAN NOT NULL DEFAULT true,
    "discloseBudget" BOOLEAN NOT NULL DEFAULT false,
    "discloseExperience" BOOLEAN NOT NULL DEFAULT false,
    "discloseThesis" BOOLEAN NOT NULL DEFAULT false,
    "verification" "BuyerVerification" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ventureId" TEXT,
    "kind" "VerificationKind" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "statement" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venture" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "businessModel" "BusinessModel" NOT NULL,
    "stage" "VentureStage" NOT NULL,
    "revenueStatus" "RevenueStatus" NOT NULL DEFAULT 'PRE_REVENUE',
    "acquisitionType" "AcquisitionType" NOT NULL DEFAULT 'FULL_COMPANY',
    "assetsIncluded" TEXT[],
    "geography" TEXT NOT NULL,
    "teamSize" INTEGER NOT NULL DEFAULT 1,
    "foundedYear" INTEGER,
    "priceType" "PriceType" NOT NULL DEFAULT 'ON_REQUEST',
    "askingPrice" INTEGER,
    "askingPriceMin" INTEGER,
    "askingPriceMax" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "tractionHeadline" TEXT,
    "coverSeed" INTEGER NOT NULL DEFAULT 0,
    "legalName" TEXT,
    "showLegalName" BOOLEAN NOT NULL DEFAULT false,
    "problem" TEXT,
    "valueProposition" TEXT,
    "productStatus" TEXT,
    "mvpDescription" TEXT,
    "monetization" TEXT,
    "customersDescription" TEXT,
    "partnerships" TEXT,
    "techStack" TEXT[],
    "intellectualProperty" TEXT,
    "growthOpportunities" TEXT,
    "saleRationale" TEXT,
    "saleStructure" TEXT,
    "demoUrl" TEXT,
    "websiteUrl" TEXT,
    "status" "VentureStatus" NOT NULL DEFAULT 'DRAFT',
    "confidentiality" "Confidentiality" NOT NULL DEFAULT 'STANDARD',
    "requireNda" BOOLEAN NOT NULL DEFAULT true,
    "wizardStep" INTEGER NOT NULL DEFAULT 1,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "moderationNote" TEXT,
    "publishedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Venture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "key" "MetricKey" NOT NULL,
    "value" DOUBLE PRECISION,
    "period" TEXT,
    "source" "MetricSource" NOT NULL DEFAULT 'FOUNDER_REPORTED',
    "nature" "MetricNature" NOT NULL DEFAULT 'HISTORICAL',
    "tier" "InfoTier" NOT NULL DEFAULT 'DETAILS',
    "evidence" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentureDocument" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "tier" "InfoTier" NOT NULL DEFAULT 'DATA_ROOM',
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VentureDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentureInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "kind" "InteractionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VentureInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentureView" (
    "userId" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VentureView_pkey" PRIMARY KEY ("userId","ventureId")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "level" "AccessLevel" NOT NULL,
    "status" "AccessStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT NOT NULL,
    "ndaAcceptedAt" TIMESTAMP(3),
    "ndaVersion" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineEntry" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "stage" "PipelineStage" NOT NULL DEFAULT 'INTERESTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT,
    "kind" "MessageKind" NOT NULL DEFAULT 'MESSAGE',
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "type" "OfferType" NOT NULL,
    "amount" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "structure" TEXT NOT NULL,
    "conditions" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthToken_userId_type_idx" ON "AuthToken"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerProfile_alias_key" ON "BuyerProfile"("alias");

-- CreateIndex
CREATE INDEX "VerificationRequest_userId_kind_idx" ON "VerificationRequest"("userId", "kind");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationDocument_storageKey_key" ON "VerificationDocument"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "Venture_slug_key" ON "Venture"("slug");

-- CreateIndex
CREATE INDEX "Venture_status_publishedAt_idx" ON "Venture"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Venture_founderId_idx" ON "Venture"("founderId");

-- CreateIndex
CREATE UNIQUE INDEX "Metric_ventureId_key_nature_key" ON "Metric"("ventureId", "key", "nature");

-- CreateIndex
CREATE UNIQUE INDEX "VentureDocument_storageKey_key" ON "VentureDocument"("storageKey");

-- CreateIndex
CREATE INDEX "VentureInteraction_userId_kind_idx" ON "VentureInteraction"("userId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "VentureInteraction_userId_ventureId_key" ON "VentureInteraction"("userId", "ventureId");

-- CreateIndex
CREATE INDEX "AccessRequest_buyerId_idx" ON "AccessRequest"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequest_ventureId_buyerId_level_key" ON "AccessRequest"("ventureId", "buyerId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineEntry_buyerId_ventureId_key" ON "PipelineEntry"("buyerId", "ventureId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_ventureId_buyerId_key" ON "Conversation"("ventureId", "buyerId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FounderProfile" ADD CONSTRAINT "FounderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerProfile" ADD CONSTRAINT "BuyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venture" ADD CONSTRAINT "Venture_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureDocument" ADD CONSTRAINT "VentureDocument_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureInteraction" ADD CONSTRAINT "VentureInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureInteraction" ADD CONSTRAINT "VentureInteraction_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureView" ADD CONSTRAINT "VentureView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureView" ADD CONSTRAINT "VentureView_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineEntry" ADD CONSTRAINT "PipelineEntry_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineEntry" ADD CONSTRAINT "PipelineEntry_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
