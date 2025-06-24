import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, signInAnonymously } from '../lib/supabase';

export interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error getting initial session:', error);
                    setAuthState((prev) => ({ ...prev, error: error.message, loading: false }));
                    return;
                }

                if (!session) {
                    // No session exists, sign in anonymously
                    console.log('No session found, signing in anonymously...');
                    await signInAnonymously();
                } else {
                    // Session exists, update state
                    setAuthState({
                        user: session.user,
                        session,
                        loading: false,
                        error: null,
                    });
                }
            } catch (error) {
                console.error('Failed to get initial session:', error);
                setAuthState((prev) => ({
                    ...prev,
                    error: error instanceof Error ? error.message : 'Authentication failed',
                    loading: false,
                }));
            }
        };

        getInitialSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);

            setAuthState({
                user: session?.user ?? null,
                session,
                loading: false,
                error: null,
            });

            // If user signed out and no session, sign in anonymously again
            if (event === 'SIGNED_OUT' && !session) {
                try {
                    await signInAnonymously();
                } catch (error) {
                    console.error('Failed to sign in anonymously after sign out:', error);
                    setAuthState((prev) => ({
                        ...prev,
                        error: error instanceof Error ? error.message : 'Re-authentication failed',
                    }));
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const retry = async () => {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            await signInAnonymously();
        } catch (error) {
            setAuthState((prev) => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Retry failed',
                loading: false,
            }));
        }
    };

    return {
        ...authState,
        retry,
        isAuthenticated: !!authState.session,
    };
};
