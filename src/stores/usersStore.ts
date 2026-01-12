import { atom } from 'nanostores';
import { COLLECTIONS } from '../../shared/constants/collections.ts';

// Store che contiene l'array di utenti
export const usersStore = atom([]);

// Store per lo stato di loading
export const usersLoadingStore = atom(true);

// Store per eventuali errori
export const usersErrorStore = atom(null);

let unsubscribe = null;

// Inizializza il listener per gli utenti
export function initUsersListener() {
    // Importazioni dinamiche per evitare problemi SSR
    import('firebase/firestore').then(({ collection, onSnapshot }) => {
        import('../lib/firebase-client').then(({ db }) => {
            // Se esiste già un listener, non crearne un altro
            if (unsubscribe) {
                console.log('Listener già attivo per users');
                return;
            }

            usersLoadingStore.set(true);
            usersErrorStore.set(null);

            try {
                const usersCollection = collection(db, COLLECTIONS.USERS);

                // Crea il listener con onSnapshot
                unsubscribe = onSnapshot(
                    usersCollection,
                    (snapshot) => {
                        const users = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));

                        console.log(`Users aggiornati: ${users.length} utenti`);
                        usersStore.set(users);
                        usersLoadingStore.set(false);
                    },
                    (error) => {
                        console.error('Errore nel listener users:', error);
                        usersErrorStore.set(error.message);
                        usersLoadingStore.set(false);
                    }
                );

                console.log('Listener users inizializzato');
            } catch (error) {
                console.error('Errore nell\'inizializzare il listener users:', error);
                usersErrorStore.set(error.message);
                usersLoadingStore.set(false);
            }
        });
    });
}

// Funzione per fermare il listener (cleanup)
export function stopUsersListener() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        console.log('Listener users fermato');
    }
}
