import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TYPE DEFINITIONS ---

export interface Animal {
  id: string;
  tag: string;
  age: string; // e.g. "4y 2m"
  dateOfBirth: string;
  breed: string;
  sex: 'Male' | 'Female';
  stockType: 'Cow' | 'Heifer' | 'Bull' | 'Steer' | 'Calve' | 'Goat' | 'Sheep' | 'Pig' | 'Chicken' | 'Bullying Heifer';
  source: 'Born' | 'Purchased';
  weight?: number; // current weight in kg
  previousWeight?: number; // previous weight in kg
  daysBetweenWeights?: number; // days elapsed between weights
  bcs?: number; // Body Condition Score (1.0 to 5.0)
  isBreedingCow?: boolean;
  observer?: string;
  birthWeight?: string;
  deliveryType?: 'Natural' | 'Assisted' | 'C-Section';
  sire?: string;
  dam?: string;
  dateOfWeaning?: string;
  weaningWeight?: number;
  description?: string;
  weight30day?: number;
  weight100day?: number;
  weight1weekPostWeaning?: number;
  weight6monthsPostWeaning?: number;
  calfStatus?: 'Active' | 'Replacement' | 'Sold';
  preWeaningMortality?: boolean;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  date: string;
  treatment: string;
  withdrawalPeriod?: string;
  pregnancySafe?: 'Yes' | 'No';
  status: 'Completed' | 'Scheduled' | 'Pending';
  specialNotes?: string;
  doneBy?: string;
}

export interface BreedingRecord {
  id: string;
  earTagNumber: string;
  stockType: 'Cow' | 'Heifer' | 'Goat' | 'Sheep' | 'Pig' | 'Bullying Heifer';
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
  breedingMethod2?: 'AI' | 'Natural';
  sireUsed2?: string;
  returnToHeatDate2?: string;
}

export interface PregnancyRecord {
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
}

export interface FeedRecord {
  id: string;
  animalGroup: string;
  feedType: string;
  quantityConsumed: number; // in kg
  costPerKg: number;
  date: string;
}

export interface ProductionRecord {
  id: string;
  animalId: string;
  type: 'Milk' | 'Eggs' | 'Wool' | 'Weight';
  quantity: number; // liters, count, kg
  date: string;
}

export interface MortalityRecord {
  id: string;
  animalId: string;
  date: string;
  cause: string;
  description: string;
  observer?: string;
  isPreWeaning: boolean;
}

export interface TransactionRecord {
  id: string;
  date: string;
  description: string;
  amount: number; // positive for sale, negative for purchase
  type: 'Sale' | 'Purchase';
}

export interface Drug {
  id: string;
  drugClass: string;
  type: string;
  name: string;
  withdrawalPeriod: string;
  pregnancySafe: 'Yes' | 'No';
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated?: string;
}

export interface FeedInventoryItem {
  id: string;
  name: string;
  type: string;
  quantity: string;
  unit: string;
  supplier?: string;
  lastUpdated: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}


export interface BullBreedingRecord {
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
}

export interface AnimalWeight {
  id: string;
  animalTag: string;
  year: number;
  jan?: string;
  feb?: string;
  mar?: string;
  apr?: string;
  may?: string;
  jun?: string;
  jul?: string;
  aug?: string;
  sep?: string;
  oct?: string;
  nov?: string;
  dec?: string;
}

export interface MetricOverride {
  attained: string;
  target: string;
}

export interface RecordsOverrides {
  [key: string]: MetricOverride;
}

export interface PregnancyMetricOverride {
  attained?: string;
  target?: string;
}

export interface PregnancyOverrides {
  conceptionRate?: PregnancyMetricOverride;
  incalfRate42d?: PregnancyMetricOverride;
  incalfRate100d?: PregnancyMetricOverride;
  firstTrimesterPD?: PregnancyMetricOverride;
  secondTrimesterPD?: PregnancyMetricOverride;
  thirdTrimesterPD?: PregnancyMetricOverride;
  lastUpdated?: string;
}

export interface FarmInspection {
  // Nutrition (1-5)
  herdBcs: number;
  nutritionalDeficiencies: number; // 1 = yes, 5 = no (calculated average)
  dungConsistency: number;
  rumenFill: number;
  coatSkin: number;
  motilityLocomotion: number;
  growthRatePerception: number; // calculated average from growth questionnaire
  muscleDefinition: number;
  frameSizing: number;
  fatCoverDevelopment: number;
  skeletalSymmetry: number;
  overallNutritionalHealth: number; // calculated average from management questionnaire
  bunkFeedAvailability: number;
  rationSortingBehaviour: number;
  waterQualityAccess: number;
  forageQualityPerception: number;

  // Genetics (1-5)
  overallGeneticReproductivePerformance: number;
  overallGeneticQuality: number;
  // Health (1-5)
  vaccinationCoverage: number; // calculated average from vaccination questionnaire
  vaccProtocolAdherence: number;
  vaccHerdPenetration: number;
  vaccTimingAccuracy: number;
  vaccColdChainIntegrity: number;
  biosecurityRating: number; // calculated average from biosecurity questionnaire
  quarantineIntakeIsolation: number;
  herdTrackingMovementLogs: number;
  farmBoundaryPestControl: number;
  sanitationVisitorControl: number;
  dewormingPractice: number; // calculated average from deworming questionnaire
  dewormingTiming: number;
  dewormingRotation: number;
  dewormingPrecision: number;
  dewormingTargeted: number;
  prudentAnthelmintic: number; // calculated average from anthelmintic questionnaire
  anthelminticClassSelection: number;
  anthelminticAdminRoute: number;
  anthelminticEquipmentCalib: number;
  anthelminticWithholdingComp: number;
  prudentAntibiotics: number; // calculated average from antibiotic questionnaire
  antibioticPrescriptionControl: number;
  antibioticDrugClassification: number;
  antibioticTreatmentRecords: number;
  antibioticCourseCompletion: number;
  drugBoxManagement: number; // calculated average from drug box questionnaire
  dbExpiryInventory: number;
  dbStorageCleanliness: number;
  dbSecurityAccess: number;
  dbDisposalPractices: number;
  cpdStaffControl: number; // calculated average from CPD questionnaire
  cpdTrainingFrequency: number;
  cpdProtocolAwareness: number;
  cpdVetCollaboration: number;
  cpdBenchmarkTracking: number;
  // Records (1-5)
  recordsSatisfaction: number;
  recordsTraceability: number;
  recordAccessibilityUsage: number;
  recordsTrainingEvidence: number;
  maintainsBirth: boolean;
  maintainsMovements: boolean;
  maintainsHealth: boolean;
  maintainsMortalities: boolean;
  maintainsFeed: boolean;
  recordsOverrides?: RecordsOverrides;
  pregnancyOverrides?: PregnancyOverrides;
  updatedAt?: string;
}

export interface FarmEvent {
  id: string;
  date: string;
  type: string;
  event: string;
  tag: string;
  diagnosis: string;
  notes: string;
  doneBy: string;
  status: 'pending' | 'completed' | 'overdue';
}

export interface TodoTask {
  id: string;
  date: string;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  createdBy: string;
  lastEdited: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Observation {
  id: string;
  date: string;
  tag: string;
  observation: string;
  observer: string;
  severity: 'high' | 'medium' | 'low';
  status: 'resolved' | 'unresolved';
}

interface FarmDataContextProps {
  animals: Animal[];
  healthRecords: HealthRecord[];
  breedingRecords: BreedingRecord[];
  pregnancyRecords: PregnancyRecord[];
  feedRecords: FeedRecord[];
  productionRecords: ProductionRecord[];
  mortalityRecords: MortalityRecord[];
  transactions: TransactionRecord[];
  farmInspection: FarmInspection;
  bullBreedingRecords: BullBreedingRecord[];
  animalWeights: AnimalWeight[];
  drugs: Drug[];
  feedInventory: FeedInventoryItem[];
  farmEvents: FarmEvent[];
  todoList: TodoTask[];
  observations: Observation[];

  addFarmEvent: (event: Omit<FarmEvent, 'id'>) => Promise<void>;
  addTodoTask: (todo: Omit<TodoTask, 'id'>) => Promise<void>;
  addObservation: (obs: Omit<Observation, 'id'>) => Promise<void>;
  toggleTodoStatus: (id: string, currentStatus: 'pending' | 'completed' | 'overdue') => Promise<void>;
  updateFarmEvent: (id: string, updates: Partial<FarmEvent>) => Promise<void>;
  updateObservation: (id: string, updates: Partial<Observation>) => Promise<void>;
  updateTodoTask: (id: string, updates: Partial<TodoTask>) => Promise<void>;

