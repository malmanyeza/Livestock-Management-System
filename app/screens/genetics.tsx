import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { PieChart } from '../../components/charts/PieChart';
import { ProgressIndicator } from '../../components/metrics/ProgressIndicator';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';

const breedingHerdData = [
  {
    population: 65,
    name: 'Cows',
    color: Colors.primary[500],
    legendFontColor: Colors.neutral[700],
  },
  {
    name: 'Heifers',
    population: 35,
    color: Colors.secondary[500],
    legendFontColor: Colors.neutral[700],
  },
];

const breedDistributionData = [
  {
    name: 'Mashona',
    population: 45,
    color: Colors.primary[500],
    legendFontColor: Colors.neutral[700],
  },
  {
    name: 'Brahman',
    population: 30,
    color: Colors.secondary[500],
    legendFontColor: Colors.neutral[700],
  },
  {
    name: 'Ankole',
    population: 15,
    color: Colors.accent[500],
    legendFontColor: Colors.neutral[700],
  },
  {
    name: 'Cross',
    population: 10,
    color: Colors.success[500],
    legendFontColor: Colors.neutral[700],
  },
];

const bcsData = {
  average: 3.2,
  target: '3.0-3.5',
  distribution: [
    { score: '1-2', percentage: 5 },
    { score: '2-3', percentage: 30 },
    { score: '3-4', percentage: 55 },
    { score: '4-5', percentage: 10 },
  ],
};

export default function GeneticsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Genetics & Production',
        }}
      />
      <GeneticsContent />
    </>
  );
}

function GeneticsContent() {
  const [activeTab, setActiveTab] = useState('herds');

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
                {bcsData.average}
              </Text>
            </View>
            <View>
              <Text variant="body2" color="neutral.600">
                Target Range
              </Text>
              <Text variant="h5" weight="medium" color="success.500">
                {bcsData.target}
              </Text>
            </View>
          </View>

          <View style={styles.bcsDistribution}>
            {bcsData.distribution.map((item, index) => (
              <View key={index} style={styles.bcsItem}>
                <Text variant="caption" color="neutral.600">
                  BCS {item.score}
                </Text>
                <ProgressIndicator
                  label=""
                  value={item.percentage}
                  max={100}
                  size="sm"
                  color={Colors.primary[500]}
                />
                <Text variant="caption" color="neutral.600">
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
          <Text variant="body">120</Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Total Incalf:
          </Text>
          <Text variant="body">98</Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Conception Rate:
          </Text>
          <Text variant="body" color="success.500">
            82%
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            42-Day Incalf Rate:
          </Text>
          <Text variant="body" color="primary.500">
            65%
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            100-Day Incalf Rate:
          </Text>
          <Text variant="body" color="primary.500">
            78%
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Trimester PDs:
          </Text>
          <Text variant="body">45 | 32 | 21</Text>
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
          <Text variant="body">415 days</Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Calving Rate:
          </Text>
          <Text variant="body" color="success.500">
            88%
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Calf Mortality:
          </Text>
          <Text variant="body" color="error.500">
            6%
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderBullsAndBreedingSoundness = () => {
    const router = useRouter();
    
    const handleBullPress = (bullId: string) => {
      // Navigate to register screen with the bull's ID as a parameter
      router.push({
        pathname: '/screens/register',
        params: { scrollToBull: bullId }
      } as any);
    };

    return (
      <Card style={styles.card}>
        <Text variant="h5" weight="medium" style={styles.cardTitle}>
          Bulls and Breeding Soundness
        </Text>
        
        <View style={{ marginBottom: 20 }}>
          <Text variant="h6" style={{ marginBottom: 10 }}>Bull Distribution</Text>
          <PieChart 
            data={[
              { name: 'Weaners', population: 30, color: Colors.primary[300], legendFontColor: Colors.neutral[700] },
              { name: 'Mature', population: 70, color: Colors.primary[600], legendFontColor: Colors.neutral[700] }
            ]} 
            height={180} 
          />
        </View>

        <Text variant="h6" style={{ marginBottom: 10 }}>Bull Breeding Soundness</Text>
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
          {[
            { id: 'B001', date: '2025-06-15', category: 'Satisfactory Potential Breeder', status: 'green' },
            { id: 'B002', date: '2025-06-20', category: 'Un-Satisfactory Potential Breeder', status: 'red' },
            { id: 'B003', date: '2025-06-25', category: 'Classification Deferred', status: 'amber' },
            { id: 'B004', date: '2025-07-01', category: 'Satisfactory Potential Breeder', status: 'green' },
          ].map((bull, index, array) => (
            <TouchableOpacity 
              key={bull.id}
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
      </Card>
    );
  };

  return (
    <ScreenContainer style={styles.container}>
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
    gap: 12,
  },
  bcsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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