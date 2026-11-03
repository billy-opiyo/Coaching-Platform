CREATE TYPE "SquadStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');
CREATE TYPE "SquadMembershipStatus" AS ENUM ('ACTIVE', 'WAITLISTED', 'LEFT', 'REMOVED');
CREATE TYPE "SquadReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'CLOSED');
CREATE TYPE "SquadReportCategory" AS ENUM ('SAFETY', 'CONDUCT', 'OTHER');
CREATE TYPE "SquadNotificationKind" AS ENUM ('JOINED', 'WAITLISTED', 'PROMOTED', 'LEFT', 'REMOVED');
CREATE TYPE "SquadConsentAction" AS ENUM ('OPT_IN', 'OPT_OUT');

CREATE TABLE "AccountabilityGroup" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(1000) NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 8,
  "currentMemberCount" INTEGER NOT NULL DEFAULT 0,
  "status" "SquadStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountabilityGroup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AccountabilityGroup_capacity_check" CHECK ("capacity" >= 2 AND "currentMemberCount" >= 0 AND "currentMemberCount" <= "capacity")
);
CREATE INDEX "AccountabilityGroup_status_createdAt_idx" ON "AccountabilityGroup"("status", "createdAt");

CREATE TABLE "SquadMembership" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "SquadMembershipStatus" NOT NULL DEFAULT 'WAITLISTED',
  "policyVersion" TEXT,
  "agreedAt" TIMESTAMP(3),
  "joinedAt" TIMESTAMP(3),
  "waitlistedAt" TIMESTAMP(3),
  "leftAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SquadMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SquadMembership_groupId_userId_key" ON "SquadMembership"("groupId", "userId");
CREATE INDEX "SquadMembership_groupId_status_waitlistedAt_idx" ON "SquadMembership"("groupId", "status", "waitlistedAt");
CREATE INDEX "SquadMembership_userId_status_idx" ON "SquadMembership"("userId", "status");
ALTER TABLE "SquadMembership" ADD CONSTRAINT "SquadMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AccountabilityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SquadMembership" ADD CONSTRAINT "SquadMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SquadCheckIn" (
  "id" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "weekStart" DATE NOT NULL,
  "focus" VARCHAR(400) NOT NULL,
  "reflection" VARCHAR(400) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SquadCheckIn_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SquadCheckIn_membershipId_weekStart_key" ON "SquadCheckIn"("membershipId", "weekStart");
CREATE INDEX "SquadCheckIn_weekStart_idx" ON "SquadCheckIn"("weekStart");
ALTER TABLE "SquadCheckIn" ADD CONSTRAINT "SquadCheckIn_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "SquadMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SquadConsentEvent" (
  "id" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "action" "SquadConsentAction" NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SquadConsentEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SquadConsentEvent_membershipId_createdAt_idx" ON "SquadConsentEvent"("membershipId", "createdAt");
ALTER TABLE "SquadConsentEvent" ADD CONSTRAINT "SquadConsentEvent_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "SquadMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SquadReport" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "category" "SquadReportCategory" NOT NULL,
  "details" VARCHAR(1000) NOT NULL,
  "status" "SquadReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "SquadReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SquadReport_status_createdAt_idx" ON "SquadReport"("status", "createdAt");
CREATE INDEX "SquadReport_groupId_createdAt_idx" ON "SquadReport"("groupId", "createdAt");
ALTER TABLE "SquadReport" ADD CONSTRAINT "SquadReport_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AccountabilityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SquadReport" ADD CONSTRAINT "SquadReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SquadReport" ADD CONSTRAINT "SquadReport_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "SquadMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SquadNotification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "groupId" TEXT,
  "kind" "SquadNotificationKind" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  CONSTRAINT "SquadNotification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SquadNotification_userId_readAt_createdAt_idx" ON "SquadNotification"("userId", "readAt", "createdAt");
ALTER TABLE "SquadNotification" ADD CONSTRAINT "SquadNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SquadNotification" ADD CONSTRAINT "SquadNotification_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AccountabilityGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
