/**
 * Error Toast Utility
 * Provides standardized toast notifications for errors and user feedback
 */

import { Alert } from 'react-native';
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

    const title = getErrorTitle(appError);
    Alert.alert(title, appError.userMessage);
}

/**
 * Show success toast
 */
export function showSuccess(message: string, title?: string): void {
    Alert.alert(title || 'Success', message);
}

/**
 * Show warning toast
 */
export function showWarning(message: string, title?: string): void {
    Alert.alert(title || 'Warning', message);
}

/**
 * Show info toast
 */
export function showInfo(message: string, title?: string): void {
    Alert.alert(title || 'Info', message);
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

    const title = getErrorTitle(appError);
    Alert.alert(title, appError.userMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: onRetry },
    ]);
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
