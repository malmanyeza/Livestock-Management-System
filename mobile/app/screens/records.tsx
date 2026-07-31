import React from 'react';
import { View, ScrollView, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';
import { Stack, useRouter } from 'expo-router';
import { useFarmData } from '../../context/FarmDataContext';
import { ChevronLeft } from 'lucide-react-native';


// Helper function to get color based on mark
function getMarkColor(mark: string): string {
  if (mark === '—') return Colors.neutral[300];
  switch (mark.charAt(0)) {
    case 'A':
      return Colors.success[500];
    case 'B':
      return Colors.primary[500];
    case 'C':
      return Colors.warning[500];
    case 'D':
      return Colors.error[400];
    case 'F':
      return Colors.error[600];
    default:
      return Colors.neutral[500];
  }
}


// Helper function to get letter grade based on percentage score
function getMark(percentage: number): string {
  if (isNaN(percentage)) return '—';
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 60) return 'D';
  return 'F';
}

// Helper function to get color based on badge
function getBadgeColor(badge: string): string {
  switch (badge) {
    case 'Gold':
      return '#FFD700';
    case 'Platinum':
      return '#E5E4E2';
    case 'Diamond':
      return '#B9F2FF';
    default:
      return Colors.accent[500];
  }
}

export default function RecordsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Records',
          headerLeft: () => <BackButton />,
        }}
      />
      <RecordsContent />
    </>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 }}
      accessibilityLabel="Go back"
    >
      <ChevronLeft size={22} color={Colors.neutral[800]} />
      <Text variant="body" weight="medium" color={Colors.neutral[800]} style={{ marginLeft: 2 }}>
        Back
      </Text>
    </TouchableOpacity>
  );
}


const METRIC_GROUPS = [
  {
    title: 'Identification',
    metrics: [
      { key: 'ear tags', label: 'Ear Tags' },
      { key: 'electronic id', label: 'Electronic ID' },
      { key: 'brand registration', label: 'Brand Registration' },
      { key: 'dna profiles', label: 'DNA Profiles' },
    ],
  },
  {
    title: 'Accessibility and Usage',
    metrics: [
      { key: 'data accuracy', label: 'Data Accuracy' },
      { key: 'knowledge', label: 'Knowledge' },
      { key: 'use in decision making', label: 'Use in Decision Making' },
    ],
  },
  {
    title: 'Record System Traceability',
    metrics: [
      { key: 'birth registration', label: 'Birth Registration' },
      { key: 'movement records', label: 'Movement Records' },
      { key: 'health treatments', label: 'Health Treatments' },
      { key: 'mortality records', label: 'Mortality Records' },
      { key: 'feed records', label: 'Feed Records' },
    ],
  },
];

