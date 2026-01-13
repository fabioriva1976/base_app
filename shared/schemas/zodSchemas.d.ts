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
/**
 * Partita IVA italiana (11 cifre)
 */
export declare const PartitaIvaSchema: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
/**
 * Codice Fiscale italiano (16 caratteri alfanumerici)
 */
export declare const CodiceFiscaleSchema: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>;
/**
 * CAP italiano (5 cifre)
 */
export declare const CapSchema: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
/**
 * Telefono generico (permette +, spazi, parentesi, trattini)
 */
export declare const TelefonoSchema: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
/**
 * Email normalizzata (lowercase)
 */
export declare const EmailSchema: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>;
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
export declare const ClienteSchema: z.ZodObject<{
    ragione_sociale: z.ZodString;
    codice: z.ZodString;
    email: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>;
    telefono: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
    partita_iva: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
    codice_fiscale: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>;
    indirizzo: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
    citta: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
    cap: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
    provincia: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>;
    note: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
    status: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    ragione_sociale: string;
    codice: string;
    email: string | null;
    codice_fiscale: string | null;
    status: boolean;
    provincia: string | null;
    telefono?: string | null | undefined;
    partita_iva?: string | null | undefined;
    indirizzo?: string | null | undefined;
    citta?: string | null | undefined;
    cap?: string | null | undefined;
    note?: string | null | undefined;
}, {
    ragione_sociale: string;
    codice: string;
    email?: string | null | undefined;
    telefono?: string | null | undefined;
    partita_iva?: string | null | undefined;
    codice_fiscale?: string | null | undefined;
    indirizzo?: string | null | undefined;
    status?: boolean | undefined;
    citta?: string | null | undefined;
    cap?: string | null | undefined;
    provincia?: string | null | undefined;
    note?: string | null | undefined;
}>;
/**
 * Type TypeScript derivato automaticamente dallo schema Cliente
 */
export type ClienteInput = z.infer<typeof ClienteSchema>;
/**
 * Schema parziale per UPDATE (tutti i campi opzionali)
 */
export declare const ClienteUpdateSchema: z.ZodObject<{
    ragione_sociale: z.ZodOptional<z.ZodString>;
    codice: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>>;
    telefono: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>>;
    partita_iva: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>>;
    codice_fiscale: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>>;
    indirizzo: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>>;
    citta: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>>;
    cap: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>>;
    provincia: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null, string | null | undefined>>;
    note: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    ragione_sociale?: string | undefined;
    codice?: string | undefined;
    email?: string | null | undefined;
    telefono?: string | null | undefined;
    partita_iva?: string | null | undefined;
    codice_fiscale?: string | null | undefined;
    indirizzo?: string | null | undefined;
    status?: boolean | undefined;
    citta?: string | null | undefined;
    cap?: string | null | undefined;
    provincia?: string | null | undefined;
    note?: string | null | undefined;
}, {
    ragione_sociale?: string | undefined;
    codice?: string | undefined;
    email?: string | null | undefined;
    telefono?: string | null | undefined;
    partita_iva?: string | null | undefined;
    codice_fiscale?: string | null | undefined;
    indirizzo?: string | null | undefined;
    status?: boolean | undefined;
    citta?: string | null | undefined;
    cap?: string | null | undefined;
    provincia?: string | null | undefined;
    note?: string | null | undefined;
}>;
/**
 * Type TypeScript per UPDATE
 */
export type ClienteUpdateInput = z.infer<typeof ClienteUpdateSchema>;
/**
 * Schema validazione Utente
 */
