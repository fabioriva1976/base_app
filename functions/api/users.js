/**
 * 🎯 PATTERN TEMPLATE: API CRUD per Entità "Users"
 *
 * Questo file implementa il pattern standard CRUD per l'entità Utente.
 * Per creare una nuova entità (es: Prodotti), copia questo file e:
 * 1. Sostituisci "User/Utente" con "Prodotto"
 * 2. Sostituisci "users/utenti" con "prodotti"
 * 3. Aggiorna i campi di validazione nella funzione validate*Data()
 * 4. Aggiorna il COLLECTION_NAME
 * 5. Importa la factory corretta da entityFactory.ts
 *
 * Operazioni implementate:
 * - CREATE: userCreateApi (solo admin, con gestione duplicati)
 * - UPDATE: userUpdateApi (solo admin, con controllo permessi)
 * - DELETE: userDeleteApi (solo admin, con verifica ruoli)
 *
 * NOTA: Users è un'entità speciale che usa Firebase Auth + Firestore
 *
 * Vedi: PATTERNS.md per la guida completa
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { region, corsOrigins, runtimeOpts } from "../config.js";
import { requireAdmin, canManageUser, getUserRole, isSuperUser, requireAuth } from "../utils/authHelpers.js";
import { logAudit, AuditAction } from "../utils/auditLogger.js";
import { COLLECTIONS } from "../../shared/constants/collections.js";
import { z } from "zod";
// 🔧 Inizializza Firebase Admin (singleton pattern)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const auth = admin.auth();
const db = admin.firestore();
// 📝 CONFIGURAZIONE: Nome collection in Firestore
// NOTA: Gli utenti sono principalmente in Firebase Auth,
// ma i metadati (ruolo, etc.) sono in Firestore
const COLLECTION_NAME = COLLECTIONS.USERS;
/**
 * 🎯 STEP 1: VALIDAZIONE
 *
 * Valida i dati di un utente prima di salvarli.
 * Per nuove entità: copia questa funzione e aggiorna i campi validati.
 *
 * @param {object} data - I dati dell'utente da validare
 * @throws {HttpsError} Se i dati non sono validi
 */
