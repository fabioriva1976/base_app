// Script per rinnovare automaticamente il token Firebase
import { auth } from '../lib/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';

// Rinnova il token ogni 50 minuti (i token durano 1 ora)
const REFRESH_INTERVAL = 50 * 60 * 1000;

function saveTokenToCookie(token: string) {
  const expiresIn = 60 * 60; // 1 ora
  document.cookie = `__session=${token}; path=/; max-age=${expiresIn}; samesite=lax; secure`;
}

function clearTokenCookie() {
  document.cookie = '__session=; path=/; max-age=0';
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
        }
      }, REFRESH_INTERVAL);
    } catch (error) {
      console.error('[AUTH] Errore nel salvataggio del token:', error);
    }
  } else {
    // Utente non autenticato - rimuovi il cookie
    clearTokenCookie();
  }
});
