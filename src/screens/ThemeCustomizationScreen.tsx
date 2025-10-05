import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useThemeStore,
  AccentColor,
  TimerStyle,
  ThemeMode,
} from '../store/themeStore';

interface ThemeCustomizationScreenProps {
  navigation?: {
    goBack: () => void;
  };
}

const ThemeCustomizationScreen: React.FC<ThemeCustomizationScreenProps> = ({
  navigation,
}) => {
  const {
    mode,
    accentColor,
    timerStyle,
    customThemes,
    activeCustomTheme,
    setMode,
    setAccentColor,
    setTimerStyle,
    createCustomTheme,
    setActiveCustomTheme,
    deleteCustomTheme,
    getCurrentTheme,
    getAccentColors,
  } = useThemeStore();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#48BB78');
  const [customThemeName, setCustomThemeName] = useState('');
  const [showCreateTheme, setShowCreateTheme] = useState(false);

  const theme = getCurrentTheme();
  const accentColors = getAccentColors();

  const themeModes: { key: ThemeMode; label: string; icon: string }[] = [
    { key: 'light', label: 'Light', icon: 'sunny' },
    { key: 'dark', label: 'Dark', icon: 'moon' },
    { key: 'auto', label: 'Auto', icon: 'phone-portrait' },
  ];

  const timerStyles: { key: TimerStyle; label: string; icon: string }[] = [
    { key: 'digital', label: 'Digital', icon: 'calculator' },
    { key: 'analog', label: 'Analog', icon: 'time' },
    { key: 'minimal', label: 'Minimal', icon: 'remove' },
  ];

  const handleCreateCustomTheme = () => {
    if (!customThemeName.trim()) {
      Alert.alert('Error', 'Please enter a theme name');
      return;
    }

    if (customThemes[customThemeName]) {
      Alert.alert('Error', 'Theme name already exists');
      return;
    }

    createCustomTheme(customThemeName, {
      ...theme,
      accent: selectedColor,
    });

    setCustomThemeName('');
    setShowCreateTheme(false);
    Alert.alert('Success', 'Custom theme created!');
  };

  const handleDeleteCustomTheme = (name: string) => {
    Alert.alert('Delete Theme', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCustomTheme(name),
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.surface }]}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
        >
          <Ionicons name='arrow-back' size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Custom</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Mode Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Theme Mode
          </Text>
          <View style={styles.optionsGrid}>
            {themeModes.map(themeMode => (
              <TouchableOpacity
                key={themeMode.key}
                style={[
                  styles.optionCard,
                  { backgroundColor: theme.surface },
                  mode === themeMode.key && {
                    borderColor: theme.accent,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setMode(themeMode.key)}
              >
                <Ionicons
                  name={themeMode.icon as any}
                  size={24}
                  color={
                    mode === themeMode.key ? theme.accent : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        mode === themeMode.key
                          ? theme.accent
                          : theme.textSecondary,
                    },
                  ]}
                >
                  {themeMode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accent Color Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Accent Color
          </Text>
          <View style={styles.colorGrid}>
            {Object.entries(accentColors).map(([key, color]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  accentColor === key && styles.selectedColor,
                ]}
                onPress={() => setAccentColor(key as AccentColor)}
              >
                {accentColor === key && (
                  <Ionicons name='checkmark' size={20} color='#fff' />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  customThemesList: {
    gap: 12,
  },
  customThemeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  customThemeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customThemeInfo: {
    flex: 1,
  },
  customThemeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  customThemeColors: {
    flexDirection: 'row',
    gap: 4,
  },
  colorPreview: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  colorPickerModal: {
    width: '90%',
    height: '70%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  themeNameInput: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  colorPickerButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  colorPickerText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontWeight: '600',
  },
});

export default ThemeCustomizationScreen;
