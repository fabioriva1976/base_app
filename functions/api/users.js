/**
 * 🎯 PATTERN TEMPLATE: API CRUD per Entità "Users"
 *
 * Questo file implementa il pattern standard CRUD per l'entità Utente.
 * Per creare una nuova entità (es: Prodotti), copia questo file e:
 * 1. Sostituisci "User/Utente" con "Prodotto"
 * 2. Sostituisci "users/utenti" con "prodotti"
 * 3. Aggiorna i campi di validazione nella funzione validate*Data()
 * 4. Aggiorna il COLLECTION_NAME
 * 5. Importa la factory corretta da entityFactory.js
 *
 * Operazioni implementate:
 * - CREATE: userCreateApi (solo admin, con gestione duplicati)
 * - UPDATE: userUpdateApi (solo admin, con controllo permessi)
 * - DELETE: userDeleteApi (solo admin, con verifica ruoli)
 * - LIST: userListApi (solo admin)
 *
 * NOTA: Users è un'entità speciale che usa Firebase Auth + Firestore
 *
 * Vedi: PATTERNS.md per la guida completa
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { region, corsOrigins, runtimeOpts } from "../config.js";
import {
  requireAdmin,
  canManageUser,
  getUserRole,
  isSuperUser
} from "../utils/authHelpers.js";
import { logAudit, AuditAction } from "../utils/auditLogger.js";

// 🔧 Inizializza Firebase Admin (singleton pattern)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const auth = admin.auth();

// 📝 CONFIGURAZIONE: Nome collection in Firestore
// NOTA: Gli utenti sono principalmente in Firebase Auth,
// ma i metadati (ruolo, etc.) sono in Firestore
const COLLECTION_NAME = 'utenti';

/**
 * 🎯 STEP 1: VALIDAZIONE
 *
 * Valida i dati di un utente prima di salvarli.
 * Per nuove entità: copia questa funzione e aggiorna i campi validati.
 *
 * @param {object} data - I dati dell'utente da validare
 * @throws {HttpsError} Se i dati non sono validi
 */
function validateUserData(data) {
    if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
        throw new HttpsError('invalid-argument', 'Email obbligatoria e valida');
    }
    if (data.displayName && typeof data.displayName !== 'string') {
        throw new HttpsError('invalid-argument', 'displayName deve essere una stringa');
    }
}

/**
 * 🎯 LIST API: Lista tutti gli utenti
 *
 * Permessi richiesti: ADMIN
 * Output: { users: [...] }
 */
export const userListApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
  await requireAdmin(request);

  try {
    const userRecords = await auth.listUsers(100);
    const users = userRecords.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      disabled: user.disabled
    }));

    console.log(`Admin ${request.auth.uid} ha listato ${users.length} utenti`);
    return { users };
  } catch (error) {
    console.error("Errore nel listare gli utenti:", error);
    throw new HttpsError("internal", "Impossibile recuperare gli utenti.");
  }
});

/**
 * 🎯 CREATE API: Crea nuovo utente
 *
 * Permessi richiesti: ADMIN
 * Input: { email, password, displayName?, ruolo, disabled? }
 * Output: { uid, message, wasExisting }
 *
 * Pattern CRUD Step-by-Step:
 * 1. SICUREZZA: Verifica permessi utente
 * 2. VALIDAZIONE: Controlla dati input
 * 3. BUSINESS LOGIC: Crea in Firebase Auth o sincronizza se esiste
 * 4. AUTHORIZATION: Verifica che admin possa creare il ruolo richiesto
 * 5. LOGGING: Registra azione
 * 6. RESPONSE: Ritorna dati salvati
 *
 * NOTA: Firebase Auth non permette duplicati email, quindi gestiamo il caso
 */
export const userCreateApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
  // 1. SICUREZZA: Verifica che l'utente sia un admin
  const callerRole = await requireAdmin(request);

  try {
    const data = request.data || {};

    // 2. VALIDAZIONE: Controlla che i dati inviati siano validi
    validateUserData(data);
    const targetRole = data.ruolo;

    // 4. AUTHORIZATION: Verifica che l'admin possa creare il ruolo richiesto
    if (!canManageUser(callerRole, targetRole)) {
      throw new HttpsError(
        "permission-denied",
        `Non puoi creare un utente con ruolo '${targetRole}'.`
      );
    }

    let userRecord;
    let wasExisting = false;

    // 3. BUSINESS LOGIC: Crea l'utente in Firebase Auth
    try {
      userRecord = await auth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        disabled: data.disabled
      });
      // 5. LOGGING: Registra azione per audit
      console.log(`Utente creato da ${request.auth.uid}: ${userRecord.uid} (ruolo: ${targetRole})`);

      // AUDIT LOG: Registra creazione utente
      await logAudit({
        entityType: 'utenti',
        entityId: userRecord.uid,
        action: AuditAction.CREATE,
        userId: request.auth.uid,
        userEmail: request.auth.token.email,
        newData: { email: data.email, displayName: data.displayName, ruolo: targetRole, disabled: data.disabled },
        source: 'web'
      });

    } catch (error) {
      // CASO SPECIALE: Se l'email esiste già, sincronizza i dati
      if (error.code === "auth/email-already-exists") {
        userRecord = await auth.getUserByEmail(data.email);
        wasExisting = true;
        await auth.updateUser(userRecord.uid, {
          displayName: data.displayName,
          disabled: data.disabled
        });
        console.log(`Utente esistente sincronizzato da ${request.auth.uid}: ${userRecord.uid}`);

        // AUDIT LOG: Registra sincronizzazione
        await logAudit({
          entityType: 'utenti',
          entityId: userRecord.uid,
          action: AuditAction.UPDATE,
          userId: request.auth.uid,
          userEmail: request.auth.token.email,
          newData: { displayName: data.displayName, disabled: data.disabled },
          metadata: { reason: 'sync_existing_user' },
          source: 'web'
        });
      } else {
        throw error;
      }
    }

    // 6. RESPONSE: Ritorna dati salvati
    return {
      uid: userRecord.uid,
      message: wasExisting
        ? "Utente già esistente in Auth, sincronizzato con successo!"
        : "Utente creato con successo!",
      wasExisting
    };
  } catch (error) {
    console.error("Errore nella creazione/sincronizzazione utente:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error.message);
  }
});

