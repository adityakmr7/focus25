/**
 * Centralized Error Handling Service
 * Provides consistent error handling, user-friendly messages, and retry logic
 */

// Error types and categories
export enum ErrorCategory {
    NETWORK = 'NETWORK',
    DATABASE = 'DATABASE',
    VALIDATION = 'VALIDATION',
    AUTHENTICATION = 'AUTHENTICATION',
    PERMISSION = 'PERMISSION',
    UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export interface AppError {
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    originalError?: Error | unknown;
    context?: Record<string, unknown>;
    retryable: boolean;
    timestamp: Date;
}

// Custom error classes
export class NetworkError extends Error {
    category = ErrorCategory.NETWORK;
    retryable = true;

    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class DatabaseError extends Error {
    category = ErrorCategory.DATABASE;
    retryable = true;

    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class ValidationError extends Error {
    category = ErrorCategory.VALIDATION;
    retryable = false;

    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends Error {
    category = ErrorCategory.AUTHENTICATION;
    retryable = true;

    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class PermissionError extends Error {
    category = ErrorCategory.PERMISSION;
    retryable = false;

    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'PermissionError';
    }
}

/**
 * User-friendly error message mapping
 */
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
    // Network errors
    'Network request failed': 'Unable to connect. Please check your internet connection.',
    'Failed to fetch': 'Unable to connect. Please check your internet connection.',
    'NetworkError': 'Unable to connect. Please check your internet connection.',
    'timeout': 'The request took too long. Please try again.',
    'ECONNREFUSED': 'Unable to connect to the server. Please try again later.',
    'ENOTFOUND': 'Unable to connect. Please check your internet connection.',

    // Database errors
    'Database initialization timeout': 'App is still loading. Please wait a moment.',
    'Database not initialized': 'App is still loading. Please wait a moment.',
    'DatabaseError': 'There was a problem saving your data. Please try again.',
    'SQLITE_ERROR': 'There was a problem accessing your data. Please try again.',
    'SQLITE_BUSY': 'Database is busy. Please try again in a moment.',

    // Validation errors
    'ValidationError': 'Please check your input and try again.',
    'Invalid input': 'Please check your input and try again.',
    'Missing required field': 'Please fill in all required fields.',

    // Authentication errors
    'AuthenticationError': 'There was a problem signing you in. Please try again.',
    'Failed to sign in': 'There was a problem signing you in. Please try again.',
    'Invalid credentials': 'Incorrect email or password. Please try again.',
    'Token expired': 'Your session has expired. Please sign in again.',

    // Permission errors
    'PermissionError': 'Permission denied. Please enable the required permission in settings.',
    'Permission denied': 'Permission denied. Please enable the required permission in settings.',

    // Generic
    'Failed to load': 'Unable to load data. Please try again.',
    'Failed to save': 'Unable to save. Please try again.',
    'Failed to delete': 'Unable to delete. Please try again.',
    'Failed to update': 'Unable to update. Please try again.',
    'Failed to create': 'Unable to create. Please try again.',
};

/**
 * Error messages that should be silent (not shown to user)
 */
const SILENT_ERROR_PATTERNS = [
    'ERR_REQUEST_CANCELED',
    'cancel',
    'cancelled',
    'user cancelled',
    'user canceled',
];

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(error: Error | string, category: ErrorCategory): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorName = typeof error === 'string' ? '' : error.name;

    // Check if error should be silent
    const lowerMessage = errorMessage.toLowerCase();
    if (SILENT_ERROR_PATTERNS.some((pattern) => lowerMessage.includes(pattern.toLowerCase()))) {
        return '';
    }

    // Try exact match first
    if (USER_FRIENDLY_MESSAGES[errorMessage]) {
        return USER_FRIENDLY_MESSAGES[errorMessage];
    }

    // Try error name
    if (errorName && USER_FRIENDLY_MESSAGES[errorName]) {
        return USER_FRIENDLY_MESSAGES[errorName];
    }

    // Try partial matches
    for (const [key, value] of Object.entries(USER_FRIENDLY_MESSAGES)) {
        if (errorMessage.includes(key) || errorName.includes(key)) {
            return value;
        }
    }

    // Category-based fallback
    switch (category) {
        case ErrorCategory.NETWORK:
            return 'Unable to connect. Please check your internet connection.';
        case ErrorCategory.DATABASE:
            return 'There was a problem accessing your data. Please try again.';
        case ErrorCategory.VALIDATION:
            return 'Please check your input and try again.';
        case ErrorCategory.AUTHENTICATION:
            return 'There was a problem with authentication. Please try again.';
        case ErrorCategory.PERMISSION:
            return 'Permission denied. Please enable the required permission in settings.';
        default:
            return 'Something went wrong. Please try again.';
    }
}

/**
 * Determine error category from error
 */
function categorizeError(error: Error | unknown): ErrorCategory {
    if (error instanceof NetworkError) return ErrorCategory.NETWORK;
    if (error instanceof DatabaseError) return ErrorCategory.DATABASE;
    if (error instanceof ValidationError) return ErrorCategory.VALIDATION;
    if (error instanceof AuthenticationError) return ErrorCategory.AUTHENTICATION;
    if (error instanceof PermissionError) return ErrorCategory.PERMISSION;

    const errorMessage =
        error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    if (
        lowerMessage.includes('network') ||
        lowerMessage.includes('fetch') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('ECONN') ||
        lowerMessage.includes('ENOTFOUND')
    ) {
        return ErrorCategory.NETWORK;
    }

    if (
        lowerMessage.includes('database') ||
        lowerMessage.includes('sqlite') ||
        lowerMessage.includes('db') ||
        lowerMessage.includes('initialization timeout')
    ) {
        return ErrorCategory.DATABASE;
    }

    if (
        lowerMessage.includes('validation') ||
        lowerMessage.includes('invalid') ||
        lowerMessage.includes('missing') ||
        lowerMessage.includes('required')
    ) {
        return ErrorCategory.VALIDATION;
    }

    if (
        lowerMessage.includes('auth') ||
        lowerMessage.includes('sign in') ||
        lowerMessage.includes('sign-in') ||
        lowerMessage.includes('token') ||
        lowerMessage.includes('credential')
    ) {
        return ErrorCategory.AUTHENTICATION;
    }

    if (
        lowerMessage.includes('permission') ||
        lowerMessage.includes('denied') ||
        lowerMessage.includes('unauthorized')
    ) {
        return ErrorCategory.PERMISSION;
    }

    return ErrorCategory.UNKNOWN;
}

/**
 * Determine error severity
 */
function determineSeverity(category: ErrorCategory, error: Error | unknown): ErrorSeverity {
    switch (category) {
        case ErrorCategory.AUTHENTICATION:
        case ErrorCategory.DATABASE:
            return ErrorSeverity.HIGH;
        case ErrorCategory.NETWORK:
            return ErrorSeverity.MEDIUM;
        case ErrorCategory.PERMISSION:
            return ErrorSeverity.MEDIUM;
        case ErrorCategory.VALIDATION:
            return ErrorSeverity.LOW;
        default:
            return ErrorSeverity.MEDIUM;
    }
}

/**
 * Check if error is retryable
 */
function isRetryable(error: Error | unknown, category: ErrorCategory): boolean {
    if (error instanceof NetworkError || error instanceof DatabaseError) {
        return error.retryable;
    }

    if (error instanceof ValidationError || error instanceof PermissionError) {
        return false;
    }

    const errorMessage =
        error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Non-retryable errors
    if (
        lowerMessage.includes('validation') ||
        lowerMessage.includes('invalid') ||
        lowerMessage.includes('permission') ||
        lowerMessage.includes('denied') ||
        lowerMessage.includes('cancel')
    ) {
        return false;
    }

    // Retryable errors
    if (
        category === ErrorCategory.NETWORK ||
        category === ErrorCategory.DATABASE ||
        category === ErrorCategory.AUTHENTICATION
    ) {
        return true;
    }

    return false;
}

/**
 * Error Handling Service
 */
class ErrorHandlingService {
    private errorLog: AppError[] = [];
    private maxLogSize = 100;

