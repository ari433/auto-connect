/**
 * Resilient data access for pages.
 * If the database is unreachable (e.g. before the first sync, or during a brief
 * outage) the UI degrades to an empty state instead of throwing a 500. This
 * keeps the storefront available at all times.
 */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('[db-safe]', error);
    return fallback;
  }
}
