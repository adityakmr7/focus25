import { iapService } from '@/services/iap-service';

export interface ProStatus {
    isPro: boolean;
    expiresAt?: string;
    autoRenew?: boolean;
}

class ProStatusService {
    async checkProStatus(): Promise<ProStatus> {
        try {
            // RevenueCat handles all the status checking
            const isPro = await iapService.checkSubscriptionStatus();

            if (!isPro) {
                return { isPro: false };
            }

            // Get detailed customer info for expiration date
            const customerInfo = await iapService.getCustomerInfo();

            if (customerInfo) {
                const entitlement = customerInfo.entitlements.active['pro'];

                if (entitlement) {
                    return {
                        isPro: true,
                        expiresAt: entitlement.expirationDate || undefined,
                        autoRenew: entitlement.willRenew || false,
                    };
                }
            }

            return { isPro: false };
        } catch (error) {
            console.error('Failed to check Pro status:', error);
            return { isPro: false };
        }
    }

    // RevenueCat handles activation automatically, but we keep this for compatibility
    async activateProSubscription(transactionId: string, expiresAt: string): Promise<boolean> {
        try {
            // RevenueCat automatically handles this when the purchase succeeds
            console.log('Pro subscription activated by RevenueCat:', { transactionId, expiresAt });
            return true;
        } catch (error) {
            console.error('Failed to activate Pro:', error);
            return false;
        }
    }

    // Not needed with RevenueCat, but kept for compatibility
    async deactivateProSubscription(): Promise<void> {
        try {
            // RevenueCat automatically handles subscription status
            await iapService.logOut();
            console.log('Pro subscription deactivated');
        } catch (error) {
            console.error('Failed to deactivate Pro:', error);
        }
    }

    async updateSubscriptionExpiry(expiresAt: string): Promise<boolean> {
        try {
            // RevenueCat handles this automatically
            console.log('Subscription expiry updated by RevenueCat:', expiresAt);
            return true;
        } catch (error) {
            console.error('Failed to update expiry:', error);
            return false;
        }
    }
}

export const proStatusService = new ProStatusService();
