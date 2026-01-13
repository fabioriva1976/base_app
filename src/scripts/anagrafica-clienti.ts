import { storage, auth, functions } from '../lib/firebase-client';
import { doc, getFirestore } from "firebase/firestore";
import * as ui from './utils/uiUtils.ts';
import * as attachmentUtils from './utils/attachmentUtils.ts';
import * as actionUtils from './utils/actionUtils.ts';
import * as commentUtils from './utils/commentUtils.ts';
import { httpsCallable } from "firebase/functions";
import { createCliente } from './schemas/entityFactory.ts';
import { ClienteSchema } from '../../shared/schemas/zodSchemas.ts';
import { clientiStore, initClientiListener, stopClientiListener } from '../stores/clientiStore.ts';

let entities = [];
let collection_name = 'anagrafica_clienti';
let currentEntityId = null;
let dataTable = null;
let unsubscribeStore = null;
let listenerReady = false;

export function initPageAnagraficaClientiPage() {
    const container = document.querySelector('.container');
    if (container) {
        container.dataset.tableReady = 'false';
    }

    const db = getFirestore();
    attachmentUtils.setup({ db, storage, auth, functions, entityCollection: collection_name });
    actionUtils.setup({ db, auth, functions, entityCollection: collection_name });
    commentUtils.setup({ db, auth, functions, entityCollection: collection_name });
    setupEventListeners();

    // Inizializza il listener solo dopo auth pronta
    auth.onAuthStateChanged((user) => {
        if (!user) {
            cleanupClientiPage();
            return;
        }

        if (listenerReady) {
            return;
        }
        listenerReady = true;
        initClientiListener();

        unsubscribeStore = clientiStore.subscribe((clienti) => {
            entities = clienti;
            renderTable();
        });
    });
}

// Funzione di cleanup per fermare i listener quando si esce dalla pagina
export function cleanupClientiPage() {
    if (unsubscribeStore) {
        unsubscribeStore();
        unsubscribeStore = null;
    }
    listenerReady = false;
    stopClientiListener();
}

