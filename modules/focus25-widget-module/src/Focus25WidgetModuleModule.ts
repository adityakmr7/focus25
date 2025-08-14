import { NativeModule, requireNativeModule } from 'expo';
import { Focus25WidgetModuleEvents } from './Focus25WidgetModule.types';

// Define the native module interface
declare class Focus25WidgetModule extends NativeModule<Focus25WidgetModuleEvents> {
    updateWidget(data: Record<string, unknown>): Promise<void>;
    reloadWidgets(): Promise<void>;
    configureWidget(config: Record<string, unknown>): Promise<void>;
    clearWidgetData(): Promise<void>;
    getWidgetData(): Promise<Record<string, unknown> | null>;
    startLiveActivity(data: Record<string, unknown>): Promise<void>;
    updateLiveActivity(data: Record<string, unknown>): Promise<void>;
    stopLiveActivity(): Promise<void>;
}

// Safely require the native module with error handling
let nativeModule: Focus25WidgetModule;

try {
    nativeModule = requireNativeModule<Focus25WidgetModule>('Focus25WidgetModule');
} catch (error) {
    console.warn('Focus25WidgetModule not available:', error);
    // Create a mock module for fallback
    nativeModule = {
        updateWidget: async () => Promise.resolve(),
        reloadWidgets: async () => Promise.resolve(),
        configureWidget: async () => Promise.resolve(),
        clearWidgetData: async () => Promise.resolve(),
        getWidgetData: async () => Promise.resolve(null),
        startLiveActivity: async () => Promise.resolve(),
        updateLiveActivity: async () => Promise.resolve(),
        stopLiveActivity: async () => Promise.resolve(),
    } as any;
}

export default nativeModule;