const userCreateSchema = z.object({
    email: z.string().email(),
    displayName: z.string().optional(),
    password: z.string().optional(),
    ruolo: z.string().optional(),
    disabled: z.boolean().optional(),
    nome: z.string().optional(),
    cognome: z.string().optional(),
    telefono: z.string().optional(),
    status: z.boolean().optional()
}).passthrough();
const userUpdateSchema = z.object({
    uid: z.string().min(1),
    email: z.string().email().optional(),
    displayName: z.string().optional(),
    disabled: z.boolean().optional(),
    ruolo: z.string().optional(),
    nome: z.string().optional(),
    cognome: z.string().optional(),
    telefono: z.string().optional(),
    status: z.boolean().optional()
}).passthrough();
const userSelfUpdateSchema = z.object({
    displayName: z.string().optional(),
    nome: z.string().optional(),
    cognome: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email().optional()
}).passthrough();
function parseWithSchema(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const message = result.error.issues.map((issue) => issue.message).join("; ");
        throw new HttpsError("invalid-argument", message);
    }
    return result.data;
}
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
        const data = parseWithSchema(userCreateSchema, request.data || {});
        const targetRole = data.ruolo;
        // 4. AUTHORIZATION: Verifica che l'admin possa creare il ruolo richiesto
        if (!canManageUser(callerRole, targetRole)) {
            throw new HttpsError("permission-denied", `Non puoi creare un utente con ruolo '${targetRole}'.`);
        }
        let userRecord;
        let wasExisting = false;
        const now = new Date().toISOString();
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
        }
        catch (error) {
            // CASO SPECIALE: Se l'email esiste già, sincronizza i dati
            if (error.code === "auth/email-already-exists") {
                userRecord = await auth.getUserByEmail(data.email);
                wasExisting = true;
                await auth.updateUser(userRecord.uid, {
                    displayName: data.displayName,
                    disabled: data.disabled
                });
                console.log(`Utente esistente sincronizzato da ${request.auth.uid}: ${userRecord.uid}`);
            }
            else {
                throw error;
            }
        }
        // 6. RESPONSE: Ritorna dati salvati
        const userDocRef = db.collection(COLLECTION_NAME).doc(userRecord.uid);
        let existingProfile = null;
        let createdAt = now;
        if (wasExisting) {
            const existingDoc = await userDocRef.get();
            if (existingDoc.exists) {
                existingProfile = existingDoc.data();
                if (existingProfile.created) {
                    createdAt = existingProfile.created;
                }
            }
        }
        const status = data.status !== undefined ? Boolean(data.status) : !data.disabled;
        const profileData = {
            nome: data.nome || '',
            cognome: data.cognome || '',
            email: data.email,
            telefono: data.telefono || '',
            ruolo: targetRole ? [targetRole] : [],
            status: status,
            changed: now,
            lastModifiedBy: request.auth.uid,
            lastModifiedByEmail: request.auth.token.email || null,
            createdAt: FieldValue.delete(),
            updatedAt: FieldValue.delete()
        };
        if (createdAt) {
            profileData.created = createdAt;
        }
        await userDocRef.set(profileData, { merge: true });
        const auditAction = wasExisting ? AuditAction.UPDATE : AuditAction.CREATE;
        await logAudit({
            entityType: COLLECTION_NAME,
            entityId: userRecord.uid,
            action: auditAction,
            userId: request.auth.uid,
            userEmail: request.auth.token?.email || null,
            oldData: wasExisting ? existingProfile : null,
            newData: profileData,
            source: 'web'
        });
        return {
            uid: userRecord.uid,
            message: wasExisting
                ? "Utente già esistente in Auth, sincronizzato con successo!"
                : "Utente creato con successo!",
            wasExisting
        };
    }
    catch (error) {
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
    const data = parseWithSchema(userUpdateSchema, request.data || {});
    const { uid, ruolo: targetRole, ...updateData } = data;
    try {
        let currentTargetRole = await getUserRole(uid);
        if (!currentTargetRole) {
            if (isSuperUser(callerRole)) {
                console.warn(`Utente ${uid} non trovato in Firestore, procedo come 'operatore' (fallback superuser)`);
                currentTargetRole = "operatore";
            }
            else {
                throw new HttpsError("not-found", "Utente non trovato in Firestore.");
            }
        }
        if (!canManageUser(callerRole, currentTargetRole)) {
            throw new HttpsError("permission-denied", `Non puoi modificare un utente con ruolo '${currentTargetRole}'.`);
        }
        if (targetRole && targetRole !== currentTargetRole) {
            if (!canManageUser(callerRole, targetRole)) {
                throw new HttpsError("permission-denied", `Non puoi assegnare il ruolo '${targetRole}'.`);
            }
        }
        const authUpdate = {};
        if (updateData.displayName !== undefined)
            authUpdate.displayName = updateData.displayName;
        if (updateData.disabled !== undefined)
            authUpdate.disabled = updateData.disabled;
        if (updateData.email !== undefined)
            authUpdate.email = updateData.email;
        if (Object.keys(authUpdate).length > 0) {
            await auth.updateUser(uid, authUpdate);
        }
        const now = new Date().toISOString();
        const profileUpdates = {
            changed: now,
            lastModifiedBy: request.auth.uid,
            lastModifiedByEmail: request.auth.token.email || null,
            createdAt: FieldValue.delete(),
            updatedAt: FieldValue.delete()
        };
        if (data.nome !== undefined)
            profileUpdates.nome = data.nome;
        if (data.cognome !== undefined)
            profileUpdates.cognome = data.cognome;
        if (data.email !== undefined)
            profileUpdates.email = data.email;
        if (data.telefono !== undefined)
            profileUpdates.telefono = data.telefono;
        if (data.status !== undefined)
            profileUpdates.status = Boolean(data.status);
        if (targetRole)
            profileUpdates.ruolo = [targetRole];
        const userDocRef = db.collection(COLLECTION_NAME).doc(uid);
        const oldDoc = await userDocRef.get();
        const oldData = oldDoc.exists ? oldDoc.data() : null;
        await userDocRef.set(profileUpdates, { merge: true });
        const newDoc = await userDocRef.get();
        const newData = newDoc.exists ? newDoc.data() : profileUpdates;
        await logAudit({
            entityType: COLLECTION_NAME,
            entityId: uid,
            action: AuditAction.UPDATE,
            userId: request.auth.uid,
            userEmail: request.auth.token?.email || null,
            oldData,
            newData,
            source: 'web'
        });
        console.log(`Admin ${request.auth.uid} ha aggiornato l'utente ${uid}`);
        return { message: "Utente aggiornato con successo!" };
    }
    catch (error) {
        console.error("Errore nell'aggiornamento utente:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", error.message);
    }
});
/**
 * 🎯 SELF UPDATE API: Aggiorna il proprio profilo
 *
 * Permessi richiesti: UTENTE AUTENTICATO (solo se stesso)
 * Input: { displayName?, nome?, cognome?, telefono?, email? }
 * Output: { message }
 *
 * LOGICA SPECIALE - PRIMO UTENTE:
 * Se l'utente non esiste in Firestore E la collection users è vuota,
 * viene automaticamente creato come SUPERUSER (primo utente del sistema).
 * Altrimenti, deve essere creato da un amministratore dalla pagina anagrafica-utenti.
 */
