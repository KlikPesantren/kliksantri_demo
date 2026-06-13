import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChangePin } from '../../hooks/useChangePin';
import {
  ScreenContainer,
  AppCard,
  AppText,
  AppButton,
  EmptyState,
} from '../../components/ui';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/theme';

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

function PinField({ label, value, onChangeText, visible, onToggleVisible, hasError }) {
  return (
    <View style={styles.field}>
      <AppText variant="label" color="muted">{label}</AppText>
      <View style={[styles.inputWrap, hasError && styles.inputError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry={!visible}
          placeholder="••••••"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity onPress={onToggleVisible} style={styles.eyeBtn}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PinDots({ value }) {
  const len = (value ?? '').length;
  return (
    <View style={styles.dots}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.dot, i < len ? styles.dotFilled : styles.dotEmpty]} />
      ))}
    </View>
  );
}

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
    await changePin({ pin_lama: pinLama, pin_baru: pinBaru, konfirmasi_pin: konfirmasi });
  }, [pinLama, pinBaru, konfirmasi, changePin]);

  const handleBack = useCallback(() => {
    reset();
    navigation.goBack();
  }, [reset, navigation]);

  const displayError = localError ?? error;

  if (isSuccess) {
    return (
      <ScreenContainer>
        <View style={styles.successWrap}>
          <EmptyState
            title="PIN Berhasil Diubah"
            description="Gunakan PIN baru untuk login berikutnya."
            icon="checkmark-circle-outline"
            iconColor={colors.success}
            action={<AppButton onPress={handleBack}>Kembali ke Profil</AppButton>}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AppCard padding="md" style={styles.info}>
            <AppText variant="h3">Ganti PIN Masuk</AppText>
            <AppText variant="caption" color="secondary">
              Gunakan 6 digit angka. Hindari PIN yang mudah ditebak.
            </AppText>
          </AppCard>

          <AppCard padding="md" style={styles.form}>
            <PinField
              label="PIN Lama"
              value={pinLama}
              onChangeText={(v) => { setLocalError(null); setPinLama(v.replace(/\D/g, '').slice(0, 6)); }}
              visible={showLama}
              onToggleVisible={() => setShowLama((s) => !s)}
              hasError={!!displayError && displayError.includes('lama')}
            />
            <PinField
              label="PIN Baru"
              value={pinBaru}
              onChangeText={(v) => { setLocalError(null); setPinBaru(v.replace(/\D/g, '').slice(0, 6)); }}
              visible={showBaru}
              onToggleVisible={() => setShowBaru((s) => !s)}
            />
            <PinDots value={pinBaru} />
            <PinField
              label="Konfirmasi PIN Baru"
              value={konfirmasi}
              onChangeText={(v) => { setLocalError(null); setKonfirmasi(v.replace(/\D/g, '').slice(0, 6)); }}
              visible={showKonfirmasi}
              onToggleVisible={() => setShowKonfirmasi((s) => !s)}
              hasError={!!displayError && displayError.includes('konfirmasi')}
            />

            {displayError ? (
              <AppText variant="caption" color="danger" style={styles.error}>{displayError}</AppText>
            ) : null}

            <AppButton fullWidth loading={isLoading} onPress={handleSubmit} style={styles.submit}>
              Simpan PIN Baru
            </AppButton>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['3xl'] },
  info: { gap: spacing.sm },
  form: { gap: spacing.lg },
  field: { gap: spacing.sm },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  input: { flex: 1, padding: spacing.md, fontSize: 16, color: colors.textPrimary },
  eyeBtn: { padding: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotFilled: { backgroundColor: colors.primary },
  dotEmpty: { backgroundColor: colors.border },
  error: { fontWeight: '600' },
  submit: { marginTop: spacing.sm },
  successWrap: { flex: 1, justifyContent: 'center' },
});
