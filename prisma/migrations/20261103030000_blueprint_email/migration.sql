CREATE TYPE "MarketingConsentAction" AS ENUM ('OPT_IN', 'OPT_OUT');
CREATE TYPE "EmailEnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "EmailJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "firstRequestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastRequestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");
CREATE INDEX "Lead_lastRequestedAt_idx" ON "Lead"("lastRequestedAt");

CREATE TABLE "MarketingConsentEvent" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "action" "MarketingConsentAction" NOT NULL,
  "consentVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketingConsentEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MarketingConsentEvent_leadId_createdAt_idx" ON "MarketingConsentEvent"("leadId", "createdAt");
ALTER TABLE "MarketingConsentEvent" ADD CONSTRAINT "MarketingConsentEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BlueprintDelivery" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "guideVersion" TEXT NOT NULL DEFAULT 'v1',
  "tokenHash" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "status" "EmailJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "providerMessageId" TEXT,
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlueprintDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BlueprintDelivery_tokenHash_key" ON "BlueprintDelivery"("tokenHash");
CREATE UNIQUE INDEX "BlueprintDelivery_leadId_guideVersion_key" ON "BlueprintDelivery"("leadId", "guideVersion");
CREATE INDEX "BlueprintDelivery_status_nextAttemptAt_idx" ON "BlueprintDelivery"("status", "nextAttemptAt");
CREATE INDEX "BlueprintDelivery_providerMessageId_idx" ON "BlueprintDelivery"("providerMessageId");
ALTER TABLE "BlueprintDelivery" ADD CONSTRAINT "BlueprintDelivery_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EmailSequenceStep" (
  "id" TEXT NOT NULL,
  "sequenceKey" TEXT NOT NULL DEFAULT 'blueprint-onboarding',
  "stepNumber" INTEGER NOT NULL,
  "delayDays" INTEGER NOT NULL,
  "subject" TEXT NOT NULL,
  "bodyText" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailSequenceStep_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailSequenceStep_sequenceKey_stepNumber_key" ON "EmailSequenceStep"("sequenceKey", "stepNumber");
CREATE INDEX "EmailSequenceStep_sequenceKey_isEnabled_stepNumber_idx" ON "EmailSequenceStep"("sequenceKey", "isEnabled", "stepNumber");

CREATE TABLE "EmailSequenceEnrollment" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "consentEventId" TEXT NOT NULL,
  "sequenceKey" TEXT NOT NULL DEFAULT 'blueprint-onboarding',
  "consentVersion" TEXT NOT NULL,
  "status" "EmailEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pausedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "EmailSequenceEnrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailSequenceEnrollment_consentEventId_sequenceKey_key" ON "EmailSequenceEnrollment"("consentEventId", "sequenceKey");
CREATE INDEX "EmailSequenceEnrollment_status_startedAt_idx" ON "EmailSequenceEnrollment"("status", "startedAt");
ALTER TABLE "EmailSequenceEnrollment" ADD CONSTRAINT "EmailSequenceEnrollment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSequenceEnrollment" ADD CONSTRAINT "EmailSequenceEnrollment_consentEventId_fkey" FOREIGN KEY ("consentEventId") REFERENCES "MarketingConsentEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EmailJob" (
  "id" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "stepId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" "EmailJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "providerMessageId" TEXT,
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailJob_idempotencyKey_key" ON "EmailJob"("idempotencyKey");
CREATE UNIQUE INDEX "EmailJob_enrollmentId_stepId_key" ON "EmailJob"("enrollmentId", "stepId");
CREATE INDEX "EmailJob_status_nextAttemptAt_idx" ON "EmailJob"("status", "nextAttemptAt");
CREATE INDEX "EmailJob_providerMessageId_idx" ON "EmailJob"("providerMessageId");
ALTER TABLE "EmailJob" ADD CONSTRAINT "EmailJob_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "EmailSequenceEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailJob" ADD CONSTRAINT "EmailJob_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "EmailSequenceStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EmailAutomationControl" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "paused" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailAutomationControl_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailProviderEvent" (
  "id" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "providerMessageId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailProviderEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailProviderEvent_providerEventId_key" ON "EmailProviderEvent"("providerEventId");
CREATE INDEX "EmailProviderEvent_providerMessageId_occurredAt_idx" ON "EmailProviderEvent"("providerMessageId", "occurredAt");

INSERT INTO "EmailAutomationControl" ("id", "paused", "updatedAt") VALUES ('default', true, CURRENT_TIMESTAMP);
INSERT INTO "EmailSequenceStep" ("id", "sequenceKey", "stepNumber", "delayDays", "subject", "bodyText", "isEnabled", "createdAt", "updatedAt") VALUES
('blueprint-step-1', 'blueprint-onboarding', 1, 1, '[Draft] Welcome email', '[Draft] Replace this text with owner-approved welcome and guide instructions before enabling this step.', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('blueprint-step-2', 'blueprint-onboarding', 2, 3, '[Draft] Educational email', '[Draft] Replace this text with owner-approved educational copy and one practical exercise before enabling this step.', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('blueprint-step-3', 'blueprint-onboarding', 3, 5, '[Draft] Further learning email', '[Draft] Replace this text with approved educational copy. Do not add a case study unless the owner supplies one.', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('blueprint-step-4', 'blueprint-onboarding', 4, 7, '[Draft] Next steps email', '[Draft] Replace this text with owner-approved next steps and only verified coaching details before enabling this step.', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
