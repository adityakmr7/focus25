import { supabase } from "@/configs/supabase-config";
import { AppleAuthService } from "@/services/apple-auth-service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isInitialized: boolean;
  error: string | null;
  isOffline: boolean;

  // Actions
  signInWithApple: () => Promise<{ displayName: string }>;
  signOut: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  initializeAuth: () => () => void; // Returns cleanup function
  clearError: () => void;
  setOffline: (isOffline: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: false,
      isInitialized: false,
      error: null,
      isOffline: false,

      // Initialize auth state listener
      initializeAuth: () => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
          set({
            user: session?.user ?? null,
            session,
            isInitialized: true,
            loading: false,
          });
        });

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session?.user?.email);
          set({
            user: session?.user ?? null,
            session,
            loading: false,
            isInitialized: true,
            error: null,
          });
        });

        // Return cleanup function
        return () => subscription.unsubscribe();
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set offline state
      setOffline: (isOffline: boolean) => set({ isOffline }),

      // Apple sign-in
      signInWithApple: async () => {
        set({ loading: true, error: null });
        try {
          const { user, displayName } =
            await new AppleAuthService().signInWithApple();
          set({ user, loading: false });
          return { displayName };
        } catch (error: any) {
          console.error("Apple Sign-In failed:", error);
          set({
            error: error.message || "Apple Sign-In failed",
            loading: false,
          });
          throw error;
        }
      },

      // Sign out
      signOut: async () => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({ user: null, session: null, loading: false });
        } catch (error: any) {
          console.error("Error signing out:", error);
          set({
            error: error.message || "Failed to sign out",
            loading: false,
          });
          throw error;
        }
      },

      // Update user profile
      updateUserProfile: async (displayName: string) => {
        const { user } = get();
        if (!user) throw new Error("No user signed in");

        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.updateUser({
            data: { display_name: displayName },
          });
          if (error) throw error;
          set({ loading: false });
        } catch (error: any) {
          console.error("Error updating profile:", error);
          set({
            error: error.message || "Failed to update profile",
            loading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
