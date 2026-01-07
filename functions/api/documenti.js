import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { region, corsOrigins, runtimeOpts } from "../config.js";
import { requireAuth, requireAdmin } from "../utils/authHelpers.js";
import { createDocumento } from "../../shared/schemas/entityFactory.js";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

/**
 * Valida i dati per la creazione di un documento.
 * In un'app reale, si userebbe una libreria come Zod.
 * @param {object} data - Dati inviati dal client.
 */
function validateCreatePayload(data) {
  const required = ["nome", "tipo", "storagePath", "metadata"];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      throw new HttpsError("invalid-argument", `Campo '${field}' obbligatorio`);
    }
  }
}

/**
 * API per creare il record di un documento in Firestore.
 * Accessibile da qualsiasi utente autenticato.
 */
export const createDocumentoRecordApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    // 1. Sicurezza: Qualsiasi utente autenticato può creare un record per un file che ha caricato.
    await requireAuth(request);
    const user = request.auth;

    const data = request.data || {};

    try {
      // 2. Validazione: Controlla che i dati inviati siano validi.
      validateCreatePayload(data);

      // 3. Logica di Business: Crea l'oggetto documento usando la factory condivisa.
      const nuovoDocumento = createDocumento({
        ...data,
        createdBy: user.uid,
        createdByEmail: user.token.email,
      });

      // 4. Interazione DB: Salva il nuovo documento in Firestore.
      const docRef = await db.collection("documenti").add(nuovoDocumento);
      console.log(`Utente ${user.uid} ha creato il record documento ${docRef.id}`);

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
 * API per eliminare un documento (record Firestore + file in Storage).
 * Solo gli utenti con ruolo 'admin' o 'superuser' possono accedervi.
 */
export const deleteDocumentoApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    // 1. Sicurezza: Solo gli admin possono eliminare documenti.
    await requireAdmin(request);

    const { uid } = request.auth;
    const { docId, storagePath } = request.data || {};

    if (!docId || !storagePath) {
      throw new HttpsError("invalid-argument", "docId e storagePath sono obbligatori");
    }

    // 2. Interazione DB: Elimina il record da Firestore.
    try {
      await db.collection("documenti").doc(docId).delete();
      console.log(`Utente ${uid} ha eliminato il record documento ${docId} da Firestore.`);
    } catch (err) {
      console.error("Errore cancellazione documento in Firestore:", err);
      throw new HttpsError("internal", "Impossibile cancellare il documento");
    }

    // 3. Interazione Storage: Elimina il file fisico.
    try {
      const bucket = storage.bucket();
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
      console.log(`Utente ${uid} ha eliminato il file ${storagePath} da Storage.`);
    } catch (err) {
      console.error("Errore cancellazione file Storage:", err);
      // Non rilanciamo l'errore per non bloccare l'operazione se il record DB è già stato rimosso,
      // ma è importante loggarlo per un'eventuale pulizia manuale (orphaned files).
    }

    return { success: true };
  }
);

/**
 * API per aggiornare i metadati di un documento.
 * Solo gli utenti con ruolo 'admin' o 'superuser' possono accedervi.
 */
export const updateDocumentoApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    await requireAdmin(request);
    const { uid } = request.auth;
    const { id, ...updateData } = request.data;

    if (!id) {
      throw new HttpsError("invalid-argument", "L'ID del documento è obbligatorio.");
    }

    const docRef = db.collection("documenti").doc(id);
    const dataToUpdate = {
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.update(dataToUpdate);
    console.log(`Utente ${uid} ha aggiornato il documento ${id}`);

    return { message: "Documento aggiornato con successo." };
  }
);
