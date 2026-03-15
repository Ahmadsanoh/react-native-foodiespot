import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { palette } from '@/constants/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(pwd: string): { label: string; color: string } {
  if (pwd.length === 0) return { label: '', color: 'transparent' };
  if (pwd.length < 6)   return { label: 'Trop court', color: '#F44336' };
  if (pwd.length < 8)   return { label: 'Faible', color: '#FF9800' };
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Fort', color: '#4CAF50' };
  return { label: 'Moyen', color: '#FFC107' };
}

export default function RegisterScreen() {
  const { register, isLoading, error } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) =>
    setFieldErrors(e => { const next = { ...e }; delete next[field]; return next; });

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!firstName.trim())              errors.firstName = 'Prénom requis';
    if (!lastName.trim())               errors.lastName = 'Nom requis';
    if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Format email invalide';
    if (password.length < 6)            errors.password = 'Minimum 6 caractères';
    if (password !== confirmPassword)   errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
    } catch {
      // error handled by auth context
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🍔</Text>
            <Text style={styles.title}>Créer un compte</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <View style={[styles.inputContainer, fieldErrors.firstName && styles.inputError]}>
                  <User size={20} color="#999" />
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom"
                    value={firstName}
                    onChangeText={t => { setFirstName(t); clearError('firstName'); }}
                    editable={!isLoading}
                  />
                </View>
                {fieldErrors.firstName && <Text style={styles.fieldError}>{fieldErrors.firstName}</Text>}
              </View>

              <View style={{ flex: 1 }}>
                <View style={[styles.inputContainer, fieldErrors.lastName && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    value={lastName}
                    onChangeText={t => { setLastName(t); clearError('lastName'); }}
                    editable={!isLoading}
                  />
                </View>
                {fieldErrors.lastName && <Text style={styles.fieldError}>{fieldErrors.lastName}</Text>}
              </View>
            </View>

            <View style={[styles.inputContainer, fieldErrors.email && styles.inputError]}>
              <Mail size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={t => { setEmail(t); clearError('email'); }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}

            <View style={styles.inputContainer}>
              <Phone size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Téléphone (optionnel)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputContainer, fieldErrors.password && styles.inputError]}>
              <Lock size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                value={password}
                onChangeText={t => { setPassword(t); clearError('password'); }}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff size={20} color="#999" /> : <Eye size={20} color="#999" />}
              </TouchableOpacity>
            </View>
            {fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}

            {/* Password strength indicator */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={[styles.strengthBar, { backgroundColor: strength.color }]} />
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            <View style={[styles.inputContainer, fieldErrors.confirmPassword && styles.inputError]}>
              <Lock size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Confirmer mot de passe"
                value={confirmPassword}
                onChangeText={t => { setConfirmPassword(t); clearError('confirmPassword'); }}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
            </View>
            {fieldErrors.confirmPassword && <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Créer mon compte</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={styles.loginText}>
              Déjà un compte ? <Text style={styles.loginTextBold}>Se connecter</Text>
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
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: palette.primary },
  errorContainer: { backgroundColor: '#FFEBEE', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#D32F2F', fontSize: 14, textAlign: 'center' },
  form: { width: '100%' },
  nameRow: { flexDirection: 'row', gap: 12 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f5f5f5', borderRadius: 12,
    marginBottom: 4, paddingHorizontal: 16, gap: 12,
    borderWidth: 1, borderColor: 'transparent',
  },
  inputError: { borderColor: '#D32F2F', backgroundColor: '#FFF5F5' },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#000' },
  fieldError: { color: '#D32F2F', fontSize: 12, marginBottom: 8, marginLeft: 4 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 70 },
  button: {
    backgroundColor: palette.primary, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loginButton: { alignItems: 'center', padding: 16, marginTop: 16 },
  loginText: { color: '#666', fontSize: 14 },
  loginTextBold: { color: palette.primary, fontWeight: '600' },
});