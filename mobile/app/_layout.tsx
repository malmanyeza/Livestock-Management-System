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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loadingAuth } = useFarmData();
  const segments = useSegments();

  useEffect(() => {
    if (!loadingAuth) {
      SplashScreen.hideAsync().catch(() => {
        /* Catch and ignore hide errors */
      });
    }
  }, [loadingAuth]);

  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';

  if (!user && !inAuthGroup) {
    // Not logged in and trying to access protected screens → redirect to login
    return <Redirect href="/(auth)/login" />;
  }

  if (user && inAuthGroup) {
    // Already logged in but on auth screens → redirect to app
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
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
        <AuthGuard>
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
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
          </Stack>
        </AuthGuard>
        <StatusBar style="dark" />
      </FarmDataProvider>
    </SafeAreaProvider>
  );
}