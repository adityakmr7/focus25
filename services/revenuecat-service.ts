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
        if (this.initialized || Platform.OS !== 'ios') {
            return;
        }

        const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;

        if (!apiKey) {
            console.warn('[RevenueCatService] Missing EXPO_PUBLIC_REVENUECAT_API_KEY_IOS');
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
            const offering =
                offerings.all?.[offeringId] ??
                (offeringId === offerings.current?.identifier
                    ? offerings.current
                    : offerings.current);

            if (!offering) {
                return null;
            }

            if (!productId) {
                return offering.availablePackages?.[0] ?? null;
            }

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
}

export const revenueCatService = new RevenueCatService();
