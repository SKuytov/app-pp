import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user) => {
    if (!user) return null;
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*, facility:facilities(name)')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      toast({ variant: "destructive", title: "Profile Error", description: "Could not load user profile." });
      await supabase.auth.signOut();
      return null;
    }
    
    if (profiles) {
      const userProfile = {
        ...profiles,
        facility_name: profiles.facility?.name
      };
      delete userProfile.facility;
      return userProfile;
    }
    
    return null;
  }, [toast]);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        const userProfile = await fetchProfile(session.user);
        setProfile(userProfile);
      }
      setLoading(false);
    };
    
    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN') {
        const userProfile = await fetchProfile(session.user);
        setProfile(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session) {
          const userProfile = await fetchProfile(session.user);
          setProfile(userProfile);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ variant: "destructive", title: "Sign in Failed", description: error.message });
    }
    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ variant: "destructive", title: "Sign out Failed", description: error.message });
    }
    return { error };
  }, [toast]);
  
  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({ email, password, options });
    if (error) {
      toast({ variant: "destructive", title: "Sign up Failed", description: error.message });
    } else {
      toast({ title: "Sign up successful!", description: "Please check your email to confirm your account." });
    }
    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signIn,
    signOut,
    signUp,
  }), [session, profile, loading, signIn, signOut, signUp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};