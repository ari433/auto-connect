# Encar daily inventory sync — implementation plan

Status: design only; production unchanged. No scraping has been enabled.

## Objective
Replace recurring Carapis inventory charges with a compliant, low-cost daily ingestion pipeline, **only after** verifying Encar access terms, robots guidance, response format and practical stability. Avoid authentication bypass, CAPTCHA bypass, aggressive polling and personal seller data harvesting.

## Architecture
- Hetzner VPS (price and server plan to be verified) runs one daily scheduled job at 07:00 Europe/Pristina.
- Source adapter obtains permitted public vehicle listings with bounded concurrency, retry/backoff, and strict request timeouts. Prefer authorized export/feed if available.
- Normalize to the existing ProviderVehicle contract; retain sourceRef as stable ID and use existing Prisma/PostgreSQL storage.
- Stage new snapshot first; validate minimum count, duplicate rate, required fields, price currency, image URLs, and source completeness.
- Upsert valid vehicles idempotently; do not mark missing cars SOLD unless the snapshot is verified complete and absence confirmed across multiple successful runs.
- Expose last-successful-sync, error count, inserted/updated/pending-removal counts in admin.
- Frontend stays unchanged and reads DB; protect importer endpoints with secret authentication.
- Keep Carapis provider intact as rollback until alternative has been validated.
- VPS accesses database with restricted credentials, TLS, and server-side secrets only; redact VIN/phone/PII from logs.

## Existing repository observations
- Existing Prisma sync engine: src/lib/sync/engine.ts
- Provider contract: src/lib/providers/types.ts
- Existing Carapis adapter: src/lib/providers/carapis/index.ts
- Existing daily Vercel cron: vercel.json, 03:00 UTC; disable only after replacement proves healthy.
- WARNING: prunePriceOutliers currently deletes DB records; migration should replace destructive cleanup with quarantine/review.
- WARNING: existing sync retires stale records after one complete feed; require multiple confirmed complete snapshots for the new provider.

## Acceptance tests before production cutover
1. Confirm permitted automated collection and source fields.
2. Test 20-50 real listing IDs against source, photos, specs and pricing.
3. Repeat sync twice: zero duplicate rows, stable IDs.
4. Simulate partial source outage: zero accidental sold/deleted records.
5. Simulate price outliers: quarantine, never destructive deletion.
6. Verify daily schedule, alerting, restart and rollback.
7. Compare DB counts and storefront results.
