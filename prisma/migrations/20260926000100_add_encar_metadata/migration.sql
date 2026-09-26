-- Preserve rich Encar/Carapis condition and history metadata.
ALTER TABLE "Vehicle"
  ADD COLUMN "inspectionData" JSONB,
  ADD COLUMN "accidentHistory" JSONB,
  ADD COLUMN "priceHistory" JSONB,
  ADD COLUMN "sourceUrl" TEXT;
