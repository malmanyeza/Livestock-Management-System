import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  Alert,
  PanResponder,
} from 'react-native';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Check,
  Minus,
  Plus,
  Sparkles,
  Shield,
  HelpCircle,
  FileText,
  Sliders,
  Users,
  WifiOff,
  Tag,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Scale,
  DollarSign,
  Layers,
  BarChart2,
  Radio,
  Building2,
  Headphones,
  CheckCircle2,
  X,
  PhoneCall,
  Info,
} from 'lucide-react-native';
import { Text } from '@/components/typography/Text';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Colors from '@/constants/Colors';
import { useFarmData } from '@/context/FarmDataContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface PricingTier {
  id: 'bronze' | 'gold' | 'platinum' | 'enterprise';
  shortName: string;
  fullName: string;
  badge: string;
  tagline: string;
  dotColor: string;
  accentBg: string;
  borderColor: string;
  targetAudience: string;
  animalLimitLabel: string;
  maxAnimals: number;
  monthlyPrice: number; // 0 for free, -1 for custom
  annualPrice: number; // 0 for free, -1 for custom
  coreValue: string;
  userLimit: string;
}

export const TIERS: PricingTier[] = [
  {
    id: 'bronze',
    shortName: 'Bronze',
    fullName: 'Kumusha Bronze Plan (Free Tier)',
    badge: 'Free Tier',
    tagline: 'Digital replacing the paper notebook.',
    dotColor: '#D97706', // warm bronze/amber
    accentBg: '#FFFBEB',
    borderColor: '#FCD34D',
    targetAudience: 'Subsistence, communal, & hobby farmers',
    animalLimitLabel: 'Up to 10 animals',
    maxAnimals: 10,
    monthlyPrice: 0,
    annualPrice: 0,
    coreValue: 'Digital replacing the paper notebook.',
    userLimit: '1 User (Farm Owner)',
  },
  {
    id: 'gold',
    shortName: 'Gold',
    fullName: 'Hurudza Gold Plan (Growth)',
    badge: 'Growth Tier',
    tagline: 'Optimising yield, scheduling, and local market visibility.',
    dotColor: '#EAB308', // gold
    accentBg: '#FEFCE8',
    borderColor: '#FDE047',
    targetAudience: 'Emerging commercial & A1 farmers',
    animalLimitLabel: 'Up to 100 animals',
    maxAnimals: 100,
    monthlyPrice: 10,
    annualPrice: 100,
    coreValue: 'Optimising yield, scheduling, and local market visibility.',
    userLimit: '1 User (SMS to Workers)',
  },
  {
    id: 'platinum',
    shortName: 'Platinum',
    fullName: 'Divisi Platinum Master-Farmer Plan',
    badge: 'Master-Farmer',
    tagline: 'Multi-worker management, deep data, and investor transparency.',
    dotColor: '#0284C7', // platinum / sky blue
    accentBg: '#F0F9FF',
    borderColor: '#7DD3FC',
    targetAudience: 'Established medium commercial & A2 farmers',
    animalLimitLabel: 'Up to 500 animals',
    maxAnimals: 500,
    monthlyPrice: 15,
    annualPrice: 150,
    coreValue: 'Multi-worker management, deep data, and investor transparency.',
    userLimit: 'Up to 5 Users (Permissions-based)',
  },
  {
    id: 'enterprise',
    shortName: 'Enterprise',
    fullName: 'Mambo Enterprise Plan (Customized)',
    badge: 'Enterprise',
    tagline: 'Total supply chain tracking, API integrations, and offline servers.',
    dotColor: '#7C3AED', // royal purple
    accentBg: '#FAF5FF',
    borderColor: '#D8B4FE',
    targetAudience: 'Large-scale ranches, feedlots, & cooperatives',
    animalLimitLabel: 'Unlimited animals',
    maxAnimals: 99999,
    monthlyPrice: -1,
    annualPrice: -1,
    coreValue: 'Total supply chain tracking, API integrations, and offline servers.',
    userLimit: 'Unlimited Users & Roles',
  },
];

interface MatrixRow {
  key: string;
  category: string;
  title: string;
  description: string;
  bronze: string | boolean;
  gold: string | boolean;
  platinum: string | boolean;
  enterprise: string | boolean;
}

