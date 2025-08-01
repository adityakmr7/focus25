import { NativeModule, requireNativeModule } from 'expo';
import { Focus25WidgetModuleEvents } from './Focus25WidgetModule.types';

// Define the native module interface
declare class Focus25WidgetModule extends NativeModule<Focus25WidgetModuleEvents> {
    updateWidget(data: Record<string, unknown>): Promise<void>;
    reloadWidgets(): Promise<void>;
    configureWidget(config: Record<string, unknown>): Promise<void>;
    clearWidgetData(): Promise<void>;
    getWidgetData(): Promise<Record<string, unknown> | null>;
}

export default requireNativeModule<Focus25WidgetModule>('Focus25WidgetModule');
