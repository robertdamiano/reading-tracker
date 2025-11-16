"use client";

import {createContext, useContext, useEffect, useMemo, useState} from "react";
import type {User} from "firebase/auth";
import {onAuthStateChanged} from "firebase/auth";
import {doc, getDoc} from "firebase/firestore";

import {auth, db} from "@/lib/firebase/client";

export type UserRole = "parent" | "child";

export type UserProfile = {
  role: UserRole;
  readerId?: string;        // For children only
  allowedReaders?: string[]; // For parents only
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (nextUser) {
        // Fetch user profile from appUsers collection
        try {
          const userDocRef = doc(db, 'appUsers', nextUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfile({
              role: data.role as UserRole,
              readerId: data.readerId,
              allowedReaders: data.allowedReaders
            });
          } else {
            // No profile found - user not set up yet
            setProfile(null);
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({user, profile, loading}), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
