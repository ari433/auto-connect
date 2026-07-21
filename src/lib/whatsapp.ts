/**
 * WhatsApp deep-link helpers.
 * Kosovo dial code is +383, so "045 832 382" → "38345832382".
 */

/** AUTO CONNECT's WhatsApp number in international, digits-only form. */
export const WHATSAPP_NUMBER = '38345832382';

/** Build a wa.me chat link with an optional prefilled message. */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
