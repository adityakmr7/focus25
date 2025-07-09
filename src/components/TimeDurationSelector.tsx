import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';
import { TimeDuration } from '../store/settingsStore';
import { useThemeStore } from '../store/themeStore';
import { useColorScheme } from 'react-native';

interface TimeDurationSelectorProps {
    value: TimeDuration;
    onChange: (duration: TimeDuration) => void;
}

const DURATION_OPTIONS: TimeDuration[] = [1, 5, 10, 15, 20, 25];

export const TimeDurationSelector: React.FC<TimeDurationSelectorProps> = ({ value, onChange }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { mode, getCurrentTheme } = useThemeStore();
    const systemColorScheme = useColorScheme();
    const theme = getCurrentTheme();
    const isDark = mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';

    const handleSelect = (duration: TimeDuration) => {
        onChange(duration);
        setModalVisible(false);
    };

    return (
        <>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.selector}>
                <Text style={{ color: theme.text }}>{value} minutes</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            Select Duration
                        </Text>
                        <FlatList
                            data={DURATION_OPTIONS}
                            keyExtractor={(item) => item.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.option,
                                        value === item && { backgroundColor: theme.accent + '20' },
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            {
                                                color: value === item ? theme.accent : theme.text,
                                            },
                                        ]}
                                    >
                                        {item} minutes
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: theme.background }]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={{ color: theme.text }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    selector: {
        padding: 8,
        borderRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        borderRadius: 12,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    option: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    optionText: {
        fontSize: 16,
    },
    closeButton: {
        marginTop: 16,
        padding: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
});
