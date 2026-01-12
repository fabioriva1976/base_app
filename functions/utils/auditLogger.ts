// functions/utils/auditLogger.ts

import admin from "firebase-admin";
import type { Query } from "firebase-admin/firestore";
import { COLLECTIONS } from "../../shared/constants/collections.ts";

// Lazy initialization - ottiene Firestore solo quando serve
function getDb() {
    return admin.firestore();
}

/**
 * Enum per i tipi di azioni
 */
export const AuditAction = {
    CREATE: "create",
    UPDATE: "update",
    DELETE: "delete",
    READ: "read", // Opzionale: per tracciare anche le letture sensibili
};

type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

interface AuditLogParams {
    entityType: string;
    entityId: string;
    action: AuditActionType;
    userId?: string | null;
    userEmail?: string | null;
    oldData?: unknown;
    newData?: unknown;
    metadata?: unknown;
    source?: string | null;
    details?: string | null;
}

/**
 * Registra un'azione di audit nel database Firestore
 *
 * @param {Object} params - Parametri per il log di audit
 * @param {string} params.entityType - Tipo di entità (es: 'users', 'documenti', 'settings')
 * @param {string} params.entityId - ID dell'entità modificata
 * @param {string} params.action - Tipo di azione: 'create', 'update', 'delete', 'read'
 * @param {string|null} params.userId - UID dell'utente che ha effettuato l'azione
 * @param {string|null} params.userEmail - Email dell'utente che ha effettuato l'azione
 * @param {Object|null} params.oldData - Dati prima della modifica (per update e delete)
 * @param {Object|null} params.newData - Dati dopo la modifica (per create e update)
 * @param {Object|null} params.metadata - Metadati aggiuntivi (es: IP, user agent, motivo)
 * @param {string|null} params.source - Fonte dell'operazione (es: 'web', 'api', 'cron', 'mobile')
 *
 * @returns {Promise<string>} ID del documento di audit creato
 */
export async function logAudit({
    entityType,
    entityId,
    action,
    userId = null,
    userEmail = null,
    oldData = null,
    newData = null,
    metadata = null,
    source = null,
    details = null
}: AuditLogParams): Promise<string> {
    try {
        // Validazione parametri obbligatori
        if (!entityType || !entityId || !action) {
            throw new Error("entityType, entityId e action sono obbligatori");
        }

        if (!Object.values(AuditAction).includes(action)) {
            throw new Error(`Azione non valida. Usa uno di: ${Object.values(AuditAction).join(", ")}`);
        }

        // Crea il documento di audit
        const auditLog = {
            entityType,
            entityId,
            action,
            userId,
            userEmail,
            timestamp: new Date(),
            oldData: oldData ? sanitizeData(oldData) : null,
            newData: newData ? sanitizeData(newData) : null,
            metadata: metadata || {},
            source: source || "unknown",
            details: details || null
        };

        // Salva nel database nella collection 'audit_logs'
        const docRef = await getDb().collection(COLLECTIONS.AUDIT_LOGS).add(auditLog);

        console.log(`Audit log creato: ${docRef.id} - ${action} su ${entityType}/${entityId}`);
        return docRef.id;

    } catch (error) {
        // Log dell'errore ma non blocca l'operazione principale
        console.error("Errore durante la creazione dell'audit log:", error);
        throw error; // Puoi decidere se propagare l'errore o gestirlo silenziosamente
    }
}

/**
 * Sanitizza i dati rimuovendo campi sensibili prima del salvataggio
 *
 * @param {Object} data - Dati da sanitizzare
 * @returns {Object} Dati sanitizzati
 */
function sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== "object") {
        return data;
    }

    // Crea una copia profonda per evitare modifiche all'oggetto originale
    const sanitized = JSON.parse(JSON.stringify(data));

    // Lista di campi sensibili da rimuovere o mascherare
    const sensitiveFields = [
        "password",
        "passwordHash",
        "secret",
        "apiKey",
        "token",
        "accessToken",
        "refreshToken",
        "privateKey",
        "creditCard",
        "cvv",
        "pin"
    ];

    // Funzione ricorsiva per pulire gli oggetti annidati
    function cleanObject(obj: unknown): unknown {
        if (Array.isArray(obj)) {
            return obj.map(item => cleanObject(item));
        }

        if (obj && typeof obj === "object") {
            const cleaned: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(obj)) {
                // Se il campo è sensibile, mascheralo
                if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                    cleaned[key] = "***REDACTED***";
                } else {
                    cleaned[key] = cleanObject(value);
                }
            }
            return cleaned;
        }

        return obj;
    }

    return cleanObject(sanitized);
}

