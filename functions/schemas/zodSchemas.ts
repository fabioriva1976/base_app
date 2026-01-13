/**
 * Schemi Zod condivisi.
 *
 * NOTA: Questo file è AUTO-GENERATO da /shared/schemas/zodSchemas.ts
 * Non modificare direttamente questo file! Modifica il file sorgente e riesegui:
 * npm run sync-factories
 */

/**
 * 🔒 Schemi di Validazione Zod
 *
 * Schema condivisi per validazione runtime con type inference automatico.
 * Utilizzabili sia client-side (form validation) che server-side (API validation).
 *
 * MOTIVAZIONE:
 * - Type-safe: TypeScript types derivati automaticamente dagli schemi
 * - Isomorphic: Stesso schema client + server
 * - Messaggi di errore chiari e localizzati
 * - Pattern riutilizzabili
 */

import { z } from 'zod';

// ========================================
// 📝 PATTERN RIUTILIZZABILI
// ========================================

/**
 * Partita IVA italiana (11 cifre)
 */
export const PartitaIvaSchema = z.string()
  .regex(/^\d{11}$/, 'La Partita IVA deve essere di 11 cifre')
  .optional()
  .nullable()
  .transform(val => val === '' ? null : val);

/**
 * Codice Fiscale italiano (16 caratteri alfanumerici)
 */
export const CodiceFiscaleSchema = z.string()
  .regex(/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i, 'Formato Codice Fiscale non valido')
  .optional()
  .nullable()
  .transform(val => val === '' ? null : (val ? val.toUpperCase() : null));

/**
 * CAP italiano (5 cifre)
 */
export const CapSchema = z.string()
  .regex(/^\d{5}$/, 'Il CAP deve essere di 5 cifre')
  .optional()
  .nullable()
  .transform(val => val === '' ? null : val);

/**
 * Telefono generico (permette +, spazi, parentesi, trattini)
 */
export const TelefonoSchema = z.string()
  .regex(/^[+]?[\d\s()-]+$/, 'Formato telefono non valido')
  .optional()
  .nullable()
  .transform(val => val === '' ? null : val);

/**
 * Email normalizzata (lowercase)
 */
export const EmailSchema = z.string()
  .email('Email non valida')
  .optional()
  .nullable()
  .transform(val => val === '' ? null : (val ? val.toLowerCase() : null));

// ========================================
// 👥 SCHEMA CLIENTE
// ========================================

/**
 * Schema validazione Cliente
 *
 * Usato per:
 * - Validazione form frontend (prima dell'invio)
 * - Validazione API backend (prima del salvataggio)
 *
 * @example
 * // Backend
 * const result = ClienteSchema.safeParse(request.body);
 * if (!result.success) {
 *   throw new HttpsError('invalid-argument', result.error.message);
 * }
 *
 * @example
 * // Frontend
 * const result = ClienteSchema.safeParse(formData);
 * if (!result.success) {
 *   showErrors(result.error.errors);
 * }
 */
export const ClienteSchema = z.object({
  ragione_sociale: z.string({ required_error: 'La ragione sociale è obbligatoria' })
    .min(1, 'La ragione sociale è obbligatoria')
    .max(200, 'Massimo 200 caratteri'),

  codice: z.string({ required_error: 'Il codice è obbligatorio' })
    .min(1, 'Il codice è obbligatorio')
    .max(50, 'Massimo 50 caratteri')
    .regex(/^[A-Z0-9_-]+$/i, 'Solo lettere, numeri, underscore e trattino'),

  email: EmailSchema,
  telefono: TelefonoSchema,
  partita_iva: PartitaIvaSchema,
  codice_fiscale: CodiceFiscaleSchema,

  indirizzo: z.string()
    .max(200, 'Massimo 200 caratteri')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),

  citta: z.string()
    .max(100, 'Massimo 100 caratteri')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),

  cap: CapSchema,

  provincia: z.string()
    .length(2, 'La provincia deve essere di 2 caratteri')
    .regex(/^[A-Z]{2}$/i, 'Formato provincia non valido (es: MI, RM)')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : (val ? val.toUpperCase() : null)),

  note: z.string()
    .max(1000, 'Massimo 1000 caratteri')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),

  status: z.boolean()
    .default(true)
});

/**
 * Type TypeScript derivato automaticamente dallo schema Cliente
 */
export type ClienteInput = z.infer<typeof ClienteSchema>;

/**
 * Schema parziale per UPDATE (tutti i campi opzionali)
 */
export const ClienteUpdateSchema = ClienteSchema.partial();

/**
 * Type TypeScript per UPDATE
 */
export type ClienteUpdateInput = z.infer<typeof ClienteUpdateSchema>;

// ========================================
// 👤 SCHEMA UTENTE
// ========================================

