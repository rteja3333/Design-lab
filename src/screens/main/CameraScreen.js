import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { GuidedCameraScreen } from '@/components/GuidedImageCapture/GuidedCameraScreen'
import CONFIG, { TEST_MODE_VALUES } from '@/components/GuidedImageCapture/types/config'
import TEST_TASK from '@/components/GuidedImageCapture/types/task.json'

export default function CameraScreen() {

  // TO-DO: INPUT POINT
  // Load test task when not in OFF mode, otherwise expect real task from elsewhere
  const task = CONFIG.TEST_MODE !== TEST_MODE_VALUES.OFF ? TEST_TASK : null

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera</Text>
        <Text style={styles.subtitle}>Camera functionality will be available soon</Text>
      </View>
    );
  }

  return <GuidedCameraScreen task={task} />
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