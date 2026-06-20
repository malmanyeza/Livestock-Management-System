import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/utils/supabase';
import Colors from '@/constants/Colors';
import { Mail, Lock, User, Eye, EyeOff, Home } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Animated floating blob ---
function FloatingBlob({ style, delay = 0 }: { style: any; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 4500, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 4500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  return <Animated.View style={[style, { transform: [{ translateY }] }]} />;
}

function GlassInput({
  icon: IconComponent,
  placeholder,
  value,
  onChangeText,
  isPassword = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: {
  icon: React.ComponentType<any>;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  isPassword?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.neutral[200], Colors.primary[400]],
  });

  return (
    <Animated.View style={[styles.inputWrapper, { borderColor }]}>
      <View style={styles.inputIconBox}>
        <View style={styles.inputIconInner}>
          <IconComponent
            size={18}
            color={focused ? Colors.primary[600] : Colors.neutral[400]}
          />
        </View>
      </View>
      <TextInput
        style={styles.glassInput}
        placeholder={placeholder}
        placeholderTextColor={Colors.neutral[400]}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        secureTextEntry={isPassword && !showPass}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
      />
      {isPassword && (
        <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeButton}>
          {showPass ? (
            <Eye
              size={18}
              color={focused ? Colors.primary[600] : Colors.neutral[400]}
            />
          ) : (
            <EyeOff
              size={18}
              color={focused ? Colors.primary[600] : Colors.neutral[400]}
            />
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}



export default function SignupScreen() {
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, delay: 150, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignup = async () => {
    if (!name.trim() || !farmName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    try {
      if (!supabase) {
        Alert.alert('Configuration Error', 'Supabase is not configured properly.');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { 
          data: { 
            full_name: name.trim(),
            farm_name: farmName.trim()
          } 
        },
      });
      if (error) {
        Alert.alert('Signup Failed', error.message);
      } else {
        Alert.alert('Account Created 🎉', 'Your account has been created. You can now sign in.', [
          { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Background */}
      <LinearGradient colors={[Colors.primary[50], Colors.white, Colors.primary[100]]} style={StyleSheet.absoluteFill} />

      {/* Decorative blobs */}
      <FloatingBlob style={[styles.blob, styles.blob1]} delay={0} />
      <FloatingBlob style={[styles.blob, styles.blob2]} delay={2000} />
      <FloatingBlob style={[styles.blob, styles.blob3]} delay={1000} />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <LinearGradient
          colors={['rgba(0,0,0,0.03)', 'rgba(0,0,0,0.01)']}
          style={styles.backButtonGradient}
        >
          <Animated.Text style={styles.backButtonText}>←</Animated.Text>
        </LinearGradient>
      </TouchableOpacity>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            <View style={styles.headerAccentDot} />
            <View style={styles.headerTextContainer}>
              <Animated.Text style={styles.headerEyebrow}>JOIN ZVIPFUWO</Animated.Text>
              <Animated.Text style={styles.headerTitle}>Create your{'\n'}farm account</Animated.Text>
              <Animated.Text style={styles.headerSub}>
                Start managing your livestock smarter
              </Animated.Text>
            </View>

          </Animated.View>

          {/* Glass form card */}
          <Animated.View
            style={[styles.glassCard, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
          >
            <Animated.Text style={styles.sectionLabel}>YOUR DETAILS</Animated.Text>

            <View style={styles.inputsGroup}>
              <GlassInput
                icon={User}
                placeholder="Full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <GlassInput
                icon={Home}
                placeholder="Farm name"
                value={farmName}
                onChangeText={setFarmName}
                autoCapitalize="words"
              />
              <GlassInput
                icon={Mail}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <GlassInput
                icon={Lock}
                placeholder="Password (min. 6 characters)"
                value={password}
                onChangeText={setPassword}
                isPassword
              />

              <GlassInput
                icon={Lock}
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
              />

              {/* Password match indicator */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchRow}>
                  <Animated.Text
                    style={[
                      styles.matchText,
                      { color: password === confirmPassword ? Colors.primary[600] : Colors.error[500] },
                    ]}
                  >
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </Animated.Text>
                </View>
              )}
            </View>

            {/* Terms note */}
            <View style={styles.termsRow}>
              <View style={styles.termsDot} />
              <Animated.Text style={styles.termsText}>
                By creating an account you agree to our{' '}
                <Animated.Text
                  style={styles.linkText}
                  onPress={() => WebBrowser.openBrowserAsync('https://malmanyeza.github.io/Livestock-Management-System/privacy.html')}
                >
                  Terms of Service
                </Animated.Text>{' '}
                and{' '}
                <Animated.Text
                  style={styles.linkText}
                  onPress={() => WebBrowser.openBrowserAsync('https://malmanyeza.github.io/Livestock-Management-System/privacy.html')}
                >
                  Privacy Policy
                </Animated.Text>
              </Animated.Text>
            </View>

            {/* Create button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.7 }]}
              onPress={handleSignup}
              activeOpacity={0.85}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.primary[400], Colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Animated.Text style={styles.primaryButtonText}>
                  {loading ? 'Creating account...' : 'Create Account  🌱'}
                </Animated.Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Animated.Text style={styles.dividerText}>already a member?</Animated.Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign in link */}
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Animated.Text style={styles.outlineButtonText}>Sign In to existing account</Animated.Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.Text style={[styles.footer, { opacity: fadeIn }]}>
            🌿 Secure • Private • Your data stays yours
          </Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: {
    width: 280,
    height: 280,
    top: -80,
    left: -60,
    backgroundColor: Colors.primary[200],
    opacity: 0.45,
  },
  blob2: {
    width: 160,
    height: 160,
    bottom: 180,
    right: -40,
    backgroundColor: Colors.accent[200],
    opacity: 0.35,
  },
  blob3: {
    width: 120,
    height: 120,
    top: SCREEN_HEIGHT * 0.45,
    left: -20,
    backgroundColor: Colors.primary[100],
    opacity: 0.5,
  },

  // BACK BUTTON
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 20,
    zIndex: 10,
  },
  backButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  backButtonText: {
    fontSize: 18,
    color: Colors.neutral[800],
    fontWeight: '600',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'ios' ? 110 : 90,
    minHeight: SCREEN_HEIGHT,
  },

  // HEADER
  header: {
    marginBottom: 28,
  },
  headerAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[400],
    marginBottom: 16,
    shadowColor: Colors.primary[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTextContainer: {
    marginBottom: 20,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary[600],
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.neutral[900],
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 14,
    color: Colors.neutral[500],
    fontWeight: '400',
  },

  // STEPS
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[400],
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.neutral[500],
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.neutral[200],
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: Colors.primary[500],
    opacity: 0.4,
  },

  // GLASS CARD
  glassCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    padding: 22,
    marginBottom: 20,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral[400],
    letterSpacing: 2,
    marginBottom: 16,
  },

  // INPUTS
  inputsGroup: {
    gap: 10,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    height: 54,
    overflow: 'hidden',
  },
  inputIconBox: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.neutral[200],
  },
  inputIconInner: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(122,193,66,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.neutral[900],
    fontWeight: '500',
  },
  eyeButton: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },



  // MATCH
  matchRow: {
    paddingHorizontal: 4,
    marginTop: -4,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // TERMS
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  termsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary[400],
    marginTop: 5,
    flexShrink: 0,
  },
  termsText: {
    fontSize: 12,
    color: Colors.neutral[500],
    lineHeight: 18,
    flex: 1,
  },
  linkText: {
    color: Colors.primary[600],
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // PRIMARY BUTTON
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryButtonGradient: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },

  // DIVIDER
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral[200],
  },
  dividerText: {
    fontSize: 11,
    color: Colors.neutral[400],
    fontWeight: '600',
  },

  // OUTLINE BUTTON
  outlineButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[700],
  },

  // FOOTER
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.neutral[400],
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
});