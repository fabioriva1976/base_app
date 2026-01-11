# Server-Side Validation

## Problema Risolto

Le validazioni solo client-side sono bypassabili e non garantiscono sicurezza o coerenza dei dati.
In questo progetto **tutte le operazioni di scrittura** passano da Cloud Functions con controlli di autorizzazione e validazione.

## Soluzione Implementata

**Defense in Depth** con tre layer:

1. **Firestore Rules**: blocca accessi non autorizzati
2. **Cloud Functions**: valida e applica business rules
3. **Client UX**: controlli rapidi per migliorare l'esperienza

## Esempio Reale (Clienti)

### Backend: `functions/api/clienti.js`

```javascript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { requireAdmin } from "../utils/authHelpers.js";
import { createCliente } from "../../shared/schemas/entityFactory.js";

function validateClienteData(data) {
  if (!data.ragione_sociale) {
    throw new HttpsError('invalid-argument', 'La ragione sociale e obbligatoria.');
  }
  if (!data.codice) {
    throw new HttpsError('invalid-argument', 'Il codice cliente e obbligatorio.');
  }
}

export const createClienteApi = onCall(async (request) => {
  await requireAdmin(request);
  validateClienteData(request.data);

  const cliente = createCliente({
    ...request.data,
    createdBy: request.auth.uid,
    createdByEmail: request.auth.token.email
  });

  // Salvataggio + audit log
  // ...

  return { id: docRef.id, ...cliente };
});
```

### Frontend: `src/scripts/anagrafica-clienti.js`

```javascript
import { httpsCallable } from 'firebase/functions';

const createApi = httpsCallable(functions, 'createClienteApi');
await createApi(payloadToSend);
```

## Regole di Base

- **Nessuna scrittura diretta** dal client su collection protette
- **Usa sempre le factory** (`shared/schemas/entityFactory.js`) per creare dati
- **Permessi** definiti da helper (`requireAdmin`, `requireSuperUser`)
- **Audit log** obbligatorio per create/update/delete

## Dove Applicare

- Entita CRUD: `functions/api/*.js`
- Settings: `functions/api/settings-*.js`
- Upload/Note: `functions/api/attachments.js`, `functions/api/comments.js`

## Checklist AI

- Ho usato una Cloud Function per la scrittura?
- Ho validato input e permessi?
- Ho usato la factory condivisa?
- Ho scritto l'audit log?
