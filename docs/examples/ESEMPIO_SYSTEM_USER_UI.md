# 🎨 Esempio: Visualizzazione Operazioni Sistema nell'UI

Questo documento mostra esempi pratici di come usare i nuovi helper per distinguere visivamente operazioni manuali da operazioni automatiche.

---

## 📊 Esempio 1: Tabella Lista Clienti

### HTML Template (anagrafica-clienti.astro)

```html
<table class="data-table">
  <thead>
    <tr>
      <th>Ragione Sociale</th>
      <th>Codice</th>
      <th>Email</th>
      <th>Creato da</th>
      <th>Data creazione</th>
      <th>Ultima modifica</th>
      <th>Azioni</th>
    </tr>
  </thead>
  <tbody id="clienti-list">
    <!-- Popolato via JavaScript -->
  </tbody>
</table>
```

### JavaScript (anagrafica-clienti.js)

```javascript
import { clientiStore } from './stores/clientiStore.js';
import { getAuditInfo } from './utils/systemUserHelper.js';
import { formatDate } from './utils/formatters.js';

function renderClientiTable() {
  const clienti = clientiStore.get();
  const tbody = document.getElementById('clienti-list');

  tbody.innerHTML = clienti.map(cliente => {
    const audit = getAuditInfo(cliente);

    return `
      <tr class="${audit.isSystemCreated ? 'system-row' : ''}">
        <td>
          ${cliente.ragione_sociale}
          ${audit.isSystemCreated ? '<span class="badge badge-auto">Auto</span>' : ''}
        </td>
        <td>${cliente.codice}</td>
        <td>${cliente.email || '-'}</td>
        <td class="${audit.creatorClass}">
          ${audit.isSystemCreated ? '🤖' : '👤'} ${audit.createdBy}
        </td>
        <td>${formatDate(cliente.created)}</td>
        <td class="${audit.modifierClass}">
          <div>
            ${audit.isSystemModified ? '🤖' : '👤'} ${audit.modifiedBy}
          </div>
          <small class="text-muted">${formatDate(cliente.changed)}</small>
        </td>
        <td>
          <button onclick="editCliente('${cliente.id}')">Modifica</button>
          <button onclick="deleteCliente('${cliente.id}')">Elimina</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Listener real-time
clientiStore.subscribe(renderClientiTable);
```

### CSS Styling

```css
/* Riga tabella creata dal sistema */
.system-row {
  background-color: #f8f9ff;
}

/* Badge per operazioni automatiche */
.badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.75rem;
  border-radius: 4px;
  font-weight: 500;
  margin-left: 6px;
}

.badge-auto {
  background: #e0e7ff;
  color: #4338ca;
}

/* Campi audit creati dal sistema */
.system-created,
.system-modified {
  color: #6366f1;
  font-style: italic;
}

/* Campi audit creati da utenti */
.user-created,
.user-modified {
  color: #374151;
}

/* Icone per tipo operazione */
td .text-muted {
  color: #9ca3af;
  font-size: 0.875rem;
}
```

### Risultato Visivo

```
┌───────────────────┬────────┬─────────────────┬─────────────────────────┬──────────────┬─────────────────────────┐
│ Ragione Sociale   │ Codice │ Email           │ Creato da               │ Data         │ Ultima modifica         │
├───────────────────┼────────┼─────────────────┼─────────────────────────┼──────────────┼─────────────────────────┤
│ Acme Corp         │ ACM001 │ info@acme.com   │ 👤 admin@example.com    │ 12/01/2024   │ 👤 admin@example.com    │
│                   │        │                 │                         │              │ 12/01/2024 10:30        │
├───────────────────┼────────┼─────────────────┼─────────────────────────┼──────────────┼─────────────────────────┤
│ Auto Import Corp  │ AI002  │ auto@import.it  │ 🤖 Sistema Automatico   │ 12/01/2024   │ 👤 admin@example.com    │
│ [Auto]            │        │                 │                         │              │ 13/01/2024 14:20        │
└───────────────────┴────────┴─────────────────┴─────────────────────────┴──────────────┴─────────────────────────┘
```

---

## 🗂️ Esempio 2: Sidebar Dettaglio Cliente

### HTML Template

```html
<aside id="sidebar-right" class="sidebar-right">
  <div class="sidebar-header">
    <h2 id="sidebar-title">Dettaglio Cliente</h2>
    <button id="close-sidebar">×</button>
  </div>

  <div class="sidebar-content">
    <!-- Tab Audit Info -->
    <div class="tab-content" id="tab-audit">
      <h3>📋 Informazioni Audit</h3>
      <div id="audit-info-section">
        <!-- Popolato via JavaScript -->
      </div>
    </div>
  </div>
