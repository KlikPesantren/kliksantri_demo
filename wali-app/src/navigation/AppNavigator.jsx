import React, { useEffect, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useActiveChild } from '../context/ActiveChildContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { setupNotificationNavigation } from '../services/notificationNavigationService';
import { registerPushTokenBackground } from '../services/pushNotificationService';

export const navigationRef = createNavigationContainerRef();

export function AppNavigator() {
  const { isLoading, isAuthenticated, anak, restoreSession } = useAuth();
  const { restoreActiveChild, setActiveSantri } = useActiveChild();
  const anakRef = useRef(anak);
  const pushRegisterOnReadyRef = useRef(false);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    anakRef.current = anak;
  }, [anak]);

  useEffect(() => {
    if (isAuthenticated && anak.length > 0) {
      restoreActiveChild(anak);
    }
  }, [isAuthenticated, anak, restoreActiveChild]);

  useEffect(() => {
    if (!isAuthenticated || isLoading || pushRegisterOnReadyRef.current) {
      return undefined;
    }

    pushRegisterOnReadyRef.current = true;
    const timer = setTimeout(() => {
      registerPushTokenBackground({ source: 'appNavigatorAuthenticated' });
    }, 800);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

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
