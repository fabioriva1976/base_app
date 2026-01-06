/**
 * Firebase Cloud Function per servire l'applicazione Astro SSR
 */
const { onRequest } = require("firebase-functions/v2/https");

let handler;

// Lazy load del server Astro
function getAstroHandler() {
  if (!handler) {
    const { handler: astroHandler } = require("./dist/server/entry.mjs");
    handler = astroHandler;
  }
  return handler;
}

/**
 * Cloud Function che serve l'app Astro
 *
 * Deployment:
 * - npm run build (genera dist in functions/dist)
 * - firebase deploy --only hosting,functions:astroSSR
 */
exports.astroSSR = onRequest(
  {
    region: "europe-west1",
    cpu: 1,
    memory: "256MiB",
    timeoutSeconds: 60,
    maxInstances: 10,
    minInstances: 0,
    invoker: "public"  // Permette accesso pubblico alla funzione
  },
  async (request, response) => {
    try {
      const astroHandler = getAstroHandler();
      await astroHandler(request, response);
    } catch (error) {
      console.error("Astro SSR error:", error);
      response.status(500).send("Internal Server Error");
    }
  }
);
