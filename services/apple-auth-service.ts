import { supabase } from '@/configs/supabase-config';
import * as AppleAuthentication from 'expo-apple-authentication';

export class AppleAuthService {
    async signInWithApple(): Promise<{ user: any; displayName: string }> {
        try {
            // Check if Apple Sign-In is available
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            if (!isAvailable) {
                throw new Error('Apple Sign-In is not supported on this device');
            }

            // Start the sign-in request
            const appleAuthRequestResponse = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            // Ensure Apple returned a user identityToken
            if (!appleAuthRequestResponse.identityToken) {
                throw new Error('Apple Sign-In failed - no identify token returned');
            }

            // Extract display name from Apple response
            const fullName = appleAuthRequestResponse.fullName;
            const displayName = fullName
                ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
                : '';

            // Sign in with Supabase using Apple OAuth
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: appleAuthRequestResponse.identityToken,
            });

            if (error) {
                throw new Error(`Supabase Apple Sign-In failed: ${error.message}`);
            }

            // Update user metadata with display name if we have it
            if (displayName && data.user) {
                await supabase.auth.updateUser({
                    data: { display_name: displayName },
                });
            }

            return {
                user: data.user,
                displayName: displayName || data.user?.user_metadata?.display_name || '',
            };
        } catch (error: any) {
            // Don't log user cancellation as an error - it's expected behavior
            const isUserCancellation = error?.message?.toLowerCase().includes('cancel');
            if (isUserCancellation) {
                console.log('Apple Sign-In cancelled by user');
                throw error;
            }

            // Log actual errors
            console.error('Apple Sign-In error:', error);
            throw error;
        }
    }

    static async isAvailable(): Promise<boolean> {
        return await AppleAuthentication.isAvailableAsync();
    }
}
