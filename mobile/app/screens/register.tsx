import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Modal, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, Alert, TouchableWithoutFeedback } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';
import { Text } from '../../components/typography/Text';
import { Card } from '../../components/ui/Card';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { Picker } from '../../components/inputs/Picker';
import { DataTable } from '../../components/tables/DataTable';
import { PieChart } from '../../components/charts/PieChart';
import Colors from '../../constants/Colors';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useFarmData } from '../../context/FarmDataContext';
import { Eye, Pencil, Trash2, X, ChevronLeft, CheckSquare, Square, Scale, Activity, Flame, Heart, Baby, Sparkles, DollarSign } from 'lucide-react-native';



interface PieChartData {
  name: string;
  population: number;
  color: string;
}

// Sample data for tables
const herdRegisterData: AnimalData[] = [
  { id: '1', unitNo: 'B001', tag: 'TAG123', age: '4y 2m', dateOfBirth: '2020-01-01', breed: 'Mashona', sex: 'Male', stockType: 'Bull', source: 'Born' },
  { id: '2', unitNo: 'C045', tag: 'TAG456', age: '3y 6m', dateOfBirth: '2020-07-01', breed: 'Brahman', sex: 'Female', stockType: 'Cow', source: 'Purchased' },
];

const calfRegisterData = [
  { unit: 'CLF001', calfId: 'TAG789', age: '2m', deliveryType: 'Normal', observer: 'John D.', birthWeight: '35kg', sex: 'Female' },
];

const drugRegisterData = [
  { drugClass: 'Antibiotic', type: 'Injectable', withdrawal: '14 days', pregnancySafe: 'Yes', stock: 'In Stock' },
];

const mortalityData = [
  { id: 'TAG111', date: '2024-02-15', cause: 'Disease', description: 'Respiratory failure' },
];

const transactionData = [
  { date: '2024-02-10', description: 'Sale of bull B023', amount: 2500, type: 'Sale' },
  { date: '2024-02-05', description: 'Purchase of heifer H045', amount: -3000, type: 'Purchase' },
];

const weightData = [
  { 
    id: 'B001', 
    stockType: 'Bull', 
    age: '4y 2m', 
    jan: '650', 
    feb: '665', 
    mar: '680', 
    apr: '695', 
    may: '705', 
    jun: '720', 
    jul: '735', 
    aug: '750', 
    sep: '765', 
    oct: '780', 
    nov: '790', 
    dec: '800' 
  },
];


// Filter options will be computed dynamically within RegisterContent

// Animal Health Record type
interface AnimalHealthRecord {
  id: string;
  animalId: string;
  date: string;
  treatment: string;
  status: 'Completed' | 'Scheduled' | 'Pending';
  specialNotes?: string;
  doneBy?: string;
}

// Heat Detection and Breeding Record type
interface HeatBreedingRecord {
  id: string;
  earTagNumber: string;
  stockType: 'Cow' | 'Heifer' | 'Heifer (First Calf)' | 'Bull' | 'Steer' | 'Bullying Heifer';
  bodyConditionScore: number;
  heatDetectionDate: string;
  observer: string;
  servicedDate?: string;
  breedingStatus: 'Bred' | 'Open' | 'Confirmed Pregnant' | 'Failed';
  breedingMethod?: 'AI' | 'Natural' | 'Embryo Transfer';
  aiTechnician?: string;
  sireId?: string;
  strawId?: string;
  semenViability?: number; // percentage
  returnToHeatDate1?: string;
  dateServed2?: string;
  breedingMethod2?: 'AI' | 'Natural' | 'Embryo Transfer';
  sireUsed2?: string;
  returnToHeatDate2?: string;
}

// Pregnancy Diagnosis and Calving Record type
interface PregnancyCalvingRecord {
  id: string;
  cowEarTag: string;
  bodyConditionScore: number;
  lastServiceDate: string;
  firstTrimesterPD: 'Positive' | 'Negative' | 'Inconclusive' | 'Not Tested';
  secondTrimesterPD: 'Positive' | 'Negative' | 'Inconclusive' | 'Not Tested';
  thirdTrimesterPD: 'Positive' | 'Negative' | 'Inconclusive' | 'Not Tested';
  gestationPeriod: number; // in days
  expectedCalvingDate: string;
  actualCalvingDate?: string;
  calfId?: string;
  calfSex?: 'Male' | 'Female';
  deliveryType?: 'Natural' | 'Assisted' | 'C-Section';
  averageBCS: number;
  expectedReturnToHeatDate: string;
  actualFirstHeatDate?: string;
  expectedSecondHeatDate?: string;
  actualSecondHeatDate?: string;
  expectedSecondReturnToHeatDate?: string;
}

// Bull Breeding Soundness data type
interface BullBreedingRecord {
  id: string;
  bullId: string;
  date: string;
  age: string;
  pe: 'Excellent' | 'Good' | 'Poor';
  spermMotility: string;
  spermMorphology: string;
  scrotal: string;
  libido: 'Excellent' | 'Good' | 'Poor';
  score: string;
  classification: 'SPB' | 'USPB' | 'CD';
};

// Sample health records data
const animalHealthRecords: AnimalHealthRecord[] = [
  { id: '1', animalId: 'A1001', date: '2025-06-15', treatment: 'Deworming', status: 'Completed' },
  { id: '2', animalId: 'A1002', date: '2025-06-16', treatment: 'Vaccination', status: 'Scheduled' },
  { id: '3', animalId: 'A1003', date: '2025-06-17', treatment: 'Hoof Trimming', status: 'Pending' },
  { id: '4', animalId: 'A1004', date: '2025-06-18', treatment: 'Health Check', status: 'Completed' },
  { id: '5', animalId: 'A1005', date: '2025-06-19', treatment: 'Vaccination', status: 'Scheduled' },
];

// Sample pregnancy and calving records
// Sample heat detection and breeding records
const heatBreedingRecords: HeatBreedingRecord[] = [
  {
    id: 'HB001',
    earTagNumber: 'C1001',
    stockType: 'Cow',
    bodyConditionScore: 3.5,
    heatDetectionDate: '2025-01-10',
    observer: 'John Doe',
    servicedDate: '2025-01-11',
    breedingStatus: 'Confirmed Pregnant',
    breedingMethod: 'AI',
    aiTechnician: 'Dr. Smith',
    sireId: 'S-ANG-1234',
    strawId: 'ST-2025-001',
    semenViability: 85,
    returnToHeatDate1: '2025-02-01',
  },
  {
    id: 'HB002',
    earTagNumber: 'C1002',
    stockType: 'Heifer (First Calf)',
    bodyConditionScore: 3.0,
    heatDetectionDate: '2025-01-15',
    observer: 'Jane Smith',
    servicedDate: '2025-01-16',
    breedingStatus: 'Bred',
    breedingMethod: 'AI',
    aiTechnician: 'Dr. Smith',
    sireId: 'S-HER-5678',
    strawId: 'ST-2025-002',
    semenViability: 90,
  },
  {
    id: 'HB003',
    earTagNumber: 'C1003',
    stockType: 'Heifer',
    bodyConditionScore: 3.2,
    heatDetectionDate: '2025-02-01',
    observer: 'John Doe',
    servicedDate: '2025-02-02',
    breedingStatus: 'Open',
    breedingMethod: 'AI',
    aiTechnician: 'Dr. Johnson',
    sireId: 'S-SIM-9012',
    strawId: 'ST-2025-003',
    semenViability: 82,
    returnToHeatDate1: '2025-02-22',
    dateServed2: '2025-02-23',
    breedingMethod2: 'Natural',
    sireUsed2: 'B-ANG-001',
    returnToHeatDate2: '2025-03-15',
  },
];

const pregnancyCalvingData: PregnancyCalvingRecord[] = [
  {
    id: 'P001',
    cowEarTag: 'C1001',
    bodyConditionScore: 3.5,
    lastServiceDate: '2025-01-15',
    firstTrimesterPD: 'Positive',
    secondTrimesterPD: 'Positive',
    thirdTrimesterPD: 'Positive',
    gestationPeriod: 283,
    expectedCalvingDate: '2025-10-25',
    actualCalvingDate: '2025-10-24',
    calfId: 'CLF25001',
    calfSex: 'Female',
    deliveryType: 'Natural',
    averageBCS: 3.3,
    expectedReturnToHeatDate: '2025-12-15',
    actualFirstHeatDate: '2025-12-14',
    expectedSecondHeatDate: '2026-01-13',
    actualSecondHeatDate: '2026-01-15',
    expectedSecondReturnToHeatDate: '2026-02-12'
  },
  {
    id: 'P002',
    cowEarTag: 'C1002',
    bodyConditionScore: 3.0,
    lastServiceDate: '2025-02-20',
    firstTrimesterPD: 'Positive',
    secondTrimesterPD: 'Positive',
    thirdTrimesterPD: 'Positive',
    gestationPeriod: 280,
    expectedCalvingDate: '2025-11-27',
    averageBCS: 3.1,
    expectedReturnToHeatDate: '2026-01-15',
  },
  {
    id: 'P003',
    cowEarTag: 'C1003',
    bodyConditionScore: 3.2,
    lastServiceDate: '2025-03-10',
    firstTrimesterPD: 'Positive',
    secondTrimesterPD: 'Negative',
    thirdTrimesterPD: 'Not Tested',
    gestationPeriod: 0,
    expectedCalvingDate: 'N/A',
    averageBCS: 3.1,
    expectedReturnToHeatDate: '2025-04-10',
  },
];

const bullBreedingSoundnessData: BullBreedingRecord[] = [
  {
    id: 'B001',
    bullId: 'B001',
    date: '2025-06-15',
    age: '2.5 years',
    pe: 'Excellent',
    spermMotility: '80%',
    spermMorphology: '85%',
    scrotal: '36 cm',
    libido: 'Excellent',
    score: '95',
    classification: 'SPB'
  },
  {
    id: 'B002',
    bullId: 'B002',
    date: '2025-06-20',
    age: '3 years',
    pe: 'Good',
    spermMotility: '70%',
    spermMorphology: '65%',
    scrotal: '34 cm',
    libido: 'Good',
    score: '75',
    classification: 'SPB'
  },
  {
    id: 'B003',
    bullId: 'B003',
    date: '2025-06-25',
    age: '4 years',
    pe: 'Poor',
    spermMotility: '40%',
    spermMorphology: '35%',
    scrotal: '30 cm',
    libido: 'Poor',
    score: '50',
    classification: 'USPB'
  },
  {
    id: 'B004',
    bullId: 'B004',
    date: '2025-07-01',
    age: '2 years',
    pe: 'Good',
    spermMotility: '75%',
    spermMorphology: '80%',
    scrotal: '32 cm',
    libido: 'Excellent',
    score: '85',
    classification: 'SPB'
  }
];

// Interface for animal data
interface AnimalData {
  unitNo?: string;  // Made optional since we're removing it from the form
  tag: string;
  age: string;
  dateOfBirth: string;  // Added dateOfBirth field
  breed: string;
  sex: 'Male' | 'Female';
  stockType: string;
  source: string;
  observer?: string;
  birthWeight?: string;
  deliveryType?: 'Natural' | 'Assisted' | 'C-Section';
  id?: string;
  sire?: string;
  dam?: string;
  dateOfWeaning?: string;
  weaningWeight?: string | number;
  description?: string;
  weight30day?: number;
  weight100day?: number;
  weight1weekPostWeaning?: number;
  weight6monthsPostWeaning?: number;
  calfStatus?: 'Active' | 'Replacement' | 'Sold';
  preWeaningMortality?: boolean;
}


// Interface for drug data
interface DrugData {
  id?: string;
  drugClass: string;
  type: string;
  name: string;
  withdrawalPeriod: string;
  pregnancySafe: 'Yes' | 'No';
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

// Sample data for herd register
const initialHerdRegisterData: AnimalData[] = [
  { id: '1', unitNo: 'B001', tag: 'TAG123', age: '4y 2m', dateOfBirth: '2020-05-01', breed: 'Mashona', sex: 'Male', stockType: 'Bull', source: 'Born' },
  { id: '2', unitNo: 'C045', tag: 'TAG456', age: '3y 6m', dateOfBirth: '2021-01-15', breed: 'Brahman', sex: 'Female', stockType: 'Cow', source: 'Purchased' },
  { id: '3', unitNo: 'H012', tag: 'TAG789', age: '1y 8m', dateOfBirth: '2022-11-10', breed: 'Angus', sex: 'Female', stockType: 'Heifer', source: 'Born' },
  { id: '4', unitNo: 'S078', tag: 'TAG101', age: '2y 11m', dateOfBirth: '2021-08-20', breed: 'Hereford', sex: 'Male', stockType: 'Steer', source: 'Born' },
  { id: '5', unitNo: 'C102', tag: 'TAG202', age: '5y 0m', dateOfBirth: '2019-07-01', breed: 'Simmental', sex: 'Female', stockType: 'Cow', source: 'Purchased' },
];

// Sample data for drug register
const initialDrugRegisterData: DrugData[] = [
  { id: '1', drugClass: 'Antibiotic', type: 'Injectable', name: 'Oxytetracycline', withdrawalPeriod: '21 days', pregnancySafe: 'Yes', stockStatus: 'In Stock' },
  { id: '2', drugClass: 'Vitamin', type: 'Oral', name: 'Vitamin B Complex', withdrawalPeriod: '0 days', pregnancySafe: 'Yes', stockStatus: 'In Stock' },
  { id: '3', drugClass: 'Antiparasitic', type: 'Pour-on', name: 'Ivermectin', withdrawalPeriod: '35 days', pregnancySafe: 'No', stockStatus: 'Low Stock' },
];



interface DatePickerModalProps {
  visible: boolean;
  valueStr: string | undefined;
  title: string;
  onClose: () => void;
  onSave: (dateStr: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  valueStr,
  title,
  onClose,
  onSave,
  maximumDate,
  minimumDate,
}) => {
  const parseDateSafe = (dateStr: string | undefined): Date => {
    if (!dateStr || typeof dateStr !== 'string') return new Date();
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
    return new Date();
  };

  const isValidDate = (d: any): d is Date => {
    return d instanceof Date && !isNaN(d.getTime());
  };

  const initialDate = parseDateSafe(valueStr);
  const [tempDate, setTempDate] = useState<Date>(initialDate);

  useEffect(() => {
    if (visible) {
      setTempDate(parseDateSafe(valueStr));
    }
  }, [visible, valueStr]);

  if (!visible) return null;

  const handleSave = () => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = tempDate.getFullYear();
    const month = pad(tempDate.getMonth() + 1);
    const day = pad(tempDate.getDate());
    const formattedDate = `${year}-${month}-${day}`;
    onSave(formattedDate);
    onClose();
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.dpModalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.dpModalContent}>
              <View style={styles.dpModalHeader}>
                <Text variant="body" weight="bold" style={{ color: Colors.neutral[900], flex: 1 }}>
                  {title}
                </Text>
                <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                  <Text style={styles.dpCloseButton}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dpModalBody}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempDate(selectedDate);
                    }
                  }}
                  maximumDate={isValidDate(maximumDate) ? maximumDate : new Date(new Date().getFullYear() + 20, 11, 31)}
                  minimumDate={isValidDate(minimumDate) ? minimumDate : new Date(new Date().getFullYear() - 50, 0, 1)}
                  textColor="black"
                  style={{ width: 280, height: 180 }}
                />
              </View>

              <View style={styles.dpModalFooter}>
                <Button
                  onPress={onClose}
                  variant="outline"
                  style={styles.dpFooterButton}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleSave}
                  variant="primary"
                  style={styles.dpFooterButton}
                  size="sm"
                >
                  Save
                </Button>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default function RegisterScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Register',
        }}
      />
      <RegisterContent />
    </>
  );
}

