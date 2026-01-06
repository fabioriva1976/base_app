// functions/api/auditLogs.js

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getAuditLogs, getAuditLogsByUser, getAuditLogsWithFilters, logAudit, AuditAction } = require("../utils/auditLogger");
const { region, corsOrigins, runtimeOpts } = require("../index");
const { requireAdmin, requireAuth } = require("../utils/authHelpers");

/**
 * API per recuperare gli audit logs di un'entità specifica - SOLO ADMIN
 */
exports.getEntityAuditLogsApi = onCall({ region: region }, async (request) => {
    // Log di debug
    console.log('getEntityAuditLogsApi chiamata');
    console.log('request.auth:', request.auth);
    console.log('request.data:', request.data);

    // ✅ SECURITY: Richiede ruolo admin o superiore
    await requireAdmin(request);

    try {
        const { entityType, entityId, limit } = request.data;

        // Validazione parametri
        if (!entityType || !entityId) {
            throw new HttpsError(
                'invalid-argument',
                'entityType e entityId sono obbligatori'
            );
        }

        // Recupera i log di audit
        const logs = await getAuditLogs(entityType, entityId, limit || 50);

        return { logs };

    } catch (error) {
        console.error("Errore nel recupero degli audit logs:", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * API per recuperare tutti i log di audit di un utente - SOLO ADMIN
 */
exports.getUserAuditLogsApi = onCall({ region: region }, async (request) => {
    // ✅ SECURITY: Richiede ruolo admin o superiore
    await requireAdmin(request);

    try {
        const { userId, limit } = request.data;

        // Validazione parametri
        if (!userId) {
            throw new HttpsError(
                'invalid-argument',
                'userId è obbligatorio'
            );
        }

        // Recupera i log di audit per l'utente
        const logs = await getAuditLogsByUser(userId, limit || 50);

        return { logs };

    } catch (error) {
        console.error("Errore nel recupero degli audit logs per utente:", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * API per cercare audit logs con filtri avanzati - SOLO ADMIN
 */
exports.searchAuditLogsApi = onCall({ region: region }, async (request) => {
    // ✅ SECURITY: Richiede ruolo admin o superiore
    await requireAdmin(request);

    try {
        const data = request.data;

        const filters = {
            entityType: data.entityType,
            action: data.action,
            userId: data.userId,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            limit: data.limit || 100
        };

        // Recupera i log di audit con filtri
        const logs = await getAuditLogsWithFilters(filters);

        return { logs };

    } catch (error) {
        console.error("Errore nella ricerca degli audit logs:", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * API per creare manualmente un audit log
 * Usata per registrare azioni come caricamento/cancellazione documenti
 * Tutti gli utenti autenticati possono creare audit logs per le proprie azioni
 */
exports.createAuditLogApi = onCall({ region: region }, async (request) => {
    // ✅ SECURITY: Richiede solo autenticazione (tutti i ruoli possono creare audit log per le proprie azioni)
    requireAuth(request);

    try {
        const { entityType, entityId, action, metadata } = request.data;

        // Validazione parametri
        if (!entityType || !entityId || !action) {
            throw new HttpsError(
                'invalid-argument',
                'entityType, entityId e action sono obbligatori'
            );
        }

        // Validazione azione
        const validActions = ['create', 'update', 'delete', 'read'];
        if (!validActions.includes(action)) {
            throw new HttpsError(
                'invalid-argument',
                `action deve essere uno di: ${validActions.join(', ')}`
            );
        }

        // Crea l'audit log
        const auditId = await logAudit({
            entityType,
            entityId,
            action,
            userId: request.auth.uid,
            userEmail: request.auth.token.email || null,
            metadata: metadata || {},
            source: 'web'
        });

        return { success: true, auditId };

    } catch (error) {
        console.error("Errore nella creazione dell'audit log:", error);
        throw new HttpsError('internal', error.message);
    }
});
