import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Modal, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '../../components/typography/Text';
import { Card } from '../../components/ui/Card';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { Picker } from '../../components/inputs/Picker';
import { DataTable } from '../../components/tables/DataTable';
import { PieChart } from '../../components/charts/PieChart';
import Colors from '../../constants/Colors';
import { Stack, useRouter } from 'expo-router';


// Sample data for herd totals
const herdTotals = {
  cows: 120,
  bulls: 15,
  heifers: 45,
  steers: 30,
  maleCalves: 25,
  femaleCalves: 28
};

// Sample data for pie charts
interface PieChartData {
  name: string;
  population: number;
  color: string;
}

const breedDistribution: PieChartData[] = [
  { name: 'Brahman', population: 120, color: Colors.primary[500] },
  { name: 'Angus', population: 80, color: Colors.success[500] },
  { name: 'Hereford', population: 60, color: Colors.warning[500] },
  { name: 'Others', population: 40, color: Colors.neutral[500] },
];

const sourceDistribution: PieChartData[] = [
  { name: 'Born', population: 180, color: Colors.primary[500] },
  { name: 'Purchased', population: 120, color: Colors.success[500] },
];

const sexBreakdown: PieChartData[] = [
  { name: 'Male', population: 70, color: Colors.primary[500] },
  { name: 'Female', population: 193, color: Colors.accent[500] },
];

const stockTypeBreakdown: PieChartData[] = [
  { name: 'Cows', population: 120, color: Colors.success[500] },
  { name: 'Bulls', population: 15, color: Colors.error[500] },
  { name: 'Heifers', population: 45, color: Colors.warning[500] },
  { name: 'Steers', population: 30, color: Colors.secondary[500] },
  { name: 'Calves', population: 53, color: Colors.accent[500] },
];

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

// Sample data for feed inventory
const feedInventoryData = [
  {
    id: 'F001',
    name: 'Dairy Meal 18%',
    type: 'Cattle Feed',
    quantity: '250 kg',
    unit: '50kg bags',
    supplier: 'AgroFeeds',
    lastUpdated: '2025-07-01',
    status: 'In Stock'
  },
  {
    id: 'F002',
    name: 'Poultry Starter',
    type: 'Poultry Feed',
    quantity: '150 kg',
    unit: '25kg bags',
    supplier: 'Poultry Plus',
    lastUpdated: '2025-07-03',
    status: 'Low Stock'
  },
  {
    id: 'F003',
    name: 'Goat Pellets',
    type: 'Small Ruminant',
    quantity: '200 kg',
    unit: '40kg bags',
    supplier: 'Livestock Feeds',
    lastUpdated: '2025-06-28',
    status: 'In Stock'
  },
  {
    id: 'F004',
    name: 'Pig Grower',
    type: 'Swine Feed',
    quantity: '300 kg',
    unit: '50kg bags',
    supplier: 'ZimPig Feeds',
    lastUpdated: '2025-07-04',
    status: 'In Stock'
  },
];

// Filter options
const breedOptions = [
  { value: 'all', label: 'All' },
  { value: 'mashona', label: 'Mashona' },
  { value: 'brahman', label: 'Brahman' },
  { value: 'tuli', label: 'Tuli' },
  { value: 'nguni', label: 'Nguni' },
];

const sourceOptions = [
  { label: 'All', value: 'All' },
  { label: 'Born', value: 'Born' },
  { label: 'Purchased', value: 'Purchased' },
];

// Animal Health Record type
interface AnimalHealthRecord {
  id: string;
  animalId: string;
  date: string;
  treatment: string;
  status: 'Completed' | 'Scheduled' | 'Pending';
}

