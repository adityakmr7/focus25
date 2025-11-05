/**
 * Error Toast Utility
 * Provides standardized toast notifications for errors and user feedback
 */

import { toast } from 'react-native-heroui';
import {
    errorHandlingService,
    AppError,
    ErrorCategory,
    ErrorSeverity,
} from '@/services/error-handling-service';

/**
 * Toast options
 */
const TOAST_DURATION = {
    SHORT: 2000,
    MEDIUM: 4000,
    LONG: 6000,
};

/**
 * Show error toast
 */
export function showError(error: Error | unknown, context?: Record<string, unknown>): void {
    const appError = errorHandlingService.processError(error, context);

    // Don't show toast if error message is empty (silent errors)
    if (!appError.userMessage) {
        return;
    }

    // Determine duration based on severity
    let duration = TOAST_DURATION.MEDIUM;
    if (appError.severity === ErrorSeverity.CRITICAL || appError.severity === ErrorSeverity.HIGH) {
        duration = TOAST_DURATION.LONG;
    } else if (appError.severity === ErrorSeverity.LOW) {
        duration = TOAST_DURATION.SHORT;
    }

    toast.show({
        title: getErrorTitle(appError),
        description: appError.userMessage,
        duration,
        variant: 'error',
    });
}

/**
 * Show success toast
 */
export function showSuccess(message: string, title?: string): void {
    toast.show({
        title: title || 'Success',
        description: message,
        duration: TOAST_DURATION.SHORT,
        variant: 'success',
    });
}

/**
 * Show warning toast
 */
export function showWarning(message: string, title?: string): void {
    toast.show({
        title: title || 'Warning',
        description: message,
        duration: TOAST_DURATION.MEDIUM,
        variant: 'warning',
    });
}

/**
 * Show info toast
 */
export function showInfo(message: string, title?: string): void {
    toast.show({
        title: title || 'Info',
        description: message,
        duration: TOAST_DURATION.SHORT,
        variant: 'info',
    });
}

/**
 * Show error toast with retry option
 */
export function showErrorWithRetry(
    error: Error | unknown,
    onRetry: () => void,
    context?: Record<string, unknown>,
): void {
    const appError = errorHandlingService.processError(error, context);

    // Don't show toast if error message is empty (silent errors)
    if (!appError.userMessage) {
        return;
    }

    // Only show retry for retryable errors
    if (!appError.retryable) {
        showError(error, context);
        return;
    }

    toast.show({
        title: getErrorTitle(appError),
        description: appError.userMessage,
        duration: TOAST_DURATION.LONG,
        variant: 'error',
        action: {
            label: 'Retry',
            onPress: onRetry,
        },
    });
}

/**
 * Get error title based on category
 */
function getErrorTitle(appError: AppError): string {
    switch (appError.category) {
        case ErrorCategory.NETWORK:
            return 'Connection Error';
        case ErrorCategory.DATABASE:
            return 'Data Error';
        case ErrorCategory.VALIDATION:
            return 'Validation Error';
        case ErrorCategory.AUTHENTICATION:
            return 'Authentication Error';
        case ErrorCategory.PERMISSION:
            return 'Permission Error';
        default:
            return 'Error';
    }
}

