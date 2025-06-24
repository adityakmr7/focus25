export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    username: string | null;
                    full_name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    username?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    duration: number;
                    completed_at: string;
                    session_type: string;
                    notes: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    duration: number;
                    completed_at?: string;
                    session_type: string;
                    notes?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    duration?: number;
                    completed_at?: string;
                    session_type?: string;
                    notes?: string | null;
                };
            };
            statistics: {
                Row: {
                    id: string;
                    user_id: string;
                    date: string;
                    total_focus_time: number;
                    total_sessions: number;
                    total_breaks: number;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    date: string;
                    total_focus_time?: number;
                    total_sessions?: number;
                    total_breaks?: number;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    date?: string;
                    total_focus_time?: number;
                    total_sessions?: number;
                    total_breaks?: number;
                };
            };
            settings: {
                Row: {
                    id: string;
                    user_id: string;
                    time_duration: number;
                    sound_effects: boolean;
                    notifications: boolean;
                    dark_mode: boolean;
                    auto_break: boolean;
                    focus_reminders: boolean;
                    weekly_reports: boolean;
                    data_sync: boolean;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    time_duration?: number;
                    sound_effects?: boolean;
                    notifications?: boolean;
                    dark_mode?: boolean;
                    auto_break?: boolean;
                    focus_reminders?: boolean;
                    weekly_reports?: boolean;
                    data_sync?: boolean;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    time_duration?: number;
                    sound_effects?: boolean;
                    notifications?: boolean;
                    dark_mode?: boolean;
                    auto_break?: boolean;
                    focus_reminders?: boolean;
                    weekly_reports?: boolean;
                    data_sync?: boolean;
                };
            };
        };
    };
}
