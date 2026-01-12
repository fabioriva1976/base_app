/**
 * Sistema di caching in-memory per query Firestore
 * Riduce le read operations e migliora le performance
 */

const cache = new Map();

/**
 * Ottiene dati da cache o li fetcha da Firestore
 * @param {string} key - Chiave univoca per la cache (es. 'collection:anagrafica_clienti')
 * @param {Function} fetchFn - Funzione async che fetcha i dati da Firestore
 * @param {number} ttl - Time to live in millisecondi (default: 10 minuti)
 * @returns {Promise<any>} I dati (da cache o fetch)
 */
export async function getCached(key, fetchFn, ttl = 10 * 60 * 1000) {
    const cached = cache.get(key);
    const now = Date.now();

    // Cache hit: ritorna dati se ancora validi
    if (cached && (now - cached.timestamp) < ttl) {
        console.log(`✅ Cache HIT: ${key} (età: ${Math.round((now - cached.timestamp) / 1000)}s)`);
        return cached.data;
    }

    // Cache miss o scaduta: fetch da Firestore
    console.log(`⚠️ Cache MISS: ${key}${cached ? ' (scaduta)' : ''}`);
    const data = await fetchFn();

    cache.set(key, {
        data,
        timestamp: now
    });

    return data;
}

/**
 * Invalida una chiave specifica dalla cache
 * Usare dopo operazioni di write (create, update, delete)
 * @param {string} key - Chiave da invalidare
 */
export function invalidateCache(key) {
    const existed = cache.has(key);
    cache.delete(key);
    if (existed) {
        console.log(`🗑️ Cache invalidata: ${key}`);
    }
}

/**
 * Invalida tutte le chiavi che matchano un pattern
 * @param {string|RegExp} pattern - Pattern da matchare
 */
export function invalidateCachePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let deleted = 0;

    for (const key of cache.keys()) {
        if (regex.test(key)) {
            cache.delete(key);
            deleted++;
        }
    }

    if (deleted > 0) {
        console.log(`🗑️ Cache invalidata (pattern: ${pattern}): ${deleted} chiavi`);
    }
}

/**
 * Pulisce tutta la cache
 */
export function clearCache() {
    const size = cache.size;
    cache.clear();
    console.log(`🗑️ Cache completamente pulita (${size} chiavi)`);
}

/**
 * Ottiene statistiche sulla cache
 * @returns {Object} Statistiche
 */
export function getCacheStats() {
    const stats = {
        totalKeys: cache.size,
        keys: [],
        totalSize: 0
    };

    for (const [key, value] of cache.entries()) {
        const age = Date.now() - value.timestamp;
        const size = JSON.stringify(value.data).length;

        stats.keys.push({
            key,
            age: Math.round(age / 1000), // secondi
            size: size,
            sizeKB: Math.round(size / 1024 * 10) / 10
        });

        stats.totalSize += size;
    }

    stats.totalSizeKB = Math.round(stats.totalSize / 1024 * 10) / 10;

    return stats;
}

// Debug: esponi stats sulla console
if (typeof window !== 'undefined') {
    window.firestoreCacheStats = getCacheStats;
    window.clearFirestoreCache = clearCache;
}
