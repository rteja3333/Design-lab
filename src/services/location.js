import * as Location from 'expo-location';
import { GeoPoint } from 'firebase/firestore';

export const locationService = {
  // Request location permissions
  async requestLocationPermission() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return { 
          success: false, 
          error: 'Permission to access location was denied' 
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current location
  async getCurrentLocation() {
    try {
      // Check permissions first
      const permissionResult = await this.requestLocationPermission();
      if (!permissionResult.success) {
        return permissionResult;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 10000, // 10 seconds
      });

      const { latitude, longitude } = location.coords;
      
      return {
        success: true,
        location: {
          latitude,
          longitude,
          geoPoint: new GeoPoint(latitude, longitude)
        }
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return { success: false, error: error.message };
    }
  },

  // Get address from coordinates (reverse geocoding)
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ');

        return {
          success: true,
          address: formattedAddress,
          details: address
        };
      }

      return {
        success: false,
        error: 'No address found for these coordinates'
      };
    } catch (error) {
      console.error('Error getting address:', error);
      return { success: false, error: error.message };
    }
  },

  // Get coordinates from address (geocoding)
  async getCoordinatesFromAddress(address) {
    try {
      const locations = await Location.geocodeAsync(address);

      if (locations.length > 0) {
        const { latitude, longitude } = locations[0];
        
        return {
          success: true,
          location: {
            latitude,
            longitude,
            geoPoint: new GeoPoint(latitude, longitude)
          }
        };
      }

      return {
        success: false,
        error: 'No coordinates found for this address'
      };
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return { success: false, error: error.message };
    }
  },

  // Calculate distance between two points (in meters)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  },

  // Check if point is within radius of another point
  isWithinRadius(targetLat, targetLon, pointLat, pointLon, radius) {
    const distance = this.calculateDistance(targetLat, targetLon, pointLat, pointLon);
    return distance <= radius;
  },

  // Format distance for display
  formatDistance(distanceInMeters) {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  },

  // Watch location changes
  async watchLocation(callback, options = {}) {
    try {
      const permissionResult = await this.requestLocationPermission();
      if (!permissionResult.success) {
        return permissionResult;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: options.timeInterval || 10000, // 10 seconds
          distanceInterval: options.distanceInterval || 10, // 10 meters
        },
        callback
      );

      return { success: true, subscription };
    } catch (error) {
      console.error('Error watching location:', error);
      return { success: false, error: error.message };
    }
  }
};