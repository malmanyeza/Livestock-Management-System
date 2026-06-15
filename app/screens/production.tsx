import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '../../components/typography/Text';

import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { ProgressIndicator } from '../../components/metrics/ProgressIndicator';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';
import { useFarmData } from '../../context/FarmDataContext';

interface ProductionMetric {
  title: string;
  value: number;
  target: number;
  unit: string;
}

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
  const { metrics } = useFarmData();

  const productionMetrics: ProductionMetric[] = [
    {
      title: 'Calf Crop % (Weaning %)',
      value: metrics.weaningPercentage,
      target: 94,
      unit: '%',
    },
    {
      title: 'Average Daily Gain (ADG)',
      value: metrics.adg.cattle,
      target: 0.9, // target 0.9 - 1.13 kg/day
      unit: 'kg/day',
    },
    {
      title: 'Pre-weaning DLWG',
      value: metrics.preWeaningDLWG,
      target: 0.7, // target >0.7 kg/day
      unit: 'kg/day',
    },
    {
      title: 'Post-weaning DLWG',
      value: metrics.postWeaningDLWG,
      target: 0.9, // target >0.8-1.0 kg/day
      unit: 'kg/day',
    },
    {
      title: 'Pre-weaning Mortality Rate',
      value: metrics.mortalityRates.preWeaning,
      target: 5.0, // target <5%
      unit: '%',
    },
    {
      title: 'Herd Mortality Rate',
      value: metrics.mortalityRates.herd,
      target: 5.0, // target <5%
      unit: '%',
    },
    {
      title: 'Weaning Rate',
      value: metrics.weaningRate,
      target: 75, // target 70-80%
      unit: '%',
    },
  ];

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
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingVertical: 16 }}>
        {renderContent()}
      </ScrollView>
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
    borderRadius: 12,
    padding: 16,
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