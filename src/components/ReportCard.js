import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Constants
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS, CATEGORIES } from '../constants/theme';

export default function ReportCard({ report, onPress, status }) {
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const reportTime = new Date(timestamp.seconds * 1000); // Firebase timestamp
    const diffInSeconds = (now - reportTime) / 1000;
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getCategoryInfo = () => {
    const category = CATEGORIES.find(cat => cat.id === report.category);
    return category || { name: 'Unknown', icon: 'help-outline', color: COLORS.gray400 };
  };

  const category = getCategoryInfo();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
            <Ionicons name={category.icon} size={16} color={category.color} />
          </View>
          <Text style={styles.categoryText}>{category.name}</Text>
        </View>
        
        <View style={styles.headerRight}>
          {status && (
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Ionicons name={status.icon} size={12} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          )}
          <Text style={styles.timeText}>{getTimeAgo(report.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {report.title || 'Untitled Report'}
      </Text>

      <Text style={styles.description} numberOfLines={3}>
        {report.description || 'No description provided.'}
      </Text>

      {report.tags && report.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {report.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {report.tags.length > 3 && (
            <Text style={styles.moreTags}>+{report.tags.length - 3} more</Text>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.mediaInfo}>
          {report.images && report.images.length > 0 && (
            <View style={styles.mediaItem}>
              <Ionicons name="image-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.mediaText}>{report.images.length}</Text>
            </View>
          )}
          
          {report.videos && report.videos.length > 0 && (
            <View style={styles.mediaItem}>
              <Ionicons name="videocam-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.mediaText}>{report.videos.length}</Text>
            </View>
          )}
          
          {report.address && (
            <View style={styles.locationItem}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {report.address}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    gap: SPACING.xs / 2,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    lineHeight: 22,
  },
  description: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  tag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  tagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
  moreTags: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  mediaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  mediaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs / 2,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs / 2,
    flex: 1,
  },
});