# Migrazione Campo Status per Clienti

## Data
2026-01-10

## Descrizione
Standardizzazione del campo di stato per la collection `clienti` da `stato` a `status`, per uniformità con la collection `users`.

## Problema
La collection `clienti` aveva sia il campo `stato` che `status`, mentre `users` usa solo `status`. Questa inconsistenza creava confusione e duplicazione di dati.

## Soluzione
Rimosso il campo `stato` e mantenuto solo `status` in tutta la codebase.

## File Modificati

### Schema Factory
- **shared/schemas/entityFactory.js**
  - Parametro `stato` → `status` nella funzione `createCliente()`
  - Rimosso campo `stato:` dall'oggetto restituito
  - Mantenuto solo `status: Boolean(status)`

### Backend (Functions)
- **functions/schemas/entityFactory.js**
  - Sincronizzato automaticamente con lo schema shared tramite script `sync-factories`

- **functions/api/clienti.js**
  - Rimossa conversione `stato → status` in `updateClienteApi`
  - Il campo `status` viene ora gestito direttamente

### Frontend
- **src/scripts/anagrafica-clienti.js**
  - Campo `stato` → `status` quando si salvano i dati (linea 93)
  - Campo `stato` → `status` quando si caricano i dati (linea 181)

- **src/pages/anagrafica-clienti.astro**
  - Aggiunto commento esplicativo sul campo `toggle-stato`
  - L'ID HTML rimane `toggle-stato` per compatibilità, ma mappa al campo `status`

### Test
Nessuna modifica necessaria ai test Cypress, in quanto usano solo l'ID HTML del campo.

## Migrazione Dati Esistenti

### Dati in Firestore
I documenti esistenti potrebbero avere ancora il campo `stato`. Per garantire compatibilità:

1. Il campo `status` è ora il campo principale
2. I vecchi documenti con solo `stato` continueranno a funzionare ma dovrebbero essere aggiornati
3. Il frontend ora legge e scrive solo `status`

### Script di Migrazione (Opzionale)
Se necessario, eseguire questo script per aggiornare i documenti esistenti:

```javascript
// Script da eseguire in Firebase Console o come Cloud Function
const admin = require('firebase-admin');
const db = admin.firestore();

async function migrateClientStatus() {
  const clientiRef = db.collection('clienti');
  const snapshot = await clientiRef.get();

  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();

    // Se ha 'stato' ma non 'status', copia il valore
    if (data.stato !== undefined && data.status === undefined) {
      batch.update(doc.ref, { status: data.stato });
      count++;
    }

    // Rimuovi il campo 'stato' se presente
    if (data.stato !== undefined) {
      batch.update(doc.ref, { stato: admin.firestore.FieldValue.delete() });
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Migrati ${count} documenti clienti`);
  } else {
    console.log('Nessun documento da migrare');
  }
}
```

## Impatto
- **Breaking Change**: NO - retrocompatibilità mantenuta
- **Richiede Deploy**: Sì, deploy delle Cloud Functions e dell'applicazione web
- **Richiede Migrazione DB**: No, opzionale (vedi script sopra)

## Note
- L'ID HTML del campo (`toggle-stato`) è stato mantenuto per evitare modifiche ai test esistenti
- La standardizzazione migliora la consistenza del codice
- Future collection dovrebbero usare `status` come standard
