import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useRef } from 'react';

// Services
import { authService } from '../../services/auth';
import { firebaseConfig } from '../../services/firebase';

// Constants
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
  const DEFAULT_COUNTRY_CODE = '+91';
  const recaptchaVerifier = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState(DEFAULT_COUNTRY_CODE);
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (phone) => {
    // Basic phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (text) => {
    const digitsOnly = text.replace(/\D/g, '');
    const localNumber = digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly;
    return `${DEFAULT_COUNTRY_CODE}${localNumber}`;
  };

  const handlePhoneChange = (text) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!validatePhoneNumber(formattedPhone)) {
      Alert.alert('Error', 'Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[OTP][Login] Starting OTP send flow', {
        formattedPhone,
        hasRecaptchaVerifier: !!recaptchaVerifier.current,
      });
      const result = await authService.sendOTP(formattedPhone, recaptchaVerifier.current);
      console.log('[OTP][Login] sendOTP response', result);
      if (!result.success) {
        console.warn('[OTP][Login] OTP send failed', result);
        Alert.alert(result.title || 'Could not Send OTP', result.error || 'Failed to send OTP. Please try again.');
        return;
      }
      console.log('[OTP][Login] OTP send success, navigating to OTPVerification');
      navigation.navigate('OTPVerification', {
        phoneNumber: formattedPhone,
      });
    } catch (error) {
      console.error('[OTP][Login] Unexpected error while sending OTP', {
        code: error?.code,
        message: error?.message,
      });
      Alert.alert('Could not Send OTP', 'Something went wrong while requesting OTP. Please try again.');
    } finally {
      console.log('[OTP][Login] OTP send flow finished');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header — airy, nature-inspired */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="leaf" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.kicker}>Community Reporting</Text>
            <Text style={styles.title}>CrowdSpot</Text>
            <Text style={styles.subtitle}>
              Report local issues. Help your neighborhood thrive.
            </Text>
          </View>

          {/* Form — borderless card on surface bg */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Welcome</Text>
            <Text style={styles.formSubtitle}>
              Enter your phone number to get started
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                placeholderTextColor={COLORS.textLight}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                maxLength={13}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.helperText}>
              We'll send a one-time verification code
            </Text>
          </View>

          {/* Features — clean list, no card wrapping */}
          <View style={styles.features}>
            {[
              { icon: 'camera-outline', text: 'Report issues with photos & video', color: COLORS.primary },
              { icon: 'notifications-outline', text: 'Respond to community requests', color: COLORS.secondary },
              { icon: 'people-outline', text: 'Build a better neighborhood', color: COLORS.secondaryDark },
            ].map((item, i) => (
              <View key={i} style={styles.feature}>
                <Ionicons name={item.icon} size={20} color={item.color} />
                <Text style={styles.featureText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  kicker: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.header,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  form: {
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  formTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  input: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  helperText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  features: {
    gap: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
});