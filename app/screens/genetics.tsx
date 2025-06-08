import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { PieChart } from '../../components/charts/PieChart';
import { ProgressIndicator } from '../../components/metrics/ProgressIndicator';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';

const breedingHerdData = [
  {
    name: 'Cows',
    population: 65,
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
            Total Calved:
          </Text>
          <Text variant="body">92</Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Calving %:
          </Text>
          <Text variant="body" color="success.500">
            94%
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Barren Cow %:
          </Text>
          <Text variant="body" color="error.500">
            6%
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            21-Day Calving Rate:
          </Text>
          <Text variant="body" color="primary.500">
            72%
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" weight="medium">
            Calving Index:
          </Text>
          <Text variant="body">365 days</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'herds' && styles.activeTab]}
            onPress={() => setActiveTab('herds')}
          >
            <Text
              variant="body"
              weight={activeTab === 'herds' ? 'medium' : 'regular'}
              color={activeTab === 'herds' ? 'primary.500' : 'neutral.600'}
            >
              Breeding Herds
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'breeds' && styles.activeTab]}
            onPress={() => setActiveTab('breeds')}
          >
            <Text
              variant="body"
              weight={activeTab === 'breeds' ? 'medium' : 'regular'}
              color={activeTab === 'breeds' ? 'primary.500' : 'neutral.600'}
            >
              Breeds
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'pregnancy' && styles.activeTab]}
            onPress={() => setActiveTab('pregnancy')}
          >
            <Text
              variant="body"
              weight={activeTab === 'pregnancy' ? 'medium' : 'regular'}
              color={activeTab === 'pregnancy' ? 'primary.500' : 'neutral.600'}
            >
              Pregnancy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'calving' && styles.activeTab]}
            onPress={() => setActiveTab('calving')}
          >
            <Text
              variant="body"
              weight={activeTab === 'calving' ? 'medium' : 'regular'}
              color={activeTab === 'calving' ? 'primary.500' : 'neutral.600'}
            >
              Calving
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'herds' && renderBreedingHerds()}
        {activeTab === 'breeds' && renderBreeds()}
        {activeTab === 'pregnancy' && renderPregnancy()}
        {activeTab === 'calving' && renderCalving()}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
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