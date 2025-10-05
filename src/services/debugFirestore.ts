/**
 * Debug utilities for testing Firestore setup
 * Add this to your Settings screen for easy testing
 */

import { Alert } from 'react-native';
import FirestoreSetup from './firestoreSetup';

export class DebugFirestore {
  /**
   * Show Firestore status in alert
   */
  static async showStatus(): Promise<void> {
    const connectionTest = await FirestoreSetup.testFirestoreConnection();
    const authTest = await FirestoreSetup.testAuthentication();

    const status = `
🔥 Firestore: ${connectionTest.success ? '✅' : '❌'}
🔐 Auth: ${authTest.success ? '✅' : '❌'}
👤 User: ${authTest.user?.email || 'Not signed in'}

${connectionTest.message}
${authTest.message}
        `.trim();

    Alert.alert('Firestore Status', status);
  }

  /**
   * Setup sample data with confirmation
   */
  static async setupSampleData(): Promise<void> {
    Alert.alert(
      'Setup Sample Data',
      'This will create sample user profile and data in Firestore. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              await FirestoreSetup.runCompleteSetup();
              Alert.alert(
                'Success',
                'Sample data created! Check Firebase Console → Firestore → Data'
              );
            } catch (error) {
              Alert.alert('Error', `Setup failed: ${error}`);
            }
          },
        },
      ]
    );
  }

  /**
   * Test security rules
   */
  static async testRules(): Promise<void> {
    try {
      const result = await FirestoreSetup.testSecurityRules();
      Alert.alert(
        result.success ? 'Security Rules ✅' : 'Security Rules ❌',
        result.message
      );
    } catch (error) {
      Alert.alert('Error', `Rules test failed: ${error}`);
    }
  }

  /**
   * Clear all data with confirmation
   */
  static async clearData(): Promise<void> {
    Alert.alert(
      'Clear All Data',
      'This will delete all your data from Firestore. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await FirestoreSetup.clearUserData();
              Alert.alert(
                result.success ? 'Cleared ✅' : 'Error ❌',
                result.message
              );
            } catch (error) {
              Alert.alert('Error', `Clear failed: ${error}`);
            }
          },
        },
      ]
    );
  }

  /**
   * Show debug menu
   */
  static showDebugMenu(): void {
    Alert.alert('Firestore Debug Menu', 'Choose a debug action:', [
      { text: 'Show Status', onPress: () => this.showStatus() },
      { text: 'Setup Sample Data', onPress: () => this.setupSampleData() },
      { text: 'Test Security Rules', onPress: () => this.testRules() },
      { text: 'Clear All Data', onPress: () => this.clearData() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }
}

export default DebugFirestore;