  // Auth States
  user: any;
  session: any;
  profile: Profile | null;
  loadingAuth: boolean;
  farmers: Profile[];
  selectedFarmer: Profile | null;
  setSelectedFarmer: (farmer: Profile | null) => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  
  // Actions
  addAnimal: (animal: Omit<Animal, 'id'>) => Promise<void>;
  deleteAnimal: (tag: string) => Promise<void>;
  addHealthRecord: (record: Omit<HealthRecord, 'id'>) => Promise<void>;
  addBreedingRecord: (record: Omit<BreedingRecord, 'id'>) => Promise<void>;
  addPregnancyRecord: (record: Omit<PregnancyRecord, 'id'>) => Promise<void>;
  addFeedRecord: (record: Omit<FeedRecord, 'id'>) => Promise<void>;
  addProductionRecord: (record: Omit<ProductionRecord, 'id'>) => Promise<void>;
  addMortalityRecord: (record: Omit<MortalityRecord, 'id'>) => Promise<void>;
  addTransaction: (record: Omit<TransactionRecord, 'id'>) => Promise<void>;
  updateFarmInspection: (updatesOrField: Partial<FarmInspection> | keyof FarmInspection, value?: any) => void;
  updateAnimal: (tag: string, updates: Partial<Animal>) => void;
  updateAnimalWeight: (tag: string, weight: number, previousWeight?: number, daysBetweenWeights?: number) => void;
  addBullBreedingRecord: (record: Omit<BullBreedingRecord, 'id'>) => Promise<void>;
  saveAnimalWeight: (record: Omit<AnimalWeight, 'id'>) => Promise<void>;
  addDrug: (record: Omit<Drug, 'id'>) => Promise<void>;
  updateDrug: (id: string, updates: Partial<Drug>) => Promise<void>;
  deleteDrug: (id: string) => Promise<void>;
  addFeedInventoryItem: (record: Omit<FeedInventoryItem, 'id'>) => Promise<void>;
  updateFeedInventoryItem: (id: string, updates: Partial<FeedInventoryItem>) => Promise<void>;
  deleteFeedInventoryItem: (id: string) => Promise<void>;
  updateHealthRecord: (id: string, updates: Partial<HealthRecord>) => Promise<void>;
  updateBreedingRecord: (id: string, updates: Partial<BreedingRecord>) => Promise<void>;
  updatePregnancyRecord: (id: string, updates: Partial<PregnancyRecord>) => Promise<void>;
  updateMortalityRecord: (id: string, updates: Partial<MortalityRecord>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<TransactionRecord>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;



  // Derived Metrics & Scores
  metrics: {
    // Nutrition
    adg: { goats: number; cattle: number; sheep: number; pigs: number };
    fcr: { cattle: number; chicken: number; dairy: number; pigs: number };
    averageHerdBCS: number;
    averageBreedingBCS: number;
    // Reproduction
    avgBirthingToServiceInterval: number;
    heatDetectionRate: number;
    submissionRate: number;
    conceptionRate: number;
    pregnancyRate28d: number;
    pregnancyRate42d: number;
    pregnancyRate200d: number;
    pregnancyRateCycle: number;
    calvingRate21d: number;
    barrenCowRate: number;
    calvingPercentage: number;
    // Production
    weaningPercentage: number;
    preWeaningDLWG: number;
    postWeaningDLWG: number;
    mortalityRates: { preWeaning: number; postWeaning: number; herd: number; chicken: number };
    weaningRate: number;
    // Category Scores (0 - 100)
    scoreNutrition: number;
    scoreGenetics: number;
    scoreHealth: number;
    scoreProduction: number;
    scoreRecords: number;
    scoreDLShift: number;
  };
}

// --- DATABASE MAPPING HELPERS ---

const mapAnimalFromDb = (row: any): Animal => ({
  id: row.id,
  tag: row.tag,
  age: row.age || '',
  dateOfBirth: row.date_of_birth || '',
  breed: row.breed || '',
  sex: row.sex,
  stockType: row.stock_type,
  source: row.source,
  weight: row.weight != null ? Number(row.weight) : undefined,
  previousWeight: row.previous_weight != null ? Number(row.previous_weight) : undefined,
  daysBetweenWeights: row.days_between_weights != null ? Number(row.days_between_weights) : undefined,
  bcs: row.bcs != null ? Number(row.bcs) : undefined,
  isBreedingCow: row.is_breeding_cow ?? false,
  observer: row.observer || '',
  birthWeight: row.birth_weight || '',
  deliveryType: row.delivery_type || undefined,
  sire: row.sire || '',
  dam: row.dam || '',
  dateOfWeaning: row.date_of_weaning || '',
  weaningWeight: row.weaning_weight != null ? Number(row.weaning_weight) : undefined,
  description: row.description || '',
  weight30day: row.weight_30day != null ? Number(row.weight_30day) : undefined,
  weight100day: row.weight_100day != null ? Number(row.weight_100day) : undefined,
  weight1weekPostWeaning: row.weight_1week_post_weaning != null ? Number(row.weight_1week_post_weaning) : undefined,
  weight6monthsPostWeaning: row.weight_6months_post_weaning != null ? Number(row.weight_6months_post_weaning) : undefined,
  calfStatus: row.calf_status || undefined,
  preWeaningMortality: row.pre_weaning_mortality ?? false,
});

const mapHealthFromDb = (row: any): HealthRecord => ({
  id: row.id,
  animalId: row.animal_tag,
  date: row.date,
  treatment: row.treatment,
  withdrawalPeriod: row.withdrawal_period || undefined,
  pregnancySafe: row.pregnancy_safe || undefined,
  status: row.status,
  specialNotes: row.special_notes || '',
  doneBy: row.done_by || '',
});

const mapBreedingFromDb = (row: any): BreedingRecord => ({
  id: row.id,
  earTagNumber: row.ear_tag_number,
  stockType: row.stock_type,
  bodyConditionScore: row.body_condition_score != null ? Number(row.body_condition_score) : 0,
  heatDetectionDate: row.heat_detection_date,
  observer: row.observer || '',
  servicedDate: row.serviced_date || undefined,
  breedingStatus: row.breeding_status,
  breedingMethod: row.breeding_method || undefined,
  aiTechnician: row.ai_technician || undefined,
  sireId: row.sire_id || undefined,
  strawId: row.straw_id || undefined,
  semenViability: row.semen_viability != null ? Number(row.semen_viability) : undefined,
  returnToHeatDate1: row.return_to_heat_date_1 || undefined,
  dateServed2: row.date_served_2 || undefined,
  breedingMethod2: row.breeding_method_2 || undefined,
  sireUsed2: row.sire_used_2 || undefined,
  returnToHeatDate2: row.return_to_heat_date_2 || undefined,
});

const mapPregnancyFromDb = (row: any): PregnancyRecord => ({
  id: row.id,
  cowEarTag: row.cow_ear_tag,
  bodyConditionScore: row.body_condition_score != null ? Number(row.body_condition_score) : 0,
  lastServiceDate: row.last_service_date,
  firstTrimesterPD: row.first_trimester_pd,
  secondTrimesterPD: row.second_trimester_pd,
  thirdTrimesterPD: row.third_trimester_pd,
  gestationPeriod: row.gestation_period != null ? Number(row.gestation_period) : 0,
  expectedCalvingDate: row.expected_calving_date || '',
  actualCalvingDate: row.actual_calving_date || undefined,
  calfId: row.calf_id || undefined,
  calfSex: row.calf_sex || undefined,
  deliveryType: row.delivery_type || undefined,
  averageBCS: row.average_bcs != null ? Number(row.average_bcs) : 0,
  expectedReturnToHeatDate: row.expected_return_to_heat_date || '',
  actualFirstHeatDate: row.actual_first_heat_date || undefined,
  expectedSecondHeatDate: row.expected_second_heat_date || undefined,
  actualSecondHeatDate: row.actual_second_heat_date || undefined,
});

const mapFeedFromDb = (row: any): FeedRecord => ({
  id: row.id,
  animalGroup: row.animal_group,
  feedType: row.feed_type,
  quantityConsumed: row.quantity_consumed != null ? Number(row.quantity_consumed) : 0,
  costPerKg: row.cost_per_kg != null ? Number(row.cost_per_kg) : 0,
  date: row.date,
});

const mapProductionFromDb = (row: any): ProductionRecord => ({
  id: row.id,
  animalId: row.animal_tag,
  type: row.type,
  quantity: row.quantity != null ? Number(row.quantity) : 0,
  date: row.date,
});

const mapMortalityFromDb = (row: any): MortalityRecord => ({
  id: row.id,
  animalId: row.animal_tag,
  date: row.date,
  cause: row.cause,
  description: row.description || '',
  observer: row.observer || '',
  isPreWeaning: row.is_pre_weaning ?? false,
});

const mapTransactionFromDb = (row: any): TransactionRecord => ({
  id: row.id,
  date: row.date,
  description: row.description,
  amount: row.amount != null ? Number(row.amount) : 0,
  type: row.type,
});

const mapBullBreedingFromDb = (row: any): BullBreedingRecord => ({
  id: row.id,
  bullId: row.bull_id,
  date: row.date,
  age: row.age || '',
  pe: row.pe,
  spermMotility: row.sperm_motility || '',
  spermMorphology: row.sperm_morphology || '',
  scrotal: row.scrotal || '',
  libido: row.libido,
  score: row.score || '',
  classification: row.classification,
});

const mapDrugFromDb = (row: any): Drug => ({
  id: row.id,
  drugClass: row.drug_class,
  type: row.type,
  name: row.name,
  withdrawalPeriod: row.withdrawal_period || '',
  pregnancySafe: row.pregnancy_safe,
  stockStatus: row.stock_status,
  lastUpdated: row.last_updated || row.created_at || undefined,
});

const mapFeedInventoryFromDb = (row: any): FeedInventoryItem => ({
  id: row.id,
  name: row.name,
  type: row.type,
  quantity: row.quantity,
  unit: row.unit,
  supplier: row.supplier || '',
  lastUpdated: row.last_updated,
  status: row.status,
});


const mapWeightFromDb = (row: any): AnimalWeight => ({
  id: row.id,
  animalTag: row.animal_tag,
  year: Number(row.year),
  jan: row.jan != null ? String(row.jan) : '',
  feb: row.feb != null ? String(row.feb) : '',
  mar: row.mar != null ? String(row.mar) : '',
  apr: row.apr != null ? String(row.apr) : '',
  may: row.may != null ? String(row.may) : '',
  jun: row.jun != null ? String(row.jun) : '',
  jul: row.jul != null ? String(row.jul) : '',
  aug: row.aug != null ? String(row.aug) : '',
  sep: row.sep != null ? String(row.sep) : '',
  oct: row.oct != null ? String(row.oct) : '',
  nov: row.nov != null ? String(row.nov) : '',
  dec: row.dec != null ? String(row.dec) : '',
});

const mapFarmEventFromDb = (row: any): FarmEvent => ({
  id: row.id,
  date: row.date,
  type: row.type,
  event: row.event,
  tag: row.tag,
  diagnosis: row.diagnosis,
  notes: row.notes,
  doneBy: row.done_by,
  status: row.status,
});

const mapTodoFromDb = (row: any): TodoTask => ({
  id: row.id,
  date: row.date,
  description: row.description,
  status: row.status,
  createdBy: row.created_by,
  lastEdited: row.last_edited,
  priority: row.priority,
});

const mapObservationFromDb = (row: any): Observation => ({
  id: row.id,
  date: row.date,
  tag: row.tag,
  observation: row.observation,
  severity: row.severity,
  observer: row.observer,
  status: row.status || 'unresolved',
});

const FarmDataContext = createContext<FarmDataContextProps | undefined>(undefined);

// --- INITIAL STATE ---

const initialAnimals: Animal[] = [];
const initialHealthRecords: HealthRecord[] = [];
const initialBreedingRecords: BreedingRecord[] = [];
const initialPregnancyRecords: PregnancyRecord[] = [];
const initialFeedRecords: FeedRecord[] = [];
const initialProductionRecords: ProductionRecord[] = [];
const initialMortalityRecords: MortalityRecord[] = [];
const initialTransactions: TransactionRecord[] = [];
const initialDrugs: Drug[] = [];
const initialFeedInventory: FeedInventoryItem[] = [];


const initialBullBreedingRecords: BullBreedingRecord[] = [
  {
    id: 'B1',
    bullId: 'TAG123',
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
    id: 'B2',
    bullId: 'TAG101',
    date: '2025-06-20',
    age: '3 years',
    pe: 'Good',
    spermMotility: '70%',
    spermMorphology: '65%',
    scrotal: '34 cm',
    libido: 'Good',
    score: '75',
    classification: 'SPB'
  }
];

const initialAnimalWeights: AnimalWeight[] = [
  {
    id: 'W1',
    animalTag: 'TAG123',
    year: 2026,
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
  {
    id: 'W2',
    animalTag: 'TAG456',
    year: 2026,
    jan: '490',
    feb: '495',
    mar: '500',
    apr: '505',
    may: '510',
    jun: '515',
    jul: '520',
    aug: '525',
    sep: '530',
    oct: '535',
    nov: '540',
    dec: '545'
  }
];

const initialFarmInspection: FarmInspection = {
  herdBcs: 3,
  nutritionalDeficiencies: 4.25, // 1=Poor, 5=Excellent (meaning minimal deficiencies)
  dungConsistency: 4,
  rumenFill: 4,
  coatSkin: 4.5,
  motilityLocomotion: 4.5,
  growthRatePerception: 3.5,
  muscleDefinition: 3,
  frameSizing: 4,
  fatCoverDevelopment: 3,
  skeletalSymmetry: 4,
  overallNutritionalHealth: 4,
  bunkFeedAvailability: 4,
  rationSortingBehaviour: 4,
  waterQualityAccess: 4,
  forageQualityPerception: 4,

  overallGeneticReproductivePerformance: 3.8,
  overallGeneticQuality: 4,
  vaccinationCoverage: 4.2,
  vaccProtocolAdherence: 4,
  vaccHerdPenetration: 4,
  vaccTimingAccuracy: 4,
  vaccColdChainIntegrity: 5,
  biosecurityRating: 3.5,
  quarantineIntakeIsolation: 4,
  herdTrackingMovementLogs: 4,
  farmBoundaryPestControl: 3,
  sanitationVisitorControl: 3,
  dewormingPractice: 4,
  dewormingTiming: 4,
  dewormingRotation: 4,
  dewormingPrecision: 4,
  dewormingTargeted: 4,
  prudentAnthelmintic: 4,
  anthelminticClassSelection: 4,
  anthelminticAdminRoute: 4,
  anthelminticEquipmentCalib: 4,
  anthelminticWithholdingComp: 4,
  prudentAntibiotics: 4,
  antibioticPrescriptionControl: 4,
  antibioticDrugClassification: 4,
  antibioticTreatmentRecords: 4,
  antibioticCourseCompletion: 4,
  drugBoxManagement: 4,
  dbExpiryInventory: 4,
  dbStorageCleanliness: 4,
  dbSecurityAccess: 4,
  dbDisposalPractices: 5,
  cpdStaffControl: 4,
  cpdTrainingFrequency: 4,
  cpdProtocolAwareness: 4,
  cpdVetCollaboration: 4,
  cpdBenchmarkTracking: 4,
  recordsSatisfaction: 4,
  recordsTraceability: 4,
  recordAccessibilityUsage: 4.2,
  recordsTrainingEvidence: 4,
  maintainsBirth: true,
  maintainsMovements: true,
  maintainsHealth: true,
  maintainsMortalities: true,
  maintainsFeed: true,
  recordsOverrides: {},
  pregnancyOverrides: {},
};

const emptyFarmInspection: FarmInspection = {
  herdBcs: 0,
  nutritionalDeficiencies: 0,
  dungConsistency: 0,
  rumenFill: 0,
  coatSkin: 0,
  motilityLocomotion: 0,
  growthRatePerception: 0,
  muscleDefinition: 0,
  frameSizing: 0,
  fatCoverDevelopment: 0,
  skeletalSymmetry: 0,
  overallNutritionalHealth: 0,
  bunkFeedAvailability: 0,
  rationSortingBehaviour: 0,
  waterQualityAccess: 0,
  forageQualityPerception: 0,

  overallGeneticReproductivePerformance: 0,
  overallGeneticQuality: 0,
  vaccinationCoverage: 0,
  vaccProtocolAdherence: 0,
  vaccHerdPenetration: 0,
  vaccTimingAccuracy: 0,
  vaccColdChainIntegrity: 0,
  biosecurityRating: 0,
  quarantineIntakeIsolation: 0,
  herdTrackingMovementLogs: 0,
  farmBoundaryPestControl: 0,
  sanitationVisitorControl: 0,
  dewormingPractice: 0,
  dewormingTiming: 0,
  dewormingRotation: 0,
  dewormingPrecision: 0,
  dewormingTargeted: 0,
  prudentAnthelmintic: 0,
  anthelminticClassSelection: 0,
  anthelminticAdminRoute: 0,
  anthelminticEquipmentCalib: 0,
  anthelminticWithholdingComp: 0,
  prudentAntibiotics: 0,
  antibioticPrescriptionControl: 0,
  antibioticDrugClassification: 0,
  antibioticTreatmentRecords: 0,
  antibioticCourseCompletion: 0,
  drugBoxManagement: 0,
  dbExpiryInventory: 0,
  dbStorageCleanliness: 0,
  dbSecurityAccess: 0,
  dbDisposalPractices: 0,
  cpdStaffControl: 0,
  cpdTrainingFrequency: 0,
  cpdProtocolAwareness: 0,
  cpdVetCollaboration: 0,
  cpdBenchmarkTracking: 0,
  recordsSatisfaction: 0,
  recordsTraceability: 0,
  recordAccessibilityUsage: 0,
  recordsTrainingEvidence: 0,
  maintainsBirth: false,
  maintainsMovements: false,
  maintainsHealth: false,
  maintainsMortalities: false,
  maintainsFeed: false,
  recordsOverrides: {},
  pregnancyOverrides: {},
};

export interface Profile {
  id: string;
  email: string;
  role: 'farmer' | 'admin';
  full_name?: string;
  farm_name?: string;
  created_at?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  address?: string;
  location?: string;
  province?: string;
  phone_number?: string;
}

// --- PROVIDER COMPONENT ---

export const FarmDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [farmers, setFarmers] = useState<Profile[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<Profile | null>(null);

  const [animals, setAnimals] = useState<Animal[]>(supabase ? [] : initialAnimals);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>(supabase ? [] : initialHealthRecords);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>(supabase ? [] : initialBreedingRecords);
  const [pregnancyRecords, setPregnancyRecords] = useState<PregnancyRecord[]>(supabase ? [] : initialPregnancyRecords);
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>(supabase ? [] : initialFeedRecords);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>(supabase ? [] : initialProductionRecords);
  const [mortalityRecords, setMortalityRecords] = useState<MortalityRecord[]>(supabase ? [] : initialMortalityRecords);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(supabase ? [] : initialTransactions);
  const [farmInspection, setFarmInspection] = useState<FarmInspection>(emptyFarmInspection);
  const [bullBreedingRecords, setBullBreedingRecords] = useState<BullBreedingRecord[]>([]);
  const [animalWeights, setAnimalWeights] = useState<AnimalWeight[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>(supabase ? [] : initialDrugs);
  const [feedInventory, setFeedInventory] = useState<FeedInventoryItem[]>(supabase ? [] : initialFeedInventory);
  const [farmEvents, setFarmEvents] = useState<FarmEvent[]>([]);
  const [todoList, setTodoList] = useState<TodoTask[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);


  // --- AUTHENTICATION & SESSION HANDLING ---

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoadingAuth(false);
      return;
    }

    const loadProfileWithExtras = async (prof: any): Promise<Profile> => {
      try {
        const extraDataStr = await AsyncStorage.getItem(`profile_extra_${prof.id}`);
        if (extraDataStr) {
          const extraData = JSON.parse(extraDataStr);
          return { ...prof, ...extraData } as Profile;
        }
      } catch (e) {
        console.error("Error loading profile extras from AsyncStorage:", e);
      }
      return prof as Profile;
    };

    const loadSession = async () => {
      setLoadingAuth(true);
      try {
        const { data: { session: currentSession } } = await client.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          const { data: prof, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .maybeSingle();
          
          if (prof) {
            const profWithExtras = await loadProfileWithExtras(prof);
            setProfile(profWithExtras);
            if (prof.role === 'admin') {
              const { data: farmersData } = await client
                .from('profiles')
                .select('*')
                .eq('role', 'farmer');
              setFarmers((farmersData as Profile[]) || []);
              if (farmersData && farmersData.length > 0) {
                setSelectedFarmer(farmersData[0] as Profile);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading session:", err);
      } finally {
        setLoadingAuth(false);
      }
    };

    loadSession();

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        try {
          const { data: prof } = await client
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .maybeSingle();
          if (prof) {
            const profWithExtras = await loadProfileWithExtras(prof);
            setProfile(profWithExtras);
            if (prof.role === 'admin') {
              const { data: farmersData } = await client
                .from('profiles')
                .select('*')
                .eq('role', 'farmer');
              setFarmers((farmersData as Profile[]) || []);
              setSelectedFarmer(prev => {
                if (prev) return prev;
                return (farmersData && farmersData.length > 0) ? (farmersData[0] as Profile) : null;
              });
            } else {
              setFarmers([]);
              setSelectedFarmer(null);
            }
          }
        } catch (err) {
          console.error("Error on auth state change:", err);
        }
      } else {
        setProfile(null);
        setFarmers([]);
        setSelectedFarmer(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    // Clear auth states immediately to trigger redirect and clear user data
    setUser(null);
    setSession(null);
    setProfile(null);
    setFarmers([]);
    setSelectedFarmer(null);

    if (supabase) {
      supabase.auth.signOut().catch(err => {
        console.error("Error signing out from Supabase:", err);
      });
    }
  };

  const deleteAccount = async () => {
    if (supabase) {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) {
        console.error("Error calling delete_user_account RPC:", error);
        throw error;
      }
    }
    await logout();
  };

  const targetUserId = profile?.role === 'admin' ? selectedFarmer?.id : (profile?.role === 'worker' ? profile?.farmer_id : user?.id);

  // --- FETCH SCORING RECORDS BY USER_ID ---

  useEffect(() => {
    const loadData = async () => {
      if (!supabase) return;

      setLoadingData(true);

      // Instantly clear data to prevent rendering stale records from previous users while loading
      setAnimals([]);
      setHealthRecords([]);
      setBreedingRecords([]);
      setPregnancyRecords([]);
      setFeedRecords([]);
      setProductionRecords([]);
      setMortalityRecords([]);
      setTransactions([]);
      setFarmInspection(emptyFarmInspection);
      setBullBreedingRecords([]);
      setAnimalWeights([]);
      setDrugs([]);
      setFeedInventory([]);
      setFarmEvents([]);
      setTodoList([]);
      setObservations([]);

      if (!targetUserId) {
        setLoadingData(false);
        return;
      }

      try {
        console.log(`[FarmDataContext] Fetching tables for user_id: ${targetUserId}...`);
        const [
          { data: ani, error: aniErr },
          { data: hlth, error: hlthErr },
          { data: breed, error: breedErr },
          { data: preg, error: pregErr },
          { data: feed, error: feedErr },
          { data: prod, error: prodErr },
          { data: mort, error: mortErr },
          { data: txs, error: txsErr },
          { data: insp, error: inspErr },
          { data: bBreed, error: bBreedErr },
          { data: weights, error: weightsErr },
          { data: drgs, error: drgsErr },
          { data: feedInv, error: feedInvErr },
          { data: fEvts, error: fEvtsErr },
          { data: tTasks, error: tTasksErr },
          { data: obsvs, error: obsvsErr }
        ] = await Promise.all([
          supabase.from('animals').select('*').eq('user_id', targetUserId),
          supabase.from('health_records').select('*').eq('user_id', targetUserId),
          supabase.from('breeding_records').select('*').eq('user_id', targetUserId),
          supabase.from('pregnancy_records').select('*').eq('user_id', targetUserId),
          supabase.from('feed_records').select('*').eq('user_id', targetUserId),
          supabase.from('production_records').select('*').eq('user_id', targetUserId),
          supabase.from('mortality_records').select('*').eq('user_id', targetUserId),
          supabase.from('transaction_records').select('*').eq('user_id', targetUserId),
          supabase.from('farm_inspections').select('*').eq('user_id', targetUserId).maybeSingle(),
          supabase.from('bull_breeding_records').select('*').eq('user_id', targetUserId),
          supabase.from('animal_weights').select('*').eq('user_id', targetUserId),
          supabase.from('drugs').select('*').eq('user_id', targetUserId),
          supabase.from('feed_inventory').select('*').eq('user_id', targetUserId),
          supabase.from('farm_events').select('*').eq('user_id', targetUserId),
          supabase.from('todo_tasks').select('*').eq('user_id', targetUserId),
          supabase.from('observations').select('*').eq('user_id', targetUserId)
        ]);

        if (aniErr) console.warn("Supabase animals fetch error:", aniErr);
        else if (ani) setAnimals(ani.map(mapAnimalFromDb));

        if (hlthErr) console.warn("Supabase health_records fetch error:", hlthErr);
        else if (hlth) setHealthRecords(hlth.map(mapHealthFromDb));

        if (breedErr) console.warn("Supabase breeding_records fetch error:", breedErr);
        else if (breed) setBreedingRecords(breed.map(mapBreedingFromDb));

        if (pregErr) console.warn("Supabase pregnancy_records fetch error:", pregErr);
        else if (preg) setPregnancyRecords(preg.map(mapPregnancyFromDb));

        if (feedErr) console.warn("Supabase feed_records fetch error:", feedErr);
        else if (feed) setFeedRecords(feed.map(mapFeedFromDb));

        if (prodErr) console.warn("Supabase production_records fetch error:", prodErr);
        else if (prod) setProductionRecords(prod.map(mapProductionFromDb));

        if (mortErr) console.warn("Supabase mortality_records fetch error:", mortErr);
        else if (mort) setMortalityRecords(mort.map(mapMortalityFromDb));

        if (txsErr) console.warn("Supabase transaction_records fetch error:", txsErr);
        else if (txs) setTransactions(txs.map(mapTransactionFromDb));

        const isDemo = targetUserId === '76408c11-021a-4fdd-a17c-6b90065182b7';
        const defaultInspection = isDemo ? initialFarmInspection : emptyFarmInspection;

        if (inspErr) console.warn("Supabase farm_inspections fetch error:", inspErr);
        else if (insp && insp.data) {
          setFarmInspection({
            ...(insp.data as FarmInspection),
            updatedAt: insp.updated_at || insp.created_at
          });
        } else {
          // No inspection yet. Seed the default one.
          setFarmInspection(defaultInspection);
          try {
            await supabase.from('farm_inspections').insert({
              user_id: targetUserId,
              data: defaultInspection
            });
          } catch (e) {
            console.error("Error inserting default farm inspection:", e);
          }
        }

        if (bBreedErr) console.warn("Supabase bull_breeding_records fetch error:", bBreedErr);
        else if (bBreed) setBullBreedingRecords(bBreed.map(mapBullBreedingFromDb));

        if (weightsErr) console.warn("Supabase animal_weights fetch error:", weightsErr);
        else if (weights) setAnimalWeights(weights.map(mapWeightFromDb));

        if (drgsErr) console.warn("Supabase drugs fetch error:", drgsErr);
        else if (drgs) setDrugs(drgs.map(mapDrugFromDb));

        if (feedInvErr) console.warn("Supabase feed_inventory fetch error:", feedInvErr);
        else if (feedInv) setFeedInventory(feedInv.map(mapFeedInventoryFromDb));

        if (fEvtsErr) console.warn("Supabase farm_events fetch error:", fEvtsErr);
        else if (fEvts) setFarmEvents(fEvts.map(mapFarmEventFromDb));

        if (tTasksErr) console.warn("Supabase todo_tasks fetch error:", tTasksErr);
        else if (tTasks) setTodoList(tTasks.map(mapTodoFromDb));

        if (obsvsErr) console.warn("Supabase observations fetch error:", obsvsErr);
        else if (obsvs) setObservations(obsvs.map(mapObservationFromDb));

      } catch (err) {
        console.error("Failed to fetch data from Supabase:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [targetUserId]);

  // --- ADD ACTIONS ---

  const addAnimal = async (animal: Omit<Animal, 'id'>) => {
    if (!supabase) {
      const newId = (animals.length + 1).toString();
      setAnimals(prev => [...prev, { ...animal, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      tag: animal.tag,
      age: animal.age,
      date_of_birth: animal.dateOfBirth || null,
      breed: animal.breed,
      sex: animal.sex,
      stock_type: animal.stockType,
      source: animal.source,
      weight: animal.weight,
      previous_weight: animal.previousWeight,
      days_between_weights: animal.daysBetweenWeights,
      bcs: animal.bcs,
      is_breeding_cow: animal.isBreedingCow,
      birth_weight: animal.birthWeight,
      sire: animal.sire,
      dam: animal.dam,
      date_of_weaning: animal.dateOfWeaning || null,
      weaning_weight: animal.weaningWeight != null ? Number(animal.weaningWeight) : null,
      description: animal.description,
      weight_30day: animal.weight30day != null ? Number(animal.weight30day) : null,
      weight_100day: animal.weight100day != null ? Number(animal.weight100day) : null,
      weight_1week_post_weaning: animal.weight1weekPostWeaning != null ? Number(animal.weight1weekPostWeaning) : null,
      weight_6months_post_weaning: animal.weight6monthsPostWeaning != null ? Number(animal.weight6monthsPostWeaning) : null,
      calf_status: animal.calfStatus || null,
      pre_weaning_mortality: animal.preWeaningMortality ?? false,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('animals')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setAnimals(prev => [...prev, mapAnimalFromDb(data)]);
    }
  };

  const deleteAnimal = async (tag: string) => {
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      if (!targetUserId) throw new Error("No active farmer selected");
      const { error } = await supabase
        .from('animals')
        .delete()
        .eq('tag', tag)
        .eq('user_id', targetUserId);

      if (error) throw error;
      setAnimals(prev => prev.filter(a => a.tag.toLowerCase() !== tag.toLowerCase()));
    } catch (error) {
      console.error('Error deleting animal from Supabase:', error);
      // Fallback
      setAnimals(prev => prev.filter(a => a.tag.toLowerCase() !== tag.toLowerCase()));
    }
  };

  const addHealthRecord = async (record: Omit<HealthRecord, 'id'>) => {
    if (!supabase) {
      const newId = (healthRecords.length + 1).toString();
      setHealthRecords(prev => [...prev, { ...record, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      animal_tag: record.animalId,
      date: record.date,
      treatment: record.treatment,
      withdrawal_period: record.withdrawalPeriod || null,
      pregnancy_safe: record.pregnancySafe || null,
      status: record.status,
      user_id: targetUserId,
      special_notes: record.specialNotes || null,
      done_by: record.doneBy || null,
    };
    const { data, error } = await supabase
      .from('health_records')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setHealthRecords(prev => [...prev, mapHealthFromDb(data)]);
    }
  };

  const addBreedingRecord = async (record: Omit<BreedingRecord, 'id'>) => {
    if (!supabase) {
      const newId = (breedingRecords.length + 1).toString();
      setBreedingRecords(prev => [...prev, { ...record, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      ear_tag_number: record.earTagNumber,
      stock_type: record.stockType,
      body_condition_score: record.bodyConditionScore,
      heat_detection_date: record.heatDetectionDate,
      observer: record.observer,
      serviced_date: record.servicedDate || null,
      breeding_status: record.breedingStatus,
      breeding_method: record.breedingMethod || null,
      ai_technician: record.aiTechnician || null,
      sire_id: record.sireId || null,
      straw_id: record.strawId || null,
      semen_viability: record.semenViability || null,
      return_to_heat_date_1: record.returnToHeatDate1 || null,
      date_served_2: record.dateServed2 || null,
      breeding_method_2: record.breedingMethod2 || null,
      sire_used_2: record.sireUsed2 || null,
      return_to_heat_date_2: record.returnToHeatDate2 || null,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('breeding_records')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setBreedingRecords(prev => [...prev, mapBreedingFromDb(data)]);
    }
  };

  const addPregnancyRecord = async (record: Omit<PregnancyRecord, 'id'>) => {
    if (!supabase) {
      const newId = (pregnancyRecords.length + 1).toString();
      setPregnancyRecords(prev => [...prev, { ...record, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      cow_ear_tag: record.cowEarTag,
      body_condition_score: record.bodyConditionScore,
      last_service_date: record.lastServiceDate,
      first_trimester_pd: record.firstTrimesterPD,
      second_trimester_pd: record.secondTrimesterPD,
      third_trimester_pd: record.thirdTrimesterPD,
      gestation_period: record.gestationPeriod,
      expected_calving_date: record.expectedCalvingDate || null,
      actual_calving_date: record.actualCalvingDate || null,
      calf_id: record.calfId || null,
      calf_sex: record.calfSex || null,
      delivery_type: record.deliveryType || null,
      average_bcs: record.averageBCS,
      expected_return_to_heat_date: record.expectedReturnToHeatDate || null,
      actual_first_heat_date: record.actualFirstHeatDate || null,
      expected_second_heat_date: record.expectedSecondHeatDate || null,
      actual_second_heat_date: record.actualSecondHeatDate || null,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('pregnancy_records')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setPregnancyRecords(prev => [...prev, mapPregnancyFromDb(data)]);
    }
  };

  const addFeedRecord = async (record: Omit<FeedRecord, 'id'>) => {
    if (!supabase) {
      const newId = (feedRecords.length + 1).toString();
      setFeedRecords(prev => [...prev, { ...record, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      animal_group: record.animalGroup,
      feed_type: record.feedType,
      quantity_consumed: record.quantityConsumed,
      cost_per_kg: record.costPerKg,
      date: record.date,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('feed_records')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setFeedRecords(prev => [...prev, mapFeedFromDb(data)]);
    }
  };

  const addProductionRecord = async (record: Omit<ProductionRecord, 'id'>) => {
    if (!supabase) {
      const newId = (productionRecords.length + 1).toString();
      setProductionRecords(prev => [...prev, { ...record, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      animal_tag: record.animalId,
      type: record.type,
      quantity: record.quantity,
      date: record.date,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('production_records')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setProductionRecords(prev => [...prev, mapProductionFromDb(data)]);
    }
  };

  const addMortalityRecord = async (record: Omit<MortalityRecord, 'id'>) => {
    if (!supabase) {
      const newId = (mortalityRecords.length + 1).toString();
      setMortalityRecords(prev => [...prev, { ...record, id: newId }]);
      setAnimals(prev => prev.filter(a => a.tag.toLowerCase() !== record.animalId.toLowerCase()));
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      animal_tag: record.animalId,
      date: record.date,
      cause: record.cause,
      description: record.description || null,
      observer: record.observer || null,
      is_pre_weaning: record.isPreWeaning,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('mortality_records')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setMortalityRecords(prev => [...prev, mapMortalityFromDb(data)]);

      // Delete from supabase animals table
      const { error: delErr } = await supabase
        .from('animals')
        .delete()
        .eq('tag', record.animalId)
        .eq('user_id', targetUserId);
      if (delErr) console.warn("Error deleting dead animal from database:", delErr);

      // Delete from local state
      setAnimals(prev => prev.filter(a => a.tag.toLowerCase() !== record.animalId.toLowerCase()));
    }
  };

  const addTransaction = async (record: Omit<TransactionRecord, 'id'>) => {
    if (!supabase) {
      const newId = (transactions.length + 1).toString();
      setTransactions(prev => [...prev, { ...record, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      date: record.date,
      description: record.description,
      amount: record.amount,
      type: record.type,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('transaction_records')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setTransactions(prev => [...prev, mapTransactionFromDb(data)]);
    }
  };

  const addBullBreedingRecord = async (record: Omit<BullBreedingRecord, 'id'>) => {
    if (!supabase) {
      const newId = (bullBreedingRecords.length + 1).toString();
      setBullBreedingRecords(prev => [...prev, { ...record, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      bull_id: record.bullId,
      date: record.date,
      age: record.age,
      pe: record.pe,
      sperm_motility: record.spermMotility,
      sperm_morphology: record.spermMorphology,
      scrotal: record.scrotal,
      libido: record.libido,
      score: record.score,
      classification: record.classification,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('bull_breeding_records')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setBullBreedingRecords(prev => [...prev, mapBullBreedingFromDb(data)]);
    }
  };

  const addDrug = async (record: Omit<Drug, 'id'>) => {
    const today = new Date().toISOString().split('T')[0];
    if (!supabase) {
      const newId = (drugs.length + 1).toString();
      setDrugs(prev => [...prev, { ...record, id: newId, lastUpdated: today }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      drug_class: record.drugClass,
      type: record.type,
      name: record.name,
      withdrawal_period: record.withdrawalPeriod,
      pregnancy_safe: record.pregnancySafe,
      stock_status: record.stockStatus,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('drugs')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      // Inject today's date as lastUpdated since DB may not have the column yet
      setDrugs(prev => [...prev, { ...mapDrugFromDb(data), lastUpdated: today }]);
    }
  };

  const updateDrug = async (id: string, updates: Partial<Drug>) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      const dbUpdates: any = {};
      if (updates.drugClass !== undefined) dbUpdates.drug_class = updates.drugClass;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.withdrawalPeriod !== undefined) dbUpdates.withdrawal_period = updates.withdrawalPeriod;
      if (updates.pregnancySafe !== undefined) dbUpdates.pregnancy_safe = updates.pregnancySafe;
      if (updates.stockStatus !== undefined) dbUpdates.stock_status = updates.stockStatus;

      const { data, error } = await supabase
        .from('drugs')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        // Inject today's date as lastUpdated since DB may not have the column yet
        setDrugs(prev => prev.map(d => d.id === id ? { ...mapDrugFromDb(data), lastUpdated: today } : d));
      }
    } catch (error) {
      console.error('Error updating drug in Supabase:', error);
      // Fallback: update local state only
      setDrugs(prev => prev.map(d => d.id === id ? { ...d, ...updates, lastUpdated: today } : d));
    }
  };

  const deleteDrug = async (id: string) => {
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      const { error } = await supabase
        .from('drugs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDrugs(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting drug from Supabase:', error);
      // Fallback
      setDrugs(prev => prev.filter(d => d.id !== id));
    }
  };

  const addFeedInventoryItem = async (record: Omit<FeedInventoryItem, 'id'>) => {
    if (!supabase) {
      const newId = (feedInventory.length + 1).toString();
      setFeedInventory(prev => [...prev, { ...record, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      name: record.name,
      type: record.type,
      quantity: record.quantity,
      unit: record.unit,
      supplier: record.supplier,
      last_updated: record.lastUpdated,
      status: record.status,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('feed_inventory')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setFeedInventory(prev => [...prev, mapFeedInventoryFromDb(data)]);
    }
  };

  const updateFeedInventoryItem = async (id: string, updates: Partial<FeedInventoryItem>) => {
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier;
      if (updates.lastUpdated !== undefined) dbUpdates.last_updated = updates.lastUpdated;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { data, error } = await supabase
        .from('feed_inventory')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setFeedInventory(prev => prev.map(f => f.id === id ? mapFeedInventoryFromDb(data) : f));
      }
    } catch (error) {
      console.error('Error updating feed inventory item in Supabase:', error);
      // Fallback
      setFeedInventory(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    }
  };

  const deleteFeedInventoryItem = async (id: string) => {
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      const { error } = await supabase
        .from('feed_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFeedInventory(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error deleting feed inventory item from Supabase:', error);
      // Fallback
    }
  };

  const updateHealthRecord = async (id: string, updates: Partial<HealthRecord>) => {
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      const dbUpdates: any = {};
      if (updates.animalId !== undefined) dbUpdates.animal_tag = updates.animalId;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.treatment !== undefined) dbUpdates.treatment = updates.treatment;
      if (updates.withdrawalPeriod !== undefined) dbUpdates.withdrawal_period = updates.withdrawalPeriod;
      if (updates.pregnancySafe !== undefined) dbUpdates.pregnancy_safe = updates.pregnancySafe;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.specialNotes !== undefined) dbUpdates.special_notes = updates.specialNotes;
      if (updates.doneBy !== undefined) dbUpdates.done_by = updates.doneBy;

      const { data, error } = await supabase
        .from('health_records')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setHealthRecords(prev => prev.map(h => h.id === id ? mapHealthFromDb(data) : h));
      }
    } catch (error) {
      console.error('Error updating health record in Supabase:', error);
      setHealthRecords(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    }
  };

  const updateBreedingRecord = async (id: string, updates: Partial<BreedingRecord>) => {
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      const dbUpdates: any = {};
      if (updates.earTagNumber !== undefined) dbUpdates.ear_tag_number = updates.earTagNumber;
      if (updates.stockType !== undefined) dbUpdates.stock_type = updates.stockType;
      if (updates.bodyConditionScore !== undefined) dbUpdates.body_condition_score = updates.bodyConditionScore;
      if (updates.heatDetectionDate !== undefined) dbUpdates.heat_detection_date = updates.heatDetectionDate;
      if (updates.observer !== undefined) dbUpdates.observer = updates.observer;
      if (updates.servicedDate !== undefined) dbUpdates.serviced_date = updates.servicedDate;
      if (updates.breedingStatus !== undefined) dbUpdates.breeding_status = updates.breedingStatus;
      if (updates.breedingMethod !== undefined) dbUpdates.breeding_method = updates.breedingMethod;
      if (updates.aiTechnician !== undefined) dbUpdates.ai_technician = updates.aiTechnician;
      if (updates.sireId !== undefined) dbUpdates.sire_id = updates.sireId;
      if (updates.strawId !== undefined) dbUpdates.straw_id = updates.strawId;
      if (updates.semenViability !== undefined) dbUpdates.semen_viability = updates.semenViability;
      if (updates.returnToHeatDate1 !== undefined) dbUpdates.return_to_heat_date_1 = updates.returnToHeatDate1;
      if (updates.dateServed2 !== undefined) dbUpdates.date_served_2 = updates.dateServed2;
      if (updates.breedingMethod2 !== undefined) dbUpdates.breeding_method_2 = updates.breedingMethod2;
      if (updates.sireUsed2 !== undefined) dbUpdates.sire_used_2 = updates.sireUsed2;
      if (updates.returnToHeatDate2 !== undefined) dbUpdates.return_to_heat_date_2 = updates.returnToHeatDate2;

      const { data, error } = await supabase
        .from('breeding_records')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setBreedingRecords(prev => prev.map(b => b.id === id ? mapBreedingFromDb(data) : b));
      }
    } catch (error) {
      console.error('Error updating breeding record in Supabase:', error);
      setBreedingRecords(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    }
  };

  const updatePregnancyRecord = async (id: string, updates: Partial<PregnancyRecord>) => {
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      const dbUpdates: any = {};
      if (updates.cowEarTag !== undefined) dbUpdates.cow_ear_tag = updates.cowEarTag;
      if (updates.bodyConditionScore !== undefined) dbUpdates.body_condition_score = updates.bodyConditionScore;
      if (updates.lastServiceDate !== undefined) dbUpdates.last_service_date = updates.lastServiceDate;
      if (updates.firstTrimesterPD !== undefined) dbUpdates.first_trimester_pd = updates.firstTrimesterPD;
      if (updates.secondTrimesterPD !== undefined) dbUpdates.second_trimester_pd = updates.secondTrimesterPD;
      if (updates.thirdTrimesterPD !== undefined) dbUpdates.third_trimester_pd = updates.thirdTrimesterPD;
      if (updates.gestationPeriod !== undefined) dbUpdates.gestation_period = updates.gestationPeriod;
      if (updates.expectedCalvingDate !== undefined) dbUpdates.expected_calving_date = updates.expectedCalvingDate;
      if (updates.actualCalvingDate !== undefined) dbUpdates.actual_calving_date = updates.actualCalvingDate;
      if (updates.calfId !== undefined) dbUpdates.calf_id = updates.calfId;
      if (updates.calfSex !== undefined) dbUpdates.calf_sex = updates.calfSex;
      if (updates.deliveryType !== undefined) dbUpdates.delivery_type = updates.deliveryType;
      if (updates.averageBCS !== undefined) dbUpdates.average_bcs = updates.averageBCS;
      if (updates.expectedReturnToHeatDate !== undefined) dbUpdates.expected_return_to_heat_date = updates.expectedReturnToHeatDate;
      if (updates.actualFirstHeatDate !== undefined) dbUpdates.actual_first_heat_date = updates.actualFirstHeatDate;
      if (updates.expectedSecondHeatDate !== undefined) dbUpdates.expected_second_heat_date = updates.expectedSecondHeatDate;
      if (updates.actualSecondHeatDate !== undefined) dbUpdates.actual_second_heat_date = updates.actualSecondHeatDate;

      const { data, error } = await supabase
        .from('pregnancy_records')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setPregnancyRecords(prev => prev.map(p => p.id === id ? mapPregnancyFromDb(data) : p));
      }
    } catch (error) {
      console.error('Error updating pregnancy record in Supabase:', error);
      setPregnancyRecords(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  };

  const updateMortalityRecord = async (id: string, updates: Partial<MortalityRecord>) => {
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      const dbUpdates: any = {};
      if (updates.animalId !== undefined) dbUpdates.animal_tag = updates.animalId;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.cause !== undefined) dbUpdates.cause = updates.cause;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.observer !== undefined) dbUpdates.observer = updates.observer;
      if (updates.isPreWeaning !== undefined) dbUpdates.is_pre_weaning = updates.isPreWeaning;

      const { data, error } = await supabase
        .from('mortality_records')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMortalityRecords(prev => prev.map(m => m.id === id ? mapMortalityFromDb(data) : m));
      }
    } catch (error) {
      console.error('Error updating mortality record in Supabase:', error);
      setMortalityRecords(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }
  };

  const updateTransaction = async (id: string, updates: Partial<TransactionRecord>) => {
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      const dbUpdates: any = {};
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.type !== undefined) dbUpdates.type = updates.type;

      const { data, error } = await supabase
        .from('transaction_records')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTransactions(prev => prev.map(t => t.id === id ? mapTransactionFromDb(data) : t));
      }
    } catch (error) {
      console.error('Error updating transaction in Supabase:', error);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      if (!supabase) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        return;
      }
      const { error } = await supabase
        .from('transaction_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction from Supabase:', error);
      // Fallback
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const addFarmEvent = async (event: Omit<FarmEvent, 'id'>) => {
    if (!supabase) {
      const newId = (farmEvents.length + 1).toString();
      setFarmEvents(prev => [...prev, { ...event, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      date: event.date,
      type: event.type,
      event: event.event,
      tag: event.tag,
      diagnosis: event.diagnosis,
      notes: event.notes,
      done_by: event.doneBy,
      status: event.status,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('farm_events')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setFarmEvents(prev => [...prev, mapFarmEventFromDb(data)]);
    }
  };

  const addTodoTask = async (todo: Omit<TodoTask, 'id'>) => {
    if (!supabase) {
      const newId = (todoList.length + 1).toString();
      setTodoList(prev => [...prev, { ...todo, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      date: todo.date,
      description: todo.description,
      status: todo.status,
      created_by: todo.createdBy,
      last_edited: todo.lastEdited,
      priority: todo.priority,
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('todo_tasks')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setTodoList(prev => [...prev, mapTodoFromDb(data)]);
    }
  };

  const addObservation = async (obs: Omit<Observation, 'id'>) => {
    if (!supabase) {
      const newId = (observations.length + 1).toString();
      setObservations(prev => [...prev, { ...obs, id: newId }]);
      return;
    }
    if (!targetUserId) throw new Error("No active farmer selected");
    const dbData = {
      date: obs.date,
      tag: obs.tag,
      observation: obs.observation,
      severity: obs.severity,
      observer: obs.observer,
      status: obs.status || 'unresolved',
      user_id: targetUserId,
    };
    const { data, error } = await supabase
      .from('observations')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setObservations(prev => [...prev, mapObservationFromDb(data)]);
    }
  };

  const toggleTodoStatus = async (id: string, currentStatus: 'pending' | 'completed' | 'overdue') => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    if (!supabase) {
      setTodoList(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      return;
    }
    const { error } = await supabase
      .from('todo_tasks')
      .update({ status: newStatus, last_edited: new Date().toISOString().split('T')[0] })
      .eq('id', id);

    if (error) throw error;
    setTodoList(prev => prev.map(t => t.id === id ? { ...t, status: newStatus, lastEdited: new Date().toISOString().split('T')[0] } : t));
  };

  const updateFarmEvent = async (id: string, updates: Partial<FarmEvent>) => {
    if (!supabase) {
      setFarmEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      return;
    }
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.event !== undefined) dbUpdates.event = updates.event;
    if (updates.tag !== undefined) dbUpdates.tag = updates.tag;
    if (updates.diagnosis !== undefined) dbUpdates.diagnosis = updates.diagnosis;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.doneBy !== undefined) dbUpdates.done_by = updates.doneBy;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { data, error } = await supabase
      .from('farm_events')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setFarmEvents(prev => prev.map(e => e.id === id ? mapFarmEventFromDb(data) : e));
    }
  };

  const updateObservation = async (id: string, updates: Partial<Observation>) => {
    if (!supabase) {
      setObservations(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
      return;
    }
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.tag !== undefined) dbUpdates.tag = updates.tag;
    if (updates.observation !== undefined) dbUpdates.observation = updates.observation;
    if (updates.severity !== undefined) dbUpdates.severity = updates.severity;
    if (updates.observer !== undefined) dbUpdates.observer = updates.observer;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { data, error } = await supabase
      .from('observations')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setObservations(prev => prev.map(o => o.id === id ? mapObservationFromDb(data) : o));
    }
  };

  const updateTodoTask = async (id: string, updates: Partial<TodoTask>) => {
    if (!supabase) {
      setTodoList(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      return;
    }
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.createdBy !== undefined) dbUpdates.created_by = updates.createdBy;
    if (updates.lastEdited !== undefined) dbUpdates.last_edited = updates.lastEdited;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

    const { data, error } = await supabase
      .from('todo_tasks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setTodoList(prev => prev.map(t => t.id === id ? mapTodoFromDb(data) : t));
    }
  };

  const saveAnimalWeight = async (record: Omit<AnimalWeight, 'id'>) => {
    if (!supabase) {
      setAnimalWeights(prev => {
        const index = prev.findIndex(w => w.animalTag.toLowerCase() === record.animalTag.toLowerCase() && w.year === record.year);
        const newRecord = { ...record, id: (prev.length + 1).toString() };
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = newRecord;
          return copy;
        }
        return [...prev, newRecord];
      });
      return;
    }
    const dbData = {
      user_id: targetUserId,
      animal_tag: record.animalTag,
      year: record.year,
      jan: record.jan ? Number(record.jan) : null,
      feb: record.feb ? Number(record.feb) : null,
      mar: record.mar ? Number(record.mar) : null,
      apr: record.apr ? Number(record.apr) : null,
      may: record.may ? Number(record.may) : null,
      jun: record.jun ? Number(record.jun) : null,
      jul: record.jul ? Number(record.jul) : null,
      aug: record.aug ? Number(record.aug) : null,
      sep: record.sep ? Number(record.sep) : null,
      oct: record.oct ? Number(record.oct) : null,
      nov: record.nov ? Number(record.nov) : null,
      dec: record.dec ? Number(record.dec) : null,
    };

    const { data, error } = await supabase
      .from('animal_weights')
      .upsert(dbData, { onConflict: 'user_id,animal_tag,year' })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      const mapped = mapWeightFromDb(data);
      setAnimalWeights(prev => {
        const index = prev.findIndex(w => w.animalTag.toLowerCase() === record.animalTag.toLowerCase() && w.year === record.year);
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = mapped;
          return copy;
        }
        return [...prev, mapped];
      });
    }
  };

  const updateFarmInspection = async (updatesOrField: Partial<FarmInspection> | keyof FarmInspection, value?: any) => {
    let updates: Partial<FarmInspection> = {};
    if (typeof updatesOrField === 'string') {
      updates = { [updatesOrField]: value };
    } else {
      updates = updatesOrField;
    }

    let updated = { ...farmInspection, ...updates };

    // 1. Recalculate biosecurityRating if any related parameters change
    if (
      'quarantineIntakeIsolation' in updates ||
      'herdTrackingMovementLogs' in updates ||
      'farmBoundaryPestControl' in updates ||
      'sanitationVisitorControl' in updates
    ) {
      updated.biosecurityRating = Number(
        ((updated.quarantineIntakeIsolation + updated.herdTrackingMovementLogs + updated.farmBoundaryPestControl + updated.sanitationVisitorControl) / 4).toFixed(2)
      );
    }

    // 2. Recalculate dewormingPractice if any related parameters change
    if (
      'dewormingTiming' in updates ||
      'dewormingRotation' in updates ||
      'dewormingPrecision' in updates ||
      'dewormingTargeted' in updates
    ) {
      updated.dewormingPractice = Number(
        ((updated.dewormingTiming + updated.dewormingRotation + updated.dewormingPrecision + updated.dewormingTargeted) / 4).toFixed(2)
      );
    }

    // 3. Recalculate prudentAnthelmintic if any related parameters change
    if (
      'anthelminticClassSelection' in updates ||
      'anthelminticAdminRoute' in updates ||
      'anthelminticEquipmentCalib' in updates ||
      'anthelminticWithholdingComp' in updates
    ) {
      updated.prudentAnthelmintic = Number(
        ((updated.anthelminticClassSelection + updated.anthelminticAdminRoute + updated.anthelminticEquipmentCalib + updated.anthelminticWithholdingComp) / 4).toFixed(2)
      );
    }

    // 4. Recalculate prudentAntibiotics if any related parameters change
    if (
      'antibioticPrescriptionControl' in updates ||
      'antibioticDrugClassification' in updates ||
      'antibioticTreatmentRecords' in updates ||
      'antibioticCourseCompletion' in updates
    ) {
      updated.prudentAntibiotics = Number(
        ((updated.antibioticPrescriptionControl + updated.antibioticDrugClassification + updated.antibioticTreatmentRecords + updated.antibioticCourseCompletion) / 4).toFixed(2)
      );
    }

    // 5. Recalculate cpdStaffControl if any related parameters change
    if (
      'cpdTrainingFrequency' in updates ||
      'cpdProtocolAwareness' in updates ||
      'cpdVetCollaboration' in updates ||
      'cpdBenchmarkTracking' in updates
    ) {
      updated.cpdStaffControl = Number(
        ((updated.cpdTrainingFrequency + updated.cpdProtocolAwareness + updated.cpdVetCollaboration + updated.cpdBenchmarkTracking) / 4).toFixed(2)
      );
    }

    // 6. Recalculate vaccinationCoverage if any related parameters change
    if (
      'vaccProtocolAdherence' in updates ||
      'vaccHerdPenetration' in updates ||
      'vaccTimingAccuracy' in updates ||
      'vaccColdChainIntegrity' in updates
    ) {
      updated.vaccinationCoverage = Number(
        ((updated.vaccProtocolAdherence + updated.vaccHerdPenetration + updated.vaccTimingAccuracy + updated.vaccColdChainIntegrity) / 4).toFixed(2)
      );
    }

    // 7. Recalculate drugBoxManagement if any related parameters change
    if (
      'dbExpiryInventory' in updates ||
      'dbStorageCleanliness' in updates ||
      'dbSecurityAccess' in updates ||
      'dbDisposalPractices' in updates
    ) {
      updated.drugBoxManagement = Number(
        ((updated.dbExpiryInventory + updated.dbStorageCleanliness + updated.dbSecurityAccess + updated.dbDisposalPractices) / 4).toFixed(2)
      );
    }

    // 8. Recalculate nutritionalDeficiencies if any related parameters change
    if (
      'dungConsistency' in updates ||
      'rumenFill' in updates ||
      'coatSkin' in updates ||
      'motilityLocomotion' in updates
    ) {
      updated.nutritionalDeficiencies = Number(
        ((updated.dungConsistency + updated.rumenFill + updated.coatSkin + updated.motilityLocomotion) / 4).toFixed(2)
      );
    }

    // 9. Recalculate growthRatePerception if any related parameters change
    if (
      'muscleDefinition' in updates ||
      'frameSizing' in updates ||
      'fatCoverDevelopment' in updates ||
      'skeletalSymmetry' in updates
    ) {
      updated.growthRatePerception = Number(
        ((updated.muscleDefinition + updated.frameSizing + updated.fatCoverDevelopment + updated.skeletalSymmetry) / 4).toFixed(2)
      );
    }

    // 10. Recalculate overallNutritionalHealth if any related parameters change
    if (
      'bunkFeedAvailability' in updates ||
      'rationSortingBehaviour' in updates ||
      'waterQualityAccess' in updates ||
      'forageQualityPerception' in updates
    ) {
      updated.overallNutritionalHealth = Number(
        ((updated.bunkFeedAvailability + updated.rationSortingBehaviour + updated.waterQualityAccess + updated.forageQualityPerception) / 4).toFixed(2)
      );
    }

    const nowStr = new Date().toISOString();
    const updatedWithTime = { ...updated, updatedAt: nowStr };
    setFarmInspection(updatedWithTime);

    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      if (!targetUserId) throw new Error("No target user ID — admin may have no selectedFarmer");
      console.log('[updateFarmInspection] Saving to user_id:', targetUserId);
      console.log('[updateFarmInspection] recordsOverrides:', JSON.stringify(updated.recordsOverrides));
      
      const { updatedAt: _, ...dbData } = updated;
      const { data: saveResult, error } = await supabase
        .from('farm_inspections')
        .update({ data: dbData, updated_at: nowStr })
        .eq('user_id', targetUserId)
        .select('id, user_id, updated_at');
      if (error) {
        console.error('[updateFarmInspection] Supabase error:', error);
        throw error;
      }
      console.log('[updateFarmInspection] Save success:', JSON.stringify(saveResult));
    } catch (error) {
      console.error('Error updating farm inspection in Supabase:', error);
    }
  };

  const updateAnimal = async (tag: string, updates: Partial<Animal>) => {
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      
      const dbUpdates: any = {};
      if (updates.tag !== undefined) dbUpdates.tag = updates.tag;
      if (updates.age !== undefined) dbUpdates.age = updates.age;
      if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth || null;
      if (updates.breed !== undefined) dbUpdates.breed = updates.breed;
      if (updates.sex !== undefined) dbUpdates.sex = updates.sex;
      if (updates.stockType !== undefined) dbUpdates.stock_type = updates.stockType;
      if (updates.source !== undefined) dbUpdates.source = updates.source;
      if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
      if (updates.previousWeight !== undefined) dbUpdates.previous_weight = updates.previousWeight;
      if (updates.daysBetweenWeights !== undefined) dbUpdates.days_between_weights = updates.daysBetweenWeights;
      if (updates.bcs !== undefined) dbUpdates.bcs = updates.bcs;
      if (updates.isBreedingCow !== undefined) dbUpdates.is_breeding_cow = updates.isBreedingCow;
      if (updates.observer !== undefined) dbUpdates.observer = updates.observer;
      if (updates.birthWeight !== undefined) dbUpdates.birth_weight = updates.birthWeight;
      if (updates.deliveryType !== undefined) dbUpdates.delivery_type = updates.deliveryType;
      if (updates.sire !== undefined) dbUpdates.sire = updates.sire;
      if (updates.dam !== undefined) dbUpdates.dam = updates.dam;
      if (updates.dateOfWeaning !== undefined) dbUpdates.date_of_weaning = updates.dateOfWeaning || null;
      if (updates.weaningWeight !== undefined) dbUpdates.weaning_weight = updates.weaningWeight != null ? Number(updates.weaningWeight) : null;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.weight30day !== undefined) dbUpdates.weight_30day = updates.weight30day != null ? Number(updates.weight30day) : null;
      if (updates.weight100day !== undefined) dbUpdates.weight_100day = updates.weight100day != null ? Number(updates.weight100day) : null;
      if (updates.weight1weekPostWeaning !== undefined) dbUpdates.weight_1week_post_weaning = updates.weight1weekPostWeaning != null ? Number(updates.weight1weekPostWeaning) : null;
      if (updates.weight6monthsPostWeaning !== undefined) dbUpdates.weight_6months_post_weaning = updates.weight6monthsPostWeaning != null ? Number(updates.weight6monthsPostWeaning) : null;
      if (updates.calfStatus !== undefined) dbUpdates.calf_status = updates.calfStatus || null;
      if (updates.preWeaningMortality !== undefined) dbUpdates.pre_weaning_mortality = updates.preWeaningMortality ?? false;

      if (!targetUserId) throw new Error("No active farmer selected");
      const { data, error } = await supabase
        .from('animals')
        .update(dbUpdates)
        .eq('tag', tag)
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setAnimals(prev => prev.map(a => a.tag.toLowerCase() === tag.toLowerCase() ? mapAnimalFromDb(data) : a));
      }
    } catch (error) {
      console.error('Error updating animal in Supabase:', error);
      // Fallback
      setAnimals(prev => prev.map(a => a.tag.toLowerCase() === tag.toLowerCase() ? { ...a, ...updates } : a));
    }
  };

  const updateAnimalWeight = async (tag: string, weight: number, previousWeight?: number, daysBetweenWeights?: number) => {
    try {
      if (!supabase) throw new Error("Supabase client is not initialized");
      const animal = animals.find(a => a.tag.toLowerCase() === tag.toLowerCase());
      if (!animal) return;

      const updatedFields = {
        weight,
        previous_weight: previousWeight !== undefined ? previousWeight : animal.previousWeight,
        days_between_weights: daysBetweenWeights !== undefined ? daysBetweenWeights : 30,
      };

      if (!targetUserId) throw new Error("No active farmer selected");
      const { data, error } = await supabase
        .from('animals')
        .update(updatedFields)
        .eq('tag', animal.tag)
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setAnimals(prev => prev.map(a => a.tag.toLowerCase() === tag.toLowerCase() ? mapAnimalFromDb(data) : a));
      }
    } catch (error) {
      console.error('Error updating animal weight:', error);
      // Fallback
      setAnimals(prevAnimals => prevAnimals.map(a => {
        if (a.tag.toLowerCase() === tag.toLowerCase()) {
          return {
            ...a,
            weight,
            previousWeight: previousWeight !== undefined ? previousWeight : a.previousWeight,
            daysBetweenWeights: daysBetweenWeights !== undefined ? daysBetweenWeights : 30,
          };
        }
        return a;
      }));
    }
  };


  // --- FORMULAS & CALCULATIONS ---

  // A. NUTRITION CALCULATIONS
  
  // 1. Weight Gain Metrics (WGM) / Average Daily Gain (ADG)
  // Formula: DLWG = (current weight - previous weight) / days between weights
  const calculateADG = () => {
    const isDemo = targetUserId === '76408c11-021a-4fdd-a17c-6b90065182b7';
    const totals = { goats: 0.12, cattle: 0.85, sheep: 0.18, pigs: 0.65 };
    const counts = { goats: 0, cattle: 0, sheep: 0, pigs: 0 };

    animals.forEach(a => {
      if (a.weight && a.previousWeight && a.daysBetweenWeights && a.daysBetweenWeights > 0) {
        const adg = (a.weight - a.previousWeight) / a.daysBetweenWeights;
        if (a.stockType === 'Goat') {
          totals.goats += adg;
          counts.goats++;
        } else if (a.stockType === 'Cow' || a.stockType === 'Bull' || a.stockType === 'Steer' || a.stockType === 'Heifer') {
          totals.cattle += adg;
          counts.cattle++;
        } else if (a.stockType === 'Sheep') {
          totals.sheep += adg;
          counts.sheep++;
        } else if (a.stockType === 'Pig') {
          totals.pigs += adg;
          counts.pigs++;
        }
      }
    });

    return {
      goats: counts.goats > 0 ? Number((totals.goats / counts.goats).toFixed(3)) : (isDemo ? 0.12 : 0),
      cattle: counts.cattle > 0 ? Number((totals.cattle / counts.cattle).toFixed(2)) : (isDemo ? 0.85 : 0),
      sheep: counts.sheep > 0 ? Number((totals.sheep / counts.sheep).toFixed(3)) : (isDemo ? 0.18 : 0),
      pigs: counts.pigs > 0 ? Number((totals.pigs / counts.pigs).toFixed(2)) : (isDemo ? 0.65 : 0),
    };
  };

  // 2. Feed Conversion Ratio (FCR)
  const calculateFCR = () => {
    const isDemo = targetUserId === '76408c11-021a-4fdd-a17c-6b90065182b7';
    // Cattle: FCR = Total feed consumed (kgs) / Total animal weight gain (final weight - induction weight)
    const cattleFeed = feedRecords
      .filter(f => f.animalGroup === 'Cattle-fattening')
      .reduce((sum, f) => sum + f.quantityConsumed, 0);
    const cattleWeightGain = animals
      .filter(a => a.stockType === 'Bull' || a.stockType === 'Steer')
      .reduce((sum, a) => sum + ((a.weight || 0) - (a.previousWeight || 0)), 0);
    const cattleFCR = cattleWeightGain > 0 ? cattleFeed / cattleWeightGain : (isDemo ? 9.5 : 0); // default 9.5 (Good range 8-12)

    // Chicken (meat): FCR = Total feed / total weight gain
    const chickenFeed = feedRecords
      .filter(f => f.animalGroup === 'Poultry-broilers')
      .reduce((sum, f) => sum + f.quantityConsumed, 0);
    const chickenFCR = chickenFeed > 0 ? chickenFeed / 150 : (isDemo ? 1.7 : 0); // default 1.7 (Good range 1.5 - 2.0)

    // Dairy: FCR = Total feed consumed (kg) / Total milk produced (liters)
    const dairyFeed = feedRecords
      .filter(f => f.animalGroup === 'Dairy-cows')
      .reduce((sum, f) => sum + f.quantityConsumed, 0);
    const milkProd = productionRecords
      .filter(p => p.type === 'Milk')
      .reduce((sum, p) => sum + p.quantity, 0);
    const dairyFCR = milkProd > 0 ? dairyFeed / milkProd : (isDemo ? 5.8 : 0); // default 5.8

    // Pigs: default 3.2 (Good range 3.0-3.9)
    const pigsFCR = isDemo ? 3.2 : 0;

    return {
      cattle: Number(cattleFCR.toFixed(1)),
      chicken: Number(chickenFCR.toFixed(2)),
      dairy: Number(dairyFCR.toFixed(1)),
      pigs: Number(pigsFCR.toFixed(1)),
    };
  };

  // 3. Body Condition Score (BCS)
  const calculateBCS = () => {
    const isDemo = targetUserId === '76408c11-021a-4fdd-a17c-6b90065182b7';
    const animalsWithBCS = animals.filter(a => a.bcs !== undefined);
    const averageHerdBCS = animalsWithBCS.length > 0
      ? animalsWithBCS.reduce((sum, a) => sum + (a.bcs || 0), 0) / animalsWithBCS.length
      : (isDemo ? 3.2 : 0);

    const breedingCows = animals.filter(a => a.isBreedingCow && a.bcs !== undefined);
    const averageBreedingBCS = breedingCows.length > 0
      ? breedingCows.reduce((sum, a) => sum + (a.bcs || 0), 0) / breedingCows.length
      : (isDemo ? 3.3 : 0);

    return {
      averageHerdBCS: Number(averageHerdBCS.toFixed(2)),
      averageBreedingBCS: Number(averageBreedingBCS.toFixed(2)),
    };
  };

  // B. REPRODUCTION CALCULATIONS
  
  // 1. Average Birthing-to-first service interval
  // Formula: sum(dateServed - actualCalvingDate) / Total
  const calculateReproductionMetrics = () => {
    const isDemo = targetUserId === '76408c11-021a-4fdd-a17c-6b90065182b7';
    // birthing-to-first service interval: target 65-75 days
    let totalIntervalDays = 0;
    let countInterval = 0;

    pregnancyRecords.forEach(p => {
      if (p.actualCalvingDate) {
        const breedRec = breedingRecords.find(b => b.earTagNumber === p.cowEarTag);
        if (breedRec && breedRec.servicedDate) {
          const birthTime = new Date(p.actualCalvingDate).getTime();
          const serviceTime = new Date(breedRec.servicedDate).getTime();
          const diffDays = (serviceTime - birthTime) / (1000 * 60 * 60 * 24);
          if (diffDays > 0) {
            totalIntervalDays += diffDays;
            countInterval++;
          }
        }
      }
    });

    const avgBirthingToServiceInterval = countInterval > 0
      ? Math.round(totalIntervalDays / countInterval)
      : (isDemo ? 70 : 0); // Target: 65-75 days

    // Heat Detection Rate
    // Proportion of eligible cows correctly identified in heat & served over 21d period
    // Mock default 72% (Target: 70%)
    const heatDetectionRate = isDemo ? 72 : 0;

    // Submission Rate (SR)
    // Proportion of eligible cows served in a 21d period
    const submissionRate = isDemo ? 75 : 0; // Target: 70%

    // Conception Rate
    // Conception rate = (number of pregnant cows / number of cows serviced) * 100
    const servicedCows = breedingRecords.filter(b => b.servicedDate).length;
    const pregnantCows = breedingRecords.filter(b => b.breedingStatus === 'Confirmed Pregnant').length;
    const conceptionRate = servicedCows > 0 ? Math.round((pregnantCows / servicedCows) * 100) : (isDemo ? 67 : 0); // Target: >65%

    // Pregnancy Rates (28d, 42d, 200d)
    const pregnancyRate28d = isDemo ? 72 : 0; // Target: >=70%
    const pregnancyRate42d = isDemo ? 78 : 0; // Target: >=75%
    const pregnancyRate200d = isDemo ? 92 : 0; // Target: 90%+
    const pregnancyRateCycle = isDemo ? 58 : 0; // Target: 55%+

    // Calving Rates
    const calvingRate21d = isDemo ? 68 : 0; // Target: >=65%
    
    // Barren Cow Rate
    // Target: <=5%
    const barrenCowRate = isDemo ? 4.5 : 0;

    // Calving Percentage
    const calvingPercentage = isDemo ? 96 : 0; // Target: >95%

    return {
      avgBirthingToServiceInterval,
      heatDetectionRate,
      submissionRate,
      conceptionRate,
      pregnancyRate28d,
      pregnancyRate42d,
      pregnancyRate200d,
      pregnancyRateCycle,
      calvingRate21d,
      barrenCowRate,
      calvingPercentage,
    };
  };

  // C. PRODUCTION CALCULATIONS
  const calculateProductionMetrics = () => {
    const isDemo = targetUserId === '76408c11-021a-4fdd-a17c-6b90065182b7';
    // 1. Weaning Percentage (Calf crop)
    // Target: >=94%
    const weaningPercentage = isDemo ? 95 : 0;

    // 2. Pre-weaning DLWG: target > 0.7kg/day
    const preWeaningDLWG = isDemo ? 0.75 : 0;

    // 3. Post-weaning DLWG: target >0.8-1.0kg/day
    const postWeaningDLWG = isDemo ? 0.92 : 0;

    // 4. Mortality Rates
    // Pre-weaning: (died pre-weaning / born) * 100
    // Post-weaning: (died post-weaning / weaned) * 100
    // Herd: deaths / (opening stock + newborns) * 100
    const preWeaningMortCount = mortalityRecords.filter(m => m.isPreWeaning).length;
    const postWeaningMortCount = mortalityRecords.filter(m => !m.isPreWeaning).length;
    
    const preWeaningMortality = pregnancyRecords.length > 0 ? (preWeaningMortCount / pregnancyRecords.length) * 100 : (isDemo ? 3.5 : 0);
    const postWeaningMortality = animals.length > 0 ? (postWeaningMortCount / animals.length) * 100 : (isDemo ? 2.8 : 0);
    const herdMortality = animals.length > 0 ? (mortalityRecords.length / (animals.length + 1)) * 100 : (isDemo ? 3.0 : 0);

    return {
      weaningPercentage,
      preWeaningDLWG,
      postWeaningDLWG,
      mortalityRates: {
        preWeaning: Number(preWeaningMortality.toFixed(1)),
        postWeaning: Number(postWeaningMortality.toFixed(1)),
        herd: Number(herdMortality.toFixed(1)),
        chicken: isDemo ? 4.2 : 0, // Target: <5%
      },
      weaningRate: isDemo ? 76 : 0, // Target: 70-80%
    };
  };

  // D. CATEGORY SCORES
  const calculateCategoryScores = (
    adg: { cattle: number }, 
    fcr: { cattle: number }, 
    bcs: { averageHerdBCS: number },
    repro: { conceptionRate: number; calvingPercentage: number },
    prod: { mortalityRates: { herd: number } }
  ) => {
    if (loadingData) {
      return {
        scoreNutrition: 0,
        scoreGenetics: 0,
        scoreHealth: 0,
        scoreProduction: 0,
        scoreRecords: 0,
        scoreDLShift: 0,
      };
    }

    const isDemo = targetUserId === '76408c11-021a-4fdd-a17c-6b90065182b7';
    const hasAnimals = animals.length > 0 || isDemo;

    // 1. NUTRITION SCORE (0-100)
    let adgPts = !hasAnimals ? 0 : (adg.cattle >= 0.9 ? 100 : (adg.cattle / 0.9) * 100);
    let fcrPts = !hasAnimals ? 0 : (fcr.cattle <= 8 ? 100 : fcr.cattle >= 12 ? 50 : 100 - (fcr.cattle - 8) * 12.5);
    let bcsPts = !hasAnimals ? 0 : ((bcs.averageHerdBCS >= 2.0 && bcs.averageHerdBCS <= 4.0) ? 100 : 60);
    
    const hasInspection = farmInspection.nutritionalDeficiencies > 0;
    const subjNutrition = !hasInspection ? 0 : (farmInspection.nutritionalDeficiencies + farmInspection.growthRatePerception + farmInspection.overallNutritionalHealth) / 15 * 100;
    
    let nutritionCount = 0;
    if (adgPts > 0) nutritionCount++;
    if (fcrPts > 0) nutritionCount++;
    if (bcsPts > 0) nutritionCount++;
    if (subjNutrition > 0) nutritionCount++;
    
    const scoreNutrition = nutritionCount > 0 
      ? Math.round((adgPts + fcrPts + bcsPts + subjNutrition) / nutritionCount)
      : 0;

    // 2. GENETICS SCORE (0-100)
    const hasBreeding = breedingRecords.length > 0 || isDemo;
    let conceptionPts = !hasBreeding ? 0 : (repro.conceptionRate >= 65 ? 100 : (repro.conceptionRate / 65) * 100);
    let calvingPts = !hasBreeding ? 0 : (repro.calvingPercentage >= 95 ? 100 : 80);
    const subjGenetics = farmInspection.overallGeneticReproductivePerformance === 0 ? 0 : (farmInspection.overallGeneticReproductivePerformance + farmInspection.overallGeneticQuality) / 10 * 100;
    
    let geneticsCount = 0;
    if (conceptionPts > 0) geneticsCount++;
    if (calvingPts > 0) geneticsCount++;
    if (subjGenetics > 0) geneticsCount++;
    
    const scoreGenetics = geneticsCount > 0
      ? Math.round((conceptionPts + calvingPts + subjGenetics) / geneticsCount)
      : 0;

    // 3. HEALTH SCORE (0-100)
    const scoreHealth = hasInspection ? Math.round(
      (farmInspection.vaccinationCoverage +
        farmInspection.biosecurityRating +
        farmInspection.dewormingPractice +
        farmInspection.prudentAnthelmintic +
        farmInspection.prudentAntibiotics +
        farmInspection.drugBoxManagement +
        farmInspection.cpdStaffControl) / 35 * 100
    ) : 0;

    // 4. PRODUCTION SCORE (0-100)
    let mortPts = !hasAnimals ? 0 : (prod.mortalityRates.herd <= 5 ? 100 : Math.max(100 - (prod.mortalityRates.herd - 5) * 10, 0));
    let weaningPts = !hasAnimals ? 0 : 95; // target weaning percentage
    
    let productionCount = 0;
    if (mortPts > 0) productionCount++;
    if (weaningPts > 0) productionCount++;
    
    const scoreProduction = productionCount > 0 ? Math.round((mortPts + weaningPts) / productionCount) : 0;

    // 5. RECORDS SCORE (0-100)
    let tracePoints = 0;
    if (farmInspection.maintainsBirth) tracePoints += 20;
    if (farmInspection.maintainsMovements) tracePoints += 20;
    if (farmInspection.maintainsHealth) tracePoints += 20;
    if (farmInspection.maintainsMortalities) tracePoints += 20;
    if (farmInspection.maintainsFeed) tracePoints += 20;

    const subjRecords = farmInspection.recordsSatisfaction === 0 ? 0 : (farmInspection.recordsSatisfaction + farmInspection.recordsTrainingEvidence + farmInspection.recordAccessibilityUsage) / 15 * 100;
    
    let recordsCount = 0;
    if (tracePoints > 0) recordsCount++;
    if (subjRecords > 0) recordsCount++;
    
    const scoreRecords = recordsCount > 0 ? Math.round((tracePoints + subjRecords) / recordsCount) : 0;

    // 6. OVERALL DLSHIFT SCORE (average of active category scores)
    let activeCategories = 0;
    let sumScores = 0;
    if (scoreNutrition > 0) { activeCategories++; sumScores += scoreNutrition; }
    if (scoreGenetics > 0) { activeCategories++; sumScores += scoreGenetics; }
    if (scoreHealth > 0) { activeCategories++; sumScores += scoreHealth; }
    if (scoreProduction > 0) { activeCategories++; sumScores += scoreProduction; }
    if (scoreRecords > 0) { activeCategories++; sumScores += scoreRecords; }
    
    const scoreDLShift = activeCategories > 0 ? Math.round(sumScores / activeCategories) : 0;

    return {
      scoreNutrition,
      scoreGenetics,
      scoreHealth,
      scoreProduction,
      scoreRecords,
      scoreDLShift,
    };
  };

  // Run Calculations
  const adg = calculateADG();
  const fcr = calculateFCR();
  const bcs = calculateBCS();
  const repro = calculateReproductionMetrics();
  const prod = calculateProductionMetrics();
  
  const scores = calculateCategoryScores(adg, fcr, bcs, repro, prod);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates };

    if (updates.owner_first_name !== undefined || updates.owner_last_name !== undefined) {
      const first = updates.owner_first_name !== undefined ? updates.owner_first_name : (profile.owner_first_name || '');
      const last = updates.owner_last_name !== undefined ? updates.owner_last_name : (profile.owner_last_name || '');
      newProfile.full_name = `${first} ${last}`.trim() || undefined;
    }

    setProfile(newProfile);
    
    try {
      const extraData = {
        owner_first_name: newProfile.owner_first_name,
        owner_last_name: newProfile.owner_last_name,
        address: newProfile.address,
        location: newProfile.location,
        province: newProfile.province,
        phone_number: newProfile.phone_number,
        email: newProfile.email,
      };
      await AsyncStorage.setItem(`profile_extra_${profile.id}`, JSON.stringify(extraData));
    } catch (e) {
      console.error("Error saving profile extras to AsyncStorage:", e);
    }

    if (supabase) {
      const dbUpdates: any = {};
      if (newProfile.full_name !== undefined) dbUpdates.full_name = newProfile.full_name;
      if (newProfile.farm_name !== undefined) dbUpdates.farm_name = newProfile.farm_name;
      
      if (Object.keys(dbUpdates).length > 0) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', profile.id);
          if (error) throw error;
        } catch (e) {
          console.error("Error updating profile in Supabase:", e);
        }
      }
    }
  };

  return (
    <FarmDataContext.Provider
      value={{
        animals,
        healthRecords,
        breedingRecords,
        pregnancyRecords,
        feedRecords,
        productionRecords,
        mortalityRecords,
        transactions,
        farmInspection,
        bullBreedingRecords,
        animalWeights,
        drugs,
        feedInventory,
        addAnimal,
        deleteAnimal,
        addHealthRecord,
        addBreedingRecord,
        addPregnancyRecord,
        addFeedRecord,
        addProductionRecord,
        addMortalityRecord,
        addTransaction,
        updateFarmInspection,
        updateAnimal,
        updateAnimalWeight,
        addBullBreedingRecord,
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
        farmEvents,
        todoList,
        observations,
        addFarmEvent,
        addTodoTask,
        addObservation,
        toggleTodoStatus,
        updateFarmEvent,
        updateObservation,
        updateTodoTask,

        // Auth values
        user,
        session,
        profile,
        loadingAuth,
        farmers,
        selectedFarmer,
        setSelectedFarmer,
        logout,
        deleteAccount,
        updateProfile,

        metrics: {
          adg,
          fcr,
          averageHerdBCS: bcs.averageHerdBCS,
          averageBreedingBCS: bcs.averageBreedingBCS,
          ...repro,
          ...prod,
          ...scores,
        },
      }}
    >
      {children}
    </FarmDataContext.Provider>
  );
};

export const useFarmData = () => {
  const context = useContext(FarmDataContext);
  if (context === undefined) {
    throw new Error('useFarmData must be used within a FarmDataProvider');
  }
  return context;
};
