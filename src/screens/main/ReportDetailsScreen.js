import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS, CATEGORIES } from '../../constants/theme';

export default function ReportDetailsScreen({ route }) {
  const { report } = route.params || {};

  if (!report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No report data available</Text>
      </View>
    );
  }

  const category = CATEGORIES.find(c => c.id === report.category);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return COLORS.success;
      case 'rejected': return COLORS.error;
      case 'pending':
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
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status + Category */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(report.status) }]} />
            <Text style={[styles.statusLabel, { color: getStatusColor(report.status) }]}>
              {report.status?.charAt(0).toUpperCase() + report.status?.slice(1) || 'Pending'}
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
        <Text style={styles.title}>{report.title || 'Untitled Report'}</Text>

        {/* Description */}
        <Text style={styles.description}>{report.description || 'No description provided.'}</Text>

        {/* Images */}
        {report.images?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {report.images.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.imageThumb} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailCard}>
            {report.address ? (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                <Text style={styles.detailText}>{report.address}</Text>
              </View>
            ) : report.location ? (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                <Text style={styles.detailText}>
                  {report.location.latitude?.toFixed(4)}, {report.location.longitude?.toFixed(4)}
                </Text>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={styles.detailText}>Created: {formatDate(report.createdAt)}</Text>
            </View>
            {report.requestId && (
              <View style={styles.detailRow}>
                <Ionicons name="link-outline" size={18} color={COLORS.secondary} />
                <Text style={styles.detailText}>Linked to request</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tags */}
        {report.tags?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {report.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
  imageThumb: {
    width: 140,
    height: 140,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.gray200,
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
});