import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, isMock, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, db, doc, getDoc, setDoc } from '../lib/firebase';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  signupWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const mockUser: User = {
    uid: 'mock-user-123',
    email: 'trader@example.com',
    displayName: 'Crypto Tracker',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader'
  };

  useEffect(() => {
    if (isMock) {
      const storedUser = localStorage.getItem('mockUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setCurrentUser({ ...user } as User);
        } else {
          const newUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          };
          await setDoc(userRef, newUser);
          setCurrentUser(newUser as User);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    if (isMock) {
      setCurrentUser(mockUser);
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      return;
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (isMock) {
      const user = { ...mockUser, email, displayName: email.split('@')[0] };
      setCurrentUser(user);
      localStorage.setItem('mockUser', JSON.stringify(user));
      return;
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signupWithEmail = async (email: string, pass: string) => {
    if (isMock) {
      const user = { ...mockUser, email, displayName: email.split('@')[0] };
      setCurrentUser(user);
      localStorage.setItem('mockUser', JSON.stringify(user));
      return;
    }
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    if (isMock) {
      setCurrentUser(null);
      localStorage.removeItem('mockUser');
      return;
    }
    await signOut(auth);
  };

  const value = {
    currentUser,
    loading,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
