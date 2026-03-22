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
  const recaptchaVerifier = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (phone) => {
    // Basic phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Add + prefix if not present
    if (!cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return cleaned;
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
      const result = await authService.sendOTP(formattedPhone, recaptchaVerifier.current);
      if (!result.success) {
        Alert.alert(result.title || 'Could not Send OTP', result.error || 'Failed to send OTP. Please try again.');
        return;
      }
      navigation.navigate('OTPVerification', {
        phoneNumber: formattedPhone,
      });
    } catch (error) {
      Alert.alert('Could not Send OTP', 'Something went wrong while requesting OTP. Please try again.');
    } finally {
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.kicker}>Community Reporting</Text>
            <Text style={styles.title}>CrowdSpot</Text>
            <Text style={styles.subtitle}>
              Join the community and help improve your neighborhood
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Sign up / Log in</Text>
            <Text style={styles.formSubtitle}>
              Enter your phone number to continue with OTP
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={COLORS.gray400} />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number (e.g., +1234567890)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
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
              We'll send you a verification code to confirm your number
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <Text style={styles.featuresTitle}>What you can do:</Text>
            
            <View style={styles.feature}>
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.featureText}>Report issues in your area</Text>
            </View>
            
            <View style={styles.feature}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.secondary} />
              <Text style={styles.featureText}>Get requests from authorities</Text>
            </View>
            
            <View style={styles.feature}>
              <Ionicons name="people-outline" size={24} color={COLORS.success} />
              <Text style={styles.featureText}>Help improve your community</Text>
            </View>
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
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  kicker: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.secondaryDark,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.header + 2,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  form: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
    marginBottom: SPACING.xl,
  },
  formTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  formSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg + 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
    marginBottom: SPACING.lg,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    marginLeft: SPACING.sm,
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  helperText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  features: {
    marginBottom: SPACING.sm,
  },
  featuresTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  featureText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
    flex: 1,
  },
});