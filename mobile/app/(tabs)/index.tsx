import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, Text as RNText, Modal, TextInput } from 'react-native';

import { router } from 'expo-router';
import { Heart, Dna, Wheat, BarChart3, ClipboardList, FileEdit, ShoppingCart, User, TrendingUp, ShieldCheck, ChevronDown, ChevronLeft, ChevronRight, Search, X, Check, Settings, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Picker } from '../../components/inputs/Picker';
import { Card } from '../../components/ui/Card';
import Colors from '../../constants/Colors';
import { ColorValue } from 'react-native';
import { useFarmData } from '../../context/FarmDataContext';
import { supabase } from '../../utils/supabase';


interface NavigationCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  route: string;
  color: string;
  gradient: readonly [ColorValue, ColorValue];
}

const speciesEmojis: Record<string, string> = {
  'goats': '🐐',
  'pigs': '🐷',
  'sheep': '🐑',
  'poultry': '🐔',
  'rabbits': '🐇',
  'beef-production': '🐂',
  'dairy-production': '🐄',
  'pen-fattening': '🐑',
};

const species = [
  { label: 'Beef Production', value: 'beef-production' },
  { label: 'Dairy Production', value: 'dairy-production' },
  { label: 'Pen Fattening', value: 'pen-fattening' },
  { label: 'Goats', value: 'goats' },
  { label: 'Pigs', value: 'pigs' },
  { label: 'Sheep', value: 'sheep' },
  { label: 'Poultry', value: 'poultry' },
  { label: 'Rabbits', value: 'rabbits' }
];

// Sample DLShift data for the chart
const dlshiftMonthlyData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      data: [65, 72, 68, 75, 82, 78, 80, 85, 82, 78, 80, 83],
    },
  ],
};

const dlshiftYearlyData = {
  labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
  datasets: [
    {
      data: [58, 65, 70, 72, 78, 82, 85],
    },
  ],
};

const categoryScores = {
  labels: ['Nutrition', 'Records', 'Genetics', 'Production', 'Health'],
  datasets: [
    {
      data: [85, 78, 92, 75, 88],
    },
  ],
};

const averageCategoryScore = Math.round(
  categoryScores.datasets[0].data.reduce((a, b) => a + b, 0) / 
  categoryScores.datasets[0].data.length
);

const navigationCards: NavigationCard[] = [
  {
    id: 'health',
    title: 'Health',
    icon: <Heart size={24} color={Colors.white} />,
    description: 'Monitor animal health and medical records',
    route: '/screens/health',
    color: Colors.error[500],
    gradient: [Colors.error[400], Colors.error[600]],
  },
  {
    id: 'genetics',
    title: 'Genetics',
    icon: <Dna size={24} color={Colors.white} />,
    description: 'Track breeding and genetic information',
    route: '/screens/genetics',
    color: Colors.primary[500],
    gradient: [Colors.primary[400], Colors.primary[600]],
  },
  {
    id: 'production',
    title: 'Production',
    icon: <BarChart3 size={24} color={Colors.white} />,
    description: 'Monitor growth and production metrics',
    route: '/screens/production',
    color: Colors.success[500],
    gradient: [Colors.success[400], Colors.success[600]],
  },
  {
    id: 'records',
    title: 'Records',
    icon: <ClipboardList size={24} color={Colors.white} />,
    description: 'Access and manage farm records',
    route: '/screens/records',
    color: Colors.secondary[500],
    gradient: [Colors.secondary[400], Colors.secondary[600]],
  },
  {
    id: 'nutrition',
    title: 'Nutrition',
    icon: <Wheat size={24} color={Colors.white} />,
    description: 'Manage feed and nutritional programs',
    route: '/screens/nutrition',
    color: Colors.accent[500],
    gradient: [Colors.accent[400], Colors.accent[600]],
  },
  {
    id: 'register',
    title: 'Register',
    icon: <FileEdit size={24} color={Colors.white} />,
    description: 'Register new animals and records',
    route: '/screens/register',
    color: Colors.neutral[500],
    gradient: [Colors.neutral[400], Colors.neutral[600]],
  },
  {
    id: 'workers',
    title: 'Workers',
    icon: <Users size={24} color={Colors.white} />,
    description: 'Manage farm workers and access',
    route: '/profile',
    color: '#8E44AD',
    gradient: ['#9B59B6', '#8E44AD'],
  },
  {
    id: 'tasks',
    title: 'Tasks',
    icon: <ClipboardList size={24} color={Colors.white} />,
    description: 'View and manage farm events/tasks',
    route: '/tasks',
    color: Colors.secondary[600],
    gradient: [Colors.secondary[500], Colors.secondary[700]],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: <ShoppingCart size={24} color={Colors.white} />,
    description: 'Buy, sell, and trade livestock',
    route: '/screens/marketplace',
    color: Colors.success[600],
    gradient: [Colors.success[500], Colors.success[700]],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <Settings size={24} color={Colors.white} />,
    description: 'Manage farm profile and account settings',
    route: '/profile',
    color: Colors.neutral[600],
    gradient: [Colors.neutral[500], Colors.neutral[700]],
  },
];

