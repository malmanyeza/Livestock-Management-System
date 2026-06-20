import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Activity, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ─── Types ───────────────────────────────────────────────────────────────────

interface HealthMetric {
  title: string
  key: string
  score: number
  percentage: number
  passed: boolean
  color: string
  borderColor: string
  modalKey: string
  assessLabel: string
  questions: Question[]
}

interface Question {
  id: string
  label: string
  description: string
  helperFn: (v: number) => string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  success500: '#43B97C', success600: '#359563',
  warning500: '#FFC107', warning600: '#D6A206',
  error500: '#E74C3C',
  primary50: '#F0F9EB', primary100: '#DCEFC5', primary500: '#7AC142', primary600: '#639A34',
  neutral50: '#F8F9FA', neutral100: '#E9ECEF', neutral200: '#DEE2E6',
  neutral300: '#CED4DA', neutral500: '#6C757D', neutral600: '#495057',
  neutral700: '#343A40', neutral900: '#121416', white: '#FFFFFF',
}

const getScoreColor = (score: number) => {
  const pct = score * 20
  if (pct <= 40) return C.error500
  if (pct <= 70) return C.warning500
  return C.success500
}

const getBorderColor = (score: number) => {
  const pct = score * 20
  if (score === 0) return C.neutral200
  if (pct <= 40) return '#F5B7B1'
  if (pct <= 70) return '#FFE6A3'
  return '#9FE4C1'
}

// Segmented 1-5 rating: green for optimal, yellow for sub-opt, red for deficient
function getSegColor(val: number): string {
  if (val <= 2) return C.error500
  if (val === 3) return C.warning500
  return C.success500
}

// ─── Segmented Control Component ─────────────────────────────────────────────

function SegmentedControl({
  value, onChange, helperText
}: { value: number; onChange: (v: number) => void; helperText: string }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => {
          const col = getSegColor(n)
          const isActive = value === n
          return (
            <button key={n} onClick={() => onChange(n)}
              className="flex-1 h-10 rounded-lg font-bold text-sm transition-all"
              style={{
                backgroundColor: isActive ? col : C.neutral100,
                color: isActive ? '#fff' : C.neutral600,
                border: `1.5px solid ${isActive ? col : C.neutral200}`,
              }}>
              {n}
            </button>
          )
        })}
      </div>
      <p className="text-xs font-medium" style={{ color: getSegColor(value) }}>{helperText}</p>
    </div>
  )
}

// ─── Assessment Modal ─────────────────────────────────────────────────────────

interface ModalState { [qid: string]: number }

