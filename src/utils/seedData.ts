import {
    AccentColor,
    FlowIntensity,
    FlowMetrics,
    Goal,
    GoalCategory,
    GoalType,
    NotificationStatus,
    Session,
    SessionType,
    Settings,
    Statistics,
    Theme,
    ThemeMode,
    TimerStyle,
} from '../types/database';
import { LocalDataBase } from '../data/local/localDatabase';
// Add this custom function:
const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
export class DatabaseSeeder {
    constructor(private db: LocalDataBase) {}

    async seedAll(): Promise<void> {
        console.log('🌱 Starting database seeding...');

        try {
            await this.db.initializeDatabase();

            // await this.seedGoals();
            await this.seedStatistics();
            await this.seedFlowMetrics();
            await this.seedSettings();
            // await this.seedTheme();
            await this.seedSessions();

            console.log('✅ Database seeding completed successfully!');
        } catch (error) {
            console.error('❌ Error seeding database:', error);
            throw error;
        }
    }

    async clearAndSeed(): Promise<void> {
        console.log('🧹 Clearing database and reseeding...');
        await this.db.clearAllData();
        await this.seedAll();
    }

    private async seedGoals(): Promise<void> {
        console.log('📝 Seeding goals...');

        const goals: Goal[] = [
            {
                id: generateUUID(),
                title: 'Complete Daily Focus Sessions',
                description: 'Maintain a consistent daily focus routine to improve productivity',
                category: GoalCategory.PRODUCTIVITY,
                type: GoalType.DAILY,
                target: 4,
                current: 2,
                unit: 'sessions',
                isCompleted: false,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
                deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
                reward: 'Watch a movie',
            },
            {
                id: generateUUID(),
                title: 'Weekly Deep Work Goal',
                description:
                    'Dedicate focused time blocks for deep work and complex problem solving',
                category: GoalCategory.WORK,
                type: GoalType.WEEKLY,
                target: 20,
                current: 12,
                unit: 'hours',
                isCompleted: false,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // day after tomorrow
                reward: 'Weekend hiking trip',
            },
            {
                id: generateUUID(),
                title: 'Learn TypeScript Fundamentals',
                description:
                    'Master TypeScript basics and advanced features for better code quality',
                category: GoalCategory.LEARNING,
                type: GoalType.MONTHLY,
                target: 30,
                current: 18,
                unit: 'hours',
                isCompleted: false,
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
                deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
                reward: 'New coding course',
            },
            {
                id: generateUUID(),
                title: 'Morning Meditation Streak',
                description: 'Build a consistent meditation practice to improve mental clarity',
                category: GoalCategory.HEALTH,
                type: GoalType.DAILY,
                target: 1,
                current: 1,
                unit: 'session',
                isCompleted: true,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // yesterday
                completedAt: new Date().toISOString(),
                reward: 'Healthy breakfast',
            },
            {
                id: generateUUID(),
                title: 'Creative Writing Project',
                description: 'Complete a short story collection with diverse themes and characters',
                category: GoalCategory.CREATIVITY,
                type: GoalType.YEARLY,
                target: 100,
                current: 23,
                unit: 'pages',
                isCompleted: false,
                createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
                deadline: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000).toISOString(), // ~11 months from now
                reward: 'Publishing consultation',
            },
            {
                id: generateUUID(),
                title: 'Fitness Challenge',
                description: 'Complete a comprehensive fitness routine to improve overall health',
                category: GoalCategory.FITNESS,
                type: GoalType.WEEKLY,
                target: 5,
                current: 3,
                unit: 'workouts',
                isCompleted: false,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
                reward: 'New workout gear',
            },
        ];

        for (const goal of goals) {
            await this.db.saveGoal(goal);
        }

