import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router'; 
import { UserProfile } from '@/types';
export type UserRole = 'admin' | 'valet' | 'customer' | null;


interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);

      if (authUser) {
        setIsAuthenticated(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role as UserRole);
            setProfile({
              role: userData.role as UserRole,
              name: userData.name,
              phoneNumber: userData.phoneNumber,
              email: authUser.email || '',
              uid: authUser.uid,
            });
          } else {
            setRole(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setRole(null);
          setProfile(null);
        }
      } else {
        setIsAuthenticated(false);
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (role === 'admin') {
        router.replace('/(admin)/dashboard');
      } else if (role === 'valet') {
        router.replace('/(valet)/home');
      }
    } else if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [role, isAuthenticated, loading, router]);

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signOut, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};