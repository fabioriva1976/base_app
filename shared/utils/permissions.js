/**
 * 🔐 Sistema di Permessi Basato su Ruoli
 *
 * Questo file definisce i ruoli utente e le funzioni helper per controllare i permessi.
 */
// ========================================
// 📋 DEFINIZIONE RUOLI
// ========================================
export const ROLES = {
    OPERATORE: 'operatore',
    ADMIN: 'admin',
    SUPERUSER: 'superuser'
};
// ========================================
// 🔒 PERMESSI PER RUOLO
// ========================================
/**
 * Mappa dei permessi per ogni ruolo
 */
export const PERMISSIONS = {
    // OPERATORE: Può solo visualizzare e gestire entità base
    [ROLES.OPERATORE]: {
        canViewDashboard: true,
        canViewClienti: true,
        canCreateClienti: true,
        canUpdateClienti: true,
        canDeleteClienti: false,
        canViewUsers: false, // ❌ Non può vedere utenti
        canCreateUsers: false,
        canUpdateUsers: false,
        canDeleteUsers: false,
        canViewSettings: false,
        canUpdateSettings: false,
        canViewAuditLogs: false
    },
    // ADMIN: Può fare tutto tranne gestire configurazioni e altri admin
    [ROLES.ADMIN]: {
        canViewDashboard: true,
        canViewClienti: true,
        canCreateClienti: true,
        canUpdateClienti: true,
        canDeleteClienti: true,
        canViewUsers: true, // ✅ Può vedere utenti
        canCreateUsers: true,
        canUpdateUsers: true,
        canDeleteUsers: true,
        canViewSettings: false, // ❌ Non può vedere configurazioni
        canUpdateSettings: false, // ❌ Non può modificare configurazioni
        canViewAuditLogs: true
    },
    // SUPERUSER: Può fare tutto
    [ROLES.SUPERUSER]: {
        canViewDashboard: true,
        canViewClienti: true,
        canCreateClienti: true,
        canUpdateClienti: true,
        canDeleteClienti: true,
        canViewUsers: true, // ✅ Può vedere utenti
        canCreateUsers: true,
        canUpdateUsers: true,
        canDeleteUsers: true,
        canViewSettings: true,
        canUpdateSettings: true,
        canViewAuditLogs: true,
        canManageSuperusers: true // Solo superuser può creare altri superuser
    }
};
// ========================================
// 🛡️ HELPER FUNCTIONS
// ========================================
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
export function hasPermission(userRole, permission) {
    if (!userRole)
        return false;
    // Normalizza a array
    const roles = Array.isArray(userRole) ? userRole : [userRole];
    // Verifica se almeno uno dei ruoli ha il permesso
    return roles.some(role => {
        const rolePermissions = PERMISSIONS[role];
        return rolePermissions?.[permission] === true;
    });
}
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
export function isAdmin(userRole) {
    if (!userRole)
        return false;
    const roles = Array.isArray(userRole) ? userRole : [userRole];
    return roles.some(role => role === ROLES.ADMIN || role === ROLES.SUPERUSER);
}
/**
 * Verifica se un utente è superuser
 *
 * @param userRole - Ruolo dell'utente
 * @returns true se l'utente è superuser
 */
export function isSuperuser(userRole) {
    if (!userRole)
        return false;
    const roles = Array.isArray(userRole) ? userRole : [userRole];
    return roles.includes(ROLES.SUPERUSER);
}
/**
 * Verifica se un utente è operatore (solo operatore, non admin)
 *
 * @param userRole - Ruolo dell'utente
 * @returns true se l'utente è SOLO operatore
 */
export function isOperatore(userRole) {
    if (!userRole)
        return false;
    const roles = Array.isArray(userRole) ? userRole : [userRole];
    return roles.includes(ROLES.OPERATORE) && !isAdmin(roles);
}
/**
 * Ottiene tutti i permessi per un determinato ruolo
 *
 * @param userRole - Ruolo dell'utente
 * @returns Oggetto con tutti i permessi
 */
export function getPermissions(userRole) {
    const roles = Array.isArray(userRole) ? userRole : [userRole];
    // Se ha più ruoli, unisci i permessi (OR logico)
    const mergedPermissions = {};
    for (const role of roles) {
        const rolePermissions = PERMISSIONS[role];
        if (rolePermissions) {
            Object.entries(rolePermissions).forEach(([key, value]) => {
                mergedPermissions[key] = mergedPermissions[key] || value;
            });
        }
    }
    return mergedPermissions;
}
// ========================================
// 🗺️ ROTTE PROTETTE
// ========================================
/**
 * Mappa delle rotte e permessi richiesti
 */
export const PROTECTED_ROUTES = {
    '/users': 'canViewUsers',
    '/configurazioni': 'canViewSettings', // Configurazioni solo per superuser
    '/settings': 'canViewSettings',
    '/audit-logs': 'canViewAuditLogs'
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
export function canAccessRoute(userRole, path) {
    // Se la rotta non è protetta, tutti possono accedere
    const requiredPermission = PROTECTED_ROUTES[path];
    if (!requiredPermission)
        return true;
    // Verifica il permesso richiesto
    return hasPermission(userRole, requiredPermission);
}
