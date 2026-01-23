export class BaseAppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class APIError extends BaseAppError {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message, "API_ERROR", statusCode, details);
  }
}

export class NetworkError extends BaseAppError {
  constructor(message: string = "Network error occurred") {
    super(message, "NETWORK_ERROR", 0);
  }
}

export class TimeoutError extends BaseAppError {
  constructor(message: string = "Request timed out") {
    super(message, "TIMEOUT_ERROR", 408);
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401);
    this.code = "UNAUTHORIZED";
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = "Access forbidden") {
    super(message, 403);
    this.code = "FORBIDDEN";
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    this.code = "NOT_FOUND";
  }
}

export class RateLimitError extends APIError {
  constructor(
    message: string = "Too many requests",
    public retryAfter?: number
  ) {
    super(message, 429, { retryAfter });
    this.code = "RATE_LIMIT_EXCEEDED";
  }
}

export class SessionError extends BaseAppError {
  constructor(message: string, code?: string) {
    super(message, code || "SESSION_ERROR");
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(sessionId?: string) {
    super(
      sessionId ? `Session not found: ${sessionId}` : "Session not found",
      "SESSION_NOT_FOUND"
    );
  }
}

export class SessionExpiredError extends SessionError {
  constructor() {
    super("Session has expired", "SESSION_EXPIRED");
  }
}

export class InvalidSessionError extends SessionError {
  constructor() {
    super("Invalid session", "INVALID_SESSION");
  }
}

export class ValidationError extends BaseAppError {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message, "VALIDATION_ERROR", 400, { field, value });
  }
}

export class RequiredFieldError extends ValidationError {
  constructor(field: string) {
    super(`${field} is required`, field);
    this.code = "REQUIRED_FIELD";
  }
}

export class InvalidValueError extends ValidationError {
  constructor(field: string, value: unknown, reason?: string) {
    const message = reason ? `Invalid ${field}: ${reason}` : `Invalid ${field}`;
    super(message, field, value);
    this.code = "INVALID_VALUE";
  }
}

export class RangeError extends ValidationError {
  constructor(field: string, value: number, min: number, max: number) {
    super(`${field} must be between ${min} and ${max}`, field, value);
    this.code = "OUT_OF_RANGE";
    this.details = { min, max, value };
  }
}

export class ScannerError extends BaseAppError {
  constructor(message: string, code?: string) {
    super(message, code || "SCANNER_ERROR");
  }
}

export class ScannerNotFoundError extends ScannerError {
  constructor() {
    super("Scanner not found or not connected", "SCANNER_NOT_FOUND");
  }
}

export class ScannerTimeoutError extends ScannerError {
  constructor() {
    super("Scanner request timed out", "SCANNER_TIMEOUT");
  }
}

export class ScannerCaptureError extends ScannerError {
  constructor(reason?: string) {
    super(
      reason ? `Capture failed: ${reason}` : "Failed to capture fingerprint",
      "CAPTURE_FAILED"
    );
  }
}

export class IncompleteFingerprintsError extends ScannerError {
  constructor(
    public required: number,
    public received: number
  ) {
    super(
      `Need ${required} fingerprints, only have ${received}`,
      "INCOMPLETE_FINGERPRINTS"
    );
    this.details = { required, received };
  }
}

export class ImageError extends BaseAppError {
  constructor(message: string, code?: string) {
    super(message, code || "IMAGE_ERROR");
  }
}

export class InvalidImageError extends ImageError {
  constructor(reason?: string) {
    super(reason ? `Invalid image: ${reason}` : "Invalid image", "INVALID_IMAGE");
  }
}

export class ImageTooLargeError extends ImageError {
  constructor(size: number, maxSize: number) {
    super(
      `Image size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds limit (${maxSize}MB)`,
      "IMAGE_TOO_LARGE"
    );
    this.details = { size, maxSize };
  }
}

export function normalizeError(error: unknown): BaseAppError {
  if (error instanceof BaseAppError) {
    return error;
  }

  if (error instanceof Error) {
    return new BaseAppError(error.message);
  }

  if (typeof error === "string") {
    return new BaseAppError(error);
  }

  return new BaseAppError("An unknown error occurred");
}

export function getErrorMessage(error: unknown): string {
  const normalizedError = normalizeError(error);
  return normalizedError.message;
}

export function isErrorType<T extends BaseAppError>(
  error: unknown,
  errorClass: new (...args: any[]) => T
): error is T {
  return error instanceof errorClass;
}

export function logError(error: unknown, context?: string) {
  const normalizedError = normalizeError(error);

  if (process.env.NODE_ENV === "development") {
    console.error(`[${context || "Error"}]`, normalizedError.toJSON());
  }

  if (process.env.NODE_ENV === "production") {
    console.error("[Production Error]", normalizedError.message);
  }
}
