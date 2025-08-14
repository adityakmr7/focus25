export type Focus25WidgetModuleEvents = {
    onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
    value: string;
};

export interface TimerData {
    sessionName: string;
    timeRemaining: string;
    isActive: boolean;
    progress: number; // 0.0 to 1.0
    totalDuration?: number; // in seconds
    elapsedTime?: number; // in seconds
}

export interface WidgetConfiguration {
    appGroupId: string;
    widgetKind: string;
}
