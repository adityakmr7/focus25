import { db } from './index';
import { goals, statistics, flowMetrics, settings, theme, sessions } from './schema';

/**
 * Seed the database with dummy data for development and testing
 */
export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if already seeded to avoid duplicates
    const existingGoals = await db.select().from(goals).limit(1);
    if (existingGoals.length > 0) {
      console.log('📦 Database already contains data, skipping seed');
      return true;
    }

    // Seed Settings
    await db.insert(settings).values({
      id: 1,
      timeDuration: 25,
      breakDuration: 5,
      soundEffects: true,
      notifications: true,
      darkMode: false,
      autoBreak: false,
      focusReminders: true,
      weeklyReports: true,
      dataSync: true,
      notificationStatus: 'granted',
    });

    // Seed Theme
    await db.insert(theme).values({
      id: 1,
      mode: 'auto',
      accentColor: 'green',
      timerStyle: 'digital',
      customThemes: JSON.stringify({
        'Ocean Blue': {
          primary: '#1A365D',
          secondary: '#2D3748',
          background: '#F7FAFC',
          surface: '#EDF2F7',
          text: '#1A202C',
          textSecondary: '#4A5568',
          accent: '#3182CE',
        },
        'Forest Green': {
          primary: '#1A202C',
          secondary: '#2D3748',
          background: '#F0FFF4',
          surface: '#E6FFFA',
          text: '#1A202C',
          textSecondary: '#4A5568',
          accent: '#38A169',
        },
      }),
      activeCustomTheme: null,
    });

    // Seed Flow Metrics
    await db.insert(flowMetrics).values({
      id: 1,
      consecutiveSessions: 3,
      currentStreak: 7,
      longestStreak: 21,
      flowIntensity: 'high',
      distractionCount: 2,
      sessionStartTime: null,
      totalFocusTime: 450, // 7.5 hours
      averageSessionLength: 28.5,
      bestFlowDuration: 45.0,
      lastSessionDate: new Date().toISOString(),
    });

    // Seed Goals
    const goalData = [
      {
        id: 'goal-1',
        title: 'Daily Focus Champion',
        description: 'Complete 5 focus sessions today',
        category: 'sessions' as const,
        type: 'daily' as const,
        target: 5,
        current: 3,
        unit: 'sessions',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        reward: 'Treat yourself to your favorite coffee',
      },
      {
        id: 'goal-2',
        title: 'Deep Work Master',
        description: 'Focus for 2 hours today',
        category: 'focus_time' as const,
        type: 'daily' as const,
        target: 120,
        current: 75,
        unit: 'minutes',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        reward: 'Watch an episode of your favorite show',
      },
      {
        id: 'goal-3',
        title: 'Weekly Warrior',
        description: 'Maintain a 7-day streak',
        category: 'streak' as const,
        type: 'weekly' as const,
        target: 7,
        current: 7,
        unit: 'days',
        isCompleted: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        reward: 'Buy that book you\'ve been wanting',
      },
      {
        id: 'goal-4',
        title: 'Consistency King',
        description: 'Complete sessions 5 days this week',
        category: 'consistency' as const,
        type: 'weekly' as const,
        target: 5,
        current: 4,
        unit: 'days',
        isCompleted: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reward: 'Plan a fun weekend activity',
      },
      {
        id: 'goal-5',
        title: 'Monthly Marathon',
        description: 'Complete 100 sessions this month',
        category: 'sessions' as const,
        type: 'monthly' as const,
        target: 100,
        current: 67,
        unit: 'sessions',
        isCompleted: false,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        reward: 'Upgrade your workspace setup',
      },
    ];

    await db.insert(goals).values(goalData);

    // Seed Statistics for the last 7 days
    const statisticsData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Generate realistic data with some variation
      const completedFlows = Math.floor(Math.random() * 8) + 2; // 2-10 sessions
      const startedFlows = completedFlows + Math.floor(Math.random() * 3); // Some incomplete sessions
      const totalFocusTime = completedFlows * (20 + Math.random() * 15); // 20-35 min per session
      const totalBreaks = completedFlows - 1; // Usually one less break than sessions
      const totalBreakTime = totalBreaks * (3 + Math.random() * 7); // 3-10 min breaks
      const interruptions = Math.floor(Math.random() * 5); // 0-4 interruptions

      statisticsData.push({
        id: `stats-${dateStr}`,
        date: dateStr,
        totalFlows: completedFlows,
        startedFlows,
        completedFlows,
        totalFocusTime: Math.round(totalFocusTime),
        totalBreaks,
        totalBreakTime: Math.round(totalBreakTime),
        interruptions,
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      });
    }

    await db.insert(statistics).values(statisticsData);

    // Seed Sessions for today
    const today = new Date();
    const sessionsData = [];

    // Create some completed focus sessions
    for (let i = 0; i < 3; i++) {
      const startTime = new Date(today);
      startTime.setHours(9 + i * 2, Math.random() * 60, 0, 0); // Sessions at 9am, 11am, 1pm with random minutes
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + 25 + Math.random() * 10); // 25-35 min sessions

      sessionsData.push({
        id: `session-focus-${i}`,
        type: 'focus' as const,
        duration: 25,
        completed: true,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        distractions: Math.floor(Math.random() * 3),
        notes: i === 0 ? 'Great focus session! Completed project planning.' : 
               i === 1 ? 'Had some distractions but pushed through.' : 
               'Perfect flow state achieved.',
        createdAt: startTime.toISOString(),
      });

      // Add corresponding break sessions
      if (i < 2) { // Don't add break after last session
        const breakStart = new Date(endTime);
        breakStart.setMinutes(breakStart.getMinutes() + 2); // 2 min delay before break
        const breakEnd = new Date(breakStart);
        breakEnd.setMinutes(breakStart.getMinutes() + 5); // 5 min break

        sessionsData.push({
          id: `session-break-${i}`,
          type: 'break' as const,
          duration: 5,
          completed: true,
          startTime: breakStart.toISOString(),
          endTime: breakEnd.toISOString(),
          distractions: 0,
          notes: null,
          createdAt: breakStart.toISOString(),
        });
      }
    }

    await db.insert(sessions).values(sessionsData);

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Seeded data:`);
    console.log(`   - ${goalData.length} goals`);
    console.log(`   - ${statisticsData.length} days of statistics`);
    console.log(`   - ${sessionsData.length} sessions`);
    console.log(`   - 1 settings record`);
    console.log(`   - 1 theme record`);
    console.log(`   - 1 flow metrics record`);

    return true;
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

/**
 * Reset database to initial state (useful for testing)
 */
export async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    await db.delete(goals);
    await db.delete(statistics);
    await db.delete(flowMetrics);
    await db.delete(settings);
    await db.delete(theme);
    await db.delete(sessions);

    console.log('✅ Database reset completed!');
    return true;
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

/**
 * Check if database has been seeded
 */
export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const goalsCount = await db.select().from(goals).limit(1);
    return goalsCount.length > 0;
  } catch (error) {
    console.error('Error checking if database is seeded:', error);
    return false;
  }
}