function RegisterContent() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const {
    animals,
    healthRecords: ctxHealthRecords,
    breedingRecords: ctxBreedingRecords,
    pregnancyRecords: ctxPregnancyRecords,
    feedRecords: ctxFeedRecords,
    mortalityRecords: ctxMortalityRecords,
    transactions: ctxTransactions,
    bullBreedingRecords,
    animalWeights,
    drugs: ctxDrugs,
    feedInventory,
    addAnimal,
    deleteAnimal,
    updateAnimal,
    addHealthRecord,
    addBreedingRecord,
    addPregnancyRecord,
    addFeedRecord,
    addMortalityRecord,
    addTransaction,
    updateAnimalWeight,
    addBullBreedingRecord,
    updateBullBreedingRecord,
    deleteBullBreedingRecord,
    saveAnimalWeight,
    addDrug,
    updateDrug,
    deleteDrug,
    addFeedInventoryItem,
    updateFeedInventoryItem,
    deleteFeedInventoryItem,
    updateHealthRecord,
    updateBreedingRecord,
    updatePregnancyRecord,
    updateMortalityRecord,
    updateTransaction,
    deleteTransaction,
    profile,
  } = useFarmData();

  const isAdmin = profile?.role === 'admin';

  // --- STATE DECLARATIONS ---
  // State variables moved to top of component to avoid Temporal Dead Zone errors
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditAnimalModalVisible, setIsEditAnimalModalVisible] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<AnimalData | null>(null);
  const [originalAnimalTag, setOriginalAnimalTag] = useState('');
  const [modalActiveTab, setModalActiveTab] = useState<'details' | 'timeline' | 'pedigree'>('details');
  const [isPedigreeEditModalVisible, setIsPedigreeEditModalVisible] = useState(false);
  const [pedigreeForm, setPedigreeForm] = useState({
    sire: '',
    dam: '',
    sireSire: '',
    sireDam: '',
    damSire: '',
    damDam: '',
  });
  const [isAddHealthRecordModalVisible, setIsAddHealthRecordModalVisible] = useState(false);
  const [isAddBreedingRecordModalVisible, setIsAddBreedingRecordModalVisible] = useState(false);
  const [showBreedingDatePicker, setShowBreedingDatePicker] = useState(false);
  const [isAddTransactionModalVisible, setIsAddTransactionModalVisible] = useState(false);
  const [isAddWeightRecordModalVisible, setIsAddWeightRecordModalVisible] = useState(false);
  const [weightAnimalSearchQuery, setWeightAnimalSearchQuery] = useState('');
  const [isAddPregnancyModalVisible, setIsAddPregnancyModalVisible] = useState(false);
  const [isEditHealthRecordModalVisible, setIsEditHealthRecordModalVisible] = useState(false);
  const [editingHealthRecord, setEditingHealthRecord] = useState<AnimalHealthRecord | null>(null);
  const [isEditBreedingRecordModalVisible, setIsEditBreedingRecordModalVisible] = useState(false);
  const [editingBreedingRecord, setEditingBreedingRecord] = useState<HeatBreedingRecord | null>(null);
  const [isEditBullBreedingRecordModalVisible, setIsEditBullBreedingRecordModalVisible] = useState(false);
  const [editingBullBreedingRecord, setEditingBullBreedingRecord] = useState<BullBreedingRecord | null>(null);
  const [showEditBullBreedingDatePicker, setShowEditBullBreedingDatePicker] = useState(false);
  const [isEditPregnancyRecordModalVisible, setIsEditPregnancyRecordModalVisible] = useState(false);
  const [editingPregnancyRecord, setEditingPregnancyRecord] = useState<PregnancyCalvingRecord | null>(null);
  const [isEditWeightRecordModalVisible, setIsEditWeightRecordModalVisible] = useState(false);
  const [editingWeightRecord, setEditingWeightRecord] = useState<any | null>(null);
  const [isEditDrugModalVisible, setIsEditDrugModalVisible] = useState(false);
  const [editingDrug, setEditingDrug] = useState<any | null>(null);
  const [isEditMortalityRecordModalVisible, setIsEditMortalityRecordModalVisible] = useState(false);
  const [editingMortalityRecord, setEditingMortalityRecord] = useState<any | null>(null);
  const [isEditTransactionModalVisible, setIsEditTransactionModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [isEditFeedModalVisible, setIsEditFeedModalVisible] = useState(false);
  const [editingFeedItem, setEditingFeedItem] = useState<any | null>(null);
  const [showAddHealthDatePicker, setShowAddHealthDatePicker] = useState(false);
  const [showEditHealthDatePicker, setShowEditHealthDatePicker] = useState(false);
  const [showEditBreedingHeatDatePicker, setShowEditBreedingHeatDatePicker] = useState(false);
  const [showEditBreedingServicedDatePicker, setShowEditBreedingServicedDatePicker] = useState(false);
  const [showEditPregnancyLastServiceDatePicker, setShowEditPregnancyLastServiceDatePicker] = useState(false);
  const [showEditPregnancyExpectedCalvingDatePicker, setShowEditPregnancyExpectedCalvingDatePicker] = useState(false);
  const [showEditPregnancyActualCalvingDatePicker, setShowEditPregnancyActualCalvingDatePicker] = useState(false);
  const [showAddPregnancyExpectedReturnToHeatDatePicker, setShowAddPregnancyExpectedReturnToHeatDatePicker] = useState(false);
  const [showEditPregnancyExpectedReturnToHeatDatePicker, setShowEditPregnancyExpectedReturnToHeatDatePicker] = useState(false);
  const [showAddMortalityDatePicker, setShowAddMortalityDatePicker] = useState(false);
  const [showEditMortalityDatePicker, setShowEditMortalityDatePicker] = useState(false);
  const [showEditTransactionDatePicker, setShowEditTransactionDatePicker] = useState(false);
  const [showEditFeedLastUpdatedDatePicker, setShowEditFeedLastUpdatedDatePicker] = useState(false);
  const [showEditCalfWeaningDatePicker, setShowEditCalfWeaningDatePicker] = useState(false);
  const [herdRegisterData, setHerdRegisterData] = useState<AnimalData[]>([]);
  const [pregnancyCalvingRecords, setPregnancyCalvingRecords] = useState<PregnancyCalvingRecord[]>([]);
  const [newPregnancyRecord, setNewPregnancyRecord] = useState<Omit<PregnancyCalvingRecord, 'id'>>({
    cowEarTag: '',
    bodyConditionScore: 3.0,
    lastServiceDate: new Date().toISOString().split('T')[0],
    firstTrimesterPD: 'Not Tested',
    secondTrimesterPD: 'Not Tested',
    thirdTrimesterPD: 'Not Tested',
    gestationPeriod: 0,
    expectedCalvingDate: '',
    actualCalvingDate: '',
    averageBCS: 3.0,
    expectedReturnToHeatDate: ''
  });
  const [healthRecords, setHealthRecords] = useState<AnimalHealthRecord[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<BullBreedingRecord[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const totalSales = React.useMemo(() => {
    return transactions
      .filter(t => t.type === 'Sale')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  }, [transactions]);

  const totalPurchases = React.useMemo(() => {
    return transactions
      .filter(t => t.type === 'Purchase')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  }, [transactions]);

  const netProfitLoss = totalSales - totalPurchases;

  const [weightRecords, setWeightRecords] = useState<any[]>([]);
  const [newAnimal, setNewAnimal] = useState<Omit<AnimalData, 'id'>>({ 
    tag: '', 
    age: '', 
    dateOfBirth: '',
    breed: '', 
    sex: 'Male', 
    stockType: '', 
    source: '',
    observer: '',
    birthWeight: '',
    deliveryType: 'Natural',
    sire: '',
    dam: '',
    dateOfWeaning: '',
    weaningWeight: '',
    description: ''
  });
  const [showWeaningDatePicker, setShowWeaningDatePicker] = useState(false);
  const [selectedWeaningDate, setSelectedWeaningDate] = useState(new Date());
  const [customBreedList, setCustomBreedList] = useState<string[]>([
    'Angus', 'Brahman', 'Hereford', 'Mashona', 'Tuli', 'Simmental', 'Other'
  ]);
  const [showCustomBreedInput, setShowCustomBreedInput] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState({
    lastServiceDate: false,
    expectedCalvingDate: false,
    actualCalvingDate: false
  });
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const toggleDatePicker = (field: 'lastServiceDate' | 'expectedCalvingDate' | 'actualCalvingDate') => {
    setShowDatePicker(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newHealthRecord, setNewHealthRecord] = useState<Omit<AnimalHealthRecord, 'id'>>({
    animalId: '',
    date: new Date().toISOString().split('T')[0],
    treatment: '',
    status: 'Pending',
    specialNotes: '',
    doneBy: ''
  });
  const [applyToAll, setApplyToAll] = useState(false);
  const [selectedAnimalTags, setSelectedAnimalTags] = useState<string[]>([]);
  const [animalSearchQuery, setAnimalSearchQuery] = useState('');
  const [newBullBreedingRecord, setNewBullBreedingRecord] = useState<Omit<BullBreedingRecord, 'id'>>({
    bullId: '',
    date: new Date().toISOString().split('T')[0],
    age: '',
    pe: 'Good',
    spermMotility: '',
    spermMorphology: '',
    scrotal: '',
    libido: 'Good',
    score: '',
    classification: 'SPB'
  });

  // Define aliveAnimals by filtering out dead animals from ctxMortalityRecords
  const aliveAnimals = React.useMemo(() => {
    if (!animals) return [];
    const deadTags = new Set(ctxMortalityRecords ? ctxMortalityRecords.map(m => m.animalId).filter(Boolean) : []);
    return animals.filter(a => !deadTags.has(a.tag));
  }, [animals, ctxMortalityRecords]);

  // Dynamic breed options based on actual data
  const breedOptions = React.useMemo(() => {
    if (!aliveAnimals) return [{ label: 'All', value: 'All' }];
    const uniqueBreeds = Array.from(new Set(aliveAnimals.map(a => a.breed).filter(Boolean))).sort();
    return [
      { label: 'All', value: 'All' },
      ...uniqueBreeds.map(b => ({ label: b, value: b }))
    ];
  }, [aliveAnimals]);

  // Dynamic source options based on actual data
  const sourceOptions = React.useMemo(() => {
    if (!aliveAnimals) return [{ label: 'All', value: 'All' }];
    const uniqueSources = Array.from(new Set(aliveAnimals.map(a => a.source).filter(Boolean))).sort();
    return [
      { label: 'All', value: 'All' },
      ...uniqueSources.map(s => ({ label: s, value: s }))
    ];
  }, [aliveAnimals]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drug register state
  const [drugRegisterData, setDrugRegisterData] = useState<DrugData[]>(initialDrugRegisterData);
  const [isAddDrugModalVisible, setIsAddDrugModalVisible] = useState(false);
  
  // Cull & Mortalities state
  const [mortalityData, setMortalityData] = useState([
    { id: '1', date: '2025-07-20', animalId: 'C001', cause: 'Disease', description: 'Respiratory infection' },
    { id: '2', date: '2025-07-18', animalId: 'B012', cause: 'Injury', description: 'Broken leg' },
  ]);
  
  // Heat Detection & Breeding state
  const [heatBreedingRecords, setHeatBreedingRecords] = useState<HeatBreedingRecord[]>([]);
  const [isAddHeatBreedingModalVisible, setIsAddHeatBreedingModalVisible] = useState(false);
  const [showHeatDatePicker, setShowHeatDatePicker] = useState(false);

  const [showServicedDatePicker, setShowServicedDatePicker] = useState(false);
  const [showReturnToHeatDatePicker, setShowReturnToHeatDatePicker] = useState(false);
  const [showDateServed2Picker, setShowDateServed2Picker] = useState(false);
  const [showReturnToHeat2DatePicker, setShowReturnToHeat2DatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<'heat' | 'serviced' | 'returnToHeat' | 'dateServed2' | 'returnToHeat2'>('heat');
  const [newHeatBreedingRecord, setNewHeatBreedingRecord] = useState<Omit<HeatBreedingRecord, 'id'>>({
    earTagNumber: '',
    stockType: 'Cow',
    bodyConditionScore: 3.0,
    heatDetectionDate: new Date().toISOString().split('T')[0],
    observer: '',
    servicedDate: new Date().toISOString().split('T')[0],
    breedingStatus: 'Bred',
    breedingMethod: 'Natural',
    aiTechnician: '',
    sireId: '',
    strawId: '',
    semenViability: undefined,
    returnToHeatDate1: '',
    dateServed2: '',
    breedingMethod2: 'Natural',
    sireUsed2: '',
    returnToHeatDate2: ''
  });
  const [isAddMortalityModalVisible, setIsAddMortalityModalVisible] = useState(false);
  const [newMortality, setNewMortality] = useState({
    date: new Date().toISOString().split('T')[0],
    animalId: '',
    cause: '',
    description: '',
    observer: ''
  });
  const [newDrug, setNewDrug] = useState<Omit<DrugData, 'id'>>({ 
    drugClass: '',
    type: '',
    name: '',
    withdrawalPeriod: '',
    pregnancySafe: 'No',
    stockStatus: 'In Stock'
  });

  const handleAddDrug = async () => {
    // --- Validation ---
    if (!newDrug.drugClass.trim()) {
      alert('Please enter the Drug Class (e.g. Antibiotic, Vitamin).');
      return;
    }
    if (!newDrug.type.trim()) {
      alert('Please enter the Drug Type (e.g. Injectable, Oral).');
      return;
    }
    if (!newDrug.name.trim()) {
      alert('Please enter the Drug Name.');
      return;
    }
    // --- Submit ---
    setIsSubmitting(true);
    try {
      await addDrug(newDrug);
      setNewDrug({ 
        drugClass: '',
        type: '',
        name: '',
        withdrawalPeriod: '',
        pregnancySafe: 'No',
        stockStatus: 'In Stock'
      });
      setIsAddDrugModalVisible(false);
    } catch (error: any) {
      alert('Failed to save drug. Please try again.');
      console.error('Drug insert error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddMortality = async () => {
    // --- Validation ---
    if (!newMortality.animalId) {
      alert('Please select the animal.');
      return;
    }
    if (!newMortality.cause.trim()) {
      alert('Please enter the cause of death.');
      return;
    }
    if (!newMortality.date) {
      alert('Please enter the date.');
      return;
    }
    // --- Submit ---
    setIsSubmitting(true);
    try {
      await addMortalityRecord({
        animalId: newMortality.animalId,
        date: newMortality.date,
        cause: newMortality.cause,
        description: newMortality.description,
        observer: newMortality.observer,
        isPreWeaning: false,
      });
      setNewMortality({
        date: new Date().toISOString().split('T')[0],
        animalId: '',
        cause: '',
        description: '',
        observer: ''
      });
      setIsAddMortalityModalVisible(false);
    } catch (error: any) {
      alert('Failed to save record. Please try again.');
      console.error('Mortality insert error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderAddMortalityModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddMortalityModalVisible}
      onRequestClose={() => setIsAddMortalityModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Mortality Record</Text>
            
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="none"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowAddMortalityDatePicker(true)}
                >
                  <Text>{newMortality.date || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showAddMortalityDatePicker,
                  newMortality.date,
                  () => setShowAddMortalityDatePicker(false),
                  (formattedDate) => setNewMortality({...newMortality, date: formattedDate}),
                  "Mortality Date",
                  new Date()
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Picker
                  label="Select Animal"
                  value={newMortality.animalId}
                  onValueChange={(value) => setNewMortality({...newMortality, animalId: value})}
                  items={[
                    { label: 'Select an animal...', value: '' },
                    ...herdRegisterData.map(animal => ({
                      label: `${animal.tag} (${animal.breed} ${animal.stockType})`,
                      value: animal.tag
                    }))
                  ]}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Cause</Text>
                <TextInput
                  style={styles.input}
                  value={newMortality.cause}
                  onChangeText={(text) => setNewMortality({...newMortality, cause: text})}
                  placeholder="e.g., Disease, Injury"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Observer</Text>
                <TextInput
                  style={styles.input}
                  value={newMortality.observer}
                  onChangeText={(text) => setNewMortality({...newMortality, observer: text})}
                  placeholder="e.g., John Doe"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={newMortality.description}
                  onChangeText={(text) => setNewMortality({...newMortality, description: text})}
                  placeholder="Enter description"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                variant="outline" 
                onPress={() => setIsAddMortalityModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleAddMortality}
                disabled={isSubmitting || !newMortality.animalId || !newMortality.cause}
              >
                {isSubmitting ? 'Adding...' : 'Add Record'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderAddDrugModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddDrugModalVisible}
      onRequestClose={() => setIsAddDrugModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Add New Drug</Text>
            
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="none"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Drug Class</Text>
                <TextInput
                  style={styles.input}
                  value={newDrug.drugClass}
                  onChangeText={(text) => setNewDrug({...newDrug, drugClass: text})}
                  placeholder="e.g., Antibiotic, Vitamin"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Type</Text>
                <TextInput
                  style={styles.input}
                  value={newDrug.type}
                  onChangeText={(text) => setNewDrug({...newDrug, type: text})}
                  placeholder="e.g., Injectable, Oral"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Drug Name</Text>
                <TextInput
                  style={styles.input}
                  value={newDrug.name}
                  onChangeText={(text) => setNewDrug({...newDrug, name: text})}
                  placeholder="e.g., Oxytetracycline"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Withdrawal Period</Text>
                <TextInput
                  style={styles.input}
                  value={newDrug.withdrawalPeriod}
                  onChangeText={(text) => setNewDrug({...newDrug, withdrawalPeriod: text})}
                  placeholder="e.g., 21 days"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Pregnancy Safe</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={[styles.radioButton, newDrug.pregnancySafe === 'Yes' && styles.radioButtonSelected]}
                    onPress={() => setNewDrug({...newDrug, pregnancySafe: 'Yes'})}
                  >
                    <Text>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.radioButton, newDrug.pregnancySafe === 'No' && styles.radioButtonSelected]}
                    onPress={() => setNewDrug({...newDrug, pregnancySafe: 'No'})}
                  >
                    <Text>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Picker
                  label="Stock Status"
                  value={newDrug.stockStatus}
                  onValueChange={(value) => setNewDrug({...newDrug, stockStatus: value as DrugData['stockStatus']})}
                  items={[
                    { label: 'In Stock', value: 'In Stock' },
                    { label: 'Low Stock', value: 'Low Stock' },
                    { label: 'Out of Stock', value: 'Out of Stock' }
                  ]}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                variant="outline" 
                onPress={() => setIsAddDrugModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleAddDrug}
                disabled={isSubmitting || !newDrug.drugClass || !newDrug.name}
              >
                {isSubmitting ? 'Adding...' : 'Add Drug'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
  const [selectedBreed, setSelectedBreed] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');

  const [tableFilterBreed, setTableFilterBreed] = useState('All');
  const [tableFilterSource, setTableFilterSource] = useState('All');
  const [tableFilterStockType, setTableFilterStockType] = useState('All');

  const displayedHerdData = React.useMemo(() => {
    return herdRegisterData.filter(a => {
      const matchBreed = tableFilterBreed === 'All' || a.breed === tableFilterBreed;
      const matchSource = tableFilterSource === 'All' || a.source === tableFilterSource;
      const matchStockType = tableFilterStockType === 'All' || 
                             (tableFilterStockType === 'Calve' ? (a.stockType === 'Calf' || a.stockType === 'Calve') : a.stockType === tableFilterStockType);
      return matchBreed && matchSource && matchStockType;
    }).map((item, index) => ({
      ...item,
      count: index + 1
    }));
  }, [herdRegisterData, tableFilterBreed, tableFilterSource, tableFilterStockType]);

  // --- CALCULATE DYNAMIC STATS FOR HERD AT A GLANCE ---

  // Dynamic accurate calculations for herdTotals
  const herdTotals = React.useMemo(() => {
    if (!aliveAnimals) return { cows: 0, bulls: 0, heifers: 0, steers: 0, maleCalves: 0, femaleCalves: 0 };
    const filteredAnimals = aliveAnimals.filter(a => {
      const matchBreed = selectedBreed.toLowerCase() === 'all' || a.breed.toLowerCase() === selectedBreed.toLowerCase();
      const matchSource = selectedSource.toLowerCase() === 'all' || a.source.toLowerCase() === selectedSource.toLowerCase();
      return matchBreed && matchSource;
    });

    return {
      cows: filteredAnimals.filter(a => a.stockType === 'Cow').length,
      bulls: filteredAnimals.filter(a => a.stockType === 'Bull').length,
      heifers: filteredAnimals.filter(a => a.stockType === 'Heifer' || a.stockType === 'Bullying Heifer').length,
      steers: filteredAnimals.filter(a => a.stockType === 'Steer').length,
      maleCalves: filteredAnimals.filter(a => a.stockType === 'Calve' && a.sex === 'Male').length,
      femaleCalves: filteredAnimals.filter(a => a.stockType === 'Calve' && a.sex === 'Female').length,
    };
  }, [aliveAnimals, selectedBreed, selectedSource]);

  // Dynamic Breed Distribution based on source filters
  const breedDistribution = React.useMemo(() => {
    if (!aliveAnimals) return [];
    const filteredAnimals = aliveAnimals.filter(a => {
      const matchSource = selectedSource.toLowerCase() === 'all' || a.source.toLowerCase() === selectedSource.toLowerCase();
      return matchSource;
    });

    const counts: { [key: string]: number } = {};
    filteredAnimals.forEach(a => {
      counts[a.breed] = (counts[a.breed] || 0) + 1;
    });
    
    const chartColors = [
      Colors.primary[500],
      Colors.success[500],
      Colors.warning[500],
      Colors.secondary[500],
      Colors.accent[500],
      Colors.error[500],
      Colors.neutral[500]
    ];

    return Object.keys(counts).map((name, index) => ({
      name,
      population: counts[name],
      color: chartColors[index % chartColors.length]
    }));
  }, [aliveAnimals, selectedSource]);

  // Dynamic Source Distribution based on breed filters
  const sourceDistribution = React.useMemo(() => {
    if (!aliveAnimals) return [];
    const filteredAnimals = aliveAnimals.filter(a => {
      const matchBreed = selectedBreed.toLowerCase() === 'all' || a.breed.toLowerCase() === selectedBreed.toLowerCase();
      return matchBreed;
    });

    const counts = { Born: 0, Purchased: 0 };
    filteredAnimals.forEach(a => {
      if (a.source === 'Born') counts.Born++;
      else if (a.source === 'Purchased') counts.Purchased++;
    });

    return [
      { name: 'Born', population: counts.Born, color: Colors.primary[500] },
      { name: 'Purchased', population: counts.Purchased, color: Colors.success[500] }
    ];
  }, [aliveAnimals, selectedBreed]);

  // Dynamic Age Distribution
  const ageDistribution = React.useMemo(() => {
    if (!aliveAnimals) return [];
    const filteredAnimals = aliveAnimals.filter(a => {
      const matchBreed = selectedBreed.toLowerCase() === 'all' || a.breed.toLowerCase() === selectedBreed.toLowerCase();
      const matchSource = selectedSource.toLowerCase() === 'all' || a.source.toLowerCase() === selectedSource.toLowerCase();
      return matchBreed && matchSource;
    });

    let under1 = 0;
    let oneToThree = 0;
    let overThree = 0;

    filteredAnimals.forEach(a => {
      if (!a.age) return;
      if (a.age.includes('m') && !a.age.includes('y')) {
        under1++;
      } else {
        const yearsMatch = a.age.match(/^(\d+)y/);
        if (yearsMatch) {
          const years = parseInt(yearsMatch[1], 10);
          if (years < 1) under1++;
          else if (years <= 3) oneToThree++;
          else overThree++;
        } else {
          under1++;
        }
      }
    });

    return [
      { name: '< 1 Year', population: under1, color: Colors.primary[500] },
      { name: '1 - 3 Years', population: oneToThree, color: Colors.warning[500] },
      { name: '> 3 Years', population: overThree, color: Colors.success[500] }
    ];
  }, [aliveAnimals, selectedBreed, selectedSource]);

  // Dynamic Stock Type Breakdown
  const stockTypeBreakdown = React.useMemo(() => {
    if (!aliveAnimals) return [];
    const filteredAnimals = aliveAnimals.filter(a => {
      const matchBreed = selectedBreed.toLowerCase() === 'all' || a.breed.toLowerCase() === selectedBreed.toLowerCase();
      const matchSource = selectedSource.toLowerCase() === 'all' || a.source.toLowerCase() === selectedSource.toLowerCase();
      return matchBreed && matchSource;
    });

    const counts: { [key: string]: number } = {};
    filteredAnimals.forEach(a => {
      counts[a.stockType] = (counts[a.stockType] || 0) + 1;
    });

    const colorsMap: { [key: string]: string } = {
      Cow: Colors.success[500],
      Bull: Colors.error[500],
      Heifer: Colors.warning[500],
      Steer: Colors.secondary[500],
      Calve: Colors.accent[500],
      'Bullying Heifer': Colors.secondary[700]
    };

    const chartColors = [
      Colors.primary[500],
      Colors.success[500],
      Colors.warning[500],
      Colors.secondary[500],
      Colors.accent[500],
      Colors.error[500],
      Colors.neutral[500]
    ];

    return Object.keys(counts).map((name, index) => ({
      name: name === 'Calve' ? 'Calves' : name + 's',
      population: counts[name],
      color: colorsMap[name] || chartColors[index % chartColors.length]
    }));
  }, [aliveAnimals, selectedBreed, selectedSource]);
  const [activeTab, setActiveTab] = useState(tab || 'overview');

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  // --- REACTIVE STATE SYNCHRONIZATION WITH CONTEXT ---
  useEffect(() => {
    if (aliveAnimals) {
      setHerdRegisterData(aliveAnimals.map(a => ({
        id: a.id,
        tag: a.tag,
        age: a.age,
        dateOfBirth: a.dateOfBirth,
        breed: a.breed,
        sex: a.sex,
        stockType: a.stockType,
        source: a.source,
        observer: a.observer,
        birthWeight: a.birthWeight,
        deliveryType: a.deliveryType,
        sire: a.sire,
        dam: a.dam,
        dateOfWeaning: a.dateOfWeaning,
        weaningWeight: a.weaningWeight,
        description: a.description,
        weight30day: a.weight30day,
        weight100day: a.weight100day,
        weight1weekPostWeaning: a.weight1weekPostWeaning,
        weight6monthsPostWeaning: a.weight6monthsPostWeaning,
        calfStatus: a.calfStatus,
        preWeaningMortality: a.preWeaningMortality,
      })));
    }
  }, [aliveAnimals]);

  useEffect(() => {
    if (ctxHealthRecords && aliveAnimals) {
      const aliveTags = new Set(aliveAnimals.map(a => a.tag.toLowerCase()));
      const filteredHealth = ctxHealthRecords.filter(h => h.animalId?.toLowerCase() === 'all' || aliveTags.has(h.animalId.toLowerCase()));
      setHealthRecords(filteredHealth.map(h => ({
        id: h.id,
        animalId: h.animalId,
        date: h.date,
        treatment: h.treatment,
        status: h.status,
        specialNotes: h.specialNotes,
        doneBy: h.doneBy,
      })));
    }
  }, [ctxHealthRecords, aliveAnimals]);

  useEffect(() => {
    if (ctxPregnancyRecords && aliveAnimals) {
      const aliveTags = new Set(aliveAnimals.map(a => a.tag.toLowerCase()));
      const filteredPregnancy = ctxPregnancyRecords.filter(p => aliveTags.has(p.cowEarTag.toLowerCase()));
      setPregnancyCalvingRecords(filteredPregnancy.map(p => ({
        id: p.id,
        cowEarTag: p.cowEarTag,
        bodyConditionScore: p.bodyConditionScore,
        lastServiceDate: p.lastServiceDate,
        firstTrimesterPD: p.firstTrimesterPD,
        secondTrimesterPD: p.secondTrimesterPD,
        thirdTrimesterPD: p.thirdTrimesterPD,
        gestationPeriod: p.gestationPeriod,
        expectedCalvingDate: p.expectedCalvingDate,
        actualCalvingDate: p.actualCalvingDate,
        calfId: p.calfId,
        calfSex: p.calfSex,
        deliveryType: p.deliveryType,
        averageBCS: p.averageBCS,
        expectedReturnToHeatDate: p.expectedReturnToHeatDate,
      })));
    }
  }, [ctxPregnancyRecords, aliveAnimals]);

  useEffect(() => {
    if (ctxBreedingRecords && aliveAnimals) {
      const aliveTags = new Set(aliveAnimals.map(a => a.tag.toLowerCase()));
      const filteredBreeding = ctxBreedingRecords.filter(b => aliveTags.has(b.earTagNumber.toLowerCase()));
      setHeatBreedingRecords(filteredBreeding.map(b => ({
        id: b.id,
        earTagNumber: b.earTagNumber,
        stockType: b.stockType as any,
        bodyConditionScore: b.bodyConditionScore,
        heatDetectionDate: b.heatDetectionDate,
        observer: b.observer,
        servicedDate: b.servicedDate,
        breedingStatus: b.breedingStatus,
        breedingMethod: b.breedingMethod,
        aiTechnician: b.aiTechnician,
        sireId: b.sireId,
        strawId: b.strawId,
        semenViability: b.semenViability,
        returnToHeatDate1: b.returnToHeatDate1,
        dateServed2: b.dateServed2,
        breedingMethod2: b.breedingMethod2,
        sireUsed2: b.sireUsed2,
        returnToHeatDate2: b.returnToHeatDate2,
      })));
    }
  }, [ctxBreedingRecords, aliveAnimals]);

  useEffect(() => {
    if (ctxTransactions) {
      setTransactions(ctxTransactions.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
      })));
    }
  }, [ctxTransactions]);

  useEffect(() => {
    if (ctxMortalityRecords) {
      setMortalityData(ctxMortalityRecords.map(m => ({
        id: m.id,
        date: m.date,
        animalId: m.animalId,
        cause: m.cause,
        description: m.description,
        observer: m.observer,
      })));
    }
  }, [ctxMortalityRecords]);

  useEffect(() => {
    if (bullBreedingRecords && aliveAnimals) {
      const aliveTags = new Set(aliveAnimals.map(a => a.tag.toLowerCase()));
      setBreedingRecords(bullBreedingRecords.filter(b => aliveTags.has(b.bullId.toLowerCase())));
    }
  }, [bullBreedingRecords, aliveAnimals]);

  useEffect(() => {
    if (animalWeights && aliveAnimals) {
      const aliveTags = new Set(aliveAnimals.map(a => a.tag.toLowerCase()));
      const filteredWeights = animalWeights.filter(w => aliveTags.has(w.animalTag.toLowerCase()));
      setWeightRecords(filteredWeights.map(w => {
        const animal = aliveAnimals.find(a => a.tag.toLowerCase() === w.animalTag.toLowerCase());
        return {
          id: w.animalTag, // used by DataTable as unique key
          year: w.year,
          stockType: animal ? animal.stockType : 'Cow',
          age: animal ? animal.age : '',
          jan: w.jan || '',
          feb: w.feb || '',
          mar: w.mar || '',
          apr: w.apr || '',
          may: w.may || '',
          jun: w.jun || '',
          jul: w.jul || '',
          aug: w.aug || '',
          sep: w.sep || '',
          oct: w.oct || '',
          nov: w.nov || '',
          dec: w.dec || '',
        };
      }));
    }
  }, [animalWeights, aliveAnimals]);

  useEffect(() => {
    if (ctxDrugs) {
      setDrugRegisterData(ctxDrugs);
    }
  }, [ctxDrugs]);

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'Sale' as 'Sale' | 'Purchase',
    animalTag: '', // For sales
    purchaseDetails: { // For purchases
      tag: '',
      dateOfBirth: '',
      breed: '',
      sex: 'Male' as 'Male' | 'Female',
      stockType: '',
      source: 'Purchased'
    }
  });
  const [isTransactionDatePickerVisible, setTransactionDatePickerVisibility] = useState(false);
  const [isPurchaseDobPickerVisible, setPurchaseDobPickerVisible] = useState(false);

  const [newWeightRecord, setNewWeightRecord] = useState({
    tag: '',
    stockType: 'Bull',
    age: '',
    jan: '',
    feb: '',
    mar: '',
    apr: '',
    may: '',
    jun: '',
    jul: '',
    aug: '',
    sep: '',
    oct: '',
    nov: '',
    dec: ''
  });

  const [isAddFeedModalVisible, setIsAddFeedModalVisible] = useState(false);
  const [isEditCalfModalVisible, setIsEditCalfModalVisible] = useState(false);
  const [editingCalf, setEditingCalf] = useState<AnimalData | null>(null);


  
  // Function to handle editing a calf record
  const handleEditCalf = (calf: AnimalData) => {
    // Set default values if they don't exists
    const calfWithDefaults = {
      observer: '',
      birthWeight: '',
      deliveryType: 'Natural',
      ...calf
    };
    setEditingCalf(calfWithDefaults as AnimalData);
    setIsEditCalfModalVisible(true);
  };
  
  // Function to save edited calf record
  const handleSaveCalf = () => {
    if (!editingCalf) return;
    
    updateAnimal(editingCalf.tag, {
      observer: editingCalf.observer,
      birthWeight: editingCalf.birthWeight,
      deliveryType: editingCalf.deliveryType,
      age: editingCalf.age,
      dateOfBirth: editingCalf.dateOfBirth,
      breed: editingCalf.breed,
      sex: editingCalf.sex,
      source: editingCalf.source as 'Born' | 'Purchased',
      sire: editingCalf.sire,
      dam: editingCalf.dam,
      dateOfWeaning: editingCalf.dateOfWeaning || undefined,
      weaningWeight: editingCalf.weaningWeight !== undefined && editingCalf.weaningWeight !== '' ? Number(editingCalf.weaningWeight) : undefined,
      weight30day: editingCalf.weight30day !== undefined && (editingCalf.weight30day as any) !== '' ? Number(editingCalf.weight30day) : undefined,
      weight100day: editingCalf.weight100day !== undefined && (editingCalf.weight100day as any) !== '' ? Number(editingCalf.weight100day) : undefined,
      weight1weekPostWeaning: editingCalf.weight1weekPostWeaning !== undefined && (editingCalf.weight1weekPostWeaning as any) !== '' ? Number(editingCalf.weight1weekPostWeaning) : undefined,
      weight6monthsPostWeaning: editingCalf.weight6monthsPostWeaning !== undefined && (editingCalf.weight6monthsPostWeaning as any) !== '' ? Number(editingCalf.weight6monthsPostWeaning) : undefined,
      calfStatus: editingCalf.calfStatus || undefined,
      preWeaningMortality: editingCalf.preWeaningMortality ?? false,
    });
    
    setIsEditCalfModalVisible(false);
    setEditingCalf(null);
    
    // Show success message
    alert('Calf details updated successfully');
  };

  // Function to handle editing an animal record
  const handleEditAnimal = (animal: AnimalData) => {
    setEditingAnimal({ ...animal });
    setOriginalAnimalTag(animal.tag);
    setModalActiveTab('details');
    setIsEditAnimalModalVisible(true);
  };

  // Function to save edited animal record
  const handleSaveAnimal = async () => {
    if (!editingAnimal) return;
    if (!editingAnimal.tag.trim()) {
      alert('Please enter the Animal Tag.');
      return;
    }
    if (!editingAnimal.dateOfBirth) {
      alert('Please enter the Date of Birth.');
      return;
    }
    if (!editingAnimal.breed.trim()) {
      alert('Please select or enter a Breed.');
      return;
    }
    if (!editingAnimal.stockType) {
      alert('Please select a Stock Type.');
      return;
    }
    if (!editingAnimal.source) {
      alert('Please select the Source.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate age
      const date = new Date(editingAnimal.dateOfBirth);
      const today = new Date();
      let years = today.getFullYear() - date.getFullYear();
      let months = today.getMonth() - date.getMonth();
      if (months < 0 || (months === 0 && today.getDate() < date.getDate())) {
        years--;
        months += 12;
      }
      const ageText = years > 0 ? `${years}y ${months}m` : `${months}m`;

      await updateAnimal(originalAnimalTag, {
        tag: editingAnimal.tag.trim(),
        age: ageText,
        dateOfBirth: editingAnimal.dateOfBirth,
        breed: editingAnimal.breed,
        sex: editingAnimal.sex,
        stockType: editingAnimal.stockType as any,
        source: editingAnimal.source as any,
        birthWeight: editingAnimal.birthWeight || undefined,
        sire: editingAnimal.sire || undefined,
        dam: editingAnimal.dam || undefined,
        dateOfWeaning: editingAnimal.dateOfWeaning || undefined,
        weaningWeight: editingAnimal.weaningWeight ? parseFloat(editingAnimal.weaningWeight.toString()) : undefined,
        description: editingAnimal.description || undefined,
      });


      setIsEditAnimalModalVisible(false);
      setEditingAnimal(null);
      alert('Animal details updated successfully.');
    } catch (error: any) {
      alert('Failed to update animal: ' + error.message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePedigreeMobile = async () => {
    if (!editingAnimal) return;
    setIsSubmitting(true);
    try {
      await updateAnimal(editingAnimal.tag, {
        sire: pedigreeForm.sire || undefined,
        dam: pedigreeForm.dam || undefined,
      });

      const upsertParent = async (parentTag: string, sex: 'Male' | 'Female', parentSire: string, parentDam: string) => {
        if (!parentTag) return;
        const parentTagLower = parentTag.trim().toLowerCase();
        
        const existing = animals.find(a => a.tag.toLowerCase() === parentTagLower);
        if (existing) {
          await updateAnimal(existing.tag, {
            sire: parentSire || undefined,
            dam: parentDam || undefined,
          });
        } else {
          await addAnimal({
            tag: parentTag,
            sex,
            stockType: sex === 'Male' ? 'Bull' : 'Cow',
            breed: editingAnimal.breed || 'Unknown',
            sire: parentSire || undefined,
            dam: parentDam || undefined,
            source: 'Purchased',
            age: '—',
            dateOfBirth: new Date().toISOString().split('T')[0],
          });
        }
      };

      if (pedigreeForm.sire) {
        await upsertParent(pedigreeForm.sire, 'Male', pedigreeForm.sireSire, pedigreeForm.sireDam);
      }
      if (pedigreeForm.dam) {
        await upsertParent(pedigreeForm.dam, 'Female', pedigreeForm.damSire, pedigreeForm.damDam);
      }

      setEditingAnimal(prev => prev ? {
        ...prev,
        sire: pedigreeForm.sire,
        dam: pedigreeForm.dam
      } : null);

      setIsPedigreeEditModalVisible(false);
      alert('Pedigree tree updated successfully');
    } catch (e: any) {
      console.error(e);
      alert('Failed to update pedigree tree');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditHealthRecord = (record: AnimalHealthRecord) => {
    setEditingHealthRecord({ ...record });
    setIsEditHealthRecordModalVisible(true);
  };

  const handleSaveHealthRecord = async () => {
    if (!editingHealthRecord) return;
    setIsSubmitting(true);
    try {
      await updateHealthRecord(editingHealthRecord.id, {
        animalId: editingHealthRecord.animalId,
        date: editingHealthRecord.date,
        treatment: editingHealthRecord.treatment,
        status: editingHealthRecord.status as any,
        specialNotes: editingHealthRecord.specialNotes,
        doneBy: editingHealthRecord.doneBy,
      });
      setIsEditHealthRecordModalVisible(false);
      setEditingHealthRecord(null);
      alert('Health record updated successfully.');
    } catch (e: any) {
      alert('Failed to update health record: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBreedingRecord = (record: HeatBreedingRecord) => {
    setEditingBreedingRecord({ ...record });
    setIsEditBreedingRecordModalVisible(true);
  };

  const handleSaveBreedingRecord = async () => {
    if (!editingBreedingRecord) return;
    setIsSubmitting(true);
    try {
      await updateBreedingRecord(editingBreedingRecord.id, {
        earTagNumber: editingBreedingRecord.earTagNumber,
        stockType: editingBreedingRecord.stockType as any,
        bodyConditionScore: editingBreedingRecord.bodyConditionScore,
        heatDetectionDate: editingBreedingRecord.heatDetectionDate,
        observer: editingBreedingRecord.observer,
        servicedDate: editingBreedingRecord.servicedDate,
        breedingStatus: editingBreedingRecord.breedingStatus as any,
        breedingMethod: editingBreedingRecord.breedingMethod as any,
        aiTechnician: editingBreedingRecord.aiTechnician,
        sireId: editingBreedingRecord.sireId,
        strawId: editingBreedingRecord.strawId,
        semenViability: editingBreedingRecord.semenViability,
        returnToHeatDate1: editingBreedingRecord.returnToHeatDate1,
        dateServed2: editingBreedingRecord.dateServed2,
        breedingMethod2: editingBreedingRecord.breedingMethod2 as any,
        sireUsed2: editingBreedingRecord.sireUsed2,
        returnToHeatDate2: editingBreedingRecord.returnToHeatDate2,
      });
      setIsEditBreedingRecordModalVisible(false);
      setEditingBreedingRecord(null);
      alert('Breeding record updated successfully.');
    } catch (e: any) {
      alert('Failed to update breeding record: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPregnancyRecord = (record: PregnancyCalvingRecord) => {
    setEditingPregnancyRecord({ ...record });
    setIsEditPregnancyRecordModalVisible(true);
  };

  const handleSavePregnancyRecord = async () => {
    if (!editingPregnancyRecord) return;
    setIsSubmitting(true);
    try {
      await updatePregnancyRecord(editingPregnancyRecord.id, {
        cowEarTag: editingPregnancyRecord.cowEarTag,
        bodyConditionScore: editingPregnancyRecord.bodyConditionScore,
        lastServiceDate: editingPregnancyRecord.lastServiceDate,
        firstTrimesterPD: editingPregnancyRecord.firstTrimesterPD as any,
        secondTrimesterPD: editingPregnancyRecord.secondTrimesterPD as any,
        thirdTrimesterPD: editingPregnancyRecord.thirdTrimesterPD as any,
        gestationPeriod: editingPregnancyRecord.gestationPeriod,
        expectedCalvingDate: editingPregnancyRecord.expectedCalvingDate,
        actualCalvingDate: editingPregnancyRecord.actualCalvingDate,
        calfId: editingPregnancyRecord.calfId,
        calfSex: editingPregnancyRecord.calfSex as any,
        deliveryType: editingPregnancyRecord.deliveryType as any,
        averageBCS: editingPregnancyRecord.averageBCS,
        expectedReturnToHeatDate: editingPregnancyRecord.expectedReturnToHeatDate,
        actualFirstHeatDate: editingPregnancyRecord.actualFirstHeatDate,
        expectedSecondHeatDate: editingPregnancyRecord.expectedSecondHeatDate,
        actualSecondHeatDate: editingPregnancyRecord.actualSecondHeatDate,
      });
      setIsEditPregnancyRecordModalVisible(false);
      setEditingPregnancyRecord(null);
      alert('Pregnancy record updated successfully.');
    } catch (e: any) {
      alert('Failed to update pregnancy record: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWeightRecord = (record: any) => {
    setEditingWeightRecord({ ...record });
    setIsEditWeightRecordModalVisible(true);
  };

  const handleSaveWeightRecord = async () => {
    if (!editingWeightRecord) return;
    setIsSubmitting(true);
    try {
      await saveAnimalWeight({
        animalTag: editingWeightRecord.animalTag,
        year: Number(editingWeightRecord.year),
        jan: editingWeightRecord.jan,
        feb: editingWeightRecord.feb,
        mar: editingWeightRecord.mar,
        apr: editingWeightRecord.apr,
        may: editingWeightRecord.may,
        jun: editingWeightRecord.jun,
        jul: editingWeightRecord.jul,
        aug: editingWeightRecord.aug,
        sep: editingWeightRecord.sep,
        oct: editingWeightRecord.oct,
        nov: editingWeightRecord.nov,
        dec: editingWeightRecord.dec,
      });
      setIsEditWeightRecordModalVisible(false);
      setEditingWeightRecord(null);
      alert('Weight record updated successfully.');
    } catch (e: any) {
      alert('Failed to update weight record: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDrug = (record: any) => {
    setEditingDrug({ ...record });
    setIsEditDrugModalVisible(true);
  };

  const handleSaveDrug = async () => {
    if (!editingDrug) return;
    setIsSubmitting(true);
    try {
      await updateDrug(editingDrug.id, {
        drugClass: editingDrug.drugClass,
        type: editingDrug.type,
        name: editingDrug.name,
        withdrawalPeriod: editingDrug.withdrawalPeriod,
        pregnancySafe: editingDrug.pregnancySafe as any,
        stockStatus: editingDrug.stockStatus as any,
      });
      setIsEditDrugModalVisible(false);
      setEditingDrug(null);
      alert('Drug updated successfully.');
    } catch (e: any) {
      alert('Failed to update drug: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMortalityRecord = (record: any) => {
    setEditingMortalityRecord({ ...record });
    setIsEditMortalityRecordModalVisible(true);
  };

  const handleSaveMortalityRecord = async () => {
    if (!editingMortalityRecord) return;
    setIsSubmitting(true);
    try {
      await updateMortalityRecord(editingMortalityRecord.id, {
        animalId: editingMortalityRecord.animalId,
        date: editingMortalityRecord.date,
        cause: editingMortalityRecord.cause,
        description: editingMortalityRecord.description,
        observer: editingMortalityRecord.observer,
        isPreWeaning: editingMortalityRecord.isPreWeaning,
      });
      setIsEditMortalityRecordModalVisible(false);
      setEditingMortalityRecord(null);
      alert('Mortality record updated successfully.');
    } catch (e: any) {
      alert('Failed to update mortality record: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBullBreedingRecord = (record: any) => {
    setEditingBullBreedingRecord({ ...record });
    setIsEditBullBreedingRecordModalVisible(true);
  };

  const handleSaveBullBreedingRecord = async () => {
    if (!editingBullBreedingRecord) return;
    setIsSubmitting(true);
    try {
      await updateBullBreedingRecord(editingBullBreedingRecord.id, {
        bullId: editingBullBreedingRecord.bullId,
        date: editingBullBreedingRecord.date,
        age: editingBullBreedingRecord.age,
        pe: editingBullBreedingRecord.pe,
        spermMotility: editingBullBreedingRecord.spermMotility,
        spermMorphology: editingBullBreedingRecord.spermMorphology,
        scrotal: editingBullBreedingRecord.scrotal,
        libido: editingBullBreedingRecord.libido,
        score: editingBullBreedingRecord.score,
        classification: editingBullBreedingRecord.classification
      });
      setIsEditBullBreedingRecordModalVisible(false);
      setEditingBullBreedingRecord(null);
      alert('Bull breeding record updated successfully.');
    } catch (e: any) {
      alert('Failed to update record: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBullBreedingRecord = async (id: string) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this bull breeding record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await deleteBullBreedingRecord(id);
              setIsEditBullBreedingRecordModalVisible(false);
              setEditingBullBreedingRecord(null);
              alert('Record deleted successfully.');
            } catch (e: any) {
              alert('Failed to delete record: ' + e.message);
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleEditTransaction = (record: any) => {
    setEditingTransaction({ ...record });
    setIsEditTransactionModalVisible(true);
  };

  const handleSaveTransaction = async () => {
    if (!editingTransaction) return;
    setIsSubmitting(true);
    try {
      const amt = Number(editingTransaction.amount);
      await updateTransaction(editingTransaction.id, {
        date: editingTransaction.date,
        description: editingTransaction.description,
        amount: editingTransaction.type === 'Sale' ? Math.abs(amt) : -Math.abs(amt),
        type: editingTransaction.type as any,
      });
      setIsEditTransactionModalVisible(false);
      setEditingTransaction(null);
      alert('Transaction updated successfully.');
    } catch (e: any) {
      alert('Failed to update transaction: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFeedItem = (record: any) => {
    setEditingFeedItem({ ...record });
    setIsEditFeedModalVisible(true);
  };

  const handleSaveFeedItem = async () => {
    if (!editingFeedItem) return;
    setIsSubmitting(true);
    try {
      await updateFeedInventoryItem(editingFeedItem.id, {
        name: editingFeedItem.name,
        type: editingFeedItem.type,
        quantity: editingFeedItem.quantity,
        unit: editingFeedItem.unit,
        supplier: editingFeedItem.supplier,
        lastUpdated: editingFeedItem.lastUpdated,
        status: editingFeedItem.status as any,
      });
      setIsEditFeedModalVisible(false);
      setEditingFeedItem(null);
      alert('Feed inventory item updated successfully.');
    } catch (e: any) {
      alert('Failed to update feed inventory item: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to check if a calf record is complete
  const isCalfRecordComplete = (calf: AnimalData): boolean => {
    return !!(calf.observer && calf.birthWeight && calf.deliveryType);
  };
  
  
  // Function to get calf weight if available
  const getCalfWeight = (tag: string) => {
    const weightRecord = weightRecords.find(wr => wr.id === tag);
    if (!weightRecord) return null;
    
    // Get the most recent month with a weight
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const currentMonth = new Date().getMonth();
    
    // Check months from current backwards to find the most recent weight
    for (let i = currentMonth; i >= 0; i--) {
      const month = months[i];
      if (weightRecord[month as keyof typeof weightRecord]) {
        return {
          month: month.charAt(0).toUpperCase() + month.slice(1),
          weight: weightRecord[month as keyof typeof weightRecord]
        };
      }
    }
    
    return null;
  };
  const [newFeed, setNewFeed] = useState({
    name: '',
    type: 'Cattle Feed',
    quantity: '',
    unit: 'kg',
    supplier: '',
    lastUpdated: new Date().toISOString().split('T')[0],
    status: 'In Stock'
  });

  // Function to identify calves (animals younger than 1 year)
  const getCalves = () => {
    return herdRegisterData.filter(animal => {
      // Check if age is less than 1 year (assuming format like '6m' or '11m' for months)
      const ageMatch = animal.age.match(/(\d+)([ym])/);
      if (!ageMatch) return false;
      
      const [_, value, unit] = ageMatch;
      return (unit === 'm' && parseInt(value) < 12) || 
             (unit === 'y' && parseInt(value) === 0);
    });
  };

  // Function to identify mature herd animals (excluding calves)
  const getHerdAnimals = () => {
    return herdRegisterData.filter(animal => {
      if (animal.stockType === 'Calve' || animal.stockType === 'Calf') return false;
      const ageMatch = animal.age.match(/(\d+)([ym])/);
      if (!ageMatch) return true;
      
      const [_, value, unit] = ageMatch;
      const isCalf = (unit === 'm' && parseInt(value) < 12) || 
                     (unit === 'y' && parseInt(value) === 0);
      return !isCalf;
    });
  };

  // Function to check if a calf has weight records
  const hasWeightRecord = (tag: string) => {
    return weightData.some(record => record.id === tag);
  };

  const router = useRouter();

  const handleAddAnimal = async () => {
    // --- Validation: required fields ---
    if (!newAnimal.tag.trim()) {
      alert('Please enter the Animal Tag / Ear Tag number.');
      return;
    }
    if (!newAnimal.dateOfBirth) {
      alert('Please enter the Date of Birth.');
      return;
    }
    if (!newAnimal.breed.trim()) {
      alert('Please select or enter a Breed.');
      return;
    }
    if (!newAnimal.stockType) {
      alert('Please select a Stock Type (e.g. Cow, Bull, Heifer).');
      return;
    }
    if (!newAnimal.source) {
      alert('Please select the Source — Born on Farm or Purchased.');
      return;
    }
    // --- Validation: duplicate tag ---
    if (herdRegisterData.some(a => a.tag.trim().toLowerCase() === newAnimal.tag.trim().toLowerCase())) {
      alert(`An animal with tag "${newAnimal.tag}" already exists in the Herd Register.`);
      return;
    }
    // --- Submit ---
    setIsSubmitting(true);
    try {
      await addAnimal({
        tag: newAnimal.tag.trim(),
        age: newAnimal.age,
        dateOfBirth: newAnimal.dateOfBirth,
        breed: newAnimal.breed,
        sex: newAnimal.sex,
        stockType: newAnimal.stockType as any,
        source: newAnimal.source as any,
        weight: newAnimal.birthWeight ? parseFloat(newAnimal.birthWeight) : undefined,
        bcs: 3.0,
        birthWeight: newAnimal.birthWeight || undefined,
        sire: newAnimal.sire || undefined,
        dam: newAnimal.dam || undefined,
        dateOfWeaning: newAnimal.dateOfWeaning || undefined,
        weaningWeight: newAnimal.weaningWeight ? parseFloat(newAnimal.weaningWeight.toString()) : undefined,
        description: newAnimal.description || undefined,
      });
      setNewAnimal({ 
        tag: '', 
        age: '', 
        dateOfBirth: '',
        breed: '', 
        sex: 'Male', 
        stockType: '', 
        source: '',
        observer: '',
        birthWeight: '',
        deliveryType: 'Natural',
        sire: '',
        dam: '',
        dateOfWeaning: '',
        weaningWeight: '',
        description: ''
      });
      setShowCustomBreedInput(false);
      setIsAddModalVisible(false);
    } catch (error: any) {
      alert('Failed to add animal. Please try again.');
      console.error('Animal insert error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHealthRecord = async () => {
    if (!applyToAll && selectedAnimalTags.length === 0) {
      alert('Please select at least one animal');
      return;
    }

    setIsSubmitting(true);
    try {
      if (applyToAll) {
        await addHealthRecord({
          animalId: 'All',
          date: newHealthRecord.date,
          treatment: newHealthRecord.treatment,
          status: newHealthRecord.status as any,
          specialNotes: newHealthRecord.specialNotes,
          doneBy: newHealthRecord.doneBy,
        });
      } else {
        for (const tag of selectedAnimalTags) {
          await addHealthRecord({
            animalId: tag,
            date: newHealthRecord.date,
            treatment: newHealthRecord.treatment,
            status: newHealthRecord.status as any,
            specialNotes: newHealthRecord.specialNotes,
            doneBy: newHealthRecord.doneBy,
          });
        }
      }

      setApplyToAll(false);
      setSelectedAnimalTags([]);
      setAnimalSearchQuery('');
      setNewHealthRecord({
        animalId: '',
        date: new Date().toISOString().split('T')[0],
        treatment: '',
        status: 'Pending',
        specialNotes: '',
        doneBy: ''
      });
      setIsAddHealthRecordModalVisible(false);
    } catch (err: any) {
      console.error(`Error adding health record:`, err);
      alert('Error adding health record: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBreedingRecord = async () => {
    if (!isAdmin) {
      alert('Only admins are allowed to edit or input bull breeding soundness evaluation records.');
      return;
    }
    if (!newBullBreedingRecord.bullId) return;
    setIsSubmitting(true);
    try {
      await addBullBreedingRecord({
        bullId: newBullBreedingRecord.bullId,
        date: newBullBreedingRecord.date,
        age: newBullBreedingRecord.age,
        pe: newBullBreedingRecord.pe,
        spermMotility: newBullBreedingRecord.spermMotility,
        spermMorphology: newBullBreedingRecord.spermMorphology,
        scrotal: newBullBreedingRecord.scrotal,
        libido: newBullBreedingRecord.libido,
        score: newBullBreedingRecord.score,
        classification: newBullBreedingRecord.classification
      });
      setNewBullBreedingRecord({
        bullId: '',
        date: new Date().toISOString().split('T')[0],
        age: '',
        pe: 'Good',
        spermMotility: '',
        spermMorphology: '',
        scrotal: '',
        libido: 'Good',
        score: '',
        classification: 'SPB'
      });
      setIsAddBreedingRecordModalVisible(false);
    } catch (error: any) {
      alert('Error adding breeding record: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTransaction = async () => {
    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount)) return; // Basic validation

    if (newTransaction.type === 'Purchase') {
      const { tag } = newTransaction.purchaseDetails;
      if (tag && herdRegisterData.some(a => a.tag.trim().toLowerCase() === tag.trim().toLowerCase())) {
        alert('An animal with this tag already exists in the Herd Register.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (newTransaction.type === 'Purchase') {
        const { tag, dateOfBirth, breed, sex, stockType } = newTransaction.purchaseDetails;
        if(tag && dateOfBirth && breed && sex && stockType) {
          const today = new Date();
          const birthDate = new Date(dateOfBirth);
          let years = today.getFullYear() - birthDate.getFullYear();
          let months = today.getMonth() - birthDate.getMonth();
          if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
            years--;
            months += 12;
          }
          const age = years > 0 ? `${years}y ${months}m` : `${months}m`;

          await addAnimal({
            tag,
            dateOfBirth,
            breed,
            sex,
            stockType: stockType as any,
            source: 'Purchased',
            age,
          });
        }
      }

      if (newTransaction.type === 'Sale' && newTransaction.animalTag) {
        await deleteAnimal(newTransaction.animalTag);
      }

      await addTransaction({
        date: newTransaction.date,
        description: newTransaction.description,
        amount: newTransaction.type === 'Sale' ? Math.abs(amount) : -Math.abs(amount),
        type: newTransaction.type,
      });

      // Reset form
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'Sale',
        animalTag: '',
        purchaseDetails: {
          tag: '',
          dateOfBirth: '',
          breed: '',
          sex: 'Male',
          stockType: '',
          source: 'Purchased'
        }
      });
      setIsAddTransactionModalVisible(false);
    } catch (error: any) {
      alert('Error adding transaction: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddWeightRecord = async () => {
    const tag = newWeightRecord.tag;
    if (!tag) return;
    if (weightRecords.some(r => r.id.trim().toLowerCase() === tag.trim().toLowerCase())) {
      alert('A weight record for this animal already exists.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveAnimalWeight({
        animalTag: tag,
        year: new Date().getFullYear(),
        jan: newWeightRecord.jan || '0',
        feb: newWeightRecord.feb || '0',
        mar: newWeightRecord.mar || '0',
        apr: newWeightRecord.apr || '0',
        may: newWeightRecord.may || '0',
        jun: newWeightRecord.jun || '0',
        jul: newWeightRecord.jul || '0',
        aug: newWeightRecord.aug || '0',
        sep: newWeightRecord.sep || '0',
        oct: newWeightRecord.oct || '0',
        nov: newWeightRecord.nov || '0',
        dec: newWeightRecord.dec || '0',
      });

      // Find the latest weights to update context FCR/ADG
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const weights: number[] = [];
      months.forEach(m => {
        const val = parseFloat(newWeightRecord[m as keyof typeof newWeightRecord]);
        if (!isNaN(val) && val > 0) {
          weights.push(val);
        }
      });
      if (weights.length > 0) {
        const currentWeight = weights[weights.length - 1];
        const previousWeight = weights.length > 1 ? weights[weights.length - 2] : undefined;
        updateAnimalWeight(tag, currentWeight, previousWeight, 30);
      }

      // Reset the form
      setNewWeightRecord({
        tag: '',
        stockType: 'Bull',
        age: '',
        jan: '',
        feb: '',
        mar: '',
        apr: '',
        may: '',
        jun: '',
        jul: '',
        aug: '',
        sep: '',
        oct: '',
        nov: '',
        dec: ''
      });
      setWeightAnimalSearchQuery('');
      setIsAddWeightRecordModalVisible(false);
    } catch (error: any) {
      alert('Error saving weight record: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFeed = async () => {
    const qty = parseFloat(newFeed.quantity) || 0;
    setIsSubmitting(true);
    try {
      await addFeedRecord({
        animalGroup: newFeed.type === 'Cattle Feed' ? 'Cattle-fattening' : newFeed.type === 'Poultry Feed' ? 'Poultry-broilers' : 'Small-ruminants',
        feedType: newFeed.name || 'Purchased Feed',
        quantityConsumed: qty,
        costPerKg: 0.5,
        date: new Date().toISOString().split('T')[0],
      });

      await addFeedInventoryItem({
        name: newFeed.name,
        type: newFeed.type,
        quantity: newFeed.quantity,
        unit: newFeed.unit,
        supplier: newFeed.supplier,
        lastUpdated: new Date().toISOString().split('T')[0],
        status: newFeed.status as any,
      });

      // Reset the form
      setNewFeed({
        name: '',
        type: 'Cattle Feed',
        quantity: '',
        unit: 'kg',
        supplier: '',
        lastUpdated: new Date().toISOString().split('T')[0],
        status: 'In Stock'
      });
      setIsAddFeedModalVisible(false);
    } catch (error: any) {
      alert('Error adding feed record: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAdaptiveDatePicker = (
    visible: boolean,
    valueStr: string | undefined,
    onClose: () => void,
    onValueChange: (formattedDate: string) => void,
    title: string = 'Select Date',
    maximumDate?: Date,
    minimumDate?: Date
  ) => {
    return (
      <DatePickerModal
        visible={visible}
        valueStr={valueStr}
        title={title}
        onClose={onClose}
        onSave={onValueChange}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
      />
    );
  };

  const renderEditHealthRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditHealthRecordModalVisible}
      onRequestClose={() => setIsEditHealthRecordModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Edit Health Record</Text>
            <ScrollView 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Animal Tag</Text>
                {editingHealthRecord?.animalId?.toLowerCase() === 'all' ? (
                  <View style={[styles.statusBadge, { backgroundColor: '#DCF7E8', borderColor: '#9FE4C1', borderWidth: 1, padding: 8, alignSelf: 'flex-start', borderRadius: 8 }]}>
                    <Text variant="body2" style={{ color: Colors.success[700], fontWeight: 'bold' }}>👥 All Herd</Text>
                  </View>
                ) : (
                  <Text variant="body" weight="medium" style={[styles.input, { backgroundColor: Colors.neutral[100], color: Colors.neutral[700] }]}>
                    {editingHealthRecord?.animalId || ''}
                  </Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEditHealthDatePicker(true)}
                >
                  <Text>{editingHealthRecord?.date || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showEditHealthDatePicker,
                  editingHealthRecord?.date,
                  () => setShowEditHealthDatePicker(false),
                  (formattedDate) => editingHealthRecord && setEditingHealthRecord({...editingHealthRecord, date: formattedDate})
                )}
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Treatment / Medication *</Text>
                <TextInput
                  style={styles.input}
                  value={editingHealthRecord?.treatment || ''}
                  onChangeText={(text) => editingHealthRecord && setEditingHealthRecord({...editingHealthRecord, treatment: text})}
                  placeholder="e.g. Deworming"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Done By (person who did the task)</Text>
                <TextInput
                  style={styles.input}
                  value={editingHealthRecord?.doneBy || ''}
                  onChangeText={(text) => editingHealthRecord && setEditingHealthRecord({...editingHealthRecord, doneBy: text})}
                  placeholder="e.g. John Doe"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Special Notes</Text>
                <TextInput
                  style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={editingHealthRecord?.specialNotes || ''}
                  onChangeText={(text) => editingHealthRecord && setEditingHealthRecord({...editingHealthRecord, specialNotes: text})}
                  placeholder="Enter special notes"
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Status</Text>
                <View style={styles.radioGroup}>
                  {['Completed', 'Scheduled', 'Pending'].map((status) => (
                    <TouchableOpacity 
                      key={status}
                      style={[styles.radioButton, editingHealthRecord?.status === status && styles.radioButtonSelected]}
                      onPress={() => editingHealthRecord && setEditingHealthRecord({...editingHealthRecord, status: status as any})}
                    >
                      <Text>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button variant="outline" onPress={() => { setIsEditHealthRecordModalVisible(false); setEditingHealthRecord(null); }} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button onPress={handleSaveHealthRecord} disabled={isSubmitting || !editingHealthRecord?.treatment || !editingHealthRecord?.date}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEditBreedingRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditBreedingRecordModalVisible}
      onRequestClose={() => setIsEditBreedingRecordModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Edit Breeding Record</Text>
            <ScrollView 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Animal Tag</Text>
                <Text variant="body" weight="medium" style={[styles.input, { backgroundColor: Colors.neutral[100], color: Colors.neutral[700] }]}>
                  {editingBreedingRecord?.earTagNumber || ''}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Heat Detection Date *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEditBreedingHeatDatePicker(true)}
                >
                  <Text>{editingBreedingRecord?.heatDetectionDate || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showEditBreedingHeatDatePicker,
                  editingBreedingRecord?.heatDetectionDate,
                  () => setShowEditBreedingHeatDatePicker(false),
                  (formattedDate) => editingBreedingRecord && setEditingBreedingRecord({...editingBreedingRecord, heatDetectionDate: formattedDate})
                )}
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Serviced Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEditBreedingServicedDatePicker(true)}
                >
                  <Text>{editingBreedingRecord?.servicedDate || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showEditBreedingServicedDatePicker,
                  editingBreedingRecord?.servicedDate,
                  () => setShowEditBreedingServicedDatePicker(false),
                  (formattedDate) => editingBreedingRecord && setEditingBreedingRecord({...editingBreedingRecord, servicedDate: formattedDate})
                )}
              </View>

              <Picker
                label="Breeding Status"
                value={editingBreedingRecord?.breedingStatus || 'Open'}
                onValueChange={(value) => editingBreedingRecord && setEditingBreedingRecord({...editingBreedingRecord, breedingStatus: value as any})}
                items={[
                  { label: 'Bred', value: 'Bred' },
                  { label: 'Confirmed Pregnant', value: 'Confirmed Pregnant' },
                  { label: 'Open', value: 'Open' },
                  { label: 'Failed', value: 'Failed' },
                ]}
              />

              <Picker
                label="Breeding Method"
                value={editingBreedingRecord?.breedingMethod || ''}
                onValueChange={(value) => editingBreedingRecord && setEditingBreedingRecord({...editingBreedingRecord, breedingMethod: value as any})}
                items={[
                  { label: 'Select Method', value: '' },
                  { label: 'AI', value: 'AI' },
                  { label: 'Natural', value: 'Natural' },
                  { label: 'Embryo Transfer', value: 'Embryo Transfer' },
                ]}
              />

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Sire / Straw ID</Text>
                <TextInput
                  style={styles.input}
                  value={editingBreedingRecord?.sireId || ''}
                  onChangeText={(text) => editingBreedingRecord && setEditingBreedingRecord({...editingBreedingRecord, sireId: text || undefined})}
                  placeholder="e.g. S-ANG-1234"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button variant="outline" onPress={() => { setIsEditBreedingRecordModalVisible(false); setEditingBreedingRecord(null); }} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button onPress={handleSaveBreedingRecord} disabled={isSubmitting || !editingBreedingRecord?.heatDetectionDate}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEditPregnancyRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditPregnancyRecordModalVisible}
      onRequestClose={() => setIsEditPregnancyRecordModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Edit Pregnancy Record</Text>
            <ScrollView 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Cow Tag</Text>
                <Text variant="body" weight="medium" style={[styles.input, { backgroundColor: Colors.neutral[100], color: Colors.neutral[700] }]}>
                  {editingPregnancyRecord?.cowEarTag || ''}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Last Service Date *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEditPregnancyLastServiceDatePicker(true)}
                >
                  <Text>{editingPregnancyRecord?.lastServiceDate || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showEditPregnancyLastServiceDatePicker,
                  editingPregnancyRecord?.lastServiceDate,
                  () => setShowEditPregnancyLastServiceDatePicker(false),
                  (formattedDate) => {
                    if (editingPregnancyRecord) {
                      const updated = { ...editingPregnancyRecord, lastServiceDate: formattedDate };
                      if (updated.gestationPeriod > 0) {
                        const serviceDate = new Date(formattedDate);
                        const expectedDate = new Date(serviceDate);
                        expectedDate.setDate(serviceDate.getDate() + updated.gestationPeriod);
                        updated.expectedCalvingDate = expectedDate.toISOString().split('T')[0];
                      }
                      setEditingPregnancyRecord(updated);
                    }
                  }
                )}
              </View>

              <Picker
                label="1st Trimester PD"
                value={editingPregnancyRecord?.firstTrimesterPD || 'Not Tested'}
                onValueChange={(value) => editingPregnancyRecord && setEditingPregnancyRecord({...editingPregnancyRecord, firstTrimesterPD: value as any})}
                items={[
                  { label: 'Not Tested', value: 'Not Tested' },
                  { label: 'Positive', value: 'Positive' },
                  { label: 'Negative', value: 'Negative' },
                  { label: 'Inconclusive', value: 'Inconclusive' },
                ]}
              />

              <Picker
                label="2nd Trimester PD"
                value={editingPregnancyRecord?.secondTrimesterPD || 'Not Tested'}
                onValueChange={(value) => editingPregnancyRecord && setEditingPregnancyRecord({...editingPregnancyRecord, secondTrimesterPD: value as any})}
                items={[
                  { label: 'Not Tested', value: 'Not Tested' },
                  { label: 'Positive', value: 'Positive' },
                  { label: 'Negative', value: 'Negative' },
                  { label: 'Inconclusive', value: 'Inconclusive' },
                ]}
              />

              <Picker
                label="3rd Trimester PD"
                value={editingPregnancyRecord?.thirdTrimesterPD || 'Not Tested'}
                onValueChange={(value) => editingPregnancyRecord && setEditingPregnancyRecord({...editingPregnancyRecord, thirdTrimesterPD: value as any})}
                items={[
                  { label: 'Not Tested', value: 'Not Tested' },
                  { label: 'Positive', value: 'Positive' },
                  { label: 'Negative', value: 'Negative' },
                  { label: 'Inconclusive', value: 'Inconclusive' },
                ]}
              />

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Gestation Period (days)</Text>
                <TextInput
                  style={styles.input}
                  value={editingPregnancyRecord?.gestationPeriod?.toString() || '0'}
                  onChangeText={(text) => {
                    if (editingPregnancyRecord) {
                      const num = parseInt(text) || 0;
                      const updated = { ...editingPregnancyRecord, gestationPeriod: num };
                      if (num > 0 && updated.lastServiceDate && !isNaN(Date.parse(updated.lastServiceDate))) {
                        const serviceDate = new Date(updated.lastServiceDate);
                        const expectedDate = new Date(serviceDate);
                        expectedDate.setDate(serviceDate.getDate() + num);
                        updated.expectedCalvingDate = expectedDate.toISOString().split('T')[0];
                      }
                      setEditingPregnancyRecord(updated);
                    }
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Expected Calving Date *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEditPregnancyExpectedCalvingDatePicker(true)}
                >
                  <Text>{editingPregnancyRecord?.expectedCalvingDate || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showEditPregnancyExpectedCalvingDatePicker,
                  editingPregnancyRecord?.expectedCalvingDate,
                  () => setShowEditPregnancyExpectedCalvingDatePicker(false),
                  (formattedDate) => editingPregnancyRecord && setEditingPregnancyRecord({ ...editingPregnancyRecord, expectedCalvingDate: formattedDate })
                )}
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Actual Calving Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEditPregnancyActualCalvingDatePicker(true)}
                >
                  <Text>{editingPregnancyRecord?.actualCalvingDate || 'Select date (Optional)'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showEditPregnancyActualCalvingDatePicker,
                  editingPregnancyRecord?.actualCalvingDate,
                  () => setShowEditPregnancyActualCalvingDatePicker(false),
                  (formattedDate) => editingPregnancyRecord && setEditingPregnancyRecord({ ...editingPregnancyRecord, actualCalvingDate: formattedDate })
                )}
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Calf ID</Text>
                <TextInput
                  style={styles.input}
                  value={editingPregnancyRecord?.calfId || ''}
                  onChangeText={(text) => editingPregnancyRecord && setEditingPregnancyRecord({ ...editingPregnancyRecord, calfId: text })}
                  placeholder="Enter calf ID (Optional)"
                />
              </View>

              <View style={styles.formGroup}>
                <Picker
                  label="Calf Sex"
                  value={editingPregnancyRecord?.calfSex || ''}
                  onValueChange={(value) => editingPregnancyRecord && setEditingPregnancyRecord({ ...editingPregnancyRecord, calfSex: value ? value as any : undefined })}
                  items={[
                    { label: 'Select sex...', value: '' },
                    { label: 'Male', value: 'Male' },
                    { label: 'Female', value: 'Female' }
                  ]}
                />
              </View>

              <View style={styles.formGroup}>
                <Picker
                  label="Delivery Type"
                  value={editingPregnancyRecord?.deliveryType || ''}
                  onValueChange={(value) => editingPregnancyRecord && setEditingPregnancyRecord({ ...editingPregnancyRecord, deliveryType: value ? value as any : undefined })}
                  items={[
                    { label: 'Select delivery type...', value: '' },
                    { label: 'Natural', value: 'Natural' },
                    { label: 'Assisted', value: 'Assisted' },
                    { label: 'C-Section', value: 'C-Section' }
                  ]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Average BCS</Text>
                <TextInput
                  style={styles.input}
                  value={editingPregnancyRecord?.averageBCS !== undefined && editingPregnancyRecord?.averageBCS !== null ? editingPregnancyRecord.averageBCS.toString() : '3.0'}
                  onChangeText={(text) => {
                    if (editingPregnancyRecord) {
                      const score = parseFloat(text) || 0;
                      setEditingPregnancyRecord({ ...editingPregnancyRecord, averageBCS: score });
                    }
                  }}
                  placeholder="e.g. 3.0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Expected Return to Heat Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEditPregnancyExpectedReturnToHeatDatePicker(true)}
                >
                  <Text>{editingPregnancyRecord?.expectedReturnToHeatDate || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showEditPregnancyExpectedReturnToHeatDatePicker,
                  editingPregnancyRecord?.expectedReturnToHeatDate,
                  () => setShowEditPregnancyExpectedReturnToHeatDatePicker(false),
                  (formattedDate) => editingPregnancyRecord && setEditingPregnancyRecord({
                    ...editingPregnancyRecord,
                    expectedReturnToHeatDate: formattedDate
                  })
                )}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button variant="outline" onPress={() => { setIsEditPregnancyRecordModalVisible(false); setEditingPregnancyRecord(null); }} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button onPress={handleSavePregnancyRecord} disabled={isSubmitting || !editingPregnancyRecord?.lastServiceDate || !editingPregnancyRecord?.expectedCalvingDate}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEditWeightRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditWeightRecordModalVisible}
      onRequestClose={() => setIsEditWeightRecordModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Edit Weight Record</Text>
            <ScrollView 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Animal ID / Tag</Text>
                <Text variant="body" weight="medium" style={[styles.input, { backgroundColor: Colors.neutral[100], color: Colors.neutral[700] }]}>
                  {editingWeightRecord?.id || ''}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Year *</Text>
                <TextInput
                  style={styles.input}
                  value={editingWeightRecord?.year?.toString() || ''}
                  onChangeText={(text) => editingWeightRecord && setEditingWeightRecord({...editingWeightRecord, year: text})}
                  keyboardType="numeric"
                  placeholder="e.g. 2026"
                />
              </View>

              {['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map((month) => (
                <View key={month} style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>{month.toUpperCase()} Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={editingWeightRecord?.[month] || ''}
                    onChangeText={(text) => editingWeightRecord && setEditingWeightRecord({...editingWeightRecord, [month]: text})}
                    keyboardType="numeric"
                    placeholder="Enter weight"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button variant="outline" onPress={() => { setIsEditWeightRecordModalVisible(false); setEditingWeightRecord(null); }} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button onPress={handleSaveWeightRecord} disabled={isSubmitting || !editingWeightRecord?.year}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEditDrugModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditDrugModalVisible}
      onRequestClose={() => setIsEditDrugModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Edit Drug Details</Text>
            <ScrollView 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Drug Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editingDrug?.name || ''}
                  onChangeText={(text) => editingDrug && setEditingDrug({...editingDrug, name: text})}
                  placeholder="e.g. Tylosin"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Drug Class *</Text>
                <TextInput
                  style={styles.input}
                  value={editingDrug?.drugClass || ''}
                  onChangeText={(text) => editingDrug && setEditingDrug({...editingDrug, drugClass: text})}
                  placeholder="e.g. Antibiotic"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Type *</Text>
                <TextInput
                  style={styles.input}
                  value={editingDrug?.type || ''}
                  onChangeText={(text) => editingDrug && setEditingDrug({...editingDrug, type: text})}
                  placeholder="e.g. Injectable"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Withdrawal Period *</Text>
                <TextInput
                  style={styles.input}
                  value={editingDrug?.withdrawalPeriod || ''}
                  onChangeText={(text) => editingDrug && setEditingDrug({...editingDrug, withdrawalPeriod: text})}
                  placeholder="e.g. 14 days"
                />
              </View>

              <Picker
                label="Pregnancy Safe"
                value={editingDrug?.pregnancySafe || 'Yes'}
                onValueChange={(value) => editingDrug && setEditingDrug({...editingDrug, pregnancySafe: value as any})}
                items={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' },
                ]}
              />

              <Picker
                label="Stock Status"
                value={editingDrug?.stockStatus || 'In Stock'}
                onValueChange={(value) => editingDrug && setEditingDrug({...editingDrug, stockStatus: value as any})}
                items={[
                  { label: 'In Stock', value: 'In Stock' },
                  { label: 'Low Stock', value: 'Low Stock' },
                  { label: 'Out of Stock', value: 'Out of Stock' },
                ]}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button variant="outline" onPress={() => { setIsEditDrugModalVisible(false); setEditingDrug(null); }} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button onPress={handleSaveDrug} disabled={isSubmitting || !editingDrug?.name || !editingDrug?.drugClass}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEditMortalityRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditMortalityRecordModalVisible}
      onRequestClose={() => setIsEditMortalityRecordModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Edit Cull/Mortality Record</Text>
            <ScrollView 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Animal ID / Tag</Text>
                <Text variant="body" weight="medium" style={[styles.input, { backgroundColor: Colors.neutral[100], color: Colors.neutral[700] }]}>
                  {editingMortalityRecord?.animalId || ''}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEditMortalityDatePicker(true)}
                >
                  <Text>{editingMortalityRecord?.date || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showEditMortalityDatePicker,
                  editingMortalityRecord?.date,
                  () => setShowEditMortalityDatePicker(false),
                  (formattedDate) => editingMortalityRecord && setEditingMortalityRecord({...editingMortalityRecord, date: formattedDate})
                )}
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Cause *</Text>
                <TextInput
                  style={styles.input}
                  value={editingMortalityRecord?.cause || ''}
                  onChangeText={(text) => editingMortalityRecord && setEditingMortalityRecord({...editingMortalityRecord, cause: text})}
                  placeholder="e.g. Disease, Sold, Accident"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={editingMortalityRecord?.description || ''}
                  onChangeText={(text) => editingMortalityRecord && setEditingMortalityRecord({...editingMortalityRecord, description: text})}
                  placeholder="Provide details..."
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Observer</Text>
                <TextInput
                  style={styles.input}
                  value={editingMortalityRecord?.observer || ''}
                  onChangeText={(text) => editingMortalityRecord && setEditingMortalityRecord({...editingMortalityRecord, observer: text})}
                  placeholder="e.g., John Doe"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Pre-Weaning</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={[styles.radioButton, editingMortalityRecord?.isPreWeaning && styles.radioButtonSelected]}
                    onPress={() => editingMortalityRecord && setEditingMortalityRecord({...editingMortalityRecord, isPreWeaning: true})}
                  >
                    <Text>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.radioButton, !editingMortalityRecord?.isPreWeaning && styles.radioButtonSelected]}
                    onPress={() => editingMortalityRecord && setEditingMortalityRecord({...editingMortalityRecord, isPreWeaning: false})}
                  >
                    <Text>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button variant="outline" onPress={() => { setIsEditMortalityRecordModalVisible(false); setEditingMortalityRecord(null); }} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button onPress={handleSaveMortalityRecord} disabled={isSubmitting || !editingMortalityRecord?.date || !editingMortalityRecord?.cause}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEditTransactionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditTransactionModalVisible}
      onRequestClose={() => setIsEditTransactionModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Edit Financial Entry</Text>
            <ScrollView 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEditTransactionDatePicker(true)}
                >
                  <Text>{editingTransaction?.date || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showEditTransactionDatePicker,
                  editingTransaction?.date,
                  () => setShowEditTransactionDatePicker(false),
                  (formattedDate) => editingTransaction && setEditingTransaction({...editingTransaction, date: formattedDate})
                )}
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Description *</Text>
                <TextInput
                  style={styles.input}
                  value={editingTransaction?.description || ''}
                  onChangeText={(text) => editingTransaction && setEditingTransaction({...editingTransaction, description: text})}
                  placeholder="e.g. Sold 3 weaners"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Amount *</Text>
                <TextInput
                  style={styles.input}
                  value={editingTransaction?.amount?.toString() || ''}
                  onChangeText={(text) => editingTransaction && setEditingTransaction({...editingTransaction, amount: text})}
                  keyboardType="numeric"
                  placeholder="e.g. 1500"
                />
              </View>

              <Picker
                label="Type"
                value={editingTransaction?.type || 'Sale'}
                onValueChange={(value) => editingTransaction && setEditingTransaction({...editingTransaction, type: value as any})}
                items={[
                  { label: 'Sale', value: 'Sale' },
                  { label: 'Purchase', value: 'Purchase' },
                ]}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button variant="outline" onPress={() => { setIsEditTransactionModalVisible(false); setEditingTransaction(null); }} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button onPress={handleSaveTransaction} disabled={isSubmitting || !editingTransaction?.date || !editingTransaction?.description || !editingTransaction?.amount}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEditFeedModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditFeedModalVisible}
      onRequestClose={() => setIsEditFeedModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Edit Feed Inventory Item</Text>
            <ScrollView 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Feed Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editingFeedItem?.name || ''}
                  onChangeText={(text) => editingFeedItem && setEditingFeedItem({...editingFeedItem, name: text})}
                  placeholder="e.g. Lucerne"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Type *</Text>
                <TextInput
                  style={styles.input}
                  value={editingFeedItem?.type || ''}
                  onChangeText={(text) => editingFeedItem && setEditingFeedItem({...editingFeedItem, type: text})}
                  placeholder="e.g. Roughage, Concentrate"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={editingFeedItem?.quantity || ''}
                  onChangeText={(text) => editingFeedItem && setEditingFeedItem({...editingFeedItem, quantity: text})}
                  placeholder="e.g. 50"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Unit *</Text>
                <TextInput
                  style={styles.input}
                  value={editingFeedItem?.unit || ''}
                  onChangeText={(text) => editingFeedItem && setEditingFeedItem({...editingFeedItem, unit: text})}
                  placeholder="e.g. bags, kg, tonnes"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Supplier</Text>
                <TextInput
                  style={styles.input}
                  value={editingFeedItem?.supplier || ''}
                  onChangeText={(text) => editingFeedItem && setEditingFeedItem({...editingFeedItem, supplier: text})}
                  placeholder="Supplier name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Last Updated Date *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEditFeedLastUpdatedDatePicker(true)}
                >
                  <Text>{editingFeedItem?.lastUpdated || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showEditFeedLastUpdatedDatePicker,
                  editingFeedItem?.lastUpdated,
                  () => setShowEditFeedLastUpdatedDatePicker(false),
                  (formattedDate) => editingFeedItem && setEditingFeedItem({...editingFeedItem, lastUpdated: formattedDate})
                )}
              </View>

              <Picker
                label="Status"
                value={editingFeedItem?.status || 'In Stock'}
                onValueChange={(value) => editingFeedItem && setEditingFeedItem({...editingFeedItem, status: value as any})}
                items={[
                  { label: 'In Stock', value: 'In Stock' },
                  { label: 'Low Stock', value: 'Low Stock' },
                  { label: 'Out of Stock', value: 'Out of Stock' },
                ]}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button variant="outline" onPress={() => { setIsEditFeedModalVisible(false); setEditingFeedItem(null); }} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button onPress={handleSaveFeedItem} disabled={isSubmitting || !editingFeedItem?.name || !editingFeedItem?.quantity || !editingFeedItem?.unit}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEditCalfModal = () => (
    <Modal
      visible={isEditCalfModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsEditCalfModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h6" style={styles.modalTitle}>
                {editingCalf ? `Edit Calf ${editingCalf.tag}` : 'Edit Calf Details'}
              </Text>
              <TouchableOpacity onPress={() => setIsEditCalfModalVisible(false)}>
                <Text>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="none"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Calf ID</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={editingCalf?.tag || ''}
                  editable={false}
                  placeholder="Calf ID"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Birth Date</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={editingCalf?.dateOfBirth || ''}
                  editable={false}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Breed</Text>
                <View style={[styles.input, styles.disabledInput]} pointerEvents="none">
                  <Text>{editingCalf?.breed || '-'}</Text>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Sex</Text>
                <View style={[styles.radioGroup, { opacity: 0.6 }]} pointerEvents="none">
                  {['Male', 'Female'].map((sex) => (
                    <View
                      key={sex}
                      style={[
                        styles.radioButton,
                        editingCalf?.sex === sex && styles.radioButtonSelected
                      ]}
                    >
                      <Text>{sex}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Source</Text>
                <View style={[styles.input, styles.disabledInput]} pointerEvents="none">
                  <Text>{editingCalf?.source || '-'}</Text>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Observer *</Text>
                <TextInput
                  style={styles.input}
                  value={editingCalf?.observer || ''}
                  onChangeText={(text) => editingCalf && setEditingCalf({...editingCalf, observer: text})}
                  placeholder="Observer's name"
                  autoFocus={true}
                />
              </View>
              
              {/* Sire ID */}
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Sire ID</Text>
                <TextInput
                  style={styles.input}
                  value={editingCalf?.sire || ''}
                  onChangeText={(text) => editingCalf && setEditingCalf({...editingCalf, sire: text})}
                  placeholder="Sire ID / Tag"
                />
              </View>

              {/* Dam ID */}
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Dam ID</Text>
                <TextInput
                  style={styles.input}
                  value={editingCalf?.dam || ''}
                  onChangeText={(text) => editingCalf && setEditingCalf({...editingCalf, dam: text})}
                  placeholder="Dam ID / Tag"
                />
              </View>

              {/* Birth Weight */}
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Birth Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editingCalf?.birthWeight || ''}
                  onChangeText={(text) => editingCalf && setEditingCalf({...editingCalf, birthWeight: text})}
                  placeholder="e.g. 35.5"
                  keyboardType="numeric"
                />
              </View>

              {/* 30-Day Weight */}
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>30-Day Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editingCalf?.weight30day != null ? String(editingCalf.weight30day) : ''}
                  onChangeText={(text) => editingCalf && setEditingCalf({...editingCalf, weight30day: text as any})}
                  placeholder="e.g. 55"
                  keyboardType="numeric"
                />
              </View>

              {/* 100-Day Weight */}
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>100-Day Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editingCalf?.weight100day != null ? String(editingCalf.weight100day) : ''}
                  onChangeText={(text) => editingCalf && setEditingCalf({...editingCalf, weight100day: text as any})}
                  placeholder="e.g. 110"
                  keyboardType="numeric"
                />
              </View>

              {/* Date of Weaning */}
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date of Weaning</Text>
                <TouchableOpacity 
                  style={styles.input}
                  onPress={() => setShowEditCalfWeaningDatePicker(true)}
                >
                  <Text style={editingCalf?.dateOfWeaning ? {} : {color: '#999'}}>
                    {editingCalf?.dateOfWeaning || 'Select weaning date'}
                  </Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showEditCalfWeaningDatePicker,
                  editingCalf?.dateOfWeaning,
                  () => setShowEditCalfWeaningDatePicker(false),
                  (formattedDate) => editingCalf && setEditingCalf({ ...editingCalf, dateOfWeaning: formattedDate })
                )}
              </View>

              {/* Weaning Weight */}
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Weaning Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editingCalf?.weaningWeight != null ? String(editingCalf.weaningWeight) : ''}
                  onChangeText={(text) => editingCalf && setEditingCalf({...editingCalf, weaningWeight: text})}
                  placeholder="e.g. 180"
                  keyboardType="numeric"
                />
              </View>

              {/* 1-Week Post Weaning Weight */}
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>1-Week Post Weaning Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editingCalf?.weight1weekPostWeaning != null ? String(editingCalf.weight1weekPostWeaning) : ''}
                  onChangeText={(text) => editingCalf && setEditingCalf({...editingCalf, weight1weekPostWeaning: text as any})}
                  placeholder="e.g. 185"
                  keyboardType="numeric"
                />
              </View>

              {/* 6-Months Post Weaning Weight */}
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>6-Months Post Weaning Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editingCalf?.weight6monthsPostWeaning != null ? String(editingCalf.weight6monthsPostWeaning) : ''}
                  onChangeText={(text) => editingCalf && setEditingCalf({...editingCalf, weight6monthsPostWeaning: text as any})}
                  placeholder="e.g. 240"
                  keyboardType="numeric"
                />
              </View>

              {/* Replacement / Sold Status */}
              <Picker
                label="Replacement / Sold Status"
                value={editingCalf?.calfStatus || ''}
                onValueChange={(val) => editingCalf && setEditingCalf({...editingCalf, calfStatus: val as any})}
                items={[
                  { label: 'Active', value: 'Active' },
                  { label: 'Replacement', value: 'Replacement' },
                  { label: 'Sold', value: 'Sold' },
                ]}
              />

              {/* Pre-weaning Mortality */}
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Pre-Weaning Mortality</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={[styles.radioButton, editingCalf?.preWeaningMortality === true && styles.radioButtonSelected]}
                    onPress={() => editingCalf && setEditingCalf({...editingCalf, preWeaningMortality: true})}
                  >
                    <Text>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.radioButton, editingCalf?.preWeaningMortality !== true && styles.radioButtonSelected]}
                    onPress={() => editingCalf && setEditingCalf({...editingCalf, preWeaningMortality: false})}
                  >
                    <Text>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Delivery Type</Text>
                <View style={[styles.radioGroup, { opacity: 0.6 }]} pointerEvents="none">
                  {['Natural', 'Assisted', 'C-Section'].map((type) => (
                    <View
                      key={type}
                      style={[
                        styles.radioButton,
                        editingCalf?.deliveryType === type && styles.radioButtonSelected
                      ]}
                    >
                      <Text>{type}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button 
                variant="outline" 
                onPress={() => setIsEditCalfModalVisible(false)}
                style={{ marginRight: 8 }}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleSaveCalf}
                disabled={!editingCalf?.tag}
              >
                Save Changes
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );


  const renderAddHealthRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddHealthRecordModalVisible}
      onRequestClose={() => setIsAddHealthRecordModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Health Record</Text>
            
            <ScrollView 
              style={{ flexShrink: 1 }} 
              contentContainerStyle={{ flexGrow: 1 }} 
              keyboardShouldPersistTaps="always" 
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="none"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Apply To</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={[styles.radioButton, !applyToAll && styles.radioButtonSelected]}
                    onPress={() => setApplyToAll(false)}
                  >
                    <Text>Specific Animals</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.radioButton, applyToAll && styles.radioButtonSelected]}
                    onPress={() => setApplyToAll(true)}
                  >
                    <Text>All Herd</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {applyToAll ? (
                <View style={[styles.formGroup, { padding: 12, backgroundColor: Colors.neutral[50], borderRadius: 4, borderWidth: 1, borderColor: Colors.neutral[200] }]}>
                  <Text variant="body2" style={{ color: Colors.neutral[700] }}>
                    📢 Record will be applied to all <Text weight="bold">{herdRegisterData.length} animals</Text> in the herd register.
                  </Text>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Search Animal Tag</Text>
                  <TextInput
                    style={styles.input}
                    value={animalSearchQuery}
                    onChangeText={setAnimalSearchQuery}
                    placeholder="Type to filter by Tag, Breed, or Stock Type..."
                  />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 6 }}>
                    <Text variant="caption" style={{ color: Colors.neutral[600] }}>
                      Selected: {selectedAnimalTags.length} animal(s)
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity onPress={() => setSelectedAnimalTags(herdRegisterData.map(a => a.tag))}>
                        <Text variant="caption" style={{ color: Colors.primary[500], fontWeight: '600' }}>Select All</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setSelectedAnimalTags([])}>
                        <Text variant="caption" style={{ color: Colors.error[500], fontWeight: '600' }}>Clear All</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <ScrollView 
                    style={{ 
                      maxHeight: 150, 
                      borderWidth: 1, 
                      borderColor: Colors.neutral[300], 
                      borderRadius: 4, 
                      backgroundColor: Colors.neutral[50] 
                    }}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                  >
                    {herdRegisterData
                      .filter(a => a.tag.toLowerCase().includes(animalSearchQuery.toLowerCase()) || 
                                   (a.breed && a.breed.toLowerCase().includes(animalSearchQuery.toLowerCase())) || 
                                   (a.stockType && a.stockType.toLowerCase().includes(animalSearchQuery.toLowerCase())))
                      .map((animal) => {
                        const isSelected = selectedAnimalTags.includes(animal.tag);
                        return (
                          <TouchableOpacity
                            key={animal.tag}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: Colors.neutral[200],
                              backgroundColor: isSelected ? Colors.primary[50] : Colors.white
                            }}
                            onPress={() => {
                              if (isSelected) {
                                setSelectedAnimalTags(selectedAnimalTags.filter(t => t !== animal.tag));
                              } else {
                                setSelectedAnimalTags([...selectedAnimalTags, animal.tag]);
                              }
                            }}
                          >
                            <View style={{ marginRight: 8 }}>
                              {isSelected ? (
                                <CheckSquare size={18} color={Colors.primary[500]} />
                              ) : (
                                <Square size={18} color={Colors.neutral[400]} />
                              )}
                            </View>
                            <Text variant="body2" style={{ flex: 1, color: Colors.neutral[800] }}>
                              {animal.tag} <Text variant="caption" style={{ color: Colors.neutral[500] }}>({animal.breed || 'Unknown'} - {animal.stockType})</Text>
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                </View>
              )}
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowAddHealthDatePicker(true)}
                >
                  <Text>{newHealthRecord.date || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showAddHealthDatePicker,
                  newHealthRecord.date,
                  () => setShowAddHealthDatePicker(false),
                  (formattedDate) => setNewHealthRecord({...newHealthRecord, date: formattedDate}),
                  "Treatment Date"
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Treatment</Text>
                <TextInput
                  style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={newHealthRecord.treatment}
                  onChangeText={(text) => setNewHealthRecord({...newHealthRecord, treatment: text})}
                  placeholder="Enter treatment details"
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Done By (person who did the task)</Text>
                <TextInput
                  style={styles.input}
                  value={newHealthRecord.doneBy || ''}
                  onChangeText={(text) => setNewHealthRecord({...newHealthRecord, doneBy: text})}
                  placeholder="e.g. John Doe"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Special Notes</Text>
                <TextInput
                  style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={newHealthRecord.specialNotes || ''}
                  onChangeText={(text) => setNewHealthRecord({...newHealthRecord, specialNotes: text})}
                  placeholder="Enter special notes"
                  multiline
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Status</Text>
                <View style={{ flexDirection: 'row', marginTop: 4 }}>
                  {['Pending', 'Scheduled', 'Completed'].map((status) => (
                    <TouchableOpacity 
                      key={status}
                      style={[
                        styles.radioButton, 
                        newHealthRecord.status === status && styles.radioButtonSelected,
                        { marginRight: 8 }
                      ]}
                      onPress={() => setNewHealthRecord({...newHealthRecord, status: status as AnimalHealthRecord['status']})}
                    >
                      <Text>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                variant="outline" 
                onPress={() => setIsAddHealthRecordModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleAddHealthRecord}
                disabled={(!applyToAll && selectedAnimalTags.length === 0) || !newHealthRecord.treatment}
              >
                Add Record
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderAddFeedModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddFeedModalVisible}
      onRequestClose={() => setIsAddFeedModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Feed to Inventory</Text>
            
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="none"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Feed Name</Text>
                <TextInput
                  style={styles.input}
                  value={newFeed.name}
                  onChangeText={(text) => setNewFeed({...newFeed, name: text})}
                  placeholder="e.g., Dairy Meal 18%"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Feed Type</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                  {['Cattle Feed', 'Poultry Feed', 'Small Ruminant', 'Pig Feed', 'Other'].map((type) => (
                    <TouchableOpacity 
                      key={type}
                      style={[
                        styles.radioButton, 
                        newFeed.type === type && styles.radioButtonSelected,
                        { marginRight: 8, marginBottom: 8 }
                      ]}
                      onPress={() => setNewFeed({...newFeed, type})}
                    >
                      <Text>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={[styles.formGroup, { flex: 2, marginRight: 16 }]}>
                  <Text variant="body2" style={styles.label}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={newFeed.quantity}
                    onChangeText={(text) => setNewFeed({...newFeed, quantity: text.replace(/[^0-9]/g, '')})}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text variant="body2" style={styles.label}>Unit</Text>
                  <View style={[styles.input, { paddingHorizontal: 8, justifyContent: 'center' }]}>
                    <Text>{newFeed.unit}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Supplier</Text>
                <TextInput
                  style={styles.input}
                  value={newFeed.supplier}
                  onChangeText={(text) => setNewFeed({...newFeed, supplier: text})}
                  placeholder="e.g., AgroFeeds Ltd"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Status</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                  {['In Stock', 'Low Stock', 'Out of Stock'].map((status) => (
                    <TouchableOpacity 
                      key={status}
                      style={[
                        styles.radioButton, 
                        newFeed.status === status && styles.radioButtonSelected,
                        { 
                          marginRight: 8, 
                          marginBottom: 8,
                          borderColor: 
                          status === 'In Stock' ? Colors.success[400] :
                          status === 'Low Stock' ? Colors.warning[400] :
                          Colors.error[400]
                        }
                      ]}
                      onPress={() => setNewFeed({...newFeed, status})}
                    >
                      <Text>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                variant="outline" 
                onPress={() => setIsAddFeedModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleAddFeed}
                disabled={!newFeed.name || !newFeed.quantity || !newFeed.supplier}
              >
                Add Feed
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderAddWeightRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddWeightRecordModalVisible}
      onRequestClose={() => setIsAddWeightRecordModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Weight Record</Text>
            
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="none"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Search Animal</Text>
                <TextInput
                  style={styles.input}
                  value={weightAnimalSearchQuery}
                  onChangeText={setWeightAnimalSearchQuery}
                  placeholder="Filter by Tag, Breed, or Stock Type..."
                />
              </View>

              <View style={styles.formGroup}>
                <Picker
                  label="Select Animal*"
                  value={newWeightRecord.tag}
                  onValueChange={(value) => {
                    const selectedAnimal = herdRegisterData.find(animal => animal.tag === value);
                    if (selectedAnimal) {
                      setNewWeightRecord({
                        ...newWeightRecord,
                        tag: value,
                        stockType: selectedAnimal.stockType,
                        age: selectedAnimal.age
                      });
                    } else {
                      setNewWeightRecord({
                        ...newWeightRecord,
                        tag: value,
                        stockType: '',
                        age: ''
                      });
                    }
                  }}
                  items={[
                    { label: 'Select an animal...', value: '' },
                    ...herdRegisterData
                      .filter(animal => {
                        const q = weightAnimalSearchQuery.toLowerCase();
                        return (
                          animal.tag.toLowerCase().includes(q) ||
                          (animal.breed && animal.breed.toLowerCase().includes(q)) ||
                          (animal.stockType && animal.stockType.toLowerCase().includes(q))
                        );
                      })
                      .map(animal => ({
                        label: `${animal.tag} (${animal.breed} - ${animal.stockType})`,
                        value: animal.tag
                      }))
                  ]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Stock Type</Text>
                <TextInput
                  style={styles.input}
                  value={newWeightRecord.stockType}
                  editable={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={newWeightRecord.age}
                  editable={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Monthly Weights (kg)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map((month) => (
                    <View key={month} style={{ width: '30%', marginBottom: 12 }}>
                      <Text variant="caption" style={[styles.label, { textTransform: 'capitalize' }]}>{month}</Text>
                      <TextInput
                        style={[styles.input, { textAlign: 'center' }]}
                        value={newWeightRecord[month as keyof typeof newWeightRecord]}
                        onChangeText={(text) => setNewWeightRecord({
                          ...newWeightRecord, 
                          [month]: text.replace(/[^0-9]/g, '') // Only allow numbers
                        })}
                        placeholder="0"
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                variant="outline" 
                onPress={() => {
                  setIsAddWeightRecordModalVisible(false);
                  setWeightAnimalSearchQuery('');
                }}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleAddWeightRecord}
                disabled={isSubmitting || !newWeightRecord.tag}
              >
                {isSubmitting ? 'Adding...' : 'Add Record'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderAddTransactionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddTransactionModalVisible}
      onRequestClose={() => setIsAddTransactionModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Sales/Purchase Record</Text>
            
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="none"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setTransactionDatePickerVisibility(true)}
                >
                  <Text>{newTransaction.date || 'Select date'}</Text>
                </TouchableOpacity>

                {renderAdaptiveDatePicker(
                  isTransactionDatePickerVisible,
                  newTransaction.date,
                  () => setTransactionDatePickerVisibility(false),
                  (formattedDate) => setNewTransaction({ ...newTransaction, date: formattedDate }),
                  "Transaction Date"
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Transaction Type</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                  {(['Sale', 'Purchase'] as const).map((type) => (
                    <TouchableOpacity 
                      key={type}
                      style={[
                        styles.radioButton, 
                        newTransaction.type === type && styles.radioButtonSelected,
                        { marginRight: 8, marginBottom: 8 }
                      ]}
                      onPress={() => setNewTransaction({...newTransaction, type})}
                    >
                      <Text>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {newTransaction.type === 'Sale' ? (
                <View style={styles.formGroup}>
                  <Picker
                    label="Select Animal (Optional)"
                    value={newTransaction.animalTag}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, animalTag: value })}
                    items={[
                      { label: 'Select an animal...', value: '' },
                      ...herdRegisterData.map(animal => ({
                        label: `${animal.tag} (${animal.breed})`,
                        value: animal.tag
                      }))
                    ]}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Tag</Text>
                    <TextInput
                      style={styles.input}
                      value={newTransaction.purchaseDetails.tag}
                      onChangeText={(text) => setNewTransaction({ ...newTransaction, purchaseDetails: { ...newTransaction.purchaseDetails, tag: text } })}
                      placeholder="Enter new tag number"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Date of Birth</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setPurchaseDobPickerVisible(true)}
                    >
                      <Text>{newTransaction.purchaseDetails.dateOfBirth || 'Select date'}</Text>
                    </TouchableOpacity>

                    {renderAdaptiveDatePicker(
                      isPurchaseDobPickerVisible,
                      newTransaction.purchaseDetails.dateOfBirth,
                      () => setPurchaseDobPickerVisible(false),
                      (formattedDate) => setNewTransaction({ ...newTransaction, purchaseDetails: { ...newTransaction.purchaseDetails, dateOfBirth: formattedDate } }),
                      "Date of Birth",
                      new Date()
                    )}
                  </View>
                  <Picker
                    label="Breed"
                    value={newTransaction.purchaseDetails.breed}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, purchaseDetails: { ...newTransaction.purchaseDetails, breed: value } })}
                    items={breedOptions.filter(option => option.value !== 'all')}
                  />
                  <Picker
                    label="Sex"
                    value={newTransaction.purchaseDetails.sex}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, purchaseDetails: { ...newTransaction.purchaseDetails, sex: value as 'Male' | 'Female' } })}
                    items={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }]}
                  />
                  <Picker
                    label="Stock Type"
                    value={newTransaction.purchaseDetails.stockType}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, purchaseDetails: { ...newTransaction.purchaseDetails, stockType: value } })}
                    items={[
                      { label: 'Cow', value: 'Cow' },
                      { label: 'Bull', value: 'Bull' },
                      { label: 'Heifer', value: 'Heifer' },
                      { label: 'Steer', value: 'Steer' },
                      { label: 'Calf', value: 'Calve' },
                    ]}
                  />
                </>
              )}
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 80 }, styles.textArea]}
                  value={newTransaction.description}
                  onChangeText={(text) => setNewTransaction({...newTransaction, description: text})}
                  placeholder="e.g., Sale of bull B023"
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>
                  {newTransaction.type === 'Sale' ? 'Sale Amount' : 'Purchase Amount'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ marginRight: 8 }}>$</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={newTransaction.amount}
                    onChangeText={(text) => setNewTransaction({...newTransaction, amount: text})}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                variant="outline" 
                onPress={() => setIsAddTransactionModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleAddTransaction}
                disabled={isSubmitting || !newTransaction.description || !newTransaction.amount}
              >
                {isSubmitting ? 'Adding...' : 'Add Record'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderAddBreedingRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddBreedingRecordModalVisible}
      onRequestClose={() => setIsAddBreedingRecordModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Bull Breeding Record</Text>
            
            <ScrollView 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="none"
            >
              <View style={styles.formGroup}>
                <Picker
                  label="Select Bull*"
                  value={newBullBreedingRecord.bullId}
                  onValueChange={(value) => {
                    const selectedBull = herdRegisterData.find(animal => animal.tag === value);
                    if (selectedBull) {
                      const today = new Date();
                      const birthDate = new Date(selectedBull.dateOfBirth);
                      let years = today.getFullYear() - birthDate.getFullYear();
                      let months = today.getMonth() - birthDate.getMonth();
                      if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
                        years--;
                        months += 12;
                      }
                      const ageText = years > 0 ? `${years}y ${months}m` : `${months}m`;
                      setNewBullBreedingRecord({
                        ...newBullBreedingRecord,
                        bullId: value,
                        age: ageText
                      });
                    } else {
                      setNewBullBreedingRecord({
                        ...newBullBreedingRecord,
                        bullId: value,
                        age: ''
                      });
                    }
                  }}
                  items={[
                    { label: 'Select a bull...', value: '' },
                    ...herdRegisterData
                      .filter(animal => animal.sex === 'Male' && animal.stockType === 'Bull')
                      .map(animal => ({
                        label: `${animal.tag} (${animal.breed})`,
                        value: animal.tag
                      }))
                  ]}
                />
              </View>
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    setSelectedDate(newBullBreedingRecord.date ? new Date(newBullBreedingRecord.date) : new Date());
                    setShowBreedingDatePicker(true);
                  }}
                >
                  <Text>{newBullBreedingRecord.date || 'Select date'}</Text>
                </TouchableOpacity>

                {renderAdaptiveDatePicker(
                  showBreedingDatePicker,
                  newBullBreedingRecord.date,
                  () => setShowBreedingDatePicker(false),
                  (formattedDate) => setNewBullBreedingRecord({ ...newBullBreedingRecord, date: formattedDate }),
                  "Breeding Date"
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={newBullBreedingRecord.age}
                  onChangeText={(text) => setNewBullBreedingRecord({...newBullBreedingRecord, age: text})}
                  placeholder="e.g., 2y 6m"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Physical Exam (PE)</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                  {['Excellent', 'Good', 'Poor'].map((pe) => (
                    <TouchableOpacity 
                      key={pe}
                      style={[
                        styles.radioButton, 
                        newBullBreedingRecord.pe === pe && styles.radioButtonSelected,
                        { marginRight: 8, marginBottom: 8 }
                      ]}
                      onPress={() => setNewBullBreedingRecord({...newBullBreedingRecord, pe: pe as BullBreedingRecord['pe']})}
                    >
                      <Text>{pe}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Sperm Motility (%)</Text>
                <TextInput
                  style={styles.input}
                  value={newBullBreedingRecord.spermMotility}
                  onChangeText={(text) => setNewBullBreedingRecord({...newBullBreedingRecord, spermMotility: text})}
                  placeholder="e.g., 85"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Sperm Morphology (%)</Text>
                <TextInput
                  style={styles.input}
                  value={newBullBreedingRecord.spermMorphology}
                  onChangeText={(text) => setNewBullBreedingRecord({...newBullBreedingRecord, spermMorphology: text})}
                  placeholder="e.g., 90"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Scrotal Circumference (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={newBullBreedingRecord.scrotal}
                  onChangeText={(text) => setNewBullBreedingRecord({...newBullBreedingRecord, scrotal: text})}
                  placeholder="e.g., 35.5"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Libido</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                  {['Excellent', 'Good', 'Poor'].map((libido) => (
                    <TouchableOpacity 
                      key={libido}
                      style={[
                        styles.radioButton, 
                        newBullBreedingRecord.libido === libido && styles.radioButtonSelected,
                        { marginRight: 8, marginBottom: 8 }
                      ]}
                      onPress={() => setNewBullBreedingRecord({...newBullBreedingRecord, libido: libido as BullBreedingRecord['libido']})}
                    >
                      <Text>{libido}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Score</Text>
                <TextInput
                  style={styles.input}
                  value={newBullBreedingRecord.score}
                  onChangeText={(text) => setNewBullBreedingRecord({...newBullBreedingRecord, score: text})}
                  placeholder="e.g., 85"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Classification</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                  {['SPB', 'USPB', 'CD'].map((classification) => (
                    <TouchableOpacity 
                      key={classification}
                      style={[
                        styles.radioButton, 
                        newBullBreedingRecord.classification === classification && styles.radioButtonSelected,
                        { marginRight: 8, marginBottom: 8 }
                      ]}
                      onPress={() => setNewBullBreedingRecord({...newBullBreedingRecord, classification: classification as BullBreedingRecord['classification']})}
                    >
                      <Text>{classification}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                variant="outline" 
                onPress={() => setIsAddBreedingRecordModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleAddBreedingRecord}
                disabled={isSubmitting || !newBullBreedingRecord.bullId || !newBullBreedingRecord.age || !newBullBreedingRecord.spermMotility || !newBullBreedingRecord.spermMorphology || !newBullBreedingRecord.scrotal || !newBullBreedingRecord.score}
              >
                {isSubmitting ? 'Adding...' : 'Add Record'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEditBullBreedingRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditBullBreedingRecordModalVisible}
      onRequestClose={() => { setIsEditBullBreedingRecordModalVisible(false); setEditingBullBreedingRecord(null); }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Edit Bull Breeding Record</Text>
            
            <ScrollView 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="none"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Bull ID</Text>
                <Text variant="body" weight="medium" style={[styles.input, { backgroundColor: Colors.neutral[100], color: Colors.neutral[700] }]}>
                  {editingBullBreedingRecord?.bullId || ''}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    setSelectedDate(editingBullBreedingRecord?.date ? new Date(editingBullBreedingRecord.date) : new Date());
                    setShowEditBullBreedingDatePicker(true);
                  }}
                >
                  <Text>{editingBullBreedingRecord?.date || 'Select date'}</Text>
                </TouchableOpacity>

                {renderAdaptiveDatePicker(
                  showEditBullBreedingDatePicker,
                  editingBullBreedingRecord?.date,
                  () => setShowEditBullBreedingDatePicker(false),
                  (formattedDate) => editingBullBreedingRecord && setEditingBullBreedingRecord({ ...editingBullBreedingRecord, date: formattedDate }),
                  "Breeding Date"
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={editingBullBreedingRecord?.age || ''}
                  onChangeText={(text) => editingBullBreedingRecord && setEditingBullBreedingRecord({...editingBullBreedingRecord, age: text})}
                  placeholder="e.g., 2y 6m"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Physical Exam (PE)</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                  {['Excellent', 'Good', 'Poor'].map((pe) => (
                    <TouchableOpacity 
                      key={pe}
                      style={[
                        styles.radioButton, 
                        editingBullBreedingRecord?.pe === pe && styles.radioButtonSelected,
                        { marginRight: 8, marginBottom: 8 }
                      ]}
                      onPress={() => editingBullBreedingRecord && setEditingBullBreedingRecord({...editingBullBreedingRecord, pe: pe as BullBreedingRecord['pe']})}
                    >
                      <Text>{pe}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Sperm Motility (%)</Text>
                <TextInput
                  style={styles.input}
                  value={editingBullBreedingRecord?.spermMotility || ''}
                  onChangeText={(text) => editingBullBreedingRecord && setEditingBullBreedingRecord({...editingBullBreedingRecord, spermMotility: text})}
                  placeholder="e.g., 85"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Sperm Morphology (%)</Text>
                <TextInput
                  style={styles.input}
                  value={editingBullBreedingRecord?.spermMorphology || ''}
                  onChangeText={(text) => editingBullBreedingRecord && setEditingBullBreedingRecord({...editingBullBreedingRecord, spermMorphology: text})}
                  placeholder="e.g., 90"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Scrotal Circumference (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={editingBullBreedingRecord?.scrotal || ''}
                  onChangeText={(text) => editingBullBreedingRecord && setEditingBullBreedingRecord({...editingBullBreedingRecord, scrotal: text})}
                  placeholder="e.g., 35.5"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Libido</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                  {['Excellent', 'Good', 'Poor'].map((libido) => (
                    <TouchableOpacity 
                      key={libido}
                      style={[
                        styles.radioButton, 
                        editingBullBreedingRecord?.libido === libido && styles.radioButtonSelected,
                        { marginRight: 8, marginBottom: 8 }
                      ]}
                      onPress={() => editingBullBreedingRecord && setEditingBullBreedingRecord({...editingBullBreedingRecord, libido: libido as BullBreedingRecord['libido']})}
                    >
                      <Text>{libido}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Score</Text>
                <TextInput
                  style={styles.input}
                  value={editingBullBreedingRecord?.score || ''}
                  onChangeText={(text) => editingBullBreedingRecord && setEditingBullBreedingRecord({...editingBullBreedingRecord, score: text})}
                  placeholder="e.g., 85"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Classification</Text>
                <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                  {['SPB', 'USPB', 'CD'].map((classification) => (
                    <TouchableOpacity 
                      key={classification}
                      style={[
                        styles.radioButton, 
                        editingBullBreedingRecord?.classification === classification && styles.radioButtonSelected,
                        { marginRight: 8, marginBottom: 8 }
                      ]}
                      onPress={() => editingBullBreedingRecord && setEditingBullBreedingRecord({...editingBullBreedingRecord, classification: classification as BullBreedingRecord['classification']})}
                    >
                      <Text>{classification}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                variant="outline" 
                onPress={() => { setIsEditBullBreedingRecordModalVisible(false); setEditingBullBreedingRecord(null); }}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline"
                  onPress={() => handleDeleteBullBreedingRecord(editingBullBreedingRecord!.id)}
                  style={StyleSheet.flatten([styles.cancelButton, { borderColor: Colors.error[500], marginRight: 8 }])}
                >
                  <Text color="error.500">Delete</Text>
                </Button>
              )}
              <Button 
                onPress={handleSaveBullBreedingRecord}
                disabled={isSubmitting || !editingBullBreedingRecord?.bullId || !editingBullBreedingRecord?.age || !editingBullBreedingRecord?.spermMotility || !editingBullBreedingRecord?.spermMorphology || !editingBullBreedingRecord?.scrotal || !editingBullBreedingRecord?.score}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderAddAnimalModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddModalVisible}
      onRequestClose={() => setIsAddModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h6" weight="bold" style={styles.modalTitle}>Add New Animal</Text>
            
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="always"
              automaticallyAdjustKeyboardInsets={true}
              keyboardDismissMode="none"
            >
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Tag *</Text>
                <TextInput
                  style={styles.input}
                  value={newAnimal.tag}
                  onChangeText={(text) => setNewAnimal({...newAnimal, tag: text})}
                  placeholder="e.g., TAG123"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date of Birth *</Text>
                <TouchableOpacity 
                  style={styles.input}
                  onPress={() => setShowBirthDatePicker(true)}
                >
                  <Text style={newAnimal.dateOfBirth ? {} : {color: '#999'}}>
                    {newAnimal.dateOfBirth || 'Select date'}
                  </Text>
                </TouchableOpacity>
                
                {renderAdaptiveDatePicker(
                  showBirthDatePicker,
                  newAnimal.dateOfBirth,
                  () => setShowBirthDatePicker(false),
                  (formattedDate) => {
                    const today = new Date();
                    const date = new Date(formattedDate);
                    let years = today.getFullYear() - date.getFullYear();
                    let months = today.getMonth() - date.getMonth();
                    if (months < 0 || (months === 0 && today.getDate() < date.getDate())) {
                      years--;
                      months += 12;
                    }
                    const ageText = years > 0 ? `${years}y ${months}m` : `${months}m`;
                    setNewAnimal(prev => ({ ...prev, dateOfBirth: formattedDate, age: ageText }));
                  },
                  "Date of Birth",
                  new Date()
                )}
                
                {newAnimal.age ? (
                  <Text variant="caption" style={{marginTop: 4}}>Age: {newAnimal.age}</Text>
                ) : null}
              </View>
              
              <Picker
                label="Breed"
                value={newAnimal.breed}
                onValueChange={(value) => {
                  if (value === '__add_new__') {
                    setNewAnimal({...newAnimal, breed: ''});
                    setShowCustomBreedInput(true);
                  } else {
                    setNewAnimal({...newAnimal, breed: value});
                    setShowCustomBreedInput(false);
                  }
                }}
                items={[
                  { label: 'Select Breed', value: '' },
                  ...customBreedList.map(b => ({ label: b, value: b })),
                  { label: '+ Add New Breed...', value: '__add_new__' },
                ]}
              />
              {showCustomBreedInput && (
                <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={newAnimal.breed}
                    onChangeText={(text) => setNewAnimal({...newAnimal, breed: text})}
                    placeholder="Type new breed name..."
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onPress={() => {
                      const trimmed = newAnimal.breed.trim();
                      if (trimmed && !customBreedList.includes(trimmed)) {
                        setCustomBreedList(prev => [...prev, trimmed]);
                      }
                      setShowCustomBreedInput(false);
                    }}
                    disabled={!newAnimal.breed.trim()}
                  >
                    Save
                  </Button>
                </View>
              )}
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Sex</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={[styles.radioButton, newAnimal.sex === 'Male' && styles.radioButtonSelected]}
                    onPress={() => setNewAnimal({...newAnimal, sex: 'Male'})}
                  >
                    <Text>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.radioButton, newAnimal.sex === 'Female' && styles.radioButtonSelected]}
                    onPress={() => setNewAnimal({...newAnimal, sex: 'Female'})}
                  >
                    <Text>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <Picker
                label="Stock Type"
                value={newAnimal.stockType}
                onValueChange={(value) => setNewAnimal({...newAnimal, stockType: value})}
                items={[
                  { label: 'Select Stock Type', value: '' },
                  { label: 'Bull', value: 'Bull' },
                  { label: 'Cow', value: 'Cow' },
                  { label: 'Heifer', value: 'Heifer' },
                  { label: 'Bullying Heifer', value: 'Bullying Heifer' },
                  { label: 'Steer', value: 'Steer' },
                  { label: 'Calf', value: 'Calve' }
                ]}
              />
              
              <Picker
                label="Source"
                value={newAnimal.source}
                onValueChange={(value) => setNewAnimal({...newAnimal, source: value})}
                items={[
                  { label: 'Select Source', value: '' },
                  { label: 'Born on Farm', value: 'Born' },
                  { label: 'Purchased', value: 'Purchased' },
                ]}
              />

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Sire</Text>
                <TextInput
                  style={styles.input}
                  value={newAnimal.sire}
                  onChangeText={(text) => setNewAnimal({...newAnimal, sire: text})}
                  placeholder="Sire Tag / ID"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Dam</Text>
                <TextInput
                  style={styles.input}
                  value={newAnimal.dam}
                  onChangeText={(text) => setNewAnimal({...newAnimal, dam: text})}
                  placeholder="Dam Tag / ID"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Birth Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={newAnimal.birthWeight}
                  onChangeText={(text) => setNewAnimal({...newAnimal, birthWeight: text})}
                  placeholder="e.g., 35"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date of Weaning</Text>
                <TouchableOpacity 
                  style={styles.input}
                  onPress={() => setShowWeaningDatePicker(true)}
                >
                  <Text style={newAnimal.dateOfWeaning ? {} : {color: '#999'}}>
                    {newAnimal.dateOfWeaning || 'Select weaning date'}
                  </Text>
                </TouchableOpacity>
                
                {renderAdaptiveDatePicker(
                  showWeaningDatePicker,
                  newAnimal.dateOfWeaning,
                  () => setShowWeaningDatePicker(false),
                  (formattedDate) => setNewAnimal(prev => ({ ...prev, dateOfWeaning: formattedDate })),
                  "Weaning Date",
                  new Date()
                )}
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Weaning Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={newAnimal.weaningWeight ? newAnimal.weaningWeight.toString() : ''}
                  onChangeText={(text) => setNewAnimal({...newAnimal, weaningWeight: text})}
                  placeholder="e.g., 180"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={newAnimal.description}
                  onChangeText={(text) => setNewAnimal({...newAnimal, description: text})}
                  placeholder="Additional description/markings..."
                  multiline={true}
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                variant="outline" 
                onPress={() => setIsAddModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleAddAnimal}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Animal'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderTimeline = (animalTag: string) => {
    const events: { date: string; title: string; desc: string; icon: any }[] = [];

    // Find animal details
    const anim = herdRegisterData.find(a => a.tag === animalTag);
    if (anim) {
      if (anim.dateOfBirth) {
        events.push({
          date: anim.dateOfBirth,
          title: 'Birth',
          desc: `Born on farm. Breed: ${anim.breed || 'Unknown'}. Sex: ${anim.sex}.`,
          icon: <Baby size={16} color={Colors.primary[600]} />
        });
      }
      if (anim.source === 'Purchased') {
        events.push({
          date: anim.dateOfBirth || '',
          title: 'Purchase',
          desc: `Purchased and added to herd.`,
          icon: <DollarSign size={16} color={Colors.primary[600]} />
        });
      }
    }

    // Weight Records
    if (animalWeights) {
      const weights = animalWeights.filter(w => w.animalTag?.toLowerCase() === animalTag.toLowerCase());
      weights.forEach(w => {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        months.forEach((m, idx) => {
          const val = (w as any)[m];
          if (val != null) {
            events.push({
              date: `${w.year}-${(idx + 1).toString().padStart(2, '0')}-15`,
              title: 'Weight Log',
              desc: `Weight: ${val} kg.`,
              icon: <Scale size={16} color={Colors.primary[600]} />
            });
          }
        });
      });
    }

    // Health Records
    if (healthRecords) {
      const healths = healthRecords.filter(h => h.animalId?.toLowerCase() === animalTag.toLowerCase());
      healths.forEach(h => {
        events.push({
          date: h.date,
          title: 'Health Treatment',
          desc: `Treatment: ${h.treatment}. Status: ${h.status}. Done by: ${h.doneBy || 'N/A'}. Notes: ${h.specialNotes || 'None'}.`,
          icon: <Activity size={16} color={Colors.primary[600]} />
        });
      });
    }

    // Breeding Records
    if (ctxBreedingRecords) {
      const breeds = ctxBreedingRecords.filter(b => b.earTagNumber?.toLowerCase() === animalTag.toLowerCase());
      breeds.forEach(b => {
        if (b.heatDetectionDate) {
          events.push({
            date: b.heatDetectionDate,
            title: 'Heat Detected',
            desc: `Observed by: ${b.observer}. BCS: ${b.bodyConditionScore}.`,
            icon: <Flame size={16} color={Colors.primary[600]} />
          });
        }
        if (b.servicedDate) {
          events.push({
            date: b.servicedDate,
            title: 'Serviced (Breeding)',
            desc: `Method: ${b.breedingMethod || 'N/A'}. Sire: ${b.sireId || 'N/A'}. Straw: ${b.strawId || 'N/A'}. Status: ${b.breedingStatus}.`,
            icon: <Heart size={16} color={Colors.primary[600]} />
          });
        }
      });
    }

    // Pregnancy Records
    if (ctxPregnancyRecords) {
      const pregs = ctxPregnancyRecords.filter(p => p.cowEarTag?.toLowerCase() === animalTag.toLowerCase());
      pregs.forEach(p => {
        if (p.lastServiceDate) {
          events.push({
            date: p.lastServiceDate,
            title: 'Pregnancy Diagnosis',
            desc: `PD1: ${p.firstTrimesterPD || 'N/A'}, PD2: ${p.secondTrimesterPD || 'N/A'}, PD3: ${p.thirdTrimesterPD || 'N/A'}. Gestation: ${p.gestationPeriod} days. Expected Calving: ${p.expectedCalvingDate || 'N/A'}.`,
            icon: <Baby size={16} color={Colors.primary[600]} />
          });
        }
        if (p.actualCalvingDate) {
          events.push({
            date: p.actualCalvingDate,
            title: 'Calving (Birth Event)',
            desc: `Calf Tag: ${p.calfId || 'N/A'}. Calf Sex: ${p.calfSex || 'N/A'}. Delivery: ${p.deliveryType || 'Natural'}.`,
            icon: <Sparkles size={16} color={Colors.primary[600]} />
          });
        }
      });
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <ScrollView style={{ padding: 16 }}>
        {events.length === 0 ? (
          <Text align="center" color="neutral.500" style={{ marginTop: 24 }}>No events recorded for this animal.</Text>
        ) : (
          events.map((evt, idx) => (
            <View key={idx} style={{ flexDirection: 'row', marginBottom: 20 }}>
              <View style={{ alignItems: 'center', marginRight: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F8F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#A2D9CE' }}>
                  {evt.icon}
                </View>
                {idx < events.length - 1 && (
                  <View style={{ width: 2, flex: 1, backgroundColor: '#BDC3C7', marginTop: 4 }} />
                )}
              </View>
              <View style={{ flex: 1, backgroundColor: '#F8F9F9', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EAEDED' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text weight="bold" style={{ fontSize: 14 }}>{evt.title}</Text>
                  <Text variant="caption" color="neutral.500">{evt.date}</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#566573' }}>{evt.desc}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderPedigree = (animalTag: string) => {
    const findAnimal = (tag: string): any => {
      if (!tag) return null;
      return animals.find(a => a.tag.toLowerCase() === tag.trim().toLowerCase()) || { tag, breed: 'Unknown', stockType: '', sire: '', dam: '' };
    };

    const root = findAnimal(animalTag);
    if (!root) return <Text align="center" style={{ marginTop: 24 }}>Animal not found</Text>;

    const sire1 = root.sire ? findAnimal(root.sire) : null;
    const dam1 = root.dam ? findAnimal(root.dam) : null;

    const gSire1 = sire1?.sire ? findAnimal(sire1.sire) : null;
    const gDam1 = sire1?.dam ? findAnimal(sire1.dam) : null;

    const gSire2 = dam1?.sire ? findAnimal(dam1.sire) : null;
    const gDam2 = dam1?.dam ? findAnimal(dam1.dam) : null;

    const renderNode = (title: string, anim: any, relationship: string) => {
      return (
        <View style={{
          backgroundColor: anim && anim.breed !== 'Unknown' ? '#F4F6F7' : '#FDFEFE',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: anim && anim.breed !== 'Unknown' ? '#A2D9CE' : '#E5E8E8',
          padding: 8,
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          margin: 4,
          minHeight: 60
        }}>
          <Text variant="caption" color="neutral.500" style={{ fontSize: 9, fontWeight: 'bold' }}>{relationship}</Text>
          <Text weight="bold" style={{ fontSize: 12, marginTop: 2 }}>{anim ? anim.tag : 'Unknown'}</Text>
          <Text variant="caption" style={{ fontSize: 10, color: '#7F8C8D' }}>{anim && anim.breed !== 'Unknown' ? anim.breed : '—'}</Text>
        </View>
      );
    };

    const handleEditPedigreePress = () => {
      setPedigreeForm({
        sire: root.sire || '',
        dam: root.dam || '',
        sireSire: sire1?.sire || '',
        sireDam: sire1?.dam || '',
        damSire: dam1?.sire || '',
        damDam: dam1?.dam || '',
      });
      setIsPedigreeEditModalVisible(true);
    };

    return (
      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 16 }}>
          <Text variant="caption" color="neutral.500" style={{ flex: 1, paddingRight: 8 }}>
            3-Generation Pedigree Tree. Boxes show active registered ancestors.
          </Text>
          <TouchableOpacity 
            onPress={handleEditPedigreePress} 
            style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.primary[50], borderRadius: 8, borderWidth: 1, borderColor: Colors.primary[200] }}
          >
            <Text style={{ fontSize: 12, color: Colors.primary[600], fontWeight: 'bold' }}>Modify Pedigree</Text>
          </TouchableOpacity>
        </View>
        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 4 }}>
            {renderNode('Grandsire (Sire)', gSire1, 'Paternal Grandsire')}
            {renderNode('Granddam (Sire)', gDam1, 'Paternal Granddam')}
            <View style={{ height: 16 }} />
            {renderNode('Grandsire (Dam)', gSire2, 'Maternal Grandsire')}
            {renderNode('Granddam (Dam)', gDam2, 'Maternal Granddam')}
          </View>

          <View style={{ width: 16, alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={16} color="#BDC3C7" />
            <View style={{ height: 80 }} />
            <ChevronLeft size={16} color="#BDC3C7" />
          </View>

          <View style={{ flex: 1, gap: 20 }}>
            {renderNode('Sire', sire1, 'Sire (Father)')}
            <View style={{ height: 10 }} />
            {renderNode('Dam', dam1, 'Dam (Mother)')}
          </View>

          <View style={{ width: 16, alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={20} color="#BDC3C7" />
          </View>

          <View style={{ flex: 1 }}>
            {renderNode('Self', root, 'Animal')}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderEditAnimalModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditAnimalModalVisible}
      onRequestClose={() => {
        setIsEditAnimalModalVisible(false);
        setEditingAnimal(null);
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingHorizontal: 0 }]}>
            <View style={{ paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="h6" weight="bold" style={styles.modalTitle}>
                Animal Profile: {editingAnimal?.tag || ''}
              </Text>
              <TouchableOpacity onPress={() => { setIsEditAnimalModalVisible(false); setEditingAnimal(null); }}>
                <Text style={{ fontSize: 28, color: '#888', fontWeight: 'bold' }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Tab Bar */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E8E8', marginBottom: 12, paddingHorizontal: 24 }}>
              {(['details', 'timeline', 'pedigree'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={{
                    paddingVertical: 12,
                    marginRight: 20,
                    borderBottomWidth: 2,
                    borderBottomColor: modalActiveTab === tab ? Colors.primary[500] : 'transparent'
                  }}
                  onPress={() => setModalActiveTab(tab)}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: modalActiveTab === tab ? Colors.primary[600] : Colors.neutral[600]
                  }}>
                    {tab === 'details' ? 'Edit Details' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {modalActiveTab === 'details' && (
              <>
                <ScrollView
                  style={{ flexShrink: 1, paddingHorizontal: 24 }}
                  contentContainerStyle={{ flexGrow: 1 }}
                  keyboardShouldPersistTaps="always"
                  automaticallyAdjustKeyboardInsets={true}
                  keyboardDismissMode="none"
                >
                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Tag *</Text>
                    <TextInput
                      style={styles.input}
                      value={editingAnimal?.tag || ''}
                      onChangeText={(text) => editingAnimal && setEditingAnimal({...editingAnimal, tag: text})}
                      placeholder="e.g., TAG123"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Date of Birth *</Text>
                    <TouchableOpacity 
                      style={styles.input}
                      onPress={() => setShowBirthDatePicker(true)}
                    >
                      <Text style={editingAnimal?.dateOfBirth ? {} : {color: '#999'}}>
                        {editingAnimal?.dateOfBirth || 'Select date'}
                      </Text>
                    </TouchableOpacity>
                    
                    {renderAdaptiveDatePicker(
                      showBirthDatePicker,
                      editingAnimal?.dateOfBirth,
                      () => setShowBirthDatePicker(false),
                      (formattedDate) => {
                        const today = new Date();
                        const date = new Date(formattedDate);
                        let years = today.getFullYear() - date.getFullYear();
                        let months = today.getMonth() - date.getMonth();
                        if (months < 0 || (months === 0 && today.getDate() < date.getDate())) {
                          years--;
                          months += 12;
                        }
                        const ageText = years > 0 ? `${years}y ${months}m` : `${months}m`;
                        if (editingAnimal) {
                          setEditingAnimal({ ...editingAnimal, dateOfBirth: formattedDate, age: ageText });
                        }
                      },
                      "Date of Birth",
                      new Date()
                    )}
                    
                    {editingAnimal?.age ? (
                      <Text variant="caption" style={{marginTop: 4}}>Age: {editingAnimal.age}</Text>
                    ) : null}
                  </View>
                  
                  <Picker
                    label="Breed"
                    value={editingAnimal?.breed || ''}
                    onValueChange={(value) => {
                      if (value === '__add_new__') {
                        if (editingAnimal) setEditingAnimal({...editingAnimal, breed: ''});
                        setShowCustomBreedInput(true);
                      } else {
                        if (editingAnimal) setEditingAnimal({...editingAnimal, breed: value});
                        setShowCustomBreedInput(false);
                      }
                    }}
                    items={[
                      { label: 'Select Breed', value: '' },
                      ...customBreedList.map(b => ({ label: b, value: b })),
                      { label: '+ Add New Breed...', value: '__add_new__' },
                    ]}
                  />
                  {showCustomBreedInput && (
                    <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={editingAnimal?.breed || ''}
                        onChangeText={(text) => editingAnimal && setEditingAnimal({...editingAnimal, breed: text})}
                        placeholder="Type new breed name..."
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onPress={() => {
                          const trimmed = editingAnimal?.breed.trim();
                          if (trimmed && !customBreedList.includes(trimmed)) {
                            setCustomBreedList(prev => [...prev, trimmed]);
                          }
                          setShowCustomBreedInput(false);
                        }}
                        disabled={!editingAnimal?.breed.trim()}
                      >
                        Save
                      </Button>
                    </View>
                  )}
                  
                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Sex</Text>
                    <View style={styles.radioGroup}>
                      <TouchableOpacity 
                        style={[styles.radioButton, editingAnimal?.sex === 'Male' && styles.radioButtonSelected]}
                        onPress={() => editingAnimal && setEditingAnimal({...editingAnimal, sex: 'Male'})}
                      >
                        <Text>Male</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.radioButton, editingAnimal?.sex === 'Female' && styles.radioButtonSelected]}
                        onPress={() => editingAnimal && setEditingAnimal({...editingAnimal, sex: 'Female'})}
                      >
                        <Text>Female</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Picker
                    label="Stock Type"
                    value={editingAnimal?.stockType || ''}
                    onValueChange={(value) => editingAnimal && setEditingAnimal({...editingAnimal, stockType: value})}
                    items={[
                      { label: 'Select Stock Type', value: '' },
                      { label: 'Bull', value: 'Bull' },
                      { label: 'Cow', value: 'Cow' },
                      { label: 'Heifer', value: 'Heifer' },
                      { label: 'Bullying Heifer', value: 'Bullying Heifer' },
                      { label: 'Steer', value: 'Steer' },
                      { label: 'Calf', value: 'Calve' }
                    ]}
                  />
                  
                  <Picker
                    label="Source"
                    value={editingAnimal?.source || ''}
                    onValueChange={(value) => editingAnimal && setEditingAnimal({...editingAnimal, source: value})}
                    items={[
                      { label: 'Select Source', value: '' },
                      { label: 'Born on Farm', value: 'Born' },
                      { label: 'Purchased', value: 'Purchased' },
                    ]}
                  />

                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Sire</Text>
                    <TextInput
                      style={styles.input}
                      value={editingAnimal?.sire || ''}
                      onChangeText={(text) => editingAnimal && setEditingAnimal({...editingAnimal, sire: text})}
                      placeholder="Sire Tag / ID"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Dam</Text>
                    <TextInput
                      style={styles.input}
                      value={editingAnimal?.dam || ''}
                      onChangeText={(text) => editingAnimal && setEditingAnimal({...editingAnimal, dam: text})}
                      placeholder="Dam Tag / ID"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Birth Weight (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={editingAnimal?.birthWeight || ''}
                      onChangeText={(text) => editingAnimal && setEditingAnimal({...editingAnimal, birthWeight: text})}
                      placeholder="e.g., 35"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Date of Weaning</Text>
                    <TouchableOpacity 
                      style={styles.input}
                      onPress={() => setShowWeaningDatePicker(true)}
                    >
                      <Text style={editingAnimal?.dateOfWeaning ? {} : {color: '#999'}}>
                        {editingAnimal?.dateOfWeaning || 'Select weaning date'}
                      </Text>
                    </TouchableOpacity>
                    
                    {renderAdaptiveDatePicker(
                      showWeaningDatePicker,
                      editingAnimal?.dateOfWeaning,
                      () => setShowWeaningDatePicker(false),
                      (formattedDate) => {
                        if (editingAnimal) {
                          setEditingAnimal({ ...editingAnimal, dateOfWeaning: formattedDate });
                        }
                      },
                      "Weaning Date",
                      new Date()
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Weaning Weight (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={editingAnimal?.weaningWeight ? editingAnimal.weaningWeight.toString() : ''}
                      onChangeText={(text) => editingAnimal && setEditingAnimal({...editingAnimal, weaningWeight: text})}
                      placeholder="e.g., 180"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Description</Text>
                    <TextInput
                      style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                      value={editingAnimal?.description || ''}
                      onChangeText={(text) => editingAnimal && setEditingAnimal({...editingAnimal, description: text})}
                      placeholder="Additional description/markings..."
                      multiline={true}
                      numberOfLines={3}
                    />
                  </View>
                </ScrollView>
                
                <View style={[styles.modalButtons, { paddingHorizontal: 24 }]}>
                  <Button 
                    variant="outline" 
                    onPress={() => {
                      setIsEditAnimalModalVisible(false);
                      setEditingAnimal(null);
                    }}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onPress={handleSaveAnimal}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </View>
              </>
            )}

            {modalActiveTab === 'timeline' && editingAnimal && renderTimeline(editingAnimal.tag)}
            {modalActiveTab === 'pedigree' && editingAnimal && renderPedigree(editingAnimal.tag)}
          </View>
        </View>
      </KeyboardAvoidingView>
      {renderPedigreeEditModal()}
    </Modal>
  );

  const renderAddPregnancyModal = () => {
    const handleAddPregnancyRecord = async () => {
      if (pregnancyCalvingRecords.some(r => r.cowEarTag.trim().toLowerCase() === newPregnancyRecord.cowEarTag.trim().toLowerCase())) {
        alert('A pregnancy record for this cow already exists.');
        return;
      }
      setIsSubmitting(true);
      try {
        await addPregnancyRecord({
          cowEarTag: newPregnancyRecord.cowEarTag,
          bodyConditionScore: newPregnancyRecord.bodyConditionScore,
          lastServiceDate: newPregnancyRecord.lastServiceDate,
          firstTrimesterPD: newPregnancyRecord.firstTrimesterPD,
          secondTrimesterPD: newPregnancyRecord.secondTrimesterPD,
          thirdTrimesterPD: newPregnancyRecord.thirdTrimesterPD,
          gestationPeriod: newPregnancyRecord.gestationPeriod,
          expectedCalvingDate: newPregnancyRecord.expectedCalvingDate,
          actualCalvingDate: newPregnancyRecord.actualCalvingDate || undefined,
          calfId: newPregnancyRecord.calfId || undefined,
          calfSex: newPregnancyRecord.calfSex || undefined,
          deliveryType: newPregnancyRecord.deliveryType || undefined,
          averageBCS: newPregnancyRecord.averageBCS,
          expectedReturnToHeatDate: newPregnancyRecord.expectedReturnToHeatDate,
        });
        setNewPregnancyRecord({
          cowEarTag: '',
          bodyConditionScore: 3.0,
          lastServiceDate: new Date().toISOString().split('T')[0],
          firstTrimesterPD: 'Not Tested',
          secondTrimesterPD: 'Not Tested',
          thirdTrimesterPD: 'Not Tested',
          gestationPeriod: 0,
          expectedCalvingDate: '',
          actualCalvingDate: '',
          averageBCS: 3.0,
          expectedReturnToHeatDate: '',
          calfId: '',
          calfSex: undefined,
          deliveryType: undefined
        });
        setIsAddPregnancyModalVisible(false);
      } catch (error: any) {
        alert('Error adding pregnancy record: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    };


    const renderRadioGroup = (
      label: string,
      value: string,
      options: { label: string; value: string }[],
      onChange: (value: string) => void
    ) => (
      <View style={styles.formGroup}>
        <Text variant="body2" style={styles.label}>{label}</Text>
        <View style={styles.radioGroup}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.radioButton,
                value === option.value && styles.radioButtonSelected
              ]}
              onPress={() => onChange(option.value)}
            >
              <Text>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );

    const pdOptions = [
      { label: 'Positive', value: 'Positive' },
      { label: 'Negative', value: 'Negative' },
      { label: 'Inconclusive', value: 'Inconclusive' },
      { label: 'Not Tested', value: 'Not Tested' },
    ] as const;

    type PDValue = typeof pdOptions[number]['value'];

    return (
      <Modal 
        visible={isAddPregnancyModalVisible} 
        onRequestClose={() => setIsAddPregnancyModalVisible(false)}
        transparent
        animationType="slide"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text variant="h6" style={styles.modalTitle}>Add Pregnancy Diagnosis Record</Text>
                <TouchableOpacity onPress={() => setIsAddPregnancyModalVisible(false)}>
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView 
                style={[styles.modalBody, { flexShrink: 1 }]}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="always"
                automaticallyAdjustKeyboardInsets={true}
                keyboardDismissMode="none"
              >
                <View style={styles.formGroup}>
                  <Picker
                    label="Select Cow*"
                    value={newPregnancyRecord.cowEarTag}
                    onValueChange={(value) => setNewPregnancyRecord({...newPregnancyRecord, cowEarTag: value})}
                    items={[
                      { label: 'Select a cow...', value: '' },
                      ...herdRegisterData
                        .filter(animal => animal.sex === 'Female' && ['Cow', 'Heifer', 'Heifer (First Calf)', 'Bullying Heifer'].includes(animal.stockType))
                        .map(animal => ({
                          label: `${animal.tag} (${animal.breed} ${animal.stockType})`,
                          value: animal.tag
                        }))
                    ]}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Body Condition Score (1-5) *</Text>
                  <TextInput
                    style={styles.input}
                    value={newPregnancyRecord.bodyConditionScore ? newPregnancyRecord.bodyConditionScore.toString() : ''}
                    onChangeText={(text) => {
                      // Allow empty string, decimal point, and numbers
                      if (text === '' || /^\d*\.?\d*$/.test(text)) {
                        const num = parseFloat(text);
                        if (text === '' || (!isNaN(num) && num >= 1 && num <= 5)) {
                          setNewPregnancyRecord({...newPregnancyRecord, bodyConditionScore: text === '' ? 0 : num});
                        }
                      }
                    }}
                    placeholder="Enter BCS (1-5)"
                    keyboardType="numeric"
                  />
                </View>
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Last Service Date *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => toggleDatePicker('lastServiceDate')}
                >
                  <Text>{newPregnancyRecord.lastServiceDate || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showDatePicker.lastServiceDate,
                  newPregnancyRecord.lastServiceDate,
                  () => toggleDatePicker('lastServiceDate'),
                  (formattedDate) => {
                    setNewPregnancyRecord({
                      ...newPregnancyRecord,
                      lastServiceDate: formattedDate
                    });
                    // Recalculate expected calving date if gestation period is set
                    if (newPregnancyRecord.gestationPeriod > 0) {
                      const serviceDate = new Date(formattedDate);
                      const expectedDate = new Date(serviceDate);
                      expectedDate.setDate(serviceDate.getDate() + newPregnancyRecord.gestationPeriod);
                      setNewPregnancyRecord(prev => ({
                        ...prev,
                        expectedCalvingDate: expectedDate.toISOString().split('T')[0]
                      }));
                    }
                  }
                )}
              </View>

                <View style={styles.formGroup}>
                  <Picker
                    label="1st Trimester PD"
                    value={newPregnancyRecord.firstTrimesterPD}
                    onValueChange={(value) => 
                      setNewPregnancyRecord({...newPregnancyRecord, firstTrimesterPD: value as PDValue})
                    }
                    items={pdOptions}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Picker
                    label="2nd Trimester PD"
                    value={newPregnancyRecord.secondTrimesterPD}
                    onValueChange={(value) => 
                      setNewPregnancyRecord({...newPregnancyRecord, secondTrimesterPD: value as PDValue})
                    }
                    items={pdOptions}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Picker
                    label="3rd Trimester PD"
                    value={newPregnancyRecord.thirdTrimesterPD}
                    onValueChange={(value) => 
                      setNewPregnancyRecord({...newPregnancyRecord, thirdTrimesterPD: value as PDValue})
                    }
                    items={pdOptions}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Gestation Period (days)</Text>
                  <TextInput
                    style={styles.input}
                    value={newPregnancyRecord.gestationPeriod ? newPregnancyRecord.gestationPeriod.toString() : ''}
                    onChangeText={(text) => {
                      // Allow only numbers
                      if (text === '' || /^\d+$/.test(text)) {
                        setNewPregnancyRecord(prev => {
                          const num = text === '' ? 0 : parseInt(text, 10);
                          const updated = {...prev, gestationPeriod: num};
                          // Only calculate expected date if we have a valid number
                          if (num > 0) {
                            const lastServiceDate = new Date(prev.lastServiceDate);
                            const expectedDate = new Date(lastServiceDate);
                            expectedDate.setDate(lastServiceDate.getDate() + num);
                            updated.expectedCalvingDate = expectedDate.toISOString().split('T')[0];
                          } else {
                            updated.expectedCalvingDate = 'N/A';
                          }
                          return updated;
                        });
                      }
                    }}
                    placeholder="Enter gestation period in days"
                    keyboardType="numeric"
                  />
                </View>
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Expected Calving Date</Text>
                <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => toggleDatePicker('expectedCalvingDate')}
                  >
                    <Text>{newPregnancyRecord.expectedCalvingDate || 'Select date'}</Text>
                  </TouchableOpacity>
                  {renderAdaptiveDatePicker(
                    showDatePicker.expectedCalvingDate,
                    newPregnancyRecord.expectedCalvingDate,
                    () => toggleDatePicker('expectedCalvingDate'),
                    (formattedDate) => {
                      setNewPregnancyRecord({
                        ...newPregnancyRecord,
                        expectedCalvingDate: formattedDate
                      });
                      console.log("here is are the logs for the newrecord for the part expectedCalvingDate:", newPregnancyRecord);
                    }
                  )}
                </View>
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Actual Calving Date (if applicable)</Text>
                <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => toggleDatePicker('actualCalvingDate')}
                  >
                    <Text>{newPregnancyRecord.actualCalvingDate || 'Select date'}</Text>
                  </TouchableOpacity>
                  {renderAdaptiveDatePicker(
                    showDatePicker.actualCalvingDate,
                    newPregnancyRecord.actualCalvingDate,
                    () => toggleDatePicker('actualCalvingDate'),
                    (formattedDate) => setNewPregnancyRecord({
                      ...newPregnancyRecord,
                      actualCalvingDate: formattedDate
                    })
                  )}
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Calf ID</Text>
                <TextInput
                  style={styles.input}
                  value={newPregnancyRecord.calfId || ''}
                  onChangeText={(text) => setNewPregnancyRecord({ ...newPregnancyRecord, calfId: text })}
                  placeholder="Enter calf ID (Optional)"
                />
              </View>

              <View style={styles.formGroup}>
                <Picker
                  label="Calf Sex"
                  value={newPregnancyRecord.calfSex || ''}
                  onValueChange={(value) => setNewPregnancyRecord({ ...newPregnancyRecord, calfSex: value ? value as any : undefined })}
                  items={[
                    { label: 'Select sex...', value: '' },
                    { label: 'Male', value: 'Male' },
                    { label: 'Female', value: 'Female' }
                  ]}
                />
              </View>

              <View style={styles.formGroup}>
                <Picker
                  label="Delivery Type"
                  value={newPregnancyRecord.deliveryType || ''}
                  onValueChange={(value) => setNewPregnancyRecord({ ...newPregnancyRecord, deliveryType: value ? value as any : undefined })}
                  items={[
                    { label: 'Select delivery type...', value: '' },
                    { label: 'Natural', value: 'Natural' },
                    { label: 'Assisted', value: 'Assisted' },
                    { label: 'C-Section', value: 'C-Section' }
                  ]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Average BCS</Text>
                <TextInput
                  style={styles.input}
                  value={newPregnancyRecord.averageBCS !== undefined && newPregnancyRecord.averageBCS !== null ? newPregnancyRecord.averageBCS.toString() : '3.0'}
                  onChangeText={(text) => {
                    const score = parseFloat(text) || 0;
                    setNewPregnancyRecord({ ...newPregnancyRecord, averageBCS: score });
                  }}
                  placeholder="e.g. 3.0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Expected Return to Heat Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowAddPregnancyExpectedReturnToHeatDatePicker(true)}
                >
                  <Text>{newPregnancyRecord.expectedReturnToHeatDate || 'Select date'}</Text>
                </TouchableOpacity>
                {renderAdaptiveDatePicker(
                  showAddPregnancyExpectedReturnToHeatDatePicker,
                  newPregnancyRecord.expectedReturnToHeatDate,
                  () => setShowAddPregnancyExpectedReturnToHeatDatePicker(false),
                  (formattedDate) => setNewPregnancyRecord({
                    ...newPregnancyRecord,
                    expectedReturnToHeatDate: formattedDate
                  })
                )}
              </View>
            </ScrollView>
              <View style={styles.modalFooter}>
                <Button 
                  variant="outline" 
                  onPress={() => setIsAddPregnancyModalVisible(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                <Button 
                  onPress={handleAddPregnancyRecord}
                  disabled={isSubmitting || !newPregnancyRecord.cowEarTag}
                >
                  {isSubmitting ? 'Adding...' : 'Add Record'}
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const handleAddHeatBreedingRecord = async () => {
    if (!newHeatBreedingRecord.earTagNumber || !newHeatBreedingRecord.heatDetectionDate) {
      // Basic validation - ensure required fields are filled
      return;
    }

    if (heatBreedingRecords.some(r => r.earTagNumber.trim().toLowerCase() === newHeatBreedingRecord.earTagNumber.trim().toLowerCase())) {
      alert('A breeding record for this animal tag already exists.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addBreedingRecord({
        earTagNumber: newHeatBreedingRecord.earTagNumber,
        stockType: newHeatBreedingRecord.stockType as any,
        bodyConditionScore: newHeatBreedingRecord.bodyConditionScore,
        heatDetectionDate: newHeatBreedingRecord.heatDetectionDate,
        observer: newHeatBreedingRecord.observer,
        servicedDate: newHeatBreedingRecord.servicedDate || undefined,
        breedingStatus: newHeatBreedingRecord.breedingStatus as any,
        breedingMethod: newHeatBreedingRecord.breedingMethod as any || undefined,
        aiTechnician: newHeatBreedingRecord.aiTechnician || undefined,
        sireId: newHeatBreedingRecord.sireId || undefined,
        strawId: newHeatBreedingRecord.strawId || undefined,
        semenViability: newHeatBreedingRecord.semenViability || undefined,
        returnToHeatDate1: newHeatBreedingRecord.returnToHeatDate1 || undefined,
        dateServed2: newHeatBreedingRecord.dateServed2 || undefined,
        breedingMethod2: newHeatBreedingRecord.breedingMethod2 as any || undefined,
        sireUsed2: newHeatBreedingRecord.sireUsed2 || undefined,
        returnToHeatDate2: newHeatBreedingRecord.returnToHeatDate2 || undefined,
      });
      
      // Reset the form
      setNewHeatBreedingRecord({
        earTagNumber: '',
        stockType: 'Cow',
        bodyConditionScore: 3.0,
        heatDetectionDate: new Date().toISOString().split('T')[0],
        observer: '',
        servicedDate: new Date().toISOString().split('T')[0],
        breedingStatus: 'Bred',
        breedingMethod: 'Natural',
        aiTechnician: '',
        sireId: '',
        strawId: '',
        semenViability: undefined,
        returnToHeatDate1: '',
        dateServed2: '',
        breedingMethod2: 'Natural',
        sireUsed2: '',
        returnToHeatDate2: ''
      });
      
      setIsAddHeatBreedingModalVisible(false);
    } catch (error: any) {
      alert('Error adding breeding record: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderAddHeatBreedingModal = () => {
    const breedingStatusOptions = [
      { label: 'Bred', value: 'Bred' },
      { label: 'Confirmed Pregnant', value: 'Confirmed Pregnant' },
      { label: 'Open', value: 'Open' },
      { label: 'Not Bred', value: 'Not Bred' }
    ];

    const breedingMethodOptions = [
      { label: 'Natural', value: 'Natural' },
      { label: 'AI', value: 'AI' },
      { label: 'ET', value: 'ET' }
    ];

    const renderRadioGroup = (
      label: string,
      value: string,
      options: { label: string; value: string }[],
      onChange: (value: string) => void
    ) => (
      <View style={styles.formGroup}>
        <Text variant="body2" style={styles.label}>{label}</Text>
        <View style={styles.radioGroup}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.radioButton,
                value === option.value && styles.radioButtonSelected
              ]}
              onPress={() => onChange(option.value)}
            >
              <Text>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );

    return (
      <Modal 
        visible={isAddHeatBreedingModalVisible} 
        onRequestClose={() => setIsAddHeatBreedingModalVisible(false)}
        transparent
        animationType="slide"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text variant="h6" style={styles.modalTitle}>Add Heat Detection & Breeding Record</Text>
                <TouchableOpacity onPress={() => setIsAddHeatBreedingModalVisible(false)}>
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView 
                style={[styles.modalBody, { flexShrink: 1 }]}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="always"
                automaticallyAdjustKeyboardInsets={true}
                keyboardDismissMode="none"
              >
                <View style={styles.formGroup}>
                  <Picker
                    label="Select Animal *"
                    value={newHeatBreedingRecord.earTagNumber}
                    onValueChange={(value) => {
                      const selectedAnimal = herdRegisterData.find(animal => animal.tag === value);
                      setNewHeatBreedingRecord({
                        ...newHeatBreedingRecord,
                        earTagNumber: value,
                        stockType: (selectedAnimal?.stockType || 'Cow') as HeatBreedingRecord['stockType']
                      });
                    }}
                    items={[
                      { label: 'Select an animal...', value: '' },
                      ...herdRegisterData
                        .filter(animal => ['Cow', 'Heifer', 'Heifer (First Calf)', 'Bullying Heifer'].includes(animal.stockType))
                        .map(animal => ({
                          label: `${animal.tag} (${animal.breed} ${animal.stockType})`,
                          value: animal.tag
                        }))
                    ]}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Picker
                    label="Stock Type"
                    value={newHeatBreedingRecord.stockType}
                    onValueChange={(value) => setNewHeatBreedingRecord({...newHeatBreedingRecord, stockType: value as HeatBreedingRecord['stockType']})}
                    items={[
                      { label: 'Cow', value: 'Cow' },
                      { label: 'Heifer', value: 'Heifer' },
                      { label: 'Heifer (First Calf)', value: 'Heifer (First Calf)' },
                      { label: 'Bullying Heifer', value: 'Bullying Heifer' },
                      { label: 'Heifer Calf', value: 'Heifer Calf' }
                    ]}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Body Condition Score (1-5)</Text>
                  <TextInput
                    style={styles.input}
                    value={newHeatBreedingRecord.bodyConditionScore.toString()}
                    onChangeText={(text) => {
                      const num = parseFloat(text);
                      if (!isNaN(num) && num >= 1 && num <= 5) {
                        setNewHeatBreedingRecord({...newHeatBreedingRecord, bodyConditionScore: num});
                      }
                    }}
                    placeholder="Enter BCS (1-5)"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Heat Detection Date *</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowHeatDatePicker(true)}
                  >
                    <Text>{newHeatBreedingRecord.heatDetectionDate || 'Select date'}</Text>
                  </TouchableOpacity>
                  {renderAdaptiveDatePicker(
                    showHeatDatePicker,
                    newHeatBreedingRecord.heatDetectionDate,
                    () => setShowHeatDatePicker(false),
                    (formattedDate) => setNewHeatBreedingRecord(prev => ({ ...prev, heatDetectionDate: formattedDate })),
                    "Heat Detection Date"
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Observer</Text>
                  <TextInput
                    style={styles.input}
                    value={newHeatBreedingRecord.observer}
                    onChangeText={(text) => setNewHeatBreedingRecord({...newHeatBreedingRecord, observer: text})}
                    placeholder="Observer's name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Serviced Date</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowServicedDatePicker(true)}
                  >
                    <Text>{newHeatBreedingRecord.servicedDate || 'Select date'}</Text>
                  </TouchableOpacity>
                  {renderAdaptiveDatePicker(
                    showServicedDatePicker,
                    newHeatBreedingRecord.servicedDate,
                    () => setShowServicedDatePicker(false),
                    (formattedDate) => setNewHeatBreedingRecord(prev => ({ ...prev, servicedDate: formattedDate })),
                    "Serviced Date"
                  )}
                </View>

                {renderRadioGroup('Breeding Status', newHeatBreedingRecord.breedingStatus, breedingStatusOptions, 
                  (value) => setNewHeatBreedingRecord({...newHeatBreedingRecord, breedingStatus: value as HeatBreedingRecord['breedingStatus']}))}
                
                {renderRadioGroup('Breeding Method', newHeatBreedingRecord.breedingMethod || '', breedingMethodOptions, 
                  (value) => setNewHeatBreedingRecord({...newHeatBreedingRecord, breedingMethod: value as HeatBreedingRecord['breedingMethod']}))}

               
                  
                    <View style={styles.formGroup}>
                      <Text variant="body2" style={styles.label}>AI Technician</Text>
                      <TextInput
                        style={styles.input}
                        value={newHeatBreedingRecord.aiTechnician}
                        onChangeText={(text) => setNewHeatBreedingRecord({...newHeatBreedingRecord, aiTechnician: text})}
                        placeholder="AI Technician's name"
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text variant="body2" style={styles.label}>Sire ID</Text>
                      <TextInput
                        style={styles.input}
                        value={newHeatBreedingRecord.sireId}
                        onChangeText={(text) => setNewHeatBreedingRecord({...newHeatBreedingRecord, sireId: text})}
                        placeholder="Sire ID"
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text variant="body2" style={styles.label}>Straw ID</Text>
                      <TextInput
                        style={styles.input}
                        value={newHeatBreedingRecord.strawId}
                        onChangeText={(text) => setNewHeatBreedingRecord({...newHeatBreedingRecord, strawId: text})}
                        placeholder="Straw ID"
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text variant="body2" style={styles.label}>Semen Viability (%)</Text>
                      <TextInput
                        style={styles.input}
                        value={newHeatBreedingRecord.semenViability !== undefined ? newHeatBreedingRecord.semenViability.toString() : ''}
                        onChangeText={(text) => setNewHeatBreedingRecord({...newHeatBreedingRecord, semenViability: text === '' ? undefined : (parseInt(text, 10) || 0)})}
                        placeholder="Enter percentage"
                        keyboardType="numeric"
                      />
                    </View>
                  

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Return to Heat Date (1st)</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowReturnToHeatDatePicker(true)}
                  >
                    <Text>{newHeatBreedingRecord.returnToHeatDate1 || 'Select date'}</Text>
                  </TouchableOpacity>
                  {renderAdaptiveDatePicker(
                    showReturnToHeatDatePicker,
                    newHeatBreedingRecord.returnToHeatDate1,
                    () => setShowReturnToHeatDatePicker(false),
                    (formattedDate) => setNewHeatBreedingRecord(prev => ({ ...prev, returnToHeatDate1: formattedDate })),
                    "Return to Heat Date"
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Date Served (2nd)</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowDateServed2Picker(true)}
                  >
                    <Text>{newHeatBreedingRecord.dateServed2 || 'Select date'}</Text>
                  </TouchableOpacity>
                  {renderAdaptiveDatePicker(
                    showDateServed2Picker,
                    newHeatBreedingRecord.dateServed2,
                    () => setShowDateServed2Picker(false),
                    (formattedDate) => setNewHeatBreedingRecord(prev => ({ ...prev, dateServed2: formattedDate })),
                    "Date Served (2nd)"
                  )}
                </View>

                {renderRadioGroup('Breeding Method (2nd)', newHeatBreedingRecord.breedingMethod2 || '', breedingMethodOptions, 
                  (value) => setNewHeatBreedingRecord({...newHeatBreedingRecord, breedingMethod2: value as HeatBreedingRecord['breedingMethod2']}))}

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Sire Used (2nd)</Text>
                  <TextInput
                    style={styles.input}
                    value={newHeatBreedingRecord.sireUsed2}
                    onChangeText={(text) => setNewHeatBreedingRecord({...newHeatBreedingRecord, sireUsed2: text})}
                    placeholder="Sire ID for 2nd service"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Return to Heat Date (2nd)</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowReturnToHeat2DatePicker(true)}
                  >
                    <Text>{newHeatBreedingRecord.returnToHeatDate2 || 'Select date'}</Text>
                  </TouchableOpacity>
                  {renderAdaptiveDatePicker(
                    showReturnToHeat2DatePicker,
                    newHeatBreedingRecord.returnToHeatDate2,
                    () => setShowReturnToHeat2DatePicker(false),
                    (formattedDate) => setNewHeatBreedingRecord(prev => ({ ...prev, returnToHeatDate2: formattedDate })),
                    "Return to Heat Date (2nd)"
                  )}
                </View>
              </ScrollView>
              <View style={styles.modalFooter}>
                <Button 
                  variant="outline" 
                  onPress={() => setIsAddHeatBreedingModalVisible(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                <Button 
                  onPress={handleAddHeatBreedingRecord}
                  disabled={isSubmitting || !newHeatBreedingRecord.earTagNumber || !newHeatBreedingRecord.heatDetectionDate}
                >
                  {isSubmitting ? 'Adding...' : 'Add Record'}
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderPedigreeEditModal = () => (
    <Modal
      visible={isPedigreeEditModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsPedigreeEditModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h3" weight="bold" color={Colors.neutral[800]}>
                Modify Pedigree Tree
              </Text>
              <TouchableOpacity onPress={() => setIsPedigreeEditModalVisible(false)}>
                <X size={24} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Father / Sire Tag</Text>
                <TextInput
                  style={styles.input}
                  value={pedigreeForm.sire}
                  onChangeText={(val) => setPedigreeForm(prev => ({ ...prev, sire: val }))}
                  placeholder="e.g. Sire Tag"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Mother / Dam Tag</Text>
                <TextInput
                  style={styles.input}
                  value={pedigreeForm.dam}
                  onChangeText={(val) => setPedigreeForm(prev => ({ ...prev, dam: val }))}
                  placeholder="e.g. Dam Tag"
                />
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: '#E5E8E8', marginVertical: 12, paddingTop: 12 }}>
                <Text variant="body" weight="bold" color={Colors.neutral[700]} style={{ marginBottom: 12 }}>
                  Paternal Grandparents (Father's side)
                </Text>
                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Paternal Grandsire</Text>
                  <TextInput
                    style={styles.input}
                    value={pedigreeForm.sireSire}
                    onChangeText={(val) => setPedigreeForm(prev => ({ ...prev, sireSire: val }))}
                    placeholder="e.g. Sire's Sire"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Paternal Granddam</Text>
                  <TextInput
                    style={styles.input}
                    value={pedigreeForm.sireDam}
                    onChangeText={(val) => setPedigreeForm(prev => ({ ...prev, sireDam: val }))}
                    placeholder="e.g. Sire's Dam"
                  />
                </View>
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: '#E5E8E8', marginVertical: 12, paddingTop: 12 }}>
                <Text variant="body" weight="bold" color={Colors.neutral[700]} style={{ marginBottom: 12 }}>
                  Maternal Grandparents (Mother's side)
                </Text>
                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Maternal Grandsire</Text>
                  <TextInput
                    style={styles.input}
                    value={pedigreeForm.damSire}
                    onChangeText={(val) => setPedigreeForm(prev => ({ ...prev, damSire: val }))}
                    placeholder="e.g. Dam's Sire"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Maternal Granddam</Text>
                  <TextInput
                    style={styles.input}
                    value={pedigreeForm.damDam}
                    onChangeText={(val) => setPedigreeForm(prev => ({ ...prev, damDam: val }))}
                    placeholder="e.g. Dam's Dam"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                variant="outline"
                style={styles.actionButton}
                onPress={() => setIsPedigreeEditModalVisible(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                style={{ ...styles.actionButton, marginLeft: 12 }}
                onPress={handleSavePedigreeMobile}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Pedigree'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Tab definitions
  const TABS = [
    { key: 'overview',   label: 'Overview'   },
    { key: 'herd',       label: 'Herd'       },
    { key: 'calves',     label: 'Calves'     },
    { key: 'health',     label: 'Health'     },
    { key: 'breeding',   label: 'Breeding'   },
    { key: 'pregnancy',  label: 'Pregnancy'  },
    { key: 'bulls',      label: 'Bulls'      },
    { key: 'weights',    label: 'Weights'    },
    { key: 'drugs',      label: 'Drugs'      },
    { key: 'mortality',  label: 'Mortality'  },
    ...(profile?.role !== 'worker' ? [{ key: 'sales',      label: 'Sales'      }] : []),
    { key: 'feed',       label: 'Feed'       },
  ];

  return (
    <ScreenContainer scrollable={false}>
      {/* ── Tab Bar ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              variant="button"
              color={activeTab === tab.key ? 'primary.500' : 'neutral.600'}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Tab Content ── */}
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <Card title="Herd at a Glance" style={styles.card}>
          <View style={styles.filters}>
            <Picker
              label="Breed"
              value={selectedBreed}
              onValueChange={setSelectedBreed}
              items={breedOptions}
              style={styles.filter}
            />
            <Picker
              label="Source"
              value={selectedSource}
              onValueChange={setSelectedSource}
              items={sourceOptions}
              style={styles.filter}
            />
          </View>

          <View style={styles.totalsGrid}>
            <View style={styles.totalItem}>
              <Text variant="h3" weight="bold" color="primary.500">{herdTotals.cows}</Text>
              <Text variant="body2">Cows</Text>
            </View>
            <View style={styles.totalItem}>
              <Text variant="h4" weight="bold" color="error.500">{herdTotals.bulls}</Text>
              <Text variant="body2">Bulls</Text>
            </View>
            <View style={styles.totalItem}>
              <Text variant="h4" weight="bold" color="warning.500">{herdTotals.heifers}</Text>
              <Text variant="body2">Heifers</Text>
            </View>
            <View style={styles.totalItem}>
              <Text variant="h4" weight="bold" color="info.500">{herdTotals.steers}</Text>
              <Text variant="body2">Steers</Text>
            </View>
            <View style={styles.totalItem}>
              <Text variant="h4" weight="bold" color="success.500">{herdTotals.maleCalves}</Text>
              <Text variant="body2">Male Calves</Text>
            </View>
            <View style={styles.totalItem}>
              <Text variant="h4" weight="bold" color="accent.500">{herdTotals.femaleCalves}</Text>
              <Text variant="body2">Female Calves</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartsContainer}
          >
            <View style={styles.chart}>
              <Text variant="h6" weight="medium" style={styles.chartTitle}>Breed Distribution</Text>
              <PieChart
                data={breedDistribution}
                height={200}
                width={300}
              />
            </View>
            <View style={styles.chart}>
              <Text variant="h6" weight="medium" style={styles.chartTitle}>Source Distribution</Text>
              <PieChart
                data={sourceDistribution}
                height={200}
                width={300}
              />
            </View>
            <View style={styles.chart}>
              <Text variant="h6" weight="medium" style={styles.chartTitle}>Age Distribution</Text>
              <PieChart
                data={ageDistribution}
                height={200}
                width={300}
              />
            </View>
            <View style={styles.chart}>
              <Text variant="h6" weight="medium" style={styles.chartTitle}>Stock Type Breakdown</Text>
              <PieChart
                data={stockTypeBreakdown}
                height={200}
                width={300}
              />
            </View>
          </ScrollView>
        </Card>
        )}

        {/* ── HERD ── */}
        {activeTab === 'herd' && (
          <Card
            title="Herd Register"
            style={styles.card}
            headerRight={
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="body2" style={{ marginRight: 8, color: Colors.neutral[600] }}>
                  {displayedHerdData.length} of {herdRegisterData.length} animals
                </Text>
                <Button size="sm" onPress={() => setIsAddModalVisible(true)} style={styles.addButton}>
                  + Add Animal
                </Button>
              </View>
            }
          >
            {/* Filter selectors */}
            <View style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200], paddingBottom: 16 }}>
              <Text variant="caption" color="neutral.500" style={{ marginBottom: 8, fontWeight: 'bold', textTransform: 'uppercase' }}>
                Filter Table By
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: (tableFilterStockType !== 'All' || tableFilterBreed !== 'All' || tableFilterSource !== 'All') ? Colors.primary[500] : Colors.neutral[200],
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 8,
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setTableFilterStockType('All');
                    setTableFilterBreed('All');
                    setTableFilterSource('All');
                  }}
                >
                  <Text style={{ color: (tableFilterStockType !== 'All' || tableFilterBreed !== 'All' || tableFilterSource !== 'All') ? '#fff' : Colors.neutral[700], fontSize: 14, fontWeight: 'bold' }}>
                    View All
                  </Text>
                </TouchableOpacity>

                <View style={{ width: 140 }}>
                  <Picker
                    value={tableFilterStockType}
                    onValueChange={setTableFilterStockType}
                    style={{ marginBottom: 0 }}
                    items={[
                      { label: 'All Types', value: 'All' },
                      { label: 'Cow', value: 'Cow' },
                      { label: 'Bull', value: 'Bull' },
                      { label: 'Heifer', value: 'Heifer' },
                      { label: 'Steer', value: 'Steer' },
                      { label: 'Calf', value: 'Calve' },
                      { label: 'Bullying Heifer', value: 'Bullying Heifer' },
                    ]}
                  />
                </View>

                <View style={{ width: 140 }}>
                  <Picker
                    value={tableFilterBreed}
                    onValueChange={setTableFilterBreed}
                    style={{ marginBottom: 0 }}
                    items={breedOptions}
                  />
                </View>

                <View style={{ width: 140 }}>
                  <Picker
                    value={tableFilterSource}
                    onValueChange={setTableFilterSource}
                    style={{ marginBottom: 0 }}
                    items={sourceOptions}
                  />
                </View>
              </ScrollView>
            </View>

            <DataTable
              columns={[
                { key: 'count', title: 'Count', width: 60 },
                { key: 'tag', title: 'Tag', width: 100 },
                { key: 'age', title: 'Age', width: 90 },
                { key: 'breed', title: 'Breed', width: 120 },
                {
                  key: 'sex',
                  title: 'Sex',
                  width: 90,
                  render: (value: string) => (
                    <Text color={value === 'Male' ? 'primary.500' : 'accent.500'}>{value}</Text>
                  )
                },
                { key: 'stockType', title: 'Type', width: 120 },
                { key: 'source', title: 'Source', width: 120 },
                { key: 'sire', title: 'Sire', width: 100, render: (v: any) => <Text>{v || '—'}</Text> },
                { key: 'dam', title: 'Dam', width: 100, render: (v: any) => <Text>{v || '—'}</Text> },
                { key: 'birthWeight', title: 'Birth Wt', width: 90, render: (v: any) => <Text>{v ? `${v} kg` : '—'}</Text> },
                { key: 'dateOfWeaning', title: 'Wean Date', width: 100, render: (v: any) => <Text>{v || '—'}</Text> },
                { key: 'weaningWeight', title: 'Wean Wt', width: 90, render: (v: any) => <Text>{v ? `${v} kg` : '—'}</Text> },
                { key: 'description', title: 'Description', width: 150, render: (v: any) => <Text numberOfLines={1}>{v || '—'}</Text> },
                {
                  key: 'actions',
                  title: 'Actions',
                  width: 110,
                  render: (_, row: any) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <TouchableOpacity 
                        onPress={() => {
                          setEditingAnimal({ ...row });
                          setOriginalAnimalTag(row.tag);
                          setModalActiveTab('pedigree');
                          setIsEditAnimalModalVisible(true);
                        }}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        style={{ padding: 4 }}
                      >
                        <Eye size={18} color={Colors.primary[500]} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleEditAnimal(row)}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        style={{ padding: 4 }}
                      >
                        <Pencil size={18} color={Colors.primary[500]} />
                      </TouchableOpacity>
                    </View>
                  )
                },
              ]}
              data={displayedHerdData}
            />
          </Card>
        )}

        {/* ── CALVES ── */}
        {activeTab === 'calves' && (
          <Card
            title="Calf Register"
            style={styles.card}
            headerRight={
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="body2" style={{ marginRight: 8, color: Colors.neutral[600] }}>
                  {getCalves().length} calves
                </Text>
              </View>
            }
          >
            <DataTable
              columns={[
                { key: 'tag', title: 'Calf ID', width: 120, render: (value: string) => <Text>{value}</Text> },
                { key: 'sire', title: 'Sire ID', width: 100, render: (value: string) => <Text>{value || '-'}</Text> },
                { key: 'dam', title: 'Dam ID', width: 100, render: (value: string) => <Text>{value || '-'}</Text> },
                { key: 'sex', title: 'Sex', width: 70, render: (value: string) => (
                  <Text color={value === 'Male' ? 'primary.500' : 'accent.500'}>{value}</Text>
                )},
                { key: 'age', title: 'Age', width: 70, render: (value: string) => <Text>{value}</Text> },
                { key: 'birthWeight', title: 'Birth Wt', width: 100, render: (value: string) => <Text>{value ? `${value} kg` : '-'}</Text> },
                { key: 'weight30day', title: '30d Wt', width: 90, render: (value: any) => <Text>{value ? `${value} kg` : '-'}</Text> },
                { key: 'weight100day', title: '100d Wt', width: 100, render: (value: any) => <Text>{value ? `${value} kg` : '-'}</Text> },
                { key: 'dateOfWeaning', title: 'Wean Date', width: 110, render: (value: string) => <Text>{value || '-'}</Text> },
                { key: 'weaningWeight', title: 'Wean Wt', width: 90, render: (value: any) => <Text>{value ? `${value} kg` : '-'}</Text> },
                { key: 'weight1weekPostWeaning', title: '1w Post Wean', width: 110, render: (value: any) => <Text>{value ? `${value} kg` : '-'}</Text> },
                { key: 'weight6monthsPostWeaning', title: '6m Post Wean', width: 110, render: (value: any) => <Text>{value ? `${value} kg` : '-'}</Text> },
                { key: 'calfStatus', title: 'Status', width: 100, render: (value: string) => <Text>{value || 'Active'}</Text> },
                { key: 'preWeaningMortality', title: 'Mortality', width: 100, render: (value: boolean) => <Text>{value ? 'Yes' : 'No'}</Text> },
                { key: 'observer', title: 'Observer', width: 120, render: (value: string) => <Text>{value || '-'}</Text> },
                {
                  key: 'actions',
                  title: 'Actions',
                  width: 80,
                  render: (_, row: any) => (
                    <TouchableOpacity 
                      onPress={() => handleEditCalf(row)}
                      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      style={{ padding: 4 }}
                    >
                      <Pencil size={18} color={Colors.primary[500]} />
                    </TouchableOpacity>
                  )
                },
              ]}
              data={getCalves()}
              emptyState={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No calves found</Text>
                  <Text style={[styles.emptyStateText, { color: Colors.neutral[500], marginTop: 4 }]}>
                    Calves are automatically shown here when added to the herd register
                  </Text>
                </View>
              }
            />
          </Card>
        )}

        {/* ── HEALTH ── */}
        {activeTab === 'health' && (
          <Card
            title="Animal Health Records"
            style={styles.card}
            headerRight={
              <Button size="sm" onPress={() => {
                setApplyToAll(false);
                setSelectedAnimalTags([]);
                setAnimalSearchQuery('');
                setNewHealthRecord({ animalId: '', date: new Date().toISOString().split('T')[0], treatment: '', status: 'Pending', specialNotes: '', doneBy: '' });
                setIsAddHealthRecordModalVisible(true);
              }} style={styles.addButton}>
                + Add Record
              </Button>
            }
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <DataTable
                columns={[
                  { key: 'date', title: 'Date', width: 100 },
                  { key: 'animalId', title: 'Animal ID', width: 120, render: (value: string) => {
                    const isAll = value?.toLowerCase() === 'all';
                    if (isAll) {
                      return (
                        <View style={[styles.statusBadge, { backgroundColor: '#DCF7E8', borderColor: '#9FE4C1', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }]}>
                          <Text variant="caption" style={{ color: Colors.success[700], fontWeight: 'bold' }}>👥 All Herd</Text>
                        </View>
                      );
                    }
                    return <Text style={{ fontFamily: 'monospace' }}>🏷️ {value}</Text>;
                  }},
                  { key: 'treatment', title: 'Treatment', width: 160 },
                  { key: 'doneBy', title: 'Done By', width: 120 },
                  { key: 'specialNotes', title: 'Special Notes', width: 180 },
                  { key: 'status', title: 'Status', width: 100, render: (value: string) => (
                    <View style={[styles.statusBadge, {
                      backgroundColor: value === 'Completed' ? '#DCF7E8' : value === 'Scheduled' ? '#E0F2FE' : '#FEF3C7',
                    }]}>
                      <Text variant="caption" style={{
                        color: value === 'Completed' ? Colors.success[700] : value === 'Scheduled' ? Colors.primary[700] : Colors.warning[700],
                        fontWeight: '500',
                      }}>{value}</Text>
                    </View>
                  )},
                  {
                    key: 'actions',
                    title: 'Actions',
                    width: 80,
                    render: (_, row: any) => (
                      <TouchableOpacity 
                        onPress={() => handleEditHealthRecord(row)}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        style={{ padding: 4 }}
                      >
                        <Pencil size={18} color={Colors.primary[500]} />
                      </TouchableOpacity>
                    )
                  },
                ]}
                data={healthRecords}
              />
            </ScrollView>
          </Card>
        )}

        {/* ── BREEDING ── */}
        {activeTab === 'breeding' && (
          <Card
            title={`Heat Detection & Breeding (${new Set(heatBreedingRecords.map(r => r.earTagNumber)).size} Animals)`}
            style={styles.card}
            headerRight={
              <Button size="sm" onPress={() => setIsAddHeatBreedingModalVisible(true)} style={styles.addButton}>
                + Add Record
              </Button>
            }
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <DataTable
                columns={[
                  { key: 'earTagNumber', title: 'Ear Tag', width: 90 },
                  { key: 'stockType', title: 'Stock Type', width: 120 },
                  { key: 'bodyConditionScore', title: 'BCS', width: 70, render: (value: number) => <Text>{value?.toFixed(1)}</Text> },
                  { key: 'heatDetectionDate', title: 'Heat Detected', width: 100 },
                  { key: 'observer', title: 'Observer', width: 100 },
                  { key: 'servicedDate', title: 'Serviced Date', width: 100 },
                  { key: 'breedingStatus', title: 'Status', width: 100, render: (value: string) => (
                    <Text color={
                      value === 'Confirmed Pregnant' ? 'success.500' :
                      value === 'Bred' ? 'primary.500' :
                      value === 'Open' ? 'warning.500' : 'error.500'
                    }>{value}</Text>
                  )},
                  { key: 'breedingMethod', title: 'Method', width: 90 },
                  { key: 'aiTechnician', title: 'AI Tech', width: 100 },
                  { key: 'sireId', title: 'Sire/Straw ID', width: 120, render: (_: any, record: HeatBreedingRecord) => (
                    <Text>{record.breedingMethod === 'AI' ? `${record.sireId || ''} / ${record.strawId || ''}` : record.sireId || ''}</Text>
                  )},
                  { key: 'semenViability', title: 'Viability %', width: 90, render: (value: number) => <Text>{value ? `${value}%` : 'N/A'}</Text> },
                  { key: 'returnToHeatDate1', title: 'Return to Heat 1', width: 110 },
                  { key: 'dateServed2', title: 'Date Served 2', width: 100 },
                  { key: 'breedingMethod2', title: 'Method 2', width: 90 },
                  { key: 'sireUsed2', title: 'Sire Used 2', width: 100 },
                  { key: 'returnToHeatDate2', title: 'Return to Heat 2', width: 200 },
                  {
                    key: 'actions',
                    title: 'Actions',
                    width: 80,
                    render: (_, row: any) => (
                      <TouchableOpacity 
                        onPress={() => handleEditBreedingRecord(row)}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        style={{ padding: 4 }}
                      >
                        <Pencil size={18} color={Colors.primary[500]} />
                      </TouchableOpacity>
                    )
                  },
                ]}
                data={heatBreedingRecords}
              />
            </ScrollView>
          </Card>
        )}

        {/* ── PREGNANCY ── */}
        {activeTab === 'pregnancy' && (
          <Card
            title={`Pregnancy & Calving (${new Set(pregnancyCalvingRecords.map(r => r.cowEarTag)).size} Animals)`}
            style={styles.card}
            headerRight={
              <Button size="sm" onPress={() => setIsAddPregnancyModalVisible(true)} style={styles.addButton}>
                + Add Record
              </Button>
            }
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <DataTable
                columns={[
                  { key: 'cowEarTag', title: 'Cow Ear Tag', width: 100 },
                  { key: 'bodyConditionScore', title: 'BCS', width: 70 },
                  { key: 'lastServiceDate', title: 'Last Service', width: 100 },
                  { key: 'firstTrimesterPD', title: '1st Tri PD', width: 90, render: (value: string) => (
                    <Text color={value === 'Positive' ? 'success.500' : value === 'Negative' ? 'error.500' : value === 'Inconclusive' ? 'warning.500' : 'neutral.500'}>{value}</Text>
                  )},
                  { key: 'secondTrimesterPD', title: '2nd Tri PD', width: 90, render: (value: string) => (
                    <Text color={value === 'Positive' ? 'success.500' : value === 'Negative' ? 'error.500' : value === 'Inconclusive' ? 'warning.500' : 'neutral.500'}>{value}</Text>
                  )},
                  { key: 'thirdTrimesterPD', title: '3rd Tri PD', width: 90, render: (value: string) => (
                    <Text color={value === 'Positive' ? 'success.500' : value === 'Negative' ? 'error.500' : value === 'Inconclusive' ? 'warning.500' : 'neutral.500'}>{value}</Text>
                  )},
                  { key: 'gestationPeriod', title: 'Gestation (days)', width: 100 },
                  { key: 'expectedCalvingDate', title: 'Exp. Calving', width: 150 },
                  { key: 'actualCalvingDate', title: 'Actual Calving', width: 200 },
                  { key: 'calfId', title: 'Calf ID', width: 100 },
                  { key: 'calfSex', title: 'Calf Sex', width: 90 },
                  { key: 'deliveryType', title: 'Delivery', width: 110 },
                  { key: 'averageBCS', title: 'Avg BCS', width: 80, render: (value: number) => (
                    <Text>{value !== null && value !== undefined ? value.toFixed(1) : '-'}</Text>
                  )},
                  { key: 'expectedReturnToHeatDate', title: 'Exp. Return to Heat', width: 160 },
                  {
                    key: 'actions',
                    title: 'Actions',
                    width: 80,
                    render: (_, row: any) => (
                      <TouchableOpacity 
                        onPress={() => handleEditPregnancyRecord(row)}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        style={{ padding: 4 }}
                      >
                        <Pencil size={18} color={Colors.primary[500]} />
                      </TouchableOpacity>
                    )
                  },
                ]}
                data={pregnancyCalvingRecords}
              />
            </ScrollView>
          </Card>
        )}

        {/* ── BULLS ── */}
        {activeTab === 'bulls' && (
          <Card
            title="Bull Breeding Soundness"
            style={styles.card}
            headerRight={
              isAdmin ? (
                <Button size="sm" onPress={() => setIsAddBreedingRecordModalVisible(true)} style={styles.addButton}>
                  + Add Record
                </Button>
              ) : undefined
            }
          >
            <DataTable
              columns={[
                { key: 'date', title: 'Date', width: 80 },
                { key: 'bullId', title: 'Animal ID', width: 100 },
                { key: 'age', title: 'Age', width: 80 },
                { key: 'pe', title: 'PE', width: 100, render: (value: string) => (
                  <Text color={value === 'Excellent' ? 'success.500' : value === 'Good' ? 'primary.500' : 'error.500'}>{value}</Text>
                )},
                { key: 'spermMotility', title: 'Sperm Motility', width: 100 },
                { key: 'spermMorphology', title: 'Sperm Morphology', width: 150 },
                { key: 'scrotal', title: 'Scrotal (cm)', width: 90 },
                { key: 'libido', title: 'Libido', width: 90, render: (value: string) => (
                  <Text color={value === 'Excellent' ? 'success.500' : value === 'Good' ? 'primary.500' : 'error.500'}>{value}</Text>
                )},
                { key: 'score', title: 'Score', width: 80 },
                { key: 'classification', title: 'Classification', width: 210, render: (value: string) => (
                  <Text color={value === 'SPB' ? 'success.500' : value === 'USPB' ? 'error.500' : 'warning.500'}>{value}</Text>
                )},
                {
                  key: 'actions',
                  title: 'Actions',
                  width: 80,
                  render: (_, row: any) => (
                    isAdmin ? (
                      <TouchableOpacity 
                        onPress={() => handleEditBullBreedingRecord(row)}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        style={{ padding: 4 }}
                      >
                        <Pencil size={18} color={Colors.primary[500]} />
                      </TouchableOpacity>
                    ) : null
                  )
                },
              ]}
              data={breedingRecords}
            />
          </Card>
        )}

        {/* ── WEIGHTS ── */}
        {activeTab === 'weights' && (
          <Card
            title="Weight Record"
            style={styles.card}
            headerRight={
              <Button size="sm" onPress={() => setIsAddWeightRecordModalVisible(true)} style={styles.addButton}>
                + Add Record
              </Button>
            }
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <DataTable
                columns={[
                  { key: 'id', title: 'ID', width: 80 },
                  { key: 'stockType', title: 'Type', width: 80 },
                  { key: 'age', title: 'Age', width: 80 },
                  { key: 'jan', title: 'Jan', width: 70 },
                  { key: 'feb', title: 'Feb', width: 70 },
                  { key: 'mar', title: 'Mar', width: 70 },
                  { key: 'apr', title: 'Apr', width: 70 },
                  { key: 'may', title: 'May', width: 70 },
                  { key: 'jun', title: 'Jun', width: 70 },
                  { key: 'jul', title: 'Jul', width: 70 },
                  { key: 'aug', title: 'Aug', width: 70 },
                  { key: 'sep', title: 'Sep', width: 70 },
                  { key: 'oct', title: 'Oct', width: 70 },
                  { key: 'nov', title: 'Nov', width: 70 },
                  { key: 'dec', title: 'Dec', width: 70 },
                  {
                    key: 'actions',
                    title: 'Actions',
                    width: 80,
                    render: (_, row: any) => (
                      <TouchableOpacity 
                        onPress={() => handleEditWeightRecord(row)}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        style={{ padding: 4 }}
                      >
                        <Pencil size={18} color={Colors.primary[500]} />
                      </TouchableOpacity>
                    )
                  },
                ]}
                data={weightRecords}
              />
            </ScrollView>
          </Card>
        )}

        {/* ── DRUGS ── */}
        {activeTab === 'drugs' && (
          <Card
            title="Drug Register"
            style={styles.card}
            headerRight={
              <Button size="sm" onPress={() => setIsAddDrugModalVisible(true)} style={styles.addButton}>
                + Add Drug
              </Button>
            }
          >
            <DataTable
              columns={[
                { key: 'drugClass', title: 'Class', width: 100 },
                { key: 'type', title: 'Type', width: 80 },
                { key: 'name', title: 'Name', width: 120 },
                { key: 'pregnancySafe', title: 'Preg. Safe', width: 80, render: (value: string) => (
                  <Text color={value === 'Yes' ? 'success.500' : 'error.500'}>{value}</Text>
                )},
                { key: 'withdrawalPeriod', title: 'Withdrawal', width: 120 },
                { key: 'lastUpdated', title: 'Last Updated', width: 110, render: (value: string) => (
                  <Text variant="caption" style={{ color: value ? Colors.neutral[700] : Colors.neutral[400] }}>
                    {value || 'Not recorded'}
                  </Text>
                )},
                { key: 'stockStatus', title: 'Stock Status', width: 120, render: (value: string) => (
                  <View style={{ padding: 4, borderRadius: 4, backgroundColor:
                    value === 'In Stock' ? 'rgba(34, 197, 94, 0.1)' :
                    value === 'Low Stock' ? 'rgba(234, 179, 8, 0.1)' :
                    'rgba(239, 68, 68, 0.1)'
                  }}>
                    <Text color={value === 'In Stock' ? 'success.600' : value === 'Low Stock' ? 'warning.600' : 'error.600'} style={{ textAlign: 'center' }}>{value}</Text>
                  </View>
                )},
                { key: 'actions', title: 'Actions', width: 200, render: (_, row) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity 
                      onPress={() => handleEditDrug(row)}
                      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      style={{ padding: 4 }}
                    >
                      <Pencil size={18} color={Colors.primary[500]} />
                    </TouchableOpacity>
                    <Picker
                      value=""
                      onValueChange={(value) => {
                        if (value === 'delete') { if (row.id) deleteDrug(row.id); }
                        else if (value) { if (row.id) updateDrug(row.id, { stockStatus: value as any }); }
                      }}
                      items={[
                        { label: 'Update Status', value: '' },
                        { label: 'In Stock', value: 'In Stock' },
                        { label: 'Running Low', value: 'Low Stock' },
                        { label: 'Out of Stock', value: 'Out of Stock' },
                        { label: 'Delete Drug', value: 'delete' }
                      ]}
                      style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 120 }}
                    />
                  </View>
                )},
              ]}
              data={drugRegisterData}
            />
          </Card>
        )}

        {/* ── MORTALITY ── */}
        {activeTab === 'mortality' && (
          <Card
            title="Cull & Mortalities"
            style={styles.card}
            headerRight={
              <Button size="sm" onPress={() => setIsAddMortalityModalVisible(true)} style={styles.addButton}>
                + Add Record
              </Button>
            }
          >
            <DataTable
              columns={[
                { key: 'date', title: 'Date', width: 100 },
                { key: 'animalId', title: 'Animal ID', width: 100 },
                { key: 'cause', title: 'Cause', width: 120, render: (value: string) => (
                  <Text style={{ color: value === 'Disease' ? Colors.error[500] : Colors.warning[600] }}>{value}</Text>
                )},
                { key: 'observer', title: 'Observer', width: 120, render: (value: string) => (
                  <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontWeight: '500' }}>{value || '—'}</Text>
                )},
                { key: 'description', title: 'Description', width: 200, render: (value: string) => (
                  <Text numberOfLines={1} ellipsizeMode="tail">{value}</Text>
                )},
                {
                  key: 'actions',
                  title: 'Actions',
                  width: 80,
                  render: (_, row: any) => (
                    <TouchableOpacity 
                      onPress={() => handleEditMortalityRecord(row)}
                      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      style={{ padding: 4 }}
                    >
                      <Pencil size={18} color={Colors.primary[500]} />
                    </TouchableOpacity>
                  )
                },
              ]}
              data={mortalityData}
              emptyState={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No mortality records found</Text>
                  <Text style={[styles.emptyStateText, { color: Colors.neutral[500], marginTop: 4 }]}>
                    Click 'Add Record' to add a new mortality record
                  </Text>
                </View>
              }
            />
          </Card>
        )}

        {/* ── SALES ── */}
        {activeTab === 'sales' && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.totalsGrid}>
              <View style={styles.totalItem}>
                <Text variant="caption" color="neutral.500" weight="medium">Total Sales</Text>
                <Text variant="h4" weight="bold" color="success.500" style={{ marginTop: 4 }}>
                  ${totalSales.toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalItem}>
                <Text variant="caption" color="neutral.500" weight="medium">Total Purchases</Text>
                <Text variant="h4" weight="bold" color="error.500" style={{ marginTop: 4 }}>
                  ${totalPurchases.toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalItem}>
                <Text variant="caption" color="neutral.500" weight="medium">Net Profit/Loss</Text>
                <Text variant="h4" weight="bold" color={netProfitLoss >= 0 ? 'primary.500' : 'error.500'} style={{ marginTop: 4 }}>
                  {netProfitLoss >= 0 ? '+' : ''}${netProfitLoss.toFixed(2)}
                </Text>
              </View>
            </View>

            <Card
              title="Sales & Purchases"
              style={styles.card}
              headerRight={
                <Button size="sm" onPress={() => setIsAddTransactionModalVisible(true)} style={styles.addButton}>
                  + Add Record
                </Button>
              }
            >
              <DataTable
                columns={[
                  { key: 'date', title: 'Date', width: 100 },
                  { key: 'description', title: 'Description', width: 200 },
                  { key: 'amount', title: 'Amount', width: 100, render: (value: number) => (
                    <Text color={value >= 0 ? 'success.500' : 'error.500'}>{value >= 0 ? '+' : ''}{value}</Text>
                  )},
                  { key: 'type', title: 'Type', width: 100 },
                  {
                    key: 'actions',
                    title: 'Actions',
                    width: 100,
                    render: (_, row: any) => (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity 
                          onPress={() => handleEditTransaction(row)}
                          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                          style={{ padding: 4 }}
                        >
                          <Pencil size={18} color={Colors.primary[500]} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => {
                            Alert.alert(
                              'Delete Entry',
                              'Are you sure you want to delete this financial record?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                  text: 'Delete', 
                                  style: 'destructive', 
                                  onPress: async () => {
                                    if (row.id) {
                                      try {
                                        await deleteTransaction(row.id);
                                        alert('Transaction deleted successfully.');
                                      } catch (e: any) {
                                        alert('Failed to delete transaction: ' + e.message);
                                      }
                                    }
                                  } 
                                }
                              ]
                            );
                          }}
                          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                          style={{ padding: 4 }}
                        >
                          <Trash2 size={18} color="#E74C3C" />
                        </TouchableOpacity>
                      </View>
                    )
                  },
                ]}
                data={transactions}
              />
            </Card>
          </View>
        )}

        {/* ── FEED ── */}
        {activeTab === 'feed' && (
          <Card
            title="Feed Inventory"
            style={styles.card}
            headerRight={
              <Button size="sm" onPress={() => setIsAddFeedModalVisible(true)} style={styles.addButton}>
                + Add Feed
              </Button>
            }
          >
            <DataTable
              columns={[
                { key: 'id', title: 'ID', width: 70, render: (value: string) => <Text numberOfLines={1} style={{ fontSize: 11 }}>{value ? value.substring(0, 5) : '-'}</Text> },
                { key: 'name', title: 'Feed Name', width: 120 },
                { key: 'type', title: 'Type', width: 100 },
                { key: 'quantity', title: 'Quantity', width: 90, render: (value: string, row: any) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text>{value} </Text>
                    <Text variant="caption" color="neutral.500">({row.unit})</Text>
                  </View>
                )},
                { key: 'supplier', title: 'Supplier', width: 100 },
                { key: 'lastUpdated', title: 'Last Updated', width: 100 },
                { key: 'status', title: 'Status', width: 150, render: (value: string) => (
                  <View style={[styles.statusBadge, {
                    backgroundColor: value === 'In Stock' ? 'rgba(34, 197, 94, 0.1)' : value === 'Low Stock' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderColor: value === 'In Stock' ? Colors.success[400] : value === 'Low Stock' ? Colors.warning[400] : Colors.error[400],
                  }]}>
                    <Text color={value === 'In Stock' ? 'success.600' : value === 'Low Stock' ? 'warning.600' : 'error.600'} style={{ fontSize: 12, fontWeight: '500' }}>{value}</Text>
                  </View>
                )},
                { key: 'actions', title: 'Actions', width: 200, render: (_, row) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity 
                      onPress={() => handleEditFeedItem(row)}
                      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      style={{ padding: 4 }}
                    >
                      <Pencil size={18} color={Colors.primary[500]} />
                    </TouchableOpacity>
                    <Picker
                      value=""
                      onValueChange={(value) => {
                        if (value === 'delete') { if (row.id) deleteFeedInventoryItem(row.id); }
                        else if (value) { if (row.id) updateFeedInventoryItem(row.id, { status: value as any }); }
                      }}
                      items={[
                        { label: 'Update Status', value: '' },
                        { label: 'In Stock', value: 'In Stock' },
                        { label: 'Low Stock', value: 'Low Stock' },
                        { label: 'Out of Stock', value: 'Out of Stock' },
                        { label: 'Delete Feed', value: 'delete' }
                      ]}
                      style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 120 }}
                    />
                  </View>
                )},
              ]}
              data={feedInventory}
            />
          </Card>
        )}

      </ScrollView>

      {renderAddAnimalModal()}
      {renderEditAnimalModal()}
      {renderEditCalfModal()}
      {renderEditHealthRecordModal()}
      {renderEditBreedingRecordModal()}
      {renderEditPregnancyRecordModal()}
      {renderEditBullBreedingRecordModal()}
      {renderEditWeightRecordModal()}
      {renderEditDrugModal()}
      {renderEditMortalityRecordModal()}
      {renderEditTransactionModal()}
      {renderEditFeedModal()}
      {renderAddDrugModal()}
      {renderAddMortalityModal()}
      {renderAddBreedingRecordModal()}
      {renderAddTransactionModal()}
      {renderAddWeightRecordModal()}
      {renderAddFeedModal()}
      {renderAddPregnancyModal()}
      {renderAddHeatBreedingModal()}
      {renderAddHealthRecordModal()}
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    flexDirection: 'column',
  },
  modalScrollView: {
    marginBottom: 16,
  },
  modalScrollViewContent: {
    paddingBottom: 16,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    color: Colors.neutral[700],
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    color: Colors.neutral[900],
    backgroundColor: Colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
    justifyContent: 'center',
    minHeight: 44,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBody: {
    paddingVertical: 12,
  },
  modalButton: {
    marginLeft: 8,
    minWidth: 80,
  },
  closeButton: {
    fontSize: 24,
    padding: 8,
    color: Colors.neutral[500],
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: 5,
  },
  radioButton: {
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    marginRight: 10,
  },
  addButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  filter: {
    flex: 1,
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  totalItem: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    padding: 12,
    borderRadius: 8,
  },
  chartsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  chart: {
    flex: 1,
    alignItems: 'center',
  },
  chartTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    color: Colors.neutral[600],
  },

  incompleteIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.warning[500],
    marginLeft: 4,
  },
  editButton: {
    padding: 4,
  },
  disabledInput: {
    opacity: 0.6,
    backgroundColor: Colors.neutral[100],
  },
  disabledInputText: {
    color: Colors.neutral[600],
  },
  tabBar: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    maxHeight: 48,
    flexGrow: 0,
    flexShrink: 0,
  },
  tabBarContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary[500],
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  dpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dpModalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  dpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  dpCloseButton: {
    fontSize: 24,
    color: Colors.neutral[500],
    marginTop: -4,
  },
  calendarCustomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  navChevron: {
    padding: 6,
    minWidth: 28,
    alignItems: 'center',
  },
  navChevronText: {
    fontSize: 20,
    color: Colors.primary[500],
    fontWeight: 'bold',
  },
  calendarMonthTitle: {
    fontSize: 14,
    color: Colors.neutral[800],
    minWidth: 120,
    textAlign: 'center',
  },
  dpModalBody: {
    overflow: 'hidden',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    padding: 4,
  },
  dpModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  dpFooterButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});