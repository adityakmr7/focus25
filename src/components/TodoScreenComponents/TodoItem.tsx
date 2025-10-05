import { Todo } from '../../types/database';
import React, { useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../../hooks/useTheme';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  delay?: number;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onEdit,
  onDelete,
  delay = 0,
}) => {
  const { theme } = useTheme();
  const animatedValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.9);
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);
  const SWIPE_THRESHOLD = -80;

  useEffect(() => {
    animatedValue.value = withDelay(delay, withTiming(1, { duration: 600 }));
    scaleValue.value = withDelay(delay, withTiming(1, { duration: 600 }));
  }, [delay]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      translateX.value = 0;
      deleteOpacity.value = 0;
    })
    .onUpdate(event => {
      const clampedTranslateX = Math.min(0, event.translationX);
      translateX.value = clampedTranslateX;

      // Show delete background as user swipes
      const progress = Math.abs(clampedTranslateX) / Math.abs(SWIPE_THRESHOLD);
      deleteOpacity.value = Math.min(1, progress);
    })
    .onEnd(event => {
      const shouldDelete = event.translationX <= SWIPE_THRESHOLD;

      if (shouldDelete) {
        // Animate out and delete
        translateX.value = withTiming(-400, { duration: 300 });
        deleteOpacity.value = withTiming(1, { duration: 300 });
        runOnJS(onDelete)(todo.id);
      } else {
        // Snap back to original position
        translateX.value = withSpring(0, { damping: 15, stiffness: 300 });
        deleteOpacity.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animatedValue.value, [0, 1], [0, 1]),
      transform: [
        { translateY: interpolate(animatedValue.value, [0, 1], [30, 0]) },
        { scale: scaleValue.value },
        { translateX: translateX.value },
      ],
    };
  });

  const deleteBackgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: deleteOpacity.value,
    };
  });

  return (
    <View style={styles.todoContainer}>
      <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle]}>
        <View style={styles.deleteContent}>
          <Ionicons name='trash' size={24} color='white' />
          <Text style={styles.deleteText}>Delete</Text>
        </View>
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.todoItem,
            { backgroundColor: theme.surface },
            animatedStyle,
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => onToggle(todo.id)}
          >
            <View style={styles.todoContent}>
              <View style={styles.todoHeader}>
                <Text
                  style={[
                    styles.todoTitle,
                    {
                      color: todo.isCompleted
                        ? theme.textSecondary
                        : theme.text,
                      textDecorationLine: todo.isCompleted
                        ? 'line-through'
                        : 'none',
                    },
                  ]}
                >
                  {todo.title}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  todoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  deleteContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
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
  todoCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  todoContent: {
    flex: 1,
  },
  todoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  todoMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoryContainer: {
    padding: 4,
  },
  todoDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.8,
  },
  todoDueDate: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.7,
  },
  todoActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TodoItem;
