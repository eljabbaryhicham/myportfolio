import type { Auth } from 'firebase/auth';
import { logger } from '@/lib/logger';

/**
 * Ask the server to revalidate the statically-prerendered home page so the
 * next public load serves the freshly-saved hero logo. Fire-and-forget: the
 * admin UI should not block on revalidation — Firestore itself is already
 * live via the client subscription, this only refreshes the SSR seed.
 *
 * Requires a signed-in user's ID token; the server independently verifies
 * it (and rate-limits) before calling revalidatePath('/').
 *
 * Returns `true` on success, `false` on failure. Callers can use this to
 * show a warning toast if revalidation didn't go through.
 */
export async function revalidateHome(auth: Auth | null): Promise<boolean> {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    logger.warn('revalidate-home: no signed-in user, skipping revalidation');
    return false;
  }
  try {
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/admin/revalidate-home', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      logger.warn('revalidate-home: server returned error', { status: res.status, body });
      return false;
    }
    return true;
  } catch (e) {
    logger.warn('revalidate-home: client call failed', e);
    return false;
  }
}