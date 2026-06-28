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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/utils/supabase';
import Colors from '@/constants/Colors';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Animated floating blob ---
function FloatingBlob({ style }: { style: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
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
    outputRange: [Colors.neutral[200], Colors.primary[500]],
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, delay: 200, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (!supabase) {
        Alert.alert('Configuration Error', 'Supabase is not initialized.');
        setLoading(false);
        return;
      }
      let loginEmail = email.trim();
      try {
        const { data: resolvedEmail, error: rpcError } = await supabase.rpc('get_worker_auth_email', { 
          f_email: loginEmail, 
          w_pass: password 
        });
        if (!rpcError && resolvedEmail) {
          loginEmail = resolvedEmail;
        }
      } catch (err) {
        console.warn('Worker resolution bypassed:', err);
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (error) {
        Alert.alert('Login Failed', error.message);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={[Colors.primary[50], Colors.white, Colors.primary[100]]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative blobs */}
      <FloatingBlob style={[styles.blob, styles.blob1]} />
      <FloatingBlob style={[styles.blob, styles.blob2]} />
      <View style={styles.blob3} />

      {/* Grid pattern overlay */}
      <View style={styles.gridOverlay} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section */}
          <Animated.View style={[styles.heroSection, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            <View style={styles.logoRing}>
              <LinearGradient
                colors={[Colors.primary[400], Colors.primary[600]]}
                style={styles.logoGradient}
              >
                <View style={styles.logoInner}>
                  <Image
                    source={require('../../assets/images/logo.jpg')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </LinearGradient>
            </View>

            <View style={styles.brandTextContainer}>
              <View style={styles.brandRow}>
                <LinearGradient
                  colors={[Colors.primary[300], Colors.primary[500]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.brandAccentBar}
                />
                <View>
                  <Animated.Text style={[styles.brandName]}>
                    Zvipfuwo
                  </Animated.Text>
                  <Animated.Text style={styles.brandTagline}>
                    Smart Farm Management
                  </Animated.Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Glass card */}
          <Animated.View
            style={[
              styles.glassCard,
              { opacity: fadeIn, transform: [{ translateY: slideUp }] },
            ]}
          >
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderAccent} />
              <View>
                <Animated.Text style={styles.cardTitle}>Welcome back</Animated.Text>
                <Animated.Text style={styles.cardSubtitle}>
                  Sign in to your farm account
                </Animated.Text>
              </View>
            </View>

            {/* Inputs */}
            <View style={styles.inputsContainer}>
              <GlassInput
                icon={Mail}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <GlassInput
                icon={Lock}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                isPassword
              />
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => router.push('/(auth)/forgot-password')}
              activeOpacity={0.7}
            >
              <Animated.Text style={styles.forgotText}>Forgot password?</Animated.Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.primary[400], Colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                {loading ? (
                  <Animated.Text style={styles.primaryButtonText}>Signing in...</Animated.Text>
                ) : (
                  <Animated.Text style={styles.primaryButtonText}>Sign In  →</Animated.Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Animated.Text style={styles.dividerText}>or</Animated.Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign up link */}
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.push('/(auth)/signup')}
              activeOpacity={0.8}
            >
              <Animated.Text style={styles.outlineButtonText}>
                Create new account
              </Animated.Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.Text style={[styles.footer, { opacity: fadeIn }]}>
            Trusted by farmers across the region 🌿
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
    width: 260,
    height: 260,
    top: -60,
    right: -60,
    backgroundColor: Colors.primary[200],
    opacity: 0.45,
  },
  blob2: {
    width: 180,
    height: 180,
    bottom: 120,
    left: -50,
    backgroundColor: Colors.primary[100],
    opacity: 0.5,
  },
  blob3: {
    position: 'absolute',
    width: 140,
    height: 140,
    top: SCREEN_HEIGHT * 0.35,
    right: -30,
    borderRadius: 999,
    backgroundColor: Colors.accent[200],
    opacity: 0.35,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT,
  },

  // HERO
  heroSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(122,193,66,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary[300],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTextContainer: {
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandAccentBar: {
    width: 4,
    height: 44,
    borderRadius: 2,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.neutral[900],
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: Colors.neutral[500],
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // GLASS CARD
  glassCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  cardHeaderAccent: {
    width: 4,
    height: 44,
    borderRadius: 2,
    backgroundColor: Colors.primary[400],
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.neutral[500],
    marginTop: 2,
  },

  // INPUTS
  inputsContainer: {
    gap: 12,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    height: 56,
    overflow: 'hidden',
  },
  inputIconBox: {
    width: 52,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.neutral[200],
  },
  inputIconInner: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(122,193,66,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
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

  // FORGOT
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.primary[600],
    fontWeight: '600',
  },

  // PRIMARY BUTTON
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
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
    letterSpacing: 0.3,
  },

  // DIVIDER
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral[200],
  },
  dividerText: {
    fontSize: 12,
    color: Colors.neutral[400],
    fontWeight: '600',
  },

  // OUTLINE BUTTON
  outlineButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    fontSize: 15,
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
  },
});