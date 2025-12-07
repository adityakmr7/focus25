/**
 * Type guard utilities for better type safety
 */

/**
 * Check if error is an Error instance with a message
 */
export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Check if error is an Error instance with a code property
 */
export function isErrorWithCode(error: unknown): error is { code: string; message?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Get error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

/**
 * Check if error message contains configuration-related keywords
 */
export function isConfigurationError(error: unknown): boolean {
  const errorMessage = getErrorMessage(error).toLowerCase();
  const configPatterns = ['configuration', 'offerings-empty', 'products registered'];
  return configPatterns.some((pattern) => errorMessage.includes(pattern));
}

/**
 * Check if error is a user cancellation
 */
export function isUserCancellation(error: unknown): boolean {
  if (isErrorWithCode(error) && error.code === 'ERR_REQUEST_CANCELED') {
    return true;
  }
  const errorMessage = getErrorMessage(error).toLowerCase();
  return errorMessage.includes('cancel');
}
