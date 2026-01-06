const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { region, corsOrigins, runtimeOpts } = require("../index");
const { requireAuth } = require("../utils/authHelpers");
const { createCliente } = require("../schemas/entityFactory");

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Validazione dati cliente
 */
function validateClienteData(data) {
    const errors = [];

    // Ragione sociale
    if (!data.ragione_sociale || typeof data.ragione_sociale !== 'string') {
        errors.push('ragione_sociale è obbligatorio');
    } else if (data.ragione_sociale.trim().length === 0) {
        errors.push('ragione_sociale non può essere vuoto');
    } else if (data.ragione_sociale.length > 200) {
        errors.push('ragione_sociale non può superare 200 caratteri');
    }

    // Email (opzionale ma se presente deve essere valida)
    if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push('email non è valida');
        }
    }

    // Telefono (opzionale)
    if (data.telefono && data.telefono.length > 50) {
        errors.push('telefono non può superare 50 caratteri');
    }

    // Codice (opzionale)
    if (data.codice && data.codice.length > 50) {
        errors.push('codice non può superare 50 caratteri');
    }

    // P.IVA (opzionale ma se presente deve essere valida)
    if (data.partita_iva) {
        // P.IVA italiana: 11 cifre
        if (!/^\d{11}$/.test(data.partita_iva)) {
            errors.push('partita_iva deve essere di 11 cifre');
        }
    }

    // Codice Fiscale (opzionale ma se presente deve essere valido)
    if (data.codice_fiscale) {
        // CF: 16 caratteri alfanumerici
        if (!/^[A-Z0-9]{16}$/i.test(data.codice_fiscale)) {
            errors.push('codice_fiscale deve essere di 16 caratteri alfanumerici');
        }
    }

    return errors;
}

/**
 * Sanitizzazione stringa
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '').substring(0, 500);
}

/**
 * Verifica duplicati P.IVA
 */
async function checkDuplicatePartitaIva(partitaIva, excludeId = null) {
    if (!partitaIva) return false;

    const query = db.collection('anagrafica_clienti')
        .where('partita_iva', '==', partitaIva)
        .limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) return false;

    // Se stiamo aggiornando, escludi il documento corrente
    if (excludeId && snapshot.docs[0].id === excludeId) {
        return false;
    }

    return true;
}

/**
 * Crea nuovo cliente - VALIDATO SERVER-SIDE
 */
exports.createClienteApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    // ✅ AUTENTICAZIONE
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Devi essere autenticato');
    }

    try {
        const userId = request.auth.uid;
        const data = request.data || {};
        // Alias da client legacy
        data.partita_iva = data.partita_iva || data.piva;
        data.codice_fiscale = data.codice_fiscale || data.cf;
        data.stato = data.stato !== undefined ? !!data.stato : true;

        // ✅ VALIDAZIONE
        const validationErrors = validateClienteData(data);
        if (validationErrors.length > 0) {
            throw new HttpsError('invalid-argument', `Errori: ${validationErrors.join(', ')}`);
        }

        // ✅ CHECK DUPLICATI P.IVA
        if (data.partita_iva) {
            const isDuplicate = await checkDuplicatePartitaIva(data.partita_iva);
            if (isDuplicate) {
                throw new HttpsError('already-exists', 'Esiste già un cliente con questa Partita IVA');
            }
        }

        // ✅ NORMALIZZAZIONE CON FACTORY CONDIVISA
        const baseCliente = createCliente({
            ...data,
            ragione_sociale: sanitizeString(data.ragione_sociale),
            email: data.email ? sanitizeString(data.email.toLowerCase()) : null,
            telefono: data.telefono ? sanitizeString(data.telefono) : null,
            codice: data.codice ? sanitizeString(data.codice) : null,
            partita_iva: data.partita_iva ? data.partita_iva.trim() : null,
            codice_fiscale: data.codice_fiscale ? data.codice_fiscale.trim().toUpperCase() : null,
            indirizzo: data.indirizzo ? sanitizeString(data.indirizzo) : null,
            citta: data.citta ? sanitizeString(data.citta) : null,
            cap: data.cap ? sanitizeString(data.cap) : null,
            provincia: data.provincia ? sanitizeString(data.provincia) : null,
            note: data.note ? sanitizeString(data.note) : null,
            stato: data.stato === true,
            createdBy: userId,
            createdByEmail: request.auth.token.email || null
        });

        // Timestamp server-side
        const clienteData = {
            ...baseCliente,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            lastModifiedBy: userId,
            lastModifiedByEmail: request.auth.token.email || null
        };

        // ✅ SALVATAGGIO
        const docRef = await db.collection('anagrafica_clienti').add(clienteData);

        console.log(`✅ Cliente creato: ${docRef.id} da ${userId}`);

        return {
            success: true,
            id: docRef.id,
            message: 'Cliente creato con successo'
        };

    } catch (error) {
        console.error('Errore creazione cliente:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', `Errore: ${error.message}`);
    }
});

/**
 * Aggiorna cliente - VALIDATO SERVER-SIDE
 */
