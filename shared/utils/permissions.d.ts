/**
 * 🔐 Sistema di Permessi Basato su Ruoli
 *
 * Questo file definisce i ruoli utente e le funzioni helper per controllare i permessi.
 */
export declare const ROLES: {
    readonly OPERATORE: "operatore";
    readonly ADMIN: "admin";
    readonly SUPERUSER: "superuser";
};
export type UserRole = typeof ROLES[keyof typeof ROLES];
/**
 * Mappa dei permessi per ogni ruolo
 */
export declare const PERMISSIONS: {
    readonly operatore: {
        readonly canViewDashboard: true;
        readonly canViewClienti: true;
        readonly canCreateClienti: true;
        readonly canUpdateClienti: true;
        readonly canDeleteClienti: false;
        readonly canViewUsers: false;
        readonly canCreateUsers: false;
        readonly canUpdateUsers: false;
        readonly canDeleteUsers: false;
        readonly canViewSettings: false;
        readonly canUpdateSettings: false;
        readonly canViewAuditLogs: false;
    };
    readonly admin: {
        readonly canViewDashboard: true;
        readonly canViewClienti: true;
        readonly canCreateClienti: true;
        readonly canUpdateClienti: true;
        readonly canDeleteClienti: true;
        readonly canViewUsers: true;
        readonly canCreateUsers: true;
        readonly canUpdateUsers: true;
        readonly canDeleteUsers: true;
        readonly canViewSettings: false;
        readonly canUpdateSettings: false;
        readonly canViewAuditLogs: true;
    };
    readonly superuser: {
        readonly canViewDashboard: true;
        readonly canViewClienti: true;
        readonly canCreateClienti: true;
        readonly canUpdateClienti: true;
        readonly canDeleteClienti: true;
        readonly canViewUsers: true;
        readonly canCreateUsers: true;
        readonly canUpdateUsers: true;
        readonly canDeleteUsers: true;
        readonly canViewSettings: true;
        readonly canUpdateSettings: true;
        readonly canViewAuditLogs: true;
        readonly canManageSuperusers: true;
    };
};
/**
 * Verifica se un utente ha un determinato permesso
 *
 * @param userRole - Ruolo dell'utente (può essere stringa o array)
 * @param permission - Nome del permesso da verificare
 * @returns true se l'utente ha il permesso
 *
 * @example
 * hasPermission('operatore', 'canViewUsers') // false
 * hasPermission('admin', 'canViewUsers') // true
 * hasPermission(['admin', 'superuser'], 'canViewUsers') // true
 */
export declare function hasPermission(userRole: UserRole | UserRole[] | string | string[] | undefined | null, permission: keyof typeof PERMISSIONS[typeof ROLES.ADMIN]): boolean;
/**
 * Verifica se un utente è admin (admin o superuser)
 *
 * @param userRole - Ruolo dell'utente
 * @returns true se l'utente è admin o superuser
 *
 * @example
 * isAdmin('operatore') // false
 * isAdmin('admin') // true
 * isAdmin(['operatore', 'admin']) // true
 */
export declare function isAdmin(userRole: UserRole | UserRole[] | string | string[] | undefined | null): boolean;
/**
 * Verifica se un utente è superuser
 *
 * @param userRole - Ruolo dell'utente
 * @returns true se l'utente è superuser
 */
export declare function isSuperuser(userRole: UserRole | UserRole[] | string | string[] | undefined | null): boolean;
/**
 * Verifica se un utente è operatore (solo operatore, non admin)
 *
 * @param userRole - Ruolo dell'utente
 * @returns true se l'utente è SOLO operatore
 */
export declare function isOperatore(userRole: UserRole | UserRole[] | string | string[] | undefined | null): boolean;
/**
 * Ottiene tutti i permessi per un determinato ruolo
 *
 * @param userRole - Ruolo dell'utente
 * @returns Oggetto con tutti i permessi
 */
export declare function getPermissions(userRole: UserRole | UserRole[] | string | string[]): Record<string, boolean>;
/**
 * Mappa delle rotte e permessi richiesti
 */
export declare const PROTECTED_ROUTES: {
    readonly '/users': "canViewUsers";
    readonly '/configurazioni': "canViewSettings";
    readonly '/settings': "canViewSettings";
    readonly '/audit-logs': "canViewAuditLogs";
};
/**
 * Verifica se un utente può accedere a una determinata rotta
 *
 * @param userRole - Ruolo dell'utente
 * @param path - Path della rotta
 * @returns true se l'utente può accedere
 *
 * @example
 * canAccessRoute('operatore', '/users') // false
 * canAccessRoute('admin', '/users') // true
 */
export declare function canAccessRoute(userRole: UserRole | UserRole[] | string | string[] | undefined | null, path: string): boolean;
