// functions/index.js

// --- INIZIALIZZAZIONE ADMIN SDK ---
import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (admin.apps.length === 0) {
    initializeApp();
}

// --- CONFIGURAZIONE GLOBALE ---

// Esporta le configurazioni globali in modo che altri file possano importarle.

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
export { astroSSR } from "./astro.js";

// === FUNZIONI API - PROFILO UTENTE ===
export {
    userListApi,
    userCreateApi,
    userUpdateApi,
    userDeleteApi
} from "./api/users.js";

// === FUNZIONE API - INIZIALIZZAZIONE PRIMO UTENTE ===
export { initializeFirstUserApi } from "./api/initialize-first-user.js";

// === FUNZIONI API - AUDIT LOGS ===
export {
    getEntityAuditLogsApi,
    getUserAuditLogsApi,
    searchAuditLogsApi
} from "./api/audit.js";

// === FUNZIONI API - CLIENTI ===
export {
    createClienteApi,
    updateClienteApi,
    deleteClienteApi,
    listClientiApi
} from "./api/clienti.js";

// === FUNZIONI API - ATTACHMENTS ===
export {
    createAttachmentRecordApi,
    deleteAttachmentApi,
    updateAttachmentApi
} from "./api/attachments.js";

// === FUNZIONI API - COMMENTS ===
export {
    createCommentApi,
    getEntityCommentsApi,
    deleteCommentApi
} from "./api/comments.js";

// === FUNZIONI API - CONFIGURAZIONI ===
export {
    getConfigSmtpApi,
    saveConfigSmtpApi
} from "./api/config-smtp.js";

export {
    getConfigAiApi,
    saveConfigAiApi
} from "./api/config-ai.js";

export { checkSmtpApi } from "./api/checkConfig-smtp.js";

export { checkAiApi } from "./api/checkConfig-ai.js";

// Triggers Firestore
export { onUtentiChange } from "./triggers/onUtentiChange.js";
export {
    onAnagraficaClientiCreate,
    onAnagraficaClientiUpdate,
    onAnagraficaClientiDelete,
    onAttachmentsCreate,
    onAttachmentsUpdate,
    onAttachmentsDelete
} from "./triggers/onAnagraficaChange.js";
