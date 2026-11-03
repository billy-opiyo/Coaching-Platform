CREATE TABLE "TrackerEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "entryDate" DATE NOT NULL,
  "mood" INTEGER NOT NULL,
  "energy" INTEGER NOT NULL,
  "stress" INTEGER NOT NULL,
  "reflection" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrackerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrackerEntry_userId_entryDate_key" ON "TrackerEntry"("userId", "entryDate");

ALTER TABLE "TrackerEntry" ADD CONSTRAINT "TrackerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
