import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

interface SectionHeaderProps {
    title: string;
}

/**
 * A reusable section header component used in settings screens
 * @param title - The section title text
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
    const { theme } = useTheme();

    return <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{title}</Text>;
};

const styles = StyleSheet.create({
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 32,
        marginBottom: 8,
        marginHorizontal: 20,
        letterSpacing: 0.5,
    },
});
