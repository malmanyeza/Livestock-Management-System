import React, { useEffect } from 'react';
import { Stack, router, useSegments, Redirect } from 'expo-router';
import { Platform, StatusBar as RNStatusBar, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import Colors from '@/constants/Colors';
import { FarmDataProvider, useFarmData } from '@/context/FarmDataContext';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Text } from '@/components/typography/Text';

// Inject CSS to fix browser autofill yellow background on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 30px white inset !important;
      -webkit-text-fill-color: #1a1a1a !important;
      transition: background-color 5000s ease-in-out 0s;
    }
  `;
  document.head.appendChild(style);
}

// Prevent the splash screen from auto-hiding before asset/auth loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Catch and ignore reload errors in development mode */
});

function RootNavigation() {
  const { user, loadingAuth } = useFarmData();
  const segments = useSegments();

  // Failsafe timeout to prevent splash screen from ever staying frozen indefinitely
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Hide splash screen as soon as auth initialization resolves
  useEffect(() => {
    if (!loadingAuth) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loadingAuth]);

  // Handle protected route navigation without unmounting the Stack navigator
  useEffect(() => {
    if (loadingAuth) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loadingAuth, segments]);

  return (
    <Stack
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
        headerTitleStyle: {
          fontFamily: 'System',
          fontSize: 18,
          fontWeight: '600',
        },
        headerShadowVisible: false,
        headerTintColor: Colors.neutral[900],
        headerBackTitle: 'Back',
        headerStyle: {
          backgroundColor: Colors.white,
        },
        contentStyle: {
          backgroundColor: Colors.neutral[50],
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

// Custom Header component to resolve status bar overlapping
const CustomHeader = ({ navigation, route, options, back }: any) => {
  const insets = useSafeAreaInsets();
  const title = options.title || route.name;

  return (
    <View style={{
      backgroundColor: Colors.white,
      paddingTop: insets.top,
      borderBottomWidth: 1,
      borderBottomColor: Colors.neutral[200],
    }}>
      <View style={{
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
      }}>
        {back ? (
          options.headerLeft ? (
            options.headerLeft()
          ) : (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, paddingVertical: 8 }}
            >
              <ChevronLeft size={24} color={Colors.neutral[800]} />
              <Text variant="body" weight="medium" color="neutral.800" style={{ marginLeft: 2 }}>Back</Text>
            </TouchableOpacity>
          )
        ) : null}
        <Text variant="h5" weight="bold" color="neutral.900" style={{ marginLeft: back && !options.headerLeft ? 8 : 0 }}>
          {title}
        </Text>
        {options.headerRight ? (
          <View style={{ marginLeft: 'auto' }}>
            {options.headerRight()}
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default function RootLayout() {
  const androidStatusBarHeight = RNStatusBar.currentHeight || 0;

  // Set Android status bar color
  if (Platform.OS === 'android') {
    RNStatusBar.setBackgroundColor('transparent');
    RNStatusBar.setTranslucent(true);
    RNStatusBar.setBarStyle('dark-content');
  }

  return (
    <SafeAreaProvider>
      <FarmDataProvider>
        <RootNavigation />
        <StatusBar style="dark" />
      </FarmDataProvider>
    </SafeAreaProvider>
  );
}