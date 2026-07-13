import React, { useEffect, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useActiveChild } from '../context/ActiveChildContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { setupNotificationNavigation } from '../services/notificationNavigationService';
import { ErrorView } from '../components/common/ErrorView';
import { GantiPinScreen } from '../screens/profil/GantiPinScreen';

const RequiredPinStack = createNativeStackNavigator();

function RequiredPinChange() {
  return (
    <RequiredPinStack.Navigator screenOptions={{ gestureEnabled: false }}>
      <RequiredPinStack.Screen
        name="RequiredPinChange"
        component={GantiPinScreen}
        options={{ title: 'Ganti PIN Wajib', headerBackVisible: false }}
      />
    </RequiredPinStack.Navigator>
  );
}

export const navigationRef = createNavigationContainerRef();

export function AppNavigator() {
  const { isLoading, isAuthenticated, mustChangePin, anak, restoreError, restoreSession } = useAuth();
  const { restoreActiveChild, setActiveSantri, clearActiveSantri } = useActiveChild();
  const anakRef = useRef(anak);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    anakRef.current = anak;
  }, [anak]);

  useEffect(() => {
    if (isAuthenticated && anak.length > 0) {
      restoreActiveChild(anak);
    } else if (!isAuthenticated) {
      clearActiveSantri();
    }
  }, [isAuthenticated, anak, restoreActiveChild, clearActiveSantri]);

  useEffect(() => {
    if (!isAuthenticated || mustChangePin) return undefined;

    let cleanup = () => {};
    let isMounted = true;
    setupNotificationNavigation(navigationRef, {
      getAnak: () => anakRef.current,
      setActiveSantri,
    }).then((removeListener) => {
      if (!isMounted) {
        removeListener();
        return;
      }
      cleanup = removeListener;
    });

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [isAuthenticated, mustChangePin, setActiveSantri]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (restoreError) {
    return <ErrorView message={restoreError} onRetry={restoreSession} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? (mustChangePin ? <RequiredPinChange /> : <MainTabs />) : <AuthStack />}
    </NavigationContainer>
  );
}
