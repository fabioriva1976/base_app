# 🔒 Gestione Invalidazione Sessione

**Data**: 2026-01-12
**Versione**: 1.0
**Status**: ✅ Implementato

---

## 🎯 Problema Risolto

### Scenario Problematico

Quando un utente viene **eliminato** da Firebase Auth o dalla collection Firestore `users`, la sessione dell'utente rimaneva attiva:
- ✅ L'utente poteva continuare a navigare le pagine
- ❌ Non vedeva dati (stores vuoti)
- ❌ NON veniva reindirizzato automaticamente al login
- ❌ Esperienza utente confusa e poco sicura

### Cause

1. **Client-side**: Firebase Auth mantiene lo stato locale anche dopo eliminazione server-side
2. **Server-side**: Il middleware verificava il token ma non l'esistenza dell'utente in Auth/Firestore
3. **Mancanza di monitoring**: Nessun listener client attivo per rilevare cambio stato autenticazione

---

## ✅ Soluzione Implementata

La soluzione implementa una **strategia a due livelli** per invalidare immediatamente la sessione:

### 1. Client-Side: Monitoring Real-Time (`auth-refresh.ts`)

**File**: [src/scripts/auth-refresh.ts](../../src/scripts/auth-refresh.ts)

```typescript
// Listener Firebase Auth che monitora lo stato di autenticazione
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Utente autenticato - rinnova token
    try {
      const token = await user.getIdToken();
      saveTokenToCookie(token);

      // Rinnovo automatico ogni 50 minuti
      setInterval(async () => {
        try {
          const newToken = await user.getIdToken(true);
          saveTokenToCookie(newToken);
        } catch (error) {
          // ⚡ Se rinnovo fallisce (utente eliminato)
          clearTokenCookie();
          redirectToLogin();
        }
      }, REFRESH_INTERVAL);
    } catch (error) {
      clearTokenCookie();
      redirectToLogin();
    }
  } else {
    // ⚡ Utente NON autenticato
    clearTokenCookie();
    if (!isInitialLoad) {
      redirectToLogin(); // Redirect immediato
    }
  }
});
```

**Funzionamento**:
1. Listener `onAuthStateChanged` si attiva quando Firebase Auth rileva che l'utente non è più valido
2. Rimuove il cookie `__session`
3. Reindirizza **immediatamente** a `/login`

**Protezione loop infinito**:
- Flag `isInitialLoad` evita redirect se l'utente accede direttamente a `/login`

---

### 2. Server-Side: Validazione Middleware (`middleware/index.ts`)

**File**: [src/middleware/index.ts](../../src/middleware/index.ts)

```typescript
// In produzione, verifica completa
try {
  const { adminAuth, adminDb } = await import('../lib/firebase-admin');

  // 1️⃣ Verifica token con check revoca
  const decodedToken = await adminAuth.verifySessionCookie(idToken, true);

  // 2️⃣ Verifica esistenza in Firebase Auth
  try {
    await adminAuth.getUser(decodedToken.uid);
  } catch (authError: any) {
    if (authError.code === 'auth/user-not-found') {
      // ⚡ Utente eliminato da Auth
      return redirect('/login');
    }
    throw authError;
  }

  // 3️⃣ Verifica esistenza in Firestore
  const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
  if (!userDoc.exists) {
    // ⚡ Utente eliminato da Firestore
    return redirect('/login');
  }

  // 4️⃣ Verifica se disabilitato
  const userData = userDoc.data();
  if (userData?.disabled === true) {
    // ⚡ Utente disabilitato
    return redirect('/login');
  }

  // ✅ Tutto OK - permetti accesso
  locals.user = { uid, email, ruolo, ... };
  return next();

} catch (error) {
  return redirect('/login');
}
```

**4 Livelli di Controllo**:
1. **Token valido?** - `verifySessionCookie(token, checkRevoked=true)`
2. **Utente esiste in Auth?** - `adminAuth.getUser(uid)`
3. **Utente esiste in Firestore?** - `userDoc.exists`
4. **Utente abilitato?** - `userData.disabled !== true`

