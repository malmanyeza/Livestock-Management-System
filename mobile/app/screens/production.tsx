import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { ProgressIndicator } from '../../components/metrics/ProgressIndicator';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';
import { useFarmData } from '../../context/FarmDataContext';

interface ProductionMetric {
  key: string;
  title: string;
  value: number;
  target: number;
  unit: string;
  description: string;
}

const DEFAULT_TARGETS: Record<string, number> = {
  weaning: 94,
  adg: 0.9,
  preWeaningDLWG: 0.7,
  postWeaningDLWG: 0.9,
  preWeaningMortality: 5.0,
  herdMortality: 5.0,
  weaningRate: 75,
};

const TARGET_DESCRIPTIONS: Record<string, string> = {
  weaning: 'Industry benchmark: ≥ 94%',
  adg: 'Industry benchmark: 0.9 – 1.13 kg/day',
  preWeaningDLWG: 'Industry benchmark: > 0.7 kg/day',
  postWeaningDLWG: 'Industry benchmark: 0.8 – 1.0 kg/day',
  preWeaningMortality: 'Industry benchmark: < 5% (lower is better)',
  herdMortality: 'Industry benchmark: < 5% (lower is better)',
  weaningRate: 'Industry benchmark: 70 – 80%',
};

export default function ProductionScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Production' }} />
      <ProductionContent />
    </>
  );
}

