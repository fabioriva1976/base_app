// functions/index.ts

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
// dinamicamente in Firestore nella collezione 'settings'.
//
// Documenti disponibili:
// - settings/smtp: {host, port, user, password, from, fromName, secure}
// - settings/ai: {provider, apiKey, model, temperature, maxTokens, timeout, systemPrompt, enableContext, enableSafety}
//
// VANTAGGI:
// ✅ Configurazioni modificabili tramite UI web senza redeploy
// ✅ Nessun valore hardcoded o secret necessari
// ✅ Audit trail completo (updatedBy, changed, updatedByEmail)
// ✅ Gestione centralizzata e sicura con Firestore Security Rules
// ============================================================================

// --- ESPORTAZIONE DELLE FUNZIONI ---

// === ASTRO SSR - APPLICAZIONE WEB ===
export { astroSSR } from "./astro.ts";

// === FUNZIONI API - PROFILO UTENTE ===
export {
    userCreateApi,
    userUpdateApi,
    userSelfUpdateApi,
    userDeleteApi
} from "./api/users.ts";

// === FUNZIONI API - AUDIT LOGS ===
export {
    getEntityAuditLogsApi,
    getUserAuditLogsApi,
    searchAuditLogsApi
} from "./api/audit.ts";

// === FUNZIONI API - CLIENTI ===
export {
    createClienteApi,
    updateClienteApi,
    deleteClienteApi
} from "./api/clienti.ts";

// === FUNZIONI API - ATTACHMENTS ===
export {
    createAttachmentRecordApi,
    deleteAttachmentApi,
    updateAttachmentApi
} from "./api/attachments.ts";

// === FUNZIONI API - COMMENTS ===
export {
    createCommentApi,
    getEntityCommentsApi,
    deleteCommentApi
} from "./api/comments.ts";

// === FUNZIONI API - SETTINGS ===
export {
    getConfigSmtpApi,
    saveConfigSmtpApi
} from "./api/settings-smtp.ts";

export {
    getConfigAiApi,
    saveConfigAiApi
} from "./api/settings-ai.ts";

export { checkSettingsSmtpApi } from "./api/checkSettings-smtp.ts";

export { checkSettingsAiApi } from "./api/checkSettings-ai.ts";

// Triggers Firestore
export { onUtentiChange } from "./triggers/onUtentiChange.ts";
export {
    onAnagraficaClientiCreate,
    onAnagraficaClientiUpdate,
    onAnagraficaClientiDelete,
    onAttachmentsCreate,
    onAttachmentsUpdate,
    onAttachmentsDelete
} from "./triggers/onAnagraficaChange.ts";
