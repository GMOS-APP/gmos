import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

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
    .single();
  if (data) {
    setPlan(data.plan);
  } else {
    await supabase.from('user_profiles').insert({ id: userId });
    setPlan('free');
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
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      fetchOrCreateProfile(session?.user?.id ?? null, setPlan);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
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
