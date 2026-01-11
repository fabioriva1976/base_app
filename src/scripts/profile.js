import { auth, functions } from '../lib/firebase-client';
import { updatePassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { getRoleLabel } from '../lib/roles';
import { currentUserProfileStore } from '../stores/currentUserStore.js';
let currentUserId = null;
let unsubscribeStore = null;

export function initProfilePage() {
    setupEventListeners();

    // Subscribe allo store per aggiornare il form quando cambiano i dati
    unsubscribeStore = currentUserProfileStore.subscribe((profileData) => {
        if (profileData) {
            updateProfileForm(profileData);
        }
    });

    // Attendi che l'autenticazione sia pronta
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUserId = user.uid;
            document.getElementById('profile-user-id').value = currentUserId;

            // Se lo store ha già i dati, aggiorna il form
            const currentProfile = currentUserProfileStore.get();
            if (currentProfile) {
                updateProfileForm(currentProfile);
            }
        } else {
            console.error('Utente non autenticato');
        }
    });
}

// Funzione di cleanup
export function cleanupProfilePage() {
    if (unsubscribeStore) {
        unsubscribeStore();
        unsubscribeStore = null;
    }
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

// Aggiorna il form del profilo con i dati dallo store
function updateProfileForm(data) {
    const user = auth.currentUser;

    console.log('✅ Aggiornamento form profilo con dati dallo store:', data);

    const nomeInput = document.getElementById('profile-nome');
    const cognomeInput = document.getElementById('profile-cognome');
    const emailInput = document.getElementById('profile-email');
    const telefonoInput = document.getElementById('profile-telefono');
    const ruoloInput = document.getElementById('profile-ruolo');

    if (nomeInput) nomeInput.value = data.nome || '';
    if (cognomeInput) cognomeInput.value = data.cognome || '';
    if (emailInput) emailInput.value = data.email || user?.email || '';
    if (telefonoInput) telefonoInput.value = data.telefono || '';

    // Aggiorna il campo ruolo con il valore da Firestore
    if (ruoloInput && data.ruolo) {
        const roleLabel = getRoleLabel(data.ruolo);
        ruoloInput.value = roleLabel;
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

        // Usa sempre userSelfUpdateApi per creare/aggiornare il proprio profilo
        // L'API gestisce automaticamente il caso del primo utente (SUPERUSER)
        const userSelfUpdateApi = httpsCallable(functions, 'userSelfUpdateApi');

        const updateData = {
            displayName: displayName,
            nome: nome,
            cognome: cognome,
            telefono: telefono,
            email: email  // Includi sempre email per garantire sia salvata in Firestore
        };

        console.log('📤 Invio aggiornamento profilo tramite API userSelfUpdateApi:', updateData);
        console.log('📤 Valori individuali:', {
            nome: nome,
            cognome: cognome,
            email: email,
            telefono: telefono,
            displayName: displayName
        });

        let saveMessage = 'Profilo aggiornato con successo!';

        try {
            const apiResult = await userSelfUpdateApi(updateData);
            console.log('✅ Profilo aggiornato tramite API, result:', apiResult);
            // Non serve più attendere o ricaricare - lo store si aggiorna automaticamente tramite onSnapshot
        } catch (apiError) {
            console.error('❌ Errore API userSelfUpdateApi:', apiError);
            throw apiError;
        }

        // Se è stata inserita una password, aggiornala lato client (Auth non ha API server-side per questo)
        if (password && password.trim() !== '') {
            await updatePassword(user, password);
            console.log('✅ Password aggiornata');
        }

        // Pulisci il campo password dopo il salvataggio
        document.getElementById('profile-password').value = '';

        // Non serve più aggiornare manualmente l'avatar - lo store lo fa automaticamente

        // Mostra il messaggio di successo
        showSaveMessage(saveMessage);

    } catch (error) {
        console.error('❌ Errore nel salvare il profilo:', error);

        // Estrai il messaggio di errore dall'oggetto error
        let errorMessage = 'Impossibile salvare il profilo';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.code) {
            errorMessage = `Errore ${error.code}`;
        }

        showErrorMessage(errorMessage);
    } finally {
        // Riabilita il pulsante
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

function showSaveMessage(message) {
    const msg = document.getElementById('profile-save-message');
    const errorMsg = document.getElementById('profile-error-message');

    // Nascondi eventuali messaggi di errore
    if (errorMsg) {
        errorMsg.style.display = 'none';
    }

    msg.textContent = message;
    msg.style.display = 'inline';
    setTimeout(() => { msg.style.display = 'none'; }, 3000);
}

function showErrorMessage(message) {
    const errorMsg = document.getElementById('profile-error-message');
    const successMsg = document.getElementById('profile-save-message');

    // Nascondi eventuali messaggi di successo
    if (successMsg) {
        successMsg.style.display = 'none';
    }

    errorMsg.textContent = message;
    errorMsg.style.display = 'inline';

    // Non nascondere automaticamente gli errori
}
