import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { region, corsOrigins, runtimeOpts } from "../config.js";
import { requireSuperUser, requireAdmin } from "../utils/authHelpers.js";
import { COLLECTIONS } from "../../shared/constants/collections.js";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

function validateAi(data) {
  const requiredFields = ["provider", "apiKey", "model"];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      throw new HttpsError("invalid-argument", `Campo '${field}' obbligatorio per configurazione AI`);
    }
  }

  return {
    provider: String(data.provider),
    apiKey: String(data.apiKey),
    model: String(data.model),
    temperature: data.temperature !== undefined ? Number(data.temperature) : 0.7,
    maxTokens: data.maxTokens !== undefined ? Number(data.maxTokens) : 2048,
    timeout: data.timeout !== undefined ? Number(data.timeout) : 30,
    systemPrompt: data.systemPrompt !== undefined ? String(data.systemPrompt) : "",
    ragCorpusId: data.ragCorpusId ? String(data.ragCorpusId) : "",
    ragLocation: data.ragLocation ? String(data.ragLocation) : "europe-west1",
    enableContext: data.enableContext !== undefined ? Boolean(data.enableContext) : true,
    enableSafety: data.enableSafety !== undefined ? Boolean(data.enableSafety) : true
  };
}

// Lettura configurazione AI (admin/superuser)
export const getConfigAiApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    await requireAdmin(request);

    const db = admin.firestore();
    const docSnap = await db.collection(COLLECTIONS.CONFIG).doc("ai").get();
    if (!docSnap.exists) {
      return { exists: false, data: null };
    }
    return { exists: true, data: docSnap.data() };
  }
);

// Salvataggio configurazione AI (solo superuser)
export const saveConfigAiApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    await requireSuperUser(request);

    const sanitized = validateAi(request.data?.data || {});

    const db = admin.firestore();
    const now = new Date().toISOString();
    const userEmail = request.auth?.token?.email || null;

    const docRef = db.collection(COLLECTIONS.CONFIG).doc("ai");
    const existing = await docRef.get();
    const created = existing.exists ? existing.data()?.created || now : now;

    await docRef.set(
      {
        ...sanitized,
        created,
        changed: now,
        updatedBy: request.auth.uid,
        updatedByEmail: userEmail
      },
      { merge: true }
    );

    return { success: true };
  }
);
