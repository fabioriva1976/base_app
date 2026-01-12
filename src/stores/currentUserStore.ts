import { atom } from 'nanostores';
import { COLLECTIONS } from '../../shared/constants/collections.ts';

// Store che contiene i dati del profilo utente corrente
export const currentUserProfileStore = atom(null);

// Store per lo stato di loading
export const currentUserLoadingStore = atom(true);

// Store per eventuali errori
export const currentUserErrorStore = atom(null);

let unsubscribe = null;
let currentUserId = null;

// Inizializza il listener per il profilo dell'utente corrente
export function initCurrentUserListener(userId) {
    // Importazioni dinamiche per evitare problemi SSR
    import('firebase/firestore').then(({ doc, onSnapshot }) => {
        import('../lib/firebase-client').then(({ db }) => {
            // Se l'utente è cambiato, ferma il vecchio listener
            if (currentUserId !== userId) {
                stopCurrentUserListener();
                currentUserId = userId;
            }

            // Se esiste già un listener per questo utente, non crearne un altro
            if (unsubscribe) {
                console.log('Listener già attivo per currentUser');
                return;
            }

            if (!userId) {
                console.warn('initCurrentUserListener chiamato senza userId');
                currentUserProfileStore.set(null);
                currentUserLoadingStore.set(false);
                return;
            }

            currentUserLoadingStore.set(true);
            currentUserErrorStore.set(null);

            try {
                const userDocRef = doc(db, COLLECTIONS.USERS, userId);

                // Crea il listener con onSnapshot
                unsubscribe = onSnapshot(
                    userDocRef,
                    (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const userData = {
                                id: docSnapshot.id,
                                ...docSnapshot.data()
                            };

                            console.log('Current user profile aggiornato:', userData);
                            currentUserProfileStore.set(userData);
                            currentUserLoadingStore.set(false);

                            // Aggiorna l'avatar nell'header automaticamente
                            updateAvatarInHeader(userData);
                        } else {
                            console.warn('Profilo utente non trovato in Firestore');
                            currentUserProfileStore.set(null);
                            currentUserLoadingStore.set(false);
                        }
                    },
                    (error) => {
                        console.error('Errore nel listener currentUser:', error);
                        currentUserErrorStore.set(error.message);
                        currentUserLoadingStore.set(false);
                    }
                );

                console.log('Listener currentUser inizializzato per userId:', userId);
            } catch (error) {
                console.error('Errore nell\'inizializzare il listener currentUser:', error);
                currentUserErrorStore.set(error.message);
                currentUserLoadingStore.set(false);
            }
        });
    });
}

// Funzione per fermare il listener (cleanup)
export function stopCurrentUserListener() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        currentUserId = null;
        console.log('Listener currentUser fermato');
    }
}

// Funzione helper per aggiornare l'avatar nell'header
function updateAvatarInHeader(userData) {
    const avatarIcon = document.getElementById('avatar-icon');
    if (avatarIcon) {
        const name = userData.nome || userData.email?.split('@')[0] || 'User';
        const fullName = userData.cognome ? `${userData.nome} ${userData.cognome}` : name;

        const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&rounded=true`;
        avatarIcon.setAttribute('src', url);
        avatarIcon.setAttribute('alt', fullName);
    }
}