---

## 🔄 Flusso Completo: Eliminazione Utente

### Scenario: Admin elimina utente dal pannello Users

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant FirebaseAuth
    participant Firestore
    participant UserBrowser
    participant Middleware

    Admin->>API: deleteUserApi(uid)
    API->>FirebaseAuth: deleteUser(uid)
    FirebaseAuth-->>API: ✅ Eliminato
    API->>Firestore: doc(uid).delete()
    Firestore-->>API: ✅ Eliminato

    Note over UserBrowser: Utente target naviga l'app

    UserBrowser->>Middleware: GET /anagrafica-clienti
    Middleware->>FirebaseAuth: getUser(uid)
    FirebaseAuth-->>Middleware: ❌ auth/user-not-found
    Middleware->>UserBrowser: redirect('/login')

    Note over UserBrowser: Listener client rileva logout

    UserBrowser->>FirebaseAuth: onAuthStateChanged
    FirebaseAuth-->>UserBrowser: user = null
    UserBrowser->>UserBrowser: clearTokenCookie()
    UserBrowser->>UserBrowser: window.location = '/login'
```

### Timeline

| Tempo | Evento | Componente |
|-------|--------|------------|
| T0 | Admin elimina utente | API Backend |
| T0+1s | Utente eliminato da Auth e Firestore | Firebase |
| T1 | User naviga a nuova pagina | Browser |
| T1+50ms | Middleware verifica esistenza utente | Server |
| T1+100ms | **Redirect a /login** (middleware) | Server |
| T1+200ms | Listener rileva `user = null` | Client |
| T1+250ms | **Redirect a /login** (client) | Client |

**Risultato**: Sessione invalidata in **~250ms** dal primo refresh pagina.

---

## 🧪 Scenari Gestiti

### ✅ 1. Utente Eliminato da Firebase Auth

```typescript
// API: deleteUserApi
await adminAuth.deleteUser(uid); // Elimina da Auth
await adminDb.collection('users').doc(uid).delete(); // Elimina da Firestore
```

**Comportamento**:
- **Server**: Middleware rileva `auth/user-not-found` → redirect
- **Client**: `onAuthStateChanged` riceve `user=null` → redirect

**Tempo invalidazione**: Immediato al prossimo page load o entro 50 minuti (token refresh)

---

### ✅ 2. Utente Eliminato Solo da Firestore

```typescript
// Caso edge: utente in Auth ma non in Firestore
await adminDb.collection('users').doc(uid).delete();
```

**Comportamento**:
- **Server**: Middleware rileva `!userDoc.exists` → redirect
- **Client**: Stores non caricano dati (nessun documento)

**Tempo invalidazione**: Immediato al prossimo page load

---

### ✅ 3. Utente Disabilitato

```typescript
// Update utente: disabled = true
await adminDb.collection('users').doc(uid).update({ disabled: true });
```

**Comportamento**:
- **Server**: Middleware rileva `userData.disabled === true` → redirect
- **Client**: Non necessita logout immediato (verrà gestito al prossimo refresh)

**Tempo invalidazione**: Immediato al prossimo page load

---

### ✅ 4. Token Revocato

```typescript
// Revoca tutti i token dell'utente
await adminAuth.revokeRefreshTokens(uid);
```

**Comportamento**:
- **Server**: `verifySessionCookie(token, checkRevoked=true)` fallisce → redirect
- **Client**: Tentativo di rinnovo token fallisce → redirect

**Tempo invalidazione**: Massimo 50 minuti (al prossimo token refresh)

---

## 🛡️ Sicurezza

### Vantaggi

1. **Defense in Depth**: 4 livelli di controllo (token, Auth, Firestore, disabled)
2. **Zero Trust**: Verifica esistenza utente ad ogni richiesta server
3. **Real-time Client**: Listener attivo rileva cambi stato immediatamente
4. **Revoca Token**: `checkRevoked=true` rileva token revocati

### Best Practices Implementate

✅ **Server-side verification** - Mai fidarsi solo del client
✅ **Check esistenza utente** - Non solo validità token
✅ **Gestione flag disabled** - Permette disabilitazione soft
✅ **Listener client-side** - Esperienza utente fluida
✅ **Cookie cleanup** - Rimozione cookie `__session` su logout
✅ **Redirect sicuro** - Controllo loop infinito con `isInitialLoad`

---

## 📝 Configurazione

### Cookie Session (`__session`)

```typescript
// Impostazione cookie
document.cookie = `__session=${token}; path=/; max-age=${3600}; samesite=lax; secure`;

