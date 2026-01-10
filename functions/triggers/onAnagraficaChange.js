import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { logAudit, AuditAction } from "../utils/auditLogger.js";
import { region, runtimeOpts } from "../config.js";
import { COLLECTIONS } from "../../shared/constants/collections.js";

/**
 * Controlla se ci sono effettivamente cambiamenti nei dati, escludendo campi di sistema
 * @param {Object} beforeData - Dati prima della modifica
 * @param {Object} afterData - Dati dopo la modifica
 * @returns {boolean} True se ci sono cambiamenti reali
 */
function hasActualChanges(beforeData, afterData) {
    // Campi di sistema da ignorare nel confronto
    const systemFields = ['created', 'changed', 'timestamp', 'lastModifiedBy', 'lastModifiedByEmail'];

    // Estrai tutti i campi unici da entrambi gli oggetti
    const allKeys = new Set([
        ...Object.keys(beforeData || {}),
        ...Object.keys(afterData || {})
    ]);

    // Controlla se c'è almeno un campo non di sistema che è cambiato
    for (const key of allKeys) {
        // Salta i campi di sistema
        if (systemFields.includes(key)) continue;

        const oldValue = beforeData?.[key];
        const newValue = afterData?.[key];

        // Confronta i valori
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            return true; // Trovato un cambiamento
        }
    }

    return false; // Nessun cambiamento reale
}

// NOTA: I trigger per la collezione 'utenti' sono gestiti in onUtentiChange.js
// per evitare duplicati negli audit logs

// Trigger per anagrafica_clienti
export const onAnagraficaClientiCreate = onDocumentCreated({ region, document: `${COLLECTIONS.CLIENTI}/{docId}`, ...runtimeOpts }, async (event) => {
    const afterData = event.data.data();
    await logAudit({
        entityType: COLLECTIONS.CLIENTI,
        entityId: event.params.docId,
        action: AuditAction.CREATE,
        userId: afterData?.lastModifiedBy || null,
        userEmail: afterData?.lastModifiedByEmail || null,
        newData: afterData,
        source: 'web'
    });
});

export const onAnagraficaClientiUpdate = onDocumentUpdated({ region, document: `${COLLECTIONS.CLIENTI}/{docId}`, ...runtimeOpts }, async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Controlla se ci sono effettivamente cambiamenti nei dati (escludendo campi di sistema)
    if (!hasActualChanges(beforeData, afterData)) {
        console.log(`Nessun cambiamento reale per anagrafica_clienti/${event.params.docId}, audit log non creato`);
        return;
    }

    await logAudit({
        entityType: COLLECTIONS.CLIENTI,
        entityId: event.params.docId,
        action: AuditAction.UPDATE,
        userId: afterData?.lastModifiedBy || null,
        userEmail: afterData?.lastModifiedByEmail || null,
        oldData: beforeData,
        newData: afterData,
        source: 'web'
    });
});

export const onAnagraficaClientiDelete = onDocumentDeleted({ region, document: `${COLLECTIONS.CLIENTI}/{docId}`, ...runtimeOpts }, async (event) => {
    const beforeData = event.data.data();
    await logAudit({
        entityType: COLLECTIONS.CLIENTI,
        entityId: event.params.docId,
        action: AuditAction.DELETE,
        userId: beforeData?.lastModifiedBy || null,
        userEmail: beforeData?.lastModifiedByEmail || null,
        oldData: beforeData,
        source: 'web'
    });
});

// Trigger per attachments
export const onAttachmentsCreate = onDocumentCreated({ region, document: `${COLLECTIONS.ATTACHMENTS}/{docId}`, ...runtimeOpts }, async (event) => {
    const afterData = event.data.data();
    await logAudit({
        entityType: COLLECTIONS.ATTACHMENTS,
        entityId: event.params.docId,
        action: AuditAction.CREATE,
        userId: afterData?.lastModifiedBy || null,
        userEmail: afterData?.lastModifiedByEmail || null,
        newData: afterData,
        source: 'web'
    });
});

export const onAttachmentsUpdate = onDocumentUpdated({ region, document: `${COLLECTIONS.ATTACHMENTS}/{docId}`, ...runtimeOpts }, async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Controlla se ci sono effettivamente cambiamenti nei dati (escludendo campi di sistema)
    if (!hasActualChanges(beforeData, afterData)) {
        console.log(`Nessun cambiamento reale per attachments/${event.params.docId}, audit log non creato`);
        return;
    }

    await logAudit({
        entityType: COLLECTIONS.ATTACHMENTS,
        entityId: event.params.docId,
        action: AuditAction.UPDATE,
        userId: afterData?.lastModifiedBy || null,
        userEmail: afterData?.lastModifiedByEmail || null,
        oldData: beforeData,
        newData: afterData,
        source: 'web'
    });
});

export const onAttachmentsDelete = onDocumentDeleted({ region, document: `${COLLECTIONS.ATTACHMENTS}/{docId}`, ...runtimeOpts }, async (event) => {
    const beforeData = event.data.data();
    await logAudit({
        entityType: COLLECTIONS.ATTACHMENTS,
        entityId: event.params.docId,
        action: AuditAction.DELETE,
        userId: beforeData?.lastModifiedBy || null,
        userEmail: beforeData?.lastModifiedByEmail || null,
        oldData: beforeData,
        source: 'web'
    });
});
