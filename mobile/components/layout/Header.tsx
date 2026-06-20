import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, Menu } from 'lucide-react-native';
import { Text } from '@/components/typography/Text';
import Colors from '@/constants/Colors';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  rightContent?: React.ReactNode;
}

export function Header({
  title,
  showBackButton = false,
  showMenuButton = false,
  onBackPress,
  onMenuPress,
  rightContent,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity style={styles.iconButton} onPress={onBackPress}>
            <ChevronLeft size={24} color={Colors.neutral[800]} />
          </TouchableOpacity>
        )}
        {showMenuButton && (
          <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
            <Menu size={24} color={Colors.neutral[800]} />
          </TouchableOpacity>
        )}
      </View>
      <Text variant="h5" weight="medium" style={styles.title}>
        {title}
      </Text>
      <View style={styles.rightContainer}>{rightContent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  leftContainer: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'flex-start',
  },
  iconButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  rightContainer: {
    width: 80,
    alignItems: 'flex-end',
  },
});