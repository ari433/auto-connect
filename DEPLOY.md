# AUTO CONNECT — udhëzues deploy (Vercel + PostgreSQL)

Sajti është gati. Këto janë hapat për ta çuar live.

## 1. Kodi në GitHub
Kodi është në degën `claude/auto-connect-marketplace-ex50fi`. Bëje push (ose merge në `main`) që Vercel ta lexojë.

## 2. Bazë të dhënash PostgreSQL (cloud)
Krijo një falas te **Neon** (neon.tech), **Supabase** ose **Vercel Postgres**.
Kopjo `DATABASE_URL` (formati: `postgresql://user:pass@host/db?sslmode=require`).

## 3. Importo në Vercel
- vercel.com → New Project → importo repo-n GitHub.
- Framework: Next.js (zbulohet vetë). Build: `prisma generate && next build` (default).

## 4. Variablat e mjedisit (Vercel → Settings → Environment Variables)
| Emri | Vlera | Nevojshme |
|------|-------|-----------|
| `DATABASE_URL` | nga hapi 2 | ✅ (aktivizon DB mode) |
| `CARAPIS_API_KEY` | çelësi juaj Carapis | ✅ (pa të: 401) |
| `NEXT_PUBLIC_SITE_URL` | `https://autoconnect-ks.com` | ✅ (SEO/sitemap) |
| `CRON_SECRET` | një varg i rastësishëm | mbron `/api/cron/inventory` |
| `ADMIN_TOKEN` | një varg i rastësishëm | mbron panelin admin |

Çmimet/markup-i kanë vlera të parazgjedhura (≤€10k → +€2k, else +€3k); s'kërkojnë konfigurim.

## 5. Ngarko katalogun (një herë)
Nga makina jote, me `DATABASE_URL`-in e cloud-it te `.env`:
```bash
npm run prisma:deploy   # aplikon migrimet në DB
npm run db:sync         # ngarkon të gjithë katalogun Encar (~120k, vetëm Kore)
```
Pas kësaj sajti kalon vetë në DB mode. Cron-i (çdo 6h) e mban të freskët.

## 6. Domeni
Vercel → Settings → Domains → shto `autoconnect-ks.com`. SSL/https vjen automatik.

---
**Backup live:** para/pas sync-ut, nëse DB është bosh ose e paarritshme, sajti shërben nga Carapis live — kurrë s'mbetet bosh.
