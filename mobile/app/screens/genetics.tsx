import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { PieChart } from '../../components/charts/PieChart';
import { ProgressIndicator } from '../../components/metrics/ProgressIndicator';
import Colors from '../../constants/Colors';
import { useFarmData } from '../../context/FarmDataContext';


export default function GeneticsScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Genetics & Production',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 }}
            >
              <ChevronLeft size={22} color={Colors.neutral[800]} />
              <Text variant="body" weight="medium" color={Colors.neutral[800]} style={{ marginLeft: 2 }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <GeneticsContent />
    </>
  );
}

function GeneticsContent() {
  const [activeTab, setActiveTab] = useState('herds');
  const { animals, breedingRecords, pregnancyRecords, metrics } = useFarmData();

  // 1. Breeding Herd Composition
  const cowCount = animals.filter(a => a.stockType === 'Cow').length;
  const heiferCount = animals.filter(a => a.stockType === 'Heifer').length;
  const totalBreedables = cowCount + heiferCount;
  
  const breedingHerdData = [
    {
      population: totalBreedables > 0 ? Math.round((cowCount / totalBreedables) * 100) : 0,
      name: 'Cows',
      color: Colors.primary[500],
      legendFontColor: Colors.neutral[700],
    },
    {
      name: 'Heifers',
      population: totalBreedables > 0 ? Math.round((heiferCount / totalBreedables) * 100) : 0,
      color: Colors.secondary[500],
      legendFontColor: Colors.neutral[700],
    },
  ];

  // 2. Breed Distribution
  const breedCounts: Record<string, number> = {};
  animals.forEach(a => {
    const b = a.breed || 'Unknown';
    breedCounts[b] = (breedCounts[b] || 0) + 1;
  });
  const chartColors = [Colors.primary[500], Colors.secondary[500], Colors.accent[500], Colors.success[500], Colors.neutral[500]];
  const breedDistributionData = animals.length > 0 ? Object.keys(breedCounts).map((breed, idx) => ({
    name: breed,
    population: breedCounts[breed],
    color: chartColors[idx % chartColors.length],
    legendFontColor: Colors.neutral[700],
  })) : [
    {
      name: 'No Animals',
      population: 0,
      color: Colors.neutral[300],
      legendFontColor: Colors.neutral[700],
    }
  ];

  // 3. BCS Distribution
  const animalsWithBCS = animals.filter(a => a.bcs !== undefined);
  const totalWithBCS = animalsWithBCS.length;
  let b1_2 = 0, b2_3 = 0, b3_4 = 0, b4_5 = 0;
  animalsWithBCS.forEach(a => {
    const score = a.bcs || 0;
    if (score >= 1.0 && score < 2.0) b1_2++;
    else if (score >= 2.0 && score < 3.0) b2_3++;
    else if (score >= 3.0 && score < 4.0) b3_4++;
    else if (score >= 4.0 && score <= 5.0) b4_5++;
  });
  
  const bcsDistribution = totalWithBCS > 0 ? [
    { score: '1-2', percentage: Math.round((b1_2 / totalWithBCS) * 100) },
    { score: '2-3', percentage: Math.round((b2_3 / totalWithBCS) * 100) },
    { score: '3-4', percentage: Math.round((b3_4 / totalWithBCS) * 100) },
    { score: '4-5', percentage: Math.round((b4_5 / totalWithBCS) * 100) },
  ] : [
    { score: '1-2', percentage: 0 },
    { score: '2-3', percentage: 0 },
    { score: '3-4', percentage: 0 },
    { score: '4-5', percentage: 0 },
  ];

  // 4. Pregnancy Statistics
  const totalServed = breedingRecords.filter(b => b.servicedDate).length;
  const totalIncalf = breedingRecords.filter(b => b.breedingStatus === 'Confirmed Pregnant').length;
  const t1 = pregnancyRecords.filter(p => p.firstTrimesterPD === 'Positive').length;
  const t2 = pregnancyRecords.filter(p => p.secondTrimesterPD === 'Positive').length;
  const t3 = pregnancyRecords.filter(p => p.thirdTrimesterPD === 'Positive').length;

  const renderBreedingHerds = () => (
    <>
      <Card style={styles.card}>
        <Text variant="h5" weight="medium" style={styles.cardTitle}>
          Herd Composition
        </Text>
        <PieChart data={breedingHerdData} height={200} />
      </Card>

      <Card style={styles.card}>
        <Text variant="h5" weight="medium" style={styles.cardTitle}>
          Body Condition Score (BCS)
        </Text>
        <View style={styles.bcsContainer}>
          <View style={styles.bcsHeader}>
            <View>
              <Text variant="body2" color="neutral.600">
                Average BCS
              </Text>
              <Text variant="h3" weight="bold" color="primary.500">
                {metrics.averageHerdBCS}
              </Text>
            </View>
            <View>
              <Text variant="body2" color="neutral.600">
                Target Range
              </Text>
              <Text variant="h5" weight="medium" color="success.500">
                2.0 - 4.0
              </Text>
            </View>
          </View>

          <View style={styles.bcsDistribution}>
            {bcsDistribution.map((item, index) => (
              <View key={index} style={styles.bcsItem}>
                <Text variant="caption" color="neutral.600" style={styles.bcsLabel}>
                  BCS {item.score}
                </Text>
                <View style={styles.bcsBarWrapper}>
                  <ProgressIndicator
                    label=""
                    value={item.percentage}
                    max={100}
                    size="sm"
                    color={Colors.primary[500]}
                    showHeader={false}
                    style={{ marginVertical: 0 }}
                  />
                </View>
                <Text variant="caption" color="neutral.600" style={styles.bcsPercent}>
                  {item.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </>
  );

  const renderBreeds = () => (
    <Card style={styles.card}>
      <Text variant="h5" weight="medium" style={styles.cardTitle}>
        Breed Distribution
      </Text>
      <PieChart data={breedDistributionData} height={250} />
    </Card>
  );

  const renderPregnancy = () => (
    <Card style={styles.card}>
      <Text variant="h5" weight="medium" style={styles.cardTitle}>
        Pregnancy Statistics
      </Text>
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Total Served:
          </Text>
          <Text variant="body">{totalServed}</Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Total Incalf:
          </Text>
          <Text variant="body">{totalIncalf}</Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Conception Rate:
          </Text>
          <Text variant="body" color={metrics.conceptionRate >= 65 ? 'success.500' : 'error.500'} weight="bold">
            {metrics.conceptionRate}%
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            42-Day Incalf Rate:
          </Text>
          <Text variant="body" color="primary.500">
            {metrics.pregnancyRate42d}%
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            100-Day Incalf Rate:
          </Text>
          <Text variant="body" color="primary.500">
            {metrics.pregnancyRate200d}%
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Trimester PDs (1st|2nd|3rd):
          </Text>
          <Text variant="body">{t1} | {t2} | {t3}</Text>
        </View>
      </View>
    </Card>
  );

  const renderCalving = () => (
    <Card style={styles.card}>
      <Text variant="h5" weight="medium" style={styles.cardTitle}>
        Calving Performance
      </Text>
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Calving Interval:
          </Text>
          <Text variant="body">365 days</Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Calving Rate (3-week):
          </Text>
          <Text variant="body" color="success.500">
            {metrics.calvingRate21d}%
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Calf Mortality:
          </Text>
          <Text variant="body" color="error.500">
            {metrics.mortalityRates.preWeaning}%
          </Text>
        </View>
      </View>
    </Card>
  );


  const renderBullsAndBreedingSoundness = () => {
    const router = useRouter();
    const { bullBreedingRecords } = useFarmData();
    
    const handleBullPress = (bullId: string) => {
      // Navigate to register screen with the bull's ID as a parameter
      router.push({
        pathname: '/screens/register',
        params: { scrollToBull: bullId }
      } as any);
    };

    const bullAnimals = animals.filter(a => a.stockType === 'Bull');
    const totalBulls = bullAnimals.length;
    
    const bullDistributionData = totalBulls > 0 ? [
      { name: 'Weaners', population: animals.filter(a => a.stockType === 'Bull' && (a.age.includes('m') && parseInt(a.age) < 12)).length || 1, color: Colors.primary[300], legendFontColor: Colors.neutral[700] },
      { name: 'Mature', population: animals.filter(a => a.stockType === 'Bull' && (!a.age.includes('m') || parseInt(a.age) >= 12)).length || 2, color: Colors.primary[600], legendFontColor: Colors.neutral[700] }
    ] : [
      { name: 'Weaners', population: 0, color: Colors.primary[300], legendFontColor: Colors.neutral[700] },
      { name: 'Mature', population: 0, color: Colors.primary[600], legendFontColor: Colors.neutral[700] }
    ];

    const mappedBulls = bullBreedingRecords.map(b => ({
      id: b.bullId,
      date: b.date,
      category: b.classification === 'SPB' ? 'Satisfactory Potential Breeder' :
                b.classification === 'USPB' ? 'Un-Satisfactory Potential Breeder' :
                'Classification Deferred',
      status: b.classification === 'SPB' ? 'green' :
              b.classification === 'USPB' ? 'red' :
              'amber'
    }));

    return (
      <Card style={styles.card}>
        <Text variant="h5" weight="medium" style={styles.cardTitle}>
          Bulls and Breeding Soundness
        </Text>
        
        <View style={{ marginBottom: 20 }}>
          <Text variant="h6" style={{ marginBottom: 10 }}>Bull Distribution</Text>
          <PieChart 
            data={bullDistributionData} 
            height={180} 
          />
        </View>

        <Text variant="h6" style={{ marginBottom: 10 }}>Bull Breeding Soundness</Text>
        {mappedBulls.length === 0 ? (
          <View style={{ padding: 16, alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.neutral[200], borderRadius: 8 }}>
            <Text variant="body2" color="neutral.500">No breeding soundness records available.</Text>
          </View>
        ) : (
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text variant="caption" weight="medium" style={[styles.tableCell, { flex: 2 }]}>
                Date
              </Text>
              <Text variant="caption" weight="medium" style={[styles.tableCell, { flex: 1.5 }]}>
                Bull ID
              </Text>
              <Text variant="caption" weight="medium" style={[styles.tableCell, { flex: 2.5 }]}>
                Category
              </Text>
              <Text variant="caption" weight="medium" style={[styles.tableCell, { flex: 1 }]}>
                Status
              </Text>
            </View>

            {/* Table Rows */}
            {mappedBulls.map((bull, index, array) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.tableRow,
                  index === array.length - 1 && styles.tableRowLast
                ]}
                onPress={() => handleBullPress(bull.id)}
                activeOpacity={0.7}
              >
                <Text variant="caption" style={[styles.tableCell, { flex: 2 }]}>
                  {bull.date}
                </Text>
                <Text variant="caption" style={[styles.tableCell, { flex: 1.5, fontWeight: '600' }]}>
                  {bull.id}
                </Text>
                <Text variant="caption" style={[styles.tableCell, { flex: 2.5 }]}>
                  {bull.category}
                </Text>
                <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
                  <View style={[
                    styles.statusDot,
                    { 
                      backgroundColor: 
                        bull.status === 'green' ? Colors.success[500] :
                        bull.status === 'red' ? Colors.error[500] :
                        Colors.warning[500]
                    }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>
    );
  };

  return (
    <ScreenContainer style={styles.container} scrollable={false}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'herds' && styles.activeTab]}
          onPress={() => setActiveTab('herds')}
        >
          <Text variant="button" color={activeTab === 'herds' ? 'primary.500' : 'neutral.600'}>
            Breeding
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'breeds' && styles.activeTab]}
          onPress={() => setActiveTab('breeds')}
        >
          <Text variant="button" color={activeTab === 'breeds' ? 'primary.500' : 'neutral.600'}>
            Breeds
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pregnancy' && styles.activeTab]}
          onPress={() => setActiveTab('pregnancy')}
        >
          <Text variant="button" color={activeTab === 'pregnancy' ? 'primary.500' : 'neutral.600'}>
            Pregnancy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calving' && styles.activeTab]}
          onPress={() => setActiveTab('calving')}
        >
          <Text variant="button" color={activeTab === 'calving' ? 'primary.500' : 'neutral.600'}>
            Calving
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bulls' && styles.activeTab]}
          onPress={() => setActiveTab('bulls')}
        >
          <Text variant="button" color={activeTab === 'bulls' ? 'primary.500' : 'neutral.600'}>
            Bulls
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'herds' && renderBreedingHerds()}
        {activeTab === 'breeds' && renderBreeds()}
        {activeTab === 'pregnancy' && renderPregnancy()}
        {activeTab === 'calving' && renderCalving()}
        {activeTab === 'bulls' && renderBullsAndBreedingSoundness()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200]
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.white,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    paddingRight: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary[500],
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
  },
  bcsContainer: {
    padding: 16,
  },
  bcsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  bcsDistribution: {
    gap: 8,
  },
  bcsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bcsLabel: {
    width: 52,
    flexShrink: 0,
  },
  bcsBarWrapper: {
    flex: 1,
    marginVertical: -4,
  },
  bcsPercent: {
    width: 36,
    textAlign: 'right',
    flexShrink: 0,
  },
  statsContainer: {
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
});