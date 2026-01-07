import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { requireAdmin, requireOperator } from "../utils/authHelpers.js";
import { createCliente } from "../../shared/schemas/entityFactory.js";
import { region, corsOrigins } from "../config.js";

if (getApps().length === 0) {
    initializeApp();
}
const db = getFirestore();

/**
 * Valida i dati di un cliente.
 * In un'applicazione reale, qui si userebbe una libreria come Zod.
 * @param {object} data - I dati del cliente.
 */
function validateClienteData(data) {
    if (!data.ragione_sociale || typeof data.ragione_sociale !== 'string' || data.ragione_sociale.trim() === '') {
        throw new HttpsError('invalid-argument', 'La ragione sociale è obbligatoria.');
    }
    if (data.email && (typeof data.email !== 'string' || !data.email.includes('@'))) {
        throw new HttpsError('invalid-argument', 'L\'email fornita non è valida.');
    }
}

/**
 * API per creare un nuovo cliente.
 * Solo gli utenti con ruolo 'admin' o 'superuser' possono accedervi.
 */
export const clienteCreateApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    // 1. Sicurezza: Verifica che l'utente sia un admin
    await requireAdmin(request);

    const { uid, token } = request.auth;
    const data = request.data;

    try {
        // 2. Validazione: Controlla che i dati inviati siano validi
        validateClienteData(data);

        // 3. Logica di Business: Crea l'oggetto cliente usando la factory condivisa
        const nuovoCliente = createCliente({
            ...data,
            createdBy: uid,
            createdByEmail: token.email,
        });

        // 4. Interazione DB: Salva il nuovo cliente in Firestore
        const docRef = await db.collection('anagrafica_clienti').add(nuovoCliente);

        console.log(`Utente ${uid} ha creato il cliente ${docRef.id}`);

        return { id: docRef.id, ...nuovoCliente };

    } catch (error) {
        console.error("Errore durante la creazione del cliente:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile creare il cliente.');
    }
});

/**
 * API per aggiornare un cliente esistente.
 */
export const clienteUpdateApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    await requireAdmin(request);

    const { uid } = request.auth;
    const { id, ...updateData } = request.data;

    if (!id) {
        throw new HttpsError('invalid-argument', 'L\'ID del cliente è obbligatorio.');
    }

    try {
        validateClienteData(updateData);

        const clienteRef = db.collection('anagrafica_clienti').doc(id);

        // Aggiunge il timestamp di aggiornamento
        const dataToUpdate = {
            ...updateData,
            updatedAt: FieldValue.serverTimestamp(),
        };

        await clienteRef.update(dataToUpdate);

        console.log(`Utente ${uid} ha aggiornato il cliente ${id}`);

        return { message: "Cliente aggiornato con successo." };

    } catch (error) {
        console.error(`Errore durante l'aggiornamento del cliente ${id}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile aggiornare il cliente.');
    }
});

/**
 * API per eliminare un cliente.
 */
export const clienteDeleteApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    await requireAdmin(request);

    const { uid } = request.auth;
    const { id } = request.data;

    if (!id) {
        throw new HttpsError('invalid-argument', 'L\'ID del cliente è obbligatorio.');
    }

    try {
        await db.collection('anagrafica_clienti').doc(id).delete();
        console.log(`Utente ${uid} ha eliminato il cliente ${id}`);
        return { message: "Cliente eliminato con successo." };
    } catch (error) {
        console.error(`Errore durante l'eliminazione del cliente ${id}:`, error);
        throw new HttpsError('internal', 'Impossibile eliminare il cliente.');
    }
});

/**
 * API per listare i clienti con paginazione.
 * Solo gli utenti con ruolo 'admin' o 'superuser' possono accedervi.
 */
export const listClientiApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    // Permettiamo a qualsiasi utente con ruolo (operatore, admin, superuser)
    // di leggere la lista dei clienti.
    await requireOperator(request);

    const { pageSize = 25, pageToken } = request.data || {};

    try {
        let query = db.collection('anagrafica_clienti').orderBy('ragione_sociale').limit(Number(pageSize));

        if (pageToken) {
            // Per la paginazione, recuperiamo l'ultimo documento della pagina precedente
            // per sapere da dove iniziare la nuova query.
            const lastVisibleDoc = await db.collection('anagrafica_clienti').doc(pageToken).get();
            if (lastVisibleDoc.exists) {
                query = query.startAfter(lastVisibleDoc);
            }
        }

        const snapshot = await query.get();

        const clienti = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Se il numero di documenti restituiti è uguale alla dimensione della pagina,
        // è probabile che ci sia una pagina successiva.
        const nextPageToken = snapshot.docs.length === Number(pageSize) ? snapshot.docs[snapshot.docs.length - 1].id : null;

        return { clienti, nextPageToken };
    } catch (error) {
        if (error instanceof HttpsError) {
            // Se l'errore è di permessi (lanciato da requireOperator), lo propaghiamo al client.
            throw error;
        }
        console.error("Errore durante il recupero della lista clienti:", error);
        throw new HttpsError('internal', 'Impossibile recuperare la lista dei clienti.');
    }
});
