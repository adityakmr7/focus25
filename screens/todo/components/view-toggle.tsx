import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Box, Button, HStack, useTheme } from 'react-native-heroui';

interface ViewToggleProps {
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewModeChange }) => {
    const { theme } = useTheme();

    return (
        <Box style={styles.viewToggleContainer}>
            <HStack color="secondary" gap="sm">
                <Button
                    colorScheme="secondary"
                    variant={viewMode === 'grid' ? 'solid' : 'outline'}
                    size="sm"
                    onPress={() => onViewModeChange('grid')}
                    style={styles.viewToggleButton}
                >
                    <Ionicons
                        name="grid"
                        size={18}
                        color={
                            viewMode === 'grid' ? theme.colors.background : theme.colors.foreground
                        }
                    />
                </Button>
                <Button
                    colorScheme="secondary"
                    variant={viewMode === 'list' ? 'solid' : 'outline'}
                    size="sm"
                    onPress={() => onViewModeChange('list')}
                    style={styles.viewToggleButton}
                >
                    <Ionicons
                        name="list"
                        size={18}
                        color={
                            viewMode === 'list' ? theme.colors.background : theme.colors.foreground
                        }
                    />
                </Button>
            </HStack>
        </Box>
    );
};

const styles = StyleSheet.create({
    viewToggleContainer: {
        marginBottom: 20,
        alignItems: 'flex-end',
    },
    viewToggleButton: {
        minWidth: 40,
        height: 40,
    },
});

export default ViewToggle;