        console.log(`✅ Seeded ${goals.length} goals`);
    }

    private async seedStatistics(): Promise<void> {
        console.log('📊 Seeding statistics...');

        const statistics: Statistics[] = [];
        const daysToSeed = 30; // Last 30 days

        for (let i = daysToSeed; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateString = date.toISOString().split('T')[0];

            // Generate realistic data with some variation
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const baseFlows = isWeekend
                ? Math.floor(Math.random() * 3) + 1
                : Math.floor(Math.random() * 6) + 2;
            const completionRate = 0.7 + Math.random() * 0.3; // 70-100% completion rate

            const stat: Statistics = {
                date: dateString,
                totalCount: baseFlows,
                flows: {
                    started: baseFlows,
                    completed: Math.floor(baseFlows * completionRate),
                    minutes: Math.floor(baseFlows * completionRate * 25), // 25 min average
                },
                breaks: {
                    started: Math.floor(baseFlows * 0.8),
                    completed: Math.floor(baseFlows * 0.8),
                    minutes: Math.floor(baseFlows * 0.8 * 5), // 5 min breaks
                },
                interruptions: Math.floor(Math.random() * 3),
            };

            statistics.push(stat);
        }

        for (const stat of statistics) {
            await this.db.saveStatistics(stat);
        }

        console.log(`✅ Seeded ${statistics.length} daily statistics`);
    }

    private async seedFlowMetrics(): Promise<void> {
        console.log('🌊 Seeding flow metrics...');

        const flowMetrics: FlowMetrics = {
            consecutiveSessions: 3,
            currentStreak: 7,
            longestStreak: 15,
            flowIntensity: FlowIntensity.HIGH,
            distractionCount: 12,
            sessionStartTime: Date.now() - 15 * 60 * 1000, // 15 minutes ago
            totalFocusTime: 1580, // ~26 hours in minutes
            averageSessionLength: 24.7,
            bestFlowDuration: 45.5,
            lastSessionDate: new Date().toISOString().split('T')[0],
        };

        await this.db.saveFlowMetrics(flowMetrics);
        console.log('✅ Seeded flow metrics');
    }

    private async seedSettings(): Promise<void> {
        console.log('⚙️ Seeding settings...');

        const settings: Settings = {
            timeDuration: 25,
            breakDuration: 5,
            soundEffects: true,
            notifications: true,
            darkMode: false,
            autoBreak: true,
            focusReminders: true,
            weeklyReports: true,
            dataSync: true,
            notificationStatus: NotificationStatus.GRANTED,
        };

        await this.db.saveSettings(settings);
        console.log('✅ Seeded settings');
    }

    private async seedTheme(): Promise<void> {
        console.log('🎨 Seeding theme...');

        const theme: Theme = {
            mode: ThemeMode.AUTO,
            accentColor: AccentColor.BLUE,
            timerStyle: TimerStyle.DIGITAL,
            activeCustomTheme: 'ocean',
        };

        await this.db.saveTheme(theme);
        console.log('✅ Seeded theme');
    }

    private async seedSessions(): Promise<void> {
        console.log('🎯 Seeding sessions...');

        const sessions: Session[] = [];
        const sessionTypes = [SessionType.FOCUS, SessionType.SHORT_BREAK, SessionType.LONG_BREAK];
        const sessionCount = 50;

        for (let i = 0; i < sessionCount; i++) {
            const daysAgo = Math.floor(Math.random() * 14); // Last 2 weeks
            const startTime = new Date(
                Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000,
            );
            const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];

            let duration: number;
            let completed: boolean;

            switch (sessionType) {
                case SessionType.FOCUS:
                    duration = 25 + Math.floor(Math.random() * 10); // 25-35 minutes
                    completed = Math.random() > 0.2; // 80% completion rate
                    break;
                case SessionType.SHORT_BREAK:
                    duration = 5 + Math.floor(Math.random() * 3); // 5-8 minutes
                    completed = Math.random() > 0.1; // 90% completion rate
                    break;
                case SessionType.LONG_BREAK:
                    duration = 15 + Math.floor(Math.random() * 10); // 15-25 minutes
                    completed = Math.random() > 0.15; // 85% completion rate
                    break;
                default:
                    duration = 25;
                    completed = true;
            }

            const endTime = completed
                ? new Date(startTime.getTime() + duration * 60 * 1000)
                : undefined;

            const session: Session = {
                id: generateUUID(),
                type: sessionType,
                duration: duration,
                completed: completed,
                startTime: startTime.toISOString(),
                endTime: endTime?.toISOString(),
                distractions: Math.floor(Math.random() * 4), // 0-3 distractions
                notes: Math.random() > 0.7 ? this.getRandomSessionNote() : undefined,
                createdAt: startTime.toISOString(),
            };

            sessions.push(session);
        }

        // Sort sessions by start time (newest first)
        sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        for (const session of sessions) {
            await this.db.saveSession(session);
        }

        console.log(`✅ Seeded ${sessions.length} sessions`);
    }

    private getRandomSessionNote(): string {
        const notes = [
            'Great focus session, felt very productive!',
            'Had some distractions but managed to complete the task',
            'Difficult to concentrate today, might need more sleep',
            'Perfect flow state, time flew by',
            'Interrupted by phone calls, but got back on track',
            'Excellent deep work session on the new project',
            'Short session but very effective',
            'Feeling energized and motivated',
            'Good progress on learning goals',
            'Need to work on reducing distractions tomorrow',
        ];

        return notes[Math.floor(Math.random() * notes.length)];
    }

    // Helper method to seed specific data types individually
    async seedGoalsOnly(): Promise<void> {
        await this.db.initializeDatabase();
        await this.seedGoals();
    }

    async seedStatisticsOnly(): Promise<void> {
        await this.db.initializeDatabase();
        await this.seedStatistics();
    }

    async seedSessionsOnly(): Promise<void> {
        await this.db.initializeDatabase();
        await this.seedSessions();
    }
}

// Utility function to easily seed the database
export async function seedDatabase(
    db: LocalDataBase,
    options: {
        clearFirst?: boolean;
        goals?: boolean;
        statistics?: boolean;
        sessions?: boolean;
        all?: boolean;
    } = { all: true },
): Promise<void> {
    const seeder = new DatabaseSeeder(db);

    if (options.clearFirst) {
        await seeder.clearAndSeed();
        return;
    }

    if (options.all) {
        await seeder.seedAll();
        return;
    }

    await db.initializeDatabase();

    if (options.goals) await seeder.seedGoalsOnly();
    if (options.statistics) await seeder.seedStatisticsOnly();
    if (options.sessions) await seeder.seedSessionsOnly();
}

// Example usage:
// import { localDatabaseService } from './services/database';
// import { seedDatabase } from './utils/seedData';
//
// // Seed everything
// await seedDatabase(localDatabaseService);
//
// // Clear and reseed
// await seedDatabase(localDatabaseService, { clearFirst: true });
//
// // Seed only specific data
// await seedDatabase(localDatabaseService, { goals: true, sessions: true });
