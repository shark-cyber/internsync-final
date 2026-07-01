import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  getIdToken,
  GoogleAuthProvider,
  initializeAuth,
  OAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updatePassword,
  User,
  AuthError,
} from 'firebase/auth';
import { Platform } from 'react-native';

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ''
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const getNativePersistence = () => {
  const authReactNative = require('firebase/auth/react-native') as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => any;
  };

  return authReactNative.getReactNativePersistence(AsyncStorage);
};

const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getNativePersistence(),
      });

// Helper to map Firebase auth errors to user-friendly messages
const getFirebaseErrorMessage = (error: AuthError | Error): string => {
  if ('code' in error) {
    switch (error.code) {
      case 'auth/operation-not-allowed':
        return 'Google sign-in is not enabled yet. Please contact support or use email/password.';
      case 'auth/email-already-in-use':
        return 'This email is already in use. Please use a different email.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid credentials. Please check your login details.';
      case 'auth/app-not-authorized':
        return 'This mobile app is not authorized for this sign-in provider yet. Please update the mobile auth configuration and try again.';
      case 'auth/unauthorized-domain':
        return 'This sign-in domain is not authorized yet. Please contact support or try email/password for now.';
      case 'auth/invalid-api-key':
        return 'Authentication is not configured correctly yet. Please contact support or try again later.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup closed. Please try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in cancelled. Please try again.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/requires-recent-login':
        return 'For security reasons, please log out and log back in before updating your email or password.';
      case 'auth/invalid-new-email':
        return 'The new email address is invalid. Please check and try again.';
      case 'auth/email-already-exists':
        return 'This email is already in use by another account. Please use a different email.';
      default:
        return error.message || 'An error occurred during authentication.';
    }
  }
  return error.message || 'An error occurred.';
};

export {
  auth,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getIdToken,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updatePassword,
  User,
  getFirebaseErrorMessage,
};