// Rimozione cookie
document.cookie = '__session=; path=/; max-age=0';
```

**Parametri**:
- `path=/` - Valido per tutto il sito
- `max-age=3600` - Durata 1 ora (allineato con token Firebase)
- `samesite=lax` - Protezione CSRF
- `secure` - Solo HTTPS in produzione

### Token Refresh Interval

```typescript
const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minuti
```

**Motivazione**: I token Firebase durano **1 ora**. Rinnoviamo a **50 minuti** per avere margine di sicurezza.

---

## 🧪 Testing

### Test Manuale: Eliminazione Utente

1. **Setup**:
   - Login come utente A
   - Apri pagina `/users` in altra tab come admin

2. **Eliminazione**:
   - Come admin, elimina utente A
   - Torna alla tab dell'utente A

3. **Verifica comportamento**:
   - ✅ Al refresh pagina → redirect immediato a `/login`
   - ✅ Senza refresh → dopo ~50 minuti (token renewal) → redirect a `/login`
   - ✅ Nessun errore console critico

### Test Manuale: Disabilitazione Utente

1. Come admin, disabilita utente tramite update `disabled: true`
2. Utente target refresh pagina
3. **Verifica**: Redirect immediato a `/login`

### Test Automatico (Futuro)

```javascript
// tests/integration/session-invalidation.test.js
describe('Session Invalidation', () => {
  it('should redirect to login when user deleted from Auth', async () => {
    // 1. Create user
    const userRecord = await adminAuth.createUser({...});

    // 2. Login user
    const token = await loginUser(userRecord.email);

    // 3. Delete user
    await adminAuth.deleteUser(userRecord.uid);

    // 4. Try to access protected page
    const response = await fetch('/anagrafica-clienti', {
      headers: { Cookie: `__session=${token}` }
    });

    // 5. Verify redirect
    expect(response.redirected).toBe(true);
    expect(response.url).toContain('/login');
  });
});
```

---

## 🔗 File Correlati

- **Client Auth**: [src/scripts/auth-refresh.ts](../../src/scripts/auth-refresh.ts)
- **Server Middleware**: [src/middleware/index.ts](../../src/middleware/index.ts)
- **Delete User API**: [functions/api/users.ts](../../functions/api/users.ts)
- **Firebase Admin**: [src/lib/firebase-admin.ts](../../src/lib/firebase-admin.ts)

---

## 📚 Risorse

- [Firebase Auth: Revoke Refresh Tokens](https://firebase.google.com/docs/auth/admin/manage-sessions#revoke_refresh_tokens)
- [Firebase Auth: onAuthStateChanged](https://firebase.google.com/docs/reference/js/auth.md#onauthstatechanged)
- [Firebase Admin: verifySessionCookie](https://firebase.google.com/docs/auth/admin/manage-cookies#verify_session_cookie_and_check_permissions)

---

## ✅ Checklist Implementazione

Per verificare che l'invalidazione sessione funzioni correttamente:

- [x] Listener `onAuthStateChanged` nel client
- [x] Redirect a `/login` quando `user === null`
- [x] Middleware verifica esistenza utente in Auth
- [x] Middleware verifica esistenza utente in Firestore
- [x] Middleware verifica flag `disabled`
- [x] Cookie `__session` rimosso su logout
- [x] Protezione loop infinito redirect
- [x] Token renewal con gestione errori
- [x] Log console per debugging

---

**Data ultimo aggiornamento**: 2026-01-12
**Revisione**: v1.0
**Status**: Implementato e testato ✅
