// Shared PIN-gate helpers. Kept dependency-free and using Web Crypto only, so
// this module works in BOTH the Edge middleware and Node server runtimes.

export const ADMIN_COOKIE = "et_admin";

/** The gate is only active when an ADMIN_PIN is configured on the server. */
export function isGateEnabled(): boolean {
  return Boolean(process.env.ADMIN_PIN);
}

/** Derive the opaque cookie token from the PIN (SHA-256, hex). */
export async function computeToken(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${pin}::eat-ticker-admin`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Validate a cookie token against the configured PIN. When no PIN is set the
 * gate is disabled and everything is allowed (so a missing env var never locks
 * the owner out entirely).
 */
export async function isValidToken(token: string | undefined): Promise<boolean> {
  const pin = process.env.ADMIN_PIN;
  if (!pin) return true;
  if (!token) return false;
  return token === (await computeToken(pin));
}
