import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useActiveChild } from '../context/ActiveChildContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { SplashScreen } from '../screens/auth/SplashScreen';

export function AppNavigator() {
  const { isLoading, isAuthenticated, anak, restoreSession } = useAuth();
  const { restoreActiveChild } = useActiveChild();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isAuthenticated && anak.length > 0) {
      restoreActiveChild(anak);
    }
  }, [isAuthenticated, anak, restoreActiveChild]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
