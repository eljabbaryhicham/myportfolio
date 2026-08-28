export const DEFAULT_LOGO_URL = "https://i.imgur.com/N9c8oEJ.png";

// The single source of truth for superadmin identity. Must be kept in sync
// with `firestore.rules` (isSuperAdmin()). If you change it here, change
// the literal in firestore.rules and redeploy the rules.
export const SUPERADMIN_EMAIL = 'eljabbaryhicham@example.com';
