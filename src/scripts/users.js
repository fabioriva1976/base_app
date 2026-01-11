import { db, auth, functions } from '../lib/firebase-client';
import { httpsCallable } from "firebase/functions";
import * as actionUtils from './utils/actionUtils.js';
import { Multiselect } from './utils/multiSelectUtils.js';
import { getAvailableRoles, getRoleLabel } from '../lib/roles.ts';
import * as ui from './utils/uiUtils.js';
import { usersStore, initUsersListener, stopUsersListener } from '../stores/usersStore.js';

let entities = [];
let collection_name = 'users';
let currentEntityId = null;
let dataTable = null;
let ruoloMultiselect = null;
let unsubscribeStore = null;
let listenerReady = false;

const labelNewEntity = 'Nuovo Utente';


export function initUsersPage() {
    actionUtils.setup({ db, auth, functions, entityCollection: collection_name });
    const availableRoles = getAvailableRoles();
    ruoloMultiselect = new Multiselect({
        elementId: 'ruolo-multiselect',
        // Usa key/label per preservare il valore del ruolo
        selectOptions: availableRoles.map(r => ({ key: r.value, label: r.label })),
        multiple: false
    });
    setupEventListeners();

    // Inizializza il listener solo dopo auth pronta
    auth.onAuthStateChanged((user) => {
        if (!user) {
            cleanupUsersPage();
            return;
        }

        if (listenerReady) {
            return;
        }
        listenerReady = true;
        initUsersListener();

        unsubscribeStore = usersStore.subscribe((users) => {
            entities = users;
            renderTable();
        });
    });
}

function setupEventListeners() {
    //Form 1
    document.getElementById('new-entity-btn').addEventListener('click', () => {
        document.getElementById('entity-form').reset();
        ruoloMultiselect.setValue([]);
        document.getElementById('entity-form-title').textContent = labelNewEntity;
        currentEntityId = null;
        hideTabsForNewEntity();
        showPasswordField(); // Mostra il campo password per nuovo utente
        resetToFirstTab('entity-form-sidebar');
        openSidebar();
    });
    document.getElementById('close-sidebar-btn').addEventListener('click', closeSidebar);
    document.getElementById('entity-form').addEventListener('submit', saveEntity);
    document.querySelectorAll('.tab-link').forEach(btn => btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        const sidebar = e.target.closest('.form-sidebar');
        sidebar.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
        sidebar.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        sidebar.querySelector(`#tab-${tabName}`).classList.add('active');
    }));
}

// Funzione di cleanup per fermare i listener quando si esce dalla pagina
export function cleanupUsersPage() {
    if (unsubscribeStore) {
        unsubscribeStore();
        unsubscribeStore = null;
    }
    listenerReady = false;
    stopUsersListener();
}

function renderTable() {
    // Verifica se l'utente può gestire gli utenti (admin/superuser)
    const canManage = document.querySelector('.container')?.dataset.canManage === 'true';

    const tableData = entities.map(e => [
        e.nome || 'N/D',
        e.cognome || 'N/D',
        e.email || 'N/D',
        getRoleLabel(e.ruolo) || 'N/D',
        ui.getTableStatusBadgeElement(e.status),
        ui.formatTableActionElement(e.id, {
            showEdit: canManage,
            showDelete: canManage
        }),
    ]);

    if (dataTable) {
        dataTable.destroy();
    }

    dataTable = new simpleDatatables.DataTable('#data-table', {
        data: {
            headings: ['Nome', 'Cognome', 'Email', 'Ruolo', 'Status', 'Azioni'],
            data: tableData
        },
        perPageSelect: false,
        labels: {
            placeholder: "Cerca...",
            noRows: "Nessun risultato trovato",
            info: "Mostra da {start} a {end} di {rows} elementi"
        },
        layout: { top: "{search}", bottom: "{info}{pager}" }
    });

    setupTableClickHandlers();
}

