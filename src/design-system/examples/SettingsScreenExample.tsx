/**
 * Design System Settings Screen Example
 * Demonstrates how to use the design system components in a settings screen
 */
// @ts-nocheck

import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import {
  Container,
  Stack,
  Spacer,
  Card,
  CardHeader,
  CardContent,
  SettingItem,
  Input,
  Button,
  Switch,
} from '../index';

export const SettingsScreenExample: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoStart, setAutoStart] = useState(false);
  const [focusDuration, setFocusDuration] = useState('25');
  const [breakDuration, setBreakDuration] = useState('5');

  return (
    <ScrollView style={{ flex: 1 }}>
      <Container padding="lg">
        <Stack direction="column" gap="lg">
          {/* Timer Settings */}
          <Card variant="elevated" padding="md">
            <CardHeader
              title="Timer Settings"
              subtitle="Customize your focus sessions"
              icon="time"
            />
            <CardContent>
              <Stack direction="column" gap="md">
                <Input
                  label="Focus Duration (minutes)"
                  value={focusDuration}
                  onChangeText={setFocusDuration}
                  keyboardType="numeric"
                  leftIcon="time"
                  placeholder="25"
                />
                <Input
                  label="Break Duration (minutes)"
                  value={breakDuration}
                  onChangeText={setBreakDuration}
                  keyboardType="numeric"
                  leftIcon="pause"
                  placeholder="5"
                />
                <SettingItem
                  title="Auto-start breaks"
                  subtitle="Automatically start break timer after focus sessions"
                  icon="play"
                  hasSwitch
                  switchValue={autoStart}
                  onSwitchToggle={() => setAutoStart(!autoStart)}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card variant="elevated" padding="md">
            <CardHeader
              title="Notifications"
              subtitle="Manage your notification preferences"
              icon="notifications"
            />
            <CardContent>
              <Stack direction="column" gap="sm">
                <SettingItem
                  title="Enable Notifications"
                  subtitle="Get notified when sessions complete"
                  icon="notifications"
                  hasSwitch
                  switchValue={notifications}
                  onSwitchToggle={() => setNotifications(!notifications)}
                />
                <SettingItem
                  title="Sound Effects"
                  subtitle="Play sounds for timer events"
                  icon="volume-high"
                  hasSwitch
                  switchValue={soundEnabled}
                  onSwitchToggle={() => setSoundEnabled(!soundEnabled)}
                />
                <SettingItem
                  title="Notification Sound"
                  subtitle="Choose your notification sound"
                  icon="musical-notes"
                  showArrow
                  value="Default"
                  onPress={() => console.log('Select sound')}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card variant="elevated" padding="md">
            <CardHeader
              title="Appearance"
              subtitle="Customize the app's look and feel"
              icon="color-palette"
            />
            <CardContent>
              <Stack direction="column" gap="sm">
                <SettingItem
                  title="Theme"
                  subtitle="Choose your preferred theme"
                  icon="moon"
                  showArrow
                  value="Auto"
                  onPress={() => console.log('Select theme')}
                />
                <SettingItem
                  title="Accent Color"
                  subtitle="Customize the app's accent color"
                  icon="color-filter"
                  showArrow
                  value="Blue"
                  onPress={() => console.log('Select color')}
                />
                <SettingItem
                  title="Font Size"
                  subtitle="Adjust text size"
                  icon="text"
                  showArrow
                  value="Medium"
                  onPress={() => console.log('Select font size')}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card variant="elevated" padding="md">
            <CardHeader
              title="Data & Privacy"
              subtitle="Manage your data and privacy settings"
              icon="shield-checkmark"
            />
            <CardContent>
              <Stack direction="column" gap="sm">
                <SettingItem
                  title="Analytics"
                  subtitle="Help improve the app by sharing usage data"
                  icon="analytics"
                  hasSwitch
                  switchValue={true}
                  onSwitchToggle={() => console.log('Toggle analytics')}
                />
                <SettingItem
                  title="Export Data"
                  subtitle="Download your focus data"
                  icon="download"
                  showArrow
                  onPress={() => console.log('Export data')}
                />
                <SettingItem
                  title="Clear Data"
                  subtitle="Reset all app data"
                  icon="trash"
                  variant="destructive"
                  showArrow
                  onPress={() => console.log('Clear data')}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* About */}
          <Card variant="elevated" padding="md">
            <CardHeader
              title="About"
              subtitle="App information and support"
              icon="information-circle"
            />
            <CardContent>
              <Stack direction="column" gap="sm">
                <SettingItem
                  title="Version"
                  subtitle="Current app version"
                  icon="code"
                  value="1.0.0"
                />
                <SettingItem
                  title="Help & Support"
                  subtitle="Get help and contact support"
                  icon="help-circle"
                  showArrow
                  onPress={() => console.log('Help')}
                />
                <SettingItem
                  title="Rate App"
                  subtitle="Rate us on the App Store"
                  icon="star"
                  showArrow
                  onPress={() => console.log('Rate app')}
                />
                <SettingItem
                  title="Privacy Policy"
                  subtitle="Read our privacy policy"
                  icon="document-text"
                  showArrow
                  onPress={() => console.log('Privacy policy')}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Stack direction="row" gap="md" wrap>
            <Button
              variant="outline"
              size="md"
              onPress={() => console.log('Reset settings')}
            >
              Reset to Defaults
            </Button>
            <Button
              variant="primary"
              size="md"
              onPress={() => console.log('Save settings')}
            >
              Save Changes
            </Button>
          </Stack>

          <Spacer size="xl" />
        </Stack>
      </Container>
    </ScrollView>
  );
};
