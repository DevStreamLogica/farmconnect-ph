import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { signOut } from '../lib/supabase';

export const ConsumerDashboard: React.FC = () => {
  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Consumer!</Text>
      <Text style={styles.subtitle}>Browse fresh produce from local farmers</Text>
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Available Products</Text>
        <Text style={styles.placeholder}>🌱 Fresh vegetables coming soon...</Text>
        <Text style={styles.placeholder}>🍅 Local fruits available</Text>
        <Text style={styles.placeholder}>🌾 Organic grains</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2FAF5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0B3B2E',
    textAlign: 'center',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  placeholder: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
