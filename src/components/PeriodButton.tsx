import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface PeriodButtonProps {
    period: string;
    isSelected: boolean;
    onPress: () => void;
}

export const PeriodButton = ({ period, isSelected, onPress }: PeriodButtonProps) => (
    <TouchableOpacity
        style={[styles.periodButton, isSelected && styles.selectedPeriodButton]}
        onPress={onPress}
    >
        <Text style={[styles.periodText, isSelected && styles.selectedPeriodText]}>{period}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    selectedPeriodButton: {
        backgroundColor: '#555555',
    },
    periodText: {
        color: '#888888',
        fontSize: 16,
        fontWeight: '500',
    },
    selectedPeriodText: {
        color: '#ffffff',
    },
});
