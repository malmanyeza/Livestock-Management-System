import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TouchableOpacityProps } from 'react-native';
import { Text } from '@/components/typography/Text';
import Colors from '@/constants/Colors';
import { ActivityIndicator } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  startIcon,
  endIcon,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.button, styles.primary, disabled && styles.disabled];
      case 'secondary':
        return [styles.button, styles.secondary, disabled && styles.disabled];
      case 'outline':
        return [styles.button, styles.outline, disabled && styles.disabledOutline];
      case 'ghost':
        return [styles.button, styles.ghost, disabled && styles.disabledGhost];
      case 'danger':
        return [styles.button, styles.danger, disabled && styles.disabled];
      default:
        return [styles.button, styles.primary, disabled && styles.disabled];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return 'white';
      case 'outline':
        return 'primary.500';
      case 'ghost':
        return 'primary.500';
      default:
        return 'white';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.small;
      case 'md':
        return styles.medium;
      case 'lg':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), getSizeStyle(), fullWidth && styles.fullWidth, style]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary[500] : Colors.white}
        />
      ) : (
        <>
          {startIcon}
          <Text
            variant="button"
            color={getTextColor()}
            style={[startIcon && styles.textWithStartIcon, endIcon && styles.textWithEndIcon]}
          >
            {children}
          </Text>
          {endIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Colors.primary[500],
  },
  secondary: {
    backgroundColor: Colors.secondary[500],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary[500],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error[500],
  },
  disabled: {
    backgroundColor: Colors.neutral[300],
  },
  disabledOutline: {
    borderColor: Colors.neutral[300],
  },
  disabledGhost: {
    opacity: 0.5,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  fullWidth: {
    width: '100%',
  },
  textWithStartIcon: {
    marginLeft: 8,
  },
  textWithEndIcon: {
    marginRight: 8,
  },
});