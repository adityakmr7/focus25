#!/usr/bin/env node

/**
 * Firestore Setup Script
 *
 * This script automatically creates the complete Firestore structure
 * for the Focus25 app including collections, sample data, and security rules.
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

        await this.db.collection('userData').doc(userId).set(userData);
        success('Created userData collection with sample data');

        // Log key parts of the structure
        log('\n📊 User Data Structure Summary:', 'blue');
        log('- statistics: Array with daily session data');
        log('- flowMetrics: Current performance metrics');
        log('- settings: App configuration');
        log('- theme: UI customization settings');
        log('- todos: Task management data');
        log('- deviceInfo: Sync metadata');
    }

    async createSecurityRules() {
        try {
            log('\n🔒 Security Rules Setup...', 'cyan');

            const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own app data
    match /userData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
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
                        collectionGroup: 'userData',
                        queryScope: 'COLLECTION',
                        fields: [
                            { fieldPath: '__name__', order: 'ASCENDING' },
                            { fieldPath: 'lastSync', order: 'DESCENDING' },
                        ],
                    },
                    {
                        collectionGroup: 'users',
                        queryScope: 'COLLECTION',
                        fields: [
                            { fieldPath: '__name__', order: 'ASCENDING' },
                            { fieldPath: 'lastSignIn', order: 'DESCENDING' },
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
            const userDataSnapshot = await this.db.collection('userData').limit(1).get();

            if (usersSnapshot.empty) {
                error('Users collection is empty');
                return false;
            }

            if (userDataSnapshot.empty) {
                error('UserData collection is empty');
                return false;
            }

            success('Collections verified successfully');

            // Show collection stats
            const usersCount = (await this.db.collection('users').get()).size;
            const userDataCount = (await this.db.collection('userData').get()).size;

            log(`\n📈 Collection Stats:`, 'blue');
            log(`- Users: ${usersCount} documents`);
            log(`- UserData: ${userDataCount} documents`);

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
        log('- userData collection with complete app data structure');
        log('- firestore.rules file with security rules');
        log('- firestore.indexes.json with performance indexes');

        log('\n📋 Next Steps:', 'yellow');
        log('1. Go to Firebase Console → Firestore → Data');
        log('2. Verify you see "users" and "userData" collections');
        log('3. Go to Firestore → Rules and apply the security rules');
        log("4. Test your app's cloud sync functionality");
        log('5. Deploy indexes: firebase deploy --only firestore:indexes');

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
