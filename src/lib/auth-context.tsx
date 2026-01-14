'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';
import { Entitlements, UserRole } from '@/types';
import { getDataForMigration, clearLocalData } from './localStorage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  entitlements: Entitlements | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshEntitlements: () => Promise<void>;
}

const defaultEntitlements: Entitlements = {
  plan: 'free',
  commutes_limit: 1,
  categories_limited: true,
  early_warning: false,
  confidence_breakdown: false,
  reliability_history: false,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: 'rider',
  entitlements: defaultEntitlements,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshEntitlements: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>('rider');
  const [entitlements, setEntitlements] = useState<Entitlements>(defaultEntitlements);
  const [loading, setLoading] = useState(true);

  const fetchEntitlements = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch('/api/entitlements', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (data.entitlements) {
        setEntitlements(data.entitlements);
      }
    } catch (error) {
      console.error('Failed to fetch entitlements:', error);
    }
  }, []);

  const fetchRole = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch('/api/auth', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (data.user?.role) {
        setRole(data.user.role);
      }
    } catch (error) {
      console.error('Failed to fetch role:', error);
    }
  }, []);

  const migrateLocalData = useCallback(async (accessToken: string) => {
    try {
      const migrationData = getDataForMigration();
      if (migrationData.commutes.length > 0 || migrationData.anon_id) {
        await fetch('/api/account/migrate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(migrationData),
        });
        // Clear local data after migration
        clearLocalData();
      }
    } catch (error) {
      console.error('Failed to migrate local data:', error);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.access_token) {
          await Promise.all([
            fetchEntitlements(currentSession.access_token),
            fetchRole(currentSession.access_token),
          ]);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.access_token) {
          await Promise.all([
            fetchEntitlements(newSession.access_token),
            fetchRole(newSession.access_token),
          ]);

          // Migrate local data on sign in
          if (event === 'SIGNED_IN') {
            await migrateLocalData(newSession.access_token);
          }
        } else {
          setEntitlements(defaultEntitlements);
          setRole('rider');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchEntitlements, fetchRole, migrateLocalData]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setEntitlements(defaultEntitlements);
    setRole('rider');
  };

  const refreshEntitlements = async () => {
    if (session?.access_token) {
      await fetchEntitlements(session.access_token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        entitlements,
        loading,
        signUp,
        signIn,
        signOut,
        refreshEntitlements,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
