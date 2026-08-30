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
 */
export async function revalidateHome(auth: Auth | null): Promise<void> {
  const currentUser = auth?.currentUser;
  if (!currentUser) return;
  try {
    const idToken = await currentUser.getIdToken();
    await fetch('/api/admin/revalidate-home', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  } catch (e) {
    logger.warn('revalidate-home: client call failed', e);
  }
}