</aside>
```

### JavaScript

```javascript
import { getAuditInfo } from './utils/systemUserHelper.js';
import { formatDate } from './utils/formatters.js';

function renderAuditInfo(entity) {
  const audit = getAuditInfo(entity);
  const section = document.getElementById('audit-info-section');

  section.innerHTML = `
    <div class="audit-card">
      <div class="audit-row">
        <span class="audit-label">Creato da:</span>
        <span class="${audit.creatorClass}">
          ${audit.isSystemCreated ? '🤖' : '👤'} ${audit.createdBy}
          ${audit.isSystemCreated ? '<span class="badge badge-system">Automatico</span>' : ''}
        </span>
      </div>
      <div class="audit-row">
        <span class="audit-label">Data creazione:</span>
        <span>${formatDate(entity.created)}</span>
      </div>

      <div class="audit-divider"></div>

      <div class="audit-row">
        <span class="audit-label">Ultima modifica:</span>
        <span class="${audit.modifierClass}">
          ${audit.isSystemModified ? '🤖' : '👤'} ${audit.modifiedBy}
        </span>
      </div>
      <div class="audit-row">
        <span class="audit-label">Data modifica:</span>
        <span>${formatDate(entity.changed)}</span>
      </div>

      ${renderAuditWarning(audit)}
    </div>
  `;
}

function renderAuditWarning(audit) {
  if (!audit.isSystemCreated && !audit.isSystemModified) {
    return '';
  }

  const warnings = [];
  if (audit.isSystemCreated) {
    warnings.push('Questo elemento è stato creato automaticamente dal sistema.');
  }
  if (audit.isSystemModified && !audit.isSystemCreated) {
    warnings.push('L\'ultima modifica è stata eseguita automaticamente dal sistema.');
  }

  return `
    <div class="audit-warning">
      <span class="warning-icon">ℹ️</span>
      <div class="warning-text">
        ${warnings.join(' ')}
      </div>
    </div>
  `;
}
```

### CSS

```css
.audit-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.audit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.audit-label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
}

.audit-divider {
  border-top: 1px solid #e5e7eb;
  margin: 12px 0;
}

.badge-system {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 8px;
}

.audit-warning {
  display: flex;
  gap: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 12px;
  margin-top: 16px;
}

.warning-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.warning-text {
  font-size: 0.875rem;
  color: #78350f;
  line-height: 1.5;
}
```

---

## 🔍 Esempio 3: Filtro per Tipo Operazione

### HTML Template

```html
<div class="filters-bar">
  <div class="filter-group">
    <label for="operation-filter">Mostra:</label>
    <select id="operation-filter" class="filter-select">
      <option value="all">Tutte le operazioni</option>
      <option value="user">Solo operazioni manuali</option>
      <option value="system">Solo operazioni automatiche</option>
    </select>
  </div>

  <div class="filter-stats">
    <span id="total-count">0</span> clienti
    (<span id="system-count">0</span> automatici, <span id="user-count">0</span> manuali)
  </div>
</div>
```

### JavaScript

```javascript
import { clientiStore } from './stores/clientiStore.js';
import { isSystemCreated } from './utils/systemUserHelper.js';

let currentFilter = 'all';

function setupFilters() {
  const filterSelect = document.getElementById('operation-filter');
  filterSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderFilteredClienti();
  });
}

function renderFilteredClienti() {
  const allClienti = clientiStore.get();

  // Filtra in base al tipo operazione
  const filteredClienti = allClienti.filter(cliente => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'user') return !isSystemCreated(cliente);
    if (currentFilter === 'system') return isSystemCreated(cliente);
    return true;
  });

  // Aggiorna statistiche
  const systemCount = allClienti.filter(isSystemCreated).length;
  const userCount = allClienti.length - systemCount;

  document.getElementById('total-count').textContent = allClienti.length;
  document.getElementById('system-count').textContent = systemCount;
  document.getElementById('user-count').textContent = userCount;

  // Renderizza tabella filtrata
  renderClientiTable(filteredClienti);
}

