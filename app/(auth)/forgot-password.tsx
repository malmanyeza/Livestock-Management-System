import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Text } from '@/components/typography/Text';
import { TextField } from '@/components/inputs/TextField';
import { Button } from '@/components/ui/Button';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Header } from '@/components/layout/Header';
import Colors from '@/constants/Colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    // Simulate password reset request
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email for instructions to reset your password.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/login') }]
      );
    }, 1500);
  };

  return (
    <ScreenContainer backgroundColor={Colors.white}>
      <Header title="Forgot Password" showBackButton onBackPress={() => router.back()} />

      <View style={styles.formContainer}>
        <Text variant="h4" weight="bold" style={styles.title}>
          Reset Your Password
        </Text>
        <Text variant="body" color="neutral.600" style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your password
        </Text>

        <TextField
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          startIcon={<Mail size={20} color={Colors.neutral[500]} />}
          containerStyle={styles.inputContainer}
        />

        <Button
          variant="primary"
          fullWidth
          loading={loading}
          style={styles.resetButton}
          onPress={handleResetPassword}
        >
          Send Reset Link
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  resetButton: {
    marginBottom: 24,
  },
});