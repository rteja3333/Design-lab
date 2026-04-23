import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import ReportCard from '../../components/ReportCard';
import RequestCard from '../../components/RequestCard';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS, CATEGORIES, ROUTES } from '../../constants/theme';
import { reportService, requestService } from '../../services/database';
import { locationService } from '../../services/location';

const INITIAL_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

export default function MapViewScreen({ navigation }) {

  const mapRef = useRef(null);
  const [region, setRegion] = useState(INITIAL_REGION);
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const locResult = await locationService.getCurrentLocation();
    if (locResult.success) {
      const loc = locResult.location;
      setUserLocation(loc);
      const userRegion = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      setRegion(userRegion);
      mapRef.current?.animateToRegion(userRegion, 500);
    }

    const [reportsResult, requestsResult] = await Promise.all([
      reportService.getReportsByLocation(locResult.success ? locResult.location : null),
      requestService.getActiveRequests(locResult.success ? locResult.location : null),
    ]);

    if (reportsResult.success) {
      setReports(reportsResult.data.filter(r => r.location));
    }
    if (requestsResult.success) {
      setRequests(requestsResult.data.filter(r => r.location));
    }

    setLoading(false);
  };

  const handleMyLocation = async () => {
    const locResult = await locationService.getCurrentLocation();
    if (locResult.success) {
      const loc = locResult.location;
      setUserLocation(loc);
      mapRef.current?.animateToRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 600);
    }
  };

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || { name: 'Other', color: COLORS.textLight, icon: 'help-outline' };
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved': return { label: 'Approved', color: COLORS.success, icon: 'checkmark-circle' };
      case 'rejected': return { label: 'Rejected', color: COLORS.error, icon: 'close-circle' };
      default: return { label: 'Pending', color: COLORS.warning, icon: 'time' };
    }
  };

  const handleMarkerPress = (item, type) => {
    if (type === 'request') {
      navigation.navigate(ROUTES.REQUEST_DETAILS, { request: item });
      return;
    }
    setSelectedItem({ ...item, _type: type });
  };

  const handleMapPress = () => {
    setSelectedItem(null);
  };

  const handleCardPress = () => {
    if (!selectedItem) return;
    if (selectedItem._type === 'report') {
      navigation.navigate(ROUTES.REPORT_DETAILS, { report: selectedItem });
    } else {
      navigation.navigate(ROUTES.REQUEST_DETAILS, { request: selectedItem });
    }
    setSelectedItem(null);
  };

  const filteredReports = searchQuery
    ? reports.filter(r =>
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reports;

  const filteredRequests = searchQuery
    ? requests.filter(r =>
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : requests;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={mapStyle}
        onPress={handleMapPress}
      >
        {/* Reports — blue, bigger */}
        {filteredReports.map((report) => {
          const isSelected = selectedItem?.id === report.id && selectedItem?._type === 'report';
          return (
            <Marker
              key={`report-${report.id}`}
              coordinate={{
                latitude: report.location.latitude,
                longitude: report.location.longitude,
              }}
              onPress={(e) => { e.stopPropagation(); handleMarkerPress(report, 'report'); }}
              zIndex={isSelected ? 20 : 1}
              anchor={{ x: 0.5, y: 1 }}
            >
              <Ionicons
                name="location-sharp"
                size={isSelected ? 28 : 28}
                color={isSelected ? '#e03e3e' : COLORS.primary}
              />
            </Marker>
          );
        })}

        {/* Requests — orange, smaller */}
        {filteredRequests.map((request) => {
          const isSelected = selectedItem?.id === request.id && selectedItem?._type === 'request';
          return (
            <Marker
              key={`request-${request.id}`}
              coordinate={{
                latitude: request.location.latitude,
                longitude: request.location.longitude,
              }}
              onPress={(e) => { e.stopPropagation(); handleMarkerPress(request, 'request'); }}
              zIndex={isSelected ? 20 : 5}
              anchor={{ x: 0.5, y: 1 }}
            >
              <Ionicons
                name="location-sharp"
                size={isSelected ? 36 : 36}
                color={isSelected ? '#e03e3e' : '#e67e22'}
              />
              <Callout tooltip={false} onPress={() => navigation.navigate(ROUTES.REQUEST_DETAILS, { request })}>
                <View style={styles.calloutContent}>
                  <Text style={styles.calloutTitle} numberOfLines={1}>
                    {request.title || 'Active Request'}
                  </Text>
                  <Text style={styles.calloutSubtitle} numberOfLines={2}>
                    {request.instructions || request.description || 'Tap to view admin request details'}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Search bar */}
      <SafeAreaView style={styles.searchBarContainer} edges={['top']}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for issue..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <Ionicons name="location-sharp" size={16} color={COLORS.primary} />
            <Text style={styles.legendText}>Reports</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="location-sharp" size={16} color="#e67e22" />
            <Text style={styles.legendText}>Active Requests</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* My location button */}
      <TouchableOpacity
        style={[styles.myLocationBtn, selectedItem && { bottom: SPACING.lg + 200 }]}
        onPress={handleMyLocation}
        activeOpacity={0.8}
      >
        <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Selected item — uses actual card components */}
      {selectedItem && (
        <View style={styles.bottomCardWrap}>
          <View style={selectedItem._type === 'request' ? styles.cardInnerRequest : styles.cardInnerReport}>
            {selectedItem._type === 'report' ? (
              <ReportCard
                report={selectedItem}
                onPress={handleCardPress}
                status={getStatusInfo(selectedItem.status)}
              />
            ) : (
              <RequestCard
                request={selectedItem}
                onPress={handleCardPress}
                showDistance={!!userLocation}
                userLocation={userLocation}
              />
            )}
          </View>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

// Minimalistic but colorful — soft green parks, blue water, warm roads
const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f7f6f3' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f7f6f3' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d6d3cc' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#b0aca5' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#eef2e8' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e4ead9' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#7a8a6e' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#d4e5c0' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b8f55' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8e6e1' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#8a8580' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f5f0e8' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e0d8cc' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#6b6560' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#a8a39b' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e4e0da' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#bdd7e9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6a9ebf' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Placeholder
  placeholderContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  placeholderTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  placeholderText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Search bar
  searchBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  legendRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    ...SHADOWS.sm,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },

  // My location
  myLocationBtn: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg + 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },

  // Bottom card
  bottomCardWrap: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  // RequestCard has marginHorizontal+marginBottom built-in; neutralize them
  cardInnerRequest: {
    marginHorizontal: -SPACING.lg,
    marginBottom: -SPACING.md,
  },
  // ReportCard has no built-in margins
  cardInnerReport: {
  },

  // Loading
  loadingOverlay: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  calloutContent: {
    minWidth: 180,
    maxWidth: 220,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  calloutTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});