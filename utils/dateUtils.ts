import { Todo } from '@/services/local-database-service';

export interface TodoSection {
    title: string;
    date: Date;
    todos: Todo[];
}

/**
 * Get a formatted date string for section headers
 */
export const getDateString = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Reset time to compare only dates
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
    );
    const twoDaysAgoOnly = new Date(
        twoDaysAgo.getFullYear(),
        twoDaysAgo.getMonth(),
        twoDaysAgo.getDate(),
    );
    const threeDaysAgoOnly = new Date(
        threeDaysAgo.getFullYear(),
        threeDaysAgo.getMonth(),
        threeDaysAgo.getDate(),
    );

    if (dateOnly.getTime() === todayOnly.getTime()) {
        return 'For Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
        return 'Yesterday';
    } else if (dateOnly.getTime() === twoDaysAgoOnly.getTime()) {
        return '1D Ago';
    } else if (dateOnly.getTime() === threeDaysAgoOnly.getTime()) {
        return '2D Ago';
    } else {
        // For older dates, show the actual date
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
};

/**
 * Group todos by date and create sections
 */
export const groupTodosByDate = (todos: Todo[]): TodoSection[] => {
    // Sort todos by creation date (newest first)
    const sortedTodos = [...todos].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Group todos by date
    const groupedTodos = new Map<string, Todo[]>();

    sortedTodos.forEach((todo) => {
        const dateKey = new Date(todo.createdAt).toDateString();
        if (!groupedTodos.has(dateKey)) {
            groupedTodos.set(dateKey, []);
        }
        groupedTodos.get(dateKey)!.push(todo);
    });

    // Convert to sections array
    const sections: TodoSection[] = [];

    groupedTodos.forEach((todos, dateKey) => {
        const date = new Date(dateKey);
        sections.push({
            title: getDateString(date),
            date: date,
            todos: todos,
        });
    });

    // Sort sections by date (newest first)
    return sections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Get relative time string for a date
 */
export const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
        return 'Today';
    } else if (diffInDays === 1) {
        return 'Yesterday';
    } else if (diffInDays === 2) {
        return '2 days ago';
    } else if (diffInDays === 3) {
        return '3 days ago';
    } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
        const years = Math.floor(diffInDays / 365);
        return years === 1 ? '1 year ago' : `${years} years ago`;
    }
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

/**
 * Check if a date is yesterday
 */
export const isYesterday = (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
};

/**
 * Get section title with count
 */
export const getSectionTitleWithCount = (section: TodoSection): string => {
    const count = section.todos.length;
    return `${section.title} (${count})`;
};
