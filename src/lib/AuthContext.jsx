import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { queryClientInstance } from '@/lib/query-client';
import { track } from '@/lib/analytics';

const AuthContext = createContext();

async function fetchOrCreateProfile(userId, setProfile) {
  if (!userId) {
    setProfile({ plan: 'free', planExpiresAt: null, isAdmin: false });
    return;
  }
  const { data } = await supabase
    .from('user_profiles')
    .select('plan, plan_expires_at, is_admin')
    .eq('id', userId)
    .maybeSingle();
  if (data) {
    setProfile({ plan: data.plan, planExpiresAt: data.plan_expires_at, isAdmin: !!data.is_admin });
    return;
  }
  setProfile({ plan: 'free', planExpiresAt: null, isAdmin: false });
  // Insert idempotently; only the call that actually creates the row seeds the
  // demo, so concurrent init paths can't double-seed.
  const { data: inserted } = await supabase
    .from('user_profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
    .select();
  if (inserted && inserted.length > 0) {
    // Seed the demo, then refresh the campaign list so a brand-new user sees it
    // appear instead of the empty state (the invoke lands after first render).
    supabase.functions.invoke('create-demo')
      .then(() => queryClientInstance.invalidateQueries({ queryKey: ['campaigns'] }))
      .catch(console.error);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [plan, setPlan] = useState('free');
  const [planExpiresAt, setPlanExpiresAt] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const setProfile = ({ plan: p, planExpiresAt: exp, isAdmin: adm }) => {
    setPlan(p ?? 'free');
    setPlanExpiresAt(exp ?? null);
    setIsAdmin(!!adm);
  };

  // Re-pull the plan from the DB. Used after returning from Stripe checkout,
  // where the webhook may land a beat after the redirect.
  const refreshProfile = () => fetchOrCreateProfile(user?.id ?? null, setProfile);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      fetchOrCreateProfile(session?.user?.id ?? null, setProfile).finally(() => {
        setIsLoadingAuth(false);
      });
    }).catch(() => setIsLoadingAuth(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      if (_event === 'SIGNED_IN') track('signed_in', { provider: session?.user?.app_metadata?.provider || 'email' });
      fetchOrCreateProfile(session?.user?.id ?? null, setProfile);
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
      planExpiresAt,
      isAdmin,
      isPlus: plan !== 'free',
      refreshProfile,
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
