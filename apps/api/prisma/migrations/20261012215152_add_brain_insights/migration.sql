-- CreateEnum
CREATE TYPE "BrainInsightKind" AS ENUM ('RADAR', 'COMPASS', 'RECOMMENDATION', 'TIME_MACHINE');

-- CreateTable
CREATE TABLE "brain_insights" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "kind" "BrainInsightKind" NOT NULL,
    "subject_key" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "brain_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brain_insights_organization_id_kind_subject_key_idx" ON "brain_insights"("organization_id", "kind", "subject_key");

-- AddForeignKey
ALTER TABLE "brain_insights" ADD CONSTRAINT "brain_insights_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
