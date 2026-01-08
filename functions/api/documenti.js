/**
 * 🎯 PATTERN TEMPLATE: API CRUD per Entità "Documenti"
 *
 * Questo file implementa il pattern standard CRUD per l'entità Documento.
 * Per creare una nuova entità (es: Prodotti), copia questo file e:
 * 1. Sostituisci "Documento" con "Prodotto"
 * 2. Sostituisci "documenti" con "prodotti"
 * 3. Aggiorna i campi di validazione nella funzione validate*Data()
 * 4. Aggiorna il COLLECTION_NAME
 * 5. Importa la factory corretta da entityFactory.js
 *
 * Operazioni implementate:
 * - CREATE: createDocumentoRecordApi (utenti autenticati)
 * - UPDATE: updateDocumentoApi (solo admin)
 * - DELETE: deleteDocumentoApi (solo admin, elimina anche file Storage)
 *
 * NOTA: Documenti è un'entità speciale che gestisce sia Firestore che Storage
 *
 * Vedi: PATTERNS.md per la guida completa
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { region, corsOrigins, runtimeOpts } from "../config.js";
import { requireAuth, requireAdmin } from "../utils/authHelpers.js";
import { createDocumento } from "../../shared/schemas/entityFactory.js";
import { logAudit, AuditAction } from "../utils/auditLogger.js";

// 🔧 Inizializza Firebase Admin (singleton pattern)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

// 📝 CONFIGURAZIONE: Nome collection in Firestore
const COLLECTION_NAME = 'documenti';

/**
 * 🎯 STEP 1: VALIDAZIONE
 *
 * Valida i dati di un documento prima di salvarli.
 * Per nuove entità: copia questa funzione e aggiorna i campi validati.
 *
 * @param {object} data - I dati del documento da validare
 * @throws {HttpsError} Se i dati non sono validi
 */
function validateDocumentoData(data) {
  const required = ["nome", "tipo", "storagePath", "metadata"];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      throw new HttpsError("invalid-argument", `Campo '${field}' obbligatorio`);
    }
  }

  // Validazione tipo file
  if (typeof data.tipo !== 'string' || data.tipo.trim() === '') {
    throw new HttpsError('invalid-argument', 'Tipo file obbligatorio');
  }

  // Validazione storage path
  if (typeof data.storagePath !== 'string' || data.storagePath.trim() === '') {
    throw new HttpsError('invalid-argument', 'Storage path obbligatorio');
  }
}

/**
 * 🎯 CREATE API: Crea nuovo documento
 *
 * Permessi richiesti: UTENTE AUTENTICATO
 * Input: { nome, tipo, storagePath, entityType?, entityId?, metadata }
 * Output: { id, ...dati documento }
 *
 * Pattern CRUD Step-by-Step:
 * 1. SICUREZZA: Verifica autenticazione utente
 * 2. VALIDAZIONE: Controlla dati input
 * 3. BUSINESS LOGIC: Usa factory per creare oggetto
 * 4. DATABASE: Salva in Firestore
 * 5. LOGGING: Registra azione
 * 6. RESPONSE: Ritorna dati salvati
 */
export const createDocumentoRecordApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    // 1. SICUREZZA: Qualsiasi utente autenticato può creare un documento
    await requireAuth(request);
    const user = request.auth;

    const data = request.data || {};

    try {
      // 2. VALIDAZIONE: Controlla che i dati inviati siano validi
      validateDocumentoData(data);

      // 3. BUSINESS LOGIC: Crea l'oggetto documento usando la factory condivisa
      const nuovoDocumento = createDocumento({
        ...data,
        createdBy: user.uid,
        createdByEmail: user.token.email,
      });

      // 4. DATABASE: Salva il nuovo documento in Firestore
      const docRef = await db.collection(COLLECTION_NAME).add(nuovoDocumento);

      // 5. AUDIT LOG: Registra creazione documento
      await logAudit({
        entityType: 'documenti',
        entityId: docRef.id,
        action: AuditAction.CREATE,
        userId: user.uid,
        userEmail: user.token.email,
        newData: nuovoDocumento,
        source: 'web'
      });

      console.log(`Utente ${user.uid} ha creato il record documento ${docRef.id}`);

      // 6. RESPONSE: Ritorna dati salvati
      return { success: true, id: docRef.id, ...nuovoDocumento };

    } catch (error) {
      console.error("Errore durante la creazione del record documento:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Impossibile creare il record del documento.');
    }
  }
);

