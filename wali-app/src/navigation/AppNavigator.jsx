import React, { useEffect, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useActiveChild } from '../context/ActiveChildContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { setupNotificationNavigation } from '../services/notificationNavigationService';

export const navigationRef = createNavigationContainerRef();

export function AppNavigator() {
  const { isLoading, isAuthenticated, anak, restoreSession } = useAuth();
  const { restoreActiveChild, setActiveSantri } = useActiveChild();
  const anakRef = useRef(anak);

  useEffect(() => {
    anakRef.current = anak;
  }, [anak]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isAuthenticated && anak.length > 0) {
      restoreActiveChild(anak);
    }
  }, [isAuthenticated, anak, restoreActiveChild]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let cleanup = () => {};

    setupNotificationNavigation(navigationRef, {
      getAnak: () => anakRef.current,
      setActiveSantri,
    }).then((remove) => {
      if (typeof remove === 'function') cleanup = remove;
    });

    return () => cleanup();
  }, [isAuthenticated, setActiveSantri]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
