// Script per rinnovare automaticamente il token Firebase e gestire logout automatico
import { auth } from '../lib/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';

// Rinnova il token ogni 50 minuti (i token durano 1 ora)
const REFRESH_INTERVAL = 50 * 60 * 1000;

// Flag per evitare redirect multipli durante l'inizializzazione
let isInitialLoad = true;

function saveTokenToCookie(token: string) {
  const expiresIn = 60 * 60; // 1 ora
  document.cookie = `__session=${token}; path=/; max-age=${expiresIn}; samesite=lax; secure`;
}

function clearTokenCookie() {
  document.cookie = '__session=; path=/; max-age=0';
}

function redirectToLogin() {
  // Reindirizza solo se non siamo già nella pagina di login
  if (window.location.pathname !== '/login') {
    console.log('[AUTH] Utente non autenticato - redirect a /login');
    window.location.href = '/login';
  }
}

// Monitora lo stato di autenticazione
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Utente autenticato - ottieni e salva il token
    try {
      const token = await user.getIdToken();
      saveTokenToCookie(token);

      // Imposta il rinnovo automatico
      setInterval(async () => {
        try {
          const newToken = await user.getIdToken(true); // force refresh
          saveTokenToCookie(newToken);
          console.log('[AUTH] Token rinnovato');
        } catch (error) {
          console.error('[AUTH] Errore nel rinnovo del token:', error);
          // Se il rinnovo fallisce (es: utente eliminato), rimuovi cookie e redirect
          clearTokenCookie();
          redirectToLogin();
        }
      }, REFRESH_INTERVAL);

      // Reset flag dopo primo caricamento con successo
      isInitialLoad = false;
    } catch (error) {
      console.error('[AUTH] Errore nel salvataggio del token:', error);
      clearTokenCookie();
      redirectToLogin();
    }
  } else {
    // Utente non autenticato - rimuovi il cookie
    clearTokenCookie();

    // Reindirizza a login solo se non è il primo caricamento
    // (evita loop se l'utente visita direttamente /login)
    if (!isInitialLoad) {
      redirectToLogin();
    }
    isInitialLoad = false;
  }
});
