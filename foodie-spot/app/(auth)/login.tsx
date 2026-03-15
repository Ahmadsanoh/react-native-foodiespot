import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { palette } from '@/constants/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email requis';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Format email invalide';
    }
    if (!password) {
      errors.password = 'Mot de passe requis';
    } else if (password.length < 6) {
      errors.password = 'Minimum 6 caractères';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setFieldErrors({});
    try {
      await login({ email: email.trim(), password });
    } catch {
      // error is handled by auth context
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🍔</Text>
            <Text style={styles.title}>FoodieSpot</Text>
            <Text style={styles.subtitle}>Connectez-vous pour commander</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={[styles.inputContainer, fieldErrors.email && styles.inputError]}>
              <Mail size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={t => { setEmail(t); setFieldErrors(e => ({ ...e, email: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}

            <View style={[styles.inputContainer, fieldErrors.password && styles.inputError]}>
              <Lock size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#999"
                value={password}
                onChangeText={t => { setPassword(t); setFieldErrors(e => ({ ...e, password: undefined })); }}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff size={20} color="#999" /> : <Eye size={20} color="#999" />}
              </TouchableOpacity>
            </View>
            {fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Se connecter</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/(auth)/register' as any)}
            disabled={isLoading}
          >
            <Text style={styles.registerText}>
              Pas encore de compte ? <Text style={styles.registerTextBold}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: palette.primary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' },
  errorContainer: { backgroundColor: '#FFEBEE', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#D32F2F', fontSize: 14, textAlign: 'center' },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f5f5f5', borderRadius: 12,
    marginBottom: 4, paddingHorizontal: 16, gap: 12,
    borderWidth: 1, borderColor: 'transparent',
  },
  inputError: { borderColor: '#D32F2F', backgroundColor: '#FFF5F5' },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#000' },
  fieldError: { color: '#D32F2F', fontSize: 12, marginBottom: 8, marginLeft: 4 },
  forgotButton: { alignSelf: 'flex-end', marginBottom: 16, marginTop: 4 },
  forgotText: { color: palette.primary, fontSize: 14 },
  button: { backgroundColor: palette.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerButton: { alignItems: 'center', padding: 16, marginTop: 24 },
  registerText: { color: '#666', fontSize: 14 },
  registerTextBold: { color: palette.primary, fontWeight: '600' },
});