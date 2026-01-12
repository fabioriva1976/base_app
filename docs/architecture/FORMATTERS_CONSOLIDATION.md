# Formatters Consolidation

## Obiettivo

Centralizzare le funzioni di formattazione per evitare duplicazione e comportamenti incoerenti.

## Stato Attuale

- **File unico:** `src/scripts/utils/formatters.ts`
- **Uso consigliato:** tutte le nuove UI devono usare queste funzioni

Se una pagina ha bisogno di formattazione, **non creare funzioni inline**.

## Funzioni Disponibili

### `formatFileSize(bytes)`
Formatta dimensioni file in modo leggibile.

### `formatDate(timestamp, options)`
Formatta date con opzioni:
- `relative` (boolean)
- `emptyText` (string)
- `includeTime` (boolean)

### `formatTags(tags, options)`
Renderizza tag con limite e classe custom.

### `truncateText(text, maxLength, suffix)`
Tronca testo lungo con ellipsis.

### `formatNumber(num, decimals, locale)`
Formatta numeri con separatori.

### `formatCurrency(amount, currency, locale)`
Formatta valuta con simbolo.

## Esempio

```javascript
import { formatDate, formatFileSize } from './utils/formatters.ts';

const createdText = formatDate(entity.created, { includeTime: true });
const sizeText = formatFileSize(file.size);
```

## Linee Guida

- **Usa sempre** `formatters.ts` per nuova UI
- **Non duplicare** funzioni simili in script di pagina
- Se serve un nuovo formatter, aggiungilo qui
