/**
 * Analytics Service
 * Tracks subscription events and user actions for business intelligence
 * Can be extended to integrate with analytics providers (Firebase Analytics, Mixpanel, etc.)
 */

export type SubscriptionEvent =
    | 'subscription_upgraded'
    | 'subscription_downgraded'
    | 'subscription_restored'
    | 'subscription_purchase_initiated'
    | 'subscription_purchase_completed'
    | 'subscription_purchase_failed'
    | 'subscription_purchase_cancelled'
    | 'subscription_expired'
    | 'subscription_renewed'
    | 'migration_started'
    | 'migration_completed'
    | 'migration_failed'
    | 'migration_retried';

export interface AnalyticsEvent {
    event: SubscriptionEvent;
    timestamp: string;
    userId?: string;
    properties?: Record<string, any>;
}

class AnalyticsService {
    private events: AnalyticsEvent[] = [];
    private maxEvents = 1000; // Keep last 1000 events in memory

    /**
     * Track a subscription event
     */
    track(event: SubscriptionEvent, properties?: Record<string, any>, userId?: string): void {
        const analyticsEvent: AnalyticsEvent = {
            event,
            timestamp: new Date().toISOString(),
            userId,
            properties,
        };

        this.events.push(analyticsEvent);

        // Keep only the last maxEvents
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }

        // Log to console in development
        if (__DEV__) {
            console.log('[Analytics]', event, properties);
        }

        // TODO: Integrate with analytics providers
        // Example: Firebase Analytics, Mixpanel, Amplitude, etc.
        // this.sendToProvider(analyticsEvent);
    }

    /**
     * Track subscription upgrade
     */
    trackUpgrade(userId?: string, properties?: Record<string, any>): void {
        this.track('subscription_upgraded', { ...properties, action: 'upgrade' }, userId);
    }

    /**
     * Track subscription downgrade
     */
    trackDowngrade(userId?: string, properties?: Record<string, any>): void {
        this.track('subscription_downgraded', { ...properties, action: 'downgrade' }, userId);
    }

    /**
     * Track subscription restore
     */
    trackRestore(userId?: string, success: boolean = true, properties?: Record<string, any>): void {
        this.track(
            'subscription_restored',
            { ...properties, success, action: 'restore' },
            userId,
        );
    }

    /**
     * Track purchase initiation
     */
    trackPurchaseInitiated(userId?: string, properties?: Record<string, any>): void {
        this.track('subscription_purchase_initiated', { ...properties, action: 'purchase_start' }, userId);
    }

    /**
     * Track purchase completion
     */
    trackPurchaseCompleted(userId?: string, properties?: Record<string, any>): void {
        this.track('subscription_purchase_completed', { ...properties, action: 'purchase_success' }, userId);
    }

    /**
     * Track purchase failure
     */
    trackPurchaseFailed(userId?: string, error?: string, properties?: Record<string, any>): void {
        this.track('subscription_purchase_failed', { ...properties, error, action: 'purchase_fail' }, userId);
    }

    /**
     * Track purchase cancellation
     */
    trackPurchaseCancelled(userId?: string, properties?: Record<string, any>): void {
        this.track('subscription_purchase_cancelled', { ...properties, action: 'purchase_cancel' }, userId);
    }

    /**
     * Track subscription expiration
     */
    trackExpiration(userId?: string, properties?: Record<string, any>): void {
        this.track('subscription_expired', { ...properties, action: 'expiration' }, userId);
    }

    /**
     * Track migration events
     */
    trackMigration(
        event: 'migration_started' | 'migration_completed' | 'migration_failed' | 'migration_retried',
        userId?: string,
        properties?: Record<string, any>,
    ): void {
        this.track(event, { ...properties, action: event }, userId);
    }

    /**
     * Get recent events (for debugging/analytics)
     */
    getRecentEvents(count: number = 50): AnalyticsEvent[] {
        return this.events.slice(-count);
    }

    /**
     * Get events by type
     */
    getEventsByType(event: SubscriptionEvent): AnalyticsEvent[] {
        return this.events.filter((e) => e.event === event);
    }

    /**
     * Clear all events (useful for testing)
     */
    clearEvents(): void {
        this.events = [];
    }

    /**
     * Get event statistics
     */
    getStatistics(): {
        totalEvents: number;
        eventsByType: Record<SubscriptionEvent, number>;
        lastEvent?: AnalyticsEvent;
    } {
        const eventsByType: Record<string, number> = {};
        
        this.events.forEach((event) => {
            eventsByType[event.event] = (eventsByType[event.event] || 0) + 1;
        });

        return {
            totalEvents: this.events.length,
            eventsByType: eventsByType as Record<SubscriptionEvent, number>,
            lastEvent: this.events[this.events.length - 1],
        };
    }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

