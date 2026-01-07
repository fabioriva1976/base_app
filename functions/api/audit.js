import { onCall, HttpsError } from "firebase-functions/v2/https";
import { region, corsOrigins, runtimeOpts } from "../config.js";
import { requireAdmin } from "../utils/authHelpers.js";
import {
    getAuditLogs,
    getAuditLogsByUser,
    getAuditLogsWithFilters
} from "../utils/auditLogger.js";

/**
 * API per recuperare i log di audit per una specifica entità.
 * Solo gli admin possono accedervi.
 */
export const getEntityAuditLogsApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
    await requireAdmin(request);
    const { entityType, entityId, limit } = request.data;

    if (!entityType || !entityId) {
        throw new HttpsError("invalid-argument", "entityType e entityId sono obbligatori.");
    }

    return await getAuditLogs(entityType, entityId, limit);
});

/**
 * API per recuperare i log di audit per un utente specifico.
 * Solo gli admin possono accedervi.
 */
export const getUserAuditLogsApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
    await requireAdmin(request);
    const { userId, limit } = request.data;

    if (!userId) {
        throw new HttpsError("invalid-argument", "userId è obbligatorio.");
    }

    return await getAuditLogsByUser(userId, limit);
});

/**
 * API per cercare i log di audit con filtri.
 * Solo gli admin possono accedervi.
 */
export const searchAuditLogsApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
    await requireAdmin(request);
    const filters = request.data || {};

    // Converte le date stringa in oggetti Date se presenti
    if (filters.startDate) {
        filters.startDate = new Date(filters.startDate);
    }
    if (filters.endDate) {
        filters.endDate = new Date(filters.endDate);
    }

    return await getAuditLogsWithFilters(filters);
});