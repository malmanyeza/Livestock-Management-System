import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { ProgressIndicator } from '../../components/metrics/ProgressIndicator';
import { PieChart } from '../../components/charts/PieChart';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';

interface ProductionMetric {
  title: string;
  value: number;
  target: number;
  unit: string;
}

const productionMetrics: ProductionMetric[] = [
  {
    title: 'Calf Crop %',
    value: 85,
    target: 95,
    unit: '%',
  },
  {
    title: 'Pre-weaning DLWG',
    value: 0.8,
    target: 1.0,
    unit: 'kg/day',
  },
  {
    title: 'Post-weaning DLWG',
    value: 1.2,
    target: 1.5,
    unit: 'kg/day',
  },
  {
    title: 'Calf Mortality Rate',
    value: 5,
    target: 3,
    unit: '%',
  },
  {
    title: 'Herd Mortality Rate',
    value: 2,
    target: 1,
    unit: '%',
  },
  {
    title: 'Weaning Rate',
    value: 82,
    target: 90,
    unit: '%',
  },
];



export default function ProductionScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Production',
        }}
      />
      <ProductionContent />
    </>
  );
}

function ProductionContent() {


  const renderContent = () => (
    <>
      <Text variant="h5" weight="medium" style={styles.sectionTitle}>
        Production Metrics
      </Text>
      <View style={styles.metricsContainer}>
        {productionMetrics.map((metric, index) => (
          <ProductionMetricCard key={index} metric={metric} />
        ))}
      </View>
    </>
  );

  return (
    <ScreenContainer style={styles.container}>
      {renderContent()}
    </ScreenContainer>
  );
}

interface ProductionMetricCardProps {
  metric: ProductionMetric;
}

function ProductionMetricCard({ metric }: ProductionMetricCardProps) {
  // Determine if the metric is good, warning, or bad
  const getColor = () => {
    // For mortality rates, lower is better
    if (metric.title.includes('Mortality')) {
      if (metric.value > metric.target * 1.5) return Colors.error[500];
      if (metric.value > metric.target) return Colors.warning[500];
      return Colors.success[500];
    }
    
    // For all other metrics, higher is better
    const percentage = (metric.value / metric.target) * 100;
    if (percentage < 70) return Colors.error[500];
    if (percentage < 90) return Colors.warning[500];
    return Colors.success[500];
  };

  // Calculate percentage of target
  const getPercentage = () => {
    // For mortality rates, calculate inversely
    if (metric.title.includes('Mortality')) {
      // If value is 0, it's 100% of target (best case)
      if (metric.value === 0) return 100;
      // If target is 0, it's 0% of target (impossible case)
      if (metric.target === 0) return 0;
      // Otherwise, invert the percentage
      return Math.max(0, 100 - ((metric.value / metric.target) * 100));
    }
    
    // For other metrics, direct percentage
    return (metric.value / metric.target) * 100;
  };

  return (
    <Card style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text variant="body" weight="medium">
          {metric.title}
        </Text>
        <View style={[styles.statusIndicator, { backgroundColor: getColor() }]} />
      </View>
      <View style={styles.metricValues}>
        <Text variant="h5" weight="bold" color={getColor()}>
          {metric.unit === '%' ? metric.value.toFixed(2) : metric.value}
          <Text variant="body2" color="neutral.600">
            {' '}
            {metric.unit}
          </Text>
        </Text>
        <Text variant="body2" color="neutral.600">
          Target: {metric.unit === '%' ? metric.target.toFixed(2) : metric.target} {metric.unit}
        </Text>
      </View>
      <ProgressIndicator
        label="Progress to Target"
        value={getPercentage()}
        max={100}
        color={getColor()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },

  sectionTitle: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  metricsContainer: {
    paddingHorizontal: 16,
  },
  metricCard: {
    marginBottom: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  metricValues: {
    marginBottom: 12,
  },

});