function AssessmentModal({
  metric, values, onChange, onSave, onClose
}: {
  metric: HealthMetric
  values: ModalState
  onChange: (qid: string, v: number) => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>
            {metric.title} Questionnaire
          </h3>
          <p className="text-sm mt-1" style={{ color: C.neutral500 }}>
            Rate the parameters (1–5) based on observations.
          </p>
        </div>

        {/* Questions */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {metric.questions.map((q, idx) => (
            <div key={q.id} className="rounded-xl p-4 space-y-3"
              style={{ backgroundColor: C.neutral50, border: `1px solid ${C.neutral100}` }}>
              <p className="font-bold text-sm" style={{ color: C.neutral900 }}>
                {idx + 1}. {q.label}
              </p>
              <p className="text-xs" style={{ color: C.neutral600 }}>{q.description}</p>
              <SegmentedControl
                value={values[q.id] ?? 1}
                onChange={v => onChange(q.id, v)}
                helperText={q.helperFn(values[q.id] ?? 1)}
              />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>
            Cancel
          </button>
          <button onClick={onSave}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: C.primary600 }}>
            Save Assessment
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Metric helper texts ──────────────────────────────────────────────────────

const helpers = {
  quarantine: (v: number) => v <= 2 ? 'Deficient: New arrivals mixed immediately, missing history' : v === 3 ? 'Sub-optimal: Basic isolation, partial records' : 'Optimal: Strict 21–30 day isolation in separate facility',
  tracking:   (v: number) => v <= 2 ? 'Deficient: Missing tags, no birth/movement records' : v === 3 ? 'Sub-optimal: Visual tags only, manual logs' : 'Optimal: 100% electronic/visual tracking, real-time logs',
  boundary:   (v: number) => v <= 2 ? 'Deficient: Broken fences, contact with stray wild stock' : (v === 3 || v === 4) ? 'Optimal: Double-fencing, active pest mitigation' : 'Exclusionary: Double fences, certified pest-free',
  sanitation: (v: number) => v <= 2 ? 'Deficient: Unrestricted access, no boot wash, dirty gear' : v === 3 ? 'Sub-optimal: Basic boot wash, partial visitor logs' : 'Optimal: Clean zones, boot-wash, visitor logs',
  dewormTiming:    (v: number) => v <= 2 ? 'Deficient: Applied randomly without target seasons' : v === 3 ? 'Sub-optimal: General seasonal timing' : 'Optimal: Strategic dosing based on parasite cycles',
  dewormRotation:  (v: number) => v <= 2 ? 'Deficient: Repeated class every year, no efficacy checks' : v === 3 ? 'Sub-optimal: Basic rotation, infrequent checks' : 'Optimal: Deliberate class rotation & FECRT tests',
  dewormPrecision: (v: number) => v <= 2 ? 'Deficient: Visual weight guessing, poor calibration' : v === 3 ? 'Sub-optimal: Group-based weights' : 'Optimal: Dosing exactly to scale weights',
  dewormTargeted:  (v: number) => v <= 2 ? 'Deficient: Blanket-treating entire herd blindly' : (v === 3 || v === 4) ? 'Optimal: Selective treatment on high-risk stock' : 'Refugia Certified: Strategic selective treatment',
  anthClass:       (v: number) => v <= 2 ? 'Deficient: Repeated use of one chemical family' : v === 3 ? 'Sub-optimal: Infrequent rotation' : 'Optimal: Rotated chemical families based on diagnostics',
  anthRoute:       (v: number) => v <= 2 ? 'Deficient: Product applied over mud, poorly injected' : v === 3 ? 'Sub-optimal: Occasional spilling' : 'Optimal: Administered perfectly clean',
  anthCalib:       (v: number) => v <= 2 ? 'Deficient: Guns used without verifying dosage volume' : v === 3 ? 'Sub-optimal: Calibrated occasionally' : 'Optimal: Calibrated gear verified before every batch',
  anthWithhold:    (v: number) => v <= 2 ? 'Deficient: Poorly logged treatment dates' : v <= 4 ? 'Sub-optimal: Logged on paper, missing alerts' : 'Optimal: Meticulous logging and withholding compliance',
  antiPrescription:(v: number) => v <= 2 ? 'Deficient: Treating without vet diagnosis' : v === 3 ? 'Sub-optimal: Partial vet alignment' : 'Optimal: Strict veterinary prescription control',
  antiClass:       (v: number) => v <= 2 ? 'Deficient: Using human CIAs as first-line treatment' : v === 3 ? 'Sub-optimal: Routine CIA use without testing' : 'Optimal: Restricting CIAs, diagnostic-based selection',
  antiRecords:     (v: number) => v <= 2 ? 'Deficient: Missing treatment dates, animal IDs' : v <= 4 ? 'Sub-optimal: Partially logged details' : 'Optimal: Meticulous logging of all treatment details',
  antiCompletion:  (v: number) => v <= 2 ? 'Deficient: Stopping courses early once animal looks better' : v === 3 ? 'Sub-optimal: Inconsistent compliance' : 'Optimal: Strict completion regardless of visual recovery',
  cpdTraining:     (v: number) => v <= 2 ? 'Deficient: Staff working without formal skills updates' : (v === 3 || v === 4) ? 'Optimal: Regular training, periodic skill updates' : 'Sub-optimal: Excessive or uncoordinated training',
  cpdProtocol:     (v: number) => v <= 2 ? 'Deficient: Staff unaware of sick calf SOPs' : v === 3 ? 'Sub-optimal: Vague protocol understanding' : 'Optimal: Clear awareness, strict execution of SOPs',
  cpdVet:          (v: number) => v <= 2 ? 'Deficient: Consulting vet only for emergencies' : v === 3 ? 'Sub-optimal: Occasional consults' : 'Optimal: Regular vet collaboration for herd health',
  cpdBenchmark:    (v: number) => v <= 2 ? 'Deficient: Not attending farm workshops' : (v === 3 || v === 4) ? 'Optimal: Active workshop attendance' : 'Sub-optimal: Tracking non-applicable benchmarks',
  dbExpiry:        (v: number) => v <= 2 ? 'Deficient: Keeping expired/unlabelled bottles' : v <= 4 ? 'Sub-optimal: Occasional expired items' : 'Optimal: Strictly unexpired, fully labelled, regular audits',
  dbCleanliness:   (v: number) => v <= 2 ? 'Deficient: Box is dusty, contaminated' : v === 3 ? 'Sub-optimal: Minor dust, no open contamination' : 'Optimal: Spotless cleanliness, sterile containment',
  dbSecurity:      (v: number) => v <= 2 ? 'Deficient: Box left unlocked or outdoors' : v === 3 ? 'Sub-optimal: Indoors but unlocked' : 'Optimal: Locked storage under authorized keys',
  dbDisposal:      (v: number) => v <= 2 ? 'Deficient: Sharps discarded into domestic farm waste' : v <= 4 ? 'Sub-optimal: Proper needles but occasional log errors' : 'Optimal: Meticulous bio-waste protocols',
}

// ─── Metric Definitions ───────────────────────────────────────────────────────

function buildMetrics(fi: Record<string, number>): HealthMetric[] {
  const mk = (
    title: string, key: string, modalKey: string, assessLabel: string,
    questions: Question[]
  ): HealthMetric => {
    const score = fi[key] ?? 0
    return {
      title, key, modalKey, assessLabel, questions,
      score,
      percentage: score * 20,
      passed: score >= 3.0,
      color: getScoreColor(score),
      borderColor: getBorderColor(score),
    }
  }

  return [
    mk('Vaccination Coverage', 'vaccinationCoverage', 'vaccination', 'Assess Vaccination Coverage', [
      { id: 'vaccProtocol',    label: 'Protocol Adherence',   description: 'Strict adherence to primary doses and annual boosters.', helperFn: helpers.quarantine },
      { id: 'vaccPenetration', label: 'Herd Penetration',     description: '100% coverage across all at-risk animals.', helperFn: helpers.tracking },
      { id: 'vaccTiming',      label: 'Timing Accuracy',      description: 'Proactive timing well ahead of high-risk seasons.', helperFn: helpers.boundary },
      { id: 'vaccColdChain',   label: 'Cold Chain Integrity', description: 'Meticulous cold chain and storage documentation.', helperFn: helpers.sanitation },
    ]),
    mk('Biosecurity Rating', 'biosecurityRating', 'biosecurity', 'Assess Biosecurity', [
      { id: 'quarantine',  label: 'Quarantine & Intake Isolation', description: 'New arrivals mixed immediately into main herd = high risk; optimal = strict 21–30 day isolation.', helperFn: helpers.quarantine },
      { id: 'tracking',    label: 'Herd Tracking & Movement Logs', description: 'Missing tags or undocumented movements = poor traceability; optimal = 100% tracking.', helperFn: helpers.tracking },
      { id: 'boundary',    label: 'Farm Boundary & Pest Control',  description: 'Broken fences allowing contact with stray stock = disease exposure.', helperFn: helpers.boundary },
      { id: 'sanitation',  label: 'Sanitation & Visitor Control',  description: 'Unrestricted access or lack of boot-wash = high contamination risk.', helperFn: helpers.sanitation },
    ]),
    mk('Deworming Practice', 'dewormingPractice', 'deworming', 'Assess Deworming', [
      { id: 'dewormTiming',    label: 'Timing',    description: 'Strategic dosing based on regional parasite cycles.', helperFn: helpers.dewormTiming },
      { id: 'dewormRotation',  label: 'Rotation',  description: 'Deliberate chemical class rotation and FECRT tests.', helperFn: helpers.dewormRotation },
      { id: 'dewormPrecision', label: 'Precision', description: 'Dosing exactly to scale weights with calibrated gear.', helperFn: helpers.dewormPrecision },
      { id: 'dewormTargeted',  label: 'Targeted',  description: 'Selective treatment on high-risk stock to maintain refugia.', helperFn: helpers.dewormTargeted },
    ]),
    mk('Antihelminthic Rating', 'prudentAnthelmintic', 'anthelmintic', 'Assess Anthelmintics', [
      { id: 'anthClass',    label: 'Chemical Class Selection',      description: 'Rotated chemical families based on diagnostics.', helperFn: helpers.anthClass },
      { id: 'anthRoute',    label: 'Administration Route',          description: 'Correct method, no leakage.', helperFn: helpers.anthRoute },
      { id: 'anthCalib',    label: 'Equipment Calibration',         description: 'Calibrated gear with dosage verified before every batch.', helperFn: helpers.anthCalib },
      { id: 'anthWithhold', label: 'Withholding Compliance',        description: 'Meticulous logging of treatment dates.', helperFn: helpers.anthWithhold },
    ]),
    mk('Antimicrobial Usage', 'prudentAntibiotics', 'antibiotic', 'Assess Antimicrobial Usage', [
      { id: 'antiPrescription', label: 'Prescription Control', description: 'Strict veterinary prescription and diagnostics.', helperFn: helpers.antiPrescription },
      { id: 'antiClass',       label: 'Drug Classification',  description: 'Restricting critically important antibiotics (CIAs).', helperFn: helpers.antiClass },
      { id: 'antiRecords',     label: 'Treatment Records',    description: 'Meticulous logging of treatment dates, animal IDs, batch numbers.', helperFn: helpers.antiRecords },
      { id: 'antiCompletion',  label: 'Course Completion',    description: 'Strict completion of all treatment courses.', helperFn: helpers.antiCompletion },
    ]),
    mk('CPD Staff Control (Disease/Emergencies)', 'cpdStaffControl', 'cpd', 'Assess CPD Staff Control', [
      { id: 'cpdTraining',   label: 'Training Frequency',  description: 'Regular training and periodic skill updates.', helperFn: helpers.cpdTraining },
      { id: 'cpdProtocol',   label: 'Protocol Awareness',  description: 'Clear awareness and strict execution of sick/newborn SOPs.', helperFn: helpers.cpdProtocol },
      { id: 'cpdVet',        label: 'Vet Collaboration',   description: 'Regular veterinarian collaboration for herd health planning.', helperFn: helpers.cpdVet },
      { id: 'cpdBenchmark',  label: 'Benchmark Tracking',  description: 'Active workshop attendance and modern guideline tracking.', helperFn: helpers.cpdBenchmark },
    ]),
    mk('Drug Box Management', 'drugBoxManagement', 'drugbox', 'Assess Drug Box Management', [
      { id: 'dbExpiry',      label: 'Expiry & Inventory',    description: 'Strictly unexpired, fully labelled storage with regular audits.', helperFn: helpers.dbExpiry },
      { id: 'dbCleanliness', label: 'Storage Cleanliness',   description: 'Spotless cleanliness, sterile syringe containment.', helperFn: helpers.dbCleanliness },
      { id: 'dbSecurity',    label: 'Security & Access',     description: 'Locked storage under authorized keys, visitor logged.', helperFn: helpers.dbSecurity },
      { id: 'dbDisposal',    label: 'Disposal Practices',    description: 'Meticulous sharp container segregation and bio-waste protocols.', helperFn: helpers.dbDisposal },
    ]),
  ]
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Health() {
  const { session, targetUserId } = useAuth()
  const navigate = useNavigate()
  const [fi, setFi] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [assessmentDates, setAssessmentDates] = useState<Record<string, string>>({})
  const [globalDate, setGlobalDate] = useState<string | null>(null)
  const [openModal, setOpenModal] = useState<string | null>(null)
  const [modalValues, setModalValues] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    supabase.from('farm_inspections').select('*').eq('user_id', targetUserId).maybeSingle()
      .then(({ data }) => {
        if (data?.data) {
          setFi(data.data as Record<string, number>)
          const dbDate = data.updated_at || data.created_at
          if (dbDate) {
            setGlobalDate(new Date(dbDate).toLocaleDateString())
          }
        } else {
          setFi({})
          setGlobalDate(null)
        }
        setLoading(false)
      })
  }, [targetUserId])

  const metrics = buildMetrics(fi)
  const overall = metrics.filter(m => m.score > 0).reduce((s, m) => s + m.percentage, 0) /
    (metrics.filter(m => m.score > 0).length || 1)

  const openAssess = (metric: HealthMetric) => {
    const init: Record<string, number> = {}
    metric.questions.forEach(q => { init[q.id] = fi[q.id] ?? 1 })
    setModalValues(init)
    setOpenModal(metric.modalKey)
  }

  const saveAssess = async (metric: HealthMetric) => {
    if (!session || !targetUserId) return
    const avg = Object.values(modalValues).reduce((s, v) => s + v, 0) / metric.questions.length
    const updated = { ...fi, ...modalValues, [metric.key]: avg }
    setFi(updated)
    const now = new Date()
    setAssessmentDates(prev => ({ ...prev, [metric.title]: now.toLocaleDateString() }))
    setGlobalDate(now.toLocaleDateString())

    // Save to Supabase
    const { data: existing } = await supabase.from('farm_inspections').select('id').eq('user_id', targetUserId).maybeSingle()
    if (existing) {
      await supabase.from('farm_inspections').update({ data: updated, updated_at: now.toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('farm_inspections').insert({ user_id: targetUserId, data: updated, updated_at: now.toISOString() })
    }
    setOpenModal(null)
  }

  const activeMetric = metrics.find(m => m.modalKey === openModal) ?? null

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: C.primary500, borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Farm Health Analysis</h2>
          <p className="text-sm mt-0.5" style={{ color: C.neutral500 }}>
            Overall: <span className="font-bold" style={{ color: getScoreColor(overall / 20) }}>{overall.toFixed(0)}%</span>
          </p>
        </div>
      </div>

      {/* Metric cards — responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map(metric => {
          const lastDate = assessmentDates[metric.title]
          const assessed = metric.score > 0
          return (
            <div key={metric.title} className="card"
              style={{ borderColor: metric.borderColor, borderWidth: 1 }}>
  
              {/* Card header: title + pass/fail icon */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-base" style={{ color: C.neutral900 }}>{metric.title}</span>
                {assessed
                  ? metric.passed
                    ? <CheckCircle2 size={24} style={{ color: C.success500 }} />
                    : <XCircle size={24} style={{ color: C.error500 }} />
                  : <XCircle size={24} style={{ color: C.neutral300 }} />
                }
              </div>
  
              {/* Last analysis row */}
              <p className="text-xs mb-4"
                style={{ color: assessed ? C.neutral500 : C.warning600, fontStyle: assessed ? 'normal' : 'italic' }}>
                {assessed
                  ? `Last analyzed: ${lastDate || globalDate || 'Previously recorded'}`
                  : '⚠️ Analysis not yet performed'}
              </p>
  
              {/* Score + progress bar */}
              <div className="flex items-center gap-4 mb-3">
                <div className="text-center">
                  <p className="text-3xl font-bold" style={{ color: metric.color }}>{metric.score.toFixed(1)}</p>
                  <p className="text-xs" style={{ color: C.neutral500 }}>Score</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 rounded-full mb-1" style={{ backgroundColor: C.neutral100 }}>
                    <div className="h-3 rounded-full transition-all duration-500"
                      style={{ width: `${metric.percentage}%`, backgroundColor: metric.color }} />
                  </div>
                  <p className="text-xs text-right" style={{ color: C.neutral500 }}>{metric.percentage}%</p>
                </div>
              </div>
  
              {/* Assess button — matches mobile cardAssessButton */}
              <div className="pt-3 border-t" style={{ borderColor: C.neutral100 }}>
                <button onClick={() => openAssess(metric)}
                  className="text-sm font-semibold transition-colors"
                  style={{ color: C.primary500 }}>
                  {metric.assessLabel}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Animal Health Records navigation card — matches mobile */}
      <div className="card"
        style={{ backgroundColor: C.primary50, borderColor: C.primary100, borderWidth: 1 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity size={24} style={{ color: C.primary500 }} />
            <span className="font-semibold text-base" style={{ color: C.neutral900 }}>Animal Health Records</span>
          </div>
          <button onClick={() => navigate('/register?tab=health')}
            className="flex items-center gap-1 text-sm font-semibold"
            style={{ color: C.primary500 }}>
            View Records
            <ArrowRight size={18} style={{ color: C.primary500 }} />
          </button>
        </div>
        <p className="text-sm mt-3" style={{ color: C.neutral600 }}>
          Access and manage comprehensive health records, treatments, and medical history for your livestock.
        </p>
      </div>

      {/* Assessment modal */}
      {openModal && activeMetric && (
        <AssessmentModal
          metric={activeMetric}
          values={modalValues}
          onChange={(qid, v) => setModalValues(prev => ({ ...prev, [qid]: v }))}
          onSave={() => saveAssess(activeMetric)}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  )
}
