/**
 * Utility functions per formattazione dati
 *
 * Funzioni condivise tra tutte le pagine per garantire
 * consistenza nella formattazione di file size, date, etc.
 */

/**
 * Formatta dimensione file in formato human-readable
 * @param {number} bytes - Dimensione in bytes
 * @returns {string} Dimensione formattata (es. "1.5 MB")
 */
export function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Formatta data/timestamp in vari formati
 * @param {Date|string|Timestamp} timestamp - Data da formattare
 * @param {Object} options - Opzioni di formattazione
 * @param {boolean} options.relative - Se true, mostra formato relativo ("2 ore fa")
 * @param {string} options.emptyText - Testo da mostrare se timestamp è null/undefined
 * @param {boolean} options.includeTime - Se true, include anche l'ora
 * @returns {string} Data formattata
 */
export function formatDate(timestamp, options = {}) {
    const {
        relative = false,
        emptyText = 'N/D',
        includeTime = false
    } = options;

    if (!timestamp) return emptyText;

    // Gestisci sia Timestamp di Firestore che Date/String normali
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    // Verifica che sia una data valida
    if (isNaN(date.getTime())) return emptyText;

    // Formato relativo
    if (relative) {
        return formatRelativeTime(date);
    }

    // Formato assoluto
    const dateOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };

    if (includeTime) {
        dateOptions.hour = '2-digit';
        dateOptions.minute = '2-digit';
    }

    return date.toLocaleDateString('it-IT', dateOptions);
}

/**
 * Formatta data in formato relativo ("2 ore fa", "ieri", etc.)
 * @param {Date} date - Data da formattare
 * @returns {string} Data in formato relativo
 */
function formatRelativeTime(date) {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Adesso';
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minuti'} fa`;
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'ora' : 'ore'} fa`;
    if (diffInDays === 1) return 'Ieri';
    if (diffInDays < 7) return `${diffInDays} giorni fa`;

    // Per date più vecchie, usa formato normale
    return date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Formatta timestamp ISO in formato data italiano
 * @param {string} isoDate - Data in formato ISO (es. "2024-01-05T10:30:00Z")
 * @returns {string} Data formattata (es. "05/01/2024")
 */
export function formatISODate(isoDate) {
    return formatDate(isoDate, { emptyText: 'N/D' });
}

/**
 * Formatta array di tags in HTML
 * @param {Array<string>} tags - Array di tag
 * @param {Object} options - Opzioni di formattazione
 * @returns {string} HTML formattato con i tag
 */
export function formatTags(tags, options = {}) {
    const {
        emptyText = 'N/D',
        maxTags = null,
        color = 'var(--primary-color)'
    } = options;

    if (!Array.isArray(tags) || tags.length === 0) return emptyText;

    const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
    const remainingCount = maxTags && tags.length > maxTags ? tags.length - maxTags : 0;

    const tagsHtml = displayTags.map(tag =>
        `<span style="display: inline-block; padding: 2px 8px; background: ${color}; color: white; border-radius: 12px; font-size: 11px; margin: 2px;">${escapeHtml(tag)}</span>`
    ).join(' ');

    if (remainingCount > 0) {
        return tagsHtml + ` <span style="font-size: 11px; color: var(--text-secondary);">+${remainingCount} altri</span>`;
    }

    return tagsHtml;
}

/**
 * Escape HTML per prevenire XSS
 * @param {string} text - Testo da escape
 * @returns {string} Testo escaped
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Tronca testo lungo aggiungendo ellipsis
 * @param {string} text - Testo da troncare
 * @param {number} maxLength - Lunghezza massima
 * @returns {string} Testo troncato
 */
export function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
}

/**
 * Formatta numero con separatore delle migliaia
 * @param {number} num - Numero da formattare
 * @returns {string} Numero formattato
 */
export function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('it-IT');
}

/**
 * Formatta valuta in Euro
 * @param {number} amount - Importo
 * @returns {string} Importo formattato (es. "1.234,56 €")
 */
export function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0,00 €';
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}
