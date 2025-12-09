import { supabase } from '@/configs/supabase-config';

export interface Todo {
    id: string;
    title: string;
    description: string;
    icon: string;
    isCompleted: boolean;
    created_at: string;
    completedAt: string | null;
    user_id: string;
}

export interface Session {
    id: string;
    duration: number;
    type: 'focus' | 'break';
    completedAt: string;
    user_id: string;
}

export interface UserSettings {
    id: string;
    focusDuration: number;
    breakDuration: number;
    notifications: boolean;
    theme: string;
    userName: string;
    onboardingCompleted: boolean;
    user_id: string;
    hasProAccess?: boolean;
}

export class SupabaseService {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    // Todo operations
    async getTodos(): Promise<Todo[]> {
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createTodo(
        todo: Omit<Todo, 'id' | 'createdAt' | 'isCompleted' | 'user_id'>,
    ): Promise<string> {
        const { data, error } = await supabase
            .from('todos')
            .insert({
                ...todo,
                user_id: this.userId,
                isCompleted: false,
                created_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    }

    async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
        const { error } = await supabase
            .from('todos')
            .update(updates)
            .eq('id', id)
            .eq('user_id', this.userId);

        if (error) throw error;
    }

    async deleteTodo(id: string): Promise<void> {
        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id)
            .eq('user_id', this.userId);

        if (error) throw error;
    }

    // Session operations
    async getSessions(): Promise<Session[]> {
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', this.userId)
            .order('completedAt', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createSession(session: Omit<Session, 'id' | 'user_id'>): Promise<string> {
        const { data, error } = await supabase
            .from('sessions')
            .insert({
                ...session,
                user_id: this.userId,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    }

    // Settings operations
    async getSettings(): Promise<UserSettings | null> {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', this.userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
        if (!data) return null;

        // Transform snake_case to camelCase
        return {
            id: data.id,
            focusDuration: data.focus_duration,
            breakDuration: data.break_duration,
            notifications: data.notifications,
            theme: data.theme,
            userName: data.user_name,
            onboardingCompleted: data.onboarding_completed,
            user_id: data.user_id,
            hasProAccess: data.has_pro_access ?? false,
        };
    }

    async updateSettings(settings: Partial<UserSettings>): Promise<void> {
        // Map camelCase to snake_case for database
        const updateData: any = {};

        if (settings.focusDuration !== undefined)
            updateData.focus_duration = settings.focusDuration;
        if (settings.breakDuration !== undefined)
            updateData.break_duration = settings.breakDuration;
        if (settings.notifications !== undefined) updateData.notifications = settings.notifications;
        if (settings.theme !== undefined) updateData.theme = settings.theme;
        if (settings.userName !== undefined) updateData.user_name = settings.userName;
        if (settings.onboardingCompleted !== undefined)
            updateData.onboarding_completed = settings.onboardingCompleted;
        if (settings.hasProAccess !== undefined) updateData.has_pro_access = settings.hasProAccess;

        // Check if settings already exist
        const existingSettings = await this.getSettings();

        if (existingSettings) {
            // Update existing settings
            const { error } = await supabase
                .from('user_settings')
                .update(updateData)
                .eq('user_id', this.userId);

            if (error) throw error;
        } else {
            // Insert new settings
            updateData.user_id = this.userId;
            const { error } = await supabase.from('user_settings').insert(updateData);

            if (error) {
                // If insert fails due to duplicate key, try update instead
                // This handles race conditions where settings were created between check and insert
                if (error.code === '23505') {
                    const { error: updateError } = await supabase
                        .from('user_settings')
                        .update(updateData)
                        .eq('user_id', this.userId);

                    if (updateError) throw updateError;
                } else {
                    throw error;
                }
            }
        }
    }
}

// Factory function to create service instance
export const createSupabaseService = (userId: string) => new SupabaseService(userId);
