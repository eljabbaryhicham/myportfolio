// The single source of truth for superadmin identity. Must be kept in sync
// with `firestore.rules` (isSuperAdmin()). If you change it here, change
// the literal in firestore.rules and redeploy the rules.
export const SUPERADMIN_EMAIL = 'eljabbaryhicham@Mellivision.com';

// Case-insensitive superadmin check. Use this everywhere instead of
// `email === SUPERADMIN_EMAIL` so a Firebase Auth email stored in any
// case (e.g. 'eljabbaryhicham@mellivision.com') still matches. Also
// accepts the bare username (e.g. 'eljabbaryhicham') since some user
// docs were created with the username stored as the email field.
export function isSuperAdmin(user: { email?: string | null } | null | undefined): boolean {
  const email = (user?.email ?? '').toLowerCase();
  return email === 'eljabbaryhicham@mellivision.com' || email === 'eljabbaryhicham';
}

// Media-management access. Mirrors the Firestore rules' isAdmin() (user doc
// role 'admin' or 'superadmin') plus the superadmin email override.
// Self-registered accounts (role 'user') have no media read/write access.
export function hasMediaAccess(user: { email?: string | null; role?: string | null } | null | undefined): boolean {
  return isSuperAdmin(user) || user?.role === 'admin' || user?.role === 'superadmin';
}
