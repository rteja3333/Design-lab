import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ReportCreateScreen from '../screens/main/ReportCreateScreen';
import ReportDetailsScreen from '../screens/main/ReportDetailsScreen';
import RequestDetailsScreen from '../screens/main/RequestDetailsScreen';
import CameraScreen from '../screens/main/CameraScreen';
import MapViewScreen from '../screens/main/MapViewScreen';
import AdminCreateRequestScreen from '../screens/main/AdminCreateRequestScreen';

// Constants
import { ROUTES, COLORS, FONT_SIZES } from '../constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack Navigator
function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.REPORT_CREATE} 
        component={ReportCreateScreen}
        options={{
          title: 'Create Report',
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontSize: FONT_SIZES.lg,
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name={ROUTES.REPORT_DETAILS} 
        component={ReportDetailsScreen}
        options={{
          title: 'Report Details',
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
        }}
      />
      <Stack.Screen 
        name={ROUTES.REQUEST_DETAILS} 
        component={RequestDetailsScreen}
        options={{
          title: 'Request Details',
          headerStyle: {
            backgroundColor: COLORS.secondary,
          },
          headerTintColor: COLORS.white,
        }}
      />
      <Stack.Screen 
        name={ROUTES.CAMERA} 
        component={CameraScreen}
        options={{
          title: 'Camera',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name={ROUTES.MAP_VIEW} 
        component={MapViewScreen}
        options={{
          title: 'Map View',
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
        }}
      />
      <Stack.Screen
        name={ROUTES.CREATE_REQUEST}
        component={AdminCreateRequestScreen}
        options={{
          title: 'Admin Request',
          headerStyle: {
            backgroundColor: COLORS.secondary,
          },
          headerTintColor: COLORS.white,
        }}
      />
    </Stack.Navigator>
  );
}

// Profile Stack Navigator  
function ProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.REPORT_DETAILS} 
        component={ReportDetailsScreen}
        options={{
          title: 'Report Details',
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
        }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.sm,
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
              : {
                  backgroundColor: COLORS.white,
                  borderTopWidth: 1,
                  borderTopColor: COLORS.border,
                  paddingBottom: 5,
                  height: 60,
                },
          };
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