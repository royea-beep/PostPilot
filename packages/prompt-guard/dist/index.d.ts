export interface SanitizeOptions {
    /** Mask PII (phone, email, URL) with placeholders. Default: true */
    maskPii?: boolean;
    /** Replace prompt-injection phrases with [filtered]. Default: true */
    blockInjection?: boolean;
    /** Max length after sanitization. Default: 2000 */
    maxLength?: number;
}
/**
 * Sanitize user text before sending to LLMs: mask PII and block common prompt-injection phrases.
 */
export declare function sanitizeForLlm(text: string, options?: SanitizeOptions): string;
