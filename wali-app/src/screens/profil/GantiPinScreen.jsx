import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useChangePin } from '../../hooks/useChangePin';
import { colors } from '../../constants/colors';

// ─── PIN Field ────────────────────────────────────────────────────────────────

function PinField({ label, value, onChangeText, visible, onToggleVisible, hasError }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.pinInputWrap, hasError && styles.pinInputError]}>
        <TextInput
          style={styles.pinInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry={!visible}
          placeholder="• • • • • •"
          placeholderTextColor={colors.gray300}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={onToggleVisible}
          style={styles.eyeBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.eyeIcon}>{visible ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── PIN Strength Dots ────────────────────────────────────────────────────────

function PinDots({ value }) {
  const len = (value ?? '').length;
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < len
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.gray200 },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Success View ─────────────────────────────────────────────────────────────

function SuccessView({ onBack }) {
  return (
    <View style={styles.successContainer}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successTitle}>PIN Berhasil Diubah</Text>
      <Text style={styles.successSubtitle}>
        PIN Anda telah diperbarui.{'\n'}Gunakan PIN baru untuk login berikutnya.
      </Text>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
        <Text style={styles.backBtnText}>Kembali ke Profil</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Inline Validation ────────────────────────────────────────────────────────

const BLOCKED = ['000000', '123456', '111111', '654321'];

function validateLocal(pinLama, pinBaru, konfirmasi) {
  if (!pinLama) return 'PIN lama wajib diisi';
  if (String(pinLama).length !== 6) return 'PIN lama harus 6 digit';
  if (!pinBaru) return 'PIN baru wajib diisi';
  if (!/^\d{6}$/.test(String(pinBaru))) return 'PIN baru harus 6 digit angka';
  if (BLOCKED.includes(String(pinBaru))) return 'PIN baru terlalu mudah ditebak';
  if (String(pinLama) === String(pinBaru)) return 'PIN baru tidak boleh sama dengan PIN lama';
  if (!konfirmasi) return 'Konfirmasi PIN wajib diisi';
  if (String(pinBaru) !== String(konfirmasi)) return 'PIN baru dan konfirmasi tidak cocok';
  return null;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function GantiPinScreen({ navigation }) {
  const { changePin, isLoading, isSuccess, error, reset } = useChangePin();

  const [pinLama, setPinLama] = useState('');
  const [pinBaru, setPinBaru] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');

  const [showLama, setShowLama] = useState(false);
  const [showBaru, setShowBaru] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const [localError, setLocalError] = useState(null);

  const handleSubmit = useCallback(async () => {
    setLocalError(null);

    const valErr = validateLocal(pinLama, pinBaru, konfirmasi);
    if (valErr) {
      setLocalError(valErr);
      return;
    }

    await changePin({
      pin_lama: pinLama,
      pin_baru: pinBaru,
      konfirmasi_pin: konfirmasi,
    });
  }, [pinLama, pinBaru, konfirmasi, changePin]);

  const handleBack = useCallback(() => {
    reset();
    navigation.goBack();
  }, [reset, navigation]);

  const handleReset = useCallback(() => {
    setPinLama('');
    setPinBaru('');
    setKonfirmasi('');
    setLocalError(null);
    reset();
  }, [reset]);

  const displayError = localError ?? error;
  const isBaruMatch = pinBaru.length === 6 && konfirmasi.length > 0 && pinBaru === konfirmasi;
  const isBaruMismatch = konfirmasi.length > 0 && pinBaru !== konfirmasi;

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.safe}>
        <SuccessView onBack={handleBack} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Info banner ── */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Ganti PIN Masuk</Text>
              <Text style={styles.infoSub}>
                Gunakan 6 digit angka. Hindari PIN yang mudah ditebak.
              </Text>
            </View>
          </View>

          {/* ── Form card ── */}
          <View style={styles.card}>

            {/* PIN Lama */}
            <PinField
              label="PIN Lama"
              value={pinLama}
              onChangeText={(v) => {
                setLocalError(null);
                setPinLama(v.replace(/\D/g, '').slice(0, 6));
              }}
              visible={showLama}
              onToggleVisible={() => setShowLama((s) => !s)}
              hasError={!!displayError && displayError.includes('lama')}
            />

            <View style={styles.divider} />

            {/* PIN Baru */}
            <PinField
              label="PIN Baru"
              value={pinBaru}
              onChangeText={(v) => {
                setLocalError(null);
                setPinBaru(v.replace(/\D/g, '').slice(0, 6));
              }}
              visible={showBaru}
              onToggleVisible={() => setShowBaru((s) => !s)}
              hasError={!!displayError && displayError.includes('baru')}
            />
            <PinDots value={pinBaru} />

            <View style={styles.divider} />

            {/* Konfirmasi PIN */}
            <PinField
              label="Konfirmasi PIN Baru"
              value={konfirmasi}
              onChangeText={(v) => {
                setLocalError(null);
                setKonfirmasi(v.replace(/\D/g, '').slice(0, 6));
              }}
              visible={showKonfirmasi}
              onToggleVisible={() => setShowKonfirmasi((s) => !s)}
              hasError={isBaruMismatch}
            />

            {/* Match indicator */}
            {konfirmasi.length > 0 ? (
              <View style={[styles.matchRow, isBaruMatch ? styles.matchOk : styles.matchFail]}>
                <Text style={[styles.matchText, isBaruMatch ? styles.matchTextOk : styles.matchTextFail]}>
                  {isBaruMatch ? '✓ PIN cocok' : '✗ PIN belum cocok'}
                </Text>
              </View>
            ) : null}

          </View>

          {/* ── Error ── */}
          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {displayError}</Text>
            </View>
          ) : null}

          {/* ── Actions ── */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.submitRow}>
                <ActivityIndicator color={colors.white} size="small" />
                <Text style={styles.submitText}>Menyimpan...</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>Simpan PIN Baru</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetLink}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={styles.resetLinkText}>Reset Form</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 16, gap: 14 },

  // ── Info Banner ──
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  infoIcon: { fontSize: 28 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  infoSub: {
    fontSize: 12,
    color: colors.primaryDark,
    opacity: 0.8,
    marginTop: 2,
    lineHeight: 17,
  },

  // ── Card ──
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },

  // ── Field ──
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.gray50,
    paddingHorizontal: 14,
    height: 52,
  },
  pinInputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  pinInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 8,
    paddingVertical: 0,
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 20 },

  // ── Dots ──
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // ── Match Indicator ──
  matchRow: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 2,
  },
  matchOk: { backgroundColor: colors.successLight },
  matchFail: { backgroundColor: colors.dangerLight },
  matchText: { fontSize: 12, fontWeight: '700' },
  matchTextOk: { color: colors.success },
  matchTextFail: { color: colors.danger },

  // ── Error ──
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
    lineHeight: 19,
  },

  // ── Submit ──
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '800' },

  // ── Reset Link ──
  resetLink: { alignItems: 'center', paddingVertical: 10 },
  resetLinkText: { fontSize: 13, color: colors.gray400, fontWeight: '600' },

  // ── Success ──
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 14,
  },
  successIcon: { fontSize: 56 },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  backBtnText: { color: colors.white, fontSize: 15, fontWeight: '800' },
});
