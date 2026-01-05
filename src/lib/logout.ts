import { auth } from './firebase-client';
import { signOut } from 'firebase/auth';

/**
 * Gestisce il logout dell'utente
 * - Esegue signOut da Firebase
 * - Chiama l'API per eliminare il session cookie
 * - Reindirizza al login
 */
export async function handleLogout(): Promise<void> {
  try {
    // Sign out da Firebase
    await signOut(auth);

    // Chiama l'API per eliminare il session cookie
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    // Pulizia cookie lato client (sia __session che eventuale fallback "session")
    document.cookie = '__session=; path=/; max-age=0';
    document.cookie = 'session=; path=/; max-age=0';

    // Redirect al login
    window.location.href = '/login';
  } catch (error) {
    console.error('Errore durante il logout:', error);
    // Anche in caso di errore, reindirizza al login
    window.location.href = '/login';
  }
}

/**
 * Inizializza il listener per il pulsante di logout
 * @param buttonId - ID del pulsante di logout
 */
export function initLogoutButton(buttonId: string = 'logout-btn'): void {
  const bindHandler = () => {
    const logoutBtn = document.getElementById(buttonId);
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleLogout();
    });
  };

  // In Astro gli script sono spesso eseguiti prima del render: aggiungiamo un fallback DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindHandler, { once: true });
  } else {
    bindHandler();
  }
}
