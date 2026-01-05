const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { region, corsOrigins } = require("../index");
const { requireSuperUser, requireAdmin } = require("../utils/authHelpers");

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
const getConfigAiApi = onCall(
  { region, cors: corsOrigins },
  async (request) => {
    await requireAdmin(request);

    const db = admin.firestore();
    const docSnap = await db.collection("configurazioni").doc("ai").get();
    if (!docSnap.exists) {
      return { exists: false, data: null };
    }
    return { exists: true, data: docSnap.data() };
  }
);

// Salvataggio configurazione AI (solo superuser)
const saveConfigAiApi = onCall(
  { region, cors: corsOrigins },
  async (request) => {
    await requireSuperUser(request);

    const sanitized = validateAi(request.data?.data || {});

    const db = admin.firestore();
    const now = new Date().toISOString();
    const userEmail = request.auth?.token?.email || null;

    await db.collection("configurazioni").doc("ai").set(
      {
        ...sanitized,
        updatedAt: now,
        updatedBy: request.auth.uid,
        updatedByEmail: userEmail
      },
      { merge: true }
    );

    return { success: true };
  }
);

module.exports = {
  getConfigAiApi,
  saveConfigAiApi
};
