import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { queryClientInstance } from '@/lib/query-client';

const AuthContext = createContext();

async function fetchOrCreateProfile(userId, setPlan) {
  if (!userId) {
    setPlan('free');
    return;
  }
  const { data } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', userId)
    .maybeSingle();
  if (data) {
    setPlan(data.plan);
    return;
  }
  setPlan('free');
  // Insert idempotently; only the call that actually creates the row seeds the
  // demo, so concurrent init paths can't double-seed.
  const { data: inserted } = await supabase
    .from('user_profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
    .select();
  if (inserted && inserted.length > 0) {
    supabase.functions.invoke('create-demo').catch(console.error);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      fetchOrCreateProfile(session?.user?.id ?? null, setPlan).finally(() => {
        setIsLoadingAuth(false);
      });
    }).catch(() => setIsLoadingAuth(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      fetchOrCreateProfile(session?.user?.id ?? null, setPlan);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    // Clear cached data so the next user on a shared machine starts clean.
    queryClientInstance.clear();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      plan,
      isPlus: plan === 'plus',
      // Kept for backward compatibility with any consuming components
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      logout,
      navigateToLogin: () => {},
      checkAppState: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
