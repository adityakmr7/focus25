import TypographyText from "@/components/TypographyText";
import { useTodoStore } from "@/stores/todo-store";
import { isToday } from "@/utils/dateUtils";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-heroui";

interface TodoSelectionSheetProps {
  onSelectTodo: (todoId: string | null, todoTitle: string | null) => void;
  selectedTodoId: string | null;
}

const TodoSelectionSheet = forwardRef<BottomSheet, TodoSelectionSheetProps>(
  ({ onSelectTodo, selectedTodoId }, ref) => {
    const { theme } = useTheme();
    const { todos, getActiveTodos } = useTodoStore();
    const activeTodos = getActiveTodos();

    // Filter todos to only show today's todos
    const todayTodos = useMemo(() => {
      return activeTodos.filter(
        (todo) => todo.createdAt && isToday(todo.createdAt)
      );
    }, [activeTodos]);

    const snapPoints = useMemo(() => ["50%", "75%"], []);

    const renderBackdrop = (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    );

    const handleSelectTodo = (todoId: string, todoTitle: string) => {
      onSelectTodo(todoId, todoTitle);
      (ref as any)?.current?.close();
    };

    const handleClearSelection = () => {
      onSelectTodo(null, null);
      (ref as any)?.current?.close();
    };

    const renderTodoItem = ({ item }: { item: any }) => {
      const isSelected = item.id === selectedTodoId;

      return (
        <TouchableOpacity
          style={[
            styles.todoItem,
            {
              backgroundColor: isSelected
                ? theme.colors.primary + "20"
                : theme.colors.content1,
              borderColor: isSelected
                ? theme.colors.primary
                : theme.colors.content3,
            },
          ]}
          onPress={() => handleSelectTodo(item.id, item.title)}
        >
          <View style={styles.todoContent}>
            <TypographyText
              variant="body"
              size="sm"
              color="default"
              style={styles.todoTitle}
            >
              {item.title}
            </TypographyText>
            {item.description && (
              <TypographyText
                variant="body"
                size="sm"
                color="default"
                style={styles.todoDescription}
              >
                {item.description}
              </TypographyText>
            )}
          </View>
          {isSelected && (
            <View
              style={[
                styles.selectedIndicator,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          )}
        </TouchableOpacity>
      );
    };

    return (
      <BottomSheet
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        index={-1}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: theme.colors.background,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.content3,
        }}
      >
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <TypographyText variant="heading" size="lg" color="default">
              Select a Todo
            </TypographyText>
            <TypographyText
              variant="body"
              size="sm"
              color="default"
              style={styles.subtitle}
            >
              Choose which task you&apos;re working on
            </TypographyText>
          </View>

          {selectedTodoId && (
            <TouchableOpacity
              style={[
                styles.clearButton,
                {
                  backgroundColor: theme.colors.content2,
                  borderColor: theme.colors.content3,
                },
              ]}
              onPress={handleClearSelection}
            >
              <TypographyText variant="body" size="sm" color="default">
                Clear Selection
              </TypographyText>
            </TouchableOpacity>
          )}

          {todayTodos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <TypographyText
                variant="body"
                size="sm"
                color="default"
                style={styles.emptyText}
              >
                No todos for today. Create one to get started!
              </TypographyText>
            </View>
          ) : (
            <BottomSheetFlatList
              data={todayTodos}
              keyExtractor={(item) => item.id}
              renderItem={renderTodoItem}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </BottomSheet>
    );
  }
);

TodoSelectionSheet.displayName = "TodoSelectionSheet";

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  todoDescription: {
    opacity: 0.7,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
  },
});

export default TodoSelectionSheet;
