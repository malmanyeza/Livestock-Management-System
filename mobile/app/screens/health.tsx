import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Button } from '../../components/ui/Button';
import { useRouter, Stack } from 'expo-router';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Activity, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { Card } from '../../components/ui/Card';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { useFarmData } from '../../context/FarmDataContext';


interface HealthMetric {
  title: string;
  score: number;
  percentage: number;
  passed: boolean;
  color: string;
}

export default function HealthScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Health',
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
      <HealthContent />
    </>
  );
}

function HealthContent() {
  const router = useRouter();
  const { farmInspection, updateFarmInspection, profile } = useFarmData();
  const isAdmin = profile?.role === 'admin';

  // Track per-metric last assessment timestamps
  const [assessmentDates, setAssessmentDates] = React.useState<Record<string, string>>({});

  // Helper: derive consistent color from a 1-5 score
  const getScoreColor = (score: number): string => {
    const pct = score * 20;
    if (pct <= 40) return Colors.error[500];
    if (pct <= 70) return Colors.warning[500];
    return Colors.success[500];
  };

  // Local state for the Biosecurity Questionnaire Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [quarantine, setQuarantine] = useState(farmInspection.quarantineIntakeIsolation || 1);
  const [tracking, setTracking] = useState(farmInspection.herdTrackingMovementLogs || 1);
  const [boundary, setBoundary] = useState(farmInspection.farmBoundaryPestControl || 1);
  const [sanitation, setSanitation] = useState(farmInspection.sanitationVisitorControl || 1);

  // Local state for the Deworming Practice Questionnaire Modal
  const [isDewormingModalVisible, setIsDewormingModalVisible] = useState(false);
  const [dewormTiming, setDewormTiming] = useState(farmInspection.dewormingTiming || 1);
  const [dewormRotation, setDewormRotation] = useState(farmInspection.dewormingRotation || 1);
  const [dewormPrecision, setDewormPrecision] = useState(farmInspection.dewormingPrecision || 1);
  const [dewormTargeted, setDewormTargeted] = useState(farmInspection.dewormingTargeted || 1);

  // Local state for the Anthelmintic Rating Questionnaire Modal
  const [isAnthelminticModalVisible, setIsAnthelminticModalVisible] = useState(false);
  const [anthClass, setAnthClass] = useState(farmInspection.anthelminticClassSelection || 1);
  const [anthRoute, setAnthRoute] = useState(farmInspection.anthelminticAdminRoute || 1);
  const [anthCalib, setAnthCalib] = useState(farmInspection.anthelminticEquipmentCalib || 1);
  const [anthWithholding, setAnthWithholding] = useState(farmInspection.anthelminticWithholdingComp || 1);

  // Local state for the Antimicrobial Usage Questionnaire Modal
  const [isAntibioticModalVisible, setIsAntibioticModalVisible] = useState(false);
  const [antiPrescription, setAntiPrescription] = useState(farmInspection.antibioticPrescriptionControl || 1);
  const [antiClass, setAntiClass] = useState(farmInspection.antibioticDrugClassification || 1);
  const [antiRecords, setAntiRecords] = useState(farmInspection.antibioticTreatmentRecords || 1);
  const [antiCompletion, setAntiCompletion] = useState(farmInspection.antibioticCourseCompletion || 1);

  // Local state for the Vaccination Coverage Questionnaire Modal
  const [isVaccinationModalVisible, setIsVaccinationModalVisible] = useState(false);
  const [vaccProtocol, setVaccProtocol] = useState(farmInspection.vaccProtocolAdherence || 1);
  const [vaccPenetration, setVaccPenetration] = useState(farmInspection.vaccHerdPenetration || 1);
  const [vaccTiming, setVaccTiming] = useState(farmInspection.vaccTimingAccuracy || 1);
  const [vaccColdChain, setVaccColdChain] = useState(farmInspection.vaccColdChainIntegrity || 1);

  // Local state for the CPD Staff Control Questionnaire Modal
  const [isCpdModalVisible, setIsCpdModalVisible] = useState(false);
  const [cpdTraining, setCpdTraining] = useState(farmInspection.cpdTrainingFrequency || 1);
  const [cpdProtocol, setCpdProtocol] = useState(farmInspection.cpdProtocolAwareness || 1);
  const [cpdVet, setCpdVet] = useState(farmInspection.cpdVetCollaboration || 1);
  const [cpdBenchmark, setCpdBenchmark] = useState(farmInspection.cpdBenchmarkTracking || 1);

  // Local state for the Drug Box Management Questionnaire Modal
  const [isDrugBoxModalVisible, setIsDrugBoxModalVisible] = useState(false);
  const [dbExpiry, setDbExpiry] = useState(farmInspection.dbExpiryInventory || 1);
  const [dbCleanliness, setDbCleanliness] = useState(farmInspection.dbStorageCleanliness || 1);
  const [dbSecurity, setDbSecurity] = useState(farmInspection.dbSecurityAccess || 1);
  const [dbDisposal, setDbDisposal] = useState(farmInspection.dbDisposalPractices || 1);


  const handleSaveBiosecurity = () => {
    updateFarmInspection({
      quarantineIntakeIsolation: quarantine,
      herdTrackingMovementLogs: tracking,
      farmBoundaryPestControl: boundary,
      sanitationVisitorControl: sanitation,
    });
    setAssessmentDates(prev => ({ ...prev, 'Biosecurity Rating': new Date().toLocaleDateString() }));
    setIsModalVisible(false);
  };

  const handleSaveDeworming = () => {
    updateFarmInspection({
      dewormingTiming: dewormTiming,
      dewormingRotation: dewormRotation,
      dewormingPrecision: dewormPrecision,
      dewormingTargeted: dewormTargeted,
    });
    setAssessmentDates(prev => ({ ...prev, 'Deworming Practice': new Date().toLocaleDateString() }));
    setIsDewormingModalVisible(false);
  };

  const handleSaveAnthelmintic = () => {
    updateFarmInspection({
      anthelminticClassSelection: anthClass,
      anthelminticAdminRoute: anthRoute,
      anthelminticEquipmentCalib: anthCalib,
      anthelminticWithholdingComp: anthWithholding,
    });
    setAssessmentDates(prev => ({ ...prev, 'Antihelminthic Rating': new Date().toLocaleDateString() }));
    setIsAnthelminticModalVisible(false);
  };

  const handleSaveAntibiotic = () => {
    updateFarmInspection({
      antibioticPrescriptionControl: antiPrescription,
      antibioticDrugClassification: antiClass,
      antibioticTreatmentRecords: antiRecords,
      antibioticCourseCompletion: antiCompletion,
    });
    setAssessmentDates(prev => ({ ...prev, 'Antimicrobial Usage': new Date().toLocaleDateString() }));
    setIsAntibioticModalVisible(false);
  };

  const handleSaveVaccination = () => {
    updateFarmInspection({
      vaccProtocolAdherence: vaccProtocol,
      vaccHerdPenetration: vaccPenetration,
      vaccTimingAccuracy: vaccTiming,
      vaccColdChainIntegrity: vaccColdChain,
    });
    setAssessmentDates(prev => ({ ...prev, 'Vaccination Coverage': new Date().toLocaleDateString() }));
    setIsVaccinationModalVisible(false);
  };

  const handleSaveCpd = () => {
    updateFarmInspection({
      cpdTrainingFrequency: cpdTraining,
      cpdProtocolAwareness: cpdProtocol,
      cpdVetCollaboration: cpdVet,
      cpdBenchmarkTracking: cpdBenchmark,
    });
    setAssessmentDates(prev => ({ ...prev, 'CPD Staff Control (Disease/Emergencies)': new Date().toLocaleDateString() }));
    setIsCpdModalVisible(false);
  };

  const handleSaveDrugBox = () => {
    updateFarmInspection({
      dbExpiryInventory: dbExpiry,
      dbStorageCleanliness: dbCleanliness,
      dbSecurityAccess: dbSecurity,
      dbDisposalPractices: dbDisposal,
    });
    setAssessmentDates(prev => ({ ...prev, 'Drug Box Management': new Date().toLocaleDateString() }));
    setIsDrugBoxModalVisible(false);
  };

  const getDbExpiryText = (score: number) => {
    if (score <= 2) return 'Deficient: Keeping expired bottles, unlabelled liquids, or empty medicine boxes in storage';
    if (score <= 4) return 'Sub-optimal: Occasional expired items not discarded promptly';
    return 'Optimal: Strictly unexpired, fully labelled storage, regular audits';
  };

  const getDbCleanlinessText = (score: number) => {
    if (score <= 2) return 'Deficient: Storage box is dusty, contaminated with manure, or contains used, dirty needles';
    if (score === 3) return 'Sub-optimal: Minor dust/debris, but no open contamination';
    return 'Optimal: Spotless cleanliness, sterile syringe containment';
  };

  const getDbSecurityText = (score: number) => {
    if (score <= 2) return 'Deficient: Medicines box left unlocked, outdoors, or easily accessible to unauthorized visitors';
    if (score === 3) return 'Sub-optimal: Kept indoors but unlocked or missing visitor logging';
    return 'Optimal: Locked storage under authorized keys, visitor logged';
  };

  const getDbDisposalText = (score: number) => {
    if (score <= 2) return 'Deficient: Discarding half-empty bottles, needles, and sharps into standard domestic farm waste';
    if (score <= 4) return 'Sub-optimal: Proper needle disposal but occasional sharps log errors';
    return 'Optimal: Meticulous sharp container segregation and bio-waste protocols';
  };

  const getVaccProtocolText = (score: number) => {
    if (score <= 2) return 'Deficient: Missing annual boosters or failing to give primary double-doses to calves';
    if (score === 3) return 'Sub-optimal: Occasional booster delays, partial compliance on calves';
    return 'Optimal: Strict adherence to all primary doses and annual booster protocols';
  };

  const getVaccPenetrationText = (score: number) => {
    if (score <= 2) return 'Deficient: Only vaccinating select groups while leaving other at-risk cattle unprotected';
    if (score === 3) return 'Sub-optimal: Incomplete herd coverage, some at-risk animals skipped';
    return 'Optimal: 100% vaccination penetration across all at-risk animals';
  };

  const getVaccTimingText = (score: number) => {
    if (score <= 2) return 'Deficient: Vaccinating during active disease outbreaks or too late before high-risk seasons';
    if (score === 3) return 'Sub-optimal: Reactive vaccination close to high-risk seasons';
    return 'Optimal: Proactive, strategic timing well ahead of high-risk seasons';
  };

  const getVaccColdChainText = (score: number) => {
    if (score <= 2) return 'Deficient: Storing vaccines in broken farm fridges or leaving bottles out in direct sunlight';
    if (score <= 4) return 'Sub-optimal: Minor temperature fluctuations, storage documentation gaps';
    return 'Optimal: Meticulous cold chain integrity and storage logs';
  };

  const getCpdTrainingText = (score: number) => {
    if (score <= 2) return 'Deficient: Farm staff working without formal skills updates or health training for years';
    if (score <= 4) return 'Optimal: Regular training, periodic skill updates';
    return 'Sub-optimal: Excessive or uncoordinated training frequencies';
  };

  const getCpdProtocolText = (score: number) => {
    if (score <= 2) return 'Deficient: Staff unaware of standard operating procedures for sick cows or newborn calves';
    if (score === 3) return 'Sub-optimal: Vague understanding of protocols, inconsistent execution';
    return 'Optimal: Clear awareness and strict execution of sick/newborn SOPs';
  };

  const getCpdVetText = (score: number) => {
    if (score <= 2) return 'Deficient: Consulting the veterinarian only for emergencies rather than active planning';
    if (score === 3) return 'Sub-optimal: Occasional consults for vaccination plans, limited routine monitoring';
    return 'Optimal: Regular veterinarian collaboration for active herd health planning';
  };

  const getCpdBenchmarkText = (score: number) => {
    if (score <= 2) return 'Deficient: Failing to attend regional farm workshops or track modern husbandry guidelines';
    if (score <= 4) return 'Optimal: Active workshop attendance, tracking basic modern guidelines';
    return 'Sub-optimal: Excessive tracking of non-applicable regional benchmarks';
  };

  const getQuarantineText = (score: number) => {
    if (score <= 2) return 'Deficient/High Risk: New arrivals mixed immediately, missing history';
    if (score === 3) return 'Sub-optimal: Basic isolation, partial records';
    return 'Optimal: Strict 21-30 day isolation in separate facility';
  };

  const getTrackingText = (score: number) => {
    if (score <= 2) return 'Deficient/Untraceable: Missing tags, no birth/movement records';
    if (score === 3) return 'Sub-optimal: Visual tags only, manual logs, delayed entries';
    return 'Optimal: 100% electronic/visual tracking, real-time logs';
  };

  const getBoundaryText = (score: number) => {
    if (score <= 2) return 'Deficient/Vulnerable: Broken fences, contact with stray wild stock, pest infestation';
    if (score <= 4) return 'Optimal: Double-fencing, active pest mitigation';
    return 'Exclusionary: Double fences, certified pest-free';
  };

  const getSanitationText = (score: number) => {
    if (score <= 2) return 'Deficient/Contaminated: Unrestricted access, no boot wash, dirty shared gear';
    if (score === 3) return 'Sub-optimal: Partial visitor logs, manual cleaning, basic boot wash';
    return 'Optimal: Designated clean zones, boot-wash, visitor logs, sanitised gear';
  };

  const getDewormTimingText = (score: number) => {
    if (score <= 2) return 'Deficient/Reactive: Applied randomly without target seasons, or omitted';
    if (score === 3) return 'Sub-optimal: General seasonal timing, missing parasite cycles';
    return 'Optimal: Strategic dosing based on regional parasite cycles (spring/autumn)';
  };

  const getDewormRotationText = (score: number) => {
    if (score <= 2) return 'Deficient/High Resistance: Repeated class every year, no efficacy checks';
    if (score === 3) return 'Sub-optimal: Basic class rotation, infrequent checks';
    return 'Optimal: Deliberate class rotation and routine FECRT tests';
  };

  const getDewormPrecisionText = (score: number) => {
    if (score <= 2) return 'Deficient/Inaccurate: Visual weight guessing, poor calibration, wet back dosing';
    if (score === 3) return 'Sub-optimal: Group-based weights, basic calibration';
    return 'Optimal: Dosing exactly to scale weights with calibrated gear';
  };

  const getDewormTargetedText = (score: number) => {
    if (score <= 2) return 'Deficient/Blind: Blanket-treating entire herd blindly, no refuge population';
    if (score <= 4) return 'Optimal: Selective treatment on high-risk stock (e.g. calves, low BCS)';
    return 'Refugia Certified: Strategic selective treatment to maintain refugia';
  };

  const getAnthClassText = (score: number) => {
    if (score <= 2) return 'Deficient: Repeated use of one chemical family; wrong target drug';
    if (score === 3) return 'Sub-optimal: Infrequent rotation or basic choice of anthelmintics';
    return 'Optimal: Rotated chemical families based on diagnostics';
  };

  const getAnthRouteText = (score: number) => {
    if (score <= 2) return 'Deficient: Product applied over mud, spilled, or poorly injected';
    if (score === 3) return 'Sub-optimal: Occasional spilling, basic application standards';
    return 'Optimal: Administered perfectly clean, correct method, no leakage';
  };

  const getAnthCalibText = (score: number) => {
    if (score <= 2) return 'Deficient: Guns and injectors used without verifying dosage volume';
    if (score === 3) return 'Sub-optimal: Calibrated occasionally, lack of regular volume checks';
    return 'Optimal: Calibrated gear with dosage verified before every batch';
  };

  const getAnthWithholdingText = (score: number) => {
    if (score <= 2) return 'Deficient: Poorly logged treatment dates creating meat residue risks';
    if (score <= 4) return 'Sub-optimal: Logged on paper but missing strict verification alerts';
    return 'Optimal: Meticulous logging of treatment dates and withholding compliance';
  };

  const getAntiPrescriptionText = (score: number) => {
    if (score <= 2) return 'Deficient: Treating animals without veterinary diagnosis or routine prophylactic antibiotic use';
    if (score === 3) return 'Sub-optimal: Occasional prophylactic use, partial vet alignment';
    return 'Optimal: Strict veterinary prescription control and diagnostics';
  };

  const getAntiClassText = (score: number) => {
    if (score <= 2) return 'Deficient: Using critically important human antibiotics (CIAs) as a first-line farm treatment';
    if (score === 3) return 'Sub-optimal: Routine CIA use without susceptibility testing';
    return 'Optimal: Restricting CIAs, diagnostic-based first-line selection';
  };

  const getAntiRecordsText = (score: number) => {
    if (score <= 2) return 'Deficient: Missing treatment dates, animal IDs, batch numbers, or dosage logs';
    if (score <= 4) return 'Sub-optimal: Partially logged details or manual tracking delays';
    return 'Optimal: Meticulous logging of treatment dates, animal IDs, and batch numbers';
  };

  const getAntiCompletionText = (score: number) => {
    if (score <= 2) return 'Deficient: Stopping antibiotic courses early once the animal looks visually recovered';
    if (score === 3) return 'Sub-optimal: Inconsistent compliance with treatment course length';
    return 'Optimal: Strict completion of all treatment courses regardless of visual recovery';
  };

  const getNumberStatus = (
    category: 'quarantine' | 'tracking' | 'boundary' | 'sanitation' | 'dewormTiming' | 'dewormRotation' | 'dewormPrecision' | 'dewormTargeted' | 'anthClass' | 'anthRoute' | 'anthCalib' | 'anthWithholding' | 'antiPrescription' | 'antiClass' | 'antiRecords' | 'antiCompletion' | 'cpdTraining' | 'cpdProtocol' | 'cpdVet' | 'cpdBenchmark' | 'vaccProtocol' | 'vaccPenetration' | 'vaccTiming' | 'vaccColdChain' | 'dbExpiry' | 'dbCleanliness' | 'dbSecurity' | 'dbDisposal',
    num: number
  ): 'optimal' | 'warning' | 'deficient' => {
    if (num <= 2) return 'deficient';
    if (category === 'boundary' || category === 'dewormTargeted' || category === 'cpdTraining' || category === 'cpdBenchmark') {
      return (num === 3 || num === 4) ? 'optimal' : 'warning';
    }
    if (category === 'anthWithholding' || category === 'antiRecords' || category === 'vaccColdChain' || category === 'dbExpiry' || category === 'dbDisposal') {
      return num === 5 ? 'optimal' : 'warning';
    }
    return num >= 4 ? 'optimal' : 'warning';
  };

  const getStatusColor = (status: 'optimal' | 'warning' | 'deficient') => {
    if (status === 'optimal') return Colors.success[600];
    if (status === 'warning') return Colors.warning[600];
    return Colors.error[500];
  };

  const renderSegmentedControl = (
    category: 'quarantine' | 'tracking' | 'boundary' | 'sanitation' | 'dewormTiming' | 'dewormRotation' | 'dewormPrecision' | 'dewormTargeted' | 'anthClass' | 'anthRoute' | 'anthCalib' | 'anthWithholding' | 'antiPrescription' | 'antiClass' | 'antiRecords' | 'antiCompletion' | 'cpdTraining' | 'cpdProtocol' | 'cpdVet' | 'cpdBenchmark' | 'vaccProtocol' | 'vaccPenetration' | 'vaccTiming' | 'vaccColdChain' | 'dbExpiry' | 'dbCleanliness' | 'dbSecurity' | 'dbDisposal',
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

  const farmHealthMetrics: HealthMetric[] = [
    {
      title: 'Vaccination Coverage',
      score: farmInspection.vaccinationCoverage,
      percentage: farmInspection.vaccinationCoverage * 20,
      passed: farmInspection.vaccinationCoverage >= 3.0,
      color: getScoreColor(farmInspection.vaccinationCoverage),
    },
    {
      title: 'Biosecurity Rating',
      score: farmInspection.biosecurityRating,
      percentage: farmInspection.biosecurityRating * 20,
      passed: farmInspection.biosecurityRating >= 3.0,
      color: getScoreColor(farmInspection.biosecurityRating),
    },
    {
      title: 'Deworming Practice',
      score: farmInspection.dewormingPractice,
      percentage: farmInspection.dewormingPractice * 20,
      passed: farmInspection.dewormingPractice >= 3.0,
      color: getScoreColor(farmInspection.dewormingPractice),
    },
    {
      title: 'Antihelminthic Rating',
      score: farmInspection.prudentAnthelmintic,
      percentage: farmInspection.prudentAnthelmintic * 20,
      passed: farmInspection.prudentAnthelmintic >= 3.0,
      color: getScoreColor(farmInspection.prudentAnthelmintic),
    },
    {
      title: 'Antimicrobial Usage',
      score: farmInspection.prudentAntibiotics,
      percentage: farmInspection.prudentAntibiotics * 20,
      passed: farmInspection.prudentAntibiotics >= 3.0,
      color: getScoreColor(farmInspection.prudentAntibiotics),
    },
    {
      title: 'CPD Staff Control (Disease/Emergencies)',
      score: farmInspection.cpdStaffControl,
      percentage: farmInspection.cpdStaffControl * 20,
      passed: farmInspection.cpdStaffControl >= 3.0,
      color: getScoreColor(farmInspection.cpdStaffControl),
    },
    {
      title: 'Drug Box Management',
      score: farmInspection.drugBoxManagement,
      percentage: farmInspection.drugBoxManagement * 20,
      passed: farmInspection.drugBoxManagement >= 3.0,
      color: getScoreColor(farmInspection.drugBoxManagement),
    },
  ];

  const renderMetricCard = (metric: HealthMetric) => {
    const lastDate = assessmentDates[metric.title] || (farmInspection.updatedAt ? new Date(farmInspection.updatedAt).toLocaleDateString() : null);
    const hasBeenAssessed = metric.score > 0;
    const scoreColor = metric.color; // already score-based
    const borderColor =
      metric.score === 0 ? Colors.neutral[200] :
      metric.score * 20 <= 40 ? Colors.error[200] :
      metric.score * 20 <= 70 ? Colors.warning[200] :
      Colors.success[200];

    return (
    <Card
      key={metric.title}
      style={StyleSheet.flatten([styles.card, { borderColor, borderWidth: 1 }])}
    >
      <View style={styles.cardHeader}>
        <Text variant="h6" weight="bold" style={styles.cardTitle}>
          {metric.title}
        </Text>
        {hasBeenAssessed ? (
          metric.passed ? (
            <CheckCircle2 size={24} color={Colors.success[500]} />
          ) : (
            <XCircle size={24} color={Colors.error[500]} />
          )
        ) : (
          <XCircle size={24} color={Colors.neutral[300]} />
        )}
      </View>

      {/* Last analysis date row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: -4 }}>
        <Text
          variant="caption"
          style={{
            color: hasBeenAssessed ? Colors.neutral[500] : Colors.warning[600],
            fontStyle: hasBeenAssessed ? 'normal' : 'italic',
          }}
        >
          {hasBeenAssessed
            ? `Last analyzed: ${lastDate || 'Previously recorded'}`
            : '⚠️ Analysis not yet performed'}
        </Text>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.scoreContainer}>
          <Text variant="h3" weight="bold" color={scoreColor}>
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
                  backgroundColor: scoreColor,
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

      {metric.title === 'Vaccination Coverage' && isAdmin && (
        <TouchableOpacity
          style={styles.cardAssessButton}
          onPress={() => {
            setVaccProtocol(farmInspection.vaccProtocolAdherence || 1);
            setVaccPenetration(farmInspection.vaccHerdPenetration || 1);
            setVaccTiming(farmInspection.vaccTimingAccuracy || 1);
            setVaccColdChain(farmInspection.vaccColdChainIntegrity || 1);
            setIsVaccinationModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text variant="button" color="primary.500">
            Assess Vaccination Coverage
          </Text>
        </TouchableOpacity>
      )}

      {metric.title === 'Biosecurity Rating' && isAdmin && (
        <TouchableOpacity
          style={styles.cardAssessButton}
          onPress={() => {
            setQuarantine(farmInspection.quarantineIntakeIsolation || 1);
            setTracking(farmInspection.herdTrackingMovementLogs || 1);
            setBoundary(farmInspection.farmBoundaryPestControl || 1);
            setSanitation(farmInspection.sanitationVisitorControl || 1);
            setIsModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text variant="button" color="primary.500">
            Assess Biosecurity
          </Text>
        </TouchableOpacity>
      )}

      {metric.title === 'Deworming Practice' && isAdmin && (
        <TouchableOpacity
          style={styles.cardAssessButton}
          onPress={() => {
            setDewormTiming(farmInspection.dewormingTiming || 1);
            setDewormRotation(farmInspection.dewormingRotation || 1);
            setDewormPrecision(farmInspection.dewormingPrecision || 1);
            setDewormTargeted(farmInspection.dewormingTargeted || 1);
            setIsDewormingModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text variant="button" color="primary.500">
            Assess Deworming
          </Text>
        </TouchableOpacity>
      )}

      {metric.title === 'Antihelminthic Rating' && isAdmin && (
        <TouchableOpacity
          style={styles.cardAssessButton}
          onPress={() => {
            setAnthClass(farmInspection.anthelminticClassSelection || 1);
            setAnthRoute(farmInspection.anthelminticAdminRoute || 1);
            setAnthCalib(farmInspection.anthelminticEquipmentCalib || 1);
            setAnthWithholding(farmInspection.anthelminticWithholdingComp || 1);
            setIsAnthelminticModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text variant="button" color="primary.500">
            Assess Anthelmintics
          </Text>
        </TouchableOpacity>
      )}

      {metric.title === 'Antimicrobial Usage' && isAdmin && (
        <TouchableOpacity
          style={styles.cardAssessButton}
          onPress={() => {
            setAntiPrescription(farmInspection.antibioticPrescriptionControl || 1);
            setAntiClass(farmInspection.antibioticDrugClassification || 1);
            setAntiRecords(farmInspection.antibioticTreatmentRecords || 1);
            setAntiCompletion(farmInspection.antibioticCourseCompletion || 1);
            setIsAntibioticModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text variant="button" color="primary.500">
            Assess Antimicrobial Usage
          </Text>
        </TouchableOpacity>
      )}

      {metric.title === 'CPD Staff Control (Disease/Emergencies)' && isAdmin && (
        <TouchableOpacity
          style={styles.cardAssessButton}
          onPress={() => {
            setCpdTraining(farmInspection.cpdTrainingFrequency || 1);
            setCpdProtocol(farmInspection.cpdProtocolAwareness || 1);
            setCpdVet(farmInspection.cpdVetCollaboration || 1);
            setCpdBenchmark(farmInspection.cpdBenchmarkTracking || 1);
            setIsCpdModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text variant="button" color="primary.500">
            Assess CPD Staff Control
          </Text>
        </TouchableOpacity>
      )}

      {metric.title === 'Drug Box Management' && isAdmin && (
        <TouchableOpacity
          style={styles.cardAssessButton}
          onPress={() => {
            setDbExpiry(farmInspection.dbExpiryInventory || 1);
            setDbCleanliness(farmInspection.dbStorageCleanliness || 1);
            setDbSecurity(farmInspection.dbSecurityAccess || 1);
            setDbDisposal(farmInspection.dbDisposalPractices || 1);
            setIsDrugBoxModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text variant="button" color="primary.500">
            Assess Drug Box Management
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};

  return (
    <ScreenContainer scrollable={false}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* Farm Health Analysis Section */}
        <View style={styles.section}>
          <Text variant="h5" weight="bold" style={styles.sectionTitle}>
            Farm Health Analysis
          </Text>
          {farmHealthMetrics.map(renderMetricCard)}
        </View>


        {/* Animal Health Records Navigation Card */}
        <Card style={{
          marginBottom: 16,
          borderRadius: 12,
          padding: 16,
          backgroundColor: Colors.primary[50],
          borderWidth: 1,
          borderColor: Colors.primary[100],
        }}>
          <View style={styles.inventoryHeader}>
            <View style={styles.inventoryTitleContainer}>
              <Activity size={24} color={Colors.primary[500]} style={styles.inventoryIcon} />
              <Text variant="h5" weight="medium" style={{ flexShrink: 1 }}>
                Animal Health Records
              </Text>
            </View>
          </View>
          <Text variant="body2" color="neutral.600" style={[styles.inventoryDescription, { marginBottom: 16 }]}>
            Access and manage comprehensive health records, treatments, and medical history for your livestock.
          </Text>
          <TouchableOpacity 
            style={[styles.inventoryButton, { 
              backgroundColor: Colors.white, 
              borderWidth: 1, 
              borderColor: Colors.primary[200],
              justifyContent: 'center',
              paddingVertical: 12,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }]}
            onPress={() => router.push('/screens/register?tab=health')}
          >
            <Text variant="button" color="primary.500" style={{ marginRight: 6 }}>View Records</Text>
            <ArrowRight size={18} color={Colors.primary[500]} />
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Biosecurity Questionnaire Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h5" weight="bold" style={styles.modalTitle}>
              Biosecurity Rating Questionnaire
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.modalSub}>
              Rate the biosecurity parameters (1-5) based on observations.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              
              {/* Quarantine & Intake Isolation */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  1. Quarantine & Intake Isolation
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  New arrivals mixed immediately into main herd indicates high risk; optimal is a strict 21 to 30-day isolation period in secure facilities.
                </Text>
                {renderSegmentedControl('quarantine', quarantine, setQuarantine, getQuarantineText(quarantine))}
              </View>

              {/* Herd Tracking & Movement Logs */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  2. Herd Tracking & Movement Logs
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Missing tags or undocumented movements indicate poor traceability; optimal is 100% active electronic/visual ID tracking.
                </Text>
                {renderSegmentedControl('tracking', tracking, setTracking, getTrackingText(tracking))}
              </View>

              {/* Farm Boundary & Pest Control */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  3. Farm Boundary & Pest Control
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Broken fences allowing contact with stray stocks indicate disease exposure; optimal is double-fencing and active pest mitigation.
                </Text>
                {renderSegmentedControl('boundary', boundary, setBoundary, getBoundaryText(boundary))}
              </View>

              {/* Sanitation & Visitor Control */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  4. Sanitation & Visitor Control
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Unrestricted access or lack of boot-wash indicates high contamination risk; optimal is clean zones, visitor logs, and sanitised gear.
                </Text>
                {renderSegmentedControl('sanitation', sanitation, setSanitation, getSanitationText(sanitation))}
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
                onPress={handleSaveBiosecurity}
                style={styles.saveButton}
              >
                Save Assessment
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deworming Practice Questionnaire Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDewormingModalVisible}
        onRequestClose={() => setIsDewormingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h5" weight="bold" style={styles.modalTitle}>
              Deworming Practice Questionnaire
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.modalSub}>
              Rate the deworming parameters (1-5) based on observations.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              
              {/* Treatment Timing & Schedule */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  1. Treatment Timing & Schedule
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Deworming applied randomly without target seasons, or omitted entirely, indicates severe deficiency; optimal is strategic application.
                </Text>
                {renderSegmentedControl('dewormTiming', dewormTiming, setDewormTiming, getDewormTimingText(dewormTiming))}
              </View>

              {/* Product Rotation & Efficacy */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  2. Product Rotation & Efficacy
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Repeated use of the same active drug class every year, or lack of efficacy checks, indicates high resistance risk; optimal is class rotation.
                </Text>
                {renderSegmentedControl('dewormRotation', dewormRotation, setDewormRotation, getDewormRotationText(dewormRotation))}
              </View>

              {/* Dosing Precision & Protocol */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  3. Dosing Precision & Protocol
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Under-dosing based on visual guessing or poorly calibrated gear indicates deficiency; optimal is dosing exactly to scale weights.
                </Text>
                {renderSegmentedControl('dewormPrecision', dewormPrecision, setDewormPrecision, getDewormPrecisionText(dewormPrecision))}
              </View>

              {/* Targeted Selective Treatment */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  4. Targeted Selective Treatment
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Blanket-treating blindly without evaluating animal need indicates deficiency; optimal is using selective treatment on high-risk stock.
                </Text>
                {renderSegmentedControl('dewormTargeted', dewormTargeted, setDewormTargeted, getDewormTargetedText(dewormTargeted))}
              </View>

            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsDewormingModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveDeworming}
                style={styles.saveButton}
              >
                Save Assessment
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Anthelmintic Rating Questionnaire Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAnthelminticModalVisible}
        onRequestClose={() => setIsAnthelminticModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h5" weight="bold" style={styles.modalTitle}>
              Anthelmintic Rating Questionnaire
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.modalSub}>
              Rate the anthelmintic parameters (1-5) based on observations.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              
              {/* Drug Class Selection */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  1. Drug Class Selection
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Repeated use of one chemical family or choosing the wrong target drug indicates deficiency; optimal is diagnostic-based rotation.
                </Text>
                {renderSegmentedControl('anthClass', anthClass, setAnthClass, getAnthClassText(anthClass))}
              </View>

              {/* Administration Route */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  2. Administration Route
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Product applied over mud, spilled, or poorly injected indicates deficiency; optimal is perfectly administered correct route.
                </Text>
                {renderSegmentedControl('anthRoute', anthRoute, setAnthRoute, getAnthRouteText(anthRoute))}
              </View>

              {/* Equipment Calibration */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  3. Equipment Calibration
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Guns and injectors used without verifying exact dosage volume indicates deficiency; optimal is dosage verified calibration before batch.
                </Text>
                {renderSegmentedControl('anthCalib', anthCalib, setAnthCalib, getAnthCalibText(anthCalib))}
              </View>

              {/* Withholding Compliance */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  4. Withholding Compliance
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Poorly logged treatment dates creating meat residue risks indicates deficiency; optimal is meticulous logging and strict compliance.
                </Text>
                {renderSegmentedControl('anthWithholding', anthWithholding, setAnthWithholding, getAnthWithholdingText(anthWithholding))}
              </View>

            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsAnthelminticModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveAnthelmintic}
                style={styles.saveButton}
              >
                Save Assessment
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Antimicrobial Usage Questionnaire Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAntibioticModalVisible}
        onRequestClose={() => setIsAntibioticModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h5" weight="bold" style={styles.modalTitle}>
              Antimicrobial Usage Questionnaire
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.modalSub}>
              Rate the antimicrobial parameters (1-5) based on observations.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              
              {/* Prescription Control */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  1. Prescription Control
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Treating animals without veterinary diagnosis or routine prophylactic antibiotic use indicates deficiency; optimal is strict vet oversight.
                </Text>
                {renderSegmentedControl('antiPrescription', antiPrescription, setAntiPrescription, getAntiPrescriptionText(antiPrescription))}
              </View>

              {/* Drug Classification */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  2. Drug Classification
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Using critically important human antibiotics (CIAs) as a first-line farm treatment indicates deficiency; optimal is restricting CIAs.
                </Text>
                {renderSegmentedControl('antiClass', antiClass, setAntiClass, getAntiClassText(antiClass))}
              </View>

              {/* Treatment Records */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  3. Treatment Records
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Missing treatment dates, animal IDs, batch numbers, or dosage logs indicates deficiency; optimal is meticulous recording.
                </Text>
                {renderSegmentedControl('antiRecords', antiRecords, setAntiRecords, getAntiRecordsText(antiRecords))}
              </View>

              {/* Course Completion */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  4. Course Completion
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Stopping antibiotic courses early once the animal looks visually recovered indicates deficiency; optimal is full course completion.
                </Text>
                {renderSegmentedControl('antiCompletion', antiCompletion, setAntiCompletion, getAntiCompletionText(antiCompletion))}
              </View>

            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsAntibioticModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveAntibiotic}
                style={styles.saveButton}
              >
                Save Assessment
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* CPD Staff Control Questionnaire Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCpdModalVisible}
        onRequestClose={() => setIsCpdModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h5" weight="bold" style={styles.modalTitle}>
              CPD Staff Control Questionnaire
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.modalSub}>
              Rate the Continued Professional Development parameters (1-5) based on observations.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              
              {/* Training Frequency */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  1. Training Frequency
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Farm staff working without formal skills updates or health training for years.
                </Text>
                {renderSegmentedControl('cpdTraining', cpdTraining, setCpdTraining, getCpdTrainingText(cpdTraining))}
              </View>

              {/* Protocol Awareness */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  2. Protocol Awareness
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Staff unaware of standard operating procedures for sick cows or newborn calves.
                </Text>
                {renderSegmentedControl('cpdProtocol', cpdProtocol, setCpdProtocol, getCpdProtocolText(cpdProtocol))}
              </View>

              {/* Vet Collaboration */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  3. Vet Collaboration
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Consulting the veterinarian only for emergencies rather than active herd health planning.
                </Text>
                {renderSegmentedControl('cpdVet', cpdVet, setCpdVet, getCpdVetText(cpdVet))}
              </View>

              {/* Benchmark Tracking */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  4. Benchmark Tracking
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Failing to attend regional farm workshops or track modern husbandry guidelines.
                </Text>
                {renderSegmentedControl('cpdBenchmark', cpdBenchmark, setCpdBenchmark, getCpdBenchmarkText(cpdBenchmark))}
              </View>

            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsCpdModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveCpd}
                style={styles.saveButton}
              >
                Save Assessment
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Vaccination Coverage Questionnaire Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVaccinationModalVisible}
        onRequestClose={() => setIsVaccinationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h5" weight="bold" style={styles.modalTitle}>
              Vaccination Coverage Questionnaire
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.modalSub}>
              Rate the vaccination parameters (1-5) based on observations.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              
              {/* Protocol Adherence */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  1. Protocol Adherence
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Missing annual boosters or failing to give primary double-doses to calves.
                </Text>
                {renderSegmentedControl('vaccProtocol', vaccProtocol, setVaccProtocol, getVaccProtocolText(vaccProtocol))}
              </View>

              {/* Herd Penetration */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  2. Herd Penetration
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Only vaccinating select groups while leaving other at-risk cattle unprotected.
                </Text>
                {renderSegmentedControl('vaccPenetration', vaccPenetration, setVaccPenetration, getVaccPenetrationText(vaccPenetration))}
              </View>

              {/* Timing Accuracy */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  3. Timing Accuracy
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Vaccinating during active disease outbreaks or too late before high-risk seasons.
                </Text>
                {renderSegmentedControl('vaccTiming', vaccTiming, setVaccTiming, getVaccTimingText(vaccTiming))}
              </View>

              {/* Cold Chain Integrity */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  4. Cold Chain Integrity
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Storing vaccines in broken farm fridges or leaving bottles out in direct sunlight.
                </Text>
                {renderSegmentedControl('vaccColdChain', vaccColdChain, setVaccColdChain, getVaccColdChainText(vaccColdChain))}
              </View>

            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsVaccinationModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveVaccination}
                style={styles.saveButton}
              >
                Save Assessment
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Drug Box Management Questionnaire Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDrugBoxModalVisible}
        onRequestClose={() => setIsDrugBoxModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h5" weight="bold" style={styles.modalTitle}>
              Drug Box Management Questionnaire
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.modalSub}>
              Rate the drug box parameters (1-5) based on observations.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              
              {/* Expiry & Inventory */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  1. Expiry & Inventory
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Keeping expired bottles, unlabelled liquids, or empty medicine boxes in storage.
                </Text>
                {renderSegmentedControl('dbExpiry', dbExpiry, setDbExpiry, getDbExpiryText(dbExpiry))}
              </View>

              {/* Storage Cleanliness */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  2. Storage Cleanliness
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Storage box is dusty, contaminated with manure, or contains used, dirty needles.
                </Text>
                {renderSegmentedControl('dbCleanliness', dbCleanliness, setDbCleanliness, getDbCleanlinessText(dbCleanliness))}
              </View>

              {/* Security & Access */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  3. Security & Access
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Medicines box left unlocked, outdoors, or easily accessible to unauthorized visitors.
                </Text>
                {renderSegmentedControl('dbSecurity', dbSecurity, setDbSecurity, getDbSecurityText(dbSecurity))}
              </View>

              {/* Disposal Practices */}
              <View style={styles.questionCard}>
                <Text variant="body" weight="bold" style={styles.questionTitle}>
                  4. Disposal Practices
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.questionDesc}>
                  Discarding half-empty bottles, needles, and sharps into standard domestic farm waste.
                </Text>
                {renderSegmentedControl('dbDisposal', dbDisposal, setDbDisposal, getDbDisposalText(dbDisposal))}
              </View>

            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsDrugBoxModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveDrugBox}
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
  backButton: {
    marginLeft: 8,
    padding: 8,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    color: Colors.primary[900],
  },
  sectionSubtitle: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  recordsCard: {
    borderRadius: 12,
    padding: 0,
    overflow: 'hidden',
  },
  recordsHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  recordHeaderCell: {
    flex: 1,
    color: Colors.neutral[600],
  },
  recordRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    alignItems: 'center',
  },
  recordCell: {
    flex: 1,
    color: Colors.neutral[800],
  },
  statusContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
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
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  inventoryDescription: {
    marginTop: 4,
    lineHeight: 20,
  },
  cardAssessButton: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
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
