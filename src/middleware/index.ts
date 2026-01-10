import { sequence, defineMiddleware } from 'astro:middleware';
import { COLLECTIONS } from '../../shared/constants/collections.js';

const publicPaths = ['/login', '/api/'];
const assetPaths = ['/assets/', '/favicon', '/_astro/'];

// Helper per estrarre cookie dall'header
function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? match[1] : null;
}

const authMiddleware = defineMiddleware(async (context, next) => {
  const { url, request, locals, redirect } = context;

  // Permetti asset
  if (assetPaths.some(p => url.pathname.startsWith(p))) {
    return next();
  }

  // Permetti pagine pubbliche
  if (publicPaths.some(p => url.pathname.startsWith(p))) {
    return next();
  }

  // Leggi token dal cookie usando header (NO modulo cookies)
  const cookieHeader = request.headers.get('cookie');
  const idToken = getCookie(cookieHeader, '__session');

  if (!idToken) {
    return redirect('/login');
  }

  // In dev, estrai info senza verificare
  if (import.meta.env.DEV) {
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const uid = payload.user_id || payload.sub || 'dev-user';

      // In DEV, usa il ruolo dalla variabile d'ambiente DEV_USER_ROLE quando presente.
      // Se non impostato, tenta di leggere il ruolo da Firestore (fallback a superuser).
      const envRole = process.env.DEV_USER_ROLE as 'superuser' | 'admin' | 'operatore' | undefined;
      let userRole: 'superuser' | 'admin' | 'operatore' | undefined;

      if (envRole && ['superuser', 'admin', 'operatore'].includes(envRole)) {
        userRole = envRole;
      } else {
        try {
          const { adminDb } = await import('../lib/firebase-admin');
          const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(uid).get();
          if (userDoc.exists) {
            userRole = userDoc.data()?.ruolo;
          }
        } catch (error) {
          console.error('[MIDDLEWARE DEV] Errore recupero ruolo da Firestore:', error);
        }
      }

      if (!userRole) {
        userRole = 'superuser';
      }

      console.log(`[MIDDLEWARE DEV] Ruolo utente: ${userRole} (DEV_USER_ROLE=${process.env.DEV_USER_ROLE || 'not set'})`);

      locals.user = {
        uid,
        email: payload.email || 'dev@localhost',
        emailVerified: payload.email_verified !== undefined ? payload.email_verified : true,
        ruolo: userRole
      };
    } catch {
      return redirect('/login');
    }
    return next();
  }

  // In prod, verifica con Firebase Admin
  try {
    const { adminAuth, adminDb } = await import('../lib/firebase-admin');
    // Usa verifySessionCookie per i cookie di sessione e abilita il controllo di revoca
    const decodedToken = await adminAuth.verifySessionCookie(idToken, true);

    // Recupera il ruolo dell'utente da Firestore
    let userRole = undefined;
    try {
      const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
      if (userDoc.exists) {
        userRole = userDoc.data()?.ruolo;
      }
    } catch (error) {
      console.error('[MIDDLEWARE] Errore recupero ruolo:', error);
    }

    locals.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      ruolo: userRole
    };

    return next();
  } catch {
    return redirect('/login');
  }
});

export const onRequest = sequence(authMiddleware);
