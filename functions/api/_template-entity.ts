/**
 * 🎯 TEMPLATE: API CRUD standard (stile "clienti")
 *
 * Copia questo file per una nuova entita (es: prodotti) e sostituisci:
 * - [EntityName] -> Prodotto
 * - [entita] -> prodotti
 * - COLLECTION_NAME -> COLLECTIONS.PRODOTTI
 * - validate[EntityName]Data -> campi/validazioni specifiche
 *
 * Operazioni implementate:
 * - CREATE: create[EntityName]Api (solo admin)
 * - UPDATE: update[EntityName]Api (solo admin)
 * - DELETE: delete[EntityName]Api (solo admin)
 *
 * NOTE:
 * - Lettura (LIST/GET) via real-time stores sul client.
 * - Usa sempre la factory condivisa in shared/schemas/entityFactory.ts
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { requireAdmin } from "../utils/authHelpers.ts";
import { create[EntityName] } from "../../shared/schemas/entityFactory.ts";
import { region, corsOrigins } from "../config.ts";
import { logAudit, AuditAction } from "../utils/auditLogger.ts";
import { COLLECTIONS } from "../../shared/constants/collections.ts";

if (getApps().length === 0) {
  initializeApp();
}
const db = getFirestore();

const COLLECTION_NAME = COLLECTIONS.[ENTITA];

function validate[EntityName]Data(data) {
  if (!data.[campo_obbligatorio] || typeof data.[campo_obbligatorio] !== "string") {
    throw new HttpsError("invalid-argument", "[campo_obbligatorio] e obbligatorio.");
  }
  if (data.email && (typeof data.email !== "string" || !data.email.includes("@"))) {
    throw new HttpsError("invalid-argument", "Email non valida.");
  }
}

export const create[EntityName]Api = onCall(
  { region: region, cors: corsOrigins },
  async (request) => {
    await requireAdmin(request);

    const { uid, token } = request.auth;
    const data = request.data;

    try {
      validate[EntityName]Data(data);

      const nuovo[EntityName] = create[EntityName]({
        ...data,
        createdBy: uid,
        createdByEmail: token.email
      });

      const docRef = await db.collection(COLLECTION_NAME).add(nuovo[EntityName]);
      const newDoc = await docRef.get();
      const newData = newDoc.exists ? newDoc.data() : nuovo[EntityName];

      await logAudit({
        entityType: COLLECTION_NAME,
        entityId: docRef.id,
        action: AuditAction.CREATE,
        userId: uid,
        userEmail: token.email,
        newData: newData,
        source: "web"
      });

      return { id: docRef.id, ...nuovo[EntityName] };
    } catch (error) {
      console.error("Errore durante la creazione:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Impossibile creare [entita].");
    }
  }
);

export const update[EntityName]Api = onCall(
  { region: region, cors: corsOrigins },
  async (request) => {
    await requireAdmin(request);

    const { uid } = request.auth;
    const { id, ...updateData } = request.data;

    if (!id) {
      throw new HttpsError("invalid-argument", "ID [entita] obbligatorio.");
    }

    try {
      validate[EntityName]Data(updateData);

      const docRef = db.collection(COLLECTION_NAME).doc(id);
      const oldDoc = await docRef.get();
      const oldData = oldDoc.exists ? oldDoc.data() : null;

      // Aggiorna solo changed e lastModified*, preservando created e createdBy/Email (immutabili)
      const dataToUpdate = {
        ...updateData,
        changed: FieldValue.serverTimestamp(),
        lastModifiedBy: uid,
        lastModifiedByEmail: request.auth.token.email
        // ⚠️ NON eliminare created, createdBy, createdByEmail (sono immutabili)
      };

      await docRef.update(dataToUpdate);
      const newDoc = await docRef.get();
      const newData = newDoc.exists ? newDoc.data() : dataToUpdate;

      await logAudit({
        entityType: COLLECTION_NAME,
        entityId: id,
        action: AuditAction.UPDATE,
        userId: uid,
        userEmail: request.auth.token.email,
        oldData: oldData,
        newData: newData,
        source: "web"
      });

      return { message: "[Entita] aggiornata con successo." };
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Impossibile aggiornare [entita].");
    }
  }
);

export const delete[EntityName]Api = onCall(
  { region: region, cors: corsOrigins },
  async (request) => {
    await requireAdmin(request);

    const { uid } = request.auth;
    const { id } = request.data;

    if (!id) {
      throw new HttpsError("invalid-argument", "ID [entita] obbligatorio.");
    }

    try {
      const docRef = db.collection(COLLECTION_NAME).doc(id);
      const oldDoc = await docRef.get();
      const oldData = oldDoc.exists ? oldDoc.data() : null;

      await docRef.delete();

      await logAudit({
        entityType: COLLECTION_NAME,
        entityId: id,
        action: AuditAction.DELETE,
        userId: uid,
        userEmail: request.auth.token.email,
        oldData: oldData,
        source: "web"
      });

      console.log(`Utente ${uid} ha eliminato [entita] ${id}`);
      return { message: "[Entita] eliminata con successo." };
    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
      throw new HttpsError("internal", "Impossibile eliminare [entita].");
    }
  }
);
