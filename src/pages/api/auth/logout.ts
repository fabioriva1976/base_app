import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  // Cancella i cookie di sessione (__session è quello usato dall'app)
  cookies.delete('__session', { path: '/' });
  // Manteniamo la cancellazione legacy per compatibilità
  cookies.delete('session', { path: '/' });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
