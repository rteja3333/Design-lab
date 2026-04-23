import { userService } from './database';
import { firebaseAuth } from './firebase';

const auth = firebaseAuth;
let pendingConfirmationResult = null;
let lastOtpRequest = {
  phoneNumber: null,
  recaptchaVerifier: null,
};

const mapAuthError = (error, fallbackMessage) => {
  const code = error?.code || '';

  const mapped = {
    'auth/invalid-phone-number': {
      title: 'Invalid Phone Number',
      message: 'Phone number looks too short or invalid. Include country code, for example: +91XXXXXXXXXX.',
    },
    'auth/too-many-requests': {
      title: 'Too Many Attempts',
      message: 'Too many OTP requests were made. Please wait a few minutes and try again.',
    },
    'auth/quota-exceeded': {
      title: 'SMS Limit Reached',
      message: 'OTP SMS quota is reached for now. Please try again later.',
    },
    'auth/invalid-verification-code': {
      title: 'Invalid OTP Code',
      message: 'The OTP you entered is incorrect. Please check the latest SMS and try again.',
    },
    'auth/code-expired': {
      title: 'OTP Expired',
      message: 'This OTP has expired. Please request a new OTP code.',
    },
    'auth/session-expired': {
      title: 'Session Expired',
      message: 'Your verification session has expired. Please request OTP again.',
    },
    'auth/network-request-failed': {
      title: 'Network Error',
      message: 'Unable to connect right now. Please check internet and try again.',
    },
  };

  const fallback = {
    title: 'Authentication Error',
    message: fallbackMessage || 'Something went wrong. Please try again.',
  };

  return {
    code,
    ...(mapped[code] || fallback),
  };
};

// Phone Authentication Service
export const authService = {
  // Send OTP to phone number
  async sendOTP(phoneNumber, recaptchaVerifier) {
    try {
      console.log('[OTP][Service] Calling signInWithPhoneNumber', {
        phoneNumber,
        hasRecaptchaVerifier: !!recaptchaVerifier,
      });
      const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
      pendingConfirmationResult = confirmationResult;
      lastOtpRequest = {
        phoneNumber,
        recaptchaVerifier,
      };
      console.log('[OTP][Service] signInWithPhoneNumber success', {
        hasPendingConfirmationResult: !!pendingConfirmationResult,
      });
      return { 
        success: true
      };
    } catch (error) {
      const mapped = mapAuthError(error, 'Failed to send OTP. Please try again.');
      console.error('[OTP][Service] signInWithPhoneNumber failed', {
        code: error?.code,
        message: error?.message,
        mappedCode: mapped.code,
      });
      console.warn('OTP send failed:', mapped.code || error?.message);
      return { success: false, error: mapped.message, title: mapped.title, code: mapped.code };
    }
  },

  async resendOTP(phoneNumber = null) {
    const targetPhone = phoneNumber || lastOtpRequest.phoneNumber;
    if (!targetPhone) {
      return {
        success: false,
        title: 'Session Expired',
        error: 'Phone number is missing. Please go back and request OTP again.',
      };
    }

    const verifier = lastOtpRequest.recaptchaVerifier;
    if (!verifier) {
      return {
        success: false,
        title: 'Verification Required',
        error: 'Could not reuse verification session. Please go back and request OTP again.',
      };
    }

    return this.sendOTP(targetPhone, verifier);
  },

  // Verify OTP and sign in
  async verifyOTP(otpCode) {
    try {
      if (!pendingConfirmationResult) {
        return { success: false, error: 'OTP session expired. Please request OTP again.' };
      }

      const userCredential = await pendingConfirmationResult.confirm(otpCode);
      pendingConfirmationResult = null;
      lastOtpRequest = {
        phoneNumber: null,
        recaptchaVerifier: null,
      };
      
      // Check if user exists in Firestore, if not create profile
      const userResult = await userService.getUser(userCredential.user.uid);
      if (!userResult.success) {
        // Create new user profile
        await userService.createUser({
          uid: userCredential.user.uid,
          phoneNumber: userCredential.user.phoneNumber,
          displayName: userCredential.user.phoneNumber, // Can be updated later
          profileImage: null,
          location: null // Will be updated when user grants location permission
        });
      }

      return { 
        success: true, 
        user: userCredential.user 
      };
    } catch (error) {
      const mapped = mapAuthError(error, 'Failed to verify OTP. Please try again.');
      console.warn('OTP verify failed:', mapped.code || error?.message);
      return { success: false, error: mapped.message, title: mapped.title, code: mapped.code };
    }
  },

  // Sign out
  async signOut() {
    try {
      await auth.signOut();
      pendingConfirmationResult = null;
      lastOtpRequest = {
        phoneNumber: null,
        recaptchaVerifier: null,
      };
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!auth.currentUser;
  }
};