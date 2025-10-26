import TypographyText from '@/components/TypographyText';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-heroui';

interface TodoCardProps {
    todo: any;
    index: number;
    viewMode: 'grid' | 'list';
    onToggle: (id: string) => void;
    onEdit: (todo: any) => void;
}

const TodoCard: React.FC<TodoCardProps> = ({ todo, index, viewMode, onToggle, onEdit }) => {
    const { theme } = useTheme();

    // Safety check for todo object
    if (!todo || !todo.id) {
        return null;
    }

    const getTodoIcon = (index: number) => {
        const icons = [
            'library-outline',
            'checkmark-square-outline',
            'search-outline',
            'create-outline',
        ];
        return icons[index % icons.length];
    };

    const icon = getTodoIcon(index);
    const isGrid = viewMode === 'grid';

    return (
        <TouchableOpacity
            key={todo.id}
            style={[
                isGrid ? styles.taskCard : styles.taskCardList,
                {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.content3,
                },
            ]}
            onPress={() => onToggle(todo.id)}
            onLongPress={() => onEdit(todo)}
        >
            <View style={isGrid ? styles.taskCardContent : styles.taskCardContentList}>
                <View style={isGrid ? styles.taskCardLeft : styles.taskCardLeftList}>
                    <Ionicons
                        name={icon as any}
                        size={24}
                        color={theme.colors.foreground}
                        style={styles.taskIcon}
                    />
                    <TypographyText
                        variant="body"
                        color="default"
                        style={styles.taskText}
                        numberOfLines={isGrid ? 1 : 2}
                    >
                        {todo.title || 'Untitled Todo'}
                    </TypographyText>
                </View>
                <View style={styles.taskCardRight}>
                    <TouchableOpacity style={styles.editButton} onPress={() => onEdit(todo)}>
                        <Ionicons name="create-outline" size={16} color={theme.colors.content4} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.checkbox,
                            {
                                backgroundColor: Boolean(todo.isCompleted)
                                    ? theme.colors.primary
                                    : theme.colors.background,
                                borderColor: theme.colors.content3,
                            },
                        ]}
                        onPress={() => onToggle(todo.id)}
                    >
                        {Boolean(todo.isCompleted) && (
                            <Ionicons name="checkmark" size={16} color={theme.colors.background} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    taskCard: {
        width: '48%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        minHeight: 100,
    },
    taskCardList: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        minHeight: 80,
    },
    taskCardContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    taskCardContentList: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    taskCardLeft: {
        flex: 1,
    },
    taskCardLeftList: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    taskCardRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    editButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    taskIcon: {
        marginBottom: 12,
    },
    taskText: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
        flexWrap: 'wrap',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default TodoCard;
