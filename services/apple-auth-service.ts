import { supabase } from '@/configs/supabase-config';
import * as AppleAuthentication from 'expo-apple-authentication';

export class AppleAuthService {
    async signInWithApple(): Promise<{ user: any; displayName: string; email: string }> {
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
            // Note: Apple only provides name/email on FIRST sign-in for privacy reasons
            const fullName = appleAuthRequestResponse.fullName;
            const displayName = fullName
                ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
                : '';

            // Extract email from Apple response (only available on first sign-in)
            const email = appleAuthRequestResponse.email || '';

            // Sign in with Supabase using Apple OAuth
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: appleAuthRequestResponse.identityToken,
            });

            if (error) {
                throw new Error(`Supabase Apple Sign-In failed: ${error.message}`);
            }

            // Get email from Supabase user (available after first sign-in)
            // Apple provides email only on first sign-in, but Supabase stores it
            const userEmail = email || data.user?.email || data.user?.user_metadata?.email || '';

            // Update user metadata with display name and email if we have them
            if (data.user) {
                const updateData: any = {};
                if (displayName) {
                    updateData.display_name = displayName;
                }
                if (email) {
                    updateData.email = email;
                }
                if (Object.keys(updateData).length > 0) {
                    await supabase.auth.updateUser({
                        data: updateData,
                    });
                }
            }

            return {
                user: data.user,
                displayName: displayName || data.user?.user_metadata?.display_name || '',
                email: userEmail,
            };
        } catch (error: any) {
            // Re-throw cancellation errors as-is (they should be handled gracefully)
            // For other errors, log and re-throw
            if (
                error?.code === 'ERR_REQUEST_CANCELED' ||
                error?.message?.toLowerCase().includes('cancel')
            ) {
                // Don't log cancellation errors - they're user-initiated
                throw error;
            }
            console.error('Apple Sign-In error:', error);
            throw error;
        }
    }

    static async isAvailable(): Promise<boolean> {
        return await AppleAuthentication.isAvailableAsync();
    }
}
