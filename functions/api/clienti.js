/**
 * 🎯 PATTERN TEMPLATE: API CRUD per Entità "Clienti"
 *
 * Questo file implementa il pattern standard CRUD per l'entità Cliente.
 * Per creare una nuova entità (es: Prodotti), copia questo file e:
 * 1. Sostituisci "Cliente" con "Prodotto"
 * 2. Sostituisci "clienti" con "prodotti"
 * 3. Aggiorna i campi di validazione nella funzione validate*Data()
 * 4. Aggiorna il COLLECTION_NAME
 * 5. Importa la factory corretta da entityFactory.js
 *
 * Operazioni implementate:
 * - CREATE: createClienteApi (solo admin)
 * - UPDATE: updateClienteApi (solo admin)
 * - DELETE: deleteClienteApi (solo admin)
 *
 * NOTA: La lettura (LIST/GET) è gestita client-side tramite real-time stores (nanostores + Firebase onSnapshot)
 *
 * Vedi: PATTERNS.md per la guida completa
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { requireAdmin } from "../utils/authHelpers.js";
import { createCliente } from "../../shared/schemas/entityFactory.js";
import { region, corsOrigins } from "../config.js";
import { logAudit, AuditAction } from "../utils/auditLogger.js";
import { COLLECTIONS } from "../../shared/constants/collections.js";

// 🔧 Inizializza Firebase Admin (singleton pattern)
if (getApps().length === 0) {
    initializeApp();
}
const db = getFirestore();

// 📝 CONFIGURAZIONE: Nome collection in Firestore
const COLLECTION_NAME = COLLECTIONS.CLIENTI;

/**
 * 🎯 STEP 1: VALIDAZIONE
 *
 * Valida i dati di un cliente prima di salvarli.
 * Per nuove entità: copia questa funzione e aggiorna i campi validati.
 *
 * @param {object} data - I dati del cliente da validare
 * @throws {HttpsError} Se i dati non sono validi
 */
function validateClienteData(data) {
    if (!data.ragione_sociale || typeof data.ragione_sociale !== 'string' || data.ragione_sociale.trim() === '') {
        throw new HttpsError('invalid-argument', 'La ragione sociale è obbligatoria.');
    }
    if (!data.codice || typeof data.codice !== 'string' || data.codice.trim() === '') {
        throw new HttpsError('invalid-argument', 'Il codice cliente è obbligatorio.');
    }
    if (data.email && (typeof data.email !== 'string' || !data.email.includes('@'))) {
        throw new HttpsError('invalid-argument', 'L\'email fornita non è valida.');
    }
}

/**
 * 🎯 CREATE API: Crea nuovo cliente
 *
 * Permessi richiesti: ADMIN
 * Input: { ragione_sociale, email?, telefono?, ... }
 * Output: { id, ...dati cliente }
 *
 * Pattern CRUD Step-by-Step:
 * 1. SICUREZZA: Verifica permessi utente
 * 2. VALIDAZIONE: Controlla dati input
 * 3. BUSINESS LOGIC: Usa factory per creare oggetto
 * 4. DATABASE: Salva in Firestore
 * 5. LOGGING: Registra azione
 * 6. RESPONSE: Ritorna dati salvati
 */
export const createClienteApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    // 1. SICUREZZA: Verifica che l'utente sia un admin
    await requireAdmin(request);

    const { uid, token } = request.auth;
    const data = request.data;

    try {
        // 2. VALIDAZIONE: Controlla che i dati inviati siano validi
        validateClienteData(data);

        // 3. BUSINESS LOGIC: Crea l'oggetto cliente usando la factory condivisa
        const nuovoCliente = createCliente({
            ...data,
            createdBy: uid,
            createdByEmail: token.email,
        });

        // 4. DATABASE: Salva il nuovo cliente in Firestore
        const docRef = await db.collection(COLLECTION_NAME).add(nuovoCliente);

        const newDoc = await docRef.get();
        const newData = newDoc.exists ? newDoc.data() : nuovoCliente;

        // 5. AUDIT LOG: Registra azione per tracciabilità
        await logAudit({
            entityType: COLLECTIONS.CLIENTI,
            entityId: docRef.id,
            action: AuditAction.CREATE,
            userId: uid,
            userEmail: token.email,
            newData: newData,
            source: 'web'
        });

        console.log(`Utente ${uid} ha creato il cliente ${docRef.id}`);

        // 6. RESPONSE: Ritorna ID + dati salvati
        return { id: docRef.id, ...nuovoCliente };

    } catch (error) {
        console.error("Errore durante la creazione del cliente:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile creare il cliente.');
    }
});

/**
 * API per aggiornare un cliente esistente.
 */
export const updateClienteApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    await requireAdmin(request);

    const { uid } = request.auth;
    const { id, ...updateData } = request.data;

    if (!id) {
        throw new HttpsError('invalid-argument', 'L\'ID del cliente è obbligatorio.');
    }

    try {
        validateClienteData(updateData);

        const clienteRef = db.collection(COLLECTION_NAME).doc(id);

        // Recupera i dati attuali per l'audit log
        const oldDoc = await clienteRef.get();
        const oldData = oldDoc.exists ? oldDoc.data() : null;

        // Aggiunge il timestamp di aggiornamento
        const now = new Date().toISOString();
        const dataToUpdate = {
            ...updateData,
            updatedAt: FieldValue.serverTimestamp(),
            changed: now,
            lastModifiedBy: uid,
            lastModifiedByEmail: request.auth.token.email,
            createdAt: FieldValue.delete(),
            updatedAt: FieldValue.delete(),
            createdBy: FieldValue.delete(),
            createdByEmail: FieldValue.delete()
        };

        await clienteRef.update(dataToUpdate);
        const newDoc = await clienteRef.get();
        const newData = newDoc.exists ? newDoc.data() : dataToUpdate;

        // AUDIT LOG: Registra modifica con dati before/after
        await logAudit({
            entityType: COLLECTIONS.CLIENTI,
            entityId: id,
            action: AuditAction.UPDATE,
            userId: uid,
            userEmail: request.auth.token.email,
            oldData: oldData,
            newData: newData,
            source: 'web'
        });

        console.log(`Utente ${uid} ha aggiornato il cliente ${id}`);

        return { message: "Cliente aggiornato con successo." };

    } catch (error) {
        console.error(`Errore durante l'aggiornamento del cliente ${id}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile aggiornare il cliente.');
    }
});

/**
 * API per eliminare un cliente.
 */
export const deleteClienteApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    await requireAdmin(request);

    const { uid } = request.auth;
    const { id } = request.data;

    if (!id) {
        throw new HttpsError('invalid-argument', 'L\'ID del cliente è obbligatorio.');
    }

    try {
        const clienteRef = db.collection(COLLECTION_NAME).doc(id);

        // Recupera i dati prima di eliminare per l'audit log
        const oldDoc = await clienteRef.get();
        const oldData = oldDoc.exists ? oldDoc.data() : null;

        await clienteRef.delete();

        // AUDIT LOG: Registra eliminazione con dati rimossi
        await logAudit({
            entityType: COLLECTIONS.CLIENTI,
            entityId: id,
            action: AuditAction.DELETE,
            userId: uid,
            userEmail: request.auth.token.email,
            oldData: oldData,
            source: 'web'
        });

        console.log(`Utente ${uid} ha eliminato il cliente ${id}`);
        return { message: "Cliente eliminato con successo." };
    } catch (error) {
        console.error(`Errore durante l'eliminazione del cliente ${id}:`, error);
        throw new HttpsError('internal', 'Impossibile eliminare il cliente.');
    }
});