export declare const UtenteSchema: z.ZodObject<{
    uid: z.ZodString;
    email: z.ZodEffects<z.ZodString, string, string>;
    ruolo: z.ZodUnion<[z.ZodUnion<[z.ZodLiteral<"operatore">, z.ZodLiteral<"admin">, z.ZodLiteral<"superuser">]>, z.ZodArray<z.ZodUnion<[z.ZodLiteral<"operatore">, z.ZodLiteral<"admin">, z.ZodLiteral<"superuser">]>, "many">]>;
    displayName: z.ZodDefault<z.ZodString>;
    disabled: z.ZodDefault<z.ZodBoolean>;
    photoURL: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    uid: string;
    ruolo: "operatore" | "admin" | "superuser" | ("operatore" | "admin" | "superuser")[];
    displayName: string;
    disabled: boolean;
    metadata: Record<string, unknown>;
    photoURL?: string | null | undefined;
}, {
    email: string;
    uid: string;
    ruolo: "operatore" | "admin" | "superuser" | ("operatore" | "admin" | "superuser")[];
    displayName?: string | undefined;
    disabled?: boolean | undefined;
    photoURL?: string | null | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type UtenteInput = z.infer<typeof UtenteSchema>;
export declare const UtenteUpdateSchema: z.ZodObject<{
    uid: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    ruolo: z.ZodOptional<z.ZodUnion<[z.ZodUnion<[z.ZodLiteral<"operatore">, z.ZodLiteral<"admin">, z.ZodLiteral<"superuser">]>, z.ZodArray<z.ZodUnion<[z.ZodLiteral<"operatore">, z.ZodLiteral<"admin">, z.ZodLiteral<"superuser">]>, "many">]>>;
    displayName: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    disabled: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    photoURL: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>>;
    metadata: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    uid?: string | undefined;
    ruolo?: "operatore" | "admin" | "superuser" | ("operatore" | "admin" | "superuser")[] | undefined;
    displayName?: string | undefined;
    disabled?: boolean | undefined;
    photoURL?: string | null | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    email?: string | undefined;
    uid?: string | undefined;
    ruolo?: "operatore" | "admin" | "superuser" | ("operatore" | "admin" | "superuser")[] | undefined;
    displayName?: string | undefined;
    disabled?: boolean | undefined;
    photoURL?: string | null | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type UtenteUpdateInput = z.infer<typeof UtenteUpdateSchema>;
/**
 * Schema validazione Comment
 */
export declare const CommentSchema: z.ZodObject<{
    text: z.ZodString;
    entityId: z.ZodString;
    entityCollection: z.ZodString;
}, "strip", z.ZodTypeAny, {
    text: string;
    entityId: string;
    entityCollection: string;
}, {
    text: string;
    entityId: string;
    entityCollection: string;
}>;
export type CommentInput = z.infer<typeof CommentSchema>;
/**
 * Schema validazione Attachment
 */
export declare const AttachmentSchema: z.ZodObject<{
    nome: z.ZodString;
    tipo: z.ZodString;
    storagePath: z.ZodString;
    metadata: z.ZodDefault<z.ZodObject<{
        entityId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        entityCollection: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        url: z.ZodDefault<z.ZodString>;
        size: z.ZodDefault<z.ZodNumber>;
        description: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        size: number;
        description: string;
        entityId?: string | null | undefined;
        entityCollection?: string | null | undefined;
    }, {
        entityId?: string | null | undefined;
        entityCollection?: string | null | undefined;
        url?: string | undefined;
        size?: number | undefined;
        description?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    metadata: {
        url: string;
        size: number;
        description: string;
        entityId?: string | null | undefined;
        entityCollection?: string | null | undefined;
    };
    nome: string;
    tipo: string;
    storagePath: string;
}, {
    nome: string;
    tipo: string;
    storagePath: string;
    metadata?: {
        entityId?: string | null | undefined;
        entityCollection?: string | null | undefined;
        url?: string | undefined;
        size?: number | undefined;
        description?: string | undefined;
    } | undefined;
}>;
export type AttachmentInput = z.infer<typeof AttachmentSchema>;
/**
 * Schema validazione Settings SMTP
 */
export declare const SmtpSettingsSchema: z.ZodObject<{
    host: z.ZodString;
    port: z.ZodNumber;
    secure: z.ZodDefault<z.ZodBoolean>;
    user: z.ZodString;
    pass: z.ZodString;
    from: z.ZodString;
}, "strip", z.ZodTypeAny, {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
}, {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure?: boolean | undefined;
}>;
export type SmtpSettingsInput = z.infer<typeof SmtpSettingsSchema>;
/**
 * Schema validazione Settings AI
 */
export declare const AiSettingsSchema: z.ZodObject<{
    provider: z.ZodUnion<[z.ZodLiteral<"openai">, z.ZodLiteral<"anthropic">, z.ZodLiteral<"google">]>;
    apiKey: z.ZodString;
    model: z.ZodString;
    temperature: z.ZodDefault<z.ZodNumber>;
    maxTokens: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    provider: "openai" | "anthropic" | "google";
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
}, {
    provider: "openai" | "anthropic" | "google";
    apiKey: string;
    model: string;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
}>;
export type AiSettingsInput = z.infer<typeof AiSettingsSchema>;
