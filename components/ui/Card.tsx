import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Text } from '@/components/typography/Text';
import { Colors } from '../../theme/colors';
import { Shadow, Radius, Spacing } from '../../theme/spacing';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  footer?: React.ReactNode;
}

export function Card({ title, subtitle, children, style, onPress, footer }: CardProps) {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text variant="h6" weight="medium" color="neutral.800">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text variant="body2" color="neutral.600" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      <View style={styles.content}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.md,
  },
  header: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  subtitle: {
    marginTop: 4,
  },
  content: {
    padding: Spacing.md,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
});