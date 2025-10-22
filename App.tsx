import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, Text, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { LoginScreen } from './src/screens/LoginScreen';
import { ConsumerDashboard } from './src/screens/ConsumerDashboard';
import { FarmerDashboard } from './src/screens/FarmerDashboard';
import { getCurrentUser, supabase, handleAuthUrl } from './src/lib/supabase';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [isWaitingForVerification, setIsWaitingForVerification] = useState(false);

  useEffect(() => {
    checkUser();
    
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setLoading(false);
        setIsWaitingForVerification(false);
        // Show verification success popup for email confirmations
        if (session.user.email_confirmed_at) {
          console.log('Email confirmed, showing success popup');
          setShowVerificationSuccess(true);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        setIsWaitingForVerification(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('Token refreshed, updating user state');
        setUser(session.user);
        setLoading(false);
        setIsWaitingForVerification(false);
      }
    });

    // Add periodic session checking for email verification
    const checkSessionPeriodically = () => {
      const interval = setInterval(async () => {
        if (isWaitingForVerification) {
          console.log('Checking session for email verification...');
          const { data, error } = await supabase.auth.getSession();
          if (data.session && data.session.user.email_confirmed_at) {
            console.log('Email verification detected via periodic check');
            setUser(data.session.user);
            setLoading(false);
            setIsWaitingForVerification(false);
            setShowVerificationSuccess(true);
            clearInterval(interval);
          }
        }
      }, 2000); // Check every 2 seconds for faster detection

      return interval;
    };

    const sessionCheckInterval = checkSessionPeriodically();
    
    // Handle email verification redirects
    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      try {
        if (url.includes('farmconnect-ph://auth/callback') || url.includes('example.com')) {
          console.log('Auth callback deep link detected, processing...');
          
          // Show immediate feedback to user
          Alert.alert('Processing Verification', 'Please wait while we verify your email...');
          
          // Parse URL to extract auth tokens if present using regex
          const accessTokenMatch = url.match(/access_token=([^&]+)/);
          const refreshTokenMatch = url.match(/refresh_token=([^&]+)/);
          const typeMatch = url.match(/type=([^&]+)/);
          
          const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;
          const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;
          const type = typeMatch ? typeMatch[1] : null;
          
          console.log('Extracted from URL:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
          
          if (accessToken && refreshToken) {
            console.log('Setting session with extracted tokens...');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) {
              console.error('Session setting error:', error);
              Alert.alert('Verification Error', 'There was an issue verifying your account. Please try again.');
              return;
            }
            
            if (data.session) {
              console.log('Session established successfully, showing success popup');
              setUser(data.session.user);
              setLoading(false);
              setIsWaitingForVerification(false);
              setShowVerificationSuccess(true);
            }
          } else {
            console.log('No tokens in URL, checking current session...');
            // Fallback: check if user is already signed in
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Session error:', error);
              Alert.alert('Verification Error', 'There was an issue verifying your account. Please try again.');
              return;
            }
            
            if (data.session && data.session.user.email_confirmed_at) {
              console.log('User session established and email confirmed, showing success popup');
              setUser(data.session.user);
              setLoading(false);
              setIsWaitingForVerification(false);
              setShowVerificationSuccess(true);
            } else if (data.session) {
              console.log('User session established but email not confirmed yet');
              setUser(data.session.user);
              setLoading(false);
            } else {
              console.log('No active session found');
              Alert.alert('Verification', 'Email verification completed. You can now log in with your credentials.');
            }
          }
        } else if (url.includes('farmconnect-ph://')) {
          console.log('Deep link detected:', url);
          
          if (url.includes('auth-callback?verified=true')) {
            console.log('Email verification completed via deep link');
            // Check if user is now verified
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Session error:', error);
              Alert.alert('Verification Error', 'There was an issue verifying your account. Please try again.');
              return;
            }
            
            if (data.session && data.session.user.email_confirmed_at) {
              console.log('User session established and email confirmed, showing success popup');
              setUser(data.session.user);
              setLoading(false);
              setIsWaitingForVerification(false);
              setShowVerificationSuccess(true);
            } else {
              console.log('User session established but email not confirmed yet');
              setUser(data.session?.user || null);
              setLoading(false);
            }
          }
          // Handle other deep links if needed
        }
      } catch (error) {
        console.error('Deep link handling error:', error);
        Alert.alert('Error', 'There was an issue processing the verification link. Please try again.');
      }
    };

    // Listen for deep links
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Handle initial URL if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription?.remove();
      clearInterval(sessionCheckInterval);
    };
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setShowVerificationSuccess(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5FBF7', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="dark-content" />
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5FBF7' }}>
        <StatusBar barStyle="dark-content" />
        <LoginScreen 
          onVerificationSuccess={handleVerificationSuccess}
          showVerificationSuccess={showVerificationSuccess}
          isWaitingForVerification={isWaitingForVerification}
          setIsWaitingForVerification={setIsWaitingForVerification}
        />
      </SafeAreaView>
    );
  }

  // Determine user role and show appropriate dashboard
  const userRole = user?.user_metadata?.role || 'consumer';
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5FBF7' }}>
      <StatusBar barStyle="dark-content" />
      {userRole === 'farmer' ? <FarmerDashboard /> : <ConsumerDashboard />}
    </SafeAreaView>
  );
}


