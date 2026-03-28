import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import ReportCard from '../../components/ReportCard';

// Services
import { authService } from '../../services/auth';
import { userService, reportService } from '../../services/database';

// Constants
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS, DEFAULT_IMAGES, ROUTES } from '../../constants/theme';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeProfile();
  }, []);

  const initializeProfile = async () => {
    setLoading(true);
    await loadUserProfile();
    await loadUserReports();
    setLoading(false);
  };

  const loadUserProfile = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const result = await userService.getUser(currentUser.uid);
        if (result.success) {
          setUser(result.data);
        } else {
          // User profile not found, create one
          const userData = {
            uid: currentUser.uid,
            phoneNumber: currentUser.phoneNumber,
            displayName: currentUser.phoneNumber,
            profileImage: null,
            location: null
          };
          await userService.createUser(userData);
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserReports = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const result = await reportService.getUserReports(currentUser.uid);
        if (result.success) {
          setUserReports(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading user reports:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserProfile(), loadUserReports()]);
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await authService.signOut();
            if (!result.success) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Profile editing feature will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  const handleReportPress = (report) => {
    navigation.navigate(ROUTES.REPORT_DETAILS, { report });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return COLORS.success;
      case 'rejected': return COLORS.error;
      default: return COLORS.warning;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      default: return 'time';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Profile Section — clean centered layout */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: user?.profileImage || DEFAULT_IMAGES.profile }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editImageButton}>
            <Ionicons name="camera-outline" size={14} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.userName}>
          {user?.displayName || user?.phoneNumber || 'User'}
        </Text>
        <Text style={styles.userPhone}>{user?.phoneNumber}</Text>
        
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats — horizontal pills */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userReports.length}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {userReports.filter(r => r.status === 'approved').length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user?.reputation || 0}</Text>
          <Text style={styles.statLabel}>Reputation</Text>
        </View>
      </View>

      {/* Actions row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.createReportButton}
          onPress={() => navigation.navigate(ROUTES.REPORT_CREATE)}
        >
          <Ionicons name="add" size={18} color={COLORS.primary} />
          <Text style={styles.createReportText}>New Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminRequestButton}
          onPress={() => navigation.navigate(ROUTES.CREATE_REQUEST)}
        >
          <Ionicons name="send-outline" size={14} color={COLORS.secondary} />
          <Text style={styles.adminRequestText}>Admin Request</Text>
        </TouchableOpacity>
      </View>

      {/* Section title */}
      <Text style={styles.sectionTitle}>My Reports</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={48} color={COLORS.gray300} />
      <Text style={styles.emptyStateTitle}>No Reports Yet</Text>
      <Text style={styles.emptyStateText}>
        Start contributing to your community by creating your first report!
      </Text>
      <TouchableOpacity 
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate(ROUTES.REPORT_CREATE)}
      >
        <Text style={styles.emptyStateButtonText}>Create Report</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={userReports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reportCardContainer}>
            <ReportCard 
              report={item} 
              onPress={() => handleReportPress(item)}
              status={{
                label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                color: getStatusColor(item.status),
                icon: getStatusIcon(item.status),
              }}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={userReports.length === 0 ? renderEmptyState : null}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    paddingBottom: SPACING.xl,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userPhone: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  editButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
  },
  editButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    ...SHADOWS.sm,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  statNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
  },
  createReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  createReportText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  adminRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    gap: SPACING.xs,
  },
  adminRequestText: {
    color: COLORS.secondary,
    fontWeight: '500',
    fontSize: FONT_SIZES.sm,
  },
  reportCardContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
  },
  signOutText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '500',
  },
});