const MATRIX_ROWS: MatrixRow[] = [
  // --- Core Capabilities & Identification ---
  {
    key: 'offline_sync',
    category: 'Core Capabilities',
    title: 'Offline-First Record-Keeping',
    description: 'Digital notebook for births, deaths, sales, and theft alerts. Data sits on phone and only syncs when visiting a business centre with Wi-Fi/network.',
    bronze: true,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'visual_profile',
    category: 'Core Capabilities',
    title: 'Visual Profile & Tag ID',
    description: 'Basic profiles for cattle, goats, or pigs using physical ear tag numbers and visual photos.',
    bronze: true,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'market_prices',
    category: 'Core Capabilities',
    title: 'Basic Market Prices',
    description: 'Monthly regional livestock auction averages to help communal farmers avoid being cheated by middlemen.',
    bronze: true,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'theft_log',
    category: 'Core Capabilities',
    title: 'Theft / Loss Log (ZRP Export)',
    description: 'Quick-export text profile of an animal to share with local ZRP (police) or community watch groups if an animal goes missing.',
    bronze: true,
    gold: true,
    platinum: true,
    enterprise: true,
  },

  // --- Automation & Yield ---
  {
    key: 'sms_reminders',
    category: 'Automation & Yield',
    title: 'Smart SMS Reminders',
    description: 'Automated text alerts for dipping schedules, vaccination dates, and gestation tracking (vital because smallholders always read SMS).',
    bronze: false,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'production_weight',
    category: 'Automation & Yield',
    title: 'Production & Weight Logs',
    description: 'Daily milk weigh-ins for small dairies, or regular weight tracking for beef/pigs to calculate market readiness.',
    bronze: false,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'finance_ledger',
    category: 'Automation & Yield',
    title: 'Farm Finance Ledger',
    description: 'Simple, region-specific cash flow inputs (feed costs, veterinary supplies vs slaughter/live sales).',
    bronze: false,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'lender_exports',
    category: 'Automation & Yield',
    title: 'Vet & Lender Ready Exports',
    description: 'One-click PDF summaries formatted to satisfy requirements for local microfinance institutions (like Empower Bank or Women’s Bank) or veterinary inspectors.',
    bronze: false,
    gold: true,
    platinum: true,
    enterprise: true,
  },

  // --- Multi-User & Optimization ---
  {
    key: 'multi_user',
    category: 'Multi-User & Scale',
    title: 'Multi-User Collaboration',
    description: 'Permissions-based access. Farm workers on-site log daily data on mobile app, while the owner views the master dashboard on the web.',
    bronze: false,
    gold: false,
    platinum: 'Up to 5 Users',
    enterprise: 'Unlimited Users',
  },
  {
    key: 'smart_batch',
    category: 'Multi-User & Scale',
    title: 'Smart Batch Logging',
    description: 'Save hours of admin. Apply a single deworming treatment, dipping record, or feedback note to an entire herd or paddock group at once.',
    bronze: false,
    gold: false,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'performance_analytics',
    category: 'Multi-User & Scale',
    title: 'Advanced Performance Analytics',
    description: 'Automated calculation of Average Daily Gain (ADG), cow-calf efficiency ratios, and identification of underperforming animals (e.g., cows failing to conceive).',
    bronze: false,
    gold: false,
    platinum: true,
    enterprise: true,
  },

  // --- Hardware & Ecosystem ---
  {
    key: 'hardware_integration',
    category: 'Hardware & Ecosystem',
    title: 'Hardware Integration',
    description: 'Direct Bluetooth integration with digital livestock weigh scales and RFID ear-tag wand scanners.',
    bronze: false,
    gold: false,
    platinum: false,
    enterprise: true,
  },
  {
    key: 'cooperative_portals',
    category: 'Hardware & Ecosystem',
    title: 'Cooperative Master Portals',
    description: 'Aggregated dashboard for cooperative managers to view and audit supply-chain records across 100+ local smallholder suppliers.',
    bronze: false,
    gold: false,
    platinum: false,
    enterprise: true,
  },
  {
    key: 'dedicated_manager',
    category: 'Hardware & Ecosystem',
    title: 'Dedicated Account Manager & Training',
    description: 'Dedicated account manager, custom SLA, and priority offline/on-site training sessions for farm staff.',
    bronze: false,
    gold: false,
    platinum: false,
    enterprise: true,
  },
];

