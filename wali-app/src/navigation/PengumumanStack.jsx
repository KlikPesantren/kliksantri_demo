import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { stackHeaderOptions } from '../constants/theme';
import { PengumumanScreen } from '../screens/pengumuman/PengumumanScreen';

const Stack = createNativeStackNavigator();

export function PengumumanStack() {
  return (
    <Stack.Navigator screenOptions={stackHeaderOptions}>
      <Stack.Screen
        name="PengumumanHome"
        component={PengumumanScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
