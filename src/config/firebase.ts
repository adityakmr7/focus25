import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID;

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isPro: boolean;
  createdAt: Date;
  lastSignIn: Date;
  provider: 'google' | 'apple';
}

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

    const googleCredential = auth.GoogleAuthProvider.credential(
      userInfo.data?.idToken || null
    );

    const userCredential = await auth().signInWithCredential(googleCredential);

    const user = userCredential.user;

    // Wait a bit for auth state to propagate before creating profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      await createOrUpdateUserProfile(user, 'google');
    } catch (profileError) {
      console.warn(
        'User profile creation failed, but sign-in succeeded:',
        profileError
      );
      // Continue with sign-in success even if profile creation fails
    }

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

export const signInWithApple = async () => {
  try {
    // Check if Apple Authentication is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple Authentication is not available on this device');
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Create Firebase credential from Apple credential
    const { identityToken, authorizationCode } = credential;
    if (!identityToken) {
      throw new Error('No identity token received from Apple');
    }

    const appleCredential = auth.AppleAuthProvider.credential(
      identityToken,
      authorizationCode || undefined
    );
    const userCredential = await auth().signInWithCredential(appleCredential);

    const user = userCredential.user;

    // For Apple sign-in, we might need to use the credential info if user info is not available
    const displayName =
      user.displayName ||
      (credential.fullName?.givenName && credential.fullName?.familyName
        ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
        : null);

    // Wait a bit for auth state to propagate before creating profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      await createOrUpdateUserProfile(user, 'apple', displayName || undefined);
    } catch (profileError) {
      console.warn(
        'User profile creation failed, but sign-in succeeded:',
        profileError
      );
      // Continue with sign-in success even if profile creation fails
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email || credential.email,
        displayName: displayName,
        photoURL: user.photoURL,
      },
    };
  } catch (error: any) {
    console.error('Apple sign-in error:', error);

    // Handle specific Apple sign-in errors
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'User canceled the sign-in request',
        cancelled: true,
      };
    }

    return {
      success: false,
      error: error.message || 'Apple sign-in failed',
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

const createOrUpdateUserProfile = async (
  user: any,
  provider: 'google' | 'apple',
  customDisplayName?: string,
  retryCount: number = 0
) => {
  const maxRetries = 3;

  try {
    const userRef = firestore().collection('users').doc(user.uid);

    const userData: Partial<UserProfile> = {
      uid: user.uid,
      email: user.email,
      displayName: customDisplayName || user.displayName,
      photoURL: user.photoURL,
      provider,
      lastSignIn: new Date(),
    };

    try {
      // Try to get the document first
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        // Update existing user
        await userRef.update(userData);
        console.log('User profile updated successfully:', userData);
      } else {
        // Create new user
        const newUserData: UserProfile = {
          ...(userData as Required<
            Pick<
              UserProfile,
              | 'uid'
              | 'email'
              | 'displayName'
              | 'photoURL'
              | 'provider'
              | 'lastSignIn'
            >
          >),
          isPro: false, // Default to false, can be upgraded later
          createdAt: new Date(),
        };

        await userRef.set(newUserData);
        console.log('User profile created successfully:', newUserData);
      }
    } catch (firestoreError: any) {
      // If there's an issue with checking existence, just try to set the document
      console.log(
        'Document check failed, attempting to create new user:',
        firestoreError.message
      );

      const newUserData: UserProfile = {
        ...(userData as Required<
          Pick<
            UserProfile,
            | 'uid'
            | 'email'
            | 'displayName'
            | 'photoURL'
            | 'provider'
            | 'lastSignIn'
          >
        >),
        isPro: false,
        createdAt: new Date(),
      };

      // Use set with merge option to handle both create and update
      await userRef.set(newUserData, { merge: true });
      console.log('User profile created/updated with merge:', newUserData);
    }
  } catch (error: any) {
    console.error(
      `Error creating/updating user profile (attempt ${retryCount + 1}):`,
      error
    );

    // Retry if it's a permission or not-found error and we haven't exceeded max retries
    if (
      retryCount < maxRetries &&
      (error.code === 'firestore/not-found' ||
        error.code === 'firestore/permission-denied')
    ) {
      console.log(
        `Retrying user profile creation in ${(retryCount + 1) * 1000}ms...`
      );
      await new Promise(resolve =>
        setTimeout(resolve, (retryCount + 1) * 1000)
      );
      return createOrUpdateUserProfile(
        user,
        provider,
        customDisplayName,
        retryCount + 1
      );
    }

    // If it's not a retryable error or we've exceeded retries, throw
    throw error;
  }
};

export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  try {
    const userDoc = await firestore().collection('users').doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
        lastSignIn: data?.lastSignIn?.toDate?.() || data?.lastSignIn,
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const upgradeUserToPro = async (uid: string): Promise<boolean> => {
  try {
    await firestore().collection('users').doc(uid).update({
      isPro: true,
      upgradeDate: new Date(),
    });
    console.log('User upgraded to Pro successfully');
    return true;
  } catch (error) {
    console.error('Error upgrading user to Pro:', error);
    return false;
  }
};

export const checkUserProStatus = async (uid: string): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(uid);
    return userProfile?.isPro || false;
  } catch (error) {
    console.error('Error checking Pro status:', error);
    return false;
  }
};

// Re-export UserProfile as type only to avoid conflicts
export type { UserProfile };