function setupEventListeners() {
    document.getElementById('new-entity-btn').addEventListener('click', () => { 
        document.getElementById('entity-form').reset(); 
        document.getElementById('entity-form-title').textContent = 'Nuovo Cliente'; 
        currentEntityId = null;
        hideTabsForNewEntity();
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

function renderTable() {
    const container = document.querySelector('.container');
    if (container) {
        container.dataset.tableReady = 'false';
    }

    const tableData = entities.map(e => [
        e.codice || 'N/D',
        e.ragione_sociale || 'N/D',
        e.partita_iva || 'N/D',
        e.email || 'N/D',
        ui.formatTableActionElement(e.id)
    ]);

    if (dataTable) dataTable.destroy();

    dataTable = new simpleDatatables.DataTable('#data-table', {
        data: {
            headings: ['Codice', 'Ragione Sociale', 'P.IVA', 'Email', 'Azioni'],
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

    waitForSearchReady(container);
}

function waitForSearchReady(container, attempts = 20) {
    if (!container) {
        return;
    }

    const selector = 'input[type="search"], .datatable-input, .dataTable-input';
    const input = container.querySelector(selector);
    if (input && !input.disabled) {
        container.dataset.tableReady = 'true';
        return;
    }

    if (attempts <= 0) {
        container.dataset.tableReady = 'true';
        return;
    }

    setTimeout(() => waitForSearchReady(container, attempts - 1), 100);
}

async function saveEntity(e) {
    e.preventDefault();
    const isNew = !currentEntityId;

    // 🔒 STEP 1: Raccogli dati dal form
    const formData = {
        codice: (document.getElementById('codice') as HTMLInputElement).value,
        ragione_sociale: (document.getElementById('ragione_sociale') as HTMLInputElement).value,
        partita_iva: (document.getElementById('piva') as HTMLInputElement).value || null,
        codice_fiscale: (document.getElementById('cf') as HTMLInputElement).value || null,
        email: (document.getElementById('email') as HTMLInputElement).value || null,
        telefono: (document.getElementById('telefono') as HTMLInputElement).value || null,
        indirizzo: (document.getElementById('indirizzo') as HTMLInputElement).value || null,
        citta: (document.getElementById('citta') as HTMLInputElement).value || null,
        cap: (document.getElementById('cap') as HTMLInputElement).value || null,
        provincia: (document.getElementById('provincia') as HTMLInputElement)?.value || null,
        note: (document.getElementById('note') as HTMLTextAreaElement)?.value || null,
        status: (document.getElementById('toggle-stato') as HTMLInputElement).checked
    };

    // 🔒 STEP 2: Validazione CLIENT-SIDE con Zod
    const validationResult = ClienteSchema.safeParse(formData);

    if (!validationResult.success) {
        // Mostra il primo errore trovato
        const firstError = validationResult.error.errors[0];
        const errorMessage = `${firstError.path.join('.')}: ${firstError.message}`;
        showSaveMessage('save-message', errorMessage, true);
        return;
    }

    // 🔒 STEP 3: Normalizza dati con factory (per audit fields)
    let normalized;
    try {
        normalized = createCliente({
            ...validationResult.data,
            codice: validationResult.data.codice,
            ragione_sociale: validationResult.data.ragione_sociale
        });
    } catch (err) {
        showSaveMessage('save-message', err.message || 'Dati non validi', true);
        return;
    }
    const { createdAt, updatedAt, createdBy, createdByEmail, ...payloadToSend } = normalized;

    const saveBtn = document.querySelector('button[type=\"submit\"][form=\"entity-form\"]');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class=\"btn-loader\"></span>Salvataggio...';

    try {
        if (isNew) {
            const createApi = httpsCallable(functions, 'createClienteApi');
            const result = await createApi(payloadToSend);
            const id = result.data?.id;
            if (id) {
                currentEntityId = id;
                document.getElementById('entity-id').value = id;
                showTabsForExistingEntity();
                attachmentUtils.listenForAttachments(id);
                actionUtils.loadActions(id);
                commentUtils.listenForComments(id);
            }
        } else {
            const updateApi = httpsCallable(functions, 'updateClienteApi');
            await updateApi({ id: currentEntityId, ...payloadToSend });
        }

        showSaveMessage('save-message');
    } catch (error) {
        console.error('Errore nel salvare il cliente:', error);
        showSaveMessage('save-message', 'Errore: ' + (error.message || 'Impossibile salvare il cliente'), true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

function showSaveMessage(elementId, message = 'Salvato con successo', isError = false) {
    const msg = document.getElementById(elementId);
    if (!msg) return;
    msg.textContent = message;
    msg.style.color = isError ? '#ef4444' : '';
    msg.style.display = 'inline';
    setTimeout(() => { msg.style.display = 'none'; }, 4000);
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
    const item = entities.find(e => e.id === id);
    if (!item) return;
    const data = item;
    document.getElementById('entity-form-title').textContent = data.ragione_sociale || 'Cliente';
    document.getElementById('entity-id').value = id;
    document.getElementById('codice').value = data.codice || '';
    document.getElementById('ragione_sociale').value = data.ragione_sociale || '';
    document.getElementById('piva').value = data.partita_iva || '';
    document.getElementById('cf').value = data.codice_fiscale || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('telefono').value = data.telefono || '';
    document.getElementById('indirizzo').value = data.indirizzo || '';
    document.getElementById('citta').value = data.citta || '';
    document.getElementById('cap').value = data.cap || '';
    document.getElementById('toggle-stato').checked = data.status || false;
    
    showTabsForExistingEntity();
    attachmentUtils.listenForAttachments(id);
    actionUtils.loadActions(id);
    commentUtils.listenForComments(id);
    resetToFirstTab('entity-form-sidebar');
    openSidebar();
};

async function deleteEntity(id) {
    try {
        const deleteApi = httpsCallable(functions, 'deleteClienteApi');
        await deleteApi({ id: id });
    } catch (error) {
        console.error('Errore nell\'eliminare il cliente:', error);
        alert('Errore: ' + (error.message || 'Impossibile eliminare il cliente'));
    }
}

function setupTableClickHandlers() {
    document.getElementById('data-table').addEventListener('click', () => { closeSidebar(); }, { once: false });

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
                <button class="btn btn-sm btn-outline-light btn-confirm-no">No</button>`;
            td.appendChild(overlay);
            setTimeout(() => { overlay.classList.add('active'); }, 10);
        }
    });
}

function hideTabsForNewEntity() {
    document.querySelectorAll('[data-tab="attachments"], [data-tab="note"], [data-tab="azioni"]').forEach(t => t.style.display = 'none');
    document.querySelectorAll('#tab-attachments, #tab-note, #tab-azioni').forEach(t => t.style.display = 'none');
}

function showTabsForExistingEntity() {
    document.querySelectorAll('[data-tab="attachments"], [data-tab="note"], [data-tab="azioni"]').forEach(t => t.style.display = '');
    document.querySelectorAll('#tab-attachments, #tab-note, #tab-azioni').forEach(t => t.style.display = '');
}

function openSidebar() { document.getElementById('entity-form-sidebar').classList.add('open'); }
function closeSidebar() { document.getElementById('entity-form-sidebar').classList.remove('open'); }