/**
 * Recupera i log di audit per una specifica entità
 *
 * @param {string} entityType - Tipo di entità
 * @param {string} entityId - ID dell'entità
 * @param {number} limit - Numero massimo di risultati (default: 50)
 * @returns {Promise<Array>} Array di log di audit
 */
export async function getAuditLogs(entityType, entityId, limit = 50) {
    try {
        const snapshot = await getDb().collection(COLLECTIONS.AUDIT_LOGS)
            .where("entityType", "==", entityType)
            .where("entityId", "==", entityId)
            .orderBy("timestamp", "desc")
            .limit(limit)
            .get();

        const logs: Array<Record<string, unknown>> = [];
        snapshot.forEach(doc => {
            logs.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return logs;
    } catch (error) {
        console.error("Errore nel recupero degli audit logs:", error);
        throw error;
    }
}

/**
 * Recupera i log di audit per un utente specifico
 *
 * @param {string} userId - UID dell'utente
 * @param {number} limit - Numero massimo di risultati (default: 50)
 * @returns {Promise<Array>} Array di log di audit
 */
export async function getAuditLogsByUser(userId, limit = 50) {
    try {
        const snapshot = await getDb().collection(COLLECTIONS.AUDIT_LOGS)
            .where("userId", "==", userId)
            .orderBy("timestamp", "desc")
            .limit(limit)
            .get();

        const logs: Array<Record<string, unknown>> = [];
        snapshot.forEach(doc => {
            logs.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return logs;
    } catch (error) {
        console.error("Errore nel recupero degli audit logs per utente:", error);
        throw error;
    }
}

/**
 * Recupera tutti i log di audit con filtri opzionali
 *
 * @param {Object} filters - Filtri opzionali
 * @param {string} filters.entityType - Filtra per tipo di entità
 * @param {string} filters.action - Filtra per tipo di azione
 * @param {string} filters.userId - Filtra per utente
 * @param {Date} filters.startDate - Data inizio
 * @param {Date} filters.endDate - Data fine
 * @param {number} filters.limit - Numero massimo di risultati (default: 100)
 * @returns {Promise<Array>} Array di log di audit
 */
interface AuditLogFilters {
    entityType?: string;
    action?: AuditActionType;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}

export async function getAuditLogsWithFilters(filters: AuditLogFilters = {}) {
    try {
        let query: Query = getDb().collection(COLLECTIONS.AUDIT_LOGS);

        if (filters.entityType) {
            query = query.where("entityType", "==", filters.entityType);
        }

        if (filters.action) {
            query = query.where("action", "==", filters.action);
        }

        if (filters.userId) {
            query = query.where("userId", "==", filters.userId);
        }

        if (filters.startDate) {
            query = query.where("timestamp", ">=", filters.startDate);
        }

        if (filters.endDate) {
            query = query.where("timestamp", "<=", filters.endDate);
        }

        query = query.orderBy("timestamp", "desc");
        query = query.limit(filters.limit || 100);

        const snapshot = await query.get();

        const logs: Array<Record<string, unknown>> = [];
        snapshot.forEach(doc => {
            logs.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return logs;
    } catch (error) {
        console.error("Errore nel recupero degli audit logs con filtri:", error);
        throw error;
    }
}

/**
 * Elimina i log di audit più vecchi di un certo numero di giorni
 * Utile per essere chiamata da un cron job
 *
 * @param {number} daysToKeep - Numero di giorni di log da mantenere
 * @returns {Promise<number>} Numero di log eliminati
 */
export async function cleanOldAuditLogs(daysToKeep = 90) {
    try {
        const db = getDb();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const snapshot = await getDb().collection(COLLECTIONS.AUDIT_LOGS)
            .where("timestamp", "<", cutoffDate)
            .get();

        if (snapshot.empty) {
            console.log("Nessun log da eliminare");
            return 0;
        }

        // Elimina in batch per efficienza
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`Eliminati ${snapshot.size} audit logs più vecchi di ${daysToKeep} giorni`);

        return snapshot.size;
    } catch (error) {
        console.error("Errore nell'eliminazione degli audit logs vecchi:", error);
        throw error;
    }
}
