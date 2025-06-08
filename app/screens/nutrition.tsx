import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/tables/DataTable';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';

interface NutritionMetric {
  id: string;
  category: string;
  result: number | string;
  target: number | string;
  status: 'pass' | 'fail' | 'warning';
}

const nutritionMetrics: NutritionMetric[] = [
  {
    id: '1',
    category: 'Weight Gain Matrix',
    result: '0.8 kg/day',
    target: '1.0 kg/day',
    status: 'warning',
  },
  {
    id: '2',
    category: 'Body Condition Score',
    result: '3.5',
    target: '3.0-3.5',
    status: 'pass',
  },
  {
    id: '3',
    category: 'Nutritional Differences',
    result: 'Moderate',
    target: 'Minimal',
    status: 'warning',
  },
  {
    id: '4',
    category: 'Growth Rate Perception',
    result: 'Good',
    target: 'Excellent',
    status: 'warning',
  },
  {
    id: '5',
    category: 'Nutritional Management',
    result: 'Structured',
    target: 'Structured',
    status: 'pass',
  },
];

const columns = [
  {
    key: 'category',
    title: 'Category',
    width: 150,
  },
  {
    key: 'result',
    title: 'Result',
    width: 100,
  },
  {
    key: 'target',
    title: 'Target',
    width: 100,
  },
  {
    key: 'status',
    title: 'Status',
    width: 80,
    align: 'center' as const,
    render: (value: string) => (
      <View
        style={[
          styles.statusIndicator,
          value === 'pass'
            ? styles.passStatus
            : value === 'warning'
            ? styles.warningStatus
            : styles.failStatus,
        ]}
      >
        <Text
          variant="caption"
          weight="medium"
          color={value === 'pass' ? 'success.700' : value === 'warning' ? 'warning.700' : 'error.700'}
        >
          {value.toUpperCase()}
        </Text>
      </View>
    ),
  },
];

export default function NutritionScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nutrition',
        }}
      />
      <NutritionContent />
    </>
  );
}

function NutritionContent() {
  return (
    <ScreenContainer style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text variant="h5" weight="medium" style={styles.cardTitle}>
            Nutrition Assessment
          </Text>
          <Text variant="body" color="neutral.600" style={styles.cardDescription}>
            Review your livestock's nutritional metrics and make adjustments as needed.
          </Text>
          <View style={styles.tableContainer}>
            <DataTable columns={columns} data={nutritionMetrics} />
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardDescription: {
    marginBottom: 16,
  },
  tableContainer: {
    marginTop: 8,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passStatus: {
    backgroundColor: Colors.success[100],
  },
  warningStatus: {
    backgroundColor: Colors.warning[100],
  },
  failStatus: {
    backgroundColor: Colors.error[100],
  },
});