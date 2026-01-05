import { db, storage, auth, functions } from '../lib/firebase-client';
import { doc, getDoc, setDoc, collection, getDocs, limit, query } from "firebase/firestore";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import * as documentUtils from './utils/documentUtils.js';

const collection_name = 'utenti';
let currentUserId = null;

export function initProfilePage() {
    documentUtils.setup({ 
        db, 
        storage, 
        auth, 
        functions,
        entityCollection: collection_name, 
        previewListId: 'profile-document-preview-list', 
        dropAreaId: 'profile-file-drop-area', 
        fileInputId: 'profile-document-upload' 
    });
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

    try {
        const docSnap = await getDoc(doc(db, collection_name, currentUserId));

        if (docSnap.exists()) {
            const data = docSnap.data();

            document.getElementById('profile-nome').value = data.nome || '';
            document.getElementById('profile-cognome').value = data.cognome || '';
            document.getElementById('profile-email').value = data.email || user.email || '';
            document.getElementById('profile-telefono').value = data.telefono || '';

            // Carica i documenti dell'utente
            documentUtils.listenForDocuments(currentUserId);
        } else {
            console.log('Profilo utente non trovato in Firestore, uso i dati da Auth');
            document.getElementById('profile-email').value = user.email || '';
            document.getElementById('profile-nome').value = user.displayName?.split(' ')[0] || '';
            document.getElementById('profile-cognome').value = user.displayName?.split(' ').slice(1).join(' ') || '';
        }
    } catch (error) {
        console.error('Errore nel caricamento del profilo:', error);
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
        const nome = document.getElementById('profile-nome').value;
        const cognome = document.getElementById('profile-cognome').value;
        const email = document.getElementById('profile-email').value;
        const telefono = document.getElementById('profile-telefono').value;
        const password = document.getElementById('profile-password').value;
        const displayName = `${nome} ${cognome}`.trim();
        const now = new Date().toISOString();

        // Aggiorna Firebase Auth lato client
        const user = auth.currentUser;

        // Aggiorna displayName
        await updateProfile(user, {
            displayName: displayName
        });

        // Se email è cambiata, aggiornala
        if (email !== user.email) {
            await updateEmail(user, email);
        }

        // Se è stata inserita una password, aggiornala
        if (password && password.trim() !== '') {
            await updatePassword(user, password);
        }

        // Controlla se l'utente esiste già in Firestore
        const userDocSnap = await getDoc(doc(db, collection_name, currentUserId));
        const userExists = userDocSnap.exists();

        // Prepara i dati da salvare
        const data = {
            nome: nome,
            cognome: cognome,
            email: email,
            telefono: telefono,
            changed: now,
            lastModifiedBy: user.uid,
            lastModifiedByEmail: user.email
        };

        // Se l'utente non esiste, controlla se è il primo utente del sistema
        let saveMessage = 'Profilo aggiornato con successo!';

        if (!userExists) {
            // Controlla quanti utenti esistono nella collezione
            const usersQuery = query(collection(db, collection_name), limit(1));
            const usersSnapshot = await getDocs(usersQuery);
            const isFirstUser = usersSnapshot.empty;

            if (isFirstUser) {
                // È il primo utente: chiama la Cloud Function per impostare i custom claims
                try {
                    const initializeFirstUser = httpsCallable(functions, 'initializeFirstUserApi');
                    await initializeFirstUser();

                    // Imposta il ruolo anche in Firestore
                    data.ruolo = ['superuser'];
                    data.created = now;
                    console.log('🎉 Primo utente del sistema - Assegnato ruolo SUPERUSER');
                    saveMessage = 'Profilo creato con ruolo SUPERUSER (primo utente del sistema)!';
                } catch (claimsError) {
                    console.error('Errore impostazione custom claims:', claimsError);
                    // Continua comunque a salvare in Firestore, ma avvisa l'utente
                    data.ruolo = ['superuser'];
                    data.created = now;
                    saveMessage = 'Profilo creato. ATTENZIONE: Esegui logout e login per attivare i permessi SUPERUSER.';
                }
            } else {
                // Non è il primo utente: crea senza ruolo (sarà assegnato da un admin)
                data.ruolo = [];
                data.created = now;
                console.log('📝 Nuovo utente creato - Ruolo da assegnare da parte di un admin');
                saveMessage = 'Profilo creato! Contatta un amministratore per ottenere i permessi.';
            }
        }

        await setDoc(doc(db, collection_name, currentUserId), data, { merge: true });

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

    } catch (error) {
        console.error('Errore nel salvare il profilo:', error);
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