function CustomLineChart({ data, width, height }: { data: any; width: number; height: number }) {
  const dataset = data.datasets[0].data;
  const labels = data.labels;
  const maxVal = Math.max(...dataset, 100);
  const minVal = Math.min(...dataset, 0);
  const range = maxVal - minVal;

  return (
    <View style={{ width, height, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 }}>
      {dataset.map((val: number, idx: number) => {
        const barHeight = val > 0 ? ((val - minVal) / (range || 1)) * (height - 60) + 10 : 0;
        return (
          <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
            <Text variant="caption" color="primary.500" style={{ fontSize: 9, marginBottom: 4, fontWeight: '600' }}>
              {val}%
            </Text>
            <View style={{ width: 8, height: barHeight, backgroundColor: Colors.primary[500], borderRadius: 4 }} />
            <Text variant="caption" color="neutral.500" style={{ fontSize: 8, marginTop: 4 }}>
              {labels[idx]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CustomBarChart({ data, width, height }: { data: any; width: number; height: number }) {
  const dataset = data.datasets[0].data;
  const labels = data.labels;
  const maxVal = 100;

  return (
    <View style={{ width, height, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 16, paddingBottom: 16 }}>
      {dataset.map((val: number, idx: number) => {
        const barHeight = val > 0 ? (val / maxVal) * (height - 60) + 10 : 0;
        return (
          <View key={idx} style={{ alignItems: 'center', width: 55 }}>
            <Text variant="caption" color={val < 50 ? 'error.500' : val < 75 ? 'warning.500' : 'success.500'} style={{ fontSize: 10, marginBottom: 4, fontWeight: '600' }}>
              {val}%
            </Text>
            <View style={{ width: 16, height: barHeight, backgroundColor: val < 50 ? Colors.error[500] : val < 75 ? Colors.warning[500] : Colors.success[500], borderRadius: 4 }} />
            <Text variant="caption" color="neutral.600" style={{ fontSize: 9, marginTop: 6, textAlign: 'center' }}>
              {labels[idx]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const { metrics, animals, profile, farmers, selectedFarmer, setSelectedFarmer, todoList, mortalityRecords, selectedProductionYear, setSelectedProductionYear } = useFarmData();
  const aliveAnimals = React.useMemo(() => {
    if (!animals) return [];
    const deadTags = new Set(mortalityRecords ? mortalityRecords.map(m => m.animalId).filter(Boolean) : []);
    return animals.filter(a => !deadTags.has(a.tag));
  }, [animals, mortalityRecords]);
  const currentDLShiftScore = metrics.scoreDLShift;
  const isAdmin = profile?.role === 'admin';

  const [yearlyPerformances, setYearlyPerformances] = useState<any[]>([]);
  const [compareYear, setCompareYear] = useState<number>(2025);

  const targetUserId = isAdmin ? selectedFarmer?.id : (profile?.role === 'worker' ? profile?.farmer_id : profile?.id);

  useEffect(() => {
    if (!targetUserId || !supabase) return;
    supabase.from('yearly_performance').select('*').eq('user_id', targetUserId)
      .then(({ data }) => {
        setYearlyPerformances(data ?? []);
      });
  }, [targetUserId]);

  const avgWeaningWeight = useMemo(() => {
    const isCalfLocal = (age: string | null | undefined, stockType?: string | null) => {
      if (stockType === 'Calve' || (stockType as string) === 'Calf') return true;
      if (!age) return false;
      const ageMatch = age.match(/(\d+)([ym])/);
      if (!ageMatch) return false;
      const [_, value, unit] = ageMatch;
      return (unit === 'm' && parseInt(value) < 12) || (unit === 'y' && parseInt(value) === 0);
    };
    const calvesWithWeight = aliveAnimals.filter(a => isCalfLocal(a.age, a.stockType) && Number(a.weaningWeight || 0) > 0);
    return calvesWithWeight.length > 0
      ? calvesWithWeight.reduce((sum, a) => sum + Number(a.weaningWeight), 0) / calvesWithWeight.length
      : 0;
  }, [aliveAnimals]);

  const displayCards = React.useMemo(() => {
    let cards = [...navigationCards];
    if (profile?.role === 'worker') {
      cards = cards.filter(card => card.id !== 'marketplace');
    }
    if (isAdmin) {
      return cards.map(card => {
        if (card.id === 'settings') {
          return {
            id: 'livestock-pro',
            title: 'Livestock Pro',
            icon: <ShieldCheck size={24} color={Colors.white} />,
            description: 'Manage admin missions and coverage tracking',
            route: '/screens/livestock_pro',
            color: '#8E44AD',
            gradient: ['#9B59B6', '#8E44AD'] as const,
          };
        }
        return card;
      });
    }
    return cards;
  }, [isAdmin, profile?.role]);

  const displayName = profile?.full_name || profile?.email || 'Farmer';
  const viewingName = isAdmin && selectedFarmer
    ? (selectedFarmer.full_name || selectedFarmer.email || 'Farmer')
    : displayName;
  const currentCategoryScores = [
    metrics.scoreNutrition,
    metrics.scoreRecords,
    metrics.scoreGenetics,
    metrics.scoreProduction,
    metrics.scoreHealth
  ];

  const currentCategoryData = {
    labels: ['Nutrition', 'Records', 'Genetics', 'Production', 'Health'],
    datasets: [
      {
        data: currentCategoryScores,
      },
    ],
  };

  const isDemo = targetUserId === '76408c11-021a-4fdd-a17c-6b90065182b7';

  const dynamicMonthlyData = {
    ...dlshiftMonthlyData,
    datasets: [
      {
        data: isDemo
          ? [65, 72, 68, 75, 82, 78, 80, 85, 82, 78, 80, currentDLShiftScore]
          : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, currentDLShiftScore],
      },
    ],
  };

  const dynamicYearlyData = {
    ...dlshiftYearlyData,
    datasets: [
      {
        data: isDemo
          ? [58, 65, 70, 72, 78, 82, currentDLShiftScore]
          : [0, 0, 0, 0, 0, 0, currentDLShiftScore],
      },
    ],
  };

  console.log("DEBUG - HomeScreen Components:");
  console.log("  Text:", typeof Text !== 'undefined' ? Text : 'UNDEFINED');
  console.log("  ScreenContainer:", typeof ScreenContainer !== 'undefined' ? ScreenContainer : 'UNDEFINED');
  console.log("  Picker:", typeof Picker !== 'undefined' ? Picker : 'UNDEFINED');
  console.log("  Card:", typeof Card !== 'undefined' ? Card : 'UNDEFINED');
  console.log("  CustomBarChart:", typeof CustomBarChart !== 'undefined' ? CustomBarChart : 'UNDEFINED');
  console.log("  CustomLineChart:", typeof CustomLineChart !== 'undefined' ? CustomLineChart : 'UNDEFINED');
  console.log("  LinearGradient:", typeof LinearGradient !== 'undefined' ? LinearGradient : 'UNDEFINED');

  // Verify navigationCards icons are valid react elements with defined types
  navigationCards.forEach((item) => {
    if (React.isValidElement(item.icon)) {
      if (typeof item.icon.type === 'undefined' || item.icon.type === null) {
        throw new Error(`CRITICAL RUNTIME ERROR: Icon for card "${item.id}" is undefined. Lucide import failed.`);
      }
    } else {
      throw new Error(`CRITICAL RUNTIME ERROR: Icon for card "${item.id}" is not a valid React element.`);
    }
  });

  const [selectedSpecies, setSelectedSpecies] = useState<string>('beef-production');
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const goToSlide = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: index * (Dimensions.get('window').width - 32), animated: true });
      setActiveSlide(index);
    }
  };
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');
  const [isFarmerModalVisible, setIsFarmerModalVisible] = useState(false);
  const [farmerSearchQuery, setFarmerSearchQuery] = useState('');
  const [farmerSortBy, setFarmerSortBy] = useState<'name' | 'farm' | 'email'>('name');
  const [farmerSortAsc, setFarmerSortAsc] = useState(true);

  const filteredFarmers = React.useMemo(() => {
    const query = farmerSearchQuery.toLowerCase();
    const filtered = farmers.filter(f => {
      const name = (f.full_name || '').toLowerCase();
      const email = (f.email || '').toLowerCase();
      const farm = (f.farm_name || '').toLowerCase();
      return name.includes(query) || email.includes(query) || farm.includes(query);
    });
    return [...filtered].sort((a, b) => {
      let valA = '', valB = '';
      if (farmerSortBy === 'name') {
        valA = a.full_name || '';
        valB = b.full_name || '';
      } else if (farmerSortBy === 'farm') {
        valA = a.farm_name || '';
        valB = b.farm_name || '';
      } else {
        valA = a.email || '';
        valB = b.email || '';
      }
      const cmp = valA.localeCompare(valB);
      return farmerSortAsc ? cmp : -cmp;
    });
  }, [farmers, farmerSearchQuery, farmerSortBy, farmerSortAsc]);

  const getFilteredAnimalsCount = () => {
    if (selectedSpecies === 'beef-production') {
      return aliveAnimals.filter(a => a.stockType === 'Cow' || a.stockType === 'Heifer' || a.stockType === 'Bull' || a.stockType === 'Steer' || a.stockType === 'Calve' || (a.stockType as string) === 'Calf').length;
    }
    if (selectedSpecies === 'dairy-production') {
      return aliveAnimals.filter(a => a.stockType === 'Cow' || a.stockType === 'Heifer' || a.stockType === 'Calve' || (a.stockType as string) === 'Calf').length;
    }
    if (selectedSpecies === 'goats') {
      return aliveAnimals.filter(a => a.stockType === 'Goat').length;
    }
    if (selectedSpecies === 'pigs') {
      return aliveAnimals.filter(a => a.stockType === 'Pig').length;
    }
    if (selectedSpecies === 'sheep' || selectedSpecies === 'pen-fattening') {
      return aliveAnimals.filter(a => a.stockType === 'Sheep').length;
    }
    if (selectedSpecies === 'poultry') {
      return aliveAnimals.filter(a => a.stockType === 'Chicken').length;
    }
    return aliveAnimals.length;
  };

  const renderNavigationCard = ({ item }: { item: NavigationCard }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.navCardContainer}
      onPress={() => router.push(item.route as any)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardIcon}>{item.icon}</View>
          <View style={styles.cardTextContent}>
            <Text variant="h6" weight="bold" color="white" style={styles.cardTitle}>
              {item.title}
            </Text>
            <Text variant="caption" color="white" style={[styles.cardDescription, { opacity: 0.9 }]}>
              {item.description}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer style={styles.container} scrollable={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.userInfoContainer}>
            <View style={[styles.avatar, isAdmin && { backgroundColor: Colors.primary[50] }]}>
              {isAdmin
                ? <ShieldCheck size={24} color={Colors.primary[600]} />
                : <User size={24} color={Colors.neutral[700]} />}
            </View>
            <View style={styles.userTextContainer}>
              <Text variant="body2" color="neutral.600">
                {isAdmin ? '🛡️ Admin Portal' : profile?.farm_name ? `🐄 ${profile.farm_name}` : 'Welcome back,'}
              </Text>
              <Text variant="h5" weight="bold">
                {displayName}
              </Text>
            </View>
          </View>
          <View style={styles.headerIcons} />
        </View>

        {/* Admin Farmer Selector Panel */}
        {isAdmin && (
          <TouchableOpacity 
            style={styles.adminBanner}
            onPress={() => setIsFarmerModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.adminBannerLeft}>
              <View style={styles.adminIndicator}>
                <ShieldCheck size={16} color={Colors.primary[600]} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text variant="caption" color="neutral.500" weight="medium">
                  ADMIN VIEWING PORTAL
                </Text>
                <Text variant="body" color="neutral.900" weight="bold">
                  {viewingName}{selectedFarmer?.farm_name ? ` (🐄 ${selectedFarmer.farm_name})` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.adminBannerRight}>
              <Text variant="caption" color="primary.600" weight="bold" style={{ marginRight: 4 }}>
                Change
              </Text>
              <ChevronDown size={16} color={Colors.primary[600]} />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.summaryContainer}>
          <LinearGradient
            colors={[Colors.primary[400], Colors.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryContent}>
              <View>
                <Text variant="h3" weight="bold" color="white">
                  {getFilteredAnimalsCount()} {speciesEmojis[selectedSpecies] || '🐂'}
                </Text>
                <Text variant="body" color="white" style={{ opacity: 0.9 }}>
                  {species.find(s => s.value === selectedSpecies)?.label || 'Animals'}
                </Text>
              </View>
              <View>
                <Text variant="h3" weight="bold" color="white">
                  {todoList.length}
                </Text>
                <Text variant="body" color="white" style={{ opacity: 0.9 }}>
                  Tasks Today
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={[styles.filterContainer, { flexDirection: 'row', gap: 12 }]}>
          <View style={{ flex: 1 }}>
            <Picker
              label="Select Species"
              value={selectedSpecies}
              onValueChange={setSelectedSpecies}
              items={species}
              style={styles.speciesPicker}
            />
          </View>
          <View style={{ width: 130 }}>
            <Picker
              label="Cycle Year"
              value={selectedProductionYear.toString()}
              onValueChange={(val) => setSelectedProductionYear(parseInt(val))}
              items={[
                { label: '2025 Cycle', value: '2025' },
                { label: '2026 Cycle', value: '2026' },
                { label: '2027 Cycle', value: '2027' },
                { label: '2028 Cycle', value: '2028' },
              ]}
            />
          </View>
        </View>

        <Card style={styles.dlshiftCard}>
          <View style={styles.dlshiftHeader}>
            <View>
              <Text variant="h6" weight="bold">
                Livestock Shift Score
              </Text>
              <Text variant="h3" weight="bold" color="primary.500" style={styles.dlshiftScore}>
                {currentDLShiftScore}%
              </Text>
            </View>
            {isDemo && (
              <View style={styles.dlshiftTrend}>
                <TrendingUp size={20} color={Colors.success[500]} />
                <Text variant="caption" color="success.500">
                  +5% this month
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.timeframeSelector}>
            <TouchableOpacity
              onPress={() => setTimeframe('monthly')}
              style={[
                styles.timeframeButton,
                timeframe === 'monthly' && styles.activeTimeframe,
              ]}
            >
              <Text color={timeframe === 'monthly' ? 'primary.500' : 'neutral.600'}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTimeframe('yearly')}
              style={[
                styles.timeframeButton,
                timeframe === 'yearly' && styles.activeTimeframe,
              ]}
            >
              <Text color={timeframe === 'yearly' ? 'primary.500' : 'neutral.600'}>Yearly</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.carouselContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const slide = Math.round(event.nativeEvent.contentOffset.x / (Dimensions.get('window').width - 32));
                setActiveSlide(slide);
              }}
              scrollEventThrottle={16}
            >
              <View key="line-chart" style={styles.chartContainer}>
                <CustomLineChart
                  data={timeframe === 'monthly' ? dynamicMonthlyData : dynamicYearlyData}
                  width={Dimensions.get('window').width - 70}
                  height={180}
                />
              </View>
              
              <View key="bar-chart" style={styles.chartContainer}>
                <CustomBarChart
                  data={currentCategoryData}
                  width={Dimensions.get('window').width - 100}
                  height={180}
                />
              </View>
            </ScrollView>

            
            <View style={[styles.paginationContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }]}>
              <TouchableOpacity 
                onPress={() => goToSlide(Math.max(0, activeSlide - 1))} 
                activeOpacity={0.7} 
                style={{ 
                  padding: 8, 
                  backgroundColor: activeSlide > 0 ? Colors.primary[50] : 'transparent',
                  borderRadius: 20
                }}
              >
                <ChevronLeft size={24} color={activeSlide > 0 ? Colors.primary[600] : Colors.neutral[300]} />
              </TouchableOpacity>
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[0, 1].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      activeSlide === index && styles.paginationDotActive,
                      { marginHorizontal: 0 }
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity 
                onPress={() => goToSlide(Math.min(1, activeSlide + 1))} 
                activeOpacity={0.7} 
                style={{ 
                  padding: 8, 
                  backgroundColor: activeSlide < 1 ? Colors.primary[50] : 'transparent',
                  borderRadius: 20
                }}
              >
                <ChevronRight size={24} color={activeSlide < 1 ? Colors.primary[600] : Colors.neutral[300]} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* YoY Performance Comparison Section */}
        {yearlyPerformances.length > 0 && (() => {
          const comparePerformance = yearlyPerformances.find(p => p.year === compareYear);

          const renderCompareCard = (label: string, curVal: number, compVal: number | undefined, unit: string = '', isLowerBetter: boolean = false) => {
            const formattedCur = curVal ? curVal.toFixed(1) : '0.0';
            const formattedComp = compVal !== undefined ? compVal.toFixed(1) : '—';

            let trend = 'same';
            let diff = 0;
            if (compVal !== undefined && compVal > 0) {
              diff = curVal - compVal;
              if (diff > 0.05) trend = isLowerBetter ? 'bad' : 'good';
              else if (diff < -0.05) trend = isLowerBetter ? 'good' : 'bad';
            }

            return (
              <View style={styles.compareItem}>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color="neutral.500" weight="bold">
                    {label}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4, gap: 6 }}>
                    <Text variant="body" weight="bold" color="neutral.900" style={{ fontSize: 14 }}>
                      {formattedCur}{unit}
                    </Text>
                    <Text variant="caption" color="neutral.400" style={{ fontSize: 10 }}>
                      vs {formattedComp}{unit}
                    </Text>
                  </View>
                </View>
                {trend !== 'same' && (
                  <View style={[
                    styles.trendBadge,
                    trend === 'good' ? styles.trendBadgeGood : styles.trendBadgeBad
                  ]}>
                    <Text variant="caption" weight="bold" color={trend === 'good' ? 'success.600' : 'error.600'} style={{ fontSize: 9 }}>
                      {trend === 'good' ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}{unit}
                    </Text>
                  </View>
                )}
              </View>
            );
          };

          return (
            <Card style={styles.yoyCard}>
              <View style={styles.yoyHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text variant="h6" weight="bold">
                    YoY Performance
                  </Text>
                  <Text variant="caption" color="neutral.500" style={{ fontSize: 11 }}>
                    Compare active cycle metrics with historical years
                  </Text>
                </View>
                <View style={{ width: 110 }}>
                  <Picker
                    label="Compare"
                    value={compareYear.toString()}
                    onValueChange={(val) => setCompareYear(parseInt(val))}
                    items={[
                      { label: 'vs 2025', value: '2025' },
                      { label: 'vs 2026', value: '2026' },
                      { label: 'vs 2027', value: '2027' },
                      { label: 'vs 2028', value: '2028' },
                    ]}
                  />
                </View>
              </View>

              {comparePerformance ? (
                <View style={styles.compareGrid}>
                  {renderCompareCard('Conception Rate', metrics.conceptionRate || 0, comparePerformance.conception_rate, '%')}
                  {renderCompareCard('Calving Rate', metrics.calvingPercentage || 0, comparePerformance.calving_rate, '%')}
                  {renderCompareCard('Mortality Rate', metrics.mortalityRates?.herd || 0, comparePerformance.mortality_rate, '%', true)}
                  {renderCompareCard('Avg Weaning Weight', avgWeaningWeight, comparePerformance.avg_weaning_weight, ' kg')}
                  {renderCompareCard('Feed Conv (FCR)', metrics.fcr?.cattle || 0, comparePerformance.fcr, '', true)}
                  {renderCompareCard('Weaning Percentage', metrics.weaningPercentage || 0, comparePerformance.weaning_percentage, '%')}
                </View>
              ) : (
                <View style={styles.emptyCompare}>
                  <Text variant="body" color="neutral.500" align="center">
                    No historical data available for comparison year {compareYear}.
                  </Text>
                </View>
              )}
            </Card>
          );
        })()}

        <Text variant="h5" weight="bold" style={styles.sectionTitle}>
          Quick Access
        </Text>
        
        <View style={styles.gridContainer}>
          {displayCards.map((item) => renderNavigationCard({ item }))}
        </View>
      </ScrollView>
      {/* Farmer Selection Modal */}
      <Modal
        visible={isFarmerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsFarmerModalVisible(false);
          setFarmerSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h5" weight="bold" color="neutral.900">
                Select Farmer Portal
              </Text>
              <TouchableOpacity onPress={() => {
                setIsFarmerModalVisible(false);
                setFarmerSearchQuery('');
              }}>
                <X size={20} color={Colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Search size={18} color={Colors.neutral[400]} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search farmers by name or email..."
                placeholderTextColor={Colors.neutral[400]}
                value={farmerSearchQuery}
                onChangeText={setFarmerSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {farmerSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setFarmerSearchQuery('')}>
                  <X size={16} color={Colors.neutral[400]} />
                </TouchableOpacity>
              )}
            </View>

            {/* Sort controls */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
              <RNText style={{ fontSize: 12, color: Colors.neutral[500], fontWeight: '500', marginRight: 4 }}>Sort by:</RNText>
              {(['name', 'farm', 'email'] as const).map((key) => {
                const label = key === 'name' ? 'Name' : key === 'farm' ? 'Farm Name' : 'Email';
                const isActive = farmerSortBy === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      if (farmerSortBy === key) {
                        setFarmerSortAsc(prev => !prev);
                      } else {
                        setFarmerSortBy(key);
                        setFarmerSortAsc(true);
                      }
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: isActive ? Colors.primary[50] : Colors.neutral[100],
                      borderWidth: 1,
                      borderColor: isActive ? Colors.primary[300] : Colors.neutral[200],
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <RNText style={{ fontSize: 12, color: isActive ? Colors.primary[700] : Colors.neutral[600], fontWeight: isActive ? '600' : '400' }}>
                      {label} {isActive ? (farmerSortAsc ? '↑' : '↓') : ''}
                    </RNText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Scrollable list */}
            <ScrollView style={styles.farmerList} showsVerticalScrollIndicator={false}>
              {filteredFarmers.length === 0 ? (
                <View style={styles.emptySearch}>
                  <Text variant="body" color="neutral.500" align="center">
                    No farmers found matching "{farmerSearchQuery}"
                  </Text>
                </View>
              ) : (
                filteredFarmers.map((f) => {
                  const isSelected = selectedFarmer?.id === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.farmerItem,
                        isSelected && styles.farmerItemSelected
                      ]}
                      onPress={() => {
                        setSelectedFarmer(f);
                        setIsFarmerModalVisible(false);
                        setFarmerSearchQuery('');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.farmerItemInfo}>
                        <Text variant="body" weight="bold" color={isSelected ? 'primary.600' : 'neutral.900'}>
                          {f.full_name || 'Farmer'}
                        </Text>
                        {f.farm_name && (
                          <Text variant="caption" color="neutral.600">
                            🐄 {f.farm_name}
                          </Text>
                        )}
                        <Text variant="caption" color="neutral.500">
                          {f.email}
                        </Text>
                      </View>
                      {isSelected && (
                        <Check size={18} color={Colors.primary[600]} />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary[100],
    shadowColor: Colors.primary[300],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  adminBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: Colors.neutral[900],
    fontSize: 15,
    fontWeight: '500',
  },
  farmerList: {
    marginBottom: 8,
  },
  emptySearch: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  farmerItemSelected: {
    borderBottomColor: Colors.primary[100],
  },
  farmerItemInfo: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: Platform.select({
      android: 16,
      default: 8,
    }),
    paddingHorizontal: 16,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTextContainer: {
    justifyContent: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  notificationBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error[500],
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  summaryGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  speciesPicker: {
    width: '100%',
  },
  dlshiftCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    overflow: 'hidden',
  },
  carouselContainer: {
    marginTop: 8,
    marginHorizontal:-35
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  averageScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral[300],
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary[500],
    width: 16,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeTimeframe: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dlshiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dlshiftScore: {
    marginTop: 8,
  },
  dlshiftTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success[50],
    padding: 8,
    borderRadius: 8,
  },
  chartContainer: {
    marginRight:35,
    marginVertical:8
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 100, // Add padding for the tab bar
  },
  navCardContainer: {
    width: '50%',
    padding: 4,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    height: Platform.OS === 'android' ? 152 : 140, // Fixed height for all cards (increased on Android to avoid text cutting)
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: Platform.OS === 'android' ? 10.5 : 12,
    lineHeight: Platform.OS === 'android' ? 14 : 16,
  },
  yoyCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
  },
  yoyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  compareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  compareItem: {
    width: '48.5%',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 8,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendBadgeGood: {
    backgroundColor: '#E8F8F5',
  },
  trendBadgeBad: {
    backgroundColor: '#FDEDEC',
  },
  emptyCompare: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});