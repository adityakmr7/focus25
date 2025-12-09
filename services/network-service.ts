/**
 * Network Service
 * Monitors network status and manages offline state
 */

import * as Network from 'expo-network';
import { create } from 'zustand';

export interface NetworkState {
    isConnected: boolean;
    isInternetReachable: boolean;
    type: Network.NetworkStateType | null;
    setIsConnected: (isConnected: boolean) => void;
    setIsInternetReachable: (isReachable: boolean) => void;
    setNetworkType: (type: Network.NetworkStateType | null) => void;
    checkNetworkStatus: () => Promise<void>;
}

/**
 * Network status store
 */
export const useNetworkStore = create<NetworkState>((set) => ({
    isConnected: true,
    isInternetReachable: true,
    type: null,

    setIsConnected: (isConnected) => set({ isConnected }),
    setIsInternetReachable: (isInternetReachable) => set({ isInternetReachable }),
    setNetworkType: (type) => set({ type }),

    checkNetworkStatus: async () => {
        try {
            const networkState = await Network.getNetworkStateAsync();
            set({
                isConnected: networkState.isConnected ?? true,
                isInternetReachable: networkState.isInternetReachable ?? true,
                type: networkState.type ?? null,
            });
        } catch (error) {
            console.error('Failed to check network status:', error);
            // Default to connected if check fails
            set({
                isConnected: true,
                isInternetReachable: true,
                type: null,
            });
        }
    },
}));

/**
 * Network Service Class
 */
class NetworkService {
    private isInitialized = false;
    private checkInterval: NodeJS.Timeout | null = null;
    private listeners: Set<(isConnected: boolean) => void> = new Set();

    /**
     * Initialize network monitoring
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        // Initial check
        await this.checkStatus();

        // Set up periodic checks (every 30 seconds)
        this.checkInterval = setInterval(() => {
            this.checkStatus();
        }, 30000);

        this.isInitialized = true;
    }

    /**
     * Check current network status
     */
    async checkStatus(): Promise<void> {
        const { checkNetworkStatus } = useNetworkStore.getState();
        await checkNetworkStatus();

        const { isConnected } = useNetworkStore.getState();
        this.notifyListeners(isConnected);
    }

    /**
     * Get current network status
     */
    getStatus(): {
        isConnected: boolean;
        isInternetReachable: boolean;
        type: Network.NetworkStateType | null;
    } {
        const { isConnected, isInternetReachable, type } = useNetworkStore.getState();
        return { isConnected, isInternetReachable, type };
    }

    /**
     * Check if device is online
     */
    isOnline(): boolean {
        const { isConnected, isInternetReachable } = useNetworkStore.getState();
        return isConnected && isInternetReachable;
    }

    /**
     * Subscribe to network status changes
     */
    subscribe(listener: (isConnected: boolean) => void): () => void {
        this.listeners.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of network status change
     */
    private notifyListeners(isConnected: boolean): void {
        this.listeners.forEach((listener) => {
            try {
                listener(isConnected);
            } catch (error) {
                console.error('Error in network status listener:', error);
            }
        });
    }

    /**
     * Cleanup network monitoring
     */
    cleanup(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.listeners.clear();
        this.isInitialized = false;
    }
}

// Export singleton instance
export const networkService = new NetworkService();

