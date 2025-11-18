import { supabase } from '@/configs/supabase-config';
import { AppleAuthService } from '@/services/apple-auth-service';
import { revenueCatService } from '@/services/revenuecat-service';
import { errorHandlingService, AuthenticationError } from '@/services/error-handling-service';
import { showError, showSuccess } from '@/utils/error-toast';
import { SUBSCRIPTION_CONSTANTS } from '@/constants/subscription';
import { useSettingsStore } from '@/stores/local-settings-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import type { CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isInitialized: boolean;
    error: string | null;
    isOffline: boolean;
    isProUser: boolean;

    // Actions
    signInWithApple: () => Promise<{ displayName: string; email: string }>;
    signOut: () => Promise<void>;
    updateUserProfile: (displayName: string) => Promise<void>;
    initializeAuth: () => () => void; // Returns cleanup function
    clearError: () => void;
    setOffline: (isOffline: boolean) => void;
    refreshProStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => {
            const entitlementId = SUBSCRIPTION_CONSTANTS.PRO_ENTITLEMENT_ID;

            const applyProStatus = (info: CustomerInfo | null, override?: boolean) => {
                const hasPro =
                    override ??
                    (info
                        ? Boolean(info.entitlements?.active?.[entitlementId])
                        : revenueCatService.hasActiveEntitlement(entitlementId));

                set({ isProUser: hasPro });

                const settingsStore = useSettingsStore.getState();
                settingsStore.setHasProAccess(hasPro);

                if (hasPro) {
                    if (!settingsStore.syncWithCloud) {
                        settingsStore.setSyncWithCloud(true);
                    }
                } else {
                    if (settingsStore.syncWithCloud) {
                        settingsStore.setSyncWithCloud(false);
                    }
                    if (settingsStore.isAccountBackedUp) {
                        settingsStore.setAccountBackedUp(false);
                    }
                }
            };

            return {
                user: null,
                session: null,
                loading: false,
                isInitialized: false,
                error: null,
                isOffline: false,
                isProUser: false,

                // Initialize auth state listener
                initializeAuth: () => {
                    // Ensure cached pro status reflects latest customer info
                    if (Platform.OS === 'ios') {
                        const existingInfo = revenueCatService.getCustomerInfo();
                        if (existingInfo) {
                            applyProStatus(existingInfo);
                        }
                    } else {
                        applyProStatus(null, false);
                    }

                    // Get initial session
                    supabase.auth.getSession().then(({ data: { session } }) => {
                        set({
                            user: session?.user ?? null,
                            session,
                            isInitialized: true,
                            loading: false,
                        });
                    });

                    // Listen for auth changes
                    const {
                        data: { subscription },
                    } = supabase.auth.onAuthStateChange(async (event, session) => {
                        console.log('Auth state changed:', event, session?.user?.email);
                        set({
                            user: session?.user ?? null,
                            session,
                            loading: false,
                            isInitialized: true,
                            error: null,
                        });
                    });

                    let removeRevenueCatListener: (() => void) | undefined;
                    if (Platform.OS === 'ios') {
                        removeRevenueCatListener = revenueCatService.addCustomerInfoListener(
                            (info) => applyProStatus(info),
                        );

                        revenueCatService.refreshCustomerInfo().then((info) => {
                            if (info) {
                                applyProStatus(info);
                            }
                        });
                    }

                    // Return cleanup function
                    return () => {
                        subscription.unsubscribe();
                        if (removeRevenueCatListener) {
                            removeRevenueCatListener();
                        }
                    };
                },

                // Clear error
                clearError: () => set({ error: null }),

                // Set offline state
                setOffline: (isOffline: boolean) => set({ isOffline }),

                // Apple sign-in
                signInWithApple: async () => {
                    set({ loading: true, error: null });
                    try {
                        const { user, displayName, email } =
                            await new AppleAuthService().signInWithApple();
                        set({ user, loading: false });
                        await get().refreshProStatus();
                        return { displayName, email };
                    } catch (error: any) {
                        // Don't log or set error for user cancellations
                        const isCancellation =
                            error?.code === 'ERR_REQUEST_CANCELED' ||
                            error?.message?.toLowerCase().includes('cancel');

                        if (!isCancellation) {
                            const appError = errorHandlingService.processError(error, {
                                action: 'signInWithApple',
                            });
                            set({
                                error: appError.userMessage || 'Apple Sign-In failed',
                                loading: false,
                            });
                            showError(error, { action: 'signInWithApple' });
                        } else {
                            // Clear error state for cancellations (silent errors)
                            set({ error: null, loading: false });
                        }
                        throw error;
                    }
                },

                refreshProStatus: async () => {
                    if (Platform.OS !== 'ios') {
                        applyProStatus(null, false);
                        return;
                    }

                    const info = await revenueCatService.refreshCustomerInfo();
                    if (info) {
                        applyProStatus(info);
                    } else {
                        applyProStatus(null);
                    }
                },

                // Sign out
                signOut: async () => {
                    set({ loading: true, error: null });
                    try {
                        const { error } = await supabase.auth.signOut();
                        if (error) throw error;
                        set({ user: null, session: null, loading: false });
                        applyProStatus(null, false);
                        showSuccess('Signed out successfully');
                    } catch (error: any) {
                        const appError = errorHandlingService.processError(error, {
                            action: 'signOut',
                        });
                        set({
                            error: appError.userMessage || 'Failed to sign out',
                            loading: false,
                        });
                        showError(error, { action: 'signOut' });
                        throw error;
                    }
                },

                // Update user profile
                updateUserProfile: async (displayName: string) => {
                    const { user } = get();
                    if (!user) throw new Error('No user signed in');

                    set({ loading: true, error: null });
                    try {
                        const { error } = await supabase.auth.updateUser({
                            data: { display_name: displayName },
                        });
                        if (error) throw error;
                        set({ loading: false });
                        showSuccess('Profile updated successfully');
                    } catch (error: any) {
                        const appError = errorHandlingService.processError(error, {
                            action: 'updateUserProfile',
                        });
                        set({
                            error: appError.userMessage || 'Failed to update profile',
                            loading: false,
                        });
                        showError(error, { action: 'updateUserProfile' });
                        throw error;
                    }
                },
            };
        },
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                session: state.session,
                isInitialized: state.isInitialized,
                isProUser: state.isProUser,
            }),
        },
    ),
);