export default function SubscriptionScreen() {
  const { profile, animals } = useFarmData();
  const currentHerdCount = animals?.length || 20;

  const [selectedTierId, setSelectedTierId] = useState<'bronze' | 'gold' | 'platinum' | 'enterprise'>('bronze');
  const [isAnnual, setIsAnnual] = useState(false);
  const [simulatedHerdSize, setSimulatedHerdSize] = useState<number>(Math.max(10, currentHerdCount));
  const [selectedFeature, setSelectedFeature] = useState<MatrixRow | null>(null);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  // Selected Tier Object
  const selectedTier = useMemo(() => {
    return TIERS.find((t) => t.id === selectedTierId) || TIERS[0];
  }, [selectedTierId]);

  // Recommended tier based on simulated herd size
  const recommendedTier = useMemo(() => {
    if (simulatedHerdSize <= 10) return TIERS[0]; // Bronze
    if (simulatedHerdSize <= 100) return TIERS[1]; // Gold
    if (simulatedHerdSize <= 500) return TIERS[2]; // Platinum
    return TIERS[3]; // Enterprise
  }, [simulatedHerdSize]);

  // Interactive slider track width measurement
  const [sliderWidth, setSliderWidth] = useState(SCREEN_WIDTH - 64);
  const trackRef = useRef<View>(null);
  const trackPageXRef = useRef<number>(32);
  const trackWidthRef = useRef<number>(SCREEN_WIDTH - 64);
  const startRatioRef = useRef<number>(0);
  const lastHapticTier = useRef<string>('bronze');

  // Trigger gentle haptic when crossing tiers
  useEffect(() => {
    if (recommendedTier.id !== lastHapticTier.current) {
      lastHapticTier.current = recommendedTier.id;
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  }, [recommendedTier.id]);

  // Helper to convert herd size (1 to 1000) to slider percentage (0 to 1)
  const herdToRatio = (val: number) => {
    if (val <= 10) return (val / 10) * 0.25;
    if (val <= 100) return 0.25 + ((val - 10) / 90) * 0.25;
    if (val <= 500) return 0.5 + ((val - 100) / 400) * 0.25;
    return Math.min(1, 0.75 + ((val - 500) / 500) * 0.25);
  };

  const ratioToHerd = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    if (clamped <= 0.25) {
      return Math.max(1, Math.round((clamped / 0.25) * 10));
    }
    if (clamped <= 0.5) {
      return Math.round(10 + ((clamped - 0.25) / 0.25) * 90);
    }
    if (clamped <= 0.75) {
      return Math.round(100 + ((clamped - 0.5) / 0.25) * 400);
    }
    return Math.round(500 + ((clamped - 0.75) / 0.25) * 500);
  };

  // PanResponder for touch sliding - using dx for jitter-free, rock-solid dragging
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 1,
        onMoveShouldSetPanResponderCapture: (_, gestureState) => Math.abs(gestureState.dx) > 1,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (evt) => {
          trackRef.current?.measure((_x, _y, width, _height, pageX) => {
            if (pageX != null && pageX > 0) trackPageXRef.current = pageX;
            if (width != null && width > 0) trackWidthRef.current = width;
          });
          const touchPageX = evt.nativeEvent.pageX;
          const currentTrackX = trackPageXRef.current || 32;
          const currentWidth = trackWidthRef.current || SCREEN_WIDTH - 64;
          const touchOffset = touchPageX - currentTrackX;
          const initialRatio = Math.max(0, Math.min(1, touchOffset / currentWidth));
          startRatioRef.current = initialRatio;
          setSimulatedHerdSize(ratioToHerd(initialRatio));
        },
        onPanResponderMove: (_, gestureState) => {
          const currentWidth = trackWidthRef.current || SCREEN_WIDTH - 64;
          const deltaRatio = gestureState.dx / currentWidth;
          const newRatio = Math.max(0, Math.min(1, startRatioRef.current + deltaRatio));
          setSimulatedHerdSize(ratioToHerd(newRatio));
        },
      }),
    []
  );

  const handleSelectTier = (tier: PricingTier) => {
    setSelectedTierId(tier.id);
    if (tier.id === 'bronze' && simulatedHerdSize > 10) {
      setSimulatedHerdSize(10);
    } else if (tier.id === 'gold' && (simulatedHerdSize <= 10 || simulatedHerdSize > 100)) {
      setSimulatedHerdSize(50);
    } else if (tier.id === 'platinum' && (simulatedHerdSize <= 100 || simulatedHerdSize > 500)) {
      setSimulatedHerdSize(250);
    } else if (tier.id === 'enterprise' && simulatedHerdSize <= 500) {
      setSimulatedHerdSize(750);
    }
  };

  const formatPrice = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) return '$0/mo';
    if (tier.monthlyPrice === -1) return 'Custom';
    if (isAnnual) {
      return `$${tier.annualPrice}/yr`;
    }
    return `$${tier.monthlyPrice}/mo`;
  };

  const getTierSuitabilityText = (tier: PricingTier) => {
    if (tier.id === 'bronze') return '10 Head Max';
    if (tier.id === 'gold') return '100 Head Max';
    if (tier.id === 'platinum') return '500 Head Max';
    return 'Unlimited Head';
  };

  const handleConfirmPlan = () => {
    setUpgradeModalVisible(false);
    Alert.alert(
      'Plan Selected 🎉',
      `You have selected the ${selectedTier.fullName}. Our team is configuring your features!`,
      [{ text: 'Awesome', style: 'default' }]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Subscription Matrix',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 }}
            >
              <ChevronLeft size={24} color={Colors.neutral[800]} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setContactModalVisible(true)}
              style={styles.headerHelpBtn}
            >
              <PhoneCall size={18} color={Colors.primary[600]} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScreenContainer style={styles.container} scrollable={true}>
        {/* Top Summary Bar (Matching Image 1) */}
        <View style={styles.topSummaryBar}>
          <View style={styles.summaryCol}>
            <Text variant="caption" color="neutral.500" weight="medium">
              Selected Tier
            </Text>
            <Text variant="body" weight="bold" color="neutral.900" numberOfLines={1}>
              {selectedTier.shortName === 'Bronze' ? 'Kumusha Bron...' : selectedTier.fullName.split(' ')[0] + ' ' + selectedTier.shortName}
            </Text>
          </View>

          <View style={styles.summaryColCenter}>
            <Text variant="caption" color="neutral.500" weight="medium">
              Tier Base Cost
            </Text>
            <Text variant="body" weight="bold" color="neutral.900">
              {formatPrice(selectedTier)}
            </Text>
          </View>

          <View style={styles.summaryColEnd}>
            <Text variant="caption" color="neutral.500" weight="medium">
              Herd Suitability
            </Text>
            <Text variant="body" weight="bold" color="neutral.900">
              {getTierSuitabilityText(selectedTier)}
            </Text>
          </View>
        </View>

        {/* Billing Toggle (Monthly / Annual) */}
        <View style={styles.billingToggleRow}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, !isAnnual && styles.toggleBtnActive]}
              onPress={() => setIsAnnual(false)}
            >
              <Text
                variant="caption"
                weight="bold"
                style={{ color: !isAnnual ? Colors.neutral[900] : Colors.neutral[500] }}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isAnnual && styles.toggleBtnActive]}
              onPress={() => setIsAnnual(true)}
            >
              <Text
                variant="caption"
                weight="bold"
                style={{ color: isAnnual ? Colors.neutral[900] : Colors.neutral[500] }}
              >
                Annual (Save ~17%)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 1: Simulate Your Herd Operational Size (Matching Image 1) */}
        <View style={styles.sectionHeaderRow}>
          <Text variant="h6" weight="bold" color="neutral.900" style={{ flex: 1, marginRight: 8 }}>
            Simulate Herd Size
          </Text>
          <View style={styles.badgeControlRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() =>
                setSimulatedHerdSize((prev) =>
                  Math.max(1, prev - (prev > 100 ? 50 : prev > 10 ? 10 : 1))
                )
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Minus size={14} color={Colors.neutral[700]} />
            </TouchableOpacity>

            <View style={styles.headBadge}>
              <Text variant="caption" weight="bold" color="neutral.800">
                {simulatedHerdSize >= 1000 ? '1,000+ head' : `${simulatedHerdSize} head`}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() =>
                setSimulatedHerdSize((prev) =>
                  Math.min(1000, prev + (prev >= 100 ? 50 : 10))
                )
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Plus size={14} color={Colors.neutral[700]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Interactive Slider */}
        <View style={styles.sliderContainer}>
          <View
            ref={trackRef}
            style={styles.sliderTouchArea}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              setSliderWidth(w);
              trackWidthRef.current = w;
              trackRef.current?.measure((_x, _y, width, _height, pageX) => {
                if (pageX != null && pageX > 0) trackPageXRef.current = pageX;
                if (width != null && width > 0) trackWidthRef.current = width;
              });
            }}
            {...panResponder.panHandlers}
          >
            {/* Background Track */}
            <View pointerEvents="none" style={styles.sliderTrackBg}>
              {/* Filled Track */}
              <View
                style={[
                  styles.sliderTrackFill,
                  { width: `${herdToRatio(simulatedHerdSize) * 100}%` },
                ]}
              />
            </View>

            {/* Draggable Thumb */}
            <View
              pointerEvents="none"
              style={[
                styles.sliderThumb,
                {
                  left: Math.max(
                    0,
                    Math.min(
                      sliderWidth - 24,
                      herdToRatio(simulatedHerdSize) * (sliderWidth - 24)
                    )
                  ),
                },
              ]}
            >
              <View style={styles.sliderThumbInner} />
            </View>
          </View>

          {/* Quick preset markers */}
          <View style={styles.presetRow}>
            {[10, 50, 100, 250, 500, 1000].map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.presetChip,
                  simulatedHerdSize === count && styles.presetChipActive,
                ]}
                onPress={() => setSimulatedHerdSize(count)}
              >
                <Text
                  variant="caption"
                  weight={simulatedHerdSize === count ? 'bold' : 'regular'}
                  color={simulatedHerdSize === count ? 'primary.700' : 'neutral.500'}
                  style={{ fontSize: 10 }}
                >
                  {count === 1000 ? '1k+' : count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic recommendation alert */}
          <View style={styles.recommendationBox}>
            <Sparkles size={16} color={recommendedTier.dotColor} style={{ marginRight: 6 }} />
            <Text variant="caption" weight="medium" color="neutral.700" style={{ flex: 1 }}>
              Recommended for your {simulatedHerdSize} head:{' '}
              <Text variant="caption" weight="bold" style={{ color: recommendedTier.dotColor }}>
                {recommendedTier.shortName} Plan
              </Text>
              {recommendedTier.id !== selectedTierId && (
                <Text
                  variant="caption"
                  weight="bold"
                  color="primary.600"
                  onPress={() => handleSelectTier(recommendedTier)}
                >
                  {' '}
                  (Switch)
                </Text>
              )}
            </Text>
          </View>
        </View>

        {/* Section 2: Subscription Package Tier Breakdown (2x2 Cards matching Image 1) */}
        <Text variant="h6" weight="bold" color="neutral.900" style={styles.sectionTitle}>
          Subscription Package Tier Breakdown
        </Text>

        <View style={styles.tierGrid}>
          {TIERS.map((tier) => {
            const isSelected = selectedTierId === tier.id;
            return (
              <TouchableOpacity
                key={tier.id}
                style={[
                  styles.tierCard,
                  isSelected && styles.tierCardSelected,
                  { borderColor: isSelected ? '#3B82F6' : Colors.neutral[200] },
                ]}
                onPress={() => handleSelectTier(tier)}
                activeOpacity={0.8}
              >
                <View style={styles.tierCardHeader}>
                  <View style={[styles.dotIndicator, { backgroundColor: tier.dotColor }]} />
                  <Text variant="body" weight="bold" color="neutral.900">
                    {tier.shortName}
                  </Text>
                </View>
                <Text variant="caption" color="neutral.500" style={{ marginTop: 2 }}>
                  {formatPrice(tier)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Highlighted Tier Banner */}
        <Card style={[styles.activeTierBanner, { backgroundColor: selectedTier.accentBg, borderColor: selectedTier.borderColor }]}>
          <View style={styles.activeTierBannerContent}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={[styles.pillBadge, { backgroundColor: selectedTier.dotColor }]}>
                  <Text variant="caption" weight="bold" style={{ color: '#FFF', fontSize: 10 }}>
                    {selectedTier.badge}
                  </Text>
                </View>
                <Text variant="caption" color="neutral.500" style={{ marginLeft: 6 }}>
                  {selectedTier.targetAudience}
                </Text>
              </View>
              <Text variant="h6" weight="bold" color="neutral.900" style={{ marginTop: 4 }}>
                {selectedTier.fullName}
              </Text>
              <Text variant="caption" color="neutral.600" style={{ marginTop: 2 }}>
                {selectedTier.tagline}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.selectPlanCta, { backgroundColor: selectedTier.dotColor }]}
              onPress={() => {
                if (selectedTier.id === 'enterprise') {
                  setContactModalVisible(true);
                } else {
                  setUpgradeModalVisible(true);
                }
              }}
            >
              <Text variant="caption" weight="bold" style={{ color: '#FFF' }}>
                {selectedTier.id === 'bronze' ? 'Active' : selectedTier.id === 'enterprise' ? 'Inquire' : 'Select'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Section 3: Interactive Subscription Matrix Table */}
        <View style={styles.matrixHeaderRow}>
          <Text variant="h6" weight="bold" color="neutral.900">
            Interactive Subscription Matrix
          </Text>
          <Text variant="caption" color="neutral.500">
            Tap features for details
          </Text>
        </View>

        <Card style={styles.matrixTableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Matrix Table Header */}
              <View style={styles.tableHeaderRow}>
                <View style={[styles.colHeader, { width: 140 }]}>
                  <Text variant="caption" weight="bold" color="neutral.600">
                    Core Capabilities
                  </Text>
                </View>

                {TIERS.map((tier) => {
                  const isSelected = selectedTierId === tier.id;
                  return (
                    <TouchableOpacity
                      key={tier.id}
                      style={[
                        styles.colHeaderTier,
                        isSelected && styles.colSelectedHeader,
                      ]}
                      onPress={() => handleSelectTier(tier)}
                    >
                      <View style={[styles.miniDot, { backgroundColor: tier.dotColor }]} />
                      <Text
                        variant="caption"
                        weight="bold"
                        color={isSelected ? 'primary.700' : 'neutral.800'}
                      >
                        {tier.shortName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* General Specs Rows (Monthly Fee, Herd Capacity, etc.) */}
              <View style={styles.specRow}>
                <View style={[styles.cellFeature, { width: 140 }]}>
                  <Text variant="caption" weight="bold" color="neutral.800">
                    Monthly Fee
                  </Text>
                </View>
                {TIERS.map((tier) => (
                  <View
                    key={tier.id}
                    style={[
                      styles.cellValue,
                      selectedTierId === tier.id && styles.colSelectedCell,
                    ]}
                  >
                    <Text
                      variant="caption"
                      weight="bold"
                      style={{
                        color: tier.id === 'bronze' ? '#D97706' : tier.id === 'enterprise' ? '#7C3AED' : '#0F172A',
                      }}
                    >
                      {formatPrice(tier)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={[styles.specRow, styles.altRow]}>
                <View style={[styles.cellFeature, { width: 140 }]}>
                  <Text variant="caption" weight="bold" color="neutral.800">
                    Herd Capacity
                  </Text>
                </View>
                {TIERS.map((tier) => (
                  <View
                    key={tier.id}
                    style={[
                      styles.cellValue,
                      selectedTierId === tier.id && styles.colSelectedCell,
                    ]}
                  >
                    <Text variant="caption" color="neutral.700">
                      {tier.animalLimitLabel}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.specRow}>
                <View style={[styles.cellFeature, { width: 140 }]}>
                  <Text variant="caption" weight="bold" color="neutral.800">
                    User Access
                  </Text>
                </View>
                {TIERS.map((tier) => (
                  <View
                    key={tier.id}
                    style={[
                      styles.cellValue,
                      selectedTierId === tier.id && styles.colSelectedCell,
                    ]}
                  >
                    <Text variant="caption" color="neutral.700">
                      {tier.id === 'bronze' ? '1 User' : tier.id === 'gold' ? '1 User + SMS' : tier.id === 'platinum' ? 'Up to 5 Users' : 'Unlimited'}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Grouped Feature Rows */}
              {['Core Capabilities', 'Automation & Yield', 'Multi-User & Scale', 'Hardware & Ecosystem'].map(
                (category) => {
                  const rows = MATRIX_ROWS.filter((r) => r.category === category);
                  return (
                    <React.Fragment key={category}>
                      {/* Category divider */}
                      <View style={styles.categoryDividerRow}>
                        <Text variant="caption" weight="bold" color="neutral.600">
                          {category.toUpperCase()}
                        </Text>
                      </View>

                      {rows.map((row, idx) => (
                        <TouchableOpacity
                          key={row.key}
                          style={[
                            styles.featureDataRow,
                            idx % 2 === 1 && styles.altRow,
                          ]}
                          onPress={() => setSelectedFeature(row)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.cellFeatureWithIcon, { width: 140 }]}>
                            <Text
                              variant="caption"
                              weight="medium"
                              color="neutral.800"
                              numberOfLines={2}
                              style={{ flex: 1 }}
                            >
                              {row.title}
                            </Text>
                            <Info size={12} color={Colors.neutral[400]} style={{ marginLeft: 4 }} />
                          </View>

                          {TIERS.map((tier) => {
                            const val = row[tier.id];
                            const isSelected = selectedTierId === tier.id;
                            return (
                              <View
                                key={tier.id}
                                style={[
                                  styles.cellValue,
                                  isSelected && styles.colSelectedCell,
                                ]}
                              >
                                {typeof val === 'boolean' ? (
                                  val ? (
                                    <View style={styles.checkCircle}>
                                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                                    </View>
                                  ) : (
                                    <Minus size={14} color={Colors.neutral[300]} />
                                  )
                                ) : (
                                  <Text
                                    variant="caption"
                                    weight="bold"
                                    style={{
                                      fontSize: 10,
                                      color: isSelected ? Colors.primary[700] : Colors.neutral[700],
                                      textAlign: 'center',
                                    }}
                                  >
                                    {val}
                                  </Text>
                                )}
                              </View>
                            );
                          })}
                        </TouchableOpacity>
                      ))}
                    </React.Fragment>
                  );
                }
              )}
            </View>
          </ScrollView>
        </Card>

        {/* Value Proposition Breakdown Cards */}
        <Text variant="h6" weight="bold" color="neutral.900" style={styles.sectionTitle}>
          Plan Value Details
        </Text>

        <View style={styles.detailsContainer}>
          <Card style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={[styles.dotIndicator, { backgroundColor: '#D97706' }]} />
              <Text variant="h6" weight="bold" color="neutral.900">
                A. Kumusha Bronze Plan (Free Tier)
              </Text>
            </View>
            <Text variant="caption" color="neutral.600" style={{ marginBottom: 8 }}>
              Designed for subsistence, communal, and hobby farmers. Digital replacing the paper notebook.
            </Text>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Offline-First Record-Keeping: </Text>
              <Text variant="caption" color="neutral.600">Digital notebook for births, deaths, sales, and theft alerts. Sits on phone, syncs when visiting business centres.</Text>
            </View>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Visual Profile & Tag ID: </Text>
              <Text variant="caption" color="neutral.600">Basic profiles for cattle, goats, or pigs using physical ear tag numbers.</Text>
            </View>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Basic Market Prices: </Text>
              <Text variant="caption" color="neutral.600">Monthly regional livestock auction averages to prevent communal farmers being cheated by middlemen.</Text>
            </View>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Theft/Loss Log: </Text>
              <Text variant="caption" color="neutral.600">Quick-export text profile of an animal to share with local ZRP (police) or community watch groups.</Text>
            </View>
          </Card>

          <Card style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={[styles.dotIndicator, { backgroundColor: '#EAB308' }]} />
              <Text variant="h6" weight="bold" color="neutral.900">
                B. Hurudza Gold Plan ($10/mo)
              </Text>
            </View>
            <Text variant="caption" color="neutral.600" style={{ marginBottom: 8 }}>
              For emerging commercial & A1 farmers looking to optimise yield and gain local market visibility.
            </Text>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Smart SMS Reminders: </Text>
              <Text variant="caption" color="neutral.600">Automated text alerts for dipping schedules, vaccination dates, and gestation tracking.</Text>
            </View>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Production & Weight Logs: </Text>
              <Text variant="caption" color="neutral.600">Daily milk weigh-ins for small dairies, or regular weight tracking for beef/pigs to calculate market readiness.</Text>
            </View>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Farm Finance Ledger: </Text>
              <Text variant="caption" color="neutral.600">Simple cash flow inputs (feed costs, veterinary supplies vs slaughter/live sales).</Text>
            </View>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Vet & Lender Ready Exports: </Text>
              <Text variant="caption" color="neutral.600">One-click PDF summaries formatted to satisfy Empower Bank, Women’s Bank, and local vet inspectors.</Text>
            </View>
          </Card>

          <Card style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={[styles.dotIndicator, { backgroundColor: '#0284C7' }]} />
              <Text variant="h6" weight="bold" color="neutral.900">
                C. Divisi Platinum Master-Farmer ($15/mo)
              </Text>
            </View>
            <Text variant="caption" color="neutral.600" style={{ marginBottom: 8 }}>
              For established medium commercial & A2 farmers. Multi-worker management and investor transparency.
            </Text>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Multi-User Collaboration: </Text>
              <Text variant="caption" color="neutral.600">Up to 5 Users with permissions. Workers log on mobile on-site; owner views master web dashboard.</Text>
            </View>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Smart Batch Logging: </Text>
              <Text variant="caption" color="neutral.600">Apply single deworming treatment, dipping record, or feedback note to an entire herd or paddock group at once.</Text>
            </View>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Advanced Performance Analytics: </Text>
              <Text variant="caption" color="neutral.600">Automated calculation of Average Daily Gain (ADG), cow-calf efficiency ratios, and cull alerts.</Text>
            </View>
          </Card>

          <Card style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={[styles.dotIndicator, { backgroundColor: '#7C3AED' }]} />
              <Text variant="h6" weight="bold" color="neutral.900">
                D. Mambo Enterprise Plan (Custom)
              </Text>
            </View>
            <Text variant="caption" color="neutral.600" style={{ marginBottom: 8 }}>
              For large-scale ranches, feedlots, and cooperatives. Complete supply chain and hardware integrations.
            </Text>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Unlimited Scale: </Text>
              <Text variant="caption" color="neutral.600">Unlimited animals, pastures, and unlimited staff/worker accounts.</Text>
            </View>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Hardware Integration: </Text>
              <Text variant="caption" color="neutral.600">Connect directly to Bluetooth weight scales and RFID electronic ear-tag scanners.</Text>
            </View>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Cooperative Portals: </Text>
              <Text variant="caption" color="neutral.600">Master dashboard for cooperative managers to aggregate data across 100+ local smallholder suppliers.</Text>
            </View>
            <View style={styles.featureBullet}>
              <Text variant="caption" weight="bold" color="neutral.800">• Dedicated Account Manager: </Text>
              <Text variant="caption" color="neutral.600">Priority offline and on-site staff training sessions with dedicated SLA support.</Text>
            </View>
          </Card>
        </View>

        {/* Bottom Floating Action Bar */}
        <View style={styles.footerSpacing} />
      </ScreenContainer>

      {/* Feature Details Modal */}
      <Modal
        visible={!!selectedFeature}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedFeature(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.featureModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color="primary.600" weight="bold">
                  {selectedFeature?.category}
                </Text>
                <Text variant="h6" weight="bold" color="neutral.900">
                  {selectedFeature?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFeature(null)} style={styles.closeBtn}>
                <X size={20} color={Colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <Text variant="body" color="neutral.700" style={styles.modalBodyText}>
              {selectedFeature?.description}
            </Text>

            <View style={styles.modalTierMatrix}>
              <Text variant="caption" weight="bold" color="neutral.600" style={{ marginBottom: 6 }}>
                Availability Across Tiers:
              </Text>
              {TIERS.map((tier) => {
                const val = selectedFeature ? selectedFeature[tier.id] : false;
                return (
                  <View key={tier.id} style={styles.modalTierRow}>
                    <View style={[styles.miniDot, { backgroundColor: tier.dotColor }]} />
                    <Text variant="caption" weight="medium" color="neutral.800" style={{ flex: 1 }}>
                      {tier.fullName.split(' ')[0]} {tier.shortName}
                    </Text>
                    {typeof val === 'boolean' ? (
                      val ? (
                        <View style={styles.checkCircle}>
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : (
                        <Minus size={14} color={Colors.neutral[300]} />
                      )
                    ) : (
                      <Text variant="caption" weight="bold" color="primary.700">
                        {val}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            <Button
              variant="outline"
              size="sm"
              onPress={() => setSelectedFeature(null)}
              style={{ marginTop: 16 }}
            >
              <Text variant="button" color="neutral.800">Close</Text>
            </Button>
          </View>
        </View>
      </Modal>

      {/* Upgrade / Confirmation Modal */}
      <Modal
        visible={upgradeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUpgradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upgradeModalCard}>
            <View style={[styles.upgradeBadgeIcon, { backgroundColor: selectedTier.accentBg }]}>
              <Sparkles size={28} color={selectedTier.dotColor} />
            </View>

            <Text variant="h5" weight="bold" color="neutral.900" style={{ textAlign: 'center', marginTop: 12 }}>
              Choose {selectedTier.shortName} Plan
            </Text>
            <Text variant="body" color="neutral.600" style={{ textAlign: 'center', marginTop: 4 }}>
              {selectedTier.tagline}
            </Text>

            <View style={styles.planSummaryBox}>
              <View style={styles.summaryItem}>
                <Text variant="caption" color="neutral.500">Price</Text>
                <Text variant="h6" weight="bold" color="neutral.900">{formatPrice(selectedTier)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="caption" color="neutral.500">Capacity</Text>
                <Text variant="h6" weight="bold" color="neutral.900">{selectedTier.animalLimitLabel}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="caption" color="neutral.500">Users</Text>
                <Text variant="h6" weight="bold" color="neutral.900">{selectedTier.userLimit.split(' ')[0]}</Text>
              </View>
            </View>

            <View style={styles.upgradeActions}>
              <Button
                variant="primary"
                onPress={handleConfirmPlan}
                style={{ backgroundColor: selectedTier.dotColor }}
              >
                <Text variant="button" style={{ color: '#FFFFFF' }}>Confirm {selectedTier.shortName} Plan</Text>
              </Button>
              <Button
                variant="ghost"
                onPress={() => setUpgradeModalVisible(false)}
                style={{ marginTop: 8 }}
              >
                <Text variant="button" color="neutral.600">Cancel</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enterprise Contact Modal */}
      <Modal
        visible={contactModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upgradeModalCard}>
            <View style={[styles.upgradeBadgeIcon, { backgroundColor: '#FAF5FF' }]}>
              <Building2 size={28} color="#7C3AED" />
            </View>

            <Text variant="h5" weight="bold" color="neutral.900" style={{ textAlign: 'center', marginTop: 12 }}>
              Mambo Enterprise Portal
            </Text>
            <Text variant="body" color="neutral.600" style={{ textAlign: 'center', marginTop: 4, paddingHorizontal: 12 }}>
              Custom deployment for large-scale ranches, feedlots, and livestock cooperatives with RFID and Bluetooth hardware support.
            </Text>

            <View style={styles.enterpriseContactCard}>
              <View style={styles.contactRow}>
                <PhoneCall size={16} color={Colors.primary[600]} />
                <Text variant="body" weight="medium" color="neutral.800" style={{ marginLeft: 8 }}>
                  +263 77 123 4567 / +263 242 889900
                </Text>
              </View>
              <View style={[styles.contactRow, { marginTop: 10 }]}>
                <Shield size={16} color={Colors.primary[600]} />
                <Text variant="caption" color="neutral.600" style={{ marginLeft: 8, flex: 1 }}>
                  Dedicated on-site account training, SLA uptime, and custom data migration.
                </Text>
              </View>
            </View>

            <View style={styles.upgradeActions}>
              <Button
                variant="primary"
                onPress={() => {
                  setContactModalVisible(false);
                  Alert.alert('Consultation Requested', 'Our enterprise specialist will call your registered phone within 2 business hours.');
                }}
                style={{ backgroundColor: '#7C3AED' }}
              >
                <Text variant="button" style={{ color: '#FFFFFF' }}>Schedule Enterprise Consultation</Text>
              </Button>
              <Button
                variant="ghost"
                onPress={() => setContactModalVisible(false)}
                style={{ marginTop: 8 }}
              >
                <Text variant="button" color="neutral.600">Close</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
  },
  headerHelpBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
  },
  topSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  summaryCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  summaryColCenter: {
    flex: 1,
    alignItems: 'center',
  },
  summaryColEnd: {
    flex: 1,
    alignItems: 'flex-end',
  },
  billingToggleRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    padding: 3,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  badgeControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sliderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  sliderTouchArea: {
    height: 40,
    justifyContent: 'center',
  },
  sliderTrackBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  sliderThumb: {
    position: 'absolute',
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sliderThumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  presetChipActive: {
    backgroundColor: Colors.primary[100],
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
  },
  tierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tierCard: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
  },
  tierCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  tierCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  activeTierBanner: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeTierBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectPlanCta: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 8,
  },
  matrixTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  colHeader: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  colHeaderTier: {
    width: 90,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  colSelectedHeader: {
    backgroundColor: '#DBEAFE',
  },
  specRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  featureDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  altRow: {
    backgroundColor: '#F8FAFC',
  },
  categoryDividerRow: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cellFeature: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  cellFeatureWithIcon: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellValue: {
    width: 90,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  colSelectedCell: {
    backgroundColor: '#EFF6FF',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    gap: 12,
    marginTop: 6,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureBullet: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footerSpacing: {
    height: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  featureModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  modalBodyText: {
    lineHeight: 20,
    marginBottom: 16,
  },
  modalTierMatrix: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  upgradeModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  upgradeBadgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planSummaryBox: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryItem: {
    alignItems: 'center',
  },
  upgradeActions: {
    width: '100%',
    marginTop: 20,
  },
  enterpriseContactCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
