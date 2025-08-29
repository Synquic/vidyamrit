import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { User } from "../types/user";
import { apiUrl } from '@/services/index';

const API_URL = apiUrl;

export const signUp = async (email: string, password: string, name: string, role: string) => {
  try {
    // First create user in Firebase
    const firebaseResult = await createUserWithEmailAndPassword(auth, email, password);
    const token = await firebaseResult.user.getIdToken();

    // Then create user in our backend
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        email,
        uid: firebaseResult.user.uid,
        role // Use the role selected by the user
      })
    });

    if (!response.ok) {
      // If backend creation fails, delete the Firebase user
      await firebaseResult.user.delete();
      throw new Error('Failed to create user in backend');
    }

    return firebaseResult;
  } catch (error) {
    console.error('Error in signup:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  await signOut(auth);
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    const token = await firebaseUser.getIdToken();
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }

    const userData: User = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};
