import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    FlatList,
} from 'react-native';
import { TimeDuration } from '../store/settingsStore';

interface TimeDurationSelectorProps {
    value: TimeDuration;
    onChange: (duration: TimeDuration) => void;
}

const DURATION_OPTIONS: TimeDuration[] = [5, 10, 15, 20, 25];

export const TimeDurationSelector: React.FC<TimeDurationSelectorProps> = ({
    value,
    onChange,
}) => {
    const [modalVisible, setModalVisible] = useState(false);

    const handleSelect = (duration: TimeDuration) => {
        onChange(duration);
        setModalVisible(false);
    };

    return (
        <>
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.selector}
            >
                <Text className={"text-text-primary dark:text-dark-text-primary"}>
                    {value} minutes
                </Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View className={"bg-bg-200 dark:bg-dark-bg-200"} style={styles.modalContent}>
                        <Text className={"text-text-primary dark:text-dark-text-primary"} style={styles.modalTitle}>
                            Select Duration
                        </Text>
                        <FlatList
                            data={DURATION_OPTIONS}
                            keyExtractor={(item) => item.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.option,
                                        value === item && styles.selectedOption
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text
                                        className={`${
                                            value === item
                                                ? "text-text-primary dark:text-dark-text-primary"
                                                : "text-text-secondary dark:text-dark-text-secondary"
                                        }`}
                                        style={styles.optionText}
                                    >
                                        {item} minutes
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text className={"text-text-primary dark:text-dark-text-primary"}>
                                Cancel
                            </Text>
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
    selectedOption: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
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