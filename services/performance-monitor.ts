/**
 * Performance Monitoring Service
 * Tracks app performance metrics including startup time, render times, and memory usage
 */

interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

class PerformanceMonitor {
    private metrics: Map<string, PerformanceMetric> = new Map();
    private appStartTime: number = Date.now();
    private isProduction = process.env.NODE_ENV === 'production';

    /**
     * Start tracking a performance metric
     */
    startMetric(name: string, metadata?: Record<string, any>): void {
        if (this.isProduction) return; // Only track in development

        this.metrics.set(name, {
            name,
            startTime: Date.now(),
            metadata,
        });
    }

    /**
     * End tracking a performance metric and log the result
     */
    endMetric(name: string, metadata?: Record<string, any>): number | null {
        if (this.isProduction) return null;

        const metric = this.metrics.get(name);
        if (!metric) {
            console.warn(`[PerformanceMonitor] Metric "${name}" not found`);
            return null;
        }

        const endTime = Date.now();
        const duration = endTime - metric.startTime;

        metric.endTime = endTime;
        metric.duration = duration;
        if (metadata) {
            metric.metadata = { ...metric.metadata, ...metadata };
        }

        // Log the metric
        this.logMetric(metric);

        return duration;
    }

    /**
     * Track app startup time
     */
    trackAppStartup(): void {
        const startupTime = Date.now() - this.appStartTime;
        console.log(`[PerformanceMonitor] App startup time: ${startupTime}ms`);
    }

    /**
     * Track time to interactive
     */
    trackTimeToInteractive(): void {
        const timeToInteractive = Date.now() - this.appStartTime;
        console.log(`[PerformanceMonitor] Time to interactive: ${timeToInteractive}ms`);
    }

    /**
     * Track component render
     */
    trackComponentRender(componentName: string, renderTime: number): void {
        if (this.isProduction) return;

        if (renderTime > 16) {
            // Warn if render takes longer than one frame (60fps = 16.67ms per frame)
            console.warn(
                `[PerformanceMonitor] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`,
            );
        }
    }

    /**
     * Track database query performance
     */
    trackDatabaseQuery(queryName: string, duration: number, metadata?: Record<string, any>): void {
        if (this.isProduction) return;

        if (duration > 100) {
            // Warn if query takes longer than 100ms
            console.warn(
                `[PerformanceMonitor] Slow database query "${queryName}": ${duration}ms`,
                metadata,
            );
        }
    }

    /**
     * Get memory usage (if available)
     */
    getMemoryUsage(): void {
        if (this.isProduction) return;

        // Note: Memory tracking is limited in React Native
        // This is a placeholder for future implementation with native modules
        console.log('[PerformanceMonitor] Memory tracking not yet implemented');
    }

    /**
     * Log a metric to console
     */
    private logMetric(metric: PerformanceMetric): void {
        const { name, duration, metadata } = metric;
        const metadataStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';

        if (duration && duration > 1000) {
            console.warn(`[PerformanceMonitor] ⚠️  ${name}: ${duration}ms${metadataStr}`);
        } else {
            console.log(`[PerformanceMonitor] ✓ ${name}: ${duration}ms${metadataStr}`);
        }
    }

    /**
     * Get all metrics
     */
    getAllMetrics(): PerformanceMetric[] {
        return Array.from(this.metrics.values());
    }

    /**
     * Clear all metrics
     */
    clearMetrics(): void {
        this.metrics.clear();
    }

    /**
     * Reset app start time (useful for testing)
     */
    resetAppStartTime(): void {
        this.appStartTime = Date.now();
    }
}

export const performanceMonitor = new PerformanceMonitor();