function RecordsContent() {
  const { farmInspection, animals, profile, updateFarmInspection, observations } = useFarmData();
  const hasAnimals = animals.length > 0;

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [formOverrides, setFormOverrides] = React.useState<{ [key: string]: { attained: string; target: string } }>({});

  // Compute Accessibility Data dynamically
  const accuracyPct = Math.round(farmInspection.recordsSatisfaction * 20);
  const knowledgePct = Math.round(farmInspection.recordsTrainingEvidence * 20);
  const usagePct = Math.round(farmInspection.recordAccessibilityUsage * 20);

  // Compute Traceability Data dynamically
  const birthPct = farmInspection.maintainsBirth ? 100 : 0;
  const movementPct = farmInspection.maintainsMovements ? 100 : 0;
  const healthPct = farmInspection.maintainsHealth ? 100 : 0;
  const mortalityPct = farmInspection.maintainsMortalities ? 100 : 0;
  const feedPct = farmInspection.maintainsFeed ? 100 : 0;

  const defaultAttainedValues: { [key: string]: string } = {
    'ear tags': hasAnimals ? '100%' : '0%',
    'electronic id': hasAnimals ? '85%' : '0%',
    'brand registration': hasAnimals ? '92%' : '0%',
    'dna profiles': hasAnimals ? '65%' : '0%',
    'data accuracy': `${accuracyPct}%`,
    'knowledge': `${knowledgePct}%`,
    'use in decision making': `${usagePct}%`,
    'birth registration': `${birthPct}%`,
    'movement records': `${movementPct}%`,
    'health treatments': `${healthPct}%`,
    'mortality records': `${mortalityPct}%`,
    'feed records': `${feedPct}%`,
  };

  const defaultTargetValues: { [key: string]: string } = {
    'ear tags': '100%',
    'electronic id': '90%',
    'brand registration': '95%',
    'dna profiles': '70%',
    'data accuracy': '95%',
    'knowledge': '85%',
    'use in decision making': '90%',
    'birth registration': '100%',
    'movement records': '95%',
    'health treatments': '100%',
    'mortality records': '100%',
    'feed records': '90%',
  };

  // These metrics are always computed from inspection fields — not reliant on animals or overrides
  const COMPUTED_KEYS = new Set([
    'data accuracy', 'knowledge', 'use in decision making',
    'birth registration', 'movement records', 'health treatments',
    'mortality records', 'feed records',
  ]);

  const getMetric = (metricKey: string) => {
    const override = farmInspection.recordsOverrides?.[metricKey];
    const isComputed = COMPUTED_KEYS.has(metricKey);

    // If an explicit override exists, always use it
    if (override?.attained || override?.target) {
      const attained = override.attained ?? (isComputed ? defaultAttainedValues[metricKey] : '—');
      const target   = override.target   ?? (isComputed ? defaultTargetValues[metricKey]  : '—');
      const attainedNum = parseFloat(attained.replace('%', ''));
      const mark = getMark(attainedNum);
      return { attained, target, mark };
    }

    // No override set:
    // - Computed metrics (traceability/accessibility): always show calculated value + default target
    // - Identification metrics: show '—' until admin explicitly sets them
    if (isComputed) {
      const attained = defaultAttainedValues[metricKey];
      const target   = defaultTargetValues[metricKey];
      const attainedNum = parseFloat(attained.replace('%', ''));
      const mark = getMark(attainedNum);
      return { attained, target, mark };
    }

    // Identification metric with no override → show dash for both
    return { attained: '—', target: '—', mark: '—' };
  };


  const handleOpenModal = () => {
    const initialForm: { [key: string]: { attained: string; target: string } } = {};
    const allKeys = Object.keys(defaultAttainedValues);
    
    // Pre-fill ONLY from existing DB overrides — do NOT use computed defaults.
    // Blank means "use the computed default" — this prevents accidentally
    // saving 0% for metrics the user hasn't explicitly set.
    allKeys.forEach(k => {
      const saved = farmInspection.recordsOverrides?.[k];
      initialForm[k] = {
        attained: saved?.attained?.replace('%', '') ?? '',
        target: saved?.target?.replace('%', '') ?? ''
      };
    });
    
    setFormOverrides(initialForm);
    setIsModalOpen(true);
  };

  const handleInputChange = (key: string, field: 'attained' | 'target', value: string) => {
    setFormOverrides(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSaveOverrides = async () => {
    // Build the overrides map — only include metrics where the user typed a value.
    // Empty attained AND empty target = user wants to use the computed default, so exclude.
    const formattedOverrides: { [key: string]: { attained: string; target: string } } = {};
    
    Object.keys(formOverrides).forEach(key => {
      let attained = formOverrides[key].attained.trim();
      let target = formOverrides[key].target.trim();
      
      // Skip entirely if both fields are blank (revert to computed default)
      if (!attained && !target) return;
      
      // Append % if the user typed a bare number
      if (attained && !attained.endsWith('%') && /^\d+(\.\d+)?$/.test(attained)) {
        attained += '%';
      }
      if (target && !target.endsWith('%') && /^\d+(\.\d+)?$/.test(target)) {
        target += '%';
      }
      
      // Fall back to existing DB override or computed default for whichever field is blank
      const existing = farmInspection.recordsOverrides?.[key];
      formattedOverrides[key] = {
        attained: attained || existing?.attained || defaultAttainedValues[key],
        target: target || existing?.target || defaultTargetValues[key]
      };
    });
    
    try {
      await updateFarmInspection({
        recordsOverrides: formattedOverrides
      });
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error saving overrides:", e);
    }
  };

  // Compute Identification Checklist dynamically
  const earTags = getMetric('ear tags');
  const electronicId = getMetric('electronic id');
  const brandRegistration = getMetric('brand registration');
  const dnaProfiles = getMetric('dna profiles');

  const identificationData = [
    { id: 1, method: 'Ear Tags', attained: earTags.attained, target: earTags.target, mark: earTags.mark },
    { id: 2, method: 'Electronic ID', attained: electronicId.attained, target: electronicId.target, mark: electronicId.mark },
    { id: 3, method: 'Brand Registration', attained: brandRegistration.attained, target: brandRegistration.target, mark: brandRegistration.mark },
    { id: 4, method: 'DNA Profiles', attained: dnaProfiles.attained, target: dnaProfiles.target, mark: dnaProfiles.mark },
  ];

  // Gamification: Compute observer awards based on points
  const observerPointsTotal: Record<string, number> = {};
  const observerCategoryPoints: Record<string, Record<string, number>> = {};

  observations.forEach(obs => {
    if (obs.observer && obs.verificationStatus !== 'rejected') {
      if (!observerPointsTotal[obs.observer]) {
        observerPointsTotal[obs.observer] = 0;
        observerCategoryPoints[obs.observer] = {
          'Biosecurity & Environment safety': 0,
          'Critical Health (High Priority)': 0,
          'Reproduction & Birth & life saving Log (Time-Sensitive)': 0,
          'Growth & Routine (Standard Maintenance)': 0,
        };
      }
      
      const cat = obs.category || 'Other';
      let pts = obs.points || 0;
      
      // Fallback for legacy records that have 0 points but had a category embedded
      if (pts === 0 && (obs.observation || '').match(/^\[(.*?)\]/)) {
        pts = cat === 'Growth & Routine (Standard Maintenance)' ? 1 : (cat !== 'Other' ? 5 : 0);
      }

      observerPointsTotal[obs.observer] += pts;
      if (observerCategoryPoints[obs.observer][cat] !== undefined) {
        observerCategoryPoints[obs.observer][cat] += pts;
      }
    }
  });

  const computedObserverAwards = [];
  let awardId = 1;

  let topLifeSaver = '';
  let maxLifeSaverPts = 0;
  let topOverall = '';
  let maxOverallPts = 0;

  for (const observer in observerPointsTotal) {
    // 1. Sharp Eye Award (100+ points in Biosecurity or Critical Health)
    const sharpEyePts = (observerCategoryPoints[observer]['Biosecurity & Environment safety'] || 0) + 
                        (observerCategoryPoints[observer]['Critical Health (High Priority)'] || 0);
    if (sharpEyePts >= 100) {
      computedObserverAwards.push({
        id: awardId++,
        category: 'Sharp Eye Award',
        name: observer,
        count: sharpEyePts,
        badge: 'Diamond',
        rating: '100+ points in Critical Health & Biosecurity'
      });
    }

    // 2. Compute max Life Saver
    const lsPts = observerCategoryPoints[observer]['Reproduction & Birth & life saving Log (Time-Sensitive)'] || 0;
    if (lsPts > maxLifeSaverPts) {
      maxLifeSaverPts = lsPts;
      topLifeSaver = observer;
    }

    // 3. Compute max Overall
    if (observerPointsTotal[observer] > maxOverallPts) {
      maxOverallPts = observerPointsTotal[observer];
      topOverall = observer;
    }
  }

  // Assign Life Saver Award
  if (topLifeSaver && maxLifeSaverPts > 0) {
    computedObserverAwards.push({
      id: awardId++,
      category: 'Life Saver Award',
      name: topLifeSaver,
      count: maxLifeSaverPts,
      badge: 'Platinum',
      rating: 'Highest points in Life Saving Log'
    });
  }

  // Assign Consistent Logger / Top Overall
  if (topOverall && maxOverallPts > 0) {
    computedObserverAwards.push({
      id: awardId++,
      category: 'Consistent Logger',
      name: topOverall,
      count: maxOverallPts,
      badge: 'Gold',
      rating: `Highest overall score: ${maxOverallPts} pts`
    });
  }

  // List Observer Points for other users
  for (const observer in observerPointsTotal) {
    if (observer !== topOverall && observer !== topLifeSaver && observerPointsTotal[observer] > 0) {
      computedObserverAwards.push({
        id: awardId++,
        category: 'Observer Score',
        name: observer,
        count: observerPointsTotal[observer],
        badge: 'Silver',
        rating: `Total Score: ${observerPointsTotal[observer]} pts`
      });
    }
  }

  const observerAwards = computedObserverAwards;

  const dataAccuracy = getMetric('data accuracy');
  const knowledge = getMetric('knowledge');
  const decisionMaking = getMetric('use in decision making');

  const accessibilityData = [
    { id: 1, metric: 'Data Accuracy', attained: dataAccuracy.attained, target: dataAccuracy.target, mark: dataAccuracy.mark },
    { id: 2, metric: 'Knowledge', attained: knowledge.attained, target: knowledge.target, mark: knowledge.mark },
    { id: 3, metric: 'Use in Decision Making', attained: decisionMaking.attained, target: decisionMaking.target, mark: decisionMaking.mark },
  ];

  const birthReg = getMetric('birth registration');
  const movementRec = getMetric('movement records');
  const healthTreat = getMetric('health treatments');
  const mortalityRec = getMetric('mortality records');
  const feedRec = getMetric('feed records');

  const traceabilityData = [
    { id: 1, metric: 'Birth Registration', attained: birthReg.attained, target: birthReg.target, mark: birthReg.mark },
    { id: 2, metric: 'Movement Records', attained: movementRec.attained, target: movementRec.target, mark: movementRec.mark },
    { id: 3, metric: 'Health Treatments', attained: healthTreat.attained, target: healthTreat.target, mark: healthTreat.mark },
    { id: 4, metric: 'Mortality Records', attained: mortalityRec.attained, target: mortalityRec.target, mark: mortalityRec.mark },
    { id: 5, metric: 'Feed Records', attained: feedRec.attained, target: feedRec.target, mark: feedRec.mark },
  ];

  return (
    <ScreenContainer scrollable={false}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {profile?.role === 'admin' && (
          <Button
            variant="primary"
            style={styles.modifyButton}
            onPress={handleOpenModal}
          >
            Modify Metrics
          </Button>
        )}

        {/* Accessibility and Usage Section */}
        <Card title="Accessibility and Usage" style={styles.card}>
          <DataTable
            columns={[
              { key: 'metric', title: 'Metric', width: 150 },
              { key: 'attained', title: 'Attained', width: 100, align: 'center' },
              { key: 'target', title: 'Target', width: 100, align: 'center' },
              { 
                key: 'mark', 
                title: 'Mark', 
                width: 80, 
                align: 'center',
                render: (value: string) => (
                  <View style={[
                    styles.markBadge, 
                    { backgroundColor: getMarkColor(value) }
                  ]}>
                    <Text variant="body2" weight="medium" color="white">
                      {value}
                    </Text>
                  </View>
                )
              },
            ]}
            data={accessibilityData}
          />
        </Card>

        {/* Record System Traceability Section */}
        <Card title="Record System Traceability" style={styles.card}>
          <DataTable
            columns={[
              { key: 'metric', title: 'Metric', width: 150 },
              { key: 'attained', title: 'Attained', width: 100, align: 'center' },
              { key: 'target', title: 'Target', width: 100, align: 'center' },
              { 
                key: 'mark', 
                title: 'Mark', 
                width: 80, 
                align: 'center',
                render: (value: string) => (
                  <View style={[
                    styles.markBadge, 
                    { backgroundColor: getMarkColor(value) }
                  ]}>
                    <Text variant="body2" weight="medium" color="white">
                      {value}
                    </Text>
                  </View>
                )
              },
            ]}
            data={traceabilityData}
          />
        </Card>

        {/* Identification Section */}
        <Card title="Identification" style={styles.card}>
          <DataTable
            columns={[
              { key: 'method', title: 'Method', width: 150 },
              { key: 'attained', title: 'Attained', width: 100, align: 'center' },
              { key: 'target', title: 'Target', width: 100, align: 'center' },
              { 
                key: 'mark', 
                title: 'Mark', 
                width: 80, 
                align: 'center',
                render: (value: string) => (
                  <View style={[
                    styles.markBadge, 
                    { backgroundColor: getMarkColor(value) }
                  ]}>
                    <Text variant="body2" weight="medium" color="white">
                      {value}
                    </Text>
                  </View>
                )
              },
            ]}
            data={identificationData}
          />
        </Card>

        {/* Observer Awards Section */}
        <Card title="Observer Awards" style={styles.card}>
          <DataTable
            columns={[
              { key: 'category', title: 'Award / Category', width: 140 },
              { key: 'name', title: 'Observer', width: 120 },
              { key: 'count', title: 'Points', width: 70, align: 'center' },
              { 
                key: 'badge', 
                title: 'Badge', 
                width: 90, 
                align: 'center',
                render: (value: string) => (
                  <View style={[
                    styles.badgeContainer, 
                    { backgroundColor: getBadgeColor(value) }
                  ]}>
                    <Text variant="body2" weight="medium" color="white">
                      {value}
                    </Text>
                  </View>
                )
              },
              { key: 'rating', title: 'Details', width: 160 },
            ]}
            data={observerAwards}
          />
        </Card>
      </ScrollView>

      {/* Modify Metrics Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoiding}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text variant="h3" weight="bold" color={Colors.neutral[800]}>
                  Modify Metrics
                </Text>
                <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                  <Text variant="body" weight="medium" color={Colors.error[500]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {METRIC_GROUPS.map((group, groupIdx) => (
                  <View key={groupIdx} style={styles.formGroup}>
                    <Text variant="h4" weight="bold" color={Colors.primary[600]} style={styles.groupTitle}>
                      {group.title}
                    </Text>
                    
                    {group.metrics.map((metric) => (
                      <View key={metric.key} style={styles.metricRow}>
                        <Text variant="body2" weight="medium" color={Colors.neutral[700]} style={styles.metricLabel}>
                          {metric.label}
                        </Text>
                        
                        <View style={styles.inputsRow}>
                          <View style={styles.inputContainer}>
                            <Text variant="caption" color={Colors.neutral[400]}>Attained</Text>
                            <TextInput
                              style={styles.textInput}
                              value={formOverrides[metric.key]?.attained.replace('%', '') || ''}
                              onChangeText={(val) => handleInputChange(metric.key, 'attained', val)}
                              keyboardType="decimal-pad"
                              placeholder="0"
                            />
                          </View>
                          
                          <View style={styles.inputContainer}>
                            <Text variant="caption" color={Colors.neutral[400]}>Target</Text>
                            <TextInput
                              style={styles.textInput}
                              value={formOverrides[metric.key]?.target.replace('%', '') || ''}
                              onChangeText={(val) => handleInputChange(metric.key, 'target', val)}
                              keyboardType="decimal-pad"
                              placeholder="0"
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  variant="outline"
                  style={styles.actionButton}
                  onPress={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  style={{ ...styles.actionButton, marginLeft: 12 }}
                  onPress={handleSaveOverrides}
                >
                  Save Changes
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.neutral[50],
  },
  card: {
    marginBottom: 16,
  },
  markBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modifyButton: {
    marginBottom: 16,
    borderRadius: 8,
    height: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalKeyboardAvoiding: {
    width: '100%',
    maxHeight: '85%',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    paddingBottom: 12,
  },
  modalScrollView: {
    maxHeight: 450,
  },
  formGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[50],
  },
  metricLabel: {
    flex: 1,
    marginRight: 12,
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 64,
    textAlign: 'center',
    marginTop: 4,
    color: Colors.neutral[800],
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    paddingTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});