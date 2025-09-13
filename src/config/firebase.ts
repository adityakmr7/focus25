import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID;

export const initializeFirebase = async () => {
    try {
        GoogleSignin.configure({
            webClientId: WEB_CLIENT_ID,
        });
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
};

export const signInWithGoogle = async () => {
    try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        
        const userInfo = await GoogleSignin.signIn();
        
        const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data?.idToken || null);
        
        const userCredential = await auth().signInWithCredential(googleCredential);
        
        const user = userCredential.user;
        
        await createOrUpdateUserProfile(user);
        
        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
            },
        };
    } catch (error) {
        console.error('Google sign-in error:', error);
        return {
            success: false,
            error: error,
        };
    }
};

export const signOut = async () => {
    try {
        await GoogleSignin.signOut();
        await auth().signOut();
        return { success: true };
    } catch (error) {
        console.error('Sign-out error:', error);
        return { success: false, error };
    }
};

export const getCurrentUser = () => {
    return auth().currentUser;
};

export const onAuthStateChanged = (callback: (user: any) => void) => {
    return auth().onAuthStateChanged(callback);
};

const createOrUpdateUserProfile = async (user: any) => {
    try {
        // For now, just log the user profile creation
        // Firestore integration will be added once the module import issue is resolved
        console.log('User profile would be created/updated:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
        });
    } catch (error) {
        console.error('Error creating/updating user profile:', error);
    }
};