export const userSelfUpdateApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
    requireAuth(request);
    const uid = request.auth.uid;
    const updateData = parseWithSchema(userSelfUpdateSchema, request.data || {});
    try {
        const authUpdate = {};
        if (updateData.displayName !== undefined)
            authUpdate.displayName = updateData.displayName;
        if (updateData.email !== undefined)
            authUpdate.email = updateData.email;
        if (Object.keys(authUpdate).length > 0) {
            await auth.updateUser(uid, authUpdate);
        }
        const now = new Date().toISOString();
        const userDocRef = db.collection(COLLECTION_NAME).doc(uid);
        const oldDoc = await userDocRef.get();
        const oldData = oldDoc.exists ? oldDoc.data() : null;
        const created = oldData?.created || now;
        // Se l'utente non esiste in Firestore, verifica se è il primo utente del sistema
        let ruolo = oldData?.ruolo || null;
        if (!oldDoc.exists) {
            // Controlla se la collection è vuota
            const allUsersSnapshot = await db.collection(COLLECTION_NAME).limit(1).get();
            if (allUsersSnapshot.empty) {
                // Primo utente del sistema: assegna ruolo SUPERUSER
                ruolo = ['superuser'];
                await auth.setCustomUserClaims(uid, { role: 'superuser' });
                console.log(`🎉 Primo utente creato con ruolo SUPERUSER: ${uid}`);
            }
            else {
                // Non è il primo utente e non ha un profilo: errore
                throw new HttpsError('failed-precondition', 'Il tuo profilo deve essere creato da un amministratore.');
            }
        }
        const profileUpdates = {
            changed: now,
            created,
            lastModifiedBy: uid,
            lastModifiedByEmail: request.auth.token.email || null,
            createdAt: FieldValue.delete(),
            updatedAt: FieldValue.delete()
        };
        if (updateData.nome !== undefined)
            profileUpdates.nome = updateData.nome;
        if (updateData.cognome !== undefined)
            profileUpdates.cognome = updateData.cognome;
        if (updateData.email !== undefined)
            profileUpdates.email = updateData.email;
        if (updateData.telefono !== undefined)
            profileUpdates.telefono = updateData.telefono;
        // Aggiungi ruolo e status per nuovi utenti
        if (!oldDoc.exists) {
            profileUpdates.ruolo = ruolo;
            profileUpdates.status = true;
        }
        await userDocRef.set(profileUpdates, { merge: true });
        const newDoc = await userDocRef.get();
        const newData = newDoc.exists ? newDoc.data() : profileUpdates;
        await logAudit({
            entityType: COLLECTION_NAME,
            entityId: uid,
            action: oldDoc.exists ? AuditAction.UPDATE : AuditAction.CREATE,
            userId: uid,
            userEmail: request.auth.token?.email || null,
            oldData,
            newData,
            source: 'web'
        });
        return { message: "Profilo aggiornato con successo!" };
    }
    catch (error) {
        console.error("Errore nell'aggiornamento profilo:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
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
            throw new HttpsError("permission-denied", `Non puoi eliminare un utente con ruolo '${targetRole}'.`);
        }
        let userExistsInAuth = false;
        try {
            await auth.getUser(data.uid);
            userExistsInAuth = true;
        }
        catch (authError) {
            if (authError.code !== "auth/user-not-found") {
                throw authError;
            }
        }
        if (userExistsInAuth) {
            await auth.deleteUser(data.uid);
            console.log(`Admin ${request.auth.uid} ha eliminato l'utente ${data.uid} da Firebase Auth`);
        }
        else {
            console.log("Utente non presente in Auth, elimino solo Firestore");
        }
        const userDocRef = db.collection(COLLECTION_NAME).doc(data.uid);
        const oldDoc = await userDocRef.get();
        const oldData = oldDoc.exists ? oldDoc.data() : null;
        await userDocRef.delete();
        await logAudit({
            entityType: COLLECTION_NAME,
            entityId: data.uid,
            action: AuditAction.DELETE,
            userId: request.auth.uid,
            userEmail: request.auth.token?.email || null,
            oldData,
            newData: null,
            source: 'web'
        });
        return {
            message: "Utente eliminato con successo.",
            wasInAuth: userExistsInAuth
        };
    }
    catch (error) {
        console.error("Errore nell'eliminazione utente:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", error.message);
    }
});
