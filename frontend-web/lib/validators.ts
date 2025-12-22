/**
 * Validation utilities using Zod schemas.
 * Reusable validators for forms and data integrity.
 */

import { z } from 'zod';
import { VALIDATION, FINGERPRINT_CONFIG } from './constants';

// ============================================================================
// PRIMITIVE VALIDATORS
// ============================================================================

export const validators = {
    // Age validation
    age: z
        .number()
        .int('Age must be a whole number')
        .min(VALIDATION.AGE.MIN, VALIDATION.AGE.ERROR_MIN)
        .max(VALIDATION.AGE.MAX, VALIDATION.AGE.ERROR_MAX),

    // Weight validation (kg)
    weight: z
        .number()
        .min(VALIDATION.WEIGHT.MIN, VALIDATION.WEIGHT.ERROR_MIN)
        .max(VALIDATION.WEIGHT.MAX, VALIDATION.WEIGHT.ERROR_MAX),

    // Height validation (cm)
    height: z
        .number()
        .min(VALIDATION.HEIGHT.MIN, VALIDATION.HEIGHT.ERROR_MIN)
        .max(VALIDATION.HEIGHT.MAX, VALIDATION.HEIGHT.ERROR_MAX),

    // Gender validation
    gender: z.enum(['Male', 'Female', 'Other'], {
        message: 'Please select a valid gender',
    }),

    // Consent validation
    consent: z.boolean().refine((val) => val === true, {
        message: 'You must provide consent to proceed',
    }),

    // UUID validation (for Session ID)
    uuid: z.string().uuid('Invalid session ID format'),
};

// ============================================================================
// FORM SCHEMAS
// ============================================================================

/**
 * Schema for demographics form
 */
export const demographicsSchema = z.object({
    age: validators.age,
    weight_kg: validators.weight,
    height_cm: validators.height,
    gender: validators.gender,
    willing_to_donate: z.boolean().default(false),
    blood_type: z.string().optional(),
});

/**
 * Schema for API analyze request
 */
export const analyzeRequestSchema = demographicsSchema.extend({
    consent: validators.consent,
    fingerprint_images: z
        .array(z.string())
        .min(
            FINGERPRINT_CONFIG.REQUIRED_COUNT,
            `All ${FINGERPRINT_CONFIG.REQUIRED_COUNT} fingerprints are required`
        ),
});

/**
 * Schema for fingerprint submission
 */
// Cast strict readonly array to [string, ...string[]] for Zod
const fingerNames = FINGERPRINT_CONFIG.FINGER_NAMES as unknown as [string, ...string[]];

export const fingerprintSubmissionSchema = z.object({
    finger_name: z.enum(fingerNames, {
        message: 'Invalid finger name',
    }),
    image: z.string().min(1, 'Fingerprint image data is required'),
});

// ============================================================================
// TYPES
// ============================================================================

export type DemographicsFormData = z.infer<typeof demographicsSchema>;
export type AnalyzeRequestData = z.infer<typeof analyzeRequestSchema>;
export type FingerprintSubmissionData = z.infer<typeof fingerprintSubmissionSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate data against a schema and return typed result or null
 */
export function validateSafe<T>(schema: z.ZodType<T>, data: unknown): T | null {
    const result = schema.safeParse(data);
    return result.success ? result.data : null;
}

/**
 * Validate data and return detailed error messages if failed
 */
export function validateWithErrors<T>(
    schema: z.ZodType<T>,
    data: unknown
): { valid: boolean; data?: T; errors?: Record<string, string> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { valid: true, data: result.data };
    }

    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    });

    return { valid: false, errors };
}
