import { create } from 'zustand';
import { onAuthStateChanged, getCurrentUser, getUserProfile, UserProfile } from '../config/firebase';

interface AuthState {
    user: UserProfile | null;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
    
    // Actions
    initializeAuth: () => void;
    setUser: (user: UserProfile | null) => void;
    clearUser: () => void;
    updateUserProfile: (updates: Partial<UserProfile>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    isInitialized: false,
    error: null,

    initializeAuth: () => {
        if (get().isInitialized) return;

        set({ isLoading: true, error: null });

        const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    // User is signed in, get their profile
                    const userProfile = await getUserProfile(firebaseUser.uid);
                    if (userProfile) {
                        set({ 
                            user: userProfile, 
                            isLoading: false, 
                            isInitialized: true,
                            error: null 
                        });
                    } else {
                        // Profile not found, clear user
                        set({ 
                            user: null, 
                            isLoading: false, 
                            isInitialized: true,
                            error: 'User profile not found' 
                        });
                    }
                } else {
                    // User is signed out
                    set({ 
                        user: null, 
                        isLoading: false, 
                        isInitialized: true,
                        error: null 
                    });
                }
            } catch (error) {
                console.error('Auth state change error:', error);
                set({ 
                    user: null, 
                    isLoading: false, 
                    isInitialized: true,
                    error: 'Failed to load user profile' 
                });
            }
        });

        // Store the unsubscribe function for cleanup if needed
        return unsubscribe;
    },

    setUser: (user) => {
        set({ user, error: null });
    },

    clearUser: () => {
        set({ user: null, error: null });
    },

    updateUserProfile: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
            set({ user: { ...currentUser, ...updates } });
        }
    },

    setLoading: (loading) => {
        set({ isLoading: loading });
    },

    setError: (error) => {
        set({ error });
    },
}));
