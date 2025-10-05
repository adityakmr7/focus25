#!/usr/bin/env node

/**
 * Improved Firestore Setup Script
 *
 * This script automatically creates the improved Firestore structure
 * with subcollections for better performance and scalability.
 * Features:
 * - Subcollections for todos, statistics, themes
 * - Pro user feature differentiation
 * - Enhanced security rules
 * - Optimized indexes
 *
 * Usage: node scripts/setupFirestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const log = (message, color = 'reset') => console.log(colors[color] + message + colors.reset);
const success = (message) => log('✅ ' + message, 'green');
const error = (message) => log('❌ ' + message, 'red');
const warning = (message) => log('⚠️  ' + message, 'yellow');
const info = (message) => log('ℹ️  ' + message, 'blue');

class FirestoreSetupScript {
    constructor() {
        this.db = null;
        this.auth = null;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }

    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    async initialize() {
        try {
            log('\n🔥 Firebase Firestore Setup Script', 'cyan');
            log('=====================================', 'cyan');

            // Check for service account key
            const serviceAccountPath = await this.findServiceAccount();
            if (!serviceAccountPath) {
                await this.setupInstructions();
                return false;
            }

            // Initialize Firebase Admin
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`,
            });

            this.db = admin.firestore();
            this.auth = admin.auth();

            success('Firebase Admin SDK initialized');
            return true;
        } catch (err) {
            error(`Initialization failed: ${err.message}`);
            return false;
        }
    }

    async findServiceAccount() {
        const possiblePaths = [
            './service-account-key.json',
            './firebase-service-account.json',
            './serviceAccountKey.json',
            './service-account-key.json',
        ];

        for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
                info(`Found service account key: ${filePath}`);
                return path.resolve(filePath);
            }
        }

        return null;
    }

    async setupInstructions() {
        error('Service account key not found!');
        log('\n📋 Setup Instructions:', 'yellow');
        log('1. Go to Firebase Console → Project Settings → Service accounts');
        log('2. Click "Generate new private key"');
        log('3. Save the JSON file as "service-account-key.json" in the project root');
        log('4. Run this script again');
        log('\nAlternatively, place the key file in one of these locations:');
        log('- ./service-account-key.json');
        log('- ./firebase-service-account.json');
        log('- ./serviceAccountKey.json');
    }

    async createCollections() {
        try {
            log('\n📁 Creating Firestore Collections...', 'cyan');

            // Create a dummy user ID for sample data
            const sampleUserId = 'sample_user_' + Date.now();

            // 1. Create users collection with sample data
            await this.createUserProfile(sampleUserId);

            // 2. Create userData collection with sample data
            await this.createUserData(sampleUserId);

            success('All collections created successfully');
            return true;
        } catch (err) {
            error(`Failed to create collections: ${err.message}`);
            return false;
        }
    }

    async createUserProfile(userId) {
        const userProfile = {
            uid: userId,
            email: 'sample@focus25.com',
            displayName: 'Focus25 Sample User',
            photoURL: null,
            isPro: false,
            provider: 'google',
            createdAt: admin.firestore.Timestamp.now(),
            lastSignIn: admin.firestore.Timestamp.now(),
        };

        await this.db.collection('users').doc(userId).set(userProfile);
        success('Created users collection with sample profile');

        // Log the structure
        log('\n👤 User Profile Structure:', 'blue');
        log(JSON.stringify(userProfile, null, 2));
    }

    async createUserData(userId) {
        const userData = {
            statistics: [
                {
                    date: new Date().toISOString().split('T')[0],
                    totalCount: 5,
                    flows: {
                        started: 5,
                        completed: 4,
                        minutes: 100,
                    },
                    breaks: {
                        started: 4,
                        completed: 4,
                        minutes: 20,
                    },
                    interruptions: 2,
                    sessions: [
                        {
                            id: 'session_' + Date.now(),
                            startTime: admin.firestore.Timestamp.fromDate(
                                new Date(Date.now() - 3600000),
                            ),
                            endTime: admin.firestore.Timestamp.fromDate(
                                new Date(Date.now() - 2100000),
                            ),
                            duration: 25,
                            type: 'focus',
                            completed: true,
                            interruptions: 0,
                        },
                        {
                            id: 'session_' + (Date.now() + 1),
                            startTime: admin.firestore.Timestamp.fromDate(
                                new Date(Date.now() - 2100000),
                            ),
                            endTime: admin.firestore.Timestamp.fromDate(
                                new Date(Date.now() - 1800000),
                            ),
                            duration: 5,
                            type: 'break',
                            completed: true,
                            interruptions: 0,
                        },
                    ],
                    productivityScore: 88,
                    focusQuality: 'excellent',
                },
            ],
            flowMetrics: {
                currentStreak: 4,
                bestStreak: 12,
                totalFocusMinutes: 450,
                totalBreakMinutes: 90,
                flowIntensity: 'high',
                lastFlowDuration: 25,
                averageFlowDuration: 23.5,
                bestFlowDuration: 45,
                totalInterruptions: 8,
                interruptionRate: 0.12,
                sessionsCompleted: 18,
                sessionsStarted: 20,
                completionRate: 0.9,
                dailyGoal: 120,
                weeklyGoal: 840,
                achievements: ['first_session', 'five_in_a_row', 'focus_master'],
                lastSessionDate: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now(),
            },
            settings: {
                timeDuration: 25,
                breakDuration: 5,
                autoBreak: false,
                soundEffects: true,
                focusMusic: {
                    enabled: true,
                    volume: 0.7,
                    selectedTrack: 'forest_ambience',
                },
                notifications: true,
                focusReminders: true,
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
                customThemes: [
                    {
                        id: 'theme_1',
                        name: 'Ocean Blue',
                        colors: {
                            primary: '#0066CC',
                            accent: '#FF6B35',
                            surface: '#E8F4FD',
                            background: '#FFFFFF',
                            text: '#333333',
                        },
                        createdAt: admin.firestore.Timestamp.now(),
                    },
                ],
                timerStyle: 'circular',
            },
            todos: [
                {
                    id: 'todo_' + Date.now(),
                    text: 'Complete Firebase setup',
                    completed: true,
                    createdAt: admin.firestore.Timestamp.now(),
                    updatedAt: admin.firestore.Timestamp.now(),
                    completedAt: admin.firestore.Timestamp.now(),
                    priority: 'high',
                    category: 'development',
                },
                {
                    id: 'todo_' + (Date.now() + 1),
                    text: 'Test cloud sync functionality',
                    completed: false,
                    createdAt: admin.firestore.Timestamp.now(),
                    updatedAt: admin.firestore.Timestamp.now(),
                    priority: 'medium',
                    category: 'testing',
                },
                {
                    id: 'todo_' + (Date.now() + 2),
                    text: 'Review app performance metrics',
                    completed: false,
                    createdAt: admin.firestore.Timestamp.now(),
                    updatedAt: admin.firestore.Timestamp.now(),
                    priority: 'low',
                    category: 'analysis',
                },
            ],
            lastSync: admin.firestore.Timestamp.now(),
            version: '1.5.0',
            deviceInfo: {
                platform: 'ios',
                appVersion: '1.5.0',
                syncedAt: admin.firestore.Timestamp.now(),
            },
        };

        // Create improved structure with subcollections
        await this.createTodosSubcollection(userId);
        await this.createStatisticsSubcollection(userId);
        await this.createFlowMetrics(userId);
        await this.createSettings(userId);
        await this.createThemesSubcollection(userId);

        success('Created improved Firestore structure with subcollections');
    }

    async createTodosSubcollection(userId) {
        const todos = [
            {
                title: 'Complete project proposal',
                completed: false,
                createdAt: admin.firestore.Timestamp.now(),
                priority: 'high',
                category: 'work',
                tags: ['urgent', 'project'],
            },
            {
                title: 'Review team feedback',
                completed: true,
                createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
                completedAt: admin.firestore.Timestamp.now(),
                priority: 'medium',
                category: 'work',
                tags: ['feedback', 'review'],
            },
            {
                title: 'Schedule client meeting',
                completed: false,
                createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
                priority: 'high',
                category: 'work',
                tags: ['meeting', 'client'],
            },
        ];

        const todosRef = this.db.collection('users').doc(userId).collection('todos');
        
        for (const todo of todos) {
            await todosRef.add(todo);
        }
        
        success(`Created ${todos.length} todos in subcollection`);
    }

    async createStatisticsSubcollection(userId) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const statistics = [
            {
                date: today.toISOString().split('T')[0],
                sessions: 5,
                totalMinutes: 125,
                completedFlows: 4,
                averageSession: 25,
                focusScore: 85,
                interruptions: 2,
            },
            {
                date: yesterday.toISOString().split('T')[0],
                sessions: 3,
                totalMinutes: 75,
                completedFlows: 2,
                averageSession: 25,
                focusScore: 70,
                interruptions: 1,
            },
        ];

        const statsRef = this.db.collection('users').doc(userId).collection('statistics');
        
        for (const stat of statistics) {
            await statsRef.doc(stat.date).set(stat);
        }
        
        success(`Created ${statistics.length} statistics entries`);
    }

    async createFlowMetrics(userId) {
        const flowMetrics = {
            currentStreak: 7,
            bestStreak: 14,
            totalFocusMinutes: 1500,
            totalBreakMinutes: 300,
            flowIntensity: 'medium',
            lastFlowDuration: 25,
            averageFlowDuration: 23,
            bestFlowDuration: 45,
            totalInterruptions: 12,
            interruptionRate: 0.15,
            sessionsCompleted: 85,
            sessionsStarted: 95,
            completionRate: 0.89,
            dailyGoal: 120,
            weeklyGoal: 840,
            achievements: ['first_flow', 'week_streak', 'perfect_day'],
            lastSessionDate: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        };

        await this.db.collection('users').doc(userId).collection('flowMetrics').doc('current').set(flowMetrics);
        success('Created flow metrics');
    }

    async createSettings(userId) {
        const settings = {
            timeDuration: 25,
            breakDuration: 5,
            autoBreak: true,
            soundEffects: true,
            focusMusic: {
                enabled: true,
                volume: 0.7,
                selectedTrack: 'forest_ambience',
            },
            notifications: true,
            focusReminders: true,
            weeklyReports: false,
            showStatistics: true,
            dataSync: true,
            analyticsEnabled: true,
            crashReportingEnabled: true,
            updatedAt: admin.firestore.Timestamp.now(),
        };

        await this.db.collection('users').doc(userId).collection('settings').doc('app').set(settings);
        success('Created settings');
    }

    async createThemesSubcollection(userId) {
        const themes = [
            {
                name: 'Default Light',
                isDefault: true,
                colors: {
                    primary: '#007AFF',
                    accent: '#FF9500',
                    surface: '#F2F2F7',
                    background: '#FFFFFF',
                    text: '#000000',
                },
                timerStyle: 'circular',
                createdAt: admin.firestore.Timestamp.now(),
            },
            {
                name: 'Default Dark',
                isDefault: true,
                colors: {
                    primary: '#0A84FF',
                    accent: '#FF9F0A',
                    surface: '#1C1C1E',
                    background: '#000000',
                    text: '#FFFFFF',
                },
                timerStyle: 'circular',
                createdAt: admin.firestore.Timestamp.now(),
            },
        ];

        const themesRef = this.db.collection('users').doc(userId).collection('themes');
        
        for (const theme of themes) {
            await themesRef.add(theme);
        }
        
        success(`Created ${themes.length} themes`);
    }

    async createSecurityRules() {
        try {
            log('\n🔒 Security Rules Setup...', 'cyan');

            const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profile - only authenticated users can access their own
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Pro users can access all subcollections
      match /{subcollection}/{document=**} {
        allow read, write: if request.auth != null 
          && request.auth.uid == userId 
          && isProUser(userId);
      }
      
      // Free users can only access basic todos
      match /todos/{todoId} {
        allow read, write: if request.auth != null 
          && request.auth.uid == userId 
          && isFreeUser(userId);
      }
    }
    
    // Helper functions
    function isProUser(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.subscription.isPro == true;
    }
    
    function isFreeUser(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.subscription.isPro == false;
    }
  }
}`;

            // Save rules to file for manual application
            fs.writeFileSync('./firestore.rules', rules);

            warning('Security rules saved to firestore.rules');
            log('\n📋 Manual step required:', 'yellow');
            log('1. Go to Firebase Console → Firestore → Rules');
            log('2. Copy the rules from firestore.rules file');
            log('3. Paste and publish the rules');
            log('\nOr copy these rules:');
            log('─'.repeat(50));
            log(rules, 'cyan');
            log('─'.repeat(50));

            return true;
        } catch (err) {
            error(`Failed to create security rules: ${err.message}`);
            return false;
        }
    }

    async createIndexes() {
        try {
            log('\n📇 Creating Firestore Indexes...', 'cyan');

            const indexes = {
                indexes: [
                    {
                        collectionGroup: 'todos',
                        queryScope: 'COLLECTION',
                        fields: [
                            { fieldPath: 'userId', order: 'ASCENDING' },
                            { fieldPath: 'createdAt', order: 'DESCENDING' },
                        ],
                    },
                    {
                        collectionGroup: 'todos',
                        queryScope: 'COLLECTION',
                        fields: [
                            { fieldPath: 'userId', order: 'ASCENDING' },
                            { fieldPath: 'completed', order: 'ASCENDING' },
                            { fieldPath: 'createdAt', order: 'DESCENDING' },
                        ],
                    },
                    {
                        collectionGroup: 'statistics',
                        queryScope: 'COLLECTION',
                        fields: [
                            { fieldPath: 'userId', order: 'ASCENDING' },
                            { fieldPath: 'date', order: 'DESCENDING' },
                        ],
                    },
                    {
                        collectionGroup: 'flowMetrics',
                        queryScope: 'COLLECTION',
                        fields: [
                            { fieldPath: 'userId', order: 'ASCENDING' },
                            { fieldPath: 'updatedAt', order: 'DESCENDING' },
                        ],
                    },
                ],
            };

            // Save indexes to file for manual application
            fs.writeFileSync('./firestore.indexes.json', JSON.stringify(indexes, null, 2));

            info('Firestore indexes configuration saved to firestore.indexes.json');
            log('You can deploy indexes using: firebase deploy --only firestore:indexes');

            return true;
        } catch (err) {
            error(`Failed to create indexes: ${err.message}`);
            return false;
        }
    }

    async verifySetup() {
        try {
            log('\n🔍 Verifying Setup...', 'cyan');

            // Check if collections exist and have data
            const usersSnapshot = await this.db.collection('users').limit(1).get();

            if (usersSnapshot.empty) {
                error('Users collection is empty');
                return false;
            }

            // Get first user to check subcollections
            const firstUser = usersSnapshot.docs[0];
            const userId = firstUser.id;

            // Check subcollections
            const todosSnapshot = await this.db.collection('users').doc(userId).collection('todos').limit(1).get();
            const statsSnapshot = await this.db.collection('users').doc(userId).collection('statistics').limit(1).get();
            const themesSnapshot = await this.db.collection('users').doc(userId).collection('themes').limit(1).get();

            if (todosSnapshot.empty) {
                error('Todos subcollection is empty');
                return false;
            }

            if (statsSnapshot.empty) {
                error('Statistics subcollection is empty');
                return false;
            }

            success('Improved Firestore structure verified successfully');

            // Show collection stats
            const usersCount = (await this.db.collection('users').get()).size;
            const todosCount = (await this.db.collection('users').doc(userId).collection('todos').get()).size;
            const statsCount = (await this.db.collection('users').doc(userId).collection('statistics').get()).size;
            const themesCount = (await this.db.collection('users').doc(userId).collection('themes').get()).size;

            log(`\n📈 Improved Structure Stats:`, 'blue');
            log(`- Users: ${usersCount} documents`);
            log(`- Todos: ${todosCount} documents (in subcollection)`);
            log(`- Statistics: ${statsCount} documents (in subcollection)`);
            log(`- Themes: ${themesCount} documents (in subcollection)`);

            return true;
        } catch (err) {
            error(`Verification failed: ${err.message}`);
            return false;
        }
    }

    async showNextSteps() {
        log('\n🎉 Firestore Setup Complete!', 'green');
        log('==============================', 'green');

        log('\n✅ What was created:', 'cyan');
        log('- users collection with sample user profile');
        log('- todos subcollection with sample todos');
        log('- statistics subcollection with daily stats');
        log('- flowMetrics subcollection with performance data');
        log('- settings subcollection with app configuration');
        log('- themes subcollection with UI themes');
        log('- firestore.rules file with improved security rules');
        log('- firestore.indexes.json with optimized indexes');

        log('\n📋 Next Steps:', 'yellow');
        log('1. Go to Firebase Console → Firestore → Data');
        log('2. Verify you see "users" collection with subcollections');
        log('3. Go to Firestore → Rules and apply the security rules');
        log('4. Deploy indexes: firebase deploy --only firestore:indexes');
        log("5. Test your app's improved cloud sync functionality");

        log('\n🔗 Firebase Console:', 'blue');
        log('https://console.firebase.google.com/project/your-project/firestore');

        log('\n🧪 Testing:', 'magenta');
        log('- Sign into your app');
        log('- Try "Backup to Cloud" in Settings');
        log('- Check if new user data appears in Firestore');
        log('- Try "Restore from Cloud" to test sync');
    }

    async cleanup() {
        this.rl.close();
    }

    async run() {
        try {
            const initialized = await this.initialize();
            if (!initialized) {
                await this.cleanup();
                return;
            }

            const proceed = await this.question(
                '\n🚀 Ready to create Firestore structure? (y/N): ',
            );
            if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
                log('Setup cancelled.');
                await this.cleanup();
                return;
            }

            // Run setup steps
            const steps = [
                { name: 'Creating Collections', fn: () => this.createCollections() },
                { name: 'Setting up Security Rules', fn: () => this.createSecurityRules() },
                { name: 'Creating Indexes', fn: () => this.createIndexes() },
                { name: 'Verifying Setup', fn: () => this.verifySetup() },
            ];

            for (const step of steps) {
                log(`\n🔄 ${step.name}...`, 'yellow');
                const success = await step.fn();
                if (!success) {
                    error(`${step.name} failed. Stopping setup.`);
                    await this.cleanup();
                    return;
                }
            }

            await this.showNextSteps();
            await this.cleanup();
        } catch (err) {
            error(`Setup failed: ${err.message}`);
            await this.cleanup();
        }
    }
}

// Run the script
if (require.main === module) {
    const setup = new FirestoreSetupScript();
    setup.run().catch(console.error);
}

module.exports = FirestoreSetupScript;
