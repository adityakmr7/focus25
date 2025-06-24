import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    Dimensions,
    Share,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { useGoalsStore, Goal, GoalType, GoalCategory } from '../store/goalsStore';

const { height } = Dimensions.get('window');

interface GoalsModalProps {
    visible: boolean;
    onClose: () => void;
}

const goalCategories: { key: GoalCategory; label: string; icon: string; color: string }[] = [
    { key: 'sessions', label: 'Sessions', icon: 'timer', color: '#FF6B6B' },
    { key: 'focus_time', label: 'Focus Time', icon: 'time', color: '#4ECDC4' },
    { key: 'streak', label: 'Streak', icon: 'flame', color: '#FFD93D' },
    { key: 'consistency', label: 'Consistency', icon: 'calendar', color: '#9F7AEA' },
];

const goalTypes: { key: GoalType; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
];

export const GoalsModal: React.FC<GoalsModalProps> = ({ visible, onClose }) => {
    const { theme } = useTheme();
    const { goals, createGoal, deleteGoal, getActiveGoals, getCompletedGoals, exportGoalsToCSV } =
        useGoalsStore();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'sessions' as GoalCategory,
        type: 'daily' as GoalType,
        target: 5,
        unit: 'sessions',
    });

    const activeGoals = getActiveGoals();
    const completedGoals = getCompletedGoals();

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            category: 'sessions',
            type: 'daily',
            target: 5,
            unit: 'sessions',
        });
    };

    const handleCreateGoal = () => {
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a goal title');
            return;
        }

        if (formData.target <= 0) {
            Alert.alert('Error', 'Please enter a valid target');
            return;
        }

        createGoal(formData);
        resetForm();
        setShowCreateForm(false);
        Alert.alert('Success', 'Goal created successfully!');
    };

    const handleDeleteGoal = (goalId: string, goalTitle: string) => {
        Alert.alert('Delete Goal', `Are you sure you want to delete "${goalTitle}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteGoal(goalId),
            },
        ]);
    };

    const handleExportData = async () => {
        try {
            const csvData = exportGoalsToCSV();

            if (Platform.OS === 'web') {
                // For web, create a download link
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `goals_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                Alert.alert('Success', 'Goals exported successfully!');
            } else {
                // For mobile, use Share API
                await Share.share({
                    message: csvData,
                    title: 'Goals Export',
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to export goals');
        }
    };

    const getCategoryInfo = (category: GoalCategory) => {
        return goalCategories.find((cat) => cat.key === category) || goalCategories[0];
    };

    const getProgressPercentage = (goal: Goal) => {
        return Math.min((goal.current / goal.target) * 100, 100);
    };

    const renderGoalCard = (goal: Goal) => {
        const categoryInfo = getCategoryInfo(goal.category);
        const progressPercentage = getProgressPercentage(goal);

        return (
            <View key={goal.id} style={[styles.goalCard, { backgroundColor: theme.background }]}>
                <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                        <View
                            style={[
                                styles.categoryIcon,
                                { backgroundColor: categoryInfo.color + '20' },
                            ]}
                        >
                            <Ionicons
                                name={categoryInfo.icon as any}
                                size={20}
                                color={categoryInfo.color}
                            />
                        </View>
                        <View style={styles.goalText}>
                            <Text style={[styles.goalTitle, { color: theme.text }]}>
                                {goal.title}
                            </Text>
                            <Text style={[styles.goalDescription, { color: theme.textSecondary }]}>
                                {goal.description}
                            </Text>
                            <Text style={[styles.goalType, { color: theme.textSecondary }]}>
                                {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal
                            </Text>
                        </View>
                    </View>

                    {!goal.isCompleted && (
                        <TouchableOpacity
                            onPress={() => handleDeleteGoal(goal.id, goal.title)}
                            style={styles.deleteButton}
                        >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.progressSection}>
                    <View style={styles.progressInfo}>
                        <Text style={[styles.progressText, { color: theme.text }]}>
                            {goal.current} / {goal.target} {goal.unit}
                        </Text>
                        <Text style={[styles.progressPercentage, { color: categoryInfo.color }]}>
                            {Math.round(progressPercentage)}%
                        </Text>
                    </View>

                    <View style={[styles.progressBar, { backgroundColor: theme.surface }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${progressPercentage}%`,
                                    backgroundColor: goal.isCompleted
                                        ? '#10B981'
                                        : categoryInfo.color,
                                },
                            ]}
                        />
                    </View>

                    {goal.isCompleted && (
                        <View style={styles.completedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text style={[styles.completedText, { color: '#10B981' }]}>
                                Completed!
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderCreateForm = () => (
        <View style={styles.createForm}>
            <Text style={[styles.formTitle, { color: theme.text }]}>Create New Goal</Text>

            <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Title</Text>
                <TextInput
                    style={[
                        styles.formInput,
                        { backgroundColor: theme.background, color: theme.text },
                    ]}
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    placeholder="Enter goal title"
                    placeholderTextColor={theme.textSecondary}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                <TextInput
                    style={[
                        styles.formInput,
                        { backgroundColor: theme.background, color: theme.text },
                    ]}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Enter goal description"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                />
            </View>

            <View style={styles.formRow}>
                <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>Category</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                    >
                        {goalCategories.map((category) => (
                            <TouchableOpacity
                                key={category.key}
                                style={[
                                    styles.categoryChip,
                                    formData.category === category.key && {
                                        backgroundColor: category.color + '20',
                                    },
                                ]}
                                onPress={() => setFormData({ ...formData, category: category.key })}
                            >
                                <Ionicons
                                    name={category.icon as any}
                                    size={16}
                                    color={category.color}
                                />
                                <Text style={[styles.categoryChipText, { color: category.color }]}>
                                    {category.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <View
                style={[
                    styles.formRow,
                    {
                        flexDirection: 'column',
                    },
                ]}
            >
                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>Type</Text>
                    <View style={styles.typeButtons}>
                        {goalTypes.map((type) => (
                            <TouchableOpacity
                                key={type.key}
                                style={[
                                    styles.typeButton,
                                    { backgroundColor: theme.background },
                                    formData.type === type.key && {
                                        backgroundColor: theme.accent + '20',
                                    },
                                ]}
                                onPress={() => setFormData({ ...formData, type: type.key })}
                            >
                                <Text
                                    style={[
                                        styles.typeButtonText,
                                        {
                                            color:
                                                formData.type === type.key
                                                    ? theme.accent
                                                    : theme.textSecondary,
                                        },
                                    ]}
                                >
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>Target</Text>
                    <TextInput
                        style={[
                            styles.formInput,
                            { backgroundColor: theme.background, color: theme.text },
                        ]}
                        value={formData.target.toString()}
                        onChangeText={(text) =>
                            setFormData({ ...formData, target: parseInt(text) || 0 })
                        }
                        placeholder="0"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={styles.formActions}>
                <TouchableOpacity
                    style={[styles.formButton, { backgroundColor: theme.background }]}
                    onPress={() => {
                        setShowCreateForm(false);
                        resetForm();
                    }}
                >
                    <Text style={[styles.formButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.formButton, { backgroundColor: theme.accent }]}
                    onPress={handleCreateGoal}
                >
                    <Text style={[styles.formButtonText, { color: '#fff' }]}>Create Goal</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View
                                style={[
                                    styles.headerIcon,
                                    { backgroundColor: theme.accent + '20' },
                                ]}
                            >
                                <Ionicons name="flag" size={24} color={theme.accent} />
                            </View>
                            <View>
                                <Text style={[styles.headerTitle, { color: theme.text }]}>
                                    Goals
                                </Text>
                                <Text
                                    style={[styles.headerSubtitle, { color: theme.textSecondary }]}
                                >
                                    Track your progress
                                </Text>
                            </View>
                        </View>

                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={handleExportData}
                                style={[styles.exportButton, { backgroundColor: theme.background }]}
                            >
                                <Ionicons name="download-outline" size={20} color={theme.accent} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {!showCreateForm && (
                        <>
                            {/* Tabs */}
                            <View style={styles.tabs}>
                                <TouchableOpacity
                                    style={[
                                        styles.tab,
                                        selectedTab === 'active' && {
                                            backgroundColor: theme.accent + '20',
                                        },
                                    ]}
                                    onPress={() => setSelectedTab('active')}
                                >
                                    <Text
                                        style={[
                                            styles.tabText,
                                            {
                                                color:
                                                    selectedTab === 'active'
                                                        ? theme.accent
                                                        : theme.textSecondary,
                                            },
                                        ]}
                                    >
                                        Active ({activeGoals.length})
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.tab,
                                        selectedTab === 'completed' && {
                                            backgroundColor: '#10B981' + '20',
                                        },
                                    ]}
                                    onPress={() => setSelectedTab('completed')}
                                >
                                    <Text
                                        style={[
                                            styles.tabText,
                                            {
                                                color:
                                                    selectedTab === 'completed'
                                                        ? '#10B981'
                                                        : theme.textSecondary,
                                            },
                                        ]}
                                    >
                                        Completed ({completedGoals.length})
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Create Goal Button */}
                            <TouchableOpacity
                                style={[styles.createButton, { backgroundColor: theme.accent }]}
                                onPress={() => setShowCreateForm(true)}
                            >
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.createButtonText}>Create New Goal</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Content */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {showCreateForm ? (
                            renderCreateForm()
                        ) : (
                            <View style={styles.goalsList}>
                                {selectedTab === 'active' ? (
                                    activeGoals.length > 0 ? (
                                        activeGoals.map(renderGoalCard)
                                    ) : (
                                        <View style={styles.emptyState}>
                                            <Ionicons
                                                name="flag-outline"
                                                size={48}
                                                color={theme.textSecondary}
                                            />
                                            <Text
                                                style={[
                                                    styles.emptyText,
                                                    { color: theme.textSecondary },
                                                ]}
                                            >
                                                No active goals yet
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.emptySubtext,
                                                    { color: theme.textSecondary },
                                                ]}
                                            >
                                                Create your first goal to start tracking progress
                                            </Text>
                                        </View>
                                    )
                                ) : completedGoals.length > 0 ? (
                                    completedGoals.map(renderGoalCard)
                                ) : (
                                    <View style={styles.emptyState}>
                                        <Ionicons
                                            name="trophy-outline"
                                            size={48}
                                            color={theme.textSecondary}
                                        />
                                        <Text
                                            style={[
                                                styles.emptyText,
                                                { color: theme.textSecondary },
                                            ]}
                                        >
                                            No completed goals yet
                                        </Text>
                                        <Text
                                            style={[
                                                styles.emptySubtext,
                                                { color: theme.textSecondary },
                                            ]}
                                        >
                                            Complete your first goal to see it here
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: height * 0.9,
        minHeight: height * 0.6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    exportButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabs: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    goalsList: {
        gap: 16,
    },
    goalCard: {
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    goalInfo: {
        flexDirection: 'row',
        flex: 1,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    goalText: {
        flex: 1,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    goalDescription: {
        fontSize: 14,
        marginBottom: 4,
    },
    goalType: {
        fontSize: 12,
        fontWeight: '500',
    },
    deleteButton: {
        padding: 8,
    },
    progressSection: {
        gap: 8,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 14,
        fontWeight: '500',
    },
    progressPercentage: {
        fontSize: 14,
        fontWeight: '700',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    completedText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    createForm: {
        gap: 20,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 10,
    },
    formGroup: {
        gap: 8,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    formInput: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        fontSize: 16,
        minHeight: 48,
    },
    formRow: {
        flexDirection: 'row',
        gap: 16,
    },
    categoryScroll: {
        flexDirection: 'row',
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: 8,
        gap: 6,
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    typeButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    formButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    formButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
