import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import RequestCard from '../../components/RequestCard';
import CategoryCard from '../../components/CategoryCard';

// Services
import { requestService } from '../../services/database';
import { locationService } from '../../services/location';

// Constants
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS, CATEGORIES, ROUTES } from '../../constants/theme';

export default function HomeScreen({ navigation }) {
  const [activeRequests, setActiveRequests] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    setLoading(true);
    const currentLocation = await getUserLocation();
    await loadActiveRequests(currentLocation);
    setLoading(false);
  };

  const getUserLocation = async () => {
    try {
      const result = await locationService.getCurrentLocation();
      if (result.success) {
        setUserLocation(result.location);
        return result.location;
      }
      return null;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const loadActiveRequests = async (location = userLocation) => {
    try {
      const result = await requestService.getActiveRequests(location);
      if (result.success) {
        setActiveRequests(result.data.slice(0, 10)); // Limit to 10 requests
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const currentLocation = await getUserLocation();
    await loadActiveRequests(currentLocation);
    setRefreshing(false);
  };

  const handleCreateReport = () => {
    navigation.navigate(ROUTES.REPORT_CREATE);
  };

  const handleRequestPress = (request) => {
    navigation.navigate(ROUTES.REQUEST_DETAILS, { request });
  };

  const handleCategoryPress = (category) => {
    navigation.navigate(ROUTES.REPORT_CREATE, { selectedCategory: category });
  };

  const handleViewProfile = () => {
    navigation.navigate('ProfileTab');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>Hello there</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textLight} />
            <Text style={styles.location}>
              {userLocation ? 'Current Location' : 'Location unavailable'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleViewProfile}>
          <Ionicons name="person-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Main CTA — clean pill button layout */}
      <TouchableOpacity style={styles.reportButton} onPress={handleCreateReport} activeOpacity={0.8}>
        <View style={styles.reportButtonIcon}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </View>
        <View style={styles.reportButtonTextWrap}>
          <Text style={styles.reportButtonText}>Report an Issue</Text>
          <Text style={styles.reportButtonSubtext}>Help improve your community</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.white} style={{ opacity: 0.7 }} />
      </TouchableOpacity>

      {/* Quick Categories — horizontal scroll */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES.slice(0, 4)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CategoryCard 
              category={item} 
              onPress={() => handleCategoryPress(item)}
              compact
            />
          )}
          contentContainerStyle={styles.categoriesListContent}
        />
      </View>

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>Nearby Requests</Text>
          <Text style={styles.sectionSubtitle}>
            {activeRequests.length} active in your area
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="leaf-outline" size={32} color={COLORS.textLight} />
      </View>
      <Text style={styles.emptyStateTitle}>All quiet here</Text>
      <Text style={styles.emptyStateText}>
        No active requests nearby.{'\n'}
        Check back soon or file a new report.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading && activeRequests.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading nearby requests...</Text>
        </View>
      ) : (
      <FlatList
        data={activeRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard 
            request={item} 
            onPress={() => handleRequestPress(item)}
            showDistance
            userLocation={userLocation}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={activeRequests.length === 0 ? renderEmptyState : null}
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
      )}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.title,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  location: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  reportButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButtonTextWrap: {
    flex: 1,
  },
  reportButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  reportButtonSubtext: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  categoriesSection: {
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
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  categoriesListContent: {
    paddingRight: SPACING.lg,
  },
  requestsSection: {
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});