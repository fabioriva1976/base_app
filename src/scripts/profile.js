import { db, auth, functions } from '../lib/firebase-client';
import { doc, getDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";

const collection_name = 'utenti';
let currentUserId = null;

export function initProfilePage() {
    setupEventListeners();

    // Attendi che l'autenticazione sia pronta prima di caricare il profilo
    auth.onAuthStateChanged((user) => {
        if (user) {
            loadCurrentUserProfile();
        } else {
            console.error('Utente non autenticato');
        }
    });
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-link').forEach(btn => btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`#tab-${tabName}`).classList.add('active');
    }));

    // Form submit
    document.getElementById('profile-form').addEventListener('submit', saveProfile);
}

async function loadCurrentUserProfile() {
    const user = auth.currentUser;

    if (!user) {
        console.error('Utente non autenticato');
        return;
    }

    currentUserId = user.uid;
    document.getElementById('profile-user-id').value = currentUserId;

    console.log('📝 Caricamento profilo per utente:', currentUserId);

    try {
        const docSnap = await getDoc(doc(db, collection_name, currentUserId));

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('✅ Dati profilo trovati in Firestore:', data);

            document.getElementById('profile-nome').value = data.nome || '';
            document.getElementById('profile-cognome').value = data.cognome || '';
            document.getElementById('profile-email').value = data.email || user.email || '';
            document.getElementById('profile-telefono').value = data.telefono || '';

            console.log('✅ Campi popolati:', {
                nome: document.getElementById('profile-nome').value,
                cognome: document.getElementById('profile-cognome').value,
                email: document.getElementById('profile-email').value,
                telefono: document.getElementById('profile-telefono').value
            });

        } else {
            console.log('⚠️ Profilo utente non trovato in Firestore, uso i dati da Auth');
            console.log('Auth user:', { email: user.email, displayName: user.displayName });

            document.getElementById('profile-email').value = user.email || '';
            document.getElementById('profile-nome').value = user.displayName?.split(' ')[0] || '';
            document.getElementById('profile-cognome').value = user.displayName?.split(' ').slice(1).join(' ') || '';
        }
    } catch (error) {
        console.error('❌ Errore nel caricamento del profilo:', error);
        alert('Errore nel caricamento del profilo');
    }
}

async function saveProfile(e) {
    e.preventDefault();

    const saveBtn = document.querySelector('button[type="submit"]');
    const originalText = saveBtn.textContent;

    // Disabilita il pulsante e mostra il loader
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="btn-loader"></span>Salvataggio...';

    try {
        const nome = document.getElementById('profile-nome').value.trim();
        const cognome = document.getElementById('profile-cognome').value.trim();
        const email = document.getElementById('profile-email').value.trim();
        const telefono = document.getElementById('profile-telefono').value.trim();
        const password = document.getElementById('profile-password').value;
        const displayName = `${nome} ${cognome}`.trim();

        const user = auth.currentUser;

        // Controlla se l'utente esiste già in Firestore
        const userDocSnap = await getDoc(doc(db, collection_name, currentUserId));
        const userExists = userDocSnap.exists();

        let saveMessage = 'Profilo aggiornato con successo!';

        if (!userExists) {
            // Prova a inizializzare come primo utente tramite Cloud Function
            const initializeFirstUser = httpsCallable(functions, 'initializeFirstUserApi');

            try {
                await initializeFirstUser({ nome, cognome, email, telefono });
                console.log('🎉 Primo utente del sistema - Assegnato ruolo SUPERUSER');
                saveMessage = 'Profilo creato con ruolo SUPERUSER (primo utente del sistema)!';
            } catch (claimsError) {
                // Se la collezione non è vuota, la funzione risponde con failed-precondition
                if (claimsError?.code === 'failed-precondition') {
                    // Non è il primo utente: il profilo va gestito dalla pagina anagrafica-utenti
                    throw new Error('Non puoi creare un nuovo profilo da questa pagina. Contatta un amministratore.');
                }

                console.error('Errore impostazione custom claims:', claimsError);
                saveMessage = 'Profilo creato. ATTENZIONE: Esegui logout e login per attivare i permessi SUPERUSER.';
            }
        } else {
            // Aggiorna utente esistente tramite Cloud Function userUpdateApi
            const userUpdateApi = httpsCallable(functions, 'userUpdateApi');

            const updateData = {
                uid: currentUserId,
                displayName: displayName,
                nome: nome,
                cognome: cognome,
                telefono: telefono
            };

            // Se email è cambiata, aggiornala
            if (email && email !== user.email) {
                updateData.email = email;
            }

            console.log('📤 Invio aggiornamento profilo tramite API:', updateData);

            await userUpdateApi(updateData);

            console.log('✅ Profilo aggiornato tramite API');
        }

        // Se è stata inserita una password, aggiornala lato client (Auth non ha API server-side per questo)
        if (password && password.trim() !== '') {
            await updatePassword(user, password);
            console.log('✅ Password aggiornata');
        }

        showSaveMessage(saveMessage);

        // Pulisci il campo password dopo il salvataggio
        document.getElementById('profile-password').value = '';

        // Aggiorna l'avatar nell'header senza ricaricare la pagina
        const userIcon = document.getElementById('avatar-icon');
        if (userIcon) {
            const url = `https://ui-avatars.com/api/?name=${nome}&background=3b82f6&color=fff&rounded=true`;
            userIcon.setAttribute('src', url);
            userIcon.setAttribute('alt', `${nome} ${cognome}`);
        }

        // Ricarica i dati del profilo per assicurarsi che siano sincronizzati
        await loadCurrentUserProfile();

    } catch (error) {
        console.error('❌ Errore nel salvare il profilo:', error);
        alert('Errore: ' + (error.message || 'Impossibile salvare il profilo'));
    } finally {
        // Riabilita il pulsante
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

function showSaveMessage(message) {
    const msg = document.getElementById('profile-save-message');
    msg.textContent = message;
    msg.style.display = 'inline';
    setTimeout(() => { msg.style.display = 'none'; }, 3000);
}
