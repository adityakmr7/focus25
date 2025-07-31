import Focus25WidgetModuleModule from './Focus25WidgetModuleModule';
import { TimerData, WidgetConfiguration } from './Focus25WidgetModule.types';

/**
 * Updates the widget with new timer data
 */
export async function updateWidget(data: TimerData): Promise<void> {
    return Focus25WidgetModuleModule.updateWidget(data);
}

/**
 * Reloads all widget timelines
 */
export async function reloadWidgets(): Promise<void> {
    return Focus25WidgetModuleModule.reloadWidgets();
}

/**
 * Configures the widget with app group and other settings
 */
export async function configureWidget(config: WidgetConfiguration): Promise<void> {
    return Focus25WidgetModuleModule.configureWidget(config);
}

/**
 * Clears all widget data
 */
export async function clearWidgetData(): Promise<void> {
    return Focus25WidgetModuleModule.clearWidgetData();
}

/**
 * Gets current widget data (for debugging)
 */
export async function getWidgetData(): Promise<TimerData | null> {
    const data = await Focus25WidgetModuleModule.getWidgetData();
    if (!data) return null;

    return {
        sessionName: data.sessionName,
        timeRemaining: data.timeRemaining,
        isActive: data.isActive,
        progress: data.progress,
        totalDuration: data.totalDuration,
        elapsedTime: data.elapsedTime,
    };
}

export * from './Focus25WidgetModule.types';
