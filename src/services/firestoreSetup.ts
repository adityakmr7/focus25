/**
 * Firestore Setup and Testing Utilities
 * Use this to test your Firestore configuration and create sample data
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { 
    UserProfile, 
    UserData, 
    createInitialUserProfile, 
    createInitialUserData,
    FIRESTORE_COLLECTIONS 
} from './firestoreSchema';

export class FirestoreSetup {
    /**
     * Test if Firestore is properly configured
     */
    static async testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
        try {
            console.log('🔥 Testing Firestore connection...');
            
            // Try to access Firestore
            const testCollection = firestore().collection('_test');
            await testCollection.doc('connection').get();
            
            console.log('✅ Firestore connection successful');
            return {
                success: true,
                message: 'Firestore is properly configured and accessible'
            };
        } catch (error) {
            console.error('❌ Firestore connection failed:', error);
            return {
                success: false,
                message: `Firestore connection failed: ${error}`
            };
        }
    }

    /**
     * Test if authentication is working
     */
    static async testAuthentication(): Promise<{ success: boolean; message: string; user: any }> {
        try {
            console.log('🔐 Testing authentication...');
            
            const user = auth().currentUser;
            if (!user) {
                return {
                    success: false,
                    message: 'No user is currently signed in',
                    user: null
                };
            }

            console.log('✅ Authentication successful');
            return {
                success: true,
                message: `User signed in: ${user.email || user.displayName || user.uid}`,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                }
            };
        } catch (error) {
            console.error('❌ Authentication test failed:', error);
            return {
                success: false,
                message: `Authentication test failed: ${error}`,
                user: null
            };
        }
    }

    /**
     * Create sample user profile in Firestore
     */
    static async createSampleUserProfile(force: boolean = false): Promise<{ success: boolean; message: string }> {
        try {
            const user = auth().currentUser;
            if (!user) {
                return {
                    success: false,
                    message: 'No authenticated user found'
                };
            }

            const userRef = firestore().collection(FIRESTORE_COLLECTIONS.USERS).doc(user.uid);
            const userDoc = await userRef.get();

            if (userDoc.exists && !force) {
                return {
                    success: true,
                    message: 'User profile already exists'
                };
            }

            // Create user profile
            const profile = createInitialUserProfile(
                user.uid,
                user.email,
                user.displayName,
                user.photoURL,
                'google' // You can change this based on the provider
            );

            await userRef.set(profile);
            console.log('✅ Sample user profile created:', profile);

            return {
                success: true,
                message: 'Sample user profile created successfully'
            };
        } catch (error) {
            console.error('❌ Failed to create user profile:', error);
            return {
                success: false,
                message: `Failed to create user profile: ${error}`
            };
        }
    }

    /**
     * Create sample user data in Firestore
     */
    static async createSampleUserData(force: boolean = false): Promise<{ success: boolean; message: string }> {
        try {
            const user = auth().currentUser;
            if (!user) {
                return {
                    success: false,
                    message: 'No authenticated user found'
                };
            }

            const userDataRef = firestore().collection(FIRESTORE_COLLECTIONS.USER_DATA).doc(user.uid);
            const userDataDoc = await userDataRef.get();

            if (userDataDoc.exists && !force) {
                return {
                    success: true,
                    message: 'User data already exists'
                };
            }

            // Create sample user data with some realistic values
            const initialData = createInitialUserData();
            
            // Add some sample data to make it more realistic
            const sampleUserData: UserData = {
                ...initialData,
                statistics: [
                    {
                        date: new Date().toISOString().split('T')[0],
                        totalCount: 3,
                        flows: {
                            started: 3,
                            completed: 2,
                            minutes: 50
                        },
                        breaks: {
                            started: 2,
                            completed: 2,
                            minutes: 10
                        },
                        interruptions: 1,
                        sessions: [
                            {
                                id: 'session_1',
                                startTime: new Date(Date.now() - 3600000), // 1 hour ago
                                endTime: new Date(Date.now() - 2100000),   // 35 min ago
                                duration: 25,
                                type: 'focus',
                                completed: true,
                                interruptions: 0
                            },
                            {
                                id: 'session_2',
                                startTime: new Date(Date.now() - 2100000),
                                endTime: new Date(Date.now() - 1800000),
                                duration: 5,
                                type: 'break',
                                completed: true,
                                interruptions: 0
                            }
                        ],
                        productivityScore: 85,
                        focusQuality: 'good'
                    }
                ],
                flowMetrics: {
                    ...initialData.flowMetrics!,
                    currentStreak: 2,
                    bestStreak: 5,
                    totalFocusMinutes: 150,
                    totalBreakMinutes: 30,
                    sessionsCompleted: 12,
                    sessionsStarted: 15,
                    completionRate: 0.8
                },
                todos: [
                    {
                        id: 'todo_1',
                        text: 'Complete project documentation',
                        completed: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        priority: 'high'
                    },
                    {
                        id: 'todo_2',
                        text: 'Review code changes',
                        completed: true,
                        createdAt: new Date(Date.now() - 86400000), // Yesterday
                        updatedAt: new Date(),
                        completedAt: new Date(),
                        priority: 'medium'
                    }
                ]
            } as UserData;

            await userDataRef.set(sampleUserData);
            console.log('✅ Sample user data created:', sampleUserData);

            return {
                success: true,
                message: 'Sample user data created successfully'
            };
        } catch (error) {
            console.error('❌ Failed to create user data:', error);
            return {
                success: false,
                message: `Failed to create user data: ${error}`
            };
        }
    }

    /**
     * Test Firestore security rules
     */
    static async testSecurityRules(): Promise<{ success: boolean; message: string }> {
        try {
            const user = auth().currentUser;
            if (!user) {
                return {
                    success: false,
                    message: 'No authenticated user found'
                };
            }

            console.log('🔒 Testing Firestore security rules...');

            // Test 1: Try to read own user profile
            const userRef = firestore().collection(FIRESTORE_COLLECTIONS.USERS).doc(user.uid);
            await userRef.get();
            console.log('✅ Can read own user profile');

            // Test 2: Try to write to own user profile
            await userRef.update({ lastSignIn: new Date() });
            console.log('✅ Can write to own user profile');

            // Test 3: Try to read own user data
            const userDataRef = firestore().collection(FIRESTORE_COLLECTIONS.USER_DATA).doc(user.uid);
            await userDataRef.get();
            console.log('✅ Can read own user data');

            // Test 4: Try to write to own user data
            await userDataRef.update({ lastSync: new Date() });
            console.log('✅ Can write to own user data');

            return {
                success: true,
                message: 'All security rule tests passed'
            };
        } catch (error) {
            console.error('❌ Security rules test failed:', error);
            return {
                success: false,
                message: `Security rules test failed: ${error}`
            };
        }
    }

    /**
     * Run complete Firestore setup and test
     */
    static async runCompleteSetup(): Promise<void> {
        console.log('🚀 Starting complete Firestore setup...');

        // Test 1: Firestore connection
        const connectionTest = await this.testFirestoreConnection();
        console.log(`Connection: ${connectionTest.message}`);

        // Test 2: Authentication
        const authTest = await this.testAuthentication();
        console.log(`Authentication: ${authTest.message}`);

        if (!authTest.success) {
            console.log('❌ Please sign in first before running setup');
            return;
        }

        // Test 3: Create user profile
        const profileTest = await this.createSampleUserProfile();
        console.log(`User Profile: ${profileTest.message}`);

        // Test 4: Create user data
        const dataTest = await this.createSampleUserData();
        console.log(`User Data: ${dataTest.message}`);

        // Test 5: Security rules
        const rulesTest = await this.testSecurityRules();
        console.log(`Security Rules: ${rulesTest.message}`);

        console.log('✅ Complete Firestore setup finished!');
        console.log('📋 Next steps:');
        console.log('1. Check Firebase Console → Firestore → Data');
        console.log('2. You should see collections: users, userData');
        console.log('3. Try "Backup to Cloud" and "Restore from Cloud" in Settings');
    }

    /**
     * Clear all user data (for testing)
     */
    static async clearUserData(): Promise<{ success: boolean; message: string }> {
        try {
            const user = auth().currentUser;
            if (!user) {
                return {
                    success: false,
                    message: 'No authenticated user found'
                };
            }

            // Delete user profile
            await firestore().collection(FIRESTORE_COLLECTIONS.USERS).doc(user.uid).delete();
            
            // Delete user data
            await firestore().collection(FIRESTORE_COLLECTIONS.USER_DATA).doc(user.uid).delete();

            return {
                success: true,
                message: 'All user data cleared from Firestore'
            };
        } catch (error) {
            console.error('❌ Failed to clear user data:', error);
            return {
                success: false,
                message: `Failed to clear user data: ${error}`
            };
        }
    }
}

// Export for easy use in console or debugging
export default FirestoreSetup;