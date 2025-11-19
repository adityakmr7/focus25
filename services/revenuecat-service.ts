import { Platform } from 'react-native';
import Purchases, {
    LOG_LEVEL,
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage,
} from 'react-native-purchases';
import { errorHandlingService } from './error-handling-service';

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
        } else {
            console.warn('[RevenueCatService] Unsupported platform:', Platform.OS);
            return;
        }

        try {
            Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
            await Purchases.configure({ apiKey });

            // Fetch initial customer info and cache it.
            this.customerInfo = await Purchases.getCustomerInfo();
            this.notifyListeners(this.customerInfo);

            // Listen for future updates.
            Purchases.addCustomerInfoUpdateListener((info) => {
                this.customerInfo = info;
                this.notifyListeners(info);
            });

            this.initialized = true;
        } catch (error) {
            errorHandlingService.processError(error, { action: 'RevenueCat.initialize' });
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
            errorHandlingService.processError(error, { action: 'RevenueCat.refreshCustomerInfo' });
            return null;
        }
    }

    async getOfferings(): Promise<PurchasesOffering | null> {
        try {
            const offerings = await Purchases.getOfferings();
            return offerings.current ?? null;
        } catch (error) {
            errorHandlingService.processError(error, { action: 'RevenueCat.getOfferings' });
            return null;
        }
    }

    async getPackageForProduct(
        offeringId: string,
        productId?: string,
    ): Promise<PurchasesPackage | null> {
        try {
            const offerings = await Purchases.getOfferings();

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
            errorHandlingService.processError(error, { action: 'RevenueCat.getPackageForProduct' });
            return null;
        }
    }

    async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            this.customerInfo = customerInfo;
            this.notifyListeners(customerInfo);
            return customerInfo;
        } catch (error: any) {
            // Ignore cancellations.
            if (error?.userCancelled) {
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
}

export const revenueCatService = new RevenueCatService();
