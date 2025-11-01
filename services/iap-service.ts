import { Platform } from 'react-native';
import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
} from 'react-native-purchases';

// RevenueCat Entitlement ID - configure this in RevenueCat dashboard
const ENTITLEMENT_ID = 'pro';
const API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';
const API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '';

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

class IAPService {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Detect platform and configure accordingly
      if (Platform.OS === 'ios') {
        if (!API_KEY_IOS) {
          console.error('RevenueCat iOS API key not configured');
          return false;
        }
        await Purchases.configure({ apiKey: API_KEY_IOS });
      } else if (Platform.OS === 'android') {
        if (!API_KEY_ANDROID) {
          console.error('RevenueCat Android API key not configured');
          return false;
        }
        await Purchases.configure({ apiKey: API_KEY_ANDROID });
      }

      this.isInitialized = true;
      console.log('RevenueCat SDK initialized');
      return true;
    } catch (error) {
      console.error('RevenueCat initialization failed:', error);
      return false;
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    if (!this.isInitialized) await this.initialize();

    try {
      const offerings = await Purchases.getOfferings();
      
      // Return the current offering (configure one active offering in RevenueCat)
      if (offerings.current !== null) {
        console.log('Available offerings:', offerings.current);
        return offerings.current;
      }

      console.log('No current offering available');
      return null;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<PurchaseResult> {
    if (!this.isInitialized) await this.initialize();

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      console.log('Purchase successful:', customerInfo);

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      // Handle user cancellation
      if (error instanceof PurchasesError && error.userCancelled) {
        return {
          success: false,
          error: 'Purchase cancelled by user',
        };
      }

      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  async purchaseSubscription(): Promise<PurchaseResult> {
    if (!this.isInitialized) await this.initialize();

    try {
      const offering = await this.getOfferings();
      
      if (!offering) {
        return {
          success: false,
          error: 'No subscriptions available',
        };
      }

      // Get the first available package (monthly subscription)
      const monthlyPackage = offering.monthly;
      
      if (!monthlyPackage) {
        return {
          success: false,
          error: 'Monthly package not found',
        };
      }

      return await this.purchasePackage(monthlyPackage);
    } catch (error: any) {
      console.error('Subscription purchase failed:', error);
      return {
        success: false,
        error: error.message || 'Subscription purchase failed',
      };
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (!this.isInitialized) await this.initialize();

    try {
      const customerInfo = await Purchases.restorePurchases();
      console.log('Purchases restored:', customerInfo);
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isInitialized) await this.initialize();

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      if (!customerInfo) return false;

      // Check if user has active entitlement
      const isActive = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      
      console.log('Subscription status:', { isActive });
      return isActive;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  async identifyUser(userId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize();

    try {
      await Purchases.logIn(userId);
      console.log('User identified:', userId);
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  async logOut(): Promise<void> {
    if (!this.isInitialized) await this.initialize();

    try {
      await Purchases.logOut();
      console.log('User logged out');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }
}

export const iapService = new IAPService();