exports.updateClienteApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Devi essere autenticato');
    }

    try {
        const userId = request.auth.uid;
        const { clienteId, ...updates } = request.data || {};
        updates.partita_iva = updates.partita_iva || updates.piva;
        updates.codice_fiscale = updates.codice_fiscale || updates.cf;
        if (updates.stato !== undefined) updates.stato = !!updates.stato;

        if (!clienteId) {
            throw new HttpsError('invalid-argument', 'clienteId obbligatorio');
        }

        // ✅ VERIFICA ESISTENZA
        const clienteRef = db.collection('anagrafica_clienti').doc(clienteId);
        const clienteDoc = await clienteRef.get();

        if (!clienteDoc.exists) {
            throw new HttpsError('not-found', 'Cliente non trovato');
        }

        const currentData = clienteDoc.data();

        // ✅ VALIDAZIONE
        const dataToValidate = {
            ragione_sociale: updates.ragione_sociale || currentData.ragione_sociale,
            email: updates.email !== undefined ? updates.email : currentData.email,
            telefono: updates.telefono !== undefined ? updates.telefono : currentData.telefono,
            codice: updates.codice !== undefined ? updates.codice : currentData.codice,
            partita_iva: updates.partita_iva !== undefined ? updates.partita_iva : currentData.partita_iva,
            codice_fiscale: updates.codice_fiscale !== undefined ? updates.codice_fiscale : currentData.codice_fiscale
        };

        const validationErrors = validateClienteData(dataToValidate);
        if (validationErrors.length > 0) {
            throw new HttpsError('invalid-argument', `Errori: ${validationErrors.join(', ')}`);
        }

        // ✅ CHECK DUPLICATI P.IVA (se cambiata)
        if (updates.partita_iva && updates.partita_iva !== currentData.partita_iva) {
            const isDuplicate = await checkDuplicatePartitaIva(updates.partita_iva, clienteId);
            if (isDuplicate) {
                throw new HttpsError('already-exists', 'Esiste già un cliente con questa Partita IVA');
            }
        }

        // ✅ SANITIZZAZIONE
        const updateData = {
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: userId,
            lastModifiedBy: userId,
            lastModifiedByEmail: request.auth.token.email || null
        };

        if (updates.ragione_sociale) updateData.ragione_sociale = sanitizeString(updates.ragione_sociale);
        if (updates.email !== undefined) updateData.email = updates.email ? sanitizeString(updates.email.toLowerCase()) : null;
        if (updates.telefono !== undefined) updateData.telefono = updates.telefono ? sanitizeString(updates.telefono) : null;
        if (updates.codice !== undefined) updateData.codice = updates.codice ? sanitizeString(updates.codice) : null;
        if (updates.partita_iva !== undefined) updateData.partita_iva = updates.partita_iva ? updates.partita_iva.trim() : null;
        if (updates.codice_fiscale !== undefined) updateData.codice_fiscale = updates.codice_fiscale ? updates.codice_fiscale.trim().toUpperCase() : null;
        if (updates.indirizzo !== undefined) updateData.indirizzo = updates.indirizzo ? sanitizeString(updates.indirizzo) : null;
        if (updates.citta !== undefined) updateData.citta = updates.citta ? sanitizeString(updates.citta) : null;
        if (updates.cap !== undefined) updateData.cap = updates.cap ? sanitizeString(updates.cap) : null;
        if (updates.provincia !== undefined) updateData.provincia = updates.provincia ? sanitizeString(updates.provincia) : null;
        if (updates.note !== undefined) updateData.note = updates.note ? sanitizeString(updates.note) : null;
        if (updates.stato !== undefined) updateData.stato = !!updates.stato;

        await clienteRef.update(updateData);

        console.log(`✅ Cliente aggiornato: ${clienteId} da ${userId}`);

        return {
            success: true,
            message: 'Cliente aggiornato con successo'
        };

    } catch (error) {
        console.error('Errore aggiornamento cliente:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', `Errore: ${error.message}`);
    }
});

/**
 * Elimina cliente - VALIDATO SERVER-SIDE
 */
exports.deleteClienteApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Devi essere autenticato');
    }

    try {
        const userId = request.auth.uid;
        const { clienteId } = request.data;

        if (!clienteId) {
            throw new HttpsError('invalid-argument', 'clienteId obbligatorio');
        }

        // ✅ VERIFICA ESISTENZA
        const clienteRef = db.collection('anagrafica_clienti').doc(clienteId);
        const clienteDoc = await clienteRef.get();

        if (!clienteDoc.exists) {
            throw new HttpsError('not-found', 'Cliente non trovato');
        }

        // ✅ ELIMINAZIONE
        await clienteRef.delete();

        console.log(`✅ Cliente eliminato: ${clienteId} da ${userId}`);

        return {
            success: true,
            message: 'Cliente eliminato con successo'
        };

    } catch (error) {
        console.error('Errore eliminazione cliente:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', `Errore: ${error.message}`);
    }
});

/**
 * Lista clienti (autenticato)
 */
exports.listClientiApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    await requireAuth(request);

    try {
        const snapshot = await db.collection('anagrafica_clienti')
            .orderBy('ragione_sociale')
            .limit(200)
            .get();

        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { items };
    } catch (error) {
        console.error('Errore lista clienti:', error);
        throw new HttpsError('internal', 'Impossibile recuperare i clienti');
    }
});
