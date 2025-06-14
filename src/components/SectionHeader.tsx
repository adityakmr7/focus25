import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface SectionHeaderProps {
    title: string;
}

/**
 * A reusable section header component used in settings screens
 * @param title - The section title text
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
    <Text className={"color-text-primary dark:color-dark-text-primary"} style={styles.sectionHeader}>{title}</Text>
);

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
