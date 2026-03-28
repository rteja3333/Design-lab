import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS, CATEGORIES, ROUTES } from '../../constants/theme';

export default function RequestDetailsScreen({ navigation, route }) {
  const { request } = route.params || {};

  if (!request) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No request data available</Text>
      </View>
    );
  }

  const category = CATEGORIES.find(c => c.id === request.category);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'closed': return COLORS.gray500;
      case 'expired': return COLORS.error;
      default: return COLORS.warning;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const progress = request.targetCount > 0
    ? Math.min((request.currentCount || 0) / request.targetCount, 1)
    : 0;

  const handleReport = () => {
    navigation.navigate(ROUTES.REPORT_CREATE, { request });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>  
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status) }]} />
            <Text style={[styles.statusLabel, { color: getStatusColor(request.status) }]}>
              {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Unknown'}
            </Text>
          </View>
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '15' }]}>
              <Ionicons name={category.icon} size={14} color={category.color} />
              <Text style={[styles.categoryLabel, { color: category.color }]}>{category.name}</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{request.title || 'Untitled Request'}</Text>

        {/* Description */}
        <Text style={styles.description}>{request.description || 'No description provided.'}</Text>

        {/* Progress */}
        {request.targetCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {request.currentCount || 0} / {request.targetCount} reports submitted
              </Text>
            </View>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailCard}>
            {request.location && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                <Text style={styles.detailText}>
                  Location: {request.location.latitude?.toFixed(4)}, {request.location.longitude?.toFixed(4)}
                </Text>
              </View>
            )}
            {request.radius > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="radio-outline" size={18} color={COLORS.primary} />
                <Text style={styles.detailText}>Radius: {request.radius}m</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={styles.detailText}>Created: {formatDate(request.createdAt)}</Text>
            </View>
            {request.expiresAt && (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color={COLORS.warning} />
                <Text style={styles.detailText}>Expires: {formatDate(request.expiresAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tags */}
        {request.tags?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {request.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        {request.instructions ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.instructionsCard}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
              <Text style={styles.instructionsText}>{request.instructions}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Report Button */}
      {request.status === 'active' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
            <Ionicons name="document-text-outline" size={22} color={COLORS.white} />
            <Text style={styles.reportButtonText}>Submit a Report</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
  },
  tagText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  instructionsText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  bottomBar: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.md,
  },
  reportButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  reportButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});