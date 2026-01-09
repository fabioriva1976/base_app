import { storage, auth, functions } from '../lib/firebase-client';
import { doc, getFirestore } from "firebase/firestore";
import * as ui from './utils/uiUtils.js';
import * as attachmentUtils from './utils/attachmentUtils.js';
import * as actionUtils from './utils/actionUtils.js';
import * as commentUtils from './utils/commentUtils.js';
import { httpsCallable } from "firebase/functions";
import { createCliente } from './schemas/entityFactory.js';

let entities = [];
let collection_name = 'anagrafica_clienti';
let currentEntityId = null;
let dataTable = null;

export function initPageAnagraficaClientiPage() {
    const db = getFirestore();
    attachmentUtils.setup({ db, storage, auth, functions, entityCollection: collection_name });
    actionUtils.setup({ db, auth, functions, entityCollection: collection_name });
    commentUtils.setup({ db, auth, functions, entityCollection: collection_name });
    setupEventListeners();
    loadEntities();
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

async function loadEntities() {
    const listApi = httpsCallable(functions, 'listClientiApi');
    const result = await listApi();
    entities = result.data?.clienti || [];
    renderTable();
}

function renderTable() {
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
}

async function saveEntity(e) {
    e.preventDefault();
    const isNew = !currentEntityId;
    const payload = {
        codice: document.getElementById('codice').value,
        ragione_sociale: document.getElementById('ragione_sociale').value,
        partita_iva: document.getElementById('piva').value,
        codice_fiscale: document.getElementById('cf').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        indirizzo: document.getElementById('indirizzo').value,
        citta: document.getElementById('citta').value,
        cap: document.getElementById('cap').value,
        stato: document.getElementById('toggle-stato').checked
    };
    let normalized;
    try {
        normalized = createCliente({
            ...payload,
            codice: payload.codice || null,
            partita_iva: payload.partita_iva || null,
            codice_fiscale: payload.codice_fiscale || null,
            email: payload.email || null,
            telefono: payload.telefono || null,
            indirizzo: payload.indirizzo || null,
            citta: payload.citta || null,
            cap: payload.cap || null
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
        await loadEntities();
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
    document.getElementById('toggle-stato').checked = data.stato || false;
    
    showTabsForExistingEntity();
    attachmentUtils.listenForAttachments(id);
    actionUtils.loadActions(id);
    commentUtils.listenForComments(id);
    resetToFirstTab('entity-form-sidebar');
    openSidebar();
};

async function deleteEntity(id) {
    const deleteApi = httpsCallable(functions, 'deleteClienteApi');
    await deleteApi({ id: id });
    loadEntities();
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
