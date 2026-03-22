import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';

export default function RecentReportCard({ report, onPress }) {
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const reportTime = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInHours = Math.floor((now - reportTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'approved': return COLORS.success;
      case 'rejected': return COLORS.error;
      default: return COLORS.gray400;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {report.images && report.images.length > 0 ? (
            <Image source={{ uri: report.images[0] }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={24} color={COLORS.gray400} />
            </View>
          )}
        </View>
        
        {/* Details */}
        <View style={styles.details}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {report.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                {report.status}
              </Text>
            </View>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {report.description}
          </Text>
          
          <View style={styles.footer}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{report.category}</Text>
            </View>
            <Text style={styles.timestamp}>
              {formatTimeAgo(report.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  imageContainer: {
    marginRight: SPACING.md,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
});