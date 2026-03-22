import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Services
import { locationService } from '../services/location';

// Constants
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function RequestCard({ request, onPress, showDistance = false, userLocation }) {
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const requestTime = new Date(timestamp.seconds * 1000); // Firebase timestamp
    const diffInSeconds = (now - requestTime) / 1000;
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getDistance = () => {
    if (!showDistance || !userLocation || !request.location) return null;
    
    const distance = locationService.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      request.location.latitude,
      request.location.longitude
    );
    
    return locationService.formatDistance(distance);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'closed': return COLORS.gray500;
      case 'expired': return COLORS.error;
      default: return COLORS.warning;
    }
  };

  const getUrgencyColor = () => {
    if (request.priority === 'high') return COLORS.error;
    if (request.priority === 'medium') return COLORS.warning;
    return COLORS.info;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {request.title || 'Untitled Request'}
          </Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status) }]} />
            <Text style={styles.statusText}>
              {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Unknown'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {request.description || 'No description provided.'}
      </Text>

      <View style={styles.tagsContainer}>
        {request.tags?.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {request.tags?.length > 3 && (
          <Text style={styles.moreTags}>+{request.tags.length - 3} more</Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{getTimeAgo(request.createdAt)}</Text>
          </View>
          
          {showDistance && getDistance() && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{getDistance()}</Text>
            </View>
          )}
          
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>
              {request.currentCount || 0}/{request.targetCount || 0}
            </Text>
          </View>
        </View>

        {request.priority && (
          <View style={[styles.priorityBadge, { backgroundColor: getUrgencyColor() }]}>
            <Ionicons name="flag" size={12} color={COLORS.white} />
            <Text style={styles.priorityText}>
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.md,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  tagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  moreTags: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs / 2,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
  },
  priorityText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: SPACING.xs / 2,
  },
});