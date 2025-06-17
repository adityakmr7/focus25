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
import { useThemeStore, AccentColor, TimerStyle, ThemeMode } from '../store/themeStore';
import ColorPicker from 'react-native-wheel-color-picker';

interface ThemeCustomizationScreenProps {
  navigation?: {
    goBack: () => void;
  };
}

const ThemeCustomizationScreen: React.FC<ThemeCustomizationScreenProps> = ({ navigation }) => {
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
    Alert.alert(
      'Delete Theme',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCustomTheme(name),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Theme Customization</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Mode Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme Mode</Text>
          <View style={styles.optionsGrid}>
            {themeModes.map((themeMode) => (
              <TouchableOpacity
                key={themeMode.key}
                style={[
                  styles.optionCard,
                  { backgroundColor: theme.surface },
                  mode === themeMode.key && { borderColor: theme.accent, borderWidth: 2 },
                ]}
                onPress={() => setMode(themeMode.key)}
              >
                <Ionicons
                  name={themeMode.icon as any}
                  size={24}
                  color={mode === themeMode.key ? theme.accent : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.optionText,
                    { color: mode === themeMode.key ? theme.accent : theme.textSecondary },
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Accent Color</Text>
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
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Timer Style Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Timer Style</Text>
          <View style={styles.optionsGrid}>
            {timerStyles.map((style) => (
              <TouchableOpacity
                key={style.key}
                style={[
                  styles.optionCard,
                  { backgroundColor: theme.surface },
                  timerStyle === style.key && { borderColor: theme.accent, borderWidth: 2 },
                ]}
                onPress={() => setTimerStyle(style.key)}
              >
                <Ionicons
                  name={style.icon as any}
                  size={24}
                  color={timerStyle === style.key ? theme.accent : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.optionText,
                    { color: timerStyle === style.key ? theme.accent : theme.textSecondary },
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Themes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Custom Themes</Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.accent }]}
              onPress={() => setShowCreateTheme(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>

          {Object.keys(customThemes).length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No custom themes created yet
            </Text>
          ) : (
            <View style={styles.customThemesList}>
              {Object.entries(customThemes).map(([name, customTheme]) => (
                <View
                  key={name}
                  style={[
                    styles.customThemeCard,
                    { backgroundColor: theme.surface },
                    activeCustomTheme === name && { borderColor: theme.accent, borderWidth: 2 },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.customThemeContent}
                    onPress={() => setActiveCustomTheme(activeCustomTheme === name ? null : name)}
                  >
                    <View style={styles.customThemeInfo}>
                      <Text style={[styles.customThemeName, { color: theme.text }]}>{name}</Text>
                      <View style={styles.customThemeColors}>
                        <View style={[styles.colorPreview, { backgroundColor: customTheme.accent }]} />
                        <View style={[styles.colorPreview, { backgroundColor: customTheme.primary }]} />
                        <View style={[styles.colorPreview, { backgroundColor: customTheme.surface }]} />
                      </View>
                    </View>
                    {activeCustomTheme === name && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.accent} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteCustomTheme(name)}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Custom Theme Modal */}
      <Modal visible={showCreateTheme} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create Custom Theme</Text>
            
            <TextInput
              style={[styles.themeNameInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Theme name"
              placeholderTextColor={theme.textSecondary}
              value={customThemeName}
              onChangeText={setCustomThemeName}
            />

            <TouchableOpacity
              style={[styles.colorPickerButton, { backgroundColor: selectedColor }]}
              onPress={() => setShowColorPicker(true)}
            >
              <Text style={styles.colorPickerText}>Select Accent Color</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.background }]}
                onPress={() => setShowCreateTheme(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.accent }]}
                onPress={handleCreateCustomTheme}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.colorPickerModal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Color</Text>
            <ColorPicker
              color={selectedColor}
              onColorChange={setSelectedColor}
              thumbSize={30}
              sliderSize={30}
              noSnap={true}
              row={false}
            />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.accent }]}
              onPress={() => setShowColorPicker(false)}
            >
              <Text style={[styles.modalButtonText, { color: '#fff' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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