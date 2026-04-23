import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/auth';
import { requestService } from '../../services/database';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS, ROUTES } from '../../constants/theme';

export default function AdminRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        setRequests([]);
        return;
      }
      const result = await requestService.getRequestsByAdmin(currentUser.uid);
      if (result.success) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error('Error loading admin requests:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadRequests();
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return COLORS.success;
      case 'closed':
        return COLORS.gray500;
      case 'expired':
        return COLORS.error;
      default:
        return COLORS.warning;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => navigation.navigate(ROUTES.REQUEST_DETAILS, { request: item, adminView: true })}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title || 'Untitled Request'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status || 'unknown'}
          </Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {item.description || 'No description'}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="document-text-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>
            {item.currentCount || 0}/{item.targetCount || 0} reports
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading admin requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={styles.pageTitle}>My Requests</Text>}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="folder-open-outline" size={42} color={COLORS.gray300} />
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptyText}>Create your first request from Profile.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  pageTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  requestCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
