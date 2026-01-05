import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase-admin';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { idToken } = await request.json();
    console.log('[SESSION] Ricevuta richiesta di creazione sessione');

    if (!idToken) {
      console.log('[SESSION] Token mancante');
      return new Response(JSON.stringify({ error: 'Token mancante' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verifica il token ID
    console.log('[SESSION] Verifica token ID...');
    const decodedToken = await adminAuth.verifyIdToken(idToken, true); // <-- Abilita controllo revoca
    console.log('[SESSION] Token verificato per utente:', decodedToken.uid);

    // Crea una sessione cookie (valida per 5 giorni)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 giorni
    console.log('[SESSION] Creazione session cookie...');
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    console.log('[SESSION] Session cookie creato');

    // Imposta il cookie di sessione usando Astro cookies
    const maxAge = Math.floor(expiresIn / 1000);

    console.log('[SESSION] Impostazione cookie session...');
    cookies.set('session', sessionCookie, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: maxAge
    });
    console.log('[SESSION] Cookie impostato con maxAge:', maxAge);

    return new Response(JSON.stringify({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[SESSION] Errore:', error);
    return new Response(JSON.stringify({
      error: 'Errore durante la creazione della sessione',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
