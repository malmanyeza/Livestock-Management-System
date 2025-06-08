import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';

interface HealthMetric {
  title: string;
  score: number;
  percentage: number;
  passed: boolean;
  color: string;
}

const healthMetrics: HealthMetric[] = [
  {
    title: 'Overall Farm Health Score',
    score: 85,
    percentage: 85,
    passed: true,
    color: Colors.primary[500],
  },
  {
    title: 'Biosecurity Rating',
    score: 4.2,
    percentage: 84,
    passed: true,
    color: Colors.success[500],
  },
  {
    title: 'Deworming Practice',
    score: 3.8,
    percentage: 76,
    passed: true,
    color: Colors.warning[500],
  },
  {
    title: 'Antihelminthic Rating',
    score: 4.5,
    percentage: 90,
    passed: true,
    color: Colors.accent[500],
  },
  {
    title: 'Antimicrobial Usage',
    score: 2.1,
    percentage: 42,
    passed: false,
    color: Colors.error[500],
  },
  {
    title: 'Continued Professional Development',
    score: 4.8,
    percentage: 96,
    passed: true,
    color: Colors.secondary[500],
  },
  {
    title: 'Drug Box',
    score: 3.5,
    percentage: 70,
    passed: true,
    color: Colors.primary[400],
  },
];

export default function HealthScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Health',
        }}
      />
      <HealthContent />
    </>
  );
}

function HealthContent() {
  const renderMetricCard = (metric: HealthMetric) => (
    <Card key={metric.title} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text variant="h6" weight="bold" style={styles.cardTitle}>
          {metric.title}
        </Text>
        {metric.passed ? (
          <CheckCircle2 size={24} color={Colors.success[500]} />
        ) : (
          <XCircle size={24} color={Colors.error[500]} />
        )}
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.scoreContainer}>
          <Text variant="h3" weight="bold" color={metric.color}>
            {metric.score.toFixed(1)}
          </Text>
          <Text variant="caption" color="neutral.500">
            Score
          </Text>
        </View>

        <View style={styles.percentageContainer}>
          <View style={[styles.percentageBar, { backgroundColor: Colors.neutral[100] }]}>
            <View
              style={[
                styles.percentageFill,
                {
                  backgroundColor: metric.color,
                  width: `${metric.percentage}%`,
                },
              ]}
            />
          </View>
          <Text variant="body2" color="neutral.500">
            {metric.percentage}%
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {healthMetrics.map(renderMetricCard)}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    flex: 1,
    marginRight: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    width: 80,
  },
  percentageContainer: {
    flex: 1,
  },
  percentageBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    borderRadius: 4,
  },
});
