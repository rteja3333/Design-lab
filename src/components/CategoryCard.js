import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Constants
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function CategoryCard({ category, onPress, compact = false }) {
  return (
    <TouchableOpacity 
      style={[styles.container, compact && styles.compactContainer]} 
      onPress={() => onPress(category)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: category.color + '12' }]}>
        <Ionicons 
          name={category.icon} 
          size={compact ? 18 : 24} 
          color={category.color} 
        />
      </View>
      
      <Text style={[styles.title, compact && styles.compactTitle]} numberOfLines={1}>
        {category.name}
      </Text>
      
      {!compact && (
        <Text style={styles.tagCount}>
          {category.tags?.length || 0} tags
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    minWidth: 110,
    marginRight: SPACING.sm,
    ...SHADOWS.sm,
  },
  compactContainer: {
    padding: SPACING.md,
    minWidth: 88,
    borderRadius: RADIUS.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  compactTitle: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  tagCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});