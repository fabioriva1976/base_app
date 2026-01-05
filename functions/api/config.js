const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { region, corsOrigins } = require("../index");
const { requireSuperUser, requireAdmin } = require("../utils/authHelpers");

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const CONFIG_COLLECTION = "configurazioni";

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

const validators = {
    smtp: validateSmtp,
    ai: validateAi
};

// Lettura configurazioni (admin/superuser)
const getConfigApi = onCall(
    {
        region,
        cors: corsOrigins
    },
    async (request) => {
        await requireAdmin(request);

        const { type } = request.data || {};
        if (!type || !validators[type]) {
            throw new HttpsError("invalid-argument", "Tipo configurazione non valido");
        }

        const db = admin.firestore();
        const docSnap = await db.collection(CONFIG_COLLECTION).doc(type).get();
        if (!docSnap.exists) {
            return { exists: false, data: null };
        }

        return { exists: true, data: docSnap.data() };
    }
);

// Salvataggio configurazioni (solo superuser)
const saveConfigApi = onCall(
    {
        region,
        cors: corsOrigins
    },
    async (request) => {
        const role = await requireSuperUser(request);

        const { type, data } = request.data || {};
        if (!type || !validators[type]) {
            throw new HttpsError("invalid-argument", "Tipo configurazione non valido");
        }

        const validate = validators[type];
        const sanitized = validate(data || {});

        const db = admin.firestore();
        const now = new Date().toISOString();
        const userEmail = request.auth?.token?.email || null;

        await db.collection(CONFIG_COLLECTION).doc(type).set(
            {
                ...sanitized,
                updatedAt: now,
                updatedBy: request.auth.uid,
                updatedByEmail: userEmail
            },
            { merge: true }
        );

        return { success: true, role };
    }
);

module.exports = {
    getConfigApi,
    saveConfigApi
};
