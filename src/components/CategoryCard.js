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
    >
      <View style={[styles.iconContainer, { backgroundColor: category.color + '15' }]}>
        <Ionicons 
          name={category.icon} 
          size={compact ? 20 : 28} 
          color={category.color} 
        />
      </View>
      
      <Text style={[styles.title, compact && styles.compactTitle]} numberOfLines={2}>
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
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    minWidth: 120,
    ...SHADOWS.sm,
    marginRight: SPACING.md,
  },
  compactContainer: {
    padding: SPACING.md,
    minWidth: 90,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  compactTitle: {
    fontSize: FONT_SIZES.sm,
    marginBottom: 0,
    marginTop: SPACING.sm,
  },
  tagCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});