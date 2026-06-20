import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { router } from 'expo-router';
import { Package, ArrowRight, Clipboard } from 'lucide-react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';
import { useFarmData } from '../../context/FarmDataContext';

interface NutritionMetric {
  id: string;
  category: string;
  result: number | string;
  target: number | string;
  status: 'pass' | 'fail' | 'warning';
}

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
  const { metrics, farmInspection, updateFarmInspection, profile } = useFarmData();
  const isAdmin = profile?.role === 'admin';

  // Local state for Herd BCS Questionnaire Modal
  const [isHerdBcsModalVisible, setIsHerdBcsModalVisible] = useState(false);
  const [herdBcs, setHerdBcs] = useState(farmInspection.herdBcs || 1);

  // Local state for the interactive Questionnaire Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dung, setDung] = useState(farmInspection.dungConsistency || 1);
  const [rumen, setRumen] = useState(farmInspection.rumenFill || 1);
  const [coat, setCoat] = useState(farmInspection.coatSkin || 1);
  const [motility, setMotility] = useState(farmInspection.motilityLocomotion || 1);

  // Local state for the Growth Rate Perception Questionnaire Modal
  const [isGrowthModalVisible, setIsGrowthModalVisible] = useState(false);
  const [muscle, setMuscle] = useState(farmInspection.muscleDefinition || 1);
  const [frame, setFrame] = useState(farmInspection.frameSizing || 1);
  const [fatCover, setFatCover] = useState(farmInspection.fatCoverDevelopment || 1);
  const [symmetry, setSymmetry] = useState(farmInspection.skeletalSymmetry || 1);

  // Local state for the Nutritional Management Questionnaire Modal
  const [isMgtModalVisible, setIsMgtModalVisible] = useState(false);
  const [bunk, setBunk] = useState(farmInspection.bunkFeedAvailability || 1);
  const [sorting, setSorting] = useState(farmInspection.rationSortingBehaviour || 1);
  const [water, setWater] = useState(farmInspection.waterQualityAccess || 1);
  const [forage, setForage] = useState(farmInspection.forageQualityPerception || 1);

  const columns = [
    {
      key: 'category',
      title: 'Category',
      width: 140,
    },
    {
      key: 'result',
      title: 'Result',
      width: 90,
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
    {
      key: 'actions',
      title: 'Actions',
      width: 110,
      align: 'center' as const,
      render: (_: any, row: any) => {
        if (row.category === 'Herd BCS' && isAdmin) {
          return (
            <TouchableOpacity
              style={styles.inlineAssessButton}
              onPress={() => {
                setHerdBcs(farmInspection.herdBcs || 1);
                setIsHerdBcsModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text variant="caption" weight="bold" color="primary.500">
                Assess
              </Text>
            </TouchableOpacity>
          );
        }
        if (row.category === 'Deficiencies' && isAdmin) {
          return (
            <TouchableOpacity
              style={styles.inlineAssessButton}
              onPress={() => {
                setDung(farmInspection.dungConsistency || 1);
                setRumen(farmInspection.rumenFill || 1);
                setCoat(farmInspection.coatSkin || 1);
                setMotility(farmInspection.motilityLocomotion || 1);
                setIsModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text variant="caption" weight="bold" color="primary.500">
                Assess
              </Text>
            </TouchableOpacity>
          );
        }
        if (row.category === 'Growth Perception' && isAdmin) {
          return (
            <TouchableOpacity
              style={styles.inlineAssessButton}
              onPress={() => {
                setMuscle(farmInspection.muscleDefinition || 1);
                setFrame(farmInspection.frameSizing || 1);
                setFatCover(farmInspection.fatCoverDevelopment || 1);
                setSymmetry(farmInspection.skeletalSymmetry || 1);
                setIsGrowthModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text variant="caption" weight="bold" color="primary.500">
                Assess
              </Text>
            </TouchableOpacity>
          );
        }
        if (row.category === 'Management' && isAdmin) {
          return (
            <TouchableOpacity
              style={styles.inlineAssessButton}
              onPress={() => {
                setBunk(farmInspection.bunkFeedAvailability || 1);
                setSorting(farmInspection.rationSortingBehaviour || 1);
                setWater(farmInspection.waterQualityAccess || 1);
                setForage(farmInspection.forageQualityPerception || 1);
                setIsMgtModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text variant="caption" weight="bold" color="primary.500">
                Assess
              </Text>
            </TouchableOpacity>
          );
        }
        return null;
      },
    },
  ];

  // WGM / ADG status check (Cattle target: 0.68 poor, 0.9 good, 1.13 excellent)
  const adgVal = metrics.adg.cattle;
  const adgStatus = adgVal > 0 ? (adgVal >= 1.13 ? 'pass' : adgVal >= 0.9 ? 'warning' : 'fail') : 'warning';
  const adgLabel = adgVal > 0 ? `${adgVal} kg/d` : 'N/A';

  // BCS status check (BCS score target: 2.0 - 4.0)
  const bcsVal = farmInspection.herdBcs ? farmInspection.herdBcs : metrics.averageHerdBCS;
  const bcsStatus = bcsVal > 0 ? ((bcsVal >= 2.0 && bcsVal <= 4.0) ? 'pass' : 'fail') : 'warning';
  const bcsLabel = bcsVal > 0 ? `${bcsVal}` : 'N/A';

  // Deficiencies status check (Calculated Average: 1 = Poor, 5 = Excellent)
  const defVal = farmInspection.nutritionalDeficiencies;
  const defStatus = defVal > 0 ? (defVal >= 4 ? 'pass' : defVal >= 3 ? 'warning' : 'fail') : 'warning';
  const defLabel = defVal > 0 ? `${defVal}/5` : 'N/A';

  // FCR status check (Cattle range 8.0 - 12.0: 8 excellent, 10 good, 12 poor)
  const fcrVal = metrics.fcr.cattle;
  const fcrStatus = fcrVal > 0 ? (fcrVal <= 8.0 ? 'pass' : fcrVal <= 10.0 ? 'warning' : 'fail') : 'warning';
  const fcrLabel = fcrVal > 0 ? `${fcrVal}:1` : 'N/A';

  // Growth perception status check (Subjective 1-5)
  const growthVal = farmInspection.growthRatePerception;
  const growthStatus = growthVal > 0 ? (growthVal >= 4 ? 'pass' : growthVal >= 3 ? 'warning' : 'fail') : 'warning';
  const growthLabel = growthVal > 0 ? (growthVal >= 4.5 ? 'Excellent' : growthVal >= 3.5 ? 'Good' : growthVal >= 2.5 ? 'Moderate' : 'Poor') : 'N/A';

  // Nutritional management (Subjective 1-5)
  const mgtVal = farmInspection.overallNutritionalHealth;
  const mgtStatus = mgtVal > 0 ? (mgtVal >= 4 ? 'pass' : mgtVal >= 3 ? 'warning' : 'fail') : 'warning';
  const mgtLabel = mgtVal > 0 ? (mgtVal >= 4.5 ? 'Excellent' : mgtVal >= 3.5 ? 'Good' : mgtVal >= 2.5 ? 'Moderate' : 'Poor') : 'N/A';

  const nutritionMetrics: NutritionMetric[] = [
    {
      id: '1',
      category: 'Weight Gain (ADG)',
      result: adgLabel,
      target: '0.9 - 1.13',
      status: adgStatus,
    },
    {
      id: '2',
      category: 'Herd BCS',
      result: bcsLabel,
      target: '2.0 - 4.0',
      status: bcsStatus,
    },
    {
      id: '3',
      category: 'Deficiencies',
      result: defLabel,
      target: 'Optimal (5)',
      status: defStatus,
    },
    {
      id: '4',
      category: 'Feed Ratio (FCR)',
      result: fcrLabel,
      target: '8.0 - 10.0',
      status: fcrStatus,
    },
    {
      id: '5',
      category: 'Growth Perception',
      result: growthLabel,
      target: 'Excellent',
      status: growthStatus,
    },
    {
      id: '6',
      category: 'Management',
      result: mgtLabel,
      target: 'Excellent',
      status: mgtStatus,
    },
  ];

  const handleSaveHerdBcsQuestionnaire = () => {
    updateFarmInspection({
      herdBcs: herdBcs,
    });
    setIsHerdBcsModalVisible(false);
  };

  const handleSaveQuestionnaire = () => {
    updateFarmInspection({
      dungConsistency: dung,
      rumenFill: rumen,
      coatSkin: coat,
      motilityLocomotion: motility,
    });
    setIsModalVisible(false);
  };

  const handleSaveGrowthQuestionnaire = () => {
    updateFarmInspection({
      muscleDefinition: muscle,
      frameSizing: frame,
      fatCoverDevelopment: fatCover,
      skeletalSymmetry: symmetry,
    });
    setIsGrowthModalVisible(false);
  };

  const handleSaveMgtQuestionnaire = () => {
    updateFarmInspection({
      bunkFeedAvailability: bunk,
      rationSortingBehaviour: sorting,
      waterQualityAccess: water,
      forageQualityPerception: forage,
    });
    setIsMgtModalVisible(false);
  };

  // Helper text dynamically changing based on scores
  const getHerdBcsText = (score: number) => {
    if (score === 1) return 'Emaciated\n• Spine, ribs, hooks, and pins are sharp and highly visible.\n• No visible fat over the tailhead or ribs.\n• Severe muscle wasting is present.';
    if (score === 2) return 'Thin\n• Spine and ribs are easily visible but not sharp.\n• Hooks and pins are prominent but have a light layer of tissue.\n• Tailhead is hollow with no feeling of fat.';
    if (score === 3) return 'Ideal / Moderate\n• Ribs are covered and only visible upon close inspection.\n• Spine, hooks, and pins are rounded and smooth.\n• Tailhead area is filled out with a soft, palpable fat cover.';
    if (score === 4) return 'Fat\n• Spine and individual ribs are completely hidden.\n• Hooks and pins are rounded with obvious fat deposits.\n• Tailhead feels soft and spongy with noticeable fat patches.';
    return 'Obese\n• Bone structures are completely buried in fat.\n• Tailhead is buried in thick, heavy fat blocks.\n• Animal walks with a heavy, impaired gait due to excess fat.';
  };

  const getDungText = (score: number) => {
    if (score <= 2) return 'Deficient: Watery fluid and splattering';
    if (score === 3) return 'Optimal: Porridge-like 3cm pat';
    return 'Dry / Solid: Sub-optimal digestion';
  };

  const getRumenText = (score: number) => {
    if (score <= 2) return 'Deficient: Deep skin fold and hollow flank';
    if (score <= 4) return 'Optimal: Softly arched flank';
    return 'Full: Well fed / optimal fill';
  };

  const getCoatText = (score: number) => {
    if (score <= 2) return 'Deficient: Dull, dry hair and patchy loss';
    if (score === 3) return 'Sub-optimal: Dry coat, minor hair shedding';
    return 'Optimal: Shiny, smooth, and supple';
  };

  const getMotilityText = (score: number) => {
    if (score <= 2) return 'Deficient: Stiff gait, favoring legs, swollen joints';
    if (score === 3) return 'Sub-optimal: Sluggish movement, minor joint tenderness';
    return 'Optimal: Fluid, even strides';
  };

  const getMuscleText = (score: number) => {
    if (score <= 2) return 'Deficient: Flat hindquarters, prominent shoulder blades, narrow loin';
    if (score === 3) return 'Sub-optimal: Moderate definition, slightly narrow loin';
    return 'Optimal: Thick, rounded thigh and wide, well-fleshed back';
  };

  const getFrameText = (score: number) => {
    if (score <= 2) return 'Deficient: Short, stunted height, narrow chest, small skeleton';
    if (score <= 4) return 'Optimal: Long, deep-bodied frame matching benchmarks';
    return 'Large: Sizing exceeds standard herd benchmarks';
  };

  const getFatCoverText = (score: number) => {
    if (score <= 2) return 'Deficient: Sharp, bony hip hooks and visible spine';
    if (score <= 4) return 'Optimal: Smooth, soft covering over ribs and tailhead';
    return 'Patchy: Excessive fat cover with patchiness';
  };

  const getSymmetryText = (score: number) => {
    if (score <= 2) return 'Deficient: Asymmetrical bone growth, roached back, uneven hip';
    if (score === 3) return 'Sub-optimal: Minor asymmetry or slight posture deviation';
    return 'Optimal: Straight topline and square, balanced stance';
  };

  const getBunkText = (score: number) => {
    if (score <= 2) return 'Deficient/Restricted: Empty feed bunks, aggressive crowding, licking ground';
    if (score <= 4) return 'Optimal: Slick bunks with <5% fresh leftovers at next feeding';
    return 'Excessive: Overfeeding leftovers present';
  };

  const getSortingText = (score: number) => {
    if (score <= 2) return 'Deficient: Large piles of coarse stems, holes pushed, animals tossing feed';
    if (score === 3) return 'Sub-optimal: Moderate feed sorting or uneven feed line';
    return 'Optimal: Uniform, undisturbed feed line';
  };

  const getWaterText = (score: number) => {
    if (score <= 2) return 'Deficient: Algae-filled, dirty troughs, slow refilling, crowding';
    if (score === 3) return 'Sub-optimal: Minor dirt/algae, slightly restricted access';
    return 'Optimal: Clear, clean, odourless water with easy, uncrowded access';
  };

  const getForageText = (score: number) => {
    if (score <= 2) return 'Deficient: Coarse, stemmy, moldy, bleached hay, low leaf-to-stem ratio';
    if (score <= 4) return 'Optimal: Green, leafy, sweet-smelling, pliable, high palatability';
    return 'Over-mature: Rich or stemmy forage exceeds optimal values';
  };

  const getNumberStatus = (
    category: 'dung' | 'rumen' | 'coat' | 'motility' | 'muscle' | 'frame' | 'fatCover' | 'symmetry' | 'bunk' | 'sorting' | 'water' | 'forage' | 'herdBcs',
    num: number
  ): 'optimal' | 'warning' | 'deficient' => {
    if (category === 'herdBcs') return num === 3 ? 'optimal' : (num === 2 || num === 4) ? 'warning' : 'deficient';
    if (num <= 2) return 'deficient';
    if (category === 'dung') {
      return num === 3 ? 'optimal' : 'warning';
    }
    if (category === 'rumen') {
      return (num === 3 || num === 4) ? 'optimal' : 'warning';
    }
    if (category === 'coat' || category === 'motility' || category === 'muscle' || category === 'symmetry' || category === 'sorting' || category === 'water') {
      return num >= 4 ? 'optimal' : 'warning';
    }
    // frame, fatCover, bunk, forage
    return (num === 3 || num === 4) ? 'optimal' : 'warning';
  };

  const getStatusColor = (status: 'optimal' | 'warning' | 'deficient') => {
    if (status === 'optimal') return Colors.success[600];
    if (status === 'warning') return Colors.warning[600];
    return Colors.error[500];
  };

  const renderSegmentedControl = (
    category: 'dung' | 'rumen' | 'coat' | 'motility' | 'muscle' | 'frame' | 'fatCover' | 'symmetry' | 'bunk' | 'sorting' | 'water' | 'forage' | 'herdBcs',
    value: number,
    onValueChange: (val: number) => void,
    helperText: string
  ) => {
    const currentStatus = getNumberStatus(category, value);
    const activeColor = getStatusColor(currentStatus);
    
    return (
      <View style={styles.questionBlock}>
        <View style={styles.segmentedControl}>
          {[1, 2, 3, 4, 5].map((num) => {
            const numStatus = getNumberStatus(category, num);
            const isActive = value === num;
            
            let btnActiveStyle = styles.segmentButtonActiveOpt;
            if (numStatus === 'deficient') btnActiveStyle = styles.segmentButtonActiveDef;
            else if (numStatus === 'warning') btnActiveStyle = styles.segmentButtonActiveWarn;

            return (
              <TouchableOpacity
                key={num}
                style={[
                  styles.segmentButton,
                  isActive && btnActiveStyle,
                ]}
                onPress={() => onValueChange(num)}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    isActive && styles.segmentButtonTextActive,
                  ]}
                  weight="bold"
                >
                  {num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text
          variant="caption"
          weight="medium"
          style={[
            styles.scoreHelperText,
            { color: activeColor }
          ]}
        >
          {helperText}
        </Text>
      </View>
    );
  };

  return (
    <ScreenContainer style={styles.container} scrollable={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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


        <Card style={{
          marginBottom: 16,
          borderRadius: 12,
          padding: 16,
          backgroundColor: Colors.primary[50],
          borderWidth: 1,
          borderColor: Colors.primary[100],
        }}>
          <View style={styles.inventoryHeader}>
            <Package size={24} color={Colors.primary[500]} style={styles.inventoryIcon} />
            <Text variant="h5" weight="medium" style={{ flex: 1 }}>
              Nutrition Inventory & Management
            </Text>
          </View>
          <Text variant="body2" color="neutral.600" style={styles.inventoryDescription}>
            Track and manage your feed inventory, monitor consumption rates, and plan feed requirements.
          </Text>
          <TouchableOpacity 
            style={[styles.inventoryButton, { marginTop: 12, justifyContent: 'center' }]}
            onPress={() => router.push('/(tabs)/tasks')}
          >
            <Text variant="button" color="primary.500" style={{ marginRight: 6 }}>View Inventory</Text>
            <ArrowRight size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Herd BCS Questionnaire Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isHerdBcsModalVisible}
        onRequestClose={() => setIsHerdBcsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h5" weight="bold" style={styles.modalTitle}>
              Herd BCS Assessment
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.modalSub}>
              Score the body condition of the herd (1-5) based on the guide.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  1. Herd Body Condition Score
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Select the score that best represents the average condition of the herd.
                </Text>
                {renderSegmentedControl('herdBcs', herdBcs, setHerdBcs, getHerdBcsText(herdBcs))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsHerdBcsModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveHerdBcsQuestionnaire}
                style={styles.saveButton}
              >
                Save Assessment
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Questionnaire Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h5" weight="bold" style={styles.modalTitle}>
              Deficiencies Questionnaire
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.modalSub}>
              Rate the deficiency parameters (1-5) based on physical observations.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              
              {/* Dung Consistency */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  1. Dung Consistency
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Watery fluid and wide splattering indicates deficiency; optimal is a porridge-like 3cm pat.
                </Text>
                {renderSegmentedControl('dung', dung, setDung, getDungText(dung))}
              </View>

              {/* Rumen Fill */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  2. Rumen Fill
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Deep skin fold and hollow flank indicate deficiency; optimal is a softly arched flank.
                </Text>
                {renderSegmentedControl('rumen', rumen, setRumen, getRumenText(rumen))}
              </View>

              {/* Coat & Skin */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  3. Coat & Skin
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Dull, dry hair and patchy loss indicate deficiency; optimal is shiny, smooth, and supple.
                </Text>
                {renderSegmentedControl('coat', coat, setCoat, getCoatText(coat))}
              </View>

              {/* Motility & Locomotion */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  4. Motility & Locomotion
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Stiff gait, favoring legs, and swollen joints indicate deficiency; optimal is fluid, even strides.
                </Text>
                {renderSegmentedControl('motility', motility, setMotility, getMotilityText(motility))}
              </View>

            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveQuestionnaire}
                style={styles.saveButton}
              >
                Save Assessment
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Growth Rate Perception Questionnaire Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isGrowthModalVisible}
        onRequestClose={() => setIsGrowthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h5" weight="bold" style={styles.modalTitle}>
              Growth Rate Perception Questionnaire
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.modalSub}>
              Rate the growth parameters (1-5) based on physical observations.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              
              {/* Muscle Definition */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  1. Muscle Definition
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Flat hindquarters, prominent shoulder blades, and narrow loin indicate deficiency; optimal is a thick, rounded thigh and wide, well-fleshed back.
                </Text>
                {renderSegmentedControl('muscle', muscle, setMuscle, getMuscleText(muscle))}
              </View>

              {/* Frame Sizing */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  2. Frame Sizing
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Short, stunted height relative to age, narrow chest width, and small skeleton indicate deficiency; optimal is a long, deep-bodied frame matching benchmarks.
                </Text>
                {renderSegmentedControl('frame', frame, setFrame, getFrameText(frame))}
              </View>

              {/* Fat Cover Development */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  3. Fat Cover Development
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Sharp, bony hip hooks and visible spine indicate severe energy deficiency; optimal is a smooth, soft covering over ribs and tailhead without excessive patchiness.
                </Text>
                {renderSegmentedControl('fatCover', fatCover, setFatCover, getFatCoverText(fatCover))}
              </View>

              {/* Skeletal Symmetry */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  4. Skeletal Symmetry
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Asymmetrical bone growth, roached back, or uneven hip height indicates structural nutrient deficiency; optimal is a straight topline and square, balanced stance.
                </Text>
                {renderSegmentedControl('symmetry', symmetry, setSymmetry, getSymmetryText(symmetry))}
              </View>

            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsGrowthModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveGrowthQuestionnaire}
                style={styles.saveButton}
              >
                Save Assessment
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Nutritional Management Questionnaire Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isMgtModalVisible}
        onRequestClose={() => setIsMgtModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h5" weight="bold" style={styles.modalTitle}>
              Nutritional Management Questionnaire
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.modalSub}>
              Rate the management parameters (1-5) based on observations.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              
              {/* Bunk & Feed Availability */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  1. Bunk & Feed Availability
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Empty feed bunks for extended periods, aggressive crowding, and cattle licking the ground indicate severe underfeeding; optimal is slick bunks with less than 5% fresh leftovers.
                </Text>
                {renderSegmentedControl('bunk', bunk, setBunk, getBunkText(bunk))}
              </View>

              {/* Ration Sorting Behaviour */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  2. Ration Sorting Behaviour
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Large piles of coarse stems left behind, holes pushed into feed, and animals tossing feed over their backs indicate poor mixing; optimal is a uniform, undisturbed feed line.
                </Text>
                {renderSegmentedControl('sorting', sorting, setSorting, getSortingText(sorting))}
              </View>

              {/* Water Quality & Access */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  3. Water Quality & Access
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Algae-filled, dirty troughs, slow refilling, or cattle crowding the water source indicates restriction; optimal is clear, clean, odourless water with easy, uncrowded access.
                </Text>
                {renderSegmentedControl('water', water, setWater, getWaterText(water))}
              </View>

              {/* Forage Quality Perception */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  4. Forage Quality Perception
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Coarse, stemmy, moldy, or bleached hay with low leaf-to-stem ratio indicates low energy/protein; optimal is green, leafy, sweet-smelling, pliable forage with high palatability.
                </Text>
                {renderSegmentedControl('forage', forage, setForage, getForageText(forage))}
              </View>

            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsMgtModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveMgtQuestionnaire}
                style={styles.saveButton}
              >
                Save Assessment
              </Button>
            </View>
          </View>
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
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  cardDescMargin: {
    marginBottom: 16,
  },
  parameterList: {
    gap: 12,
    marginTop: 8,
  },
  parameterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  parameterInfo: {
    flex: 1,
    marginRight: 12,
  },
  parameterValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inventoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inventoryIcon: {
    marginRight: 12,
  },
  inventoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  inventoryDescription: {
    marginTop: 8,
    lineHeight: 20,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxHeight: '85%',
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 4,
    color: Colors.neutral[900],
  },
  modalSub: {
    marginBottom: 16,
  },
  formScroll: {
    paddingBottom: 16,
  },
  inlineAssessButton: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionCard: {
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  questionTitle: {
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  questionDesc: {
    marginBottom: 12,
    lineHeight: 16,
  },
  questionBlock: {
    marginTop: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[200],
    borderRadius: 10,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActiveOpt: {
    backgroundColor: Colors.success[500],
  },
  segmentButtonActiveDef: {
    backgroundColor: Colors.error[500],
  },
  segmentButtonActiveWarn: {
    backgroundColor: Colors.warning[500],
  },
  segmentButtonText: {
    fontSize: 14,
    color: Colors.neutral[600],
  },
  segmentButtonTextActive: {
    color: Colors.white,
  },
  scoreHelperText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 11,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1.5,
  },
});