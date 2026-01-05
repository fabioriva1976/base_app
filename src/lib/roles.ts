// Tipi di ruoli disponibili nell'applicazione
export type UserRole = 'superuser' | 'admin' | 'operatore';

// Interfaccia per l'utente con ruolo
export interface UserWithRole {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  ruolo?: UserRole;
}

// Verifica se l'utente è superuser
export function isSuperUser(user: UserWithRole | null | undefined): boolean {
  return user?.ruolo === 'superuser';
}

// Verifica se l'utente è admin o superuser
export function isAdmin(user: UserWithRole | null | undefined): boolean {
  return user?.ruolo === 'admin' || user?.ruolo === 'superuser';
}

// Verifica se l'utente è operatore (o superiore)
export function isOperator(user: UserWithRole | null | undefined): boolean {
  return user?.ruolo === 'operatore' || user?.ruolo === 'admin' || user?.ruolo === 'superuser';
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
export function getRoleLabel(role: UserRole | undefined): string {
  switch (role) {
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
