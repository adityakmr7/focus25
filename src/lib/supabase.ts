import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    },
});

// Helper function to sign in anonymously
export const signInAnonymously = async () => {
    try {
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
            console.error('Anonymous sign-in error:', error);
            throw error;
        }

        console.log('Anonymous user signed in:', data.user?.id);
        return data;
    } catch (error) {
        console.error('Failed to sign in anonymously:', error);
        throw error;
    }
};

// Helper function to get current session
export const getCurrentSession = async () => {
    try {
        const {
            data: { session },
            error,
        } = await supabase.auth.getSession();

        if (error) {
            console.error('Get session error:', error);
            throw error;
        }

        return session;
    } catch (error) {
        console.error('Failed to get current session:', error);
        throw error;
    }
};

// Helper function to sign out
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Sign out error:', error);
            throw error;
        }

        console.log('User signed out successfully');
    } catch (error) {
        console.error('Failed to sign out:', error);
        throw error;
    }
};
