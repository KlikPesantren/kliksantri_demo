import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ActiveChildProvider } from './src/context/ActiveChildContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/constants/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ActiveChildProvider>
          <StatusBar style="light" backgroundColor={colors.primary} translucent={false} />
          <AppNavigator />
        </ActiveChildProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
