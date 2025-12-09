import { Platform } from 'react-native';
import Purchases, {
    LOG_LEVEL,
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage,
} from 'react-native-purchases';
import { errorHandlingService } from './error-handling-service';
import { getErrorMessage, isConfigurationError } from '@/utils/type-guards';

type CustomerInfoListener = (info: CustomerInfo) => void;

class RevenueCatService {
    private initialized = false;
    private listeners = new Set<CustomerInfoListener>();
    private customerInfo: CustomerInfo | null = null;

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        let apiKey: string | undefined;

        if (Platform.OS === 'ios') {
            apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
            if (!apiKey) {
                console.warn('[RevenueCatService] Missing EXPO_PUBLIC_REVENUECAT_API_KEY_IOS');
                return;
            }
        } else if (Platform.OS === 'android') {
            apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;
            if (!apiKey) {
                console.warn('[RevenueCatService] Missing EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID');
                return;
            }
        } else if (Platform.OS === 'web') {
            // Web platform - use mock implementation for development/testing
            console.warn('[RevenueCatService] Web platform detected - using mock implementation (free user)');
            this.initialized = true;
            this.customerInfo = null; // Mock free user
            return;
        } else {
            console.warn('[RevenueCatService] Unsupported platform:', Platform.OS);
            return;
        }

        try {
            // Use ERROR level to suppress warnings in Expo Go (StoreKit only works in dev builds)
            Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.ERROR : LOG_LEVEL.WARN);
            await Purchases.configure({ apiKey });

            // Fetch initial customer info and cache it.
            // Suppress errors if offerings are not configured (expected in development)
            try {
                this.customerInfo = await Purchases.getCustomerInfo();
                this.notifyListeners(this.customerInfo);
            } catch (customerInfoError) {
                if (isConfigurationError(customerInfoError)) {
                    // Configuration issue - expected in development, just log as warning
                    console.warn(
                        '[RevenueCatService] Configuration issue detected (expected in development):',
                        getErrorMessage(customerInfoError),
                    );
                } else {
                    // Other errors should be logged
                    console.warn('[RevenueCatService] Failed to get customer info:', customerInfoError);
                }
            }

            // Listen for future updates.
            Purchases.addCustomerInfoUpdateListener((info) => {
                this.customerInfo = info;
                this.notifyListeners(info);
            });

