import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '@/components/typography/Text';
import Colors from '@/constants/Colors';

interface ProgressIndicatorProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
}

export function ProgressIndicator({
  label,
  value,
  max,
  unit = '%',
  size = 'md',
  color = Colors.primary[500],
  style,
}: ProgressIndicatorProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Determine colors based on percentage
  const getColor = () => {
    if (percentage < 40) return Colors.error[500];
    if (percentage < 70) return Colors.warning[500];
    return color;
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return { height: 6, text: 'body2' as const };
      case 'lg':
        return { height: 12, text: 'body' as const };
      default:
        return { height: 8, text: 'body2' as const };
    }
  };

  const sizeProps = getSize();
  const barColor = getColor();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text variant={sizeProps.text} weight="medium">
          {label}
        </Text>
        <Text variant={sizeProps.text}>
          {value}
          {unit}
        </Text>
      </View>
      <View style={[styles.track, { height: sizeProps.height }]}>
        <View
          style={[
            styles.progress,
            {
              width: `${percentage}%`,
              height: sizeProps.height,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  track: {
    width: '100%',
    backgroundColor: Colors.neutral[200],
    borderRadius: 100,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 100,
  },
});