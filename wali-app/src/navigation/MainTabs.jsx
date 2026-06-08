import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../constants/colors';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { KeuanganStack } from './KeuanganStack';
import { AkademikStack } from './AkademikStack';
import { KeamananStack } from './KeamananStack';
import { ProfilStack } from './ProfilStack';
import { AnakPilihScreen } from '../screens/anak/AnakPilihScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabsInner}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AnakPilih"
        component={AnakPilihScreen}
        options={{
          title: 'Pilih Anak',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
    </Stack.Navigator>
  );
}

function tabIcon(emoji) {
  return ({ color }) => <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

function MainTabsInner() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.white,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: tabIcon('🏠'),
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
          headerTitle: 'KlikSantri',
        }}
      />
      <Tab.Screen
        name="Keuangan"
        component={KeuanganStack}
        options={{
          title: 'Keuangan',
          tabBarIcon: tabIcon('💰'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Akademik"
        component={AkademikStack}
        options={{
          title: 'Akademik',
          tabBarIcon: tabIcon('📚'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Keamanan"
        component={KeamananStack}
        options={{
          title: 'Keamanan',
          tabBarIcon: tabIcon('🛡️'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilStack}
        options={{
          title: 'Profil',
          tabBarIcon: tabIcon('👤'),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

export { MainStack as MainTabs };
