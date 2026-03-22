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
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: user?.profileImage || DEFAULT_IMAGES.profile }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editImageButton}>
            <Ionicons name="camera" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>
            {user?.displayName || user?.phoneNumber || 'User'}
          </Text>
          <Text style={styles.userPhone}>{user?.phoneNumber}</Text>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={16} color={COLORS.primary} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userReports.length}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {userReports.filter(r => r.status === 'approved').length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user?.reputation || 0}</Text>
          <Text style={styles.statLabel}>Reputation</Text>
        </View>
      </View>

      {/* Reports Section Header */}
      <View style={styles.reportsHeader}>
        <Text style={styles.sectionTitle}>My Reports</Text>
        <TouchableOpacity 
          style={styles.createReportButton}
          onPress={() => navigation.navigate(ROUTES.REPORT_CREATE)}
        >
          <Ionicons name="add" size={20} color={COLORS.primary} />
          <Text style={styles.createReportText}>New Report</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.adminRequestButton}
        onPress={() => navigation.navigate(ROUTES.CREATE_REQUEST)}
      >
        <Ionicons name="send" size={16} color={COLORS.secondary} />
        <Text style={styles.adminRequestText}>Admin: Create Location Request</Text>
      </TouchableOpacity>
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
            />
            <View style={styles.reportStatus}>
              <Ionicons 
                name={getStatusIcon(item.status)} 
                size={16} 
                color={getStatusColor(item.status)} 
              />
              <Text style={[styles.reportStatusText, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
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
    paddingTop: SPACING.lg,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: SPACING.lg,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userPhone: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  reportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  createReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight + '20',
    borderRadius: RADIUS.md,
  },
  createReportText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  adminRequestButton: {
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary + '20',
  },
  adminRequestText: {
    marginLeft: SPACING.xs,
    color: COLORS.secondaryDark,
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  reportCardContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  reportStatus: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    ...SHADOWS.sm,
  },
  reportStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
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
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: RADIUS.md,
  },
  signOutText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.error,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
});