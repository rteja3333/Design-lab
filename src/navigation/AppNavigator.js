import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CardStyleInterpolators } from '@react-navigation/stack';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ProfileEditScreen from '../screens/main/ProfileEditScreen';
import ReportCreateScreen from '../screens/main/ReportCreateScreen';
import ReportDetailsScreen from '../screens/main/ReportDetailsScreen';
import RequestDetailsScreen from '../screens/main/RequestDetailsScreen';
import CameraScreen from '../screens/main/CameraScreen';
import MapViewScreen from '../screens/main/MapViewScreen';
import AdminCreateRequestScreen from '../screens/main/AdminCreateRequestScreen';
import AdminRequestsScreen from '../screens/main/AdminRequestsScreen';

// Constants
import { ROUTES, COLORS, FONT_SIZES, RADIUS } from '../constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Eco-minimalism header theme — clean white bar, subtle bottom line
const ecoHeaderOptions = {
  headerStyle: {
    backgroundColor: COLORS.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

// Home Stack Navigator
function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={ecoHeaderOptions}>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.REPORT_CREATE} 
        component={ReportCreateScreen}
        options={{ title: 'New Report' }}
      />
      <Stack.Screen 
        name={ROUTES.REPORT_DETAILS} 
        component={ReportDetailsScreen}
        options={{ title: 'Report' }}
      />
      <Stack.Screen 
        name={ROUTES.REQUEST_DETAILS} 
        component={RequestDetailsScreen}
        options={{ title: 'Request' }}
      />
      <Stack.Screen 
        name={ROUTES.CAMERA} 
        component={CameraScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.MAP_VIEW} 
        component={MapViewScreen}
        options={{ title: 'Map' }}
      />
      <Stack.Screen
        name={ROUTES.CREATE_REQUEST}
        component={AdminCreateRequestScreen}
        options={{ title: 'New Request' }}
      />
      <Stack.Screen
        name={ROUTES.ADMIN_REQUESTS}
        component={AdminRequestsScreen}
        options={{ title: 'My Requests' }}
      />
    </Stack.Navigator>
  );
}

// Map Stack Navigator
function MapStackNavigator() {
  return (
    <Stack.Navigator screenOptions={ecoHeaderOptions}>
      <Stack.Screen 
        name="MapMain" 
        component={MapViewScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.REPORT_DETAILS} 
        component={ReportDetailsScreen}
        options={{ title: 'Report' }}
      />
      <Stack.Screen 
        name={ROUTES.REQUEST_DETAILS} 
        component={RequestDetailsScreen}
        options={{ title: 'Request' }}
      />
    </Stack.Navigator>
  );
}

// Profile Stack Navigator  
function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={ecoHeaderOptions}>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.REPORT_DETAILS} 
        component={ReportDetailsScreen}
        options={{ title: 'Report' }}
      />
      <Stack.Screen
        name={ROUTES.PROFILE_EDIT}
        component={ProfileEditScreen}
        options={{ title: 'Edit Profile' }}
      />
    </Stack.Navigator>
  );
}

// Minimal eco tab bar
const ecoTabBarStyle = {
  backgroundColor: COLORS.background,
  borderTopWidth: 0.5,
  borderTopColor: COLORS.border,
  paddingBottom: 6,
  paddingTop: 4,
  height: 64,
  elevation: 0,
};

// Main Tab Navigator
export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MapTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: ecoTabBarStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeMain';
          return {
            tabBarLabel: 'Home',
            tabBarStyle: routeName === ROUTES.CAMERA
              ? { display: 'none' }
              : ecoTabBarStyle,
          };
        }}
      />
      <Tab.Screen 
        name="MapTab" 
        component={MapStackNavigator}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}