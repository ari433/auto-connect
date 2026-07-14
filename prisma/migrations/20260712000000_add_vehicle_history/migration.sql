-- Vehicle history (source-reported, like Encar)
ALTER TABLE "Vehicle" ADD COLUMN "ownerCount" INTEGER;
ALTER TABLE "Vehicle" ADD COLUMN "hasAccident" BOOLEAN;
ALTER TABLE "Vehicle" ADD COLUMN "inspectionPassed" BOOLEAN;
