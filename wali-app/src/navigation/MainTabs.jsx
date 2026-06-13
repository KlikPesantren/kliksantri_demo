import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { stackHeaderOptions, tabBarOptions } from '../constants/theme';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { PengumumanStack } from './PengumumanStack';
import { MonitoringStack } from './MonitoringStack';
import { KeuanganStack } from './KeuanganStack';
import { ProfilStack } from './ProfilStack';
import { AnakPilihScreen } from '../screens/anak/AnakPilihScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Beranda: { active: 'home', inactive: 'home-outline' },
  Pengumuman: { active: 'megaphone', inactive: 'megaphone-outline' },
  Monitoring: { active: 'pulse', inactive: 'pulse-outline' },
  Keuangan: { active: 'wallet', inactive: 'wallet-outline' },
  Profil: { active: 'person', inactive: 'person-outline' },
};

function tabIcon(name) {
  const icons = TAB_ICONS[name];
  return ({ color, focused, size }) => (
    <Ionicons
      name={focused ? icons.active : icons.inactive}
      size={size ?? 22}
      color={color}
    />
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={stackHeaderOptions}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabsInner}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AnakPilih"
        component={AnakPilihScreen}
        options={{ title: 'Pilih Anak' }}
      />
    </Stack.Navigator>
  );
}

function MainTabsInner() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen
        name="Beranda"
        component={DashboardScreen}
        options={{
          title: 'Beranda',
          tabBarIcon: tabIcon('Beranda'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Pengumuman"
        component={PengumumanStack}
        options={{
          title: 'Pengumuman',
          tabBarIcon: tabIcon('Pengumuman'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Monitoring"
        component={MonitoringStack}
        options={{
          title: 'Monitoring',
          tabBarIcon: tabIcon('Monitoring'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Keuangan"
        component={KeuanganStack}
        options={{
          title: 'Keuangan',
          tabBarIcon: tabIcon('Keuangan'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilStack}
        options={{
          title: 'Profil',
          tabBarIcon: tabIcon('Profil'),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

export { MainStack as MainTabs };
