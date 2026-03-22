import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert
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
    await getUserLocation();
    await loadActiveRequests();
    setLoading(false);
  };

  const getUserLocation = async () => {
    try {
      const result = await locationService.getCurrentLocation();
      if (result.success) {
        setUserLocation(result.location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadActiveRequests = async () => {
    try {
      const result = await requestService.getActiveRequests(userLocation);
      if (result.success) {
        setActiveRequests(result.data.slice(0, 10)); // Limit to 10 requests
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([getUserLocation(), loadActiveRequests()]);
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
          <Text style={styles.greeting}>Hello there!</Text>
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={14} color={COLORS.gray400} />
            {userLocation ? ' Current Location' : ' Location not available'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleViewProfile}>
          <Ionicons name="person" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Main Report Button */}
      <TouchableOpacity style={styles.reportButton} onPress={handleCreateReport}>
        <View style={styles.reportButtonContent}>
          <Ionicons name="add-circle" size={28} color={COLORS.white} />
          <Text style={styles.reportButtonText}>Report an Issue</Text>
        </View>
        <Text style={styles.reportButtonSubtext}>
          Help improve your community
        </Text>
      </TouchableOpacity>

      {/* Quick Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Quick Report</Text>
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
          style={styles.categoriesList}
        />
      </View>

      {/* Active Requests Section */}
      {activeRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>
            Active Requests Near You
          </Text>
          <Text style={styles.sectionSubtitle}>
            {activeRequests.length} request(s) in your area
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={48} color={COLORS.gray300} />
      <Text style={styles.emptyStateTitle}>No Active Requests</Text>
      <Text style={styles.emptyStateText}>
        There are currently no requests in your area.{'\n'}
        Check back later or create your own report!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  location: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  reportButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  reportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reportButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: SPACING.md,
  },
  reportButtonSubtext: {
    fontSize: FONT_SIZES.base,
    color: COLORS.white + 'DD',
    marginLeft: 36,
  },
  categoriesSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  categoriesList: {
    marginLeft: -SPACING.lg,
    paddingLeft: SPACING.lg,
  },
  requestsSection: {
    marginBottom: SPACING.lg,
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
  },
});