            this.initialized = true;
        } catch (error) {
            // Don't log configuration errors as errors - they're expected in development
            if (isConfigurationError(error)) {
                console.warn(
                    '[RevenueCatService] Configuration issue during initialization (expected in development):',
                    getErrorMessage(error),
                );
                // Still mark as initialized so app can continue
                this.initialized = true;
            } else {
                errorHandlingService.processError(error, { action: 'RevenueCat.initialize' });
            }
        }
    }

    getCustomerInfo(): CustomerInfo | null {
        return this.customerInfo;
    }

    async refreshCustomerInfo(): Promise<CustomerInfo | null> {
        try {
            this.customerInfo = await Purchases.getCustomerInfo();
            this.notifyListeners(this.customerInfo);
            return this.customerInfo;
        } catch (error) {
            // Don't log configuration errors - they're expected in development
            if (isConfigurationError(error)) {
                // Silently return null for configuration issues
                return null;
            }
            errorHandlingService.processError(error, { action: 'RevenueCat.refreshCustomerInfo' });
            return null;
        }
    }

    async getOfferings(): Promise<PurchasesOffering | null> {
        try {
            const offerings = await Purchases.getOfferings();
            
            // Check if offerings are empty (configuration issue)
            if (!offerings.current && (!offerings.all || Object.keys(offerings.all).length === 0)) {
                console.warn(
                    '[RevenueCatService] No offerings available. This is likely a configuration issue:\n' +
                    '• Products may not be configured in App Store Connect\n' +
                    '• StoreKit Configuration file may not be set up\n' +
                    '• RevenueCat dashboard may not be properly configured\n' +
                    'See: https://rev.cat/why-are-offerings-empty',
                );
                return null;
            }
            
            return offerings.current ?? null;
        } catch (error) {
            // Check if it's a configuration error
            if (isConfigurationError(error)) {
                console.warn(
                    '[RevenueCatService] Configuration error detected. This is normal in development if:\n' +
                    '• Products are not set up in App Store Connect\n' +
                    '• StoreKit Configuration file is not configured\n' +
                    '• RevenueCat dashboard is not properly linked\n' +
                    'Error:', getErrorMessage(error),
                );
                // Don't log as error in development - it's expected
                if (!__DEV__) {
                    errorHandlingService.processError(error, { action: 'RevenueCat.getOfferings' });
                }
            } else {
                errorHandlingService.processError(error, { action: 'RevenueCat.getOfferings' });
            }
            return null;
        }
    }

    async getPackageForProduct(
        offeringId: string,
        productId?: string,
    ): Promise<PurchasesPackage | null> {
        try {
            const offerings = await Purchases.getOfferings();

            // Check if offerings are empty (configuration issue)
            if (!offerings.current && (!offerings.all || Object.keys(offerings.all).length === 0)) {
                console.warn(
                    '[RevenueCatService] No offerings available when getting package. Configuration issue detected.',
                );
                return null;
            }

            // First, try to get the specific offering by ID from all offerings
            let offering: PurchasesOffering | null = offerings.all?.[offeringId] ?? null;

            // If not found and the offeringId matches the current offering, use current
            if (!offering && offeringId === offerings.current?.identifier) {
                offering = offerings.current;
            }

            // If still not found, fallback to current offering
            if (!offering) {
                offering = offerings.current ?? null;
            }

            if (!offering) {
                return null;
            }

            // If no productId specified, return the first available package
            if (!productId) {
                return offering.availablePackages?.[0] ?? null;
            }

            // Find the specific package by productId
            return offering.availablePackages?.find((pkg) => pkg.identifier === productId) ?? null;
        } catch (error) {
            // Check if it's a configuration error
            if (isConfigurationError(error)) {
                console.warn(
                    '[RevenueCatService] Configuration error when getting package. This is normal in development.',
                );
                // Don't log as error in development - it's expected
                if (!__DEV__) {
                    errorHandlingService.processError(error, {
                        action: 'RevenueCat.getPackageForProduct',
                    });
                }
            } else {
                errorHandlingService.processError(error, {
                    action: 'RevenueCat.getPackageForProduct',
                });
            }
            return null;
        }
    }

    async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            this.customerInfo = customerInfo;
            this.notifyListeners(customerInfo);
            return customerInfo;
        } catch (error) {
            // Ignore cancellations.
            if (typeof error === 'object' && error !== null && 'userCancelled' in error && (error as any).userCancelled) {
                return this.customerInfo;
            }

            errorHandlingService.processError(error, { action: 'RevenueCat.purchasePackage' });
            throw error;
        }
    }

    addCustomerInfoListener(listener: CustomerInfoListener): () => void {
        this.listeners.add(listener);
        if (this.customerInfo) {
            listener(this.customerInfo);
        }

        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners(info: CustomerInfo | null) {
        if (!info) return;
        this.listeners.forEach((listener) => {
            try {
                listener(info);
            } catch (error) {
                errorHandlingService.processError(error, {
                    action: 'RevenueCat.listener',
                });
            }
        });
    }

    hasActiveEntitlement(entitlementId: string): boolean {
        return Boolean(this.customerInfo?.entitlements?.active?.[entitlementId]);
    }

    async identifyUser(userId: string): Promise<CustomerInfo | null> {
        if (!this.initialized) {
            console.warn('[RevenueCatService] Cannot identify user: RevenueCat not initialized');
            return null;
        }

        try {
            const { customerInfo } = await Purchases.logIn(userId);
            this.customerInfo = customerInfo;
            this.notifyListeners(customerInfo);
            return customerInfo;
        } catch (error) {
            // Don't log configuration errors - they're expected in development
            if (isConfigurationError(error)) {
                // Silently return null for configuration issues
                return null;
            }
            errorHandlingService.processError(error, { action: 'RevenueCat.identifyUser' });
            return null;
        }
    }

    async logoutUser(): Promise<void> {
        if (!this.initialized) {
            return;
        }

        try {
            const customerInfo = await Purchases.logOut();
            this.customerInfo = customerInfo;
            this.notifyListeners(customerInfo);
        } catch (error) {
            errorHandlingService.processError(error, { action: 'RevenueCat.logoutUser' });
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    async restorePurchases(): Promise<CustomerInfo | null> {
        if (!this.initialized) {
            console.warn('[RevenueCatService] Cannot restore purchases: RevenueCat not initialized');
            return null;
        }

        try {
            const customerInfo = await Purchases.restorePurchases();
            this.customerInfo = customerInfo;
            this.notifyListeners(customerInfo);
            return customerInfo;
        } catch (error) {
            errorHandlingService.processError(error, { action: 'RevenueCat.restorePurchases' });
            return null;
        }
    }

    /**
     * Get subscription details from CustomerInfo
     * Returns subscription status, expiry date, and renewal info
     */
    getSubscriptionDetails(entitlementId: string): {
        isActive: boolean;
        expiryDate: Date | null;
        willRenew: boolean;
        productIdentifier: string | null;
    } {
        if (!this.customerInfo) {
            return {
                isActive: false,
                expiryDate: null,
                willRenew: false,
                productIdentifier: null,
            };
        }

        const entitlement = this.customerInfo.entitlements.active[entitlementId];
        
        if (!entitlement) {
            // Check if there's an inactive entitlement (expired)
            const inactiveEntitlement = this.customerInfo.entitlements.all[entitlementId];
            return {
                isActive: false,
                expiryDate: inactiveEntitlement?.expirationDate 
                    ? new Date(inactiveEntitlement.expirationDate) 
                    : null,
                willRenew: false,
                productIdentifier: inactiveEntitlement?.productIdentifier ?? null,
            };
        }

        return {
            isActive: true,
            expiryDate: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
            willRenew: entitlement.willRenew ?? false,
            productIdentifier: entitlement.productIdentifier ?? null,
        };
    }

    /**
     * Get the price of a package from the current offering
     */
    async getPackagePrice(offeringId: string, productId?: string): Promise<string | null> {
        try {
            const pkg = await this.getPackageForProduct(offeringId, productId);
            if (!pkg) {
                // Configuration issue - return null gracefully
                return null;
            }
            
            return pkg.product.priceString ?? null;
        } catch (error) {
            // Silently handle configuration errors
            if (!isConfigurationError(error)) {
                console.error('[RevenueCatService] Error getting package price:', error);
            }
            return null;
        }
    }

    /**
     * Get subscription period information from a package
     * Returns subscription period in a human-readable format
     */
    async getSubscriptionPeriod(offeringId: string, productId?: string): Promise<string | null> {
        try {
            const pkg = await this.getPackageForProduct(offeringId, productId);
            if (!pkg) {
                return null;
            }

            // Get subscription period from product
            const product = pkg.product;
            
            // Check if product has subscription period information
            // RevenueCat product may have subscriptionPeriod property (if available in types)
            // We'll use type assertion to access it safely
            const productAny = product as any;
            if (productAny.subscriptionPeriod) {
                const period = String(productAny.subscriptionPeriod);
                // period might be in ISO 8601 duration format (e.g., "P1M" for 1 month)
                if (period.includes('M')) {
                    const months = parseInt(period.replace(/[^0-9]/g, '')) || 1;
                    return months === 1 ? 'Monthly' : `${months} months`;
                } else if (period.includes('Y')) {
                    const years = parseInt(period.replace(/[^0-9]/g, '')) || 1;
                    return years === 1 ? 'Yearly' : `${years} years`;
                } else if (period.includes('W')) {
                    const weeks = parseInt(period.replace(/[^0-9]/g, '')) || 1;
                    return weeks === 1 ? 'Weekly' : `${weeks} weeks`;
                } else if (period.includes('D')) {
                    const days = parseInt(period.replace(/[^0-9]/g, '')) || 1;
                    return days === 1 ? 'Daily' : `${days} days`;
                }
            }

            // Fallback: check product identifier for common patterns
            const identifier = product.identifier?.toLowerCase() || '';
            if (identifier.includes('month') || identifier.includes('monthly')) {
                return 'Monthly';
            } else if (identifier.includes('year') || identifier.includes('yearly') || identifier.includes('annual')) {
                return 'Yearly';
            } else if (identifier.includes('week') || identifier.includes('weekly')) {
                return 'Weekly';
            }

            // Default to monthly if we can't determine (based on app's subscription model)
            return 'Monthly';
        } catch (error) {
            // Silently handle configuration errors
            if (!isConfigurationError(error)) {
                console.error('[RevenueCatService] Error getting subscription period:', error);
            }
            // Default to monthly (based on app's subscription model)
            return 'Monthly';
        }
    }

    /**
     * Get full package information including price and period
     */
    async getPackageInfo(offeringId: string, productId?: string): Promise<{
        price: string | null;
        period: string | null;
        priceString: string | null;
    }> {
        try {
            const pkg = await this.getPackageForProduct(offeringId, productId);
            if (!pkg) {
                return {
                    price: null,
                    period: null,
                    priceString: null,
                };
            }

            const price = pkg.product.priceString ?? null;
            const period = await this.getSubscriptionPeriod(offeringId, productId);
            
            // Create a formatted price string with period
            let priceString = price;
            if (price && period) {
                const periodLower = period.toLowerCase();
                if (periodLower.includes('month')) {
                    priceString = `${price}/month`;
                } else if (periodLower.includes('year')) {
                    priceString = `${price}/year`;
                } else if (periodLower.includes('week')) {
                    priceString = `${price}/week`;
                } else {
                    priceString = `${price}/${period.toLowerCase()}`;
                }
            }

            return {
                price,
                period,
                priceString,
            };
        } catch (error) {
            return {
                price: null,
                period: null,
                priceString: null,
            };
        }
    }
}

export const revenueCatService = new RevenueCatService();
