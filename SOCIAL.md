# Postim automatik në Instagram & Facebook

Sajti ekspozon një **feed RSS** të veturave të reja, me foto + një **caption gati në shqip**.
Një vegël no-code e lexon dhe poston vetë në Instagram & Facebook.

**Feed-i:** `https://autoconnect-ks.com/api/social/feed`
(çdo veturë = një `<item>` me: titull, linku, foto (`enclosure`), dhe caption te `description`.)

## Opsioni A — Make.com (falas për fillim, i rekomanduar)
1. Krijo llogari te **make.com**.
2. New scenario → moduli **RSS → "Watch RSS feed items"**
   - URL: `https://autoconnect-ks.com/api/social/feed`
   - "Maximum number of returned items": p.sh. **2** (kaq vetura poston për çdo ekzekutim → kontrollon ritmin).
3. Shto modulin **Instagram for Business → "Create a Photo Post"**
   - Photo URL = `enclosure` (URL i fotos nga RSS)
   - Caption = `description`
4. Shto modulin **Facebook Pages → "Create a Post"**
   - Message = `description`, Link/Photo = `enclosure`
5. Poshtë majtas, cakto **Schedule** (p.sh. çdo 3 orë) → kjo përcakton sa shpesh postohet.

> Instagram kërkon një llogari **Business/Creator** të lidhur me një **faqe Facebook**.
> Lidhjen e bën një herë brenda Make (Connections).

## Opsioni B — Buffer / Zapier
- **Zapier:** Trigger "RSS by Zapier → New item in feed" → Action "Buffer / Instagram / Facebook".
- **Buffer:** përdor RSS përmes Zapier ose IFTTT për ta ushqyer radhën e Buffer-it.

## Personalizim
- Sa vetura në feed: `SOCIAL_FEED_SIZE` (default 40).
- Teksti/hashtag-et: `src/lib/social/caption.ts`.
