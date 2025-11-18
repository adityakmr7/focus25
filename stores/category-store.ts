import { create } from 'zustand';

export type CategoryKey = 'HEALTH' | 'WORK' | 'MENTAL_HEALTH';

export interface CategoryItem {
    key: CategoryKey;
    label: string;
    color: string;
}

interface CategoryState {
    categories: CategoryItem[];
}

export const useCategoryStore = create<CategoryState>(() => ({
    categories: [
        { key: 'HEALTH', label: 'HEALTH', color: '#A3E635' }, // lime-400
        { key: 'WORK', label: 'WORK', color: '#D4D4D8' }, // zinc-300
        { key: 'MENTAL_HEALTH', label: 'MENTAL HEALTH', color: '#93C5FD' }, // blue-300
    ],
}));


