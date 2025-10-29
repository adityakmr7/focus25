import { useTheme, Button, Card, CardBody, CardHeader } from 'react-native-heroui';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import TypographyText from '@/components/TypographyText';

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
            <Card style={[styles.card, { backgroundColor: theme.colors.background }]}>
                <CardHeader style={styles.header}>
                    <View style={styles.iconContainer}>
                        <TypographyText variant="heading" style={styles.icon}>
                            📝
                        </TypographyText>
                    </View>
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

                    <View style={styles.buttonContainer}>
                        <Button
                            onPress={handleCreateTodo}
                            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                        >
                            <TypographyText
                                variant="body"
                                style={[styles.buttonText, { color: 'white' }]}
                            >
                                Create Your First Todo
                            </TypographyText>
                        </Button>
                    </View>
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
    card: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        alignItems: 'center',
        paddingBottom: 0,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
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
