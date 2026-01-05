// functions/index.js

// --- INIZIALIZZAZIONE ADMIN SDK ---
const admin = require("firebase-admin");

// Configura emulator per Storage se in modalità emulatore
if (process.env.FUNCTIONS_EMULATOR === 'true') {
    // Imposta l'host dell'emulatore Storage se non già impostato
    if (!process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
        process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9299';
        console.log('🔧 Set FIREBASE_STORAGE_EMULATOR_HOST=localhost:9299');
    }
}

// Forza il projectId esplicitamente per evitare mismatch di audience tra token e service account
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "base-app-12108";
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId
});

// --- CONFIGURAZIONE GLOBALE ---

// Esporta le configurazioni globali in modo che altri file possano importarle.
exports.region = "europe-west1";
exports.timezone = "Europe/Rome";

// Origini CORS consentite. In locale includiamo anche localhost per permettere le chiamate dagli emulatori/UI dev.
const baseCorsOrigins = [
    `https://${projectId}.web.app`,
    `https://${projectId}.firebaseapp.com`
];

const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
const localCorsOrigins = isEmulator ? [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
] : [];

exports.corsOrigins = [...baseCorsOrigins, ...localCorsOrigins];

// ============================================================================
// NOTA IMPORTANTE: MIGRAZIONE A FIRESTORE COMPLETATA
// ============================================================================
// Tutte le configurazioni (SMTP, AI) sono ora gestite
// dinamicamente in Firestore nella collezione 'configurazioni'.
//
// Documenti disponibili:
// - configurazioni/smtp: {host, port, user, password, from, fromName, secure}
// - configurazioni/ai: {provider, apiKey, model, temperature, maxTokens, timeout, systemPrompt, enableContext, enableSafety}
//
// VANTAGGI:
// ✅ Configurazioni modificabili tramite UI web senza redeploy
// ✅ Nessun valore hardcoded o secret necessari
// ✅ Audit trail completo (updatedBy, updatedAt, updatedByEmail)
// ✅ Gestione centralizzata e sicura con Firestore Security Rules
// ============================================================================

// --- ESPORTAZIONE DELLE FUNZIONI ---

// === ASTRO SSR - APPLICAZIONE WEB ===
exports.astroSSR = require("./astro").astroSSR;

// === FUNZIONI API - TEST CONFIGURAZIONI ===
exports.testSmtpApi = require("./api/testConfig-smtp").testSmtpApi;
exports.testAiApi = require("./api/testConfig-ai").testAiApi;

// === FUNZIONI API - PROFILO UTENTE ===
const userManagement = require("./api/users");
exports.userListApi = userManagement.userListApi;
exports.userCreateApi = userManagement.userCreateApi;
exports.userUpdateApi = userManagement.userUpdateApi;
exports.userDeleteApi = userManagement.userDeleteApi;

// === FUNZIONE API - INIZIALIZZAZIONE PRIMO UTENTE ===
exports.initializeFirstUserApi = require("./api/initialize-first-user").initializeFirstUserApi;

// === FUNZIONI API - AUDIT LOGS ===
const auditLogs = require("./api/page-auditLogs");
exports.getEntityAuditLogsApi = auditLogs.getEntityAuditLogsApi;
exports.getUserAuditLogsApi = auditLogs.getUserAuditLogsApi;
exports.searchAuditLogsApi = auditLogs.searchAuditLogsApi;
exports.createAuditLogApi = auditLogs.createAuditLogApi;

// === FUNZIONI API - CONFIGURAZIONI (AI/SMTP) ===
const configSmtp = require("./api/config-smtp");
exports.getConfigSmtpApi = configSmtp.getConfigSmtpApi;
exports.saveConfigSmtpApi = configSmtp.saveConfigSmtpApi;

const configAi = require("./api/config-ai");
exports.getConfigAiApi = configAi.getConfigAiApi;
exports.saveConfigAiApi = configAi.saveConfigAiApi;

// === FUNZIONI API - CLIENTI ===
const clientiApi = require("./api/clienti");
exports.createClienteApi = clientiApi.createClienteApi;
exports.updateClienteApi = clientiApi.updateClienteApi;
exports.deleteClienteApi = clientiApi.deleteClienteApi;
exports.listClientiApi = clientiApi.listClientiApi;

// Triggers Firestore
exports.onUtentiChange = require("./triggers/onUtentiChange").onUtentiChange;

// Triggers Anagrafica (utenti gestiti in onUtentiChange.js)
const anagraficaTriggers = require("./triggers/onAnagraficaChange");
exports.onAnagraficaClientiCreate = anagraficaTriggers.onAnagraficaClientiCreate;
exports.onAnagraficaClientiUpdate = anagraficaTriggers.onAnagraficaClientiUpdate;
exports.onAnagraficaClientiDelete = anagraficaTriggers.onAnagraficaClientiDelete;

// Triggers Documenti
exports.onDocumentiCreate = anagraficaTriggers.onDocumentiCreate;
exports.onDocumentiUpdate = anagraficaTriggers.onDocumentiUpdate;
exports.onDocumentiDelete = anagraficaTriggers.onDocumentiDelete;