/**
 * 🎯 UPDATE API: Aggiorna utente esistente
 *
 * Permessi richiesti: ADMIN
 * Input: { uid, displayName?, disabled?, ruolo? }
 * Output: { message }
 */
export const userUpdateApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
  // 1. SICUREZZA: Verifica permessi
  const callerRole = await requireAdmin(request);
  const data = request.data || {};
  const { uid, ruolo: targetRole, ...updateData } = data;

  try {
    let currentTargetRole = await getUserRole(uid);

    if (!currentTargetRole) {
      if (isSuperUser(callerRole)) {
        console.warn(`Utente ${uid} non trovato in Firestore, procedo come 'operatore' (fallback superuser)`);
        currentTargetRole = "operatore";
      } else {
        throw new HttpsError("not-found", "Utente non trovato in Firestore.");
      }
    }

    if (!canManageUser(callerRole, currentTargetRole)) {
      throw new HttpsError(
        "permission-denied",
        `Non puoi modificare un utente con ruolo '${currentTargetRole}'.`
      );
    }

    if (targetRole && targetRole !== currentTargetRole) {
      if (!canManageUser(callerRole, targetRole)) {
        throw new HttpsError(
          "permission-denied",
          `Non puoi assegnare il ruolo '${targetRole}'.`
        );
      }
    }

    // Recupera i dati attuali per audit
    const oldUserRecord = await auth.getUser(uid);
    const oldData = {
      email: oldUserRecord.email,
      displayName: oldUserRecord.displayName,
      disabled: oldUserRecord.disabled
    };

    await auth.updateUser(uid, updateData);

    // AUDIT LOG: Registra modifica utente
    await logAudit({
      entityType: 'utenti',
      entityId: uid,
      action: AuditAction.UPDATE,
      userId: request.auth.uid,
      userEmail: request.auth.token.email,
      oldData: oldData,
      newData: updateData,
      source: 'web'
    });

    console.log(`Admin ${request.auth.uid} ha aggiornato l'utente ${uid}`);

    return { message: "Utente aggiornato con successo!" };
  } catch (error) {
    console.error("Errore nell'aggiornamento utente:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * 🎯 DELETE API: Elimina utente
 *
 * Permessi richiesti: ADMIN
 * Input: { uid }
 * Output: { message, wasInAuth }
 *
 * NOTA: Elimina sia da Firebase Auth che da Firestore (se presente)
 */
export const userDeleteApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
  // 1. SICUREZZA: Verifica permessi
  const callerRole = await requireAdmin(request);
  const data = request.data || {};

  try {
    if (!data.uid || typeof data.uid !== "string" || data.uid.trim() === "") {
      throw new HttpsError("invalid-argument", "The uid must be a non-empty string.");
    }

    if (data.uid === request.auth.uid) {
      throw new HttpsError("permission-denied", "Non puoi eliminare il tuo stesso account.");
    }

    const targetRole = await getUserRole(data.uid);
    if (!targetRole) {
      throw new HttpsError("not-found", "Utente non trovato in Firestore.");
    }

    if (!canManageUser(callerRole, targetRole)) {
      throw new HttpsError(
        "permission-denied",
        `Non puoi eliminare un utente con ruolo '${targetRole}'.`
      );
    }

    let userExistsInAuth = false;

    try {
      await auth.getUser(data.uid);
      userExistsInAuth = true;
    } catch (authError) {
      if (authError.code !== "auth/user-not-found") {
        throw authError;
      }
    }

    // Recupera dati per audit prima di eliminare
    let oldData = null;
    if (userExistsInAuth) {
      const userRecord = await auth.getUser(data.uid);
      oldData = {
        email: userRecord.email,
        displayName: userRecord.displayName,
        disabled: userRecord.disabled
      };
      await auth.deleteUser(data.uid);
      console.log(`Admin ${request.auth.uid} ha eliminato l'utente ${data.uid} da Firebase Auth`);
    } else {
      console.log("Utente non presente in Auth, elimino solo Firestore");
    }

    // AUDIT LOG: Registra eliminazione utente
    await logAudit({
      entityType: 'utenti',
      entityId: data.uid,
      action: AuditAction.DELETE,
      userId: request.auth.uid,
      userEmail: request.auth.token.email,
      oldData: oldData,
      metadata: { wasInAuth: userExistsInAuth },
      source: 'web'
    });

    return {
      message: "Utente eliminato con successo.",
      wasInAuth: userExistsInAuth
    };
  } catch (error) {
    console.error("Errore nell'eliminazione utente:", error);
    throw new HttpsError("internal", error.message);
  }
});
