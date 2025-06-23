import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, View, Text } from 'react-native';
import React from 'react';

interface ErrorUtils {
    getGlobalHandler(): (error: Error, isFatal: boolean) => void;
    setGlobalHandler(handler: (error: Error, isFatal: boolean) => void): void;
}

declare global {
    interface Global {
        ErrorUtils?: ErrorUtils;
    }
}

export interface ErrorLog {
    id: string;
    timestamp: number;
    error: string;
    stack?: string;
    context?: string;
    userId?: string;
    deviceInfo: {
        platform: string;
        version: string;
    };
    appVersion: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

const ERROR_LOGS_KEY = 'error_logs';
const MAX_ERROR_LOGS = 100;

export class ErrorHandler {
    private static instance: ErrorHandler;
    private errorLogs: ErrorLog[] = [];
    private isInitialized = false;

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await this.loadErrorLogs();
            this.setupGlobalErrorHandlers();
            this.isInitialized = true;
            console.log('Error handler initialized');
        } catch (error) {
            console.error('Failed to initialize error handler:', error);
        }
    }

    private setupGlobalErrorHandlers(): void {
        if (typeof global !== 'undefined' && global.ErrorUtils) {
            const originalHandler = global.ErrorUtils.getGlobalHandler();

            global.ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
                this.logError(error, {
                    context: 'Global Error Handler',
                    severity: isFatal ? 'critical' : 'high',
                });

                if (originalHandler) {
                    originalHandler(error, isFatal);
                }
            });
        }
    }

    async logError(
        error: Error | string,
        options: {
            context?: string;
            severity?: 'low' | 'medium' | 'high' | 'critical';
            userId?: string;
        } = {},
    ): Promise<void> {
        try {
            const errorLog: ErrorLog = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                timestamp: Date.now(),
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
                context: options.context || 'Unknown',
                userId: options.userId,
                deviceInfo: {
                    platform: Platform.OS,
                    version: Platform.Version.toString(),
                },
                appVersion: '1.0.0', // Should be dynamic in real app
                severity: options.severity || 'medium',
            };

            // Add to memory
            this.errorLogs.unshift(errorLog);

            // Keep only the latest errors
            if (this.errorLogs.length > MAX_ERROR_LOGS) {
                this.errorLogs = this.errorLogs.slice(0, MAX_ERROR_LOGS);
            }

            // Save to storage
            await this.saveErrorLogs();

            // Log to console for development
            if (__DEV__) {
                console.error(
                    `[${errorLog.severity.toUpperCase()}] ${errorLog.context}:`,
                    errorLog.error,
                );
                if (errorLog.stack) {
                    console.error(errorLog.stack);
                }
            }

            // Send to crash reporting service in production
            if (!__DEV__ && errorLog.severity === 'critical') {
                await this.sendToCrashReporting(errorLog);
            }
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }
    }

    private async loadErrorLogs(): Promise<void> {
        try {
            const logsString = await AsyncStorage.getItem(ERROR_LOGS_KEY);
            if (logsString) {
                this.errorLogs = JSON.parse(logsString);
            }
        } catch (error) {
            console.error('Failed to load error logs:', error);
        }
    }

    private async saveErrorLogs(): Promise<void> {
        try {
            await AsyncStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(this.errorLogs));
        } catch (error) {
            console.error('Failed to save error logs:', error);
        }
    }

    private async sendToCrashReporting(errorLog: ErrorLog): Promise<void> {
        try {
            // In a real app, send to services like Sentry, Bugsnag, etc.
            console.log('Would send to crash reporting:', errorLog);
        } catch (error) {
            console.error('Failed to send to crash reporting:', error);
        }
    }

    getErrorLogs(limit?: number): ErrorLog[] {
        return limit ? this.errorLogs.slice(0, limit) : [...this.errorLogs];
    }

    getErrorsByContext(context: string): ErrorLog[] {
        return this.errorLogs.filter((log) => log.context === context);
    }

    getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): ErrorLog[] {
        return this.errorLogs.filter((log) => log.severity === severity);
    }

    async clearErrorLogs(): Promise<void> {
        try {
            this.errorLogs = [];
            await AsyncStorage.removeItem(ERROR_LOGS_KEY);
        } catch (error) {
            console.error('Failed to clear error logs:', error);
        }
    }

    async exportErrorLogs(): Promise<string> {
        try {
            return JSON.stringify(
                {
                    logs: this.errorLogs,
                    exportedAt: new Date().toISOString(),
                    totalErrors: this.errorLogs.length,
                    summary: {
                        critical: this.getErrorsBySeverity('critical').length,
                        high: this.getErrorsBySeverity('high').length,
                        medium: this.getErrorsBySeverity('medium').length,
                        low: this.getErrorsBySeverity('low').length,
                    },
                },
                null,
                2,
            );
        } catch (error) {
            throw new Error('Failed to export error logs');
        }
    }

    // Utility method for wrapping async functions with error handling
    wrapAsync<T extends any[], R>(
        fn: (...args: T) => Promise<R>,
        context: string,
        severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    ) {
        return async (...args: T): Promise<R | null> => {
            try {
                return await fn(...args);
            } catch (error) {
                await this.logError(error as Error, { context, severity });
                return null;
            }
        };
    }

    // Utility method for wrapping sync functions with error handling
    wrapSync<T extends any[], R>(
        fn: (...args: T) => R,
        context: string,
        severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    ) {
        return (...args: T): R | null => {
            try {
                return fn(...args);
            } catch (error) {
                this.logError(error as Error, { context, severity });
                return null;
            }
        };
    }
}

export const errorHandler = ErrorHandler.getInstance();

export const logError = (
    error: Error | string,
    context?: string,
    severity?: 'low' | 'medium' | 'high' | 'critical',
) => {
    errorHandler.logError(error, { context, severity });
};

interface ErrorBoundaryProps {
    error: Error;
    retry: () => void;
}

export const withErrorBoundary = <P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ComponentType<ErrorBoundaryProps>,
) => {
    return class ErrorBoundary extends React.Component<
        P,
        { hasError: boolean; error: Error | null }
    > {
        constructor(props: P) {
            super(props);
            this.state = { hasError: false, error: null };
        }

        static getDerivedStateFromError(error: Error) {
            return { hasError: true, error };
        }

        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
            errorHandler.logError(error, {
                context: `Component: ${Component.displayName || Component.name}`,
                severity: 'high',
            });
        }

        render(): React.ReactNode {
            if (this.state.hasError) {
                if (fallback) {
                    return React.createElement(fallback, {
                        error: this.state.error!,
                        retry: () => this.setState({ hasError: false, error: null }),
                    });
                }

                return React.createElement(
                    View,
                    { style: { padding: 20, alignItems: 'center' } },
                    React.createElement(Text, null, 'Something went wrong'),
                );
            }

            return React.createElement(Component, this.props);
        }
    };
};
