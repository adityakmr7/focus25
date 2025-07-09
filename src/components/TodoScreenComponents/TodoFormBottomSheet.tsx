import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Alert,
    KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useTheme } from '../../providers/ThemeProvider';
import { Todo, TodoPriority, TodoCategory } from '../../types/database';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
} from 'react-native-reanimated';

interface TodoFormBottomSheetProps {
    onSave: (todo: Partial<Todo>) => void;
    onCancel: () => void;
}

export interface TodoFormBottomSheetMethods {
    openForCreate: () => void;
    openForEdit: (todo: Todo) => void;
    close: () => void;
}

const TodoFormBottomSheet = forwardRef<TodoFormBottomSheetMethods, TodoFormBottomSheetProps>(
    ({ onSave, onCancel }, ref) => {
        const { theme } = useTheme();
        const bottomSheetRef = React.useRef<BottomSheetMethods>(null);
        
        const [editingTodo, setEditingTodo] = useState<Todo | undefined>();
        const [title, setTitle] = useState('');
        const [description, setDescription] = useState('');
        const [priority, setPriority] = useState<TodoPriority>(TodoPriority.MEDIUM);
        const [category, setCategory] = useState<TodoCategory>(TodoCategory.PERSONAL);
        const [dueDate, setDueDate] = useState('');
        const [tags, setTags] = useState('');

        const animatedValue = useSharedValue(0);

        const snapPoints = useMemo(() => ['90%'], []);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                />
            ),
            [],
        );

        useImperativeHandle(ref, () => ({
            openForCreate: () => {
                resetForm();
                setEditingTodo(undefined);
                bottomSheetRef.current?.expand();
            },
            openForEdit: (todo: Todo) => {
                setEditingTodo(todo);
                setTitle(todo.title);
                setDescription(todo.description || '');
                setPriority(todo.priority);
                setCategory(todo.category);
                setDueDate(todo.dueDate || '');
                setTags(todo.tags?.join(', ') || '');
                bottomSheetRef.current?.expand();
            },
            close: () => {
                bottomSheetRef.current?.close();
            },
        }));

        const resetForm = () => {
            setTitle('');
            setDescription('');
            setPriority(TodoPriority.MEDIUM);
            setCategory(TodoCategory.PERSONAL);
            setDueDate('');
            setTags('');
        };

        const handleClose = () => {
            resetForm();
            setEditingTodo(undefined);
            onCancel();
        };

        const handleSave = () => {
            if (!title.trim()) {
                Alert.alert('Error', 'Please enter a title for your todo');
                return;
            }

            const todoData: Partial<Todo> = {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                category,
                dueDate: dueDate || undefined,
                tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
            };

            if (editingTodo) {
                todoData.id = editingTodo.id;
            }

            onSave(todoData);
            bottomSheetRef.current?.close();
        };

        const getPriorityColor = (priorityLevel: TodoPriority) => {
            switch (priorityLevel) {
                case TodoPriority.URGENT:
                    return '#EF4444';
                case TodoPriority.HIGH:
                    return '#F59E0B';
                case TodoPriority.MEDIUM:
                    return '#3B82F6';
                case TodoPriority.LOW:
                    return '#10B981';
                default:
                    return theme.textSecondary;
            }
        };

        const getCategoryIcon = (categoryType: TodoCategory) => {
            switch (categoryType) {
                case TodoCategory.WORK:
                    return 'briefcase-outline';
                case TodoCategory.PERSONAL:
                    return 'person-outline';
                case TodoCategory.HEALTH:
                    return 'fitness-outline';
                case TodoCategory.LEARNING:
                    return 'book-outline';
                case TodoCategory.SHOPPING:
                    return 'basket-outline';
                case TodoCategory.PROJECTS:
                    return 'folder-outline';
                case TodoCategory.HABITS:
                    return 'repeat-outline';
                default:
                    return 'list-outline';
            }
        };

        useEffect(() => {
            animatedValue.value = withTiming(1, { duration: 600 });
        }, []);

        const animatedStyle = useAnimatedStyle(() => {
            return {
                opacity: interpolate(animatedValue.value, [0, 1], [0, 1]),
                transform: [{ translateY: interpolate(animatedValue.value, [0, 1], [30, 0]) }],
            };
        });

        return (
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: theme.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
                onClose={handleClose}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
                        <Animated.View style={[styles.content, animatedStyle]}>
                            <View style={styles.header}>
                                <Text style={[styles.title, { color: theme.text }]}>
                                    {editingTodo ? 'Edit Todo' : 'New Todo'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => bottomSheetRef.current?.close()}
                                    style={styles.closeButton}
                                >
                                    <Ionicons name="close" size={24} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Title</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: theme.background,
                                                borderColor: theme.textSecondary + '30',
                                                color: theme.text,
                                            },
                                        ]}
                                        value={title}
                                        onChangeText={setTitle}
                                        placeholder="Enter todo title..."
                                        placeholderTextColor={theme.textSecondary}
                                        returnKeyType="next"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                                    <TextInput
                                        style={[
                                            styles.textArea,
                                            {
                                                backgroundColor: theme.background,
                                                borderColor: theme.textSecondary + '30',
                                                color: theme.text,
                                            },
                                        ]}
                                        value={description}
                                        onChangeText={setDescription}
                                        placeholder="Enter description (optional)..."
                                        placeholderTextColor={theme.textSecondary}
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
                                    <View style={styles.priorityContainer}>
                                        {Object.values(TodoPriority).map((priorityLevel) => (
                                            <TouchableOpacity
                                                key={priorityLevel}
                                                style={[
                                                    styles.priorityButton,
                                                    {
                                                        backgroundColor:
                                                            priority === priorityLevel
                                                                ? getPriorityColor(priorityLevel) + '20'
                                                                : theme.background,
                                                        borderColor:
                                                            priority === priorityLevel
                                                                ? getPriorityColor(priorityLevel)
                                                                : theme.textSecondary + '30',
                                                    },
                                                ]}
                                                onPress={() => setPriority(priorityLevel)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.priorityText,
                                                        {
                                                            color:
                                                                priority === priorityLevel
                                                                    ? getPriorityColor(priorityLevel)
                                                                    : theme.textSecondary,
                                                        },
                                                    ]}
                                                >
                                                    {priorityLevel.toUpperCase()}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                                    <View style={styles.categoryContainer}>
                                        {Object.values(TodoCategory).map((categoryType) => (
                                            <TouchableOpacity
                                                key={categoryType}
                                                style={[
                                                    styles.categoryButton,
                                                    {
                                                        backgroundColor:
                                                            category === categoryType
                                                                ? theme.accent + '20'
                                                                : theme.background,
                                                        borderColor:
                                                            category === categoryType
                                                                ? theme.accent
                                                                : theme.textSecondary + '30',
                                                    },
                                                ]}
                                                onPress={() => setCategory(categoryType)}
                                            >
                                                <Ionicons
                                                    name={getCategoryIcon(categoryType)}
                                                    size={16}
                                                    color={
                                                        category === categoryType
                                                            ? theme.accent
                                                            : theme.textSecondary
                                                    }
                                                />
                                                <Text
                                                    style={[
                                                        styles.categoryText,
                                                        {
                                                            color:
                                                                category === categoryType
                                                                    ? theme.accent
                                                                    : theme.textSecondary,
                                                        },
                                                    ]}
                                                >
                                                    {categoryType.charAt(0).toUpperCase() +
                                                        categoryType.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Due Date</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: theme.background,
                                                borderColor: theme.textSecondary + '30',
                                                color: theme.text,
                                            },
                                        ]}
                                        value={dueDate}
                                        onChangeText={setDueDate}
                                        placeholder="YYYY-MM-DD (optional)"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Tags</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: theme.background,
                                                borderColor: theme.textSecondary + '30',
                                                color: theme.text,
                                            },
                                        ]}
                                        value={tags}
                                        onChangeText={setTags}
                                        placeholder="Enter tags separated by commas..."
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                </View>

                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={[styles.cancelButton, { backgroundColor: theme.background }]}
                                        onPress={() => bottomSheetRef.current?.close()}
                                    >
                                        <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.saveButton, { backgroundColor: theme.accent }]}
                                        onPress={handleSave}
                                    >
                                        <Text style={styles.saveButtonText}>
                                            {editingTodo ? 'Update' : 'Create'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>
                    </BottomSheetScrollView>
                </KeyboardAvoidingView>
            </BottomSheet>
        );
    },
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        fontWeight: '500',
        height: 100,
    },
    priorityContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    priorityButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

export default TodoFormBottomSheet;