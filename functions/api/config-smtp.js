const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { region, corsOrigins, runtimeOpts } = require("../index");
const { requireSuperUser, requireAdmin } = require("../utils/authHelpers");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

function validateSmtp(data) {
  const requiredFields = ["host", "port", "user", "password", "from", "fromName"];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      throw new HttpsError("invalid-argument", `Campo '${field}' obbligatorio per configurazione SMTP`);
    }
  }

  return {
    host: String(data.host),
    port: Number(data.port),
    user: String(data.user),
    password: String(data.password),
    from: String(data.from),
    fromName: String(data.fromName),
    secure: Boolean(data.secure)
  };
}

// Lettura configurazione SMTP (admin/superuser)
const getConfigSmtpApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    await requireAdmin(request);

    const db = admin.firestore();
    const docSnap = await db.collection("configurazioni").doc("smtp").get();
    if (!docSnap.exists) {
      return { exists: false, data: null };
    }
    return { exists: true, data: docSnap.data() };
  }
);

// Salvataggio configurazione SMTP (solo superuser)
const saveConfigSmtpApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    await requireSuperUser(request);

    const sanitized = validateSmtp(request.data?.data || {});

    const db = admin.firestore();
    const now = new Date().toISOString();
    const userEmail = request.auth?.token?.email || null;

    await db.collection("configurazioni").doc("smtp").set(
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
  getConfigSmtpApi,
  saveConfigSmtpApi
};
