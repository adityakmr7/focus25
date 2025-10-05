import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { updateService, UpdateInfo } from '../services/updateService';

interface UpdateNotificationProps {
  visible: boolean;
  onClose: () => void;
  updateInfo?: UpdateInfo;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  visible,
  onClose,
  updateInfo,
}) => {
  const { mode, getCurrentTheme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const theme = getCurrentTheme();
  const isDark =
    mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);

      if (updateInfo?.storeUrl) {
        // The updateService will handle opening the store
        await updateService.showUpdateAlert(updateInfo);
      } else {
        // Fallback to generic store opening
        Alert.alert(
          'Update',
          'You will be redirected to the App Store to update the app.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Store',
              onPress: () => {
                // This will be handled by the updateService
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to handle update:', error);
      Alert.alert('Error', 'Failed to open the App Store. Please try again.');
    } finally {
      setIsUpdating(false);
      onClose();
    }
  };

  const handleSkip = async () => {
    try {
      if (updateInfo?.latestVersion) {
        // Skip this version
        await updateService.clearSkippedVersion(); // Clear any previous skipped version
        // The skip functionality is handled in the updateService
      }
      onClose();
    } catch (error) {
      console.error('Failed to skip version:', error);
      onClose();
    }
  };

  if (!updateInfo?.isUpdateAvailable) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[styles.iconContainer, { backgroundColor: theme.accent }]}
            >
              <Ionicons name='arrow-up-circle' size={24} color='white' />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              {updateInfo.isForceUpdate
                ? 'Update Required'
                : 'Update Available'}
            </Text>
            {!updateInfo.isForceUpdate && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name='close' size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Version Info */}
          <View style={styles.versionInfo}>
            <View style={styles.versionRow}>
              <Text
                style={[styles.versionLabel, { color: theme.textSecondary }]}
              >
                Current Version:
              </Text>
              <Text style={[styles.versionValue, { color: theme.text }]}>
                {updateInfo.currentVersion}
              </Text>
            </View>
            <View style={styles.versionRow}>
              <Text
                style={[styles.versionLabel, { color: theme.textSecondary }]}
              >
                Latest Version:
              </Text>
              <Text style={[styles.versionValue, { color: theme.accent }]}>
                {updateInfo.latestVersion}
              </Text>
            </View>
          </View>

          {/* Release Notes */}
          {updateInfo.releaseNotes && (
            <View style={styles.releaseNotesContainer}>
              <Text style={[styles.releaseNotesTitle, { color: theme.text }]}>
                What's New:
              </Text>
              <ScrollView
                style={[
                  styles.releaseNotesScroll,
                  { backgroundColor: theme.background },
                ]}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={[
                    styles.releaseNotesText,
                    { color: theme.textSecondary },
                  ]}
                >
                  {updateInfo.releaseNotes}
                </Text>
              </ScrollView>
            </View>
          )}

          {/* Force Update Message */}
          {updateInfo.isForceUpdate && (
            <View
              style={[
                styles.forceUpdateMessage,
                { backgroundColor: theme.background },
              ]}
            >
              <Ionicons name='warning' size={20} color={theme.accent} />
              <Text style={[styles.forceUpdateText, { color: theme.text }]}>
                This update is required to continue using the app.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {!updateInfo.isForceUpdate && (
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={handleSkip}
                disabled={isUpdating}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Skip This Version
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              onPress={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size='small' color='white' />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {updateInfo.isForceUpdate ? 'Update Now' : 'Update'}
                  </Text>
                  <Ionicons name='arrow-forward' size={16} color='white' />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface UpdateBannerProps {
  updateInfo: UpdateInfo;
  onPress: () => void;
  onDismiss: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({
  updateInfo,
  onPress,
  onDismiss,
}) => {
  const { mode, getCurrentTheme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const theme = getCurrentTheme();
  const isDark =
    mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';

  if (!updateInfo.isUpdateAvailable || updateInfo.isForceUpdate) {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: theme.accent }]}>
      <View style={styles.bannerContent}>
        <Ionicons name='arrow-up-circle' size={20} color='white' />
        <Text style={styles.bannerText}>
          Update to v{updateInfo.latestVersion} available
        </Text>
      </View>
      <View style={styles.bannerActions}>
        <TouchableOpacity onPress={onPress} style={styles.bannerButton}>
          <Text style={styles.bannerButtonText}>Update</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss} style={styles.bannerDismiss}>
          <Ionicons name='close' size={16} color='white' />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  versionInfo: {
    marginBottom: 20,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  releaseNotesContainer: {
    marginBottom: 20,
  },
  releaseNotesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  releaseNotesScroll: {
    maxHeight: 120,
    borderRadius: 8,
    padding: 12,
  },
  releaseNotesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  forceUpdateMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  forceUpdateText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Banner styles
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  bannerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerDismiss: {
    padding: 4,
  },
});
