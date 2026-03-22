// Placeholder screens - these will be implemented in future iterations

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';

// Report Details Screen
export const ReportDetailsScreen = ({ route }) => {
  const { report } = route.params || {};
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Details</Text>
      <Text style={styles.subtitle}>
        {report ? `Viewing report: ${report.title || 'Untitled'}` : 'No report data available'}
      </Text>
    </View>
  );
};

// Request Details Screen
export const RequestDetailsScreen = ({ route }) => {
  const { request } = route.params || {};
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Request Details</Text>
      <Text style={styles.subtitle}>
        {request ? `Viewing request: ${request.title || 'Untitled'}` : 'No request data available'}
      </Text>
    </View>
  );
};

// Camera Screen
export const CameraScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera</Text>
      <Text style={styles.subtitle}>Camera functionality will be available soon</Text>
    </View>
  );
};

// Map View Screen
export const MapViewScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map View</Text>
      <Text style={styles.subtitle}>Map integration coming soon</Text>
    </View>
  );
};

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