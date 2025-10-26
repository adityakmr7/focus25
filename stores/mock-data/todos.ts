import type { Todo } from "../todo-store";

// Helper function to create dates relative to today
const getDate = (daysAgo: number, hours: number = 9) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, 0, 0, 0);
  return date;
};

export const mockTodos: Todo[] = [
  // Today's todos (most recent)
  {
    id: "1",
    title: "Complete project documentation",
    description:
      "Write comprehensive documentation for the Focus25 app including setup instructions and feature descriptions",
    icon: "bookmark",
    isCompleted: false,
    createdAt: getDate(0, 9), // Today 9 AM
    completedAt: null,
  },
  {
    id: "2",
    title: "Review pull requests",
    description:
      "Review and provide feedback on pending pull requests from team members",
    icon: "checkmark-circle",
    isCompleted: true,
    createdAt: getDate(0, 10), // Today 10 AM
    completedAt: getDate(0, 14), // Today 2 PM
  },
  {
    id: "3",
    title: "Fix navigation bug",
    description:
      "Investigate and fix the navigation issue on the settings screen",
    icon: "flash",
    isCompleted: false,
    createdAt: getDate(0, 8), // Today 8 AM
    completedAt: null,
  },
  {
    id: "4",
    title: "Implement dark mode",
    description: "Add full dark mode support across all screens and components",
    icon: "star",
    isCompleted: false,
    createdAt: getDate(0, 11), // Today 11 AM
    completedAt: null,
  },

  // Yesterday's todos
  {
    id: "5",
    title: "Update dependencies",
    description: "Update all npm packages to their latest stable versions",
    icon: "flash",
    isCompleted: false,
    createdAt: getDate(1, 9), // Yesterday 9 AM
    completedAt: null,
  },
  {
    id: "6",
    title: "Write unit tests",
    description: "Create comprehensive unit tests for all core functionality",
    icon: "checkmark-circle",
    isCompleted: true,
    createdAt: getDate(1, 10), // Yesterday 10 AM
    completedAt: getDate(1, 15), // Yesterday 3 PM
  },
  {
    id: "7",
    title: "Design new app icon",
    description:
      "Create a modern and appealing app icon for both iOS and Android",
    icon: "star",
    isCompleted: true,
    createdAt: getDate(1, 13), // Yesterday 1 PM
    completedAt: getDate(1, 16), // Yesterday 4 PM
  },

  // 2 days ago
  {
    id: "8",
    title: "Optimize app performance",
    description: "Profile and optimize app performance, reduce bundle size",
    icon: "flash",
    isCompleted: true,
    createdAt: getDate(2, 9), // 2 days ago 9 AM
    completedAt: getDate(2, 11), // 2 days ago 11 AM
  },
  {
    id: "9",
    title: "Setup CI/CD pipeline",
    description: "Configure continuous integration and deployment pipeline",
    icon: "bookmark",
    isCompleted: false,
    createdAt: getDate(2, 14), // 2 days ago 2 PM
    completedAt: null,
  },

  // 3 days ago
  {
    id: "10",
    title: "User research interviews",
    description: "Conduct user interviews to gather feedback on app usability",
    icon: "heart",
    isCompleted: true,
    createdAt: getDate(3, 10), // 3 days ago 10 AM
    completedAt: getDate(3, 12), // 3 days ago 12 PM
  },
  {
    id: "11",
    title: "Database optimization",
    description: "Optimize database queries and add proper indexing",
    icon: "star",
    isCompleted: false,
    createdAt: getDate(3, 15), // 3 days ago 3 PM
    completedAt: null,
  },

  // 1 week ago
  {
    id: "12",
    title: "Initial app setup",
    description: "Set up the basic project structure and dependencies",
    icon: "checkmark-circle",
    isCompleted: true,
    createdAt: getDate(7, 9), // 1 week ago 9 AM
    completedAt: getDate(7, 11), // 1 week ago 11 AM
  },
];
