import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Services
import { authService } from '../../services/auth';

// Constants
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function OTPVerificationScreen({ navigation, route }) {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const otpRefs = useRef([]);

  useEffect(() => {
    console.log('[OTP][VerifyScreen] Mounted OTP verification screen', {
      phoneNumber,
    });
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      console.log('[OTP][VerifyScreen] Unmounted OTP verification screen');
    };
  }, []);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && text) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (otpCode = null) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.verifyOTP(code);
      if (!result.success) {
        Alert.alert(result.title || 'Verification Failed', result.error || 'Invalid verification code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        return;
      }

      Alert.alert('Success', 'Phone number verified successfully!');
    } catch (error) {
      Alert.alert('Verification Failed', 'Unable to verify OTP right now. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const result = await authService.resendOTP(phoneNumber);
      if (!result.success) {
        Alert.alert(result.title || 'Unable to Resend OTP', result.error || 'Please go back and try again.');
        return;
      }
      Alert.alert('OTP Sent', 'A new verification code has been sent to your phone.');
      
      // Reset timer
      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      
      // Start new countdown
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      console.error('Resend OTP Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (phone.length <= 4) return phone;
    return phone.slice(0, -4) + '****';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark-outline" size={36} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneText}>{formatPhoneNumber(phoneNumber)}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => otpRefs.current[index] = ref}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled
                ]}
                value={digit}
                onChangeText={text => handleOtpChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
            onPress={() => verifyOtp()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={resendOtp}>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Resend in {resendTimer}s
              </Text>
            )}
          </View>
        </View>
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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  phoneText: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  otpInputFilled: {
    backgroundColor: COLORS.primaryMuted,
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    minWidth: 180,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  resendContainer: {
    marginBottom: SPACING.lg,
  },
  resendText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  timerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
});