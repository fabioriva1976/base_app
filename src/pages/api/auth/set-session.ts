import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase-admin';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    // Supporta sia formData che JSON
    const contentType = request.headers.get('content-type');
    let idToken: string | null = null;

    if (contentType?.includes('application/json')) {
      const body = await request.json();
      idToken = body.idToken;
    } else {
      const formData = await request.formData();
      idToken = formData.get('idToken') as string;
    }

    if (!idToken) {
      console.log('[SET-SESSION] Token mancante');
      return new Response('Token mancante', { status: 400 });
    }

    console.log('[SET-SESSION] Ricevuto token, verifica in corso...');
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log('[SET-SESSION] Token verificato per utente:', decodedToken.uid);

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 giorni
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    console.log('[SET-SESSION] Session cookie creato');

    // Imposta il cookie (usa __session per compatibilità con middleware)
    cookies.set('__session', sessionCookie, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: Math.floor(expiresIn / 1000)
    });

    console.log('[SET-SESSION] Cookie impostato, redirect a /');
    return redirect('/');
  } catch (error) {
    console.error('[SET-SESSION] Errore:', error);
    return redirect('/login?error=session');
  }
};
