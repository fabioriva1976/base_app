/**
 * 🎯 TEMPLATE: API CRUD standard (stile "clienti")
 *
 * Placeholder:
 * - __ENTITY_PASCAL__  -> Prodotto
 * - __ENTITY_CAMEL__   -> prodotto
 * - __ENTITA_SNAKE__   -> prodotti
 * - __ENTITA_CONST__   -> PRODOTTI
 * - __ENTITY_LABEL__   -> Prodotto
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { requireAdmin } from "../utils/authHelpers.ts";
import { create__ENTITY_PASCAL__ } from "../../shared/schemas/entityFactory.ts";
import { region, corsOrigins } from "../config.ts";
import { logAudit, AuditAction } from "../utils/auditLogger.ts";
import { COLLECTIONS } from "../../shared/constants/collections.ts";

if (getApps().length === 0) {
  initializeApp();
}
const db = getFirestore();

const COLLECTION_NAME = COLLECTIONS.__ENTITA_CONST__;

function validate__ENTITY_PASCAL__Data(data) {
  if (!data.campo_obbligatorio || typeof data.campo_obbligatorio !== "string") {
    throw new HttpsError("invalid-argument", "campo_obbligatorio e obbligatorio.");
  }
}

export const create__ENTITY_PASCAL__Api = onCall(
  { region: region, cors: corsOrigins },
  async (request) => {
    await requireAdmin(request);

    const { uid, token } = request.auth;
    const data = request.data;

    try {
      validate__ENTITY_PASCAL__Data(data);

      const nuovo__ENTITY_PASCAL__ = create__ENTITY_PASCAL__({
        ...data,
        createdBy: uid,
        createdByEmail: token.email
      });

      const docRef = await db.collection(COLLECTION_NAME).add(nuovo__ENTITY_PASCAL__);
      const newDoc = await docRef.get();
      const newData = newDoc.exists ? newDoc.data() : nuovo__ENTITY_PASCAL__;

      await logAudit({
        entityType: COLLECTION_NAME,
        entityId: docRef.id,
        action: AuditAction.CREATE,
        userId: uid,
        userEmail: token.email,
        newData: newData,
        source: "web"
      });

      return { id: docRef.id, ...nuovo__ENTITY_PASCAL__ };
    } catch (error) {
      console.error("Errore durante la creazione:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Impossibile creare __ENTITA_SNAKE__.");
    }
  }
);

export const update__ENTITY_PASCAL__Api = onCall(
  { region: region, cors: corsOrigins },
  async (request) => {
    await requireAdmin(request);

    const { uid } = request.auth;
    const { id, ...updateData } = request.data;

    if (!id) {
      throw new HttpsError("invalid-argument", "ID __ENTITA_SNAKE__ obbligatorio.");
    }

    try {
      validate__ENTITY_PASCAL__Data(updateData);

      const docRef = db.collection(COLLECTION_NAME).doc(id);
      const oldDoc = await docRef.get();
      const oldData = oldDoc.exists ? oldDoc.data() : null;

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

      return { message: "__ENTITY_LABEL__ aggiornata con successo." };
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Impossibile aggiornare __ENTITA_SNAKE__.");
    }
  }
);

export const delete__ENTITY_PASCAL__Api = onCall(
  { region: region, cors: corsOrigins },
  async (request) => {
    await requireAdmin(request);

    const { uid } = request.auth;
    const { id } = request.data;

    if (!id) {
      throw new HttpsError("invalid-argument", "ID __ENTITA_SNAKE__ obbligatorio.");
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

      console.log(`Utente ${uid} ha eliminato __ENTITA_SNAKE__ ${id}`);
      return { message: "__ENTITY_LABEL__ eliminata con successo." };
    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
      throw new HttpsError("internal", "Impossibile eliminare __ENTITA_SNAKE__.");
    }
  }
);
