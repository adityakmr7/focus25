import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { iapService } from '@/services/iap-service';
import { proStatusService } from '@/services/pro-status-service';
import { useAuthStore } from './auth-store';

interface SubscriptionState {
    isPro: boolean;
    expiresAt?: string;
    isLoading: boolean;
    error?: string;

    // Actions
    checkProStatus: () => Promise<void>;
    purchasePro: () => Promise<boolean>;
    restorePurchases: () => Promise<boolean>;
    setProStatus: (isPro: boolean, expiresAt?: string) => void;
    clearError: () => void;
    identifyUser: (userId: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            isPro: false,
            isLoading: false,
            error: undefined,

            checkProStatus: async () => {
                const { user } = useAuthStore.getState();
                if (!user) {
                    console.log('No user authenticated, Pro status is false');
                    set({ isPro: false });
                    return;
                }

                set({ isLoading: true });
                try {
                    const status = await proStatusService.checkProStatus();
                    set({
                        isPro: status.isPro,
                        expiresAt: status.expiresAt,
                        isLoading: false,
                        error: undefined,
                    });
                    console.log('Pro status updated:', status);
                } catch (error) {
                    console.error('Failed to check Pro status:', error);
                    set({
                        isLoading: false,
                        isPro: false,
                        error:
                            error instanceof Error ? error.message : 'Failed to check Pro status',
                    });
                }
            },

            purchasePro: async () => {
                const { user } = useAuthStore.getState();
                if (!user) {
                    const error = 'Must be signed in to purchase Pro';
                    console.error(error);
                    set({ error });
                    return false;
                }

                set({ isLoading: true, error: undefined });

                try {
                    // Identify user to RevenueCat
                    await iapService.identifyUser(user.id);

                    const result = await iapService.purchaseSubscription();

                    if (!result.success) {
                        set({
                            isLoading: false,
                            error: result.error || 'Purchase failed',
                        });
                        return false;
                    }

                    if (result.customerInfo) {
                        // Get the entitlement to extract expiry
                        const entitlement = result.customerInfo.entitlements.active['pro'];

                        set({
                            isPro: true,
                            expiresAt: entitlement?.expirationDate || undefined,
                            isLoading: false,
                            error: undefined,
                        });
                        console.log('Pro purchase successful');
                        return true;
                    }

                    set({
                        isLoading: false,
                        error: 'No customer info received',
                    });
                    return false;
                } catch (error) {
                    console.error('Purchase error:', error);
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Purchase failed',
                    });
                    return false;
                }
            },

            restorePurchases: async () => {
                const { user } = useAuthStore.getState();
                if (!user) return false;

                set({ isLoading: true });

                try {
                    // Identify user first
                    await iapService.identifyUser(user.id);

                    const restored = await iapService.restorePurchases();

                    if (restored) {
                        // Recheck Pro status to update local state
                        await get().checkProStatus();
                    } else {
                        set({ isLoading: false });
                    }

                    return restored;
                } catch (error) {
                    console.error('Restore failed:', error);
                    set({
                        isLoading: false,
                        error:
                            error instanceof Error ? error.message : 'Failed to restore purchases',
                    });
                    return false;
                }
            },

            identifyUser: async (userId: string) => {
                try {
                    await iapService.identifyUser(userId);
                } catch (error) {
                    console.error('Failed to identify user:', error);
                }
            },

            setProStatus: (isPro, expiresAt) => {
                set({ isPro, expiresAt, error: undefined });
            },

            clearError: () => {
                set({ error: undefined });
            },
        }),
        {
            name: 'subscription-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                // Only persist Pro status, not loading/error states
                isPro: state.isPro,
                expiresAt: state.expiresAt,
            }),
        },
    ),
);
