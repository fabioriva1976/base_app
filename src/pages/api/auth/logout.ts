import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  // Cancella il cookie di sessione
  cookies.delete('session', { path: '/' });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
