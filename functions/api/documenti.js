const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { region, corsOrigins } = require("../index");
const { requireAuth } = require("../utils/authHelpers");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

function validateCreatePayload(data) {
  const required = ["entityId", "entityCollection", "name", "path", "url", "size", "type"];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      throw new HttpsError("invalid-argument", `Campo '${field}' obbligatorio`);
    }
  }
  return {
    entityId: String(data.entityId),
    entityCollection: String(data.entityCollection),
    name: String(data.name),
    path: String(data.path),
    url: String(data.url),
    size: Number(data.size),
    type: String(data.type),
    description: data.description ? String(data.description) : ""
  };
}

exports.createDocumentoRecordApi = onCall(
  { region, cors: corsOrigins },
  async (request) => {
    await requireAuth(request);
    const user = request.auth;

    const payload = validateCreatePayload(request.data || {});
    const now = new Date().toISOString();

    const docData = {
      entityId: payload.entityId,
      entityCollection: payload.entityCollection,
      name: payload.name,
      path: payload.path,
      url: payload.url,
      size: payload.size,
      type: payload.type,
      description: payload.description,
      createdAt: now,
      updatedAt: now,
      userId: user.uid,
      userEmail: user.token.email || null
    };

    const docRef = await db.collection("documenti").add(docData);
    return { success: true, id: docRef.id };
  }
);

exports.deleteDocumentoApi = onCall(
  { region, cors: corsOrigins },
  async (request) => {
    await requireAuth(request);
    const { docId, storagePath } = request.data || {};

    if (!docId || !storagePath) {
      throw new HttpsError("invalid-argument", "docId e storagePath sono obbligatori");
    }

    try {
      await db.collection("documenti").doc(docId).delete();
    } catch (err) {
      console.error("Errore cancellazione documento in Firestore:", err);
      throw new HttpsError("internal", "Impossibile cancellare il documento");
    }

    try {
      const bucket = storage.bucket();
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
    } catch (err) {
      console.error("Errore cancellazione file Storage:", err);
      // non rilanciamo per permettere comunque la rimozione logica
    }

    return { success: true };
  }
);
