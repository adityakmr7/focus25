import TypographyText from '@/components/TypographyText';
import { TodoSection } from '@/utils/dateUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-heroui';

interface SectionHeaderProps {
    section: TodoSection;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ section }) => {
    const { theme } = useTheme();

    // Special styling for today's section to match mock
    const isTodaySection = section.title === 'For Today';
    const formattedDate = `${section.date.getDate()} ${section.date.toLocaleString('en-US', {
        month: 'short',
    })}`;

    if (isTodaySection) {
        return (
            <View style={styles.todayHeader}>
                <TypographyText
                    variant="title"
                    color="default"
                    style={[styles.todayText, { color: theme.colors.foreground }]}
                >
                    Today
                </TypographyText>
                <TypographyText
                    variant="title"
                    color="secondary"
                    style={[styles.todayDate, { color: theme.colors['default-900'] }]}
                >
                    {formattedDate}
                </TypographyText>
            </View>
        );
    }

    // Fallback for non-today sections
    return (
        <View style={styles.sectionHeader}>
            <TypographyText variant="title" color="default" style={styles.sectionTitle}>
                {section.title}
            </TypographyText>
            <TypographyText variant="caption" color="secondary" style={styles.sectionCount}>
                {section.todos.length} {section.todos.length === 1 ? 'todo' : 'todos'}
            </TypographyText>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    todayHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 12,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    todayText: {
        fontSize: 28,
        fontWeight: '800',
    },
    todayDate: {
        fontSize: 24,
        fontWeight: '700',
        opacity: 0.6,
    },
    sectionCount: {
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.7,
    },
});

export default SectionHeader;
