-- Drop existing tables to ensure a clean slate
DROP TABLE IF EXISTS vet_lab_reports;
DROP TABLE IF EXISTS vet_consultation_reports;
DROP TABLE IF EXISTS vet_post_mortem_reports;
DROP TABLE IF EXISTS vet_ai_reports;
DROP TABLE IF EXISTS vet_pregnancy_reports;
DROP TABLE IF EXISTS vet_special_consult_reports;

-- Veterinary Laboratory Diagnostic Reports
CREATE TABLE vet_lab_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  report_date date NOT NULL,
  case_number text,
  attending_vet text,
  animal_id text,
  species_breed text,
  age_sex text,
  collection_method text,
  smear_quality text,
  rbc_anisocytosis text,
  rbc_polychromasia text,
  rbc_poikilocytosis text,
  rbc_nucleated text,
  wbc_neutrophils text,
  wbc_lymphocytes text,
  wbc_monocytes text,
  wbc_eosinophils text,
  wbc_basophils text,
  platelet_estimation text,
  blood_parasites text,
  fecal_collection text,
  fecal_gross text,
  fecal_flotation text,
  fecal_quantitative text,
  fecal_sedimentation text,
  fecal_direct_smear text,
  urine_collection text,
  urine_physical text,
  urine_ph text,
  urine_protein text,
  urine_glucose text,
  urine_ketones text,
  urine_blood text,
  urine_sediment text,
  ref_lab_name text,
  ref_lab_tracking text,
  ref_lab_tests text,
  ref_lab_accession text,
  ref_lab_status text,
  diagnostic_summary text,
  clinical_correlation text,
  interim_treatment text
);

-- Enable RLS and create policy for vet_lab_reports
ALTER TABLE vet_lab_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own vet_lab_reports" ON vet_lab_reports
  FOR ALL USING (auth.uid() = user_id);

-- Veterinary Consultation Reports
CREATE TABLE vet_consultation_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  report_date date NOT NULL,
  visit_date date,
  case_number text,
  attending_vet text,
  client_name text,
  contact_person text,
  address text,
  holding_number text,
  enterprise_type text,
  total_stock text,
  primary_purpose text,
  presenting_complaints text,
  group_behavior text,
  average_bcs text,
  clinical_signs text,
  individual_exams text,
  housing_ventilation text,
  biosecurity text,
  nutrition text,
  pasture_management text,
  blood_samples text,
  fecal_samples text,
  milk_samples text,
  other_samples text,
  preliminary_diagnosis text,
  definitive_diagnosis text,
  prescriptions text,
  meat_withdrawal text,
  milk_withdrawal text,
  isolate_management text,
  husbandry_changes text,
  vaccination_updates text,
  nutritional_adjustments text,
  follow_up_required boolean DEFAULT false,
  follow_up_date date
);

-- Enable RLS and create policy for vet_consultation_reports
ALTER TABLE vet_consultation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own vet_consultation_reports" ON vet_consultation_reports
  FOR ALL USING (auth.uid() = user_id);

-- Veterinary Post-Mortem Examination Reports
CREATE TABLE vet_post_mortem_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  report_date date NOT NULL,
  case_number text,
  pathologist text,
  referring_vet text,
  client_name text,
  animal_id text,
  species text,
  breed text,
  sex text,
  age text,
  weight text,
  history_summary text,
  time_of_death timestamp with time zone,
  time_of_pm timestamp with time zone,
  method_of_death text,
  storage_history text,
  bcs text,
  hydration text,
  mucous_membranes text,
  head_cavity text,
  integument text,
  genitalia text,
  musculoskeletal text,
  body_cavities text,
  cardiovascular text,
  respiratory text,
  digestive text,
  hepatobiliary text,
  spleen_lymph text,
  urinary text,
  endocrine text,
  reproductive text,
  nervous text,
  histopathology text,
  microbiology text,
  toxicology text,
  cytology text,
  primary_diagnosis text,
  secondary_diagnosis text,
  tertiary_finding text,
  morphological_diagnosis text,
  suspected_cause text,
  comments text
);

-- Enable RLS and create policy for vet_post_mortem_reports
ALTER TABLE vet_post_mortem_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own vet_post_mortem_reports" ON vet_post_mortem_reports
  FOR ALL USING (auth.uid() = user_id);

-- Veterinary Artificial Insemination (AI) Record Reports
CREATE TABLE vet_ai_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  record_date date NOT NULL,
  ai_technician text,
  session_type text,
  sync_protocol text,
  protocol_dates text,
  straw_id text,
  sire_name text,
  sire_breed text,
  semen_provider text,
  semen_type text,
  batch_number text,
  storage_location text,
  thawing_temp text,
  thawing_duration text,
  post_thaw_motility text,
  straw_integrity text,
  animal_id text,
  eid text,
  age_parity text,
  days_open text,
  heat_signs text,
  estrus_score text,
  ai_date timestamp with time zone,
  time_elapsed text,
  insemination_site text,
  ease_of_service text,
  hygiene_status text,
  concurrent_treatments text,
  scheduled_return_check date,
  scheduled_pregnancy_check date,
  preferred_diagnostic text,
  expected_calving_date date
);

-- Enable RLS and create policy for vet_ai_reports
ALTER TABLE vet_ai_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own vet_ai_reports" ON vet_ai_reports
  FOR ALL USING (auth.uid() = user_id);

-- Veterinary Pregnancy Diagnosis Reports
CREATE TABLE vet_pregnancy_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  report_date date NOT NULL,
  exam_date date,
  examining_vet text,
  farm_name text,
  diagnostic_method text,
  animal_id text,
  species_breed text,
  last_breeding_date date,
  days_post_breeding text,
  pregnancy_status text,
  est_gestation_age text,
  expected_birthing_date date,
  fetal_viability text,
  twin_status text,
  uterine_fluid text,
  ovarian_status text,
  total_examined integer,
  total_pregnant integer,
  total_open integer,
  total_rechecks integer,
  conception_rate text,
  abortion_rate text,
  open_intervention text,
  nutritional_grouping text,
  recheck_schedule text,
  next_visit date
);

-- Enable RLS and create policy for vet_pregnancy_reports
ALTER TABLE vet_pregnancy_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own vet_pregnancy_reports" ON vet_pregnancy_reports
  FOR ALL USING (auth.uid() = user_id);

-- Veterinary Special Consultation & Procedure Reports
CREATE TABLE vet_special_consult_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  report_date date NOT NULL,
  procedure_date date,
  case_number text,
  surgeon text,
  assisting_staff text,
  urgency_level text,
  owner_name text,
  patient_id text,
  species_breed text,
  age_sex_weight text,
  current_location text,
  primary_complaint text,
  history text,
  triage_vitals text,
  mentation text,
  procedure_name text,
  sedation_protocol text,
  surgical_technique text,
  monitoring_complications text,
  in_house_testing text,
  imaging_findings text,
  recovery_quality text,
  post_op_plan text,
  definitive_diagnosis text,
  prognosis text,
  dispensed_meds text,
  meat_withdrawal text,
  milk_withdrawal text,
  follow_up_instructions text
);

-- Enable RLS and create policy for vet_special_consult_reports
ALTER TABLE vet_special_consult_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own vet_special_consult_reports" ON vet_special_consult_reports
  FOR ALL USING (auth.uid() = user_id);
