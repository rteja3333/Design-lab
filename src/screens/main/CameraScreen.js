import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, ROUTES } from '../../constants/theme';
import { GuidedCameraScreen } from '../../components/GuidedImageCapture/GuidedCameraScreen'
import { NormalCameraScreen } from '../../components/GuidedImageCapture/NormalCameraScreen'
import CONFIG, { TEST_MODE_VALUES } from '../../components/GuidedImageCapture/types/config'
import TEST_TASK from '../../components/GuidedImageCapture/types/task.json'

/**
 * Converts a Firestore request object into the TaskJson shape
 * expected by the guided capture engine.
 */
function buildTaskFromRequest(request) {
  const getIssueValidationProfile = () => {
    const category = request.category;
    const tags = request.tags || [];
    const isNightFriendly = tags.includes('streetlight');

    const base = {
      min_resolution: '480p',
      max_blur_score: 0.2,
      min_brightness: 60,
      max_tilt_degrees: 60,
      file_size_mb: { min: 0, max: 25 },
      requiredShots: 1,
    };

    if (category === 'infrastructure') {
      return {
        ...base,
        min_resolution: '720p',
        max_tilt_degrees: 35,
        requiredShots: tags.includes('pothole') ? 2 : 1,
      };
    }

    if (category === 'safety') {
      return {
        ...base,
        min_resolution: '720p',
        max_tilt_degrees: 30,
        min_brightness: isNightFriendly ? 35 : 55,
        requiredShots: 2,
      };
    }

    if (category === 'environment') {
      return {
        ...base,
        min_resolution: '720p',
        max_tilt_degrees: 40,
        requiredShots: 2,
      };
    }

    return base;
  };

  const toISO = (ts) => {
    if (!ts) return new Date().toISOString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toISOString();
    if (typeof ts === 'string') return ts;
    return new Date(ts).toISOString();
  };

  const profile = getIssueValidationProfile();
  const requiredShots = Math.max(1, profile.requiredShots || 1);
  const shotList = Array.from({ length: requiredShots }).map((_, idx) => ({
    shot_id: `SHOT-${request.id || '01'}-${idx + 1}`,
    label: idx === 0 ? (request.title || 'Capture overview') : `Capture evidence angle ${idx + 1}`,
    media_type: 'photo',
    priority: idx + 1,
  }));

  return {
    task_id: `TK-REQ-${request.id || 'unknown'}`,
    report_id: '',
    issued_at: toISO(request.createdAt),
    expires_at: toISO(request.expiresAt),
    capture_location: {
      lat: request.location?.latitude ?? 0,
      lng: request.location?.longitude ?? 0,
      radius_meters: request.radius ?? 50,
      landmark_hint: request.title || 'Request location',
    },
    capture_orientation: {
      facing_direction: 'N',
      distance_from_subject_meters: { min: 1, max: 10 },
      subject_hint: request.instructions || request.description || '',
      orientation: 'portrait',
    },
    subject: {
      object_of_interest: request.title || '',
      fault_description: request.description || '',
      focus_region: 'centre',
      secondary_context: request.tags || [],
      background_context: [request.category].filter(Boolean),
    },
    capture_requirements: shotList,
    quality_thresholds: {
      min_resolution: profile.min_resolution,
      max_blur_score: profile.max_blur_score,
      min_brightness: profile.min_brightness,
      max_tilt_degrees: profile.max_tilt_degrees,
      file_size_mb: profile.file_size_mb,
    },
  };
}

export default function CameraScreen({ navigation, route }) {
  const request = route?.params?.request;

  // Build task: from request when fulfilling one, otherwise from test task
  const task = request
    ? buildTaskFromRequest(request)
    : CONFIG.TEST_MODE !== TEST_MODE_VALUES.OFF
      ? TEST_TASK
      : null;

  const handleComplete = (result) => {
    // Navigate back to ReportCreateScreen with the capture result
    navigation.navigate(ROUTES.REPORT_CREATE, {
      captureResult: result,
      request,
    });
  };

  // When fulfilling a request → guided flow with validation & navigation
  // Otherwise (direct report) → simple capture flow
  if (request) {
    return (
      <GuidedCameraScreen
        task={task}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <NormalCameraScreen
      task={task}
      onComplete={handleComplete}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});