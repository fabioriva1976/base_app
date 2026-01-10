import { db, auth, functions } from '../lib/firebase-client';
import { doc, getDoc, getDocFromServer } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { getRoleLabel } from '../lib/roles';

const collection_name = 'users';
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

async function loadCurrentUserProfile(forceReload = false) {
    const user = auth.currentUser;

    if (!user) {
        console.error('Utente non autenticato');
        return;
    }

    currentUserId = user.uid;
    document.getElementById('profile-user-id').value = currentUserId;

    console.log('📝 Caricamento profilo per utente:', currentUserId);

    try {
        const docRef = doc(db, collection_name, currentUserId);
        let docSnap;
        try {
            docSnap = await getDocFromServer(docRef);
        } catch {
            docSnap = await getDoc(docRef);
        }

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('✅ Dati profilo trovati in Firestore:', data);
            console.log('📋 Dati individuali da Firestore:', {
                nome: data.nome,
                cognome: data.cognome,
                email: data.email,
                telefono: data.telefono,
                ruolo: data.ruolo
            });

            const nomeInput = document.getElementById('profile-nome');
            const cognomeInput = document.getElementById('profile-cognome');
            const emailInput = document.getElementById('profile-email');
            const telefonoInput = document.getElementById('profile-telefono');
            const ruoloInput = document.getElementById('profile-ruolo');

            console.log('📝 Valori attuali nei campi PRIMA dell\'aggiornamento:', {
                nome: nomeInput.value,
                cognome: cognomeInput.value,
                email: emailInput.value,
                telefono: telefonoInput.value,
                ruolo: ruoloInput?.value
            });

            const hasExistingValues = Boolean(
                nomeInput.value || cognomeInput.value || emailInput.value || telefonoInput.value
            );

            console.log('🔄 forceReload:', forceReload, 'fromCache:', docSnap.metadata?.fromCache, 'hasExistingValues:', hasExistingValues);

            // Aggiorna sempre se forceReload è true (dopo un salvataggio)
            if (forceReload || !docSnap.metadata?.fromCache || !hasExistingValues) {
                console.log('✏️ Aggiornamento campi in corso...');
                nomeInput.value = data.nome || '';
                console.log('✏️ Nome impostato a:', nomeInput.value, '(da data.nome:', data.nome, ')');
                cognomeInput.value = data.cognome || '';
                console.log('✏️ Cognome impostato a:', cognomeInput.value, '(da data.cognome:', data.cognome, ')');
                emailInput.value = data.email || user.email || '';
                console.log('✏️ Email impostato a:', emailInput.value);
                telefonoInput.value = data.telefono || '';
                console.log('✏️ Telefono impostato a:', telefonoInput.value);

                // Aggiorna il campo ruolo con il valore da Firestore
                if (ruoloInput && data.ruolo) {
                    const roleLabel = getRoleLabel(data.ruolo);
                    ruoloInput.value = roleLabel;
                    console.log('✏️ Ruolo impostato a:', ruoloInput.value, '(label da ruolo:', data.ruolo, ')');
                }
            } else {
                console.log('⏭️ Aggiornamento saltato (condizioni non soddisfatte)');
            }

            console.log('✅ Campi popolati DOPO l\'aggiornamento:', {
                nome: nomeInput.value,
                cognome: cognomeInput.value,
                email: emailInput.value,
                telefono: telefonoInput.value,
                ruolo: ruoloInput?.value
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

            // Attendi che Firestore rifletta gli aggiornamenti
            console.log('⏳ Attesa che Firestore rifletta gli aggiornamenti...');
            await waitForProfileUpdate({
                nome,
                cognome,
                email,
                telefono
            });
            console.log('✅ Firestore aggiornato');
        } catch (apiError) {
            console.error('❌ Errore API userSelfUpdateApi:', apiError);
            throw apiError;
        }

        // Ricarica il profilo da Firestore per ottenere tutti i dati aggiornati
        // (importante per il primo utente che diventa SUPERUSER e ottiene il ruolo)
        console.log('🔄 Ricaricamento profilo da Firestore con forceReload=true...');
        await loadCurrentUserProfile(true);
        console.log('✅ Profilo ricaricato');

        // Se è stata inserita una password, aggiornala lato client (Auth non ha API server-side per questo)
        if (password && password.trim() !== '') {
            await updatePassword(user, password);
            console.log('✅ Password aggiornata');
        }

        // Pulisci il campo password dopo il salvataggio
        document.getElementById('profile-password').value = '';

        // Aggiorna l'avatar nell'header senza ricaricare la pagina
        const userIcon = document.getElementById('avatar-icon');
        if (userIcon) {
            const url = `https://ui-avatars.com/api/?name=${nome}&background=3b82f6&color=fff&rounded=true`;
            userIcon.setAttribute('src', url);
            userIcon.setAttribute('alt', `${nome} ${cognome}`);
        }

        // Mostra il messaggio di successo DOPO aver aggiornato i campi
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

async function waitForProfileUpdate(expected) {
    if (!currentUserId) return;

    console.log('⏳ waitForProfileUpdate - Valori attesi:', expected);

    const docRef = doc(db, collection_name, currentUserId);
    const deadline = Date.now() + 3000;
    let attempt = 0;

    while (Date.now() < deadline) {
        try {
            attempt++;
            const snap = await getDocFromServer(docRef);
            if (snap.exists()) {
                const data = snap.data() || {};
                console.log(`🔍 waitForProfileUpdate - Tentativo ${attempt}, dati da Firestore:`, {
                    nome: data.nome,
                    cognome: data.cognome,
                    email: data.email,
                    telefono: data.telefono
                });

                const matches =
                    (expected.nome === '' || data.nome === expected.nome) &&
                    (expected.cognome === '' || data.cognome === expected.cognome) &&
                    (expected.email === '' || data.email === expected.email) &&
                    (expected.telefono === '' || data.telefono === expected.telefono);

                console.log(`🔍 waitForProfileUpdate - Tentativo ${attempt}, match:`, {
                    nomeMatch: expected.nome === '' || data.nome === expected.nome,
                    cognomeMatch: expected.cognome === '' || data.cognome === expected.cognome,
                    emailMatch: expected.email === '' || data.email === expected.email,
                    telefonoMatch: expected.telefono === '' || data.telefono === expected.telefono,
                    overallMatch: matches
                });

                if (matches) {
                    console.log('✅ waitForProfileUpdate - Dati corrispondono, uscita');
                    return;
                }
            } else {
                console.log(`🔍 waitForProfileUpdate - Tentativo ${attempt}, documento non esiste ancora`);
            }
        } catch (error) {
            console.warn(`⚠️ waitForProfileUpdate - Tentativo ${attempt}, errore:`, error);
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    console.warn('⚠️ waitForProfileUpdate - Timeout raggiunto, uscita senza match');
}