//CRUD entity
async function saveEntity(e) {
    e.preventDefault();
    const isNew = !currentEntityId;
    // Ottieni il pulsante di salvataggio
    const saveBtn = document.querySelector('button[type="submit"][form="entity-form"]');
    const originalText = saveBtn.textContent;

    // Disabilita il pulsante e mostra il loader
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="btn-loader"></span>Salvataggio...';

    try {
        const email = document.getElementById('email').value.trim();
        const nome = document.getElementById('nome').value.trim();
        const cognome = document.getElementById('cognome').value.trim();
        const displayName = `${nome} ${cognome}`.trim();
        if (!email) {
            alert('Email obbligatoria.');
            return;
        }

        if (isNew) {
            // Crea nuovo utente tramite Cloud Function
            const password = document.getElementById('password')?.value || generateRandomPassword();
            const userCreateApi = httpsCallable(functions, 'userCreateApi');
            const roleValue = ruoloMultiselect.getValue(); // restituisce la key (es. 'operatore')

            const requestData = {
                email: email,
                password: password,
                displayName: displayName,
                disabled: !document.getElementById('toggle-status').checked,
                ruolo: roleValue || undefined,
                nome: nome,
                cognome: cognome,
                telefono: document.getElementById('telefono').value,
                status: document.getElementById('toggle-status').checked
            };

            console.log('Invio dati alla Cloud Function:', {
                email: requestData.email,
                displayName: requestData.displayName,
                disabled: requestData.disabled,
                password: '***' + password.substring(password.length - 3) // Mostra solo ultimi 3 caratteri
            });

            const result = await userCreateApi(requestData);

            console.log('Risposta dalla Cloud Function:', result.data);

            const uid = result.data.uid;
            const wasExisting = result.data.wasExisting || false;
            currentEntityId = uid;
            document.getElementById('entity-id').value = uid;

            showTabsForExistingEntity();
            actionUtils.loadActions(uid);

            // Mostra messaggio appropriato
            const msgElement = document.getElementById('save-message');
            msgElement.textContent = wasExisting
                ? 'Utente sincronizzato con successo (già presente in Auth)'
                : 'Utente creato con successo';
            msgElement.style.display = 'inline';
            setTimeout(() => { msgElement.style.display = 'none'; }, 4000);

        } else {
            // Aggiorna utente esistente tramite Cloud Function
            const uid = currentEntityId;
            const userUpdateApi = httpsCallable(functions, 'userUpdateApi');

            const updateData = {
                uid: uid,
                displayName: displayName,
                disabled: !document.getElementById('toggle-status').checked,
                nome: nome,
                cognome: cognome,
                telefono: document.getElementById('telefono').value,
                status: document.getElementById('toggle-status').checked
            };

            // Se email è cambiata, aggiornala (evita di salvare stringhe vuote)
            const oldEntity = entities.find(e => e.id === uid);
            if (email && email !== oldEntity?.email) {
                updateData.email = email;
            }

            const roleValue = ruoloMultiselect.getValue(); // restituisce la key (es. 'admin')

            // Aggiungi il ruolo solo se è stato selezionato un valore valido
            // Altrimenti preserva il valore esistente nel database
            if (roleValue) {
                updateData.ruolo = roleValue;
            }

            await userUpdateApi(updateData);

            showSaveMessage('save-message');
        }
    } catch (error) {
        console.error('Errore nel salvare l\'utente:', error);
        alert('Errore: ' + (error.message || 'Impossibile salvare l\'utente'));
    } finally {
        // Riabilita il pulsante e ripristina il testo
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

function generateRandomPassword() {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

function showSaveMessage(elementId) {
    const msg = document.getElementById(elementId);
    msg.textContent = 'Salvato con successo';
    msg.style.display = 'inline';
    setTimeout(() => { msg.style.display = 'none'; }, 3000);
}

function resetToFirstTab(sidebarId) {
    const sidebar = document.getElementById(sidebarId);
    sidebar.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    sidebar.querySelector('.tab-link').classList.add('active');
    sidebar.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    sidebar.querySelector('.tab-content').classList.add('active');
}

const editEntity = async (id) => {
    currentEntityId = id;

    // Usa i dati dallo store invece di fare una query a Firestore
    const data = entities.find(e => e.id === id);

    if (!data) {
        console.error('Utente non trovato nello store:', id);
        return;
    }

    // Crea il titolo con nome e cognome
    const fullName = [data.nome, data.cognome].filter(Boolean).join(' ') || 'Utente';
    document.getElementById('entity-form-title').textContent = fullName;
    document.getElementById('entity-id').value = id;
    document.getElementById('nome').value = data.nome || '';
    document.getElementById('cognome').value = data.cognome || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('telefono').value = data.telefono || '';
    const normalizedRole = Array.isArray(data.ruolo)
        ? data.ruolo
        : data.ruolo
        ? [data.ruolo]
        : [];
    ruoloMultiselect.setValue(normalizedRole);
    document.getElementById('toggle-status').checked = data.status || false;

    hidePasswordField(); // Nascondi il campo password in modifica
    showTabsForExistingEntity();
    actionUtils.loadActions(id);
    resetToFirstTab('entity-form-sidebar');
    openSidebar();
};

async function deleteEntity(id) {
    try {
        console.log('Tentativo di eliminare utente con ID:', id);

        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new Error('ID utente non valido');
        }

        // Elimina l'utente da Firebase Auth tramite Cloud Function
        const userDeleteApi = httpsCallable(functions, 'userDeleteApi');
        await userDeleteApi({ uid: id });
    } catch (error) {
        console.error('Errore nell\'eliminare l\'utente:', error);
        alert('Errore: ' + (error.message || 'Impossibile eliminare l\'utente'));
    }
}

function setupTableClickHandlers() {
    document.getElementById('data-table').addEventListener('click', () => {
        closeSidebar();
    }, { once: false });
    
    const resetAllDeleteButtons = () => {
        document.querySelectorAll('.delete-confirmation-overlay').forEach(overlay => {
            const td = overlay.closest('td');
            if (td) td.classList.remove('confirming-delete');
            overlay.remove();
        });
    };

    document.getElementById('data-table').addEventListener('click', function(event) {
        const target = event.target;

        const confirmYesButton = target.closest('.btn-confirm-yes');
        if (confirmYesButton) {
            deleteEntity(confirmYesButton.dataset.id);
            resetAllDeleteButtons();
            return;
        }

        const confirmNoButton = target.closest('.btn-confirm-no');
        if (confirmNoButton) {
            resetAllDeleteButtons();
            return;
        }

        const editButton = target.closest('.btn-edit');
        if (editButton) {
            resetAllDeleteButtons();
            editEntity(editButton.dataset.id);
            return;
        }

        const deleteButton = target.closest('.btn-delete');
        if (deleteButton) {
            resetAllDeleteButtons();
            const td = deleteButton.closest('td');
            if (!td) return;
            
            td.classList.add('confirming-delete');
            const overlay = document.createElement('div');
            overlay.className = 'delete-confirmation-overlay';
            overlay.innerHTML = `
                <span>Sei sicuro?</span>
                <button class="btn btn-sm btn-light btn-confirm-yes" data-id="${deleteButton.dataset.id}">Sì</button>
                <button class="btn btn-sm btn-outline-light btn-confirm-no">No</button>
            `;
            td.appendChild(overlay);
            setTimeout(() => { overlay.classList.add('active'); }, 10);
        }
    });
}

function hideTabsForNewEntity() {
    document.querySelectorAll('[data-tab="azioni"]').forEach(t => t.style.display = 'none');
    document.querySelectorAll('#tab-azioni').forEach(t => t.style.display = 'none');
}

function showTabsForExistingEntity() {
    document.querySelectorAll('[data-tab="azioni"]').forEach(t => t.style.display = '');
    document.querySelectorAll('#tab-azioni').forEach(t => t.style.display = '');
}

function openSidebar() { document.getElementById('entity-form-sidebar').classList.add('open'); }
function closeSidebar() { document.getElementById('entity-form-sidebar').classList.remove('open'); }

function showPasswordField() {
    const passwordGroup = document.getElementById('password-group');
    if (passwordGroup) {
        passwordGroup.style.display = 'block';
    }
}

function hidePasswordField() {
    const passwordGroup = document.getElementById('password-group');
    if (passwordGroup) {
        passwordGroup.style.display = 'none';
    }
}
