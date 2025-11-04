import { useTheme, Button, Card, CardBody, CardHeader } from 'react-native-heroui';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import TypographyText from '@/components/TypographyText';
import { TaskAdd01Icon } from '@hugeicons/core-free-icons';
import HugeIconView from '@/components/ui/huge-icon-view';
interface EmptyStateProps {
    viewMode?: 'grid' | 'list';
}

const EmptyState: React.FC<EmptyStateProps> = ({ viewMode = 'grid' }) => {
    const { theme } = useTheme();

    const handleCreateTodo = () => {
        router.push('/(create-todo)/create-todo');
    };

    return (
        <View style={styles.container}>
            <Card
                onPress={handleCreateTodo}
                variant="flat"
                style={[{ backgroundColor: theme.colors.background }]}
            >
                <CardHeader style={styles.header}>
                    <HugeIconView size={40} icon={TaskAdd01Icon} />
                </CardHeader>

                <CardBody style={styles.body}>
                    <TypographyText
                        variant="title"
                        style={[styles.title, { color: theme.colors.foreground }]}
                    >
                        No todos yet
                    </TypographyText>

                    <TypographyText
                        variant="body"
                        style={[styles.subtitle, { color: theme.colors.foreground }]}
                    >
                        {viewMode === 'grid'
                            ? 'Start organizing your day by creating your first todo. Break down your goals into manageable tasks and stay productive!'
                            : 'Create your first todo to get started. You can organize them by priority, due date, or category.'}
                    </TypographyText>
                </CardBody>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        paddingBottom: 0,
    },
    icon: {
        fontSize: 40,
    },
    body: {
        alignItems: 'center',
        paddingTop: 0,
    },
    title: {
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: '600',
    },
    subtitle: {
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        opacity: 0.7,
    },
    buttonContainer: {
        width: '100%',
    },
    createButton: {
        borderRadius: 12,
        paddingVertical: 14,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default EmptyState;
