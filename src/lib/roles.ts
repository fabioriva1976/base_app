// Tipi di ruoli disponibili nell'applicazione
export type UserRole = 'superuser' | 'admin' | 'operatore';

// Interfaccia per l'utente con ruolo (ruolo può essere string o array)
export interface UserWithRole {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  ruolo?: UserRole | UserRole[];
}

function normalizeRoles(role: UserRole | UserRole[] | undefined): UserRole[] {
  if (Array.isArray(role)) return role;
  if (role) return [role];
  return [];
}

// Verifica se l'utente è superuser
export function isSuperUser(user: UserWithRole | null | undefined): boolean {
  return normalizeRoles(user?.ruolo).includes('superuser');
}

// Verifica se l'utente è admin o superuser
export function isAdmin(user: UserWithRole | null | undefined): boolean {
  const roles = normalizeRoles(user?.ruolo);
  return roles.includes('admin') || roles.includes('superuser');
}

// Verifica se l'utente è operatore (o superiore)
export function isOperator(user: UserWithRole | null | undefined): boolean {
  const roles = normalizeRoles(user?.ruolo);
  return roles.includes('operatore') || roles.includes('admin') || roles.includes('superuser');
}

// Verifica se l'utente può creare altri utenti
export function canManageUsers(user: UserWithRole | null | undefined): boolean {
  return isAdmin(user);
}

// Verifica se l'utente può accedere alle configurazioni
export function canAccessConfig(user: UserWithRole | null | undefined): boolean {
  return isSuperUser(user);
}

// Verifica se l'utente può eliminare risorse
export function canDelete(user: UserWithRole | null | undefined): boolean {
  return isAdmin(user);
}

// Ottiene il label del ruolo per visualizzazione
export function getRoleLabel(role: UserRole | UserRole[] | undefined): string {
  const primary = normalizeRoles(role)[0];
  switch (primary) {
    case 'superuser':
      return 'Super User';
    case 'admin':
      return 'Amministratore';
    case 'operatore':
      return 'Operatore';
    default:
      return 'Nessun Ruolo';
  }
}

// Ottiene tutti i ruoli disponibili (per select/dropdown)
export function getAvailableRoles(): Array<{ value: UserRole; label: string }> {
  return [
    { value: 'superuser', label: 'Super User' },
    { value: 'admin', label: 'Amministratore' },
    { value: 'operatore', label: 'Operatore' }
  ];
}
