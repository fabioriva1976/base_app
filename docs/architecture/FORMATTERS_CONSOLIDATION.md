# Formatters Consolidation

## Problema Risolto

Prima avevamo **funzioni di utility duplicate** sparse in più file:
- [/src/scripts/page-documenti.js](../src/scripts/page-documenti.js) - `formatFileSize()`, `formatDate()`, `formatTags()`
- [/src/scripts/page-record.js](../src/scripts/page-record.js) - `formatFileSize()`, `formatDate()`
- [/src/scripts/page-record.js](../src/scripts/page-record.js) - `formatDate()`

Questo causava:
- ❌ Duplicazione del codice (DRY violation)
- ❌ Implementazioni inconsistenti tra file diversi
- ❌ Difficoltà di manutenzione (fix da replicare in più posti)
- ❌ Comportamenti diversi della stessa funzione in contesti diversi

### Inconsistenze Trovate

**`formatFileSize()`:**
- `page-documenti.js`: Usava logica if/else per calcolare i tagli
- `page-record.js`: Usava logaritmi (più efficiente e preciso)

**`formatDate()`:**
- `page-documenti.js`: Formato semplice solo data (gg/mm/aaaa)
- `page-record.js`: Formato con ora quando include tempo
- `page-record.js`: Formato relativo (Oggi, Ieri, X giorni fa)

## Soluzione Implementata

### Architettura

```
src/scripts/utils/formatters.js  ← UNICA FONTE DI VERITÀ
           ↓
    [import da ogni file]
           ↓
page-documenti.js, page-record.js, page-record.js
```

### File Coinvolto

**[/src/scripts/utils/formatters.js](../src/scripts/utils/formatters.js)** - NEW FILE (173 lines)
- Contiene tutte le utility functions condivise
- Esportate come ES6 modules (`export function`)
- Funzioni con parametri opzionali per flessibilità
- Documentate con JSDoc

## Funzioni Disponibili

### `formatFileSize(bytes)`
Formatta dimensione file in modo human-readable.

**Parametri:**
- `bytes` (number) - Dimensione in bytes

**Ritorna:** `string` (es. "1.5 MB", "234 KB")

**Esempio:**
```javascript
import { formatFileSize } from './utils/formatters.js';
formatFileSize(1536000); // "1.46 MB"
```

### `formatDate(timestamp, options)`
Formatta data/timestamp con diverse opzioni.

**Parametri:**
- `timestamp` (Timestamp|Date|string) - Data da formattare
- `options.relative` (boolean) - Usa formato relativo (Oggi, Ieri, X giorni fa)
- `options.emptyText` (string) - Testo per valori vuoti (default: "N/D")
- `options.includeTime` (boolean) - Includi orario (default: false)

**Esempi:**
```javascript
import { formatDate } from './utils/formatters.js';

// Formato standard
formatDate(myDate); // "05/01/2026"

// Con orario
formatDate(myDate, { includeTime: true }); // "05/01/2026 14:30"

// Relativo
formatDate(myDate, { relative: true }); // "2 giorni fa" o "Oggi 14:30"

// Personalizzato per campi vuoti
formatDate(null, { emptyText: '' }); // ""
```

### `formatTags(tags, options)`
Renderizza array di tag come HTML badges.

**Parametri:**
- `tags` (Array<string>) - Array di tag
- `options.maxVisible` (number) - Numero massimo di tag visibili (default: 3)
- `options.tagClass` (string) - Classe CSS custom per i tag
- `options.emptyText` (string) - Testo per array vuoto

**Esempio:**
```javascript
import { formatTags } from './utils/formatters.js';
formatTags(['contratto', 'decreto']);
// <span class="tag">contratto</span>...
```

### `truncateText(text, maxLength, suffix)`
Tronca testo lungo con ellipsis.

**Esempio:**
```javascript
import { truncateText } from './utils/formatters.js';
truncateText('Testo molto lungo...', 20); // "Testo molto lungo..."
```

### `formatNumber(num, decimals, locale)`
Formatta numero con separatori migliaia.

### `formatCurrency(amount, currency, locale)`
Formatta valuta con simbolo.

### `formatRelativeTime(date)`
Calcola e formatta tempo relativo (usata internamente da `formatDate`).

## Come Usare

### Importare le Funzioni

```javascript
// Importa solo quello che ti serve
import { formatDate, formatFileSize } from './utils/formatters.js';

// Oppure importa tutto
import * as formatters from './utils/formatters.js';
```

### Usare nei File

**page-documenti.js:**
```javascript
import { formatFileSize, formatDate, formatTags } from './utils/formatters.js';

// Usa nelle funzioni di rendering
<div>${formatFileSize(doc.size)}</div>
<div>${formatDate(doc.created)}</div>
<div>${formatTags(doc.metadata.tags)}</div>
```

**page-record.js:**
```javascript
import { formatFileSize, formatDate } from './utils/formatters.js';

// Formato con opzioni
formatDate(attachment.uploadedAt, { emptyText: '', includeTime: true })
```

**page-record.js:**
```javascript
import { formatDate } from './utils/formatters.js';

// Formato relativo per tabelle
formatDate(chat.changed, { relative: true })
```

## File Modificati

### ✅ Creato
- [/src/scripts/utils/formatters.js](../src/scripts/utils/formatters.js) - Utility functions centralizzate (173 lines)

