import React from 'react';
import { Stack } from 'expo-router';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';

export default function RootLayout() {
  const androidStatusBarHeight = RNStatusBar.currentHeight || 0;

  // Set Android status bar color
  if (Platform.OS === 'android') {
    RNStatusBar.setBackgroundColor('transparent');
    RNStatusBar.setTranslucent(true);
    RNStatusBar.setBarStyle('dark-content');
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerTitleStyle: {
            fontFamily: 'System',
            fontSize: 18,
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerTintColor: Colors.neutral[900],
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
        <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}