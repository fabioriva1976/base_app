/**
 * 🤖 Helper per identificare operazioni di sistema nel frontend
 *
 * Quando un'entità viene creata/modificata da processi automatici (cron, trigger, migration)
 * invece che da utenti umani, questi helper permettono di identificarle e visualizzarle diversamente.
 */

import { SYSTEM_USER } from '../../../shared/schemas/entityFactory.ts';

/**
 * Verifica se un'entità è stata creata dal sistema
 *
 * @param {object} entity - Entità da verificare
 * @returns {boolean} true se creata dal sistema
 *
 * @example
 * if (isSystemCreated(cliente)) {
 *   console.log('Cliente creato automaticamente dal sistema');
 * }
 */
export function isSystemCreated(entity) {
  if (!entity) return false;
  return entity.createdBy === SYSTEM_USER.id ||
         entity.createdByEmail === SYSTEM_USER.email;
}

/**
 * Verifica se un'entità è stata modificata dal sistema
 *
 * @param {object} entity - Entità da verificare
 * @returns {boolean} true se ultima modifica dal sistema
 *
 * @example
 * if (isSystemModified(cliente)) {
 *   console.log('Cliente modificato automaticamente dal sistema');
 * }
 */
export function isSystemModified(entity) {
  if (!entity) return false;
  return entity.lastModifiedBy === SYSTEM_USER.id ||
         entity.lastModifiedByEmail === SYSTEM_USER.email;
}

/**
 * Ottiene il nome visualizzabile del creatore
 *
 * @param {object} entity - Entità da verificare
 * @returns {string} Nome visualizzabile (es: "Sistema Automatico" o email utente)
 *
 * @example
 * const createdBy = getCreatorDisplayName(cliente);
 * // Output: "Sistema Automatico" o "admin@example.com"
 */
export function getCreatorDisplayName(entity) {
  if (!entity) return 'Sconosciuto';

  if (isSystemCreated(entity)) {
    return '🤖 Sistema Automatico';
  }

  return entity.createdByEmail || entity.createdBy || 'Sconosciuto';
}

/**
 * Ottiene il nome visualizzabile dell'ultimo modificatore
 *
 * @param {object} entity - Entità da verificare
 * @returns {string} Nome visualizzabile (es: "Sistema Automatico" o email utente)
 *
 * @example
 * const modifiedBy = getModifierDisplayName(cliente);
 * // Output: "Sistema Automatico" o "admin@example.com"
 */
export function getModifierDisplayName(entity) {
  if (!entity) return 'Sconosciuto';

  if (isSystemModified(entity)) {
    return '🤖 Sistema Automatico';
  }

  return entity.lastModifiedByEmail || entity.lastModifiedBy || 'Sconosciuto';
}

/**
 * Ottiene classe CSS per styling basato sul tipo di creatore
 *
 * @param {object} entity - Entità da verificare
 * @returns {string} Classe CSS ('system-created' o 'user-created')
 *
 * @example
 * <div class="${getCreatorClass(cliente)}">
 *   Creato da: ${getCreatorDisplayName(cliente)}
 * </div>
 */
export function getCreatorClass(entity) {
  return isSystemCreated(entity) ? 'system-created' : 'user-created';
}

/**
 * Ottiene classe CSS per styling basato sul tipo di modificatore
 *
 * @param {object} entity - Entità da verificare
 * @returns {string} Classe CSS ('system-modified' o 'user-modified')
 *
 * @example
 * <div class="${getModifierClass(cliente)}">
 *   Modificato da: ${getModifierDisplayName(cliente)}
 * </div>
 */
export function getModifierClass(entity) {
  return isSystemModified(entity) ? 'system-modified' : 'user-modified';
}

/**
 * Formatta info audit completa per visualizzazione
 *
 * @param {object} entity - Entità da verificare
 * @returns {object} Oggetto con info formattate
 *
 * @example
 * const auditInfo = getAuditInfo(cliente);
 * console.log(`Creato da: ${auditInfo.createdBy}`);
 * console.log(`Modificato da: ${auditInfo.modifiedBy}`);
 */
export function getAuditInfo(entity) {
  if (!entity) {
    return {
      createdBy: 'Sconosciuto',
      modifiedBy: 'Sconosciuto',
      isSystemCreated: false,
      isSystemModified: false,
      creatorClass: 'user-created',
      modifierClass: 'user-modified'
    };
  }

  return {
    createdBy: getCreatorDisplayName(entity),
    modifiedBy: getModifierDisplayName(entity),
    isSystemCreated: isSystemCreated(entity),
    isSystemModified: isSystemModified(entity),
    creatorClass: getCreatorClass(entity),
    modifierClass: getModifierClass(entity)
  };
}

/**
 * Esporta anche SYSTEM_USER per uso diretto se necessario
 */
export { SYSTEM_USER };
