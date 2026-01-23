import { z } from "zod";
import { VALIDATION, FINGERPRINT_CONFIG } from "./constants";

export const validators = {
  age: z
    .number()
    .int("Age must be a whole number")
    .min(VALIDATION.AGE.MIN, VALIDATION.AGE.ERROR_MIN)
    .max(VALIDATION.AGE.MAX, VALIDATION.AGE.ERROR_MAX),

  weight: z
    .number()
    .min(VALIDATION.WEIGHT.MIN, VALIDATION.WEIGHT.ERROR_MIN)
    .max(VALIDATION.WEIGHT.MAX, VALIDATION.WEIGHT.ERROR_MAX),

  height: z
    .number()
    .min(VALIDATION.HEIGHT.MIN, VALIDATION.HEIGHT.ERROR_MIN)
    .max(VALIDATION.HEIGHT.MAX, VALIDATION.HEIGHT.ERROR_MAX),

  gender: z.enum(["Male", "Female", "Other"], {
    message: "Please select a valid gender",
  }),

  consent: z.boolean().refine((val) => val === true, {
    message: "You must provide consent to proceed",
  }),

  uuid: z.string().uuid("Invalid session ID format"),
};

export const demographicsSchema = z.object({
  age: validators.age,
  weight_kg: validators.weight,
  height_cm: validators.height,
  gender: validators.gender,
  willing_to_donate: z.boolean().default(false),
  blood_type: z.string().optional(),
});

export const analyzeRequestSchema = demographicsSchema.extend({
  consent: validators.consent,
  fingerprint_images: z
    .array(z.string())
    .min(
      FINGERPRINT_CONFIG.REQUIRED_COUNT,
      `All ${FINGERPRINT_CONFIG.REQUIRED_COUNT} fingerprints are required`
    ),
});

const fingerNames = FINGERPRINT_CONFIG.FINGER_NAMES as unknown as [string, ...string[]];

export const fingerprintSubmissionSchema = z.object({
  finger_name: z.enum(fingerNames, {
    message: "Invalid finger name",
  }),
  image: z.string().min(1, "Fingerprint image data is required"),
});

export type DemographicsFormData = z.infer<typeof demographicsSchema>;
export type AnalyzeRequestData = z.infer<typeof analyzeRequestSchema>;
export type FingerprintSubmissionData = z.infer<typeof fingerprintSubmissionSchema>;

export function validateSafe<T>(schema: z.ZodType<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

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
    const path = issue.path.join(".");
    errors[path] = issue.message;
  });

  return { valid: false, errors };
}
