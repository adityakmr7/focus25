import { TodoSection } from '@/utils/dateUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import SectionHeader from './section-header';
import TodoCard from './todo-card';

interface TodoSectionProps {
    section: TodoSection;
    viewMode: 'grid' | 'list';
    onToggleTodo: (id: string) => void;
    onEditTodo: (todo: any) => void;
}

const TodoSectionComponent: React.FC<TodoSectionProps> = ({
    section,
    viewMode,
    onToggleTodo,
    onEditTodo,
}) => {
    const isGrid = viewMode === 'grid';

    return (
        <View style={styles.section}>
            <SectionHeader section={section} />
            <View style={isGrid ? styles.sectionContent : styles.sectionContentList}>
                {section.todos
                    .filter((todo) => todo && todo.id && todo.title)
                    .map((todo, index) => (
                        <TodoCard
                            key={todo.id}
                            todo={todo}
                            index={index}
                            viewMode={viewMode}
                            onToggle={onToggleTodo}
                            onEdit={onEditTodo}
                        />
                    ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sectionContentList: {
        flexDirection: 'column',
        gap: 8,
    },
});

export default TodoSectionComponent;
