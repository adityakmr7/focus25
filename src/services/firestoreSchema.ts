/**
 * Firestore Database Schema and Types
 * This file defines the exact structure of data stored in Firebase Firestore
 */

export interface UserProfile {
    // Basic user information
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    
    // Pro features
    isPro: boolean;
    upgradeDate?: Date;
    
    // Authentication details
    provider: 'google' | 'apple';
    createdAt: Date;
    lastSignIn: Date;
}

export interface FlowMetrics {
    // Current session metrics
    currentStreak: number;
    bestStreak: number;
    totalFocusMinutes: number;
    totalBreakMinutes: number;
    
    // Flow state tracking
    flowIntensity: 'low' | 'medium' | 'high';
    lastFlowDuration: number;
    averageFlowDuration: number;
    bestFlowDuration: number;
    
    // Distraction tracking
    totalInterruptions: number;
    interruptionRate: number;
    
    // Session history
    sessionsCompleted: number;
    sessionsStarted: number;
    completionRate: number;
    
    // Goals and achievements
    dailyGoal: number;
    weeklyGoal: number;
    achievements: string[];
    
    // Timestamps
    lastSessionDate: Date;
    updatedAt: Date;
}

export interface AppSettings {
    // Timer settings
    timeDuration: number; // Focus duration in minutes
    breakDuration: number; // Break duration in minutes
    autoBreak: boolean;
    
    // Audio settings
    soundEffects: boolean;
    focusMusic: {
        enabled: boolean;
        volume: number;
        selectedTrack?: string;
    };
    
    // Notification settings
    notifications: boolean;
    focusReminders: boolean;
    weeklyReports: boolean;
    
    // App behavior
    showStatistics: boolean;
    dataSync: boolean;
    
    // Privacy settings
    analyticsEnabled: boolean;
    crashReportingEnabled: boolean;
}

export interface ThemeData {
    // Current theme
    mode: 'light' | 'dark' | 'auto';
    
    // Theme customization
    primaryColor: string;
    accentColor: string;
    surfaceColor: string;
    backgroundColor: string;
    textColor: string;
    
    // Custom themes
    customThemes: {
        id: string;
        name: string;
        colors: {
            primary: string;
            accent: string;
            surface: string;
            background: string;
            text: string;
        };
        createdAt: Date;
    }[];
    
    // Timer style
    timerStyle: 'circular' | 'linear' | 'minimalist';
}

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    priority: 'low' | 'medium' | 'high';
    category?: string;
}

export interface DailyStatistics {
    date: string; // YYYY-MM-DD format
    totalCount: number;
    
    flows: {
        started: number;
        completed: number;
        minutes: number;
    };
    
    breaks: {
        started: number;
        completed: number;
        minutes: number;
    };
    
    interruptions: number;
    
    // Session details
    sessions: {
        id: string;
        startTime: Date;
        endTime?: Date;
        duration: number;
        type: 'focus' | 'break';
        completed: boolean;
        interruptions: number;
    }[];
    
    // Productivity metrics
    productivityScore: number;
    focusQuality: 'excellent' | 'good' | 'average' | 'poor';
}

// Main user data structure that gets synced
export interface UserData {
    // Core app data
    statistics: DailyStatistics[];
    flowMetrics: FlowMetrics;
    settings: AppSettings;
    theme: ThemeData;
    todos: TodoItem[];
    
    // Sync metadata
    lastSync: Date;
    version: string; // App version when data was synced
    deviceInfo: {
        platform: 'ios' | 'android' | 'web';
        appVersion: string;
        syncedAt: Date;
    };
}

// Firestore document paths
export const FIRESTORE_COLLECTIONS = {
    USERS: 'users',
    USER_DATA: 'userData',
} as const;

// Helper function to create initial user profile
export const createInitialUserProfile = (
    uid: string,
    email: string | null,
    displayName: string | null,
    photoURL: string | null,
    provider: 'google' | 'apple'
): UserProfile => ({
    uid,
    email,
    displayName,
    photoURL,
    isPro: false,
    provider,
    createdAt: new Date(),
    lastSignIn: new Date(),
});

// Helper function to create initial user data
export const createInitialUserData = (): Partial<UserData> => ({
    statistics: [],
    flowMetrics: {
        currentStreak: 0,
        bestStreak: 0,
        totalFocusMinutes: 0,
        totalBreakMinutes: 0,
        flowIntensity: 'low',
        lastFlowDuration: 0,
        averageFlowDuration: 0,
        bestFlowDuration: 0,
        totalInterruptions: 0,
        interruptionRate: 0,
        sessionsCompleted: 0,
        sessionsStarted: 0,
        completionRate: 0,
        dailyGoal: 120, // 2 hours default
        weeklyGoal: 840, // 14 hours default
        achievements: [],
        lastSessionDate: new Date(),
        updatedAt: new Date(),
    },
    settings: {
        timeDuration: 25,
        breakDuration: 5,
        autoBreak: false,
        soundEffects: true,
        focusMusic: {
            enabled: false,
            volume: 0.5,
        },
        notifications: true,
        focusReminders: false,
        weeklyReports: false,
        showStatistics: true,
        dataSync: true,
        analyticsEnabled: true,
        crashReportingEnabled: true,
    },
    theme: {
        mode: 'auto',
        primaryColor: '#007AFF',
        accentColor: '#FF9500',
        surfaceColor: '#F2F2F7',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        customThemes: [],
        timerStyle: 'circular',
    },
    todos: [],
    lastSync: new Date(),
    version: '1.5.0',
    deviceInfo: {
        platform: 'ios',
        appVersion: '1.5.0',
        syncedAt: new Date(),
    },
});

// Validation helpers
export const validateUserProfile = (data: any): data is UserProfile => {
    return (
        typeof data.uid === 'string' &&
        (data.email === null || typeof data.email === 'string') &&
        typeof data.isPro === 'boolean' &&
        ['google', 'apple'].includes(data.provider)
    );
};

export const validateUserData = (data: any): data is UserData => {
    return (
        Array.isArray(data.statistics) &&
        typeof data.flowMetrics === 'object' &&
        typeof data.settings === 'object' &&
        typeof data.theme === 'object' &&
        Array.isArray(data.todos)
    );
};