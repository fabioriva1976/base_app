import { storage, auth, functions } from '../lib/firebase-client';
import { getFirestore } from "firebase/firestore";
import * as ui from './utils/uiUtils.ts';
import * as attachmentUtils from './utils/attachmentUtils.ts';
import * as actionUtils from './utils/actionUtils.ts';
import * as commentUtils from './utils/commentUtils.ts';
import { httpsCallable } from "firebase/functions";
import { create__ENTITY_PASCAL__ } from './schemas/entityFactory.ts';
import { __ENTITA_CAMEL__Store, init__ENTITA_PASCAL__Listener, stop__ENTITA_PASCAL__Listener } from '../stores/__ENTITA_CAMEL__Store.ts';

let entities = [];
const collection_name = '__ENTITA_SNAKE__';
let currentEntityId = null;
let dataTable = null;
let unsubscribeStore = null;

export function init__ENTITA_PASCAL__Page() {
  const db = getFirestore();
  attachmentUtils.setup({ db, storage, auth, functions, entityCollection: collection_name });
  actionUtils.setup({ db, auth, functions, entityCollection: collection_name });
  commentUtils.setup({ db, auth, functions, entityCollection: collection_name });
  setupEventListeners();

  init__ENTITA_PASCAL__Listener();

  unsubscribeStore = __ENTITA_CAMEL__Store.subscribe((items) => {
    entities = items;
    renderTable();
  });
}

export function cleanup__ENTITA_PASCAL__Page() {
  if (unsubscribeStore) {
    unsubscribeStore();
    unsubscribeStore = null;
  }
  stop__ENTITA_PASCAL__Listener();
}

function setupEventListeners() {
  document.getElementById('new-entity-btn').addEventListener('click', () => {
    document.getElementById('entity-form').reset();
    document.getElementById('entity-form-title').textContent = 'Nuovo __ENTITY_LABEL__';
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
  const tableData = entities.map(e => [
    e.codice || 'N/D',
    e.nome || 'N/D',
    ui.formatTableActionElement(e.id)
  ]);

  if (dataTable) dataTable.destroy();

  dataTable = new simpleDatatables.DataTable('#data-table', {
    data: {
      headings: ['Codice', 'Nome', 'Azioni'],
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
    nome: document.getElementById('nome').value,
    status: document.getElementById('toggle-stato').checked
  };

  let normalized;
  try {
    normalized = create__ENTITY_PASCAL__({
      ...payload,
      codice: payload.codice || null,
      nome: payload.nome || null
    });
  } catch (err) {
    showSaveMessage('save-message', err.message || 'Dati non validi', true);
    return;
  }
  const { createdAt, updatedAt, createdBy, createdByEmail, ...payloadToSend } = normalized;

  const saveBtn = document.querySelector('button[type="submit"][form="entity-form"]');
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="btn-loader"></span>Salvataggio...';

  try {
    if (isNew) {
      const createApi = httpsCallable(functions, 'create__ENTITY_PASCAL__Api');
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
      const updateApi = httpsCallable(functions, 'update__ENTITY_PASCAL__Api');
      await updateApi({ id: currentEntityId, ...payloadToSend });
    }

    showSaveMessage('save-message');
  } catch (error) {
    console.error('Errore nel salvataggio:', error);
    showSaveMessage('save-message', 'Errore: ' + (error.message || 'Impossibile salvare'), true);
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
  document.getElementById('entity-form-title').textContent = data.nome || '__ENTITY_LABEL__';
  document.getElementById('entity-id').value = id;
  document.getElementById('codice').value = data.codice || '';
  document.getElementById('nome').value = data.nome || '';
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
    const deleteApi = httpsCallable(functions, 'delete__ENTITY_PASCAL__Api');
    await deleteApi({ id: id });
  } catch (error) {
    console.error('Errore nell\'eliminare:', error);
    alert('Errore: ' + (error.message || 'Impossibile eliminare'));
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
        <button class="btn btn-sm btn-light btn-confirm-yes" data-id="${deleteButton.dataset.id}">Si</button>
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