// Listener real-time
clientiStore.subscribe(renderFilteredClienti);
```

---

## 📈 Esempio 4: Dashboard Statistiche

### HTML Template

```html
<div class="dashboard-stats">
  <div class="stat-card">
    <div class="stat-icon">👤</div>
    <div class="stat-content">
      <div class="stat-value" id="manual-operations">0</div>
      <div class="stat-label">Operazioni Manuali</div>
    </div>
  </div>

  <div class="stat-card">
    <div class="stat-icon">🤖</div>
    <div class="stat-content">
      <div class="stat-value" id="auto-operations">0</div>
      <div class="stat-label">Operazioni Automatiche</div>
    </div>
  </div>

  <div class="stat-card">
    <div class="stat-icon">📊</div>
    <div class="stat-content">
      <div class="stat-value" id="auto-percentage">0%</div>
      <div class="stat-label">% Automatizzazione</div>
    </div>
  </div>
</div>
```

### JavaScript

```javascript
import { clientiStore } from './stores/clientiStore.js';
import { isSystemCreated } from './utils/systemUserHelper.js';

function updateDashboardStats() {
  const clienti = clientiStore.get();

  const systemCount = clienti.filter(isSystemCreated).length;
  const userCount = clienti.length - systemCount;
  const autoPercentage = clienti.length > 0
    ? Math.round((systemCount / clienti.length) * 100)
    : 0;

  document.getElementById('manual-operations').textContent = userCount;
  document.getElementById('auto-operations').textContent = systemCount;
  document.getElementById('auto-percentage').textContent = `${autoPercentage}%`;
}

// Listener real-time
clientiStore.subscribe(updateDashboardStats);
```

### CSS

```css
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 2rem;
  background: #f3f4f6;
  padding: 12px;
  border-radius: 50%;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 4px;
}
```

---

## 🎯 Esempio 5: Toast Notification

### JavaScript

```javascript
import { getCreatorDisplayName } from './utils/systemUserHelper.js';

function showCreatedNotification(entity) {
  const creator = getCreatorDisplayName(entity);

  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.innerHTML = `
    <span class="toast-icon">✅</span>
    <div class="toast-content">
      <div class="toast-title">Cliente creato</div>
      <div class="toast-message">Creato da: ${creator}</div>
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-show');
  }, 100);

  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

### CSS

```css
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  align-items: start;
  gap: 12px;
  min-width: 300px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
  z-index: 1000;
}

.toast-show {
  opacity: 1;
  transform: translateY(0);
}

.toast-icon {
  font-size: 1.5rem;
}

.toast-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 0.875rem;
  color: #6b7280;
}
```

---

## 📝 Best Practices

### ✅ DO

1. **Usa sempre gli helper** invece di controllare manualmente i campi
2. **Mostra icone visive** (🤖 per sistema, 👤 per utenti)
3. **Applica stili diversi** per operazioni sistema vs utente
4. **Aggiungi tooltip** con info aggiuntive sull'operazione
5. **Fornisci filtri** per visualizzare solo un tipo di operazione

### ❌ DON'T

1. **Non controllare direttamente** `entity.createdBy === 'SYSTEM'`
2. **Non nascondere** le info di sistema - è tracciamento importante
3. **Non usare colori allarmanti** per sistema (giallo/rosso) - usa blu/viola neutri
4. **Non dimenticare accessibilità** - icone devono avere aria-label

---

## 🚀 Integrazione Rapida

Per aggiungere tracking operazioni sistema a una pagina esistente:

1. **Import helper**:
   ```javascript
   import { getAuditInfo } from './utils/systemUserHelper.js';
   ```

2. **Usa nei render**:
   ```javascript
   const audit = getAuditInfo(entity);
   ```

3. **Aggiungi CSS** dal file sopra

4. **Testa** con dati sistema e utente

---

## 📚 Risorse

- **Helper completo**: [src/scripts/utils/systemUserHelper.js](../../src/scripts/utils/systemUserHelper.js)
- **Guida tecnica**: [docs/architecture/SYSTEM_USER.md](../architecture/SYSTEM_USER.md)
- **Factory**: [shared/schemas/entityFactory.js](../../shared/schemas/entityFactory.js)
