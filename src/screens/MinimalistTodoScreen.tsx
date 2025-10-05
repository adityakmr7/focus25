/**
 * Minimalist TodoScreen
 * A clean, minimalist todo app matching the design from the image
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Animated,
  Keyboard,
  Platform,
  LayoutAnimation,
  UIManager,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useTodoStore } from '../store/todoStore';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  
  createdAt: Date;
}

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MinimalistTodoScreen: React.FC = () => {
  const { theme } = useTheme();
  const { todos, loadTodos, isInitialized,createTodo, toggleTodo, deleteTodo } = useTodoStore();

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [buttonScaleAnim] = useState(new Animated.Value(1));
  const [inputScaleAnim] = useState(new Animated.Value(0.9));
  const [fabScaleAnim] = useState(new Animated.Value(1));

  const [todoItemAnims] = useState<{ [key: string]: Animated.Value }>({});
 
  
  useEffect(() => {
    if (!isInitialized) {
        loadTodos();
    }
}, [isInitialized, loadTodos]);
  // Refs for animations
  const addButtonRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  // Get current date formatted like in the image
  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return today.toLocaleDateString('en-GB', options);
  };

  // Group todos by date sections
  const groupTodosByDate = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groupedTodos = {
      today: [] as any[],
      yesterday: [] as any[],
      older: [] as any[]
    };

    todos.forEach(todo => {
      if (!todo.createdAt) return;
      
      const todoDate = new Date(todo.createdAt);
      const todoDateString = todoDate.toDateString();
      const todayString = today.toDateString();
      const yesterdayString = yesterday.toDateString();
      
      if (todoDateString === todayString) {
        groupedTodos.today.push(todo);
      } else if (todoDateString === yesterdayString) {
        groupedTodos.yesterday.push(todo);
      } else {
        groupedTodos.older.push(todo);
      }
    });

    return groupedTodos;
  };

  const groupedTodos = groupTodosByDate();

  // Format date for section headers
  const getSectionDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short' 
      };
      return date.toLocaleDateString('en-GB', options);
    }
  };

  // Animation functions
  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const animateButtonPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonScaleAnim]);

  const animateInputFocus = useCallback(() => {
    Animated.parallel([
      Animated.spring(inputScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [inputScaleAnim, fadeAnim]);

  const animateFabPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(fabScaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fabScaleAnim]);

  const animateTodoItem = useCallback((todoId: string, delay: number = 0) => {
    if (!todoItemAnims[todoId]) {
      todoItemAnims[todoId] = new Animated.Value(0);
    }
    
    Animated.timing(todoItemAnims[todoId], {
      toValue: 1,
      duration: 300,
      delay,
      useNativeDriver: true,
    }).start();
  }, [todoItemAnims]);

  const animateTodoComplete = useCallback((todoId: string) => {
    if (todoItemAnims[todoId]) {
      Animated.sequence([
        Animated.timing(todoItemAnims[todoId], {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(todoItemAnims[todoId], {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [todoItemAnims]);

  useEffect(() => {
    animateIn();
  }, [animateIn]);

  // Animate todo items when they change
  useEffect(() => {
    todos.forEach((todo, index) => {
      if (!todoItemAnims[todo.id]) {
        animateTodoItem(todo.id, index * 100);
      }
    });
  }, [todos, todoItemAnims, animateTodoItem]);

  const handleAddItem = useCallback(() => {
    animateButtonPress();
    setTimeout(() => {
      setIsAddingItem(true);
      animateInputFocus();
    }, 150);
  }, [animateButtonPress, animateInputFocus]);

  const handleSaveItem = useCallback(async () => {
    if (newItemText.trim()) {
      try {
        // Animate input scale down before saving
        Animated.timing(inputScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }).start(() => {
          Animated.timing(inputScaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start();
        });

        await createTodo({
          title: newItemText.trim(),
        });
        
        // Layout animation for smooth list update
        LayoutAnimation.configureNext({
          duration: 300,
          create: { type: 'easeInEaseOut', property: 'opacity' },
          update: { type: 'easeInEaseOut' },
          delete: { type: 'easeInEaseOut', property: 'opacity' },
        });
        
        setNewItemText('');
        setIsAddingItem(false);
        Keyboard.dismiss();
      } catch (error) {
        console.error('Failed to create todo:', error);
      }
    }
  }, [newItemText, createTodo, inputScaleAnim]);

  const handleCancelAdd = useCallback(() => {
    Animated.timing(inputScaleAnim, {
      toValue: 0.9,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setNewItemText('');
      setIsAddingItem(false);
      Keyboard.dismiss();
    });
  }, [inputScaleAnim]);

  const handleToggleTodo = useCallback(async (id: string) => {
    try {
      // Animate the completion
      animateTodoComplete(id);
      
      // Small delay before actual toggle for better UX
      setTimeout(async () => {
        await toggleTodo(id);
      }, 100);
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  }, [toggleTodo, animateTodoComplete]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    try {
      // Animate item removal
      if (todoItemAnims[id]) {
        Animated.timing(todoItemAnims[id], {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(async () => {
          await deleteTodo(id);
        });
      } else {
        await deleteTodo(id);
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  }, [deleteTodo, todoItemAnims]);

  // Render todo section with date header
  const renderTodoSection = (sectionKey: string, sectionTodos: any[], sectionDate: Date) => {
    console.log('MinimalistTodoScreen: sectionTodos', sectionTodos);
    if (sectionTodos.length === 0) return null;

    return (
      <View key={sectionKey} style={styles.todoSection}>
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          {getSectionDate(sectionDate)}
        </Text>
        {sectionTodos.map((todo, index) => {
          const itemAnim = todoItemAnims[todo.id] || new Animated.Value(1);
          
          return (
            <Animated.View
              key={todo.id}
                style={[
                  styles.todoItem,
                  {
                    opacity: itemAnim,
                    transform: [
                      {
                        translateY: itemAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                      {
                        scale: itemAnim,
                      },
                    ],
                  },
                ]}
            >
              <TouchableOpacity
                style={styles.todoContent}
                onPress={() => handleToggleTodo(todo.id)}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: theme.border,
                      backgroundColor: todo.isCompleted ? theme.text : 'transparent',
                      transform: [
                        {
                          scale: todo.isCompleted ? 1.1 : 1,
                        },
                      ],
                    },
                  ]}
                >
                  {todo.isCompleted && (
                    <Animated.View
                      style={{
                        transform: [
                          {
                            scale: todo.isCompleted ? 1 : 0,
                          },
                        ],
                      }}
                    >
                      <Ionicons name="checkmark" size={12} color={theme.background} />
                    </Animated.View>
                  )}
                </Animated.View>
                <Animated.Text
                  style={[
                    styles.todoText,
                    {
                      color: todo.isCompleted ? theme.textSecondary : theme.text,
                      textDecorationLine: todo.isCompleted ? 'line-through' : 'none',
                      transform: [
                        {
                          translateX: todo.isCompleted ? 5 : 0,
                        },
                      ],
                    },
                  ]}
                >
                  {todo.title}
                </Animated.Text>
              </TouchableOpacity>
              
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: itemAnim,
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTodo(todo.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  // Empty state
  if (!isAddingItem && todos.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>todo</Text>
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {getCurrentDate()}
            </Text>
          </View>

          {/* Add Item Button */}
          <View style={styles.centerContent}>
            <Animated.View
              style={{
                transform: [
                  { scale: buttonScaleAnim },
                  { scale: scaleAnim },
                ],
              }}
            >
              <TouchableOpacity
                ref={addButtonRef}
                style={[styles.addButton, { backgroundColor: theme.text }]}
                onPress={handleAddItem}
                activeOpacity={0.8}
              >
                <Text style={[styles.addButtonText, { color: theme.background }]}>
                  + Add item
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Hint Text */}
          <View style={styles.hintContainer}>
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              What do you want to do today?
            </Text>
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              Start adding items to your to-do list.
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Adding item state
  if (isAddingItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>todo</Text>
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {getCurrentDate()}
            </Text>
          </View>

          {/* Input Field */}
          <View style={styles.centerContent}>
            <Animated.View
              style={[
                styles.inputContainer, 
                { 
                  borderColor: theme.border,
                  transform: [{ scale: inputScaleAnim }],
                }
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[styles.textInput, { color: theme.text }]}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="What do you want to do?"
                placeholderTextColor={theme.textSecondary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveItem}
                onBlur={handleCancelAdd}
              />
              <Animated.View
                style={{
                  transform: [{ scale: newItemText.trim() ? 1.1 : 1 }],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.addIconButton, 
                    { 
                      backgroundColor: newItemText.trim() ? theme.text : theme.border,
                    }
                  ]}
                  onPress={handleSaveItem}
                  disabled={!newItemText.trim()}
                >
                  <Ionicons 
                    name="add" 
                    size={16} 
                    color={newItemText.trim() ? theme.background : theme.textSecondary} 
                  />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>

          {/* Hint Text */}
          <View style={styles.hintContainer}>
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              What do you want to do today?
            </Text>
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              Start adding items to your to-do list.
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Items added state
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header with FAB */}
        <View style={styles.headerWithFab}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.text }]}>todo</Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {getCurrentDate()}
            </Text>
          </View>
          
          <Animated.View
            style={{
              transform: [{ scale: fabScaleAnim }],
            }}
          >
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: theme.text }]}
              onPress={() => {
                animateFabPress();
                handleAddItem();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={theme.background} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Todo Items by Date Sections */}
        <ScrollView style={styles.todoList} showsVerticalScrollIndicator={false}>
          {renderTodoSection('today', groupedTodos.today, new Date())}
          {renderTodoSection('yesterday', groupedTodos.yesterday, new Date(Date.now() - 24 * 60 * 60 * 1000))}
          
          {/* Render older todos grouped by date */}
          {groupedTodos.older.length > 0 && (
            (() => {
              const olderGrouped: { [key: string]: any[] } = {};
              groupedTodos.older.forEach(todo => {
                const dateKey = new Date(todo.createdAt).toDateString();
                if (!olderGrouped[dateKey]) {
                  olderGrouped[dateKey] = [];
                }
                olderGrouped[dateKey].push(todo);
              });
              
              return Object.keys(olderGrouped).map(dateKey => {
                const sectionTodos = olderGrouped[dateKey];
                const sectionDate = new Date(dateKey);
                return renderTodoSection(dateKey, sectionTodos, sectionDate);
              });
            })()
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
  },
  headerWithFab: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    // paddingTop: 40,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 280,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  addIconButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  hintContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  hintText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  todoList: {
    flex: 1,
    paddingTop: 20,
  },
  todoSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  todoText: {
    fontSize: 16,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default MinimalistTodoScreen;
