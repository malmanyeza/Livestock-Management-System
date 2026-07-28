import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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
  const { animals, breedingRecords, pregnancyRecords, metrics, farmInspection, updateFarmInspection, profile } = useFarmData();

  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [targetsForm, setTargetsForm] = useState<Record<string, number>>({});

  const [isPregnancyModalOpen, setIsPregnancyModalOpen] = useState(false);
  const [pregnancyForm, setPregnancyForm] = useState({
    conceptionRateAttained: '',
    conceptionRateTarget: '',
    incalfRate42dAttained: '',
    incalfRate42dTarget: '',
    incalfRate100dAttained: '',
    incalfRate100dTarget: '',
    firstTrimesterPDAttained: '',
    firstTrimesterPDTarget: '',
    secondTrimesterPDAttained: '',
    secondTrimesterPDTarget: '',
    thirdTrimesterPDAttained: '',
    thirdTrimesterPDTarget: '',
  });

  const handleOpenPregnancyModal = () => {
    const overrides = farmInspection?.pregnancyOverrides || {};
    setPregnancyForm({
      conceptionRateAttained: overrides.conceptionRate?.attained?.replace('%', '') || '',
      conceptionRateTarget: overrides.conceptionRate?.target?.replace('%', '') || '',
      incalfRate42dAttained: overrides.incalfRate42d?.attained?.replace('%', '') || '',
      incalfRate42dTarget: overrides.incalfRate42d?.target?.replace('%', '') || '',
      incalfRate100dAttained: overrides.incalfRate100d?.attained?.replace('%', '') || '',
      incalfRate100dTarget: overrides.incalfRate100d?.target?.replace('%', '') || '',
      firstTrimesterPDAttained: overrides.firstTrimesterPD?.attained || '',
      firstTrimesterPDTarget: overrides.firstTrimesterPD?.target || '',
      secondTrimesterPDAttained: overrides.secondTrimesterPD?.attained || '',
      secondTrimesterPDTarget: overrides.secondTrimesterPD?.target || '',
      thirdTrimesterPDAttained: overrides.thirdTrimesterPD?.attained || '',
      thirdTrimesterPDTarget: overrides.thirdTrimesterPD?.target || '',
    });
    setIsPregnancyModalOpen(true);
  };

  const handleSavePregnancyOverrides = async () => {
    const formatPct = (val: string) => {
      let trimmed = val.trim();
      if (!trimmed) return '';
      if (!trimmed.endsWith('%') && /^\d+(\.\d+)?$/.test(trimmed)) {
        return trimmed + '%';
      }
      return trimmed;
    };

    const formatVal = (val: string) => val.trim();

    const formattedOverrides = {
      conceptionRate: {
        attained: formatPct(pregnancyForm.conceptionRateAttained),
        target: formatPct(pregnancyForm.conceptionRateTarget),
      },
      incalfRate42d: {
        attained: formatPct(pregnancyForm.incalfRate42dAttained),
        target: formatPct(pregnancyForm.incalfRate42dTarget),
      },
      incalfRate100d: {
        attained: formatPct(pregnancyForm.incalfRate100dAttained),
        target: formatPct(pregnancyForm.incalfRate100dTarget),
      },
      firstTrimesterPD: {
        attained: formatVal(pregnancyForm.firstTrimesterPDAttained),
        target: formatVal(pregnancyForm.firstTrimesterPDTarget),
      },
      secondTrimesterPD: {
        attained: formatVal(pregnancyForm.secondTrimesterPDAttained),
        target: formatVal(pregnancyForm.secondTrimesterPDTarget),
      },
      thirdTrimesterPD: {
        attained: formatVal(pregnancyForm.thirdTrimesterPDAttained),
        target: formatVal(pregnancyForm.thirdTrimesterPDTarget),
      },
      lastUpdated: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const cleanedOverrides: any = {};
    Object.entries(formattedOverrides).forEach(([key, val]) => {
      if (key === 'lastUpdated') {
        cleanedOverrides.lastUpdated = val;
        return;
      }
      const overrideVal = val as { attained: string; target: string };
      if (overrideVal.attained || overrideVal.target) {
        cleanedOverrides[key] = {
          attained: overrideVal.attained || undefined,
          target: overrideVal.target || undefined,
        };
      }
    });

    try {
      await updateFarmInspection({
        pregnancyOverrides: cleanedOverrides,
      });
      setIsPregnancyModalOpen(false);
    } catch (e) {
      console.error("Error saving pregnancy overrides:", e);
    }
  };

  const getPregnancyMetric = (key: string, liveAttained: string, defaultTarget: string) => {
    const override = (farmInspection?.pregnancyOverrides as any)?.[key];
    const attained = override?.attained || liveAttained;
    const target = override?.target || defaultTarget;
    return { attained, target };
  };

  const handleOpenTargetsModal = () => {
    const existing = (farmInspection as any)?.geneticsTargets || {};
    const form: Record<string, number> = {};
    GENETICS_TARGETS_KEYS.forEach(({ key }) => {
      form[key] = existing[key]?.attained ?? 0;
    });
    setTargetsForm(form);
    setIsTargetsModalOpen(true);
  };

  const handleSaveTargets = async () => {
    try {
      const existing = (farmInspection as any)?.geneticsTargets || {};
      const newTargets = { ...existing, lastUpdated: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) };
      
      GENETICS_TARGETS_KEYS.forEach(({ key }) => {
        if (!newTargets[key]) newTargets[key] = { attained: 0, target: 5 };
        newTargets[key].attained = targetsForm[key] ?? 0;
      });

      const updated = {
        ...farmInspection,
        geneticsTargets: newTargets
      };

      await updateFarmInspection(updated);
      setIsTargetsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Breeding Herd Composition
  const cowCount = animals.filter(a => a.stockType === 'Cow').length;
  const heiferCount = animals.filter(a => a.stockType === 'Heifer' || a.stockType === 'Bullying Heifer').length;
  const totalBreedables = cowCount + heiferCount;
  
  const breedingHerdData = [
    {
      population: cowCount,
      name: 'Cows',
      color: Colors.primary[500],
      legendFontColor: Colors.neutral[700],
    },
    {
      name: 'Heifers',
      population: heiferCount,
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
        <View style={styles.herdStatsGrid}>
          <View style={[styles.herdStatBox, { borderColor: Colors.primary[100] }]}>
            <Text variant="h3" weight="bold" color={Colors.primary[500]}>
              {cowCount}
            </Text>
            <Text variant="caption" color="neutral.500" weight="medium">
              Cows
            </Text>
          </View>
          <View style={[styles.herdStatBox, { borderColor: Colors.secondary[100] }]}>
            <Text variant="h3" weight="bold" color={Colors.secondary[500]}>
              {heiferCount}
            </Text>
            <Text variant="caption" color="neutral.500" weight="medium">
              Heifers
            </Text>
          </View>
        </View>
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
                {farmInspection?.herdBcs ? farmInspection.herdBcs.toFixed(1) : metrics.averageHerdBCS}
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

  const renderPregnancy = () => {
    const cr = getPregnancyMetric('conceptionRate', `${metrics.conceptionRate}%`, '65%');
    const ir42 = getPregnancyMetric('incalfRate42d', `${metrics.pregnancyRate42d}%`, '75%');
    const ir100 = getPregnancyMetric('incalfRate100d', `${metrics.pregnancyRate200d}%`, '90%');
    const pd1 = getPregnancyMetric('firstTrimesterPD', String(t1), '—');
    const pd2 = getPregnancyMetric('secondTrimesterPD', String(t2), '—');
    const pd3 = getPregnancyMetric('thirdTrimesterPD', String(t3), '—');

    return (
      <Card 
        style={styles.card}
        title="Pregnancy Statistics"
        headerRight={
          profile?.role === 'admin' && (
            <TouchableOpacity onPress={handleOpenPregnancyModal} style={styles.editButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text variant="body2" color="primary.600" weight="bold">Modify</Text>
            </TouchableOpacity>
          )
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text variant="body" weight="medium">
              Total Served:
            </Text>
            <Text variant="body" weight="bold">{totalServed}</Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="body" weight="medium">
              Total Incalf:
            </Text>
            <Text variant="body" weight="bold">{totalIncalf}</Text>
          </View>

          <View style={[styles.statRow, { borderBottomWidth: 0, marginTop: 12, paddingVertical: 4 }]}>
            <Text variant="caption" weight="bold" color="neutral.400" style={{ flex: 2 }}>METRIC</Text>
            <Text variant="caption" weight="bold" color="neutral.400" style={{ flex: 1.2, textAlign: 'center' }}>ATTAINED</Text>
            <Text variant="caption" weight="bold" color="neutral.400" style={{ flex: 1.2, textAlign: 'center' }}>TARGET</Text>
          </View>

          <View style={styles.tableRowCustom}>
            <Text variant="body2" weight="medium" color="neutral.800" style={{ flex: 2 }}>Conception Rate</Text>
            <Text variant="body" weight="bold" color="success.500" style={{ flex: 1.2, textAlign: 'center' }}>{cr.attained}</Text>
            <Text variant="body" weight="medium" color="neutral.500" style={{ flex: 1.2, textAlign: 'center' }}>{cr.target}</Text>
          </View>

          <View style={styles.tableRowCustom}>
            <Text variant="body2" weight="medium" color="neutral.800" style={{ flex: 2 }}>42-Day Incalf Rate</Text>
            <Text variant="body" weight="bold" color="primary.500" style={{ flex: 1.2, textAlign: 'center' }}>{ir42.attained}</Text>
            <Text variant="body" weight="medium" color="neutral.500" style={{ flex: 1.2, textAlign: 'center' }}>{ir42.target}</Text>
          </View>

          <View style={styles.tableRowCustom}>
            <Text variant="body2" weight="medium" color="neutral.800" style={{ flex: 2 }}>100-Day Incalf Rate</Text>
            <Text variant="body" weight="bold" color="primary.500" style={{ flex: 1.2, textAlign: 'center' }}>{ir100.attained}</Text>
            <Text variant="body" weight="medium" color="neutral.500" style={{ flex: 1.2, textAlign: 'center' }}>{ir100.target}</Text>
          </View>

          <View style={styles.tableRowCustom}>
            <Text variant="body2" weight="medium" color="neutral.800" style={{ flex: 2 }}>1st Trimester PD</Text>
            <Text variant="body" weight="bold" color="neutral.800" style={{ flex: 1.2, textAlign: 'center' }}>{pd1.attained}</Text>
            <Text variant="body" weight="medium" color="neutral.500" style={{ flex: 1.2, textAlign: 'center' }}>{pd1.target}</Text>
          </View>

          <View style={styles.tableRowCustom}>
            <Text variant="body2" weight="medium" color="neutral.800" style={{ flex: 2 }}>2nd Trimester PD</Text>
            <Text variant="body" weight="bold" color="neutral.800" style={{ flex: 1.2, textAlign: 'center' }}>{pd2.attained}</Text>
            <Text variant="body" weight="medium" color="neutral.500" style={{ flex: 1.2, textAlign: 'center' }}>{pd2.target}</Text>
          </View>

          <View style={styles.tableRowCustom}>
            <Text variant="body2" weight="medium" color="neutral.800" style={{ flex: 2 }}>3rd Trimester PD</Text>
            <Text variant="body" weight="bold" color="neutral.800" style={{ flex: 1.2, textAlign: 'center' }}>{pd3.attained}</Text>
            <Text variant="body" weight="medium" color="neutral.500" style={{ flex: 1.2, textAlign: 'center' }}>{pd3.target}</Text>
          </View>

          {farmInspection?.pregnancyOverrides?.lastUpdated && (
            <Text variant="caption" color="neutral.400" style={{ marginTop: 16, textAlign: 'right', fontStyle: 'italic' }}>
              Last updated: {farmInspection.pregnancyOverrides.lastUpdated}
            </Text>
          )}
        </View>
      </Card>
    );
  };

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
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="body">
              {farmInspection?.calvingOverrides?.interval || '365 days'}
            </Text>
            {farmInspection?.calvingOverrides?.lastUpdated && (
              <Text variant="caption" color="neutral.400" style={{ fontStyle: 'italic', marginTop: 2 }}>
                Updated: {farmInspection.calvingOverrides.lastUpdated}
              </Text>
            )}
          </View>
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

  const GENETICS_TARGETS_KEYS = [
    { key: 'breedingBCS',      label: 'Breeding BCS' },
    { key: 'inCalf',           label: 'In Calf' },
    { key: 'conceptionRate',   label: 'Conception Rate' },
    { key: 'firstTrimesterPD', label: '1st Trimester PD' },
    { key: 'secondTrimesterPD',label: '2nd Trimester PD' },
    { key: 'thirdTrimesterPD', label: '3rd Trimester PD' },
    { key: 'calvingInterval',  label: 'Calving Interval' },
    { key: 'calfMortality',    label: 'Calf Mortality' },
    { key: 'calfCropPercent',  label: 'Calf Crop %' },
    { key: 'vigour',           label: 'Vigour' },
  ];

  const renderGeneticsTargets = () => {
    const targets = (farmInspection as any)?.geneticsTargets || {};
    const total = GENETICS_TARGETS_KEYS.reduce((sum, { key }) => {
      return sum + (targets[key]?.attained ?? 0);
    }, 0);
    const max = GENETICS_TARGETS_KEYS.length * 5;

    return (
      <Card style={styles.card}>
        <Text variant="h5" weight="medium" style={styles.cardTitle}>
          Genetics & Production Targets
        </Text>

        {/* Table Header */}
        <View style={[styles.statRow, { borderBottomWidth: 0, marginTop: 4, paddingVertical: 4 }]}>
          <Text variant="caption" weight="bold" color="neutral.400" style={{ flex: 2 }}>TARGET</Text>
          <Text variant="caption" weight="bold" color="neutral.400" style={{ flex: 1.2, textAlign: 'center' }}>ATTAINED</Text>
          <Text variant="caption" weight="bold" color="neutral.400" style={{ flex: 1.2, textAlign: 'center' }}>TARGET</Text>
        </View>

        {GENETICS_TARGETS_KEYS.map(({ key, label }) => {
          const item = targets[key];
          const attained = item?.attained ?? 0;
          const target = item?.target ?? 5;
          return (
            <View key={key} style={styles.tableRowCustom}>
              <Text variant="body2" weight="medium" color="neutral.800" style={{ flex: 2 }}>{label}</Text>
              <View style={{ flex: 1.2, alignItems: 'center' }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: attained === 5 ? Colors.success[500] : Colors.neutral[200],
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  <Text variant="caption" weight="bold" style={{ color: attained === 5 ? '#FFFFFF' : Colors.neutral[600] }}>
                    {attained}
                  </Text>
                </View>
              </View>
              <Text variant="body" weight="medium" color="neutral.500" style={{ flex: 1.2, textAlign: 'center' }}>{target}</Text>
            </View>
          );
        })}

        {/* Total Score */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.neutral[200] }}>
          <Text variant="body" weight="bold" color="neutral.700">Total Score</Text>
          <Text variant="h4" weight="bold" style={{ color: total >= max * 0.7 ? Colors.success[500] : total >= max * 0.4 ? Colors.warning[500] : Colors.error[500] }}>
            {total} / {max}
          </Text>
        </View>

        {targets.lastUpdated && (
          <Text variant="caption" color="neutral.400" style={{ marginTop: 8, textAlign: 'right', fontStyle: 'italic' }}>
            Last updated: {targets.lastUpdated}
          </Text>
        )}

        {/* Admin Modify Button */}
        {profile?.role === 'admin' && (
          <TouchableOpacity
            style={{
              marginTop: 16,
              backgroundColor: Colors.primary[50],
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.primary[200]
            }}
            onPress={handleOpenTargetsModal}
          >
            <Text variant="button" color="primary.600">Modify</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  return (
    <ScreenContainer style={styles.container} scrollable={false}>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={{ paddingRight: 16 }}>
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
          <TouchableOpacity
            style={[styles.tab, activeTab === 'targets' && styles.activeTab]}
            onPress={() => setActiveTab('targets')}
          >
            <Text variant="button" color={activeTab === 'targets' ? 'primary.500' : 'neutral.600'}>
              Targets
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>


        {activeTab === 'herds' && renderBreedingHerds()}
        {activeTab === 'breeds' && renderBreeds()}
        {activeTab === 'pregnancy' && renderPregnancy()}
        {activeTab === 'calving' && renderCalving()}
        {activeTab === 'bulls' && renderBullsAndBreedingSoundness()}
        {activeTab === 'targets' && renderGeneticsTargets()}
      </ScrollView>

      <Modal
        visible={isPregnancyModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPregnancyModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoiding}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text variant="h3" weight="bold" color={Colors.neutral[800]}>
                  Modify Pregnancy Stats
                </Text>
                <TouchableOpacity onPress={() => setIsPregnancyModalOpen(false)}>
                  <Text variant="body" weight="medium" color={Colors.error[500]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  
                  {/* Conception Rate */}
                  <View style={styles.metricRow}>
                    <Text variant="body2" weight="medium" color={Colors.neutral[700]} style={styles.metricLabel}>
                      Conception Rate (%)
                    </Text>
                    <View style={styles.inputsRow}>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Attained</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.conceptionRateAttained}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, conceptionRateAttained: val }))}
                          keyboardType="decimal-pad"
                          placeholder="e.g. 67"
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Target</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.conceptionRateTarget}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, conceptionRateTarget: val }))}
                          keyboardType="decimal-pad"
                          placeholder="e.g. 65"
                        />
                      </View>
                    </View>
                  </View>

                  {/* 42-Day Incalf Rate */}
                  <View style={styles.metricRow}>
                    <Text variant="body2" weight="medium" color={Colors.neutral[700]} style={styles.metricLabel}>
                      42-Day Incalf Rate (%)
                    </Text>
                    <View style={styles.inputsRow}>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Attained</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.incalfRate42dAttained}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, incalfRate42dAttained: val }))}
                          keyboardType="decimal-pad"
                          placeholder="e.g. 78"
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Target</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.incalfRate42dTarget}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, incalfRate42dTarget: val }))}
                          keyboardType="decimal-pad"
                          placeholder="e.g. 75"
                        />
                      </View>
                    </View>
                  </View>

                  {/* 100-Day Incalf Rate */}
                  <View style={styles.metricRow}>
                    <Text variant="body2" weight="medium" color={Colors.neutral[700]} style={styles.metricLabel}>
                      100-Day Incalf Rate (%)
                    </Text>
                    <View style={styles.inputsRow}>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Attained</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.incalfRate100dAttained}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, incalfRate100dAttained: val }))}
                          keyboardType="decimal-pad"
                          placeholder="e.g. 92"
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Target</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.incalfRate100dTarget}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, incalfRate100dTarget: val }))}
                          keyboardType="decimal-pad"
                          placeholder="e.g. 90"
                        />
                      </View>
                    </View>
                  </View>

                  {/* 1st Trimester PD */}
                  <View style={styles.metricRow}>
                    <Text variant="body2" weight="medium" color={Colors.neutral[700]} style={styles.metricLabel}>
                      1st Trimester PD
                    </Text>
                    <View style={styles.inputsRow}>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Attained</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.firstTrimesterPDAttained}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, firstTrimesterPDAttained: val }))}
                          placeholder="e.g. 15"
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Target</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.firstTrimesterPDTarget}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, firstTrimesterPDTarget: val }))}
                          placeholder="e.g. 20"
                        />
                      </View>
                    </View>
                  </View>

                  {/* 2nd Trimester PD */}
                  <View style={styles.metricRow}>
                    <Text variant="body2" weight="medium" color={Colors.neutral[700]} style={styles.metricLabel}>
                      2nd Trimester PD
                    </Text>
                    <View style={styles.inputsRow}>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Attained</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.secondTrimesterPDAttained}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, secondTrimesterPDAttained: val }))}
                          placeholder="e.g. 10"
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Target</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.secondTrimesterPDTarget}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, secondTrimesterPDTarget: val }))}
                          placeholder="e.g. 15"
                        />
                      </View>
                    </View>
                  </View>

                  {/* 3rd Trimester PD */}
                  <View style={styles.metricRow}>
                    <Text variant="body2" weight="medium" color={Colors.neutral[700]} style={styles.metricLabel}>
                      3rd Trimester PD
                    </Text>
                    <View style={styles.inputsRow}>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Attained</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.thirdTrimesterPDAttained}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, thirdTrimesterPDAttained: val }))}
                          placeholder="e.g. 5"
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <Text variant="caption" color={Colors.neutral[400]}>Target</Text>
                        <TextInput
                          style={styles.textInput}
                          value={pregnancyForm.thirdTrimesterPDTarget}
                          onChangeText={(val) => setPregnancyForm(prev => ({ ...prev, thirdTrimesterPDTarget: val }))}
                          placeholder="e.g. 8"
                        />
                      </View>
                    </View>
                  </View>

                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setIsPregnancyModalOpen(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSavePregnancyOverrides}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Targets Modal */}
      <Modal
        visible={isTargetsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTargetsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoiding}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text variant="h3" weight="bold" color={Colors.neutral[800]}>
                  Modify Genetics Targets
                </Text>
                <TouchableOpacity onPress={() => setIsTargetsModalOpen(false)}>
                  <Text variant="body" weight="medium" color={Colors.error[500]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              <Text variant="caption" color="neutral.500" style={{ marginBottom: 12 }}>
                Tap a metric to mark it as attained (5) or not attained (0).
              </Text>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  {GENETICS_TARGETS_KEYS.map(({ key, label }) => {
                    const val = targetsForm[key] ?? 0;
                    return (
                      <View key={key} style={styles.metricRow}>
                        <Text variant="body" weight="medium" color="neutral.700" style={styles.metricLabel}>
                          {label}
                        </Text>
                        <TouchableOpacity
                          style={{
                            width: 50,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: val === 5 ? Colors.success[500] : Colors.neutral[300],
                            padding: 2,
                            justifyContent: 'center',
                          }}
                          onPress={() => setTargetsForm(prev => ({ ...prev, [key]: val === 0 ? 5 : 0 }))}
                          activeOpacity={0.8}
                        >
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: Colors.white,
                              transform: [{ translateX: val === 5 ? 22 : 0 }],
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.2,
                              shadowRadius: 1,
                              elevation: 2,
                            }}
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.primary[600] }]}
                  onPress={handleSaveTargets}
                >
                  <Text variant="button" color="white">Save</Text>
                </TouchableOpacity>
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
  herdStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  herdStatBox: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  tableRowCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
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
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
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
    width: 72,
    textAlign: 'center',
    marginTop: 4,
    color: Colors.neutral[800],
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    paddingTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  saveButton: {
    flex: 1.5,
    backgroundColor: Colors.primary[500],
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: Colors.neutral[600],
    fontWeight: '600',
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});