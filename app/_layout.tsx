import React, { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { Platform, StatusBar as RNStatusBar, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { FarmDataProvider, useFarmData } from '@/context/FarmDataContext';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loadingAuth } = useFarmData();
  const segments = useSegments();

  useEffect(() => {
    if (loadingAuth) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Not logged in and trying to access protected screens → redirect to login
      const timer = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
      return () => clearTimeout(timer);
    } else if (user && inAuthGroup) {
      // Already logged in but on auth screens → redirect to app
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, loadingAuth, segments]);

  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const androidStatusBarHeight = RNStatusBar.currentHeight || 0;

  // Set Android status bar color
  if (Platform.OS === 'android') {
    RNStatusBar.setBackgroundColor('transparent');
    RNStatusBar.setTranslucent(true);
    RNStatusBar.setBarStyle('dark-content');
  }

  return (
    <FarmDataProvider>
      <AuthGuard>
        <Stack
          screenOptions={{
            headerTitleStyle: {
              fontFamily: 'System',
              fontSize: 18,
              fontWeight: '600',
            },
            headerShadowVisible: false,
            headerTintColor: Colors.neutral[900],
            headerBackTitle: 'Back',
            headerStyle: Platform.select({
              android: {
                height: 80 + androidStatusBarHeight,
                backgroundColor: Colors.white,
              },
              default: {
                height: 64,
                backgroundColor: Colors.white,
              },
            }),
            contentStyle: Platform.select({
              android: {
                paddingTop: androidStatusBarHeight,
                backgroundColor: Colors.neutral[50],
              },
              default: {
                backgroundColor: Colors.neutral[50],
              },
            }),
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthGuard>
      <StatusBar style="dark" />
    </FarmDataProvider>
  );
}