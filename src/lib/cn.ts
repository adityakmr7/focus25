// src/utils/cn.ts
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class strings intelligently,
 * allowing conditional objects, arrays, etc.
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(...inputs));
}

export default cn;
