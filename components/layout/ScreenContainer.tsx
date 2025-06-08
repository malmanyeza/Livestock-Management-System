import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function ScreenContainer({
  children,
  scrollable = true,
  padded = true,
  backgroundColor = Colors.neutral[50],
  style,
  contentContainerStyle,
}: ScreenContainerProps) {
  const containerStyle = [
    styles.container,
    { backgroundColor },
    style,
  ];

  const contentStyle = [
    padded && styles.padded,
    contentContainerStyle,
  ];

  return (
    <SafeAreaView style={containerStyle}>
      <StatusBar style="auto" />
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  padded: {
    padding: 16,
  },
});