function ProductionContent() {
  const { metrics, profile } = useFarmData();
  const isAdmin = profile?.role === 'admin';

  const [targets, setTargets] = useState<Record<string, number>>({ ...DEFAULT_TARGETS });

  // Modal state for editing a single metric target
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');

  const productionMetrics: ProductionMetric[] = [
    {
      key: 'weaning',
      title: 'Calf Crop % (Weaning %)',
      value: metrics.weaningPercentage,
      target: targets['weaning'],
      unit: '%',
      description: TARGET_DESCRIPTIONS['weaning'],
    },
    {
      key: 'adg',
      title: 'Average Daily Gain (ADG)',
      value: metrics.adg.cattle,
      target: targets['adg'],
      unit: 'kg/day',
      description: TARGET_DESCRIPTIONS['adg'],
    },
    {
      key: 'preWeaningDLWG',
      title: 'Pre-weaning DLWG',
      value: metrics.preWeaningDLWG,
      target: targets['preWeaningDLWG'],
      unit: 'kg/day',
      description: TARGET_DESCRIPTIONS['preWeaningDLWG'],
    },
    {
      key: 'postWeaningDLWG',
      title: 'Post-weaning DLWG',
      value: metrics.postWeaningDLWG,
      target: targets['postWeaningDLWG'],
      unit: 'kg/day',
      description: TARGET_DESCRIPTIONS['postWeaningDLWG'],
    },
    {
      key: 'preWeaningMortality',
      title: 'Pre-weaning Mortality Rate',
      value: metrics.mortalityRates.preWeaning,
      target: targets['preWeaningMortality'],
      unit: '%',
      description: TARGET_DESCRIPTIONS['preWeaningMortality'],
    },
    {
      key: 'herdMortality',
      title: 'Herd Mortality Rate',
      value: metrics.mortalityRates.herd,
      target: targets['herdMortality'],
      unit: '%',
      description: TARGET_DESCRIPTIONS['herdMortality'],
    },
    {
      key: 'weaningRate',
      title: 'Weaning Rate',
      value: metrics.weaningRate,
      target: targets['weaningRate'],
      unit: '%',
      description: TARGET_DESCRIPTIONS['weaningRate'],
    },
  ];

  const openEdit = (metric: ProductionMetric) => {
    setEditingKey(metric.key);
    setDraftValue(String(metric.target));
  };

  const saveEdit = () => {
    if (!editingKey) return;
    const val = parseFloat(draftValue);
    if (!isNaN(val) && val > 0) {
      setTargets(prev => ({ ...prev, [editingKey]: val }));
    }
    setEditingKey(null);
    setDraftValue('');
  };

  const editingMetric = productionMetrics.find(m => m.key === editingKey);

  return (
    <ScreenContainer style={styles.container} scrollable={false}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingVertical: 16 }}>
        <Text variant="h5" weight="medium" style={styles.sectionTitle}>
          Production Metrics
        </Text>

        <View style={styles.metricsContainer}>
          {productionMetrics.map((metric) => (
            <ProductionMetricCard
              key={metric.key}
              metric={metric}
              isAdmin={isAdmin}
              onEditTarget={() => openEdit(metric)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Per-metric target edit modal */}
      <Modal
        visible={!!editingKey}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditingKey(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text variant="h6" weight="bold" style={{ marginBottom: 4 }}>
                Set Target
              </Text>
              <Text variant="body" weight="medium" style={{ marginBottom: 4 }}>
                {editingMetric?.title}
              </Text>
              <Text variant="caption" color="neutral.500" style={{ marginBottom: 16 }}>
                {editingMetric?.description}
              </Text>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.targetInput}
                  value={draftValue}
                  onChangeText={setDraftValue}
                  keyboardType="numeric"
                  placeholder="Enter target"
                  placeholderTextColor={Colors.neutral[400]}
                  autoFocus
                />
                <Text variant="body" color="neutral.600" style={{ marginLeft: 10 }}>
                  {editingMetric?.unit}
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setEditingKey(null)}
                  activeOpacity={0.7}
                >
                  <Text variant="button" color="neutral.700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={saveEdit}
                  activeOpacity={0.7}
                >
                  <Text variant="button" color="white">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

interface ProductionMetricCardProps {
  metric: ProductionMetric;
  isAdmin: boolean;
  onEditTarget: () => void;
}

function ProductionMetricCard({ metric, isAdmin, onEditTarget }: ProductionMetricCardProps) {
  const isMortality = metric.title.includes('Mortality');

  const getColor = (): string => {
    if (isMortality) {
      if (metric.value > metric.target * 1.5) return Colors.error[500];
      if (metric.value > metric.target) return Colors.warning[500];
      return Colors.success[500];
    }
    const pct = (metric.value / metric.target) * 100;
    if (pct < 70) return Colors.error[500];
    if (pct < 90) return Colors.warning[500];
    return Colors.success[500];
  };

  const getPercentage = (): number => {
    if (isMortality) {
      if (metric.value === 0) return 100;
      if (metric.target === 0) return 0;
      return Math.max(0, 100 - (metric.value / metric.target) * 100);
    }
    return (metric.value / metric.target) * 100;
  };

  const color = getColor();
  const borderColor =
    color === Colors.error[500] ? Colors.error[200] :
    color === Colors.warning[500] ? Colors.warning[200] :
    Colors.success[200];

  return (
    <Card style={[styles.metricCard, { borderColor, borderWidth: 1 }]}>
      {/* Header row */}
      <View style={styles.metricHeader}>
        <Text variant="body" weight="medium" style={{ flex: 1 }}>
          {metric.title}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
      </View>

      {/* Value + target row */}
      <View style={styles.metricValues}>
        <Text variant="h5" weight="bold" style={{ color }}>
          {metric.unit === '%' ? metric.value.toFixed(2) : metric.value}
          <Text variant="body2" color="neutral.600"> {metric.unit}</Text>
        </Text>
        <Text variant="body2" color="neutral.500">
          Target: {metric.unit === '%' ? metric.target.toFixed(2) : metric.target} {metric.unit}
        </Text>
      </View>

      {/* Progress bar */}
      <ProgressIndicator
        label="Progress to Target"
        value={getPercentage()}
        max={100}
        color={color}
      />

      {/* Admin: Set Target button — styled like health screen's Assess buttons */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.setTargetBtn}
          onPress={onEditTarget}
          activeOpacity={0.7}
        >
          <Text variant="button" color="primary.500">
            Set Target
          </Text>
        </TouchableOpacity>
      )}
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
    marginBottom: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  metricValues: {
    marginBottom: 12,
  },
  setTargetBtn: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    alignItems: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  targetInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.primary[400],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[900],
    backgroundColor: Colors.primary[50],
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtn: {
    backgroundColor: Colors.neutral[100],
  },
  saveBtn: {
    backgroundColor: Colors.primary[600],
  },
});