### ✅ Aggiornati
- [/src/scripts/page-documenti.js](../src/scripts/page-documenti.js)
  - Aggiunto: `import { formatFileSize, formatDate, formatTags }`
  - Rimosso: 3 funzioni duplicate (~30 lines)

- [/src/scripts/page-record.js](../src/scripts/page-record.js)
  - Aggiunto: `import { formatFileSize, formatDate }`
  - Rimosso: 2 funzioni duplicate (~20 lines)
  - Aggiornato: Usaggi con parametro `options`

- [/src/scripts/page-record.js](../src/scripts/page-record.js)
  - Aggiunto: `import { formatDate }`
  - Rimosso: 1 funzione duplicata (~20 lines)
  - Aggiornato: Usaggio con `{ relative: true }`

## Vantaggi della Soluzione

✅ **Unica Fonte di Verità**: Solo un file da mantenere per le utility
✅ **Comportamento Consistente**: Stessa logica in tutta l'app
✅ **Più Flessibile**: Parametri `options` per personalizzare output
✅ **Meno Codice**: Rimossi ~70 lines di duplicati
✅ **Più Manutenibile**: Fix e miglioramenti in un solo posto
✅ **Meglio Testabile**: Utility functions isolate e testabili
✅ **XSS-Safe**: `formatTags()` usa `textContent` per prevenire injection

## Confronto Prima/Dopo

### Prima (Code Duplication)

```javascript
// page-documenti.js (4 lines)
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    // ... logica con if/else ...
}

// page-record.js (4 lines) - IMPLEMENTAZIONE DIVERSA!
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    // ... logica con logaritmi ...
}
```

**Problema**: Due implementazioni diverse, possibili risultati inconsistenti.

### Dopo (Centralized)

```javascript
// src/scripts/utils/formatters.js
export function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// page-documenti.js
import { formatFileSize } from './utils/formatters.js';

// page-record.js
import { formatFileSize } from './utils/formatters.js';
```

**Soluzione**: Una sola implementazione, comportamento garantito identico.

## Best Practices

### ✅ DO

- Importa solo le funzioni che usi per tree-shaking
- Usa parametro `options` per personalizzare comportamento
- Aggiungi nuove utility in `/src/scripts/utils/formatters.js`
- Documenta nuove funzioni con JSDoc

### ❌ DON'T

- NON creare funzioni di formatting duplicate nei file specifici
- NON modificare il return type delle funzioni esistenti (breaking change)
- NON rimuovere parametri `options` (retrocompatibilità)

## Prossimi Passi (Opzionale)

Per migliorare ulteriormente:

1. **Unit Tests**: Crea test per ogni formatter
   ```javascript
   // tests/formatters.test.js
   import { formatFileSize, formatDate } from '../src/scripts/utils/formatters.js';

   test('formatFileSize converts bytes correctly', () => {
       expect(formatFileSize(1024)).toBe('1 KB');
       expect(formatFileSize(1536000)).toBe('1.46 MB');
   });
   ```

2. **TypeScript**: Aggiungi type definitions
   ```typescript
   export function formatDate(
       timestamp: Timestamp | Date | string,
       options?: {
           relative?: boolean;
           emptyText?: string;
           includeTime?: boolean;
       }
   ): string;
   ```

3. **Internazionalizzazione**: Supporta altre lingue
   ```javascript
   export function formatDate(timestamp, options = {}) {
       const { locale = 'it-IT', ... } = options;
       // ...
   }
   ```

4. **Performance**: Memoizzazione per valori calcolati frequentemente

## Testing

Per verificare che tutto funzioni:

```bash
# Avvia dev server
npm run dev

# Testa le pagine:
# - /page-documenti - Verifica formatFileSize, formatDate, formatTags
# - /page-record - Verifica formatFileSize, formatDate con includeTime
# - /page-record - Verifica formatDate con relative
```

## Troubleshooting

### Le date non vengono formattate correttamente

Verifica che il parametro `options` sia passato correttamente:
```javascript
// ✅ Corretto
formatDate(timestamp, { relative: true })

// ❌ Errato
formatDate(timestamp, true) // Non funziona!
```

### I tag non vengono renderizzati

`formatTags()` ritorna HTML come stringa. Assicurati di usare `innerHTML` o inserirlo in contesto HTML:
```javascript
// ✅ Corretto
element.innerHTML = formatTags(tags);

// ❌ Errato
element.textContent = formatTags(tags); // Mostra i tag HTML come testo
```

### Import error "Cannot find module"

Verifica il path relativo:
```javascript
// Da /src/scripts/page-*.js
import { formatDate } from './utils/formatters.js';

// NON
import { formatDate } from '../utils/formatters.js'; // Path errato
```

## Linee di Codice

### Risparmio Totale

- **Prima**: ~70 lines di codice duplicato
- **Dopo**: 0 lines duplicate, 173 lines nel file centralizzato
- **Risparmio netto**: Eliminati duplicati + maggiore manutenibilità

### Breakdown

| File | Lines Rimossi | Funzioni Rimosse |
|------|---------------|------------------|
| page-documenti.js | ~30 | formatFileSize, formatDate, formatTags |
| page-record.js | ~20 | formatFileSize, formatDate |
| page-record.js | ~20 | formatDate |
| **TOTALE** | **~70** | **6 duplicati** |

## Conclusione

Questa refactoring ha consolidato tutte le utility functions di formatting in un unico file centralizzato, eliminando duplicazioni e inconsistenze. Il codice è ora più manutenibile, testabile e consistente in tutta l'applicazione.