/**
 * 🎯 DELETE API: Elimina documento
 *
 * Permessi richiesti: ADMIN
 * Input: { docId, storagePath }
 * Output: { success: true }
 *
 * NOTA: Elimina sia record Firestore che file fisico da Storage
 */
export const deleteDocumentoApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    // 1. SICUREZZA: Solo gli admin possono eliminare documenti
    await requireAdmin(request);

    const { uid } = request.auth;
    const { docId, storagePath } = request.data || {};

    if (!docId || !storagePath) {
      throw new HttpsError("invalid-argument", "docId e storagePath sono obbligatori");
    }

    // 2. DATABASE: Recupera dati e elimina il record da Firestore
    let oldData = null;
    try {
      const docRef = db.collection(COLLECTION_NAME).doc(docId);
      const docSnapshot = await docRef.get();
      oldData = docSnapshot.exists ? docSnapshot.data() : null;

      await docRef.delete();
      console.log(`Utente ${uid} ha eliminato il record documento ${docId} da Firestore.`);
    } catch (err) {
      console.error("Errore cancellazione documento in Firestore:", err);
      throw new HttpsError("internal", "Impossibile cancellare il documento");
    }

    // 3. STORAGE: Elimina il file fisico
    try {
      const bucket = storage.bucket();
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
      console.log(`Utente ${uid} ha eliminato il file ${storagePath} da Storage.`);
    } catch (err) {
      console.error("Errore cancellazione file Storage:", err);
      // Non rilanciamo l'errore per non bloccare l'operazione se il record DB è già stato rimosso,
      // ma è importante loggarlo per un'eventuale pulizia manuale (orphaned files).
    }

    // AUDIT LOG: Registra eliminazione documento
    await logAudit({
      entityType: 'documenti',
      entityId: docId,
      action: AuditAction.DELETE,
      userId: uid,
      userEmail: request.auth.token.email,
      oldData: oldData,
      metadata: { storagePath: storagePath },
      source: 'web'
    });

    return { success: true };
  }
);

/**
 * 🎯 UPDATE API: Aggiorna metadati documento
 *
 * Permessi richiesti: ADMIN
 * Input: { id, ...updateData }
 * Output: { message }
 */
export const updateDocumentoApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    // 1. SICUREZZA: Solo admin possono modificare documenti
    await requireAdmin(request);
    const { uid } = request.auth;
    const { id, ...updateData } = request.data;

    if (!id) {
      throw new HttpsError("invalid-argument", "L'ID del documento è obbligatorio.");
    }

    try {
      const docRef = db.collection(COLLECTION_NAME).doc(id);

      // Recupera dati attuali per audit
      const oldDoc = await docRef.get();
      const oldData = oldDoc.exists ? oldDoc.data() : null;

      // 2. DATABASE: Aggiunge timestamp di aggiornamento
      const dataToUpdate = {
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.update(dataToUpdate);

      // AUDIT LOG: Registra modifica documento
      await logAudit({
        entityType: 'documenti',
        entityId: id,
        action: AuditAction.UPDATE,
        userId: uid,
        userEmail: request.auth.token.email,
        oldData: oldData,
        newData: dataToUpdate,
        source: 'web'
      });

      // 3. LOGGING: Registra azione
      console.log(`Utente ${uid} ha aggiornato il documento ${id}`);

      return { message: "Documento aggiornato con successo." };
    } catch (error) {
      console.error(`Errore durante l'aggiornamento del documento ${id}:`, error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Impossibile aggiornare il documento.');
    }
  }
);
