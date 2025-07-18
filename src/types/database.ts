export interface Goal {
    id: string;
    title: string;
    description?: string;
    category: GoalCategory;
    type: GoalType;
    target: number;
    current: number;
    unit: string;
    isCompleted: boolean;
    createdAt: string;
    completedAt?: string;
    deadline?: string;
    reward?: string;
}

export enum GoalCategory {
    PRODUCTIVITY = 'productivity',
    HEALTH = 'health',
    LEARNING = 'learning',
    PERSONAL = 'personal',
    WORK = 'work',
    FITNESS = 'fitness',
    CREATIVITY = 'creativity',
}

export enum GoalType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
    ONE_TIME = 'one_time',
}

export interface Statistics {
    date: string;
    totalCount: number;
    flows: FlowStats;
    breaks: BreakStats;
    interruptions: number;
}

export interface FlowStats {
    started: number;
    completed: number;
    minutes: number;
}

export interface BreakStats {
    started: number;
    completed: number;
    minutes: number;
}

export interface FlowMetrics {
    consecutiveSessions: number;
    currentStreak: number;
    longestStreak: number;
    flowIntensity: FlowIntensity;
    distractionCount: number;
    sessionStartTime?: number;
    totalFocusTime: number;
    averageSessionLength: number;
    bestFlowDuration: number;
    lastSessionDate?: string;
}

export enum FlowIntensity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    ULTRA = 'ultra',
}

export interface Settings {
    timeDuration: number;
    breakDuration: number;
    soundEffects: boolean;
    notifications: boolean;
    darkMode: boolean;
    autoBreak: boolean;
    focusReminders: boolean;
    weeklyReports: boolean;
    dataSync: boolean;
    notificationStatus?: NotificationStatus;
}

export enum NotificationStatus {
    GRANTED = 'granted',
    DENIED = 'denied',
    PENDING = 'pending',
}

export interface Theme {
    mode: ThemeMode;
    accentColor: AccentColor;
    timerStyle: TimerStyle;
    activeCustomTheme?: string;
}

export enum ThemeMode {
    LIGHT = 'light',
    DARK = 'dark',
    AUTO = 'auto',
}

export enum AccentColor {
    SAGE = 'sage',
    WARM_GRAY = 'warmGray',
    SOFT_TEAL = 'softTeal',
    MUTED_LAVENDER = 'mutedLavender',
    CREAM = 'cream',
}

export enum TimerStyle {
    DIGITAL = 'digital',
    ANALOG = 'analog',
    MINIMAL = 'minimal',
    CIRCULAR = 'circular',
}

export interface CustomTheme {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
}

export interface Session {
    id: string;
    type: SessionType;
    duration: number;
    completed: boolean;
    startTime: string;
    endTime?: string;
    distractions: number;
    notes?: string;
    createdAt: string;
}

export enum SessionType {
    FOCUS = 'focus',
    SHORT_BREAK = 'short_break',
    LONG_BREAK = 'long_break',
}

export interface ExportData {
    goals: Goal[];
    statistics: Statistics[];
    flowMetrics: FlowMetrics;
    settings: Settings;
    theme: Theme;
    sessions?: Session[];
    exportedAt: string;
    version: string;
}

// Database row interfaces (for mapping SQL results)
export interface GoalRow {
    id: string;
    title: string;
    description: string;
    category: string;
    type: string;
    target: number;
    current: number;
    unit: string;
    is_completed: number;
    created_at: string;
    completed_at?: string;
    deadline?: string;
    reward?: string;
}

export interface StatisticsRow {
    id: string;
    date: string;
    total_flows: number;
    started_flows: number;
    completed_flows: number;
    total_focus_time: number;
    total_breaks: number;
    total_break_time: number;
    interruptions: number;
    created_at: string;
    updated_at: string;
}

export interface FlowMetricsRow {
    id: number;
    consecutive_sessions: number;
    current_streak: number;
    longest_streak: number;
    flow_intensity: string;
    distraction_count: number;
    session_start_time?: number;
    total_focus_time: number;
    average_session_length: number;
    best_flow_duration: number;
    last_session_date?: string;
    updated_at: string;
}

export interface SettingsRow {
    id: number;
    time_duration: number;
    break_duration: number;
    sound_effects: number;
    notifications: number;
    dark_mode: number;
    auto_break: number;
    focus_reminders: number;
    weekly_reports: number;
    data_sync: number;
    notification_status?: string;
    updated_at: string;
}

export interface ThemeRow {
    id: number;
    mode: string;
    accent_color: string;
    timer_style: string;
    custom_themes: string;
    active_custom_theme?: string;
    updated_at: string;
}

export interface SessionRow {
    id: string;
    type: string;
    duration: number;
    completed: number;
    start_time: string;
    end_time?: string;
    distractions: number;
    notes?: string;
    created_at: string;
}

export interface Todo {
    id: string;
    title: string;
    isCompleted: boolean;
    createdAt: string;
    completedAt?: string;
}

export interface TodoRow {
    id: string;
    title: string;
    description?: string;
    is_completed: number;
    priority: string;
    category: string;
    due_date?: string;
    created_at: string;
    completed_at?: string;
    tags?: string;
    notes?: string;
}
