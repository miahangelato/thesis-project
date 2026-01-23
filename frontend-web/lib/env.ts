import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url("NEXT_PUBLIC_API_URL must be a valid URL")
    .default("http://localhost:8000/api"),

  NEXT_PUBLIC_SCANNER_URL: z
    .string()
    .url("NEXT_PUBLIC_SCANNER_URL must be a valid URL")
    .optional()
    .default("http://localhost:5000"),

  NEXT_PUBLIC_SCANNER_PORT: z
    .string()
    .optional()
    .default("5000")
    .refine(
      (val) => !val || /^\d+$/.test(val),
      "NEXT_PUBLIC_SCANNER_PORT must be a number"
    ),

  NEXT_PUBLIC_KIOSK_API_KEY: z
    .string()
    .min(32, "API Key must be at least 32 characters")
    .default(""),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_SCANNER_URL: process.env.NEXT_PUBLIC_SCANNER_URL,
      NEXT_PUBLIC_SCANNER_PORT: process.env.NEXT_PUBLIC_SCANNER_PORT,
      NEXT_PUBLIC_KIOSK_API_KEY: process.env.NEXT_PUBLIC_KIOSK_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((err: z.ZodIssue) => `  - ${err.path.join(".")}: ${err.message}`)
        .join("\n");

      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\n` +
          `Please check your .env.local file.`
      );
    }
    throw error;
  }
}

export const env = validateEnv();

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

export function getApiUrl(path: string = ""): string {
  const baseUrl = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
}

export function getScannerUrl(path: string = ""): string {
  const baseUrl = env.NEXT_PUBLIC_SCANNER_URL.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
}

export const isClient = typeof window !== "undefined";

export const isServer = typeof window === "undefined";
