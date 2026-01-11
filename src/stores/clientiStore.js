import { atom } from 'nanostores';
import { COLLECTIONS } from '../../shared/constants/collections.js';

// Store che contiene l'array di clienti
export const clientiStore = atom([]);

// Store per lo stato di loading
export const clientiLoadingStore = atom(true);

// Store per eventuali errori
export const clientiErrorStore = atom(null);

let unsubscribe = null;

// Inizializza il listener per i clienti
export function initClientiListener() {
    // Importazioni dinamiche per evitare problemi SSR
    import('firebase/firestore').then(({ collection, onSnapshot }) => {
        import('../lib/firebase-client').then(({ db }) => {
            // Se esiste già un listener, non crearne un altro
            if (unsubscribe) {
                console.log('Listener già attivo per clienti');
                return;
            }

            clientiLoadingStore.set(true);
            clientiErrorStore.set(null);

            try {
                const clientiCollection = collection(db, COLLECTIONS.CLIENTI);

                // Crea il listener con onSnapshot
                unsubscribe = onSnapshot(
                    clientiCollection,
                    (snapshot) => {
                        const clienti = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));

                        console.log(`Clienti aggiornati: ${clienti.length} clienti`);
                        clientiStore.set(clienti);
                        clientiLoadingStore.set(false);
                    },
                    (error) => {
                        console.error('Errore nel listener clienti:', error);
                        clientiErrorStore.set(error.message);
                        clientiLoadingStore.set(false);
                    }
                );

                console.log('Listener clienti inizializzato');
            } catch (error) {
                console.error('Errore nell\'inizializzare il listener clienti:', error);
                clientiErrorStore.set(error.message);
                clientiLoadingStore.set(false);
            }
        });
    });
}

// Funzione per fermare il listener (cleanup)
export function stopClientiListener() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        console.log('Listener clienti fermato');
    }
}