    /**
     * Process an error and return a standardized AppError
     */
    processError(
        error: Error | unknown,
        context?: Record<string, unknown>,
    ): AppError {
        const category = categorizeError(error);
        const severity = determineSeverity(category, error);
        const retryable = isRetryable(error, category);

        const errorMessage =
            error instanceof Error ? error.message : String(error);
        const userMessage = getUserFriendlyMessage(
            error instanceof Error ? error : errorMessage,
            category,
        );

        const appError: AppError = {
            category,
            severity,
            message: errorMessage,
            userMessage,
            originalError: error,
            context,
            retryable,
            timestamp: new Date(),
        };

        // Log error (only in development or for high severity)
        if (__DEV__ || severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
            this.logError(appError);
        }

        return appError;
    }

    /**
     * Log error for debugging
     */
    private logError(error: AppError): void {
        this.errorLog.push(error);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Console logging with context
        const logMessage = `[${error.category}] ${error.message}`;
        if (error.context) {
            console.error(logMessage, error.context, error.originalError);
        } else {
            console.error(logMessage, error.originalError);
        }
    }

    /**
     * Get error log (for debugging)
     */
    getErrorLog(): AppError[] {
        return [...this.errorLog];
    }

    /**
     * Clear error log
     */
    clearErrorLog(): void {
        this.errorLog = [];
    }

    /**
     * Retry a function with exponential backoff
     */
    async retry<T>(
        fn: () => Promise<T>,
        options: {
            maxAttempts?: number;
            initialDelay?: number;
            maxDelay?: number;
            onRetry?: (attempt: number, error: Error) => void;
        } = {},
    ): Promise<T> {
        const {
            maxAttempts = 3,
            initialDelay = 1000,
            maxDelay = 10000,
            onRetry,
        } = options;

        let lastError: Error | unknown;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                // Don't retry if it's the last attempt
                if (attempt === maxAttempts) {
                    break;
                }

                // Check if error is retryable
                const appError = this.processError(error);
                if (!appError.retryable) {
                    break;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);

                // Call onRetry callback if provided
                if (onRetry && error instanceof Error) {
                    onRetry(attempt, error);
                }

                // Wait before retrying
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService();

