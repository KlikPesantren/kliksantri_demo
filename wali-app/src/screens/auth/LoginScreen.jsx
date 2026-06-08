import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useActiveChild } from '../../context/ActiveChildContext';
import { colors } from '../../constants/colors';

export function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const { setActiveSantri } = useActiveChild();

  const [nomorHp, setNomorHp] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const pinRef = useRef(null);

  function handlePhoneChange(text) {
    // Hanya terima angka
    const cleaned = text.replace(/[^0-9]/g, '');
    setNomorHp(cleaned);
    setError('');
  }

  function handlePinChange(text) {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(cleaned);
    setError('');
  }

  async function handleLogin() {
    setError('');

    if (!nomorHp || nomorHp.length < 9) {
      setError('Masukkan nomor HP yang valid.');
      return;
    }
    if (!pin || pin.length < 6) {
      setError('PIN harus 6 digit.');
      return;
    }

    setIsLoading(true);
    try {
      const { anak } = await login(nomorHp, pin);

      if (anak.length === 0) {
        setError('Tidak ada santri yang terdaftar untuk akun ini.');
        return;
      }

      // Selalu set anak pertama sebagai aktif — user bisa ganti dari ChildSwitcherBar
      await setActiveSantri(anak[0]);
      // AppNavigator akan otomatis pindah ke MainTabs karena isAuthenticated berubah
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error;

      if (status === 423) {
        setError('Akun terkunci sementara. Hubungi admin pesantren.');
      } else if (status === 403) {
        setError('Akun Anda ditangguhkan. Hubungi admin pesantren.');
      } else if (status === 401 || status === 400) {
        setError(msg ?? 'Nomor HP atau PIN salah.');
      } else {
        setError('Gagal terhubung ke server. Periksa koneksi Anda.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🕌</Text>
          <Text style={styles.appName}>KlikSantri</Text>
          <Text style={styles.subtitle}>Portal Wali Santri</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>Masuk ke Akun Anda</Text>

          {/* Error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Nomor HP */}
          <View style={styles.field}>
            <Text style={styles.label}>Nomor HP</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 08123456789"
              placeholderTextColor={colors.textMuted}
              value={nomorHp}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => pinRef.current?.focus()}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* PIN */}
          <View style={styles.field}>
            <Text style={styles.label}>PIN (6 digit)</Text>
            <View style={styles.pinWrapper}>
              <TextInput
                ref={pinRef}
                style={[styles.input, styles.pinInput]}
                placeholder="••••••"
                placeholderTextColor={colors.textMuted}
                value={pin}
                onChangeText={handlePinChange}
                keyboardType="number-pad"
                secureTextEntry={!showPin}
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPin((v) => !v)}
              >
                <Text style={styles.eyeIcon}>{showPin ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.loginButtonText}>Masuk</Text>
            )}
          </TouchableOpacity>

          {/* Lupa PIN */}
          <View style={styles.forgotWrapper}>
            <Text style={styles.forgotText}>Lupa PIN? </Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Lupa PIN',
                  'Silakan hubungi admin pesantren untuk mereset PIN Anda.',
                  [{ text: 'OK' }]
                )
              }
            >
              <Text style={styles.forgotLink}>Hubungi Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>KlikSantri © 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 32 },
  headerIcon: { fontSize: 52, marginBottom: 12 },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },

  // Error
  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },

  // Fields
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.gray50,
  },

  // PIN field
  pinWrapper: { flexDirection: 'row', alignItems: 'center' },
  pinInput: { flex: 1, letterSpacing: 6 },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  eyeIcon: { fontSize: 18 },

  // Button
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: { opacity: 0.65 },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Forgot
  forgotWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  forgotText: { fontSize: 13, color: colors.textSecondary },
  forgotLink: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Footer
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 24,
  },
});
