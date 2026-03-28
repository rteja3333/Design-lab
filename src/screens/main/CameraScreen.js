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
  const toISO = (ts) => {
    if (!ts) return new Date().toISOString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toISOString();
    if (typeof ts === 'string') return ts;
    return new Date(ts).toISOString();
  };

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
      background_context: [],
    },
    capture_requirements: [
      {
        shot_id: `SHOT-${request.id || '01'}`,
        label: request.title || 'Capture',
        media_type: 'photo',
        priority: 1,
      },
    ],
    quality_thresholds: {
      min_resolution: '480p',
      max_blur_score: 0.20,
      min_brightness: 60,
      max_tilt_degrees: 60,
      file_size_mb: { min: 0, max: 25 },
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