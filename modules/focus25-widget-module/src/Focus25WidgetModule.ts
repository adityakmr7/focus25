import Focus25WidgetModuleModule from './Focus25WidgetModuleModule';
import { TimerData, WidgetConfiguration } from './Focus25WidgetModule.types';

// Check if module is available
const isModuleAvailable = Focus25WidgetModuleModule && typeof Focus25WidgetModuleModule === 'object';

/**
 * Updates the widget with new timer data
 */
export async function updateWidget(data: TimerData): Promise<void> {
    if (!isModuleAvailable) {
        console.warn('Focus25WidgetModule not available, skipping updateWidget');
        return;
    }
    return Focus25WidgetModuleModule.updateWidget(data as unknown as Record<string, unknown>);
}

/**
 * Reloads all widget timelines
 */
export async function reloadWidgets(): Promise<void> {
    if (!isModuleAvailable) {
        console.warn('Focus25WidgetModule not available, skipping reloadWidgets');
        return;
    }
    return Focus25WidgetModuleModule.reloadWidgets();
}

/**
 * Configures the widget with app group and other settings
 */
export async function configureWidget(config: WidgetConfiguration): Promise<void> {
    if (!isModuleAvailable) {
        console.warn('Focus25WidgetModule not available, skipping configureWidget');
        return;
    }
    return Focus25WidgetModuleModule.configureWidget(config as unknown as Record<string, unknown>);
}

/**
 * Clears all widget data
 */
export async function clearWidgetData(): Promise<void> {
    if (!isModuleAvailable) {
        console.warn('Focus25WidgetModule not available, skipping clearWidgetData');
        return;
    }
    return Focus25WidgetModuleModule.clearWidgetData();
}

/**
 * Gets current widget data (for debugging)
 */
export async function getWidgetData(): Promise<TimerData | null> {
    if (!isModuleAvailable) {
        console.warn('Focus25WidgetModule not available, skipping getWidgetData');
        return null;
    }
    const data = await Focus25WidgetModuleModule.getWidgetData();
    if (!data) return null;

    return {
        sessionName: data.sessionName as string,
        timeRemaining: data.timeRemaining as string,
        isActive: data.isActive as boolean,
        progress: data.progress as number,
        totalDuration: data.totalDuration as number,
        elapsedTime: data.elapsedTime as number,
    };
}

/**
 * Starts a Live Activity for the Dynamic Island
 */
export async function startLiveActivity(data: TimerData): Promise<void> {
    if (!isModuleAvailable) {
        console.warn('Focus25WidgetModule not available, skipping startLiveActivity');
        return;
    }
    return Focus25WidgetModuleModule.startLiveActivity(data as unknown as Record<string, unknown>);
}

/**
 * Updates the Live Activity with new timer data
 */
export async function updateLiveActivity(data: TimerData): Promise<void> {
    if (!isModuleAvailable) {
        console.warn('Focus25WidgetModule not available, skipping updateLiveActivity');
        return;
    }
    return Focus25WidgetModuleModule.updateLiveActivity(data as unknown as Record<string, unknown>);
}

/**
 * Stops the Live Activity
 */
export async function stopLiveActivity(): Promise<void> {
    if (!isModuleAvailable) {
        console.warn('Focus25WidgetModule not available, skipping stopLiveActivity');
        return;
    }
    return Focus25WidgetModuleModule.stopLiveActivity();
}

export * from './Focus25WidgetModule.types';