// Heat Detection and Breeding Record type
interface HeatBreedingRecord {
  id: string;
  earTagNumber: string;
  stockType: 'Cow' | 'Heifer' | 'Heifer (First Calf)' | 'Bull' | 'Steer';
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
    description: ''
  });
  const [newDrug, setNewDrug] = useState<Omit<DrugData, 'id'>>({ 
    drugClass: '',
    type: '',
    name: '',
    withdrawalPeriod: '',
    pregnancySafe: 'No',
    stockStatus: 'In Stock'
  });

  const handleAddDrug = () => {
    const newId = (drugRegisterData.length + 1).toString();
    setDrugRegisterData([...drugRegisterData, { ...newDrug, id: newId }]);
    setNewDrug({ 
      drugClass: '',
      type: '',
      name: '',
      withdrawalPeriod: '',
      pregnancySafe: 'No',
      stockStatus: 'In Stock'
    });
    setIsAddDrugModalVisible(false);
  };
  
  const handleAddMortality = () => {
    const newId = (mortalityData.length + 1).toString();
    setMortalityData([...mortalityData, { ...newMortality, id: newId }]);
    setNewMortality({
      date: new Date().toISOString().split('T')[0],
      animalId: '',
      cause: '',
      description: ''
    });
    setIsAddMortalityModalVisible(false);
  };

  const renderAddMortalityModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddMortalityModalVisible}
      onRequestClose={() => setIsAddMortalityModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Mortality Record</Text>
          
          <ScrollView>
            <View style={styles.formGroup}>
              <Text variant="body2" style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={newMortality.date}
                onChangeText={(text) => setNewMortality({...newMortality, date: text})}
                placeholder="YYYY-MM-DD"
              />
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
              disabled={!newMortality.animalId || !newMortality.cause}
            >
              Add Record
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddDrugModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddDrugModalVisible}
      onRequestClose={() => setIsAddDrugModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text variant="h6" weight="bold" style={styles.modalTitle}>Add New Drug</Text>
          
          <ScrollView>
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
              disabled={!newDrug.drugClass || !newDrug.name}
            >
              Add Drug
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBreed, setSelectedBreed] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isAddHealthRecordModalVisible, setIsAddHealthRecordModalVisible] = useState(false);
  const [isAddBreedingRecordModalVisible, setIsAddBreedingRecordModalVisible] = useState(false);
  const [showBreedingDatePicker, setShowBreedingDatePicker] = useState(false);
  const [isAddTransactionModalVisible, setIsAddTransactionModalVisible] = useState(false);
  const [isAddWeightRecordModalVisible, setIsAddWeightRecordModalVisible] = useState(false);
  const [isAddPregnancyModalVisible, setIsAddPregnancyModalVisible] = useState(false);
  const [herdRegisterData, setHerdRegisterData] = useState<AnimalData[]>([
    ...initialHerdRegisterData,
    { id: '3', unitNo: 'H078', tag: 'TAG789', age: '1y 3m', dateOfBirth: '2022-04-01', breed: 'Angus', sex: 'Female', stockType: 'Heifer', source: 'Born' },
    { id: '4', unitNo: 'S123', tag: 'TAG101', age: '2y 0m', dateOfBirth: '2021-07-01', breed: 'Hereford', sex: 'Male', stockType: 'Steer', source: 'Purchased' },
    { id: '5', unitNo: 'C102', tag: 'TAG202', age: '4y 6m', dateOfBirth: '2019-01-01', breed: 'Brahman', sex: 'Female', stockType: 'Cow', source: 'Purchased' },
  ]);
  const [pregnancyCalvingRecords, setPregnancyCalvingRecords] = useState<PregnancyCalvingRecord[]>(pregnancyCalvingData);
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
  const [healthRecords, setHealthRecords] = useState<AnimalHealthRecord[]>(animalHealthRecords);
  const [breedingRecords, setBreedingRecords] = useState<BullBreedingRecord[]>(bullBreedingSoundnessData);
  const [transactions, setTransactions] = useState(transactionData);
  const [weightRecords, setWeightRecords] = useState(weightData);
  const [feedInventory, setFeedInventory] = useState(feedInventoryData);
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
    deliveryType: 'Natural'
  });
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
    status: 'Pending'
  });

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
    
    // Update the herd register with the edited calf data
    const updatedHerdRegister = herdRegisterData.map(animal => 
      animal.id === editingCalf.id ? { ...editingCalf } : animal
    );
    
    setHerdRegisterData(updatedHerdRegister);
    setIsEditCalfModalVisible(false);
    setEditingCalf(null);
    
    // Show success message
    alert('Calf details updated successfully');
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
    id: `F${feedInventoryData.length + 100}`,
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

  // Function to check if a calf has weight records
  const hasWeightRecord = (tag: string) => {
    return weightData.some(record => record.id === tag);
  };

  const router = useRouter();

  const handleAddAnimal = () => {
    const newId = (herdRegisterData.length + 1).toString();
    setHerdRegisterData([...herdRegisterData, { ...newAnimal, id: newId }]);
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
      deliveryType: 'Natural'
    });
    setIsAddModalVisible(false);
  };

  const handleAddHealthRecord = () => {
    const newId = (healthRecords.length + 1).toString();
    setHealthRecords([...healthRecords, { ...newHealthRecord, id: newId }]);
    setNewHealthRecord({
      animalId: '',
      date: new Date().toISOString().split('T')[0],
      treatment: '',
      status: 'Pending'
    });
    setIsAddHealthRecordModalVisible(false);
  };

  const handleAddBreedingRecord = () => {
    if (!newBullBreedingRecord.bullId) return;
    setBreedingRecords([...breedingRecords, { ...newBullBreedingRecord, id: newBullBreedingRecord.bullId }]);
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
  };

  const handleAddTransaction = () => {
    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount)) return; // Basic validation

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

        const newAnimalData: AnimalData = {
          id: (herdRegisterData.length + 1).toString(),
          tag,
          dateOfBirth,
          breed,
          sex,
          stockType,
          source: 'Purchased',
          age,
        };
        setHerdRegisterData([...herdRegisterData, newAnimalData]);
      }
    }

    const transactionRecord = {
      id: (transactions.length + 1).toString(),
      date: newTransaction.date,
      description: newTransaction.description,
      amount: newTransaction.type === 'Sale' ? Math.abs(amount) : -Math.abs(amount),
      type: newTransaction.type,
    }

    setTransactions([...transactions, transactionRecord]);

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
  };

  const handleAddWeightRecord = () => {
    // Create a new record with all months, using empty string for months without values
    const newRecord = {
      ...newWeightRecord,
      id: newWeightRecord.tag,
      // Ensure all month fields are included, even if empty
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
    };

    setWeightRecords([...weightRecords, newRecord]);
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
    setIsAddWeightRecordModalVisible(false);
  };

  const handleAddFeed = () => {
    const newFeedItem = {
      ...newFeed,
      id: `F${feedInventory.length + 1}`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setFeedInventory([...feedInventory, newFeedItem]);
    // Reset the form
    setNewFeed({
      id: `F${feedInventory.length + 100}`,
      name: '',
      type: 'Cattle Feed',
      quantity: '',
      unit: 'kg',
      supplier: '',
      lastUpdated: new Date().toISOString().split('T')[0],
      status: 'In Stock'
    });
    setIsAddFeedModalVisible(false);
  };

  const renderAddHealthRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddHealthRecordModalVisible}
      onRequestClose={() => setIsAddHealthRecordModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Health Record</Text>
          
          <ScrollView 
          >
            <View style={styles.formGroup}>
              <Text variant="body2" style={styles.label}>Animal ID</Text>
              <TextInput
                style={styles.input}
                value={newHealthRecord.animalId}
                onChangeText={(text) => setNewHealthRecord({...newHealthRecord, animalId: text})}
                placeholder="e.g., A1001"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text variant="body2" style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={newHealthRecord.date}
                onChangeText={(text) => setNewHealthRecord({...newHealthRecord, date: text})}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
              />
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
              disabled={!newHealthRecord.animalId || !newHealthRecord.treatment}
            >
              Add Record
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddFeedModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddFeedModalVisible}
      onRequestClose={() => setIsAddFeedModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '80%', width: '90%' }]}>
          <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Feed to Inventory</Text>
          
          <ScrollView 
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
    </Modal>
  );

  const renderAddWeightRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddWeightRecordModalVisible}
      onRequestClose={() => setIsAddWeightRecordModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '80%', width: '90%' }]}>
          <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Weight Record</Text>
          
          <ScrollView 
          >
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
                  ...herdRegisterData.map(animal => ({
                    label: `${animal.tag} (${animal.breed})`,
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
              onPress={() => setIsAddWeightRecordModalVisible(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleAddWeightRecord}
              disabled={!newWeightRecord.tag}
            >
              Add Record
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddTransactionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddTransactionModalVisible}
      onRequestClose={() => setIsAddTransactionModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Sales/Purchase Record</Text>
          
          <ScrollView 
          >
            <View style={styles.formGroup}>
              <Text variant="body2" style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setSelectedDate(newTransaction.date ? new Date(newTransaction.date) : new Date());
                  setTransactionDatePickerVisibility(true);
                }}
              >
                <Text>{newTransaction.date || 'Select date'}</Text>
              </TouchableOpacity>

              <Modal
                visible={isTransactionDatePickerVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setTransactionDatePickerVisibility(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <DateTimePicker
                      value={selectedDate}
                      textColor={Colors.primary[500]}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, date) => {
                        if (date) {
                          setSelectedDate(date);
                        }
                      }}
                    />
                    <View style={styles.modalActions}>
                      
                      <Button
                        onPress={() => {
                          setNewTransaction({ ...newTransaction, date: selectedDate.toISOString().split('T')[0] });
                          setTransactionDatePickerVisibility(false);
                        }}
                      >
                        Done
                      </Button>
                    </View>
                  </View>
                </View>
              </Modal>
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
                  label="Select Animal*"
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
                    onPress={() => {
                      setSelectedDate(newTransaction.purchaseDetails.dateOfBirth ? new Date(newTransaction.purchaseDetails.dateOfBirth) : new Date());
                      setPurchaseDobPickerVisible(true);
                    }}
                  >
                    <Text>{newTransaction.purchaseDetails.dateOfBirth || 'Select date'}</Text>
                  </TouchableOpacity>

                  <Modal
                    visible={isPurchaseDobPickerVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setPurchaseDobPickerVisible(false)}
                  >
                    <View style={styles.modalContainer}>
                      <View style={styles.modalContent}>
                        <DateTimePicker
                          value={selectedDate}
                          textColor={Colors.primary[500]}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event, date) => {
                            if (date) {
                              setSelectedDate(date);
                            }
                          }}
                        />
                        <View style={styles.modalActions}>
                          
                          <Button
                            onPress={() => {
                              setNewTransaction({ ...newTransaction, purchaseDetails: { ...newTransaction.purchaseDetails, dateOfBirth: selectedDate.toISOString().split('T')[0] } });
                              setPurchaseDobPickerVisible(false);
                            }}
                          >
                            Done
                          </Button>
                        </View>
                      </View>
                    </View>
                  </Modal>
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
                    { label: 'Calf', value: 'Calf' },
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
              disabled={!newTransaction.description || !newTransaction.amount}
            >
              Add Record
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddBreedingRecordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddBreedingRecordModalVisible}
      onRequestClose={() => setIsAddBreedingRecordModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text variant="h6" weight="bold" style={styles.modalTitle}>Add Bull Breeding Record</Text>
          
          <ScrollView 
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

              <Modal
                visible={showBreedingDatePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowBreedingDatePicker(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text variant="h6">Select Date</Text>
                      <TouchableOpacity onPress={() => setShowBreedingDatePicker(false)}>
                        <Text style={styles.closeButton}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={selectedDate}
                      textColor={Colors.primary[500]}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, date) => {
                        if (date) {
                          setSelectedDate(date);
                        }
                      }}
                    />
                    <View style={styles.modalFooter}>
                      <Button
                        onPress={() => setShowBreedingDatePicker(false)}
                        variant="outline"
                        style={styles.modalButton}
                      >
                        Cancel
                      </Button>
                      <Button
                        onPress={() => {
                          const formattedDate = selectedDate.toISOString().split('T')[0];
                          setNewBullBreedingRecord({
                            ...newBullBreedingRecord,
                            date: formattedDate
                          });
                          setShowBreedingDatePicker(false);
                        }}
                        style={styles.modalButton}
                      >
                        Done
                      </Button>
                    </View>
                  </View>
                </View>
              </Modal>
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
              disabled={!newBullBreedingRecord.bullId || !newBullBreedingRecord.age || !newBullBreedingRecord.spermMotility || !newBullBreedingRecord.spermMorphology || !newBullBreedingRecord.scrotal || !newBullBreedingRecord.score}
            >
              Add Record
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddAnimalModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddModalVisible}
      onRequestClose={() => setIsAddModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text variant="h6" weight="bold" style={styles.modalTitle}>Add New Animal</Text>
          
          <ScrollView
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
              
              {showBirthDatePicker && (
                <DateTimePicker
                  textColor={Colors.neutral[800]}
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowBirthDatePicker(Platform.OS === 'ios');
                    if (date) {
                      const formattedDate = date.toISOString().split('T')[0];
                      setSelectedDate(date);
                      setNewAnimal(prev => ({
                        ...prev,
                        dateOfBirth: formattedDate
                      }));
                      
                      // Calculate age
                      const today = new Date();
                      let years = today.getFullYear() - date.getFullYear();
                      let months = today.getMonth() - date.getMonth();
                      if (months < 0 || (months === 0 && today.getDate() < date.getDate())) {
                        years--;
                        months += 12;
                      }
                      const ageText = years > 0 ? `${years}y ${months}m` : `${months}m`;
                      setNewAnimal(prev => ({
                        ...prev,
                        age: ageText
                      }));
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
              
              {newAnimal.age ? (
                <Text variant="caption" style={{marginTop: 4}}>Age: {newAnimal.age}</Text>
              ) : null}
            </View>
            
            <Picker
              label="Breed"
              value={newAnimal.breed}
              onValueChange={(value) => setNewAnimal({...newAnimal, breed: value})}
              items={[
                { label: 'Select Breed', value: '' },
                { label: 'Angus', value: 'Angus' },
                { label: 'Brahman', value: 'Brahman' },
                { label: 'Hereford', value: 'Hereford' },
                { label: 'Mashona', value: 'Mashona' },
                { label: 'Tuli', value: 'Tuli' },
                { label: 'Other', value: 'Other' }
              ]}
            />
            
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
                { label: 'Steer', value: 'Steer' },
                { label: 'Calf', value: 'Calf' }
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
                { label: 'Gift/Donation', value: 'Gift' },
                { label: 'Other', value: 'Other' }
              ]}
            />
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
              disabled={!newAnimal.tag || !newAnimal.dateOfBirth}
            >
              Add Animal
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddPregnancyModal = () => {
    const handleAddPregnancyRecord = () => {
      const newRecord: PregnancyCalvingRecord = {
        ...newPregnancyRecord,
        id: `P${(pregnancyCalvingRecords.length + 1).toString().padStart(3, '0')}` // Use the BCS from the form with fallback
      };
      console.log("here is are the logs for the newrecord:",newRecord)
      setPregnancyCalvingRecords([...pregnancyCalvingRecords, newRecord]);
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
        expectedReturnToHeatDate: ''
      });
      setIsAddPregnancyModalVisible(false);
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h6" style={styles.modalTitle}>Add Pregnancy Diagnosis Record</Text>
              <TouchableOpacity onPress={() => setIsAddPregnancyModalVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Picker
                  label="Select Cow*"
                  value={newPregnancyRecord.cowEarTag}
                  onValueChange={(value) => setNewPregnancyRecord({...newPregnancyRecord, cowEarTag: value})}
                  items={[
                    { label: 'Select a cow...', value: '' },
                    ...herdRegisterData
                      .filter(animal => animal.sex === 'Female' && ['Cow', 'Heifer', 'Heifer (First Calf)'].includes(animal.stockType))
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
                {showDatePicker.lastServiceDate && (
                  <DateTimePicker
                    value={new Date(newPregnancyRecord.lastServiceDate) || new Date()}
                    mode="date"
                    textColor='black'
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        const formattedDate = selectedDate.toISOString().split('T')[0];
                        setNewPregnancyRecord({
                          ...newPregnancyRecord,
                          lastServiceDate: formattedDate
                        });
                        // Recalculate expected calving date if gestation period is set
                        if (newPregnancyRecord.gestationPeriod > 0) {
                          const expectedDate = new Date(selectedDate);
                          expectedDate.setDate(selectedDate.getDate() + newPregnancyRecord.gestationPeriod);
                          setNewPregnancyRecord(prev => ({
                            ...prev,
                            expectedCalvingDate: expectedDate.toISOString().split('T')[0]
                          }));
                        }
                      }
                      toggleDatePicker('lastServiceDate');
                    }}
                  />
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
                {showDatePicker.expectedCalvingDate && (
                  <DateTimePicker
                    value={newPregnancyRecord.expectedCalvingDate ? new Date(newPregnancyRecord.expectedCalvingDate) : new Date()}
                    mode="date"
                    textColor='black'
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setNewPregnancyRecord({
                          ...newPregnancyRecord,
                          expectedCalvingDate: selectedDate.toISOString().split('T')[0]
                        });
                      }
                      toggleDatePicker('expectedCalvingDate');
                      console.log("here is are the logs for the newrecord for the part expectedCalvingDate:",newPregnancyRecord)
                    }}
                  />
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
                {showDatePicker.actualCalvingDate && (
                  <DateTimePicker
                    value={newPregnancyRecord.actualCalvingDate ? new Date(newPregnancyRecord.actualCalvingDate) : new Date()}
                    mode="date"
                    textColor='black'
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setNewPregnancyRecord({
                          ...newPregnancyRecord,
                          actualCalvingDate: selectedDate.toISOString().split('T')[0]
                        });
                      }
                      toggleDatePicker('actualCalvingDate');
                    }}
                  />
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
                disabled={!newPregnancyRecord.cowEarTag}
              >
                Add Record
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const handleAddHeatBreedingRecord = () => {
    if (!newHeatBreedingRecord.earTagNumber || !newHeatBreedingRecord.heatDetectionDate) {
      // Basic validation - ensure required fields are filled
      return;
    }

    const newRecord: HeatBreedingRecord = {
      ...newHeatBreedingRecord,
      id: `HB${(heatBreedingRecords.length + 1).toString().padStart(3, '0')}`,
    };
    
    setHeatBreedingRecords([...heatBreedingRecords, newRecord]);
    
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h6" style={styles.modalTitle}>Add Heat Detection & Breeding Record</Text>
              <TouchableOpacity onPress={() => setIsAddHeatBreedingModalVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
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
                      .filter(animal => ['Cow', 'Heifer', 'Heifer (First Calf)'].includes(animal.stockType))
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
                  onPress={() => {
                    setSelectedDate(newHeatBreedingRecord.heatDetectionDate 
                      ? new Date(newHeatBreedingRecord.heatDetectionDate) 
                      : new Date());
                    setShowHeatDatePicker(true);
                  }}
                >
                  <Text>{newHeatBreedingRecord.heatDetectionDate || 'Select date'}</Text>
                </TouchableOpacity>
                
                {/* Date Picker Modal - Reusable for both date fields */}
                <Modal
                  visible={showHeatDatePicker || showServicedDatePicker || showReturnToHeatDatePicker || showDateServed2Picker || showReturnToHeat2DatePicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => {
                    setShowHeatDatePicker(false);
                    setShowServicedDatePicker(false);
                    setShowReturnToHeatDatePicker(false);
                    setShowDateServed2Picker(false);
                    setShowReturnToHeat2DatePicker(false);
                  }}
                >
                  <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <Text variant="h6">
                          {currentDateField === 'heat' 
                            ? 'Heat Detection Date' 
                            : currentDateField === 'serviced' 
                              ? 'Serviced Date' 
                              : currentDateField === 'returnToHeat'
                                ? 'Return to Heat Date (1st)'
                                : currentDateField === 'dateServed2'
                                  ? 'Date Served (2nd)'
                                  : 'Return to Heat Date (2nd)'}
                        </Text>
                        <TouchableOpacity onPress={() => {
                          setShowHeatDatePicker(false);
                          setShowServicedDatePicker(false);
                          setShowReturnToHeatDatePicker(false);
                          setShowDateServed2Picker(false);
                          setShowReturnToHeat2DatePicker(false);
                        }}>
                          <Text style={styles.closeButton}>×</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={selectedDate}
                        textColor={Colors.primary[500]} 
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, date) => {
                          if (date) {
                            setSelectedDate(date);
                          }
                        }}
                      />
                      <View style={styles.modalFooter}>
                        <Button 
                          onPress={() => {
                            setShowHeatDatePicker(false);
                            setShowServicedDatePicker(false);
                            setShowReturnToHeatDatePicker(false);
                            setShowDateServed2Picker(false);
                            setShowReturnToHeat2DatePicker(false);
                          }}
                          variant="outline"
                          style={styles.modalButton}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onPress={() => {
                            const formattedDate = selectedDate.toISOString().split('T')[0];
                            if (currentDateField === 'heat') {
                              setNewHeatBreedingRecord({
                                ...newHeatBreedingRecord,
                                heatDetectionDate: formattedDate
                              });
                              setShowHeatDatePicker(false);
                            } else if (currentDateField === 'serviced') {
                              setNewHeatBreedingRecord({
                                ...newHeatBreedingRecord,
                                servicedDate: formattedDate
                              });
                              setShowServicedDatePicker(false);
                            } else if (currentDateField === 'returnToHeat') {
                              setNewHeatBreedingRecord({
                                ...newHeatBreedingRecord,
                                returnToHeatDate1: formattedDate
                              });
                              setShowReturnToHeatDatePicker(false);
                            } else if (currentDateField === 'dateServed2') {
                              setNewHeatBreedingRecord({
                                ...newHeatBreedingRecord,
                                dateServed2: formattedDate
                              });
                              setShowDateServed2Picker(false);
                            } else {
                              setNewHeatBreedingRecord({
                                ...newHeatBreedingRecord,
                                returnToHeatDate2: formattedDate
                              });
                              setShowReturnToHeat2DatePicker(false);
                            }
                          }}
                          style={styles.modalButton}
                        >
                          Done
                        </Button>
                      </View>
                    </View>
                  </View>
                </Modal>
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
                  onPress={() => {
                    setSelectedDate(newHeatBreedingRecord.servicedDate 
                      ? new Date(newHeatBreedingRecord.servicedDate) 
                      : new Date());
                    setCurrentDateField('serviced');
                    setShowServicedDatePicker(true);
                  }}
                >
                  <Text>{newHeatBreedingRecord.servicedDate || 'Select date'}</Text>
                </TouchableOpacity>
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
                  onPress={() => {
                    setSelectedDate(newHeatBreedingRecord.returnToHeatDate1 
                      ? new Date(newHeatBreedingRecord.returnToHeatDate1) 
                      : new Date());
                    setCurrentDateField('returnToHeat');
                    setShowReturnToHeatDatePicker(true);
                  }}
                >
                  <Text>{newHeatBreedingRecord.returnToHeatDate1 || 'Select date'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date Served (2nd)</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => {
                    setSelectedDate(newHeatBreedingRecord.dateServed2 
                      ? new Date(newHeatBreedingRecord.dateServed2) 
                      : new Date());
                    setCurrentDateField('dateServed2');
                    setShowDateServed2Picker(true);
                  }}
                >
                  <Text>{newHeatBreedingRecord.dateServed2 || 'Select date'}</Text>
                </TouchableOpacity>
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
                  onPress={() => {
                    setSelectedDate(newHeatBreedingRecord.returnToHeatDate2 
                      ? new Date(newHeatBreedingRecord.returnToHeatDate2) 
                      : new Date());
                    setCurrentDateField('returnToHeat2');
                    setShowReturnToHeat2DatePicker(true);
                  }}
                >
                  <Text>{newHeatBreedingRecord.returnToHeatDate2 || 'Select date'}</Text>
                </TouchableOpacity>
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
                disabled={!newHeatBreedingRecord.earTagNumber || !newHeatBreedingRecord.heatDetectionDate}
              >
                Add Record
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScreenContainer>

      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Herd at a Glance Section */}
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
                data={sourceDistribution}
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

        {/* Herd Register Section */}
        <Card 
          title="Herd Register" 
          style={styles.card}
          headerRight={
            <Button 
              size="sm" 
              onPress={() => setIsAddModalVisible(true)}
              style={styles.addButton}
            >
              + Add Animal
            </Button>
          }
        >
          <DataTable
            columns={[
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
            ]}
            data={herdRegisterData}
          />
          {renderAddAnimalModal()}
        </Card>

        {/* Calf Register Section */}
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
              { 
                key: 'tag', 
                title: 'Calf ID', 
                width: 120,
                render: (value: string) => <Text>{value}</Text>
              },
              { 
                key: 'sex', 
                title: 'Sex', 
                width: 70,
                render: (value: string) => (
                  <Text color={value === 'Male' ? 'primary.500' : 'accent.500'}>{value}</Text>
                )
              },
              { 
                key: 'age', 
                title: 'Age', 
                width: 70,
                render: (value: string) => <Text>{value}</Text>
              },
              { 
                key: 'weight', 
                title: 'Weight', 
                width: 90,
                render: (value: any) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {value ? (
                      <Text>{value.weight} kg</Text>
                    ) : (
                      <Text style={{ color: Colors.neutral[400] }}>No data</Text>
                    )}
                  </View>
                )
              },
              { 
                key: 'breed', 
                title: 'Breed', 
                width: 100,
                render: (value: string) => <Text>{value || '-'}</Text>
              },
              { 
                key: 'source', 
                title: 'Source', 
                width: 90,
                render: (value: string) => <Text>{value || '-'}</Text>
              },
              { 
                key: 'observer', 
                title: 'Observer', 
                width: 200,
                render: (value: string, row: any) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text>{value || '-'}</Text>
                    <TouchableOpacity 
                      onPress={() => handleEditCalf(row)}
                      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      style={{ padding: 4, marginLeft: 8 }}
                    >
                      <Text>✏️</Text>
                    </TouchableOpacity>
                  </View>
                )
              }
            ]}
            data={getCalves().map(calf => ({
              ...calf,
              weight: getCalfWeight(calf.tag)
            }))}
            emptyState={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No calves found</Text>
                <Text style={[styles.emptyStateText, { color: Colors.neutral[500], marginTop: 4 }]}>
                  Calves are automatically shown here when added to the herd register
                </Text>
              </View>
            }
          />
          
          {/* Edit Calf Modal */}
          <Modal
            visible={isEditCalfModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsEditCalfModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { maxHeight: '80%', width: '90%' }]}>

                <View style={styles.modalHeader}>
                  <Text variant="h6" style={styles.modalTitle}>
                    {editingCalf ? `Edit Calf ${editingCalf.tag}` : 'Edit Calf Details'}
                  </Text>
                  <TouchableOpacity onPress={() => setIsEditCalfModalVisible(false)}>
                    <Text>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView 
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
                  
                  <View style={styles.formGroup}>
                    <Text variant="body2" style={styles.label}>Birth Weight (kg)</Text>
                    <TextInput
                      style={[styles.input, styles.disabledInput]}
                      value={editingCalf?.birthWeight || ''}
                      editable={false}
                      placeholder="e.g. 35.5"
                    />
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
          </Modal>
        </Card>

        {/* Drug Register Section */}
        <Card 
          title="Drug Register" 
          style={styles.card}
          headerRight={
            <Button 
              size="sm" 
              onPress={() => setIsAddDrugModalVisible(true)}
              style={styles.addButton}
            >
              + Add Drug
            </Button>
          }
        >
          <DataTable
            columns={[
              { key: 'drugClass', title: 'Class', width: 100 },
              { key: 'type', title: 'Type', width: 80 },
              { key: 'name', title: 'Name', width: 120 },
              { 
                key: 'pregnancySafe', 
                title: 'Preg. Safe', 
                width: 80,
                render: (value: string) => (
                  <Text color={value === 'Yes' ? 'success.500' : 'error.500'}>{value}</Text>
                )
              },
              { key: 'withdrawalPeriod', title: 'Withdrawal', width: 120 },
              { 
                key: 'stockStatus', 
                title: 'Stock Status', 
                width: 120,
                render: (value: string) => (
                  <View style={{ 
                    padding: 4, 
                    borderRadius: 4, 
                    backgroundColor: 
                      value === 'In Stock' ? 'rgba(34, 197, 94, 0.1)' :
                      value === 'Low Stock' ? 'rgba(234, 179, 8, 0.1)' :
                      'rgba(239, 68, 68, 0.1)'
                  }}>
                    <Text 
                      color={
                        value === 'In Stock' ? 'success.600' :
                        value === 'Low Stock' ? 'warning.600' :
                        'error.600'
                      }
                      style={{ textAlign: 'center' }}
                    >
                      {value}
                    </Text>
                  </View>
                )
              },
              {
                key: 'actions',
                title: 'Actions',
                width: 200,
                render: (_, row) => (
                    <Picker
                      value=""
                      onValueChange={(value) => {
                        if (value === 'delete') {
                          setDrugRegisterData(drugRegisterData.filter(drug => drug.id !== row.id));
                        } else if (value) {
                          setDrugRegisterData(drugRegisterData.map(drug => 
                            drug.id === row.id ? { ...drug, stockStatus: value as DrugData['stockStatus'] } : drug
                          ));
                        }
                      }}
                      items={[
                        { label: 'Update Status', value: '' },
                        { label: 'In Stock', value: 'In Stock' },
                        { label: 'Running Low', value: 'Low Stock' },
                        { label: 'Out of Stock', value: 'Out of Stock' },
                        { label: 'Delete Drug', value: 'delete' }
                      ]}
                      style={{ 
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        minWidth: 120
                      }}
                    />
                )
              },
            ]}
            data={drugRegisterData}
          />
          {renderAddDrugModal()}
        </Card>

        {/* Cull & Mortalities Section */}
        <Card 
          title="Cull & Mortalities" 
          style={styles.card}
          headerRight={
            <Button 
              size="sm" 
              onPress={() => setIsAddMortalityModalVisible(true)}
              style={styles.addButton}
            >
              + Add Record
            </Button>
          }
        >
          <DataTable
            columns={[
              { key: 'id', title: 'ID', width: 60 },
              { key: 'date', title: 'Date', width: 100 },
              { key: 'animalId', title: 'Animal ID', width: 100 },
              { 
                key: 'cause', 
                title: 'Cause', 
                width: 120,
                render: (value: string) => (
                  <Text style={{ color: value === 'Disease' ? Colors.error[500] : Colors.warning[600] }}>
                    {value}
                  </Text>
                )
              },
              { 
                key: 'description', 
                title: 'Description', 
                width: 200,
                render: (value: string) => (
                  <Text numberOfLines={1} ellipsizeMode="tail">
                    {value}
                  </Text>
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
          {renderAddMortalityModal()}
        </Card>

        {/* Animal Health Records Section */}
        <Card
          title="Animal Health Records"
          style={styles.card}
          headerRight={
            <Button size="sm" onPress={() => setIsAddHealthRecordModalVisible(true)} style={styles.addButton}>
              + Add Record
            </Button>
          }
        >
          <DataTable
            columns={[
              { key: 'date', title: 'Date', width: 100 },
              { key: 'animalId', title: 'Animal ID', width: 100 },
              { key: 'treatment', title: 'Treatment', width: 200 },
              { 
                key: 'status', 
                title: 'Status', 
                width: 100,
                render: (value: string) => (
                  <View style={[
                    styles.statusBadge, 
                    { 
                      backgroundColor: value === 'Completed' ? '#DCF7E8' : 
                                    value === 'Scheduled' ? '#E0F2FE' : '#FEF3C7',
                    }
                  ]}>
                    <Text 
                      variant="caption" 
                      style={{ 
                        color: value === 'Completed' ? Colors.success[700] : 
                              value === 'Scheduled' ? Colors.primary[700] : Colors.warning[700],
                        fontWeight: '500',
                      }}
                    >
                      {value}
                    </Text>
                  </View>
                )
              },
            ]}
            data={healthRecords}
          />
          {renderAddHealthRecordModal()}
        </Card>

        {/* Bull Breeding Soundness Section */}
        <Card 
          title="Bull Breeding Soundness" 
          style={styles.card}
          headerRight={
            <Button 
              size="sm" 
              onPress={() => setIsAddBreedingRecordModalVisible(true)}
              style={styles.addButton}
            >
              + Add Record
            </Button>
          }
        >
          <DataTable
            columns={[
              { key: 'date', title: 'Date', width: 80 },
              { key: 'id', title: 'Bull ID', width: 80 },
              { key: 'age', title: 'Age', width: 80 },
              { 
                key: 'pe', 
                title: 'PE', 
                width: 100,
                render: (value: string) => (
                  <Text color={
                    value === 'Excellent' ? 'success.500' : 
                    value === 'Good' ? 'primary.500' : 'error.500'
                  }>
                    {value}
                  </Text>
                )
              },
              { key: 'spermMotility', title: 'Sperm Motility', width: 100 },
              { key: 'spermMorphology', title: 'Sperm Morphology', width: 150 },
              { key: 'scrotal', title: 'Scrotal (cm)', width: 90 },
              { 
                key: 'libido', 
                title: 'Libido', 
                width: 90,
                render: (value: string) => (
                  <Text color={
                    value === 'Excellent' ? 'success.500' : 
                    value === 'Good' ? 'primary.500' : 'error.500'
                  }>
                    {value}
                  </Text>
                )
              },
              { key: 'score', title: 'Score', width: 80 },
              { 
                key: 'classification', 
                title: 'Classification', 
                width: 210,
                render: (value: string) => (
                  <Text color={
                    value === 'SPB' ? 'success.500' : 
                    value === 'USPB' ? 'error.500' : 'warning.500'
                  }>
                    {value}
                  </Text>
                )
              },
            ]}
            data={breedingRecords}
          />
          {renderAddBreedingRecordModal()}
        </Card>

        {/* Sales & Purchases Section */}
        <Card 
          title="Sales & Purchases" 
          style={styles.card}
          headerRight={
            <Button 
              size="sm" 
              onPress={() => setIsAddTransactionModalVisible(true)}
              style={styles.addButton}
            >
              + Add Record
            </Button>
          }
        >
          <DataTable
            columns={[
              { key: 'date', title: 'Date', width: 100 },
              { key: 'description', title: 'Description', width: 200 },
              { 
                key: 'amount', 
                title: 'Amount', 
                width: 100,
                render: (value: number) => (
                  <Text color={value >= 0 ? 'success.500' : 'error.500'}>
                    {value >= 0 ? '+' : ''}{value}
                  </Text>
                )
              },
              { key: 'type', title: 'Type', width: 100 },
            ]}
            data={transactions}
          />
          {renderAddTransactionModal()}
        </Card>

        {/* Weight Record Section */}
        <Card 
          title="Weight Record" 
          style={styles.card}
          headerRight={
            <Button 
              size="sm" 
              onPress={() => setIsAddWeightRecordModalVisible(true)}
              style={styles.addButton}
            >
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
              ]}
              data={weightRecords}
            />
          </ScrollView>
          {renderAddWeightRecordModal()}
        </Card>

        {/* Feed Inventory Section */}
        <Card 
          title="Feed Inventory" 
          style={styles.card}
          headerRight={
            <Button 
              size="sm" 
              onPress={() => setIsAddFeedModalVisible(true)}
              style={styles.addButton}
            >
              + Add Feed
            </Button>
          }
        >
          <DataTable
            columns={[
              { key: 'id', title: 'ID', width: 70 },
              { key: 'name', title: 'Feed Name', width: 120 },
              { key: 'type', title: 'Type', width: 100 },
              { 
                key: 'quantity', 
                title: 'Quantity', 
                width: 90,
                render: (value: string, row: any) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text>{value} </Text>
                    <Text variant="caption" color="neutral.500">({row.unit})</Text>
                  </View>
                )
              },
              { key: 'supplier', title: 'Supplier', width: 100 },
              { key: 'lastUpdated', title: 'Last Updated', width: 100 },
              { 
                key: 'status', 
                title: 'Status', 
                width: 150,
                render: (value: string) => (
                  <View 
                    style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: 
                          value === 'In Stock' ? 'rgba(34, 197, 94, 0.1)' :
                          value === 'Low Stock' ? 'rgba(234, 179, 8, 0.1)' :
                          'rgba(239, 68, 68, 0.1)',
                        borderColor: 
                          value === 'In Stock' ? Colors.success[400] :
                          value === 'Low Stock' ? Colors.warning[400] :
                          Colors.error[400],
                      }
                    ]}
                  >
                    <Text 
                      color={
                        value === 'In Stock' ? 'success.600' :
                        value === 'Low Stock' ? 'warning.600' :
                        'error.600'
                      }
                      style={{ fontSize: 12, fontWeight: '500' }}
                    >
                      {value}
                    </Text>
                  </View>
                )
              },
            ]}
            data={feedInventory}
          />
          {renderAddFeedModal()}
        </Card>

        {/* Heat Detection & Breeding Section */}
        <Card 
          title="Heat Detection & Breeding" 
          style={styles.card}
          headerRight={
            <Button 
              size="sm" 
              onPress={() => setIsAddHeatBreedingModalVisible(true)}
              style={styles.addButton}
            >
              + Add Record
            </Button>
          }
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <DataTable
              columns={[
                { key: 'earTagNumber', title: 'Ear Tag', width: 100 },
                { key: 'stockType', title: 'Type', width: 80 },
                { key: 'bodyConditionScore', title: 'BCS', width: 70, render: (value: number) => value?.toFixed(1) },
                { key: 'heatDetectionDate', title: 'Heat Date', width: 100 },
                { 
                  key: 'breedingStatus', 
                  title: 'Status', 
                  width: 120,
                  render: (value: string) => (
                    <Text color={
                      value === 'Bred' ? 'success.500' : 
                      value === 'Confirmed Pregnant' ? 'primary.500' : 
                      'neutral.500'
                    }>
                      {value}
                    </Text>
                  )
                },
                { key: 'breedingMethod', title: 'Method', width: 80 },
                { key: 'servicedDate', title: 'Serviced', width: 100 },
              ]}
              data={heatBreedingRecords}
            />
          </ScrollView>
        </Card>

        {/* Pregnancy Diagnosis and Calving Section */}
        <Card 
          title="Pregnancy & Calving" 
          style={styles.card}
          headerRight={
            <Button 
              size="sm" 
              onPress={() => setIsAddPregnancyModalVisible(true)}
              style={styles.addButton}
            >
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
                { 
                  key: 'firstTrimesterPD', 
                  title: '1st Tri PD', 
                  width: 90,
                  render: (value: string) => (
                    <Text color={
                      value === 'Positive' ? 'success.500' : 
                      value === 'Negative' ? 'error.500' : 
                      value === 'Inconclusive' ? 'warning.500' : 'neutral.500'
                    }>
                      {value}
                    </Text>
                  )
                },
                { 
                  key: 'secondTrimesterPD', 
                  title: '2nd Tri PD', 
                  width: 90,
                  render: (value: string) => (
                    <Text color={
                      value === 'Positive' ? 'success.500' : 
                      value === 'Negative' ? 'error.500' : 
                      value === 'Inconclusive' ? 'warning.500' : 'neutral.500'
                    }>
                      {value}
                    </Text>
                  )
                },
                { 
                  key: 'thirdTrimesterPD', 
                  title: '3rd Tri PD', 
                  width: 90,
                  render: (value: string) => (
                    <Text color={
                      value === 'Positive' ? 'success.500' : 
                      value === 'Negative' ? 'error.500' : 
                      value === 'Inconclusive' ? 'warning.500' : 'neutral.500'
                    }>
                      {value}
                    </Text>
                  )
                },
                { key: 'gestationPeriod', title: 'Gestation (days)', width: 100 },
                { key: 'expectedCalvingDate', title: 'Exp. Calving', width: 150 },
                { key: 'actualCalvingDate', title: 'Actual Calving', width: 200 },
              ]}
              data={pregnancyCalvingRecords}
            />
          </ScrollView>
          {renderAddPregnancyModal()}
        </Card>

        {/* Heat Detection and Breeding Section */}
        <Card 
          title="Heat & Breeding" 
          style={styles.card}
          headerRight={
            <Button 
              size="sm" 
              onPress={() => setIsAddHeatBreedingModalVisible(true)}
              style={styles.addButton}
            >
              + Add Record
            </Button>
          }
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <DataTable
              columns={[
                { key: 'earTagNumber', title: 'Ear Tag', width: 90 },
                { key: 'stockType', title: 'Stock Type', width: 120 },
                { 
                  key: 'bodyConditionScore', 
                  title: 'BCS', 
                  width: 70, 
                  render: (value: number) => value?.toFixed(1) 
                },
                { key: 'heatDetectionDate', title: 'Heat Detected', width: 100 },
                { key: 'observer', title: 'Observer', width: 100 },
                { key: 'servicedDate', title: 'Serviced Date', width: 100 },
                { 
                  key: 'breedingStatus', 
                  title: 'Status', 
                  width: 100,
                  render: (value: string) => (
                    <Text 
                      color={
                        value === 'Confirmed Pregnant' ? 'success.500' :
                        value === 'Bred' ? 'primary.500' :
                        value === 'Open' ? 'warning.500' : 'error.500'
                      }
                    >
                      {value}
                    </Text>
                  )
                },
                { key: 'breedingMethod', title: 'Method', width: 90 },
                { key: 'aiTechnician', title: 'AI Tech', width: 100 },
                { 
                  key: 'sireId', 
                  title: 'Sire/Straw ID', 
                  width: 120,
                  render: (_: any, record: HeatBreedingRecord) => 
                    record.breedingMethod === 'AI' 
                      ? `${record.sireId || ''} / ${record.strawId || ''}` 
                      : record.sireId || ''
                },
                { 
                  key: 'semenViability', 
                  title: 'Viability %', 
                  width: 90,
                  render: (value: number) => value ? `${value}%` : 'N/A'
                },
                { key: 'returnToHeatDate1', title: 'Return to Heat 1', width: 110 },
                { key: 'dateServed2', title: 'Date Served 2', width: 100 },
                { key: 'breedingMethod2', title: 'Method 2', width: 90 },
                { key: 'sireUsed2', title: 'Sire Used 2', width: 100 },
                { key: 'returnToHeatDate2', title: 'Return to Heat 2', width: 200 },
              ]}
              data={heatBreedingRecords}
            />
          </ScrollView>
          {renderAddHeatBreedingModal()}
        </Card>
      </ScrollView>
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
  
});
