import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Text } from '@/components/typography/Text';
import Colors from '@/constants/Colors';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function TextField({
  label,
  error,
  value,
  startIcon,
  endIcon,
  containerStyle,
  isPassword = false,
  secureTextEntry,
  ...props
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const actualSecureTextEntry = isPassword ? !passwordVisible : secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="body2\" color="neutral.700\" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.error,
        ]}
      >
        {startIcon && <View style={styles.iconContainer}>{startIcon}</View>}
        <TextInput
          style={[
            styles.input,
            startIcon && styles.inputWithStartIcon,
            (endIcon || isPassword) && styles.inputWithEndIcon,
          ]}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={actualSecureTextEntry}
          placeholderTextColor={Colors.neutral[400]}
          {...props}
        />
        {isPassword ? (
          <View style={styles.iconContainer}>
            <View style={styles.passwordToggle}>
              {passwordVisible ? (
                <Eye
                  size={20}
                  color={Colors.neutral[500]}
                  onPress={togglePasswordVisibility}
                />
              ) : (
                <EyeOff
                  size={20}
                  color={Colors.neutral[500]}
                  onPress={togglePasswordVisibility}
                />
              )}
            </View>
          </View>
        ) : (
          endIcon && <View style={styles.iconContainer}>{endIcon}</View>
        )}
      </View>
      {error && (
        <Text variant="caption" color="error.500" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  focused: {
    borderColor: Colors.primary[500],
  },
  error: {
    borderColor: Colors.error[500],
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.neutral[800],
  },
  inputWithStartIcon: {
    paddingLeft: 8,
  },
  inputWithEndIcon: {
    paddingRight: 8,
  },
  iconContainer: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordToggle: {
    padding: 4,
  },
  errorText: {
    marginTop: 4,
  },
});