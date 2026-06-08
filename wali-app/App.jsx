import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ActiveChildProvider } from './src/context/ActiveChildContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ActiveChildProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </ActiveChildProvider>
    </AuthProvider>
  );
}
