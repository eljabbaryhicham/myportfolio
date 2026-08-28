// The single source of truth for superadmin identity. Must be kept in sync
// with `firestore.rules` (isSuperAdmin()). If you change it here, change
// the literal in firestore.rules and redeploy the rules.
export const SUPERADMIN_EMAIL = 'eljabbaryhicham@Mellivision.com';

// Case-insensitive superadmin check. Use this everywhere instead of
// `email === SUPERADMIN_EMAIL` so a Firebase Auth email stored in any
// case (e.g. 'eljabbaryhicham@mellivision.com') still matches.
export function isSuperAdmin(user: { email?: string | null } | null | undefined): boolean {
  return (user?.email ?? '').toLowerCase() === 'eljabbaryhicham@mellivision.com';
}
