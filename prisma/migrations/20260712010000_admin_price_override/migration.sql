-- Admin manual price override + hide flag
ALTER TABLE "Vehicle" ADD COLUMN "priceOverride" INTEGER;
ALTER TABLE "Vehicle" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