/**
 * Schema validazione Utente
 */
export const UtenteSchema = z.object({
  uid: z.string({ required_error: 'UID è obbligatorio' })
    .min(1, 'UID è obbligatorio'),

  email: z.string({ required_error: 'Email è obbligatoria' })
    .email('Email non valida')
    .transform(val => val.toLowerCase()),

  ruolo: z.union([
    z.literal('operatore'),
    z.literal('admin'),
    z.literal('superuser')
  ]).or(z.array(z.union([
    z.literal('operatore'),
    z.literal('admin'),
    z.literal('superuser')
  ]))),

  displayName: z.string()
    .max(100, 'Massimo 100 caratteri')
    .default(''),

  disabled: z.boolean()
    .default(false),

  photoURL: z.string()
    .url('URL foto non valido')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),

  metadata: z.record(z.unknown())
    .default({})
});

export type UtenteInput = z.infer<typeof UtenteSchema>;
export const UtenteUpdateSchema = UtenteSchema.partial();
export type UtenteUpdateInput = z.infer<typeof UtenteUpdateSchema>;

// ========================================
// 💬 SCHEMA COMMENT
// ========================================

/**
 * Schema validazione Comment
 */
export const CommentSchema = z.object({
  text: z.string({ required_error: 'Il testo è obbligatorio' })
    .min(1, 'Il testo è obbligatorio')
    .max(2000, 'Massimo 2000 caratteri'),

  entityId: z.string({ required_error: 'EntityId è obbligatorio' })
    .min(1, 'EntityId è obbligatorio'),

  entityCollection: z.string({ required_error: 'EntityCollection è obbligatorio' })
    .min(1, 'EntityCollection è obbligatorio')
});

export type CommentInput = z.infer<typeof CommentSchema>;

// ========================================
// 📎 SCHEMA ATTACHMENT
// ========================================

/**
 * Schema validazione Attachment
 */
export const AttachmentSchema = z.object({
  nome: z.string({ required_error: 'Il nome file è obbligatorio' })
    .min(1, 'Il nome file è obbligatorio')
    .max(255, 'Massimo 255 caratteri'),

  tipo: z.string({ required_error: 'Il tipo MIME è obbligatorio' })
    .min(1, 'Il tipo MIME è obbligatorio')
    .regex(/^[\w-]+\/[\w-+.]+$/, 'Formato MIME type non valido'),

  storagePath: z.string({ required_error: 'Lo storage path è obbligatorio' })
    .min(1, 'Lo storage path è obbligatorio'),

  metadata: z.object({
    entityId: z.string().nullable().optional(),
    entityCollection: z.string().nullable().optional(),
    url: z.string().url('URL non valido').or(z.literal('')).default(''),
    size: z.number().min(0).default(0),
    description: z.string().max(500, 'Massimo 500 caratteri').default('')
  }).default({})
});

export type AttachmentInput = z.infer<typeof AttachmentSchema>;

// ========================================
// ⚙️ SCHEMA SETTINGS
// ========================================

/**
 * Schema validazione Settings SMTP
 */
export const SmtpSettingsSchema = z.object({
  host: z.string({ required_error: 'Host SMTP è obbligatorio' })
    .min(1, 'Host SMTP è obbligatorio'),
  port: z.number({ required_error: 'Porta è obbligatoria' })
    .int()
    .min(1)
    .max(65535, 'Porta deve essere tra 1 e 65535'),
  secure: z.boolean().default(false),
  user: z.string({ required_error: 'Username è obbligatorio' })
    .min(1, 'Username è obbligatorio'),
  pass: z.string({ required_error: 'Password è obbligatoria' })
    .min(1, 'Password è obbligatoria'),
  from: z.string({ required_error: 'Email mittente è obbligatoria' })
    .email('Email mittente non valida')
});

export type SmtpSettingsInput = z.infer<typeof SmtpSettingsSchema>;

/**
 * Schema validazione Settings AI
 */
export const AiSettingsSchema = z.object({
  provider: z.union([
    z.literal('openai'),
    z.literal('anthropic'),
    z.literal('google')
  ], { required_error: 'Provider è obbligatorio' }),
  apiKey: z.string({ required_error: 'API Key è obbligatoria' })
    .min(1, 'API Key è obbligatoria'),
  model: z.string({ required_error: 'Model è obbligatorio' })
    .min(1, 'Model è obbligatorio'),
  temperature: z.number({ required_error: 'Temperature è obbligatoria' })
    .min(0)
    .max(2)
    .default(0.7),
  maxTokens: z.number({ required_error: 'MaxTokens è obbligatorio' })
    .int()
    .min(1)
    .default(1000)
});

export type AiSettingsInput = z.infer<typeof AiSettingsSchema>;
