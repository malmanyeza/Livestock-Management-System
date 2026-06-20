import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSegments } from 'expo-router';
import Colors from '@/constants/Colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
}

export function ScreenContainer({
  children,
  scrollable = true,
  padded = false,
  backgroundColor = Colors.neutral[50],
  style,
  contentContainerStyle,
  edges,
}: ScreenContainerProps) {
  const segments = useSegments();
  const defaultEdges: Array<'top' | 'right' | 'bottom' | 'left'> = segments[0] === 'screens'
    ? ['bottom', 'left', 'right']
    : ['top', 'bottom', 'left', 'right'];

  const finalEdges = edges || defaultEdges;

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
    <SafeAreaView style={containerStyle} edges={finalEdges}>
      <StatusBar style='dark' />
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, contentStyle]}>{children}</View>
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