import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { region, corsOrigins, runtimeOpts } from "../config.js";
import {
  requireAdmin,
  canManageUser,
  getUserRole,
  isSuperUser
} from "../utils/authHelpers.js";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const auth = admin.auth();

/**
 * Lista utenti (solo admin/superuser)
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
 * Crea o sincronizza un utente (solo admin/superuser)
 */
export const userCreateApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
  const callerRole = await requireAdmin(request);

  try {
    const data = request.data || {};
    const targetRole = data.ruolo;

    if (!canManageUser(callerRole, targetRole)) {
      throw new HttpsError(
        "permission-denied",
        `Non puoi creare un utente con ruolo '${targetRole}'.`
      );
    }

    let userRecord;
    let wasExisting = false;

    try {
      userRecord = await auth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        disabled: data.disabled
      });
      console.log(`Utente creato da ${request.auth.uid}: ${userRecord.uid} (ruolo: ${targetRole})`);
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        userRecord = await auth.getUserByEmail(data.email);
        wasExisting = true;
        await auth.updateUser(userRecord.uid, {
          displayName: data.displayName,
          disabled: data.disabled
        });
        console.log(`Utente esistente sincronizzato da ${request.auth.uid}: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    return {
      uid: userRecord.uid,
      message: wasExisting
        ? "Utente già esistente in Auth, sincronizzato con successo!"
        : "Utente creato con successo!",
      wasExisting
    };
  } catch (error) {
    console.error("Errore nella creazione/sincronizzazione utente:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Aggiorna un utente (solo admin/superuser)
 */
export const userUpdateApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
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

    await auth.updateUser(uid, updateData);
    console.log(`Admin ${request.auth.uid} ha aggiornato l'utente ${uid}`);

    return { message: "Utente aggiornato con successo!" };
  } catch (error) {
    console.error("Errore nell'aggiornamento utente:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Elimina un utente (solo admin/superuser)
 */
export const userDeleteApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
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

    if (userExistsInAuth) {
      await auth.deleteUser(data.uid);
      console.log(`Admin ${request.auth.uid} ha eliminato l'utente ${data.uid} da Firebase Auth`);
    } else {
      console.log("Utente non presente in Auth, elimino solo Firestore");
    }

    return {
      message: "Utente eliminato con successo.",
      wasInAuth: userExistsInAuth
    };
  } catch (error) {
    console.error("Errore nell'eliminazione utente:", error);
    throw new HttpsError("internal", error.message);
  }
});
