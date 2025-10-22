import { createClient } from '@supabase/supabase-js';

// Your actual Supabase project credentials
const supabaseUrl = 'https://whiczevvrgkgzxjdbtnz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoaWN6ZXZ2cmdrZ3p4amRidG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzkxNTMsImV4cCI6MjA3NjcxNTE1M30.VvX8cxgYDFI_c7xscmifRv_6uQ-_3FJEvD1oaR7XE30';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth helper functions
export const signUp = async (email: string, password: string, role: 'consumer' | 'farmer') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role,
      },
      emailRedirectTo: 'https://devstreamlogica.github.io/farmconnect-ph/auth-callback.html'
    }
  });
  
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Handle auth URL parsing and session setting
export const handleAuthUrl = async (url: string) => {
  try {
    // Parse URL manually to extract tokens using regex
    const accessTokenMatch = url.match(/access_token=([^&]+)/);
    const refreshTokenMatch = url.match(/refresh_token=([^&]+)/);
    
    const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;
    const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;
    
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      return { data, error };
    }
    
    return { data: null, error: new Error('No auth tokens found in URL') };
  } catch (error) {
    return { data: null, error };
  }
};
