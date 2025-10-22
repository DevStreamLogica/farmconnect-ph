import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { signIn, signUp } from '../lib/supabase';

type Role = 'consumer' | 'farmer';

interface LoginScreenProps {
  onVerificationSuccess?: () => void;
  showVerificationSuccess?: boolean;
  isWaitingForVerification?: boolean;
  setIsWaitingForVerification?: (waiting: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onVerificationSuccess, 
  showVerificationSuccess,
  isWaitingForVerification,
  setIsWaitingForVerification
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<Role>('consumer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  // Handle verification success popup
  useEffect(() => {
    if (showVerificationSuccess) {
      // Clear form inputs when verification is successful
      setEmail('');
      setPassword('');
      setErrors({});
    }
  }, [showVerificationSuccess]);

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      if (activeTab === 'login') {
        const { data, error } = await signIn(email, password);
        if (error) {
          Alert.alert('Login Failed', error.message);
        } else {
          Alert.alert('Success', `Welcome back, ${data?.user?.email}!`);
          // TODO: Navigate to dashboard based on user role
        }
      } else {
        const { data, error } = await signUp(email, password, selectedRole);
        if (error) {
          Alert.alert('Sign Up Failed', error.message);
        } else {
          Alert.alert(
            'Success', 
            `Account created! Please check your email and click the verification link to activate your account. The app will automatically detect when you've verified your email.`
          );
          // Start waiting for verification
          setIsWaitingForVerification?.(true);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🌱</Text>
        </View>
        <Text style={styles.title}>FarmConnect PH</Text>
        <Text style={styles.subtitle}>Connecting Filipino farmers with consumers</Text>

        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('login')} style={[styles.tab, activeTab === 'login' && styles.tabActive]}> 
            <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('signup')} style={[styles.tab, activeTab === 'signup' && styles.tabActiveRight]}> 
            <Text style={[styles.tabText, activeTab === 'signup' && styles.tabTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>I am a:</Text>
        <View style={styles.rolesRow}>
          {(
            [
              { key: 'consumer', label: 'Consumer' },
              { key: 'farmer', label: 'Farmer' },
            ] as Array<{ key: Role; label: string }>
          ).map(({ key, label }) => (
            <TouchableOpacity key={key} onPress={() => setSelectedRole(key)} style={styles.roleItem}>
              <View style={[styles.radioOuter, selectedRole === key && styles.radioOuterActive]}> 
                {selectedRole === key && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.roleLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#9AA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, errors.email && styles.inputError]}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) setErrors({...errors, email: undefined});
          }}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor="#9AA3AF"
          secureTextEntry
          style={[styles.input, errors.password && styles.inputError]}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors({...errors, password: undefined});
          }}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>{activeTab === 'login' ? 'Login' : 'Create account'}</Text>
          )}
        </TouchableOpacity>

        {isWaitingForVerification && (
          <View style={styles.waitingContainer}>
            <ActivityIndicator color="#059669" size="small" />
            <Text style={styles.waitingText}>
              Waiting for email verification... Check your email and click the verification link.
            </Text>
          </View>
        )}
      </View>

      {/* Verification Success Modal */}
      <Modal
        visible={showVerificationSuccess || false}
        transparent={true}
        animationType="fade"
        onRequestClose={onVerificationSuccess}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✅</Text>
            </View>
            <Text style={styles.modalTitle}>Account Verified!</Text>
            <Text style={styles.modalMessage}>
              Your email has been successfully verified. You can now log in with your credentials.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={onVerificationSuccess}
            >
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  logoCircle: {
    alignSelf: 'center',
    backgroundColor: '#E6F6EA',
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0B3B2E',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F7',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'white',
  },
  tabActiveRight: {
    backgroundColor: 'white',
  },
  tabText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0B3B2E',
  },
  sectionLabel: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  rolesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioOuterActive: {
    borderColor: '#059669',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  roleLabel: {
    color: '#111827',
  },
  inputLabel: {
    marginTop: 8,
    marginBottom: 6,
    color: '#111827',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    marginBottom: 8,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#0B0B14',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    maxWidth: 320,
    width: '100%',
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F6EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B3B2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  // Waiting for verification styles
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  waitingText: {
    color: '#059669',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});


