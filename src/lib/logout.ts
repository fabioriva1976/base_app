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
  const logoutBtn = document.getElementById(buttonId);

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleLogout();
    });
  }
}
