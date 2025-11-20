import { supabase } from '@/configs/supabase-config';
import { AppleAuthService } from '@/services/apple-auth-service';
import { revenueCatService } from '@/services/revenuecat-service';
import { errorHandlingService } from '@/services/error-handling-service';
import { analyticsService } from '@/services/analytics-service';
import { showError, showSuccess } from '@/utils/error-toast';
import { SUBSCRIPTION_CONSTANTS } from '@/constants/subscription';
import { useSettingsStore } from '@/stores/local-settings-store';
import { todoMigrationService } from '@/services/todo-migration-service';
import { optionalSyncService } from '@/services/optional-sync-service';
import { useSupabaseTodoStore } from '@/stores/supabase-todo-store';
import { createSupabaseService } from '@/services/supabase-service';
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
            let syncInProgress = false; // Prevent concurrent Supabase syncs

            const applyProStatus = async (
                info: CustomerInfo | null,
                override?: boolean,
                previousProStatus?: boolean,
            ) => {
                const currentProStatus = get().isProUser;
                const hasPro =
                    override ??
                    (info
                        ? Boolean(info.entitlements?.active?.[entitlementId])
                        : revenueCatService.hasActiveEntitlement(entitlementId));

                const wasPro = previousProStatus ?? currentProStatus;
                const isUpgrading = !wasPro && hasPro;
                const isDowngrading = wasPro && !hasPro;

                set({ isProUser: hasPro });

                const settingsStore = useSettingsStore.getState();
                settingsStore.setHasProAccess(hasPro);

                const { user } = get();

                // Track subscription events
                if (isUpgrading) {
                    analyticsService.trackUpgrade(user?.id, {
                        timestamp: new Date().toISOString(),
                    });
                } else if (isDowngrading) {
                    analyticsService.trackDowngrade(user?.id, {
                        timestamp: new Date().toISOString(),
                    });
                }

                // Sync premium status to Supabase if user is authenticated
                // Use a flag to prevent concurrent syncs
                if (user && !syncInProgress) {
                    syncInProgress = true;
                    try {
                        const supabaseService = createSupabaseService(user.id);
                        await supabaseService.updateSettings({ hasProAccess: hasPro });
                        console.log('[AuthStore] Premium status synced to Supabase:', hasPro);
                    } catch (error: any) {
                        // Handle duplicate key errors gracefully (race condition)
                        if (error?.code === '23505') {
                            // Duplicate key - settings might have been created by another process
                            // Try to update again
                            try {
                                const supabaseService = createSupabaseService(user.id);
                                await supabaseService.updateSettings({ hasProAccess: hasPro });
                                console.log('[AuthStore] Premium status synced to Supabase (retry):', hasPro);
                            } catch (retryError) {
                                // Only log if retry also fails - but don't throw
                                console.warn(
                                    '[AuthStore] Failed to sync premium status to Supabase after retry:',
                                    retryError,
                                );
                            }
                        } else {
                            // Log other errors but don't fail - premium status update shouldn't be blocked
                            // Suppress configuration-related errors
                            const errorMessage = error?.message || String(error);
                            if (!errorMessage.includes('configuration')) {
                                console.warn(
                                    '[AuthStore] Failed to sync premium status to Supabase:',
                                    error,
                                );
                                errorHandlingService.processError(error, {
                                    action: 'AuthStore.applyProStatus.syncPremiumStatus',
                                });
                            }
                        }
                    } finally {
                        syncInProgress = false;
                    }
                }

                if (hasPro) {
                    if (!settingsStore.syncWithCloud) {
                        settingsStore.setSyncWithCloud(true);
                    }

                    // Initialize sync service for pro users
                    if (user) {
                        try {
                            await optionalSyncService.initialize();
                        } catch (error) {
                            console.error('[AuthStore] Failed to initialize sync service:', error);
                        }
                    }

                    // Migrate local todos to Supabase when upgrading to pro
                    if (isUpgrading && user) {
                        try {
                            console.log('[AuthStore] User upgraded to pro, starting migration...');
                            const migrationResult =
                                await todoMigrationService.migrateLocalTodosToSupabase(
                                    user.id,
                                    true,
                                );
                            if (migrationResult.migratedCount > 0) {
                                console.log(
                                    `[AuthStore] Successfully migrated ${migrationResult.migratedCount} todos to Supabase`,
                                );
                                // Refresh Supabase todo store after migration
                                useSupabaseTodoStore.getState().loadTodos();

                                // Track successful migration
                                analyticsService.trackMigration('migration_completed', user.id, {
                                    migratedCount: migrationResult.migratedCount,
                                    totalCount: migrationResult.totalCount,
                                });
                            } else if (!migrationResult.success) {
                                // Track failed migration
                                analyticsService.trackMigration('migration_failed', user.id, {
                                    errorCount: migrationResult.errorCount,
                                    totalCount: migrationResult.totalCount,
                                });
                            }
                            // Note: Migration errors are handled and shown to user by the migration service
                        } catch (error) {
                            console.error(
                                '[AuthStore] Failed to migrate todos to Supabase:',
                                error,
                            );
                            errorHandlingService.processError(error, {
                                action: 'AuthStore.applyProStatus.migrate',
                            });
                            // Don't throw - migration failure shouldn't block pro status update
                        }
                    }
                } else {
                    if (settingsStore.syncWithCloud) {
                        settingsStore.setSyncWithCloud(false);
                    }
                    if (settingsStore.isAccountBackedUp) {
                        settingsStore.setAccountBackedUp(false);
                    }

                    // Disable sync service when downgrading
                    if (isDowngrading) {
                        try {
                            await optionalSyncService.disableSync();
                            console.log('[AuthStore] Sync disabled due to pro downgrade');
                        } catch (error) {
                            console.error('[AuthStore] Failed to disable sync service:', error);
                        }
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
                    if (Platform.OS === 'ios' || Platform.OS === 'android') {
                        const existingInfo = revenueCatService.getCustomerInfo();
                        if (existingInfo) {
                            applyProStatus(existingInfo, undefined, get().isProUser);
                        }
                    } else {
                        applyProStatus(null, false, get().isProUser);
                    }

                    // Get initial session
                    supabase.auth.getSession().then(async ({ data: { session } }) => {
                        set({
                            user: session?.user ?? null,
                            session,
                            isInitialized: true,
                            loading: false,
                        });

                        // Update settings store with user info if signed in
                        if (session?.user) {
                            const settingsStore = useSettingsStore.getState();
                            const user = session.user;
                            
                            // Get display name from user metadata or email prefix
                            const displayName =
                                user.user_metadata?.display_name ||
                                (user.email ? user.email.split('@')[0] : '');
                            
                            // Get email from user object
                            const email = user.email || '';
                            
                            // Update settings store if values are available and different
                            if (displayName && displayName !== settingsStore.userName) {
                                settingsStore.setUserName(displayName);
                            }
                            if (email && email !== settingsStore.userEmail) {
                                settingsStore.setUserEmail(email);
                            }
                        }

                        // Identify user in RevenueCat if signed in
                        if (
                            (Platform.OS === 'ios' || Platform.OS === 'android') &&
                            session?.user?.id
                        ) {
                            const customerInfo = await revenueCatService.identifyUser(
                                session.user.id,
                            );
                            if (customerInfo) {
                                await applyProStatus(customerInfo, undefined, get().isProUser);
                            } else {
                                // Fallback: Try to load premium status from Supabase if RevenueCat fails
                                try {
                                    const supabaseService = createSupabaseService(session.user.id);
                                    const settings = await supabaseService.getSettings();
                                    if (settings?.hasProAccess) {
                                        // Only use Supabase value if RevenueCat didn't provide info
                                        // This is a fallback, RevenueCat is the source of truth
                                        console.log(
                                            '[AuthStore] Loaded premium status from Supabase as fallback',
                                        );
                                        await applyProStatus(
                                            null,
                                            settings.hasProAccess,
                                            get().isProUser,
                                        );
                                    }
                                } catch (error) {
                                    // Silently handle - RevenueCat is primary source
                                    console.error(
                                        '[AuthStore] Failed to load premium status from Supabase:',
                                        error,
                                    );
                                }
                            }
                        }
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

                        // Update settings store with user info when signed in
                        if (session?.user && event !== 'SIGNED_OUT') {
                            const settingsStore = useSettingsStore.getState();
                            const user = session.user;
                            
                            // Get display name from user metadata or email prefix
                            const displayName =
                                user.user_metadata?.display_name ||
                                (user.email ? user.email.split('@')[0] : '');
                            
                            // Get email from user object
                            const email = user.email || '';
                            
                            // Update settings store if values are available and different
                            if (displayName && displayName !== settingsStore.userName) {
                                settingsStore.setUserName(displayName);
                            }
                            if (email && email !== settingsStore.userEmail) {
                                settingsStore.setUserEmail(email);
                            }
                        }

                        // Identify user in RevenueCat when signed in, logout when signed out
                        if (Platform.OS === 'ios' || Platform.OS === 'android') {
                            if (session?.user?.id) {
                                const customerInfo = await revenueCatService.identifyUser(
                                    session.user.id,
                                );
                                if (customerInfo) {
                                    await applyProStatus(customerInfo, undefined, get().isProUser);
                                }
                            } else if (event === 'SIGNED_OUT') {
                                await revenueCatService.logoutUser();
                                await applyProStatus(null, false, get().isProUser);
                            }
                        }
                    });

                    let removeRevenueCatListener: (() => void) | undefined;
                    if (Platform.OS === 'ios' || Platform.OS === 'android') {
                        removeRevenueCatListener = revenueCatService.addCustomerInfoListener(
                            (info) => {
                                // Fire and forget - don't block listener
                                applyProStatus(info, undefined, get().isProUser).catch((error: any) => {
                                    const errorMessage = error?.message || String(error);
                                    // Don't log configuration errors
                                    if (
                                        !errorMessage.includes('configuration') &&
                                        !errorMessage.includes('offerings-empty') &&
                                        !errorMessage.includes('products registered')
                                    ) {
                                        console.warn(
                                            '[AuthStore] Error in pro status listener:',
                                            error,
                                        );
                                    }
                                });
                            },
                        );

                        // Refresh customer info - suppress configuration errors
                        revenueCatService.refreshCustomerInfo().then(async (info) => {
                            if (info) {
                                await applyProStatus(info, undefined, get().isProUser);
                            }
                        }).catch((error: any) => {
                            // Silently handle configuration errors
                            const errorMessage = error?.message || String(error);
                            if (
                                !errorMessage.includes('configuration') &&
                                !errorMessage.includes('offerings-empty') &&
                                !errorMessage.includes('products registered')
                            ) {
                                console.warn('[AuthStore] Failed to refresh customer info:', error);
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

                        // Update settings store with user name and email
                        const settingsStore = useSettingsStore.getState();
                        
                        // Get display name from sign-in, user metadata, or email prefix
                        const finalDisplayName =
                            displayName ||
                            user?.user_metadata?.display_name ||
                            (email ? email.split('@')[0] : '');
                        
                        // Get email from sign-in or user object
                        const finalEmail = email || user?.email || '';
                        
                        // Update settings store
                        if (finalDisplayName) {
                            settingsStore.setUserName(finalDisplayName);
                        }
                        if (finalEmail) {
                            settingsStore.setUserEmail(finalEmail);
                        }

                        // Identify user in RevenueCat after successful sign-in
                        if ((Platform.OS === 'ios' || Platform.OS === 'android') && user?.id) {
                            const customerInfo = await revenueCatService.identifyUser(user.id);
                            if (customerInfo) {
                                await applyProStatus(customerInfo, undefined, get().isProUser);
                            }
                        }

                        await get().refreshProStatus();
                        return { displayName: finalDisplayName, email: finalEmail };
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
                    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
                        await applyProStatus(null, false, get().isProUser);
                        return;
                    }

                    const info = await revenueCatService.refreshCustomerInfo();
                    if (info) {
                        await applyProStatus(info, undefined, get().isProUser);
                    } else {
                        await applyProStatus(null, undefined, get().isProUser);
                    }
                },

                // Sign out
                signOut: async () => {
                    set({ loading: true, error: null });
                    try {
                        const { error } = await supabase.auth.signOut();
                        if (error) throw error;

                        // Logout user from RevenueCat
                        if (Platform.OS === 'ios' || Platform.OS === 'android') {
                            await revenueCatService.logoutUser();
                        }

                        // Clear user info from settings store
                        const settingsStore = useSettingsStore.getState();
                        settingsStore.setUserName('');
                        settingsStore.setUserEmail('');

                        set({ user: null, session: null, loading: false });
                        await applyProStatus(null, false, get().isProUser);
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
