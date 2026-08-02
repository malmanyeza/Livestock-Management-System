import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Package, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  primary50: '#F0F9EB', primary100: '#DCEFC5',
  primary500: '#7AC142', primary600: '#639A34',
  success50:  '#E6F9F1', success100: '#C2F0DC', success500: '#43B97C', success600: '#359563',
  warning50:  '#FFFAEB', warning100: '#FFE6A3', warning500: '#FFC107', warning600: '#D6A206',
  error50:    '#FDEDEC', error100:   '#F5B7B1', error500:   '#E74C3C',
  neutral50:  '#F8F9FA', neutral100: '#E9ECEF', neutral200: '#DEE2E6',
  neutral400: '#ADB5BD', neutral500: '#6C757D', neutral600: '#495057',
  neutral700: '#343A40', neutral800: '#23272B', neutral900: '#121416',
  white: '#FFFFFF',
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface NutritionMetric {
  id: string; category: string; result: string; target: string; status: 'pass' | 'warning' | 'fail'
}

type SegCategory = 'dung' | 'rumen' | 'coat' | 'motility' | 'muscle' | 'frame' | 'fatCover' | 'symmetry' | 'bunk' | 'sorting' | 'water' | 'forage' | 'herdBcs'

// ─── Segmented button status ──────────────────────────────────────────────────
function getNumberStatus(cat: SegCategory, n: number): 'optimal' | 'warning' | 'deficient' {
  if (cat === 'herdBcs') return n === 3 ? 'optimal' : (n === 2 || n === 4) ? 'warning' : 'deficient'
  if (n <= 2) return 'deficient'
  if (cat === 'dung')    return n === 3 ? 'optimal' : 'warning'
  if (cat === 'rumen')   return (n === 3 || n === 4) ? 'optimal' : 'warning'
  if (cat === 'coat' || cat === 'motility' || cat === 'muscle' || cat === 'symmetry' || cat === 'sorting' || cat === 'water')
    return n >= 4 ? 'optimal' : 'warning'
  return (n === 3 || n === 4) ? 'optimal' : 'warning'
}

function statusColor(s: 'optimal' | 'warning' | 'deficient') {
  if (s === 'optimal')   return C.success600
  if (s === 'warning')   return C.warning600
  return C.error500
}

// ─── Helper texts — same as mobile ───────────────────────────────────────────
const H = {
  herdBcs:  (v: number) => 
    v === 1 ? 'Emaciated\n• Spine, ribs, hooks, and pins are sharp and highly visible.\n• No visible fat over the tailhead or ribs.\n• Severe muscle wasting is present.' : 
    v === 2 ? 'Thin\n• Spine and ribs are easily visible but not sharp.\n• Hooks and pins are prominent but have a light layer of tissue.\n• Tailhead is hollow with no feeling of fat.' : 
    v === 3 ? 'Ideal / Moderate\n• Ribs are covered and only visible upon close inspection.\n• Spine, hooks, and pins are rounded and smooth.\n• Tailhead area is filled out with a soft, palpable fat cover.' : 
    v === 4 ? 'Fat\n• Spine and individual ribs are completely hidden.\n• Hooks and pins are rounded with obvious fat deposits.\n• Tailhead feels soft and spongy with noticeable fat patches.' : 
    'Obese\n• Bone structures are completely buried in fat.\n• Tailhead is buried in thick, heavy fat blocks.\n• Animal walks with a heavy, impaired gait due to excess fat.',
  dung:     (v: number) => v <= 2 ? 'Deficient: Watery fluid and splattering' : v === 3 ? 'Optimal: Porridge-like 3cm pat' : 'Dry / Solid: Sub-optimal digestion',
  rumen:    (v: number) => v <= 2 ? 'Deficient: Deep skin fold and hollow flank' : v <= 4 ? 'Optimal: Softly arched flank' : 'Full: Well fed / optimal fill',
  coat:     (v: number) => v <= 2 ? 'Deficient: Dull, dry hair and patchy loss' : v === 3 ? 'Sub-optimal: Dry coat, minor hair shedding' : 'Optimal: Shiny, smooth, and supple',
  motility: (v: number) => v <= 2 ? 'Deficient: Stiff gait, favoring legs, swollen joints' : v === 3 ? 'Sub-optimal: Sluggish movement, minor joint tenderness' : 'Optimal: Fluid, even strides',
  muscle:   (v: number) => v <= 2 ? 'Deficient: Flat hindquarters, prominent shoulder blades, narrow loin' : v === 3 ? 'Sub-optimal: Moderate definition, slightly narrow loin' : 'Optimal: Thick, rounded thigh and wide, well-fleshed back',
  frame:    (v: number) => v <= 2 ? 'Deficient: Short, stunted height, narrow chest, small skeleton' : v <= 4 ? 'Optimal: Long, deep-bodied frame matching benchmarks' : 'Large: Sizing exceeds standard herd benchmarks',
  fatCover: (v: number) => v <= 2 ? 'Deficient: Sharp, bony hip hooks and visible spine' : v <= 4 ? 'Optimal: Smooth, soft covering over ribs and tailhead' : 'Patchy: Excessive fat cover with patchiness',
  symmetry: (v: number) => v <= 2 ? 'Deficient: Asymmetrical bone growth, roached back, uneven hip' : v === 3 ? 'Sub-optimal: Minor asymmetry or slight posture deviation' : 'Optimal: Straight topline and square, balanced stance',
  bunk:     (v: number) => v <= 2 ? 'Deficient/Restricted: Empty feed bunks, aggressive crowding, licking ground' : v <= 4 ? 'Optimal: Slick bunks with <5% fresh leftovers at next feeding' : 'Excessive: Overfeeding leftovers present',
  sorting:  (v: number) => v <= 2 ? 'Deficient: Large piles of coarse stems, holes pushed, animals tossing feed' : v === 3 ? 'Sub-optimal: Moderate feed sorting or uneven feed line' : 'Optimal: Uniform, undisturbed feed line',
  water:    (v: number) => v <= 2 ? 'Deficient: Algae-filled, dirty troughs, slow refilling, crowding' : v === 3 ? 'Sub-optimal: Minor dirt/algae, slightly restricted access' : 'Optimal: Clear, clean, odourless water with easy, uncrowded access',
  forage:   (v: number) => v <= 2 ? 'Deficient: Coarse, stemmy, moldy, bleached hay, low leaf-to-stem ratio' : v <= 4 ? 'Optimal: Green, leafy, sweet-smelling, pliable, high palatability' : 'Over-mature: Rich or stemmy forage exceeds optimal values',
}

// ─── Segmented control ────────────────────────────────────────────────────────
function SegControl({ cat, value, onChange }: { cat: SegCategory; value: number; onChange: (v: number) => void }) {
  const helper = (H as any)[cat](value)
  const helperCol = statusColor(getNumberStatus(cat, value))
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => {
          const s = getNumberStatus(cat, n)
          const isActive = value === n
          const col = statusColor(s)
          return (
            <button key={n} onClick={() => onChange(n)}
              className="flex-1 h-10 rounded-xl font-bold text-sm transition-all"
              style={{
                backgroundColor: isActive ? col : C.neutral100,
                color: isActive ? C.white : C.neutral600,
                border: `1.5px solid ${isActive ? col : C.neutral200}`,
              }}>
              {n}
            </button>
          )
        })}
      </div>
      <p className="text-xs font-medium text-center" style={{ color: helperCol }}>{helper}</p>
    </div>
  )
}

// ─── Question card inside modal ───────────────────────────────────────────────
function QCard({ num, title, desc, cat, value, onChange }: {
  num: number; title: string; desc: string; cat: SegCategory; value: number; onChange: (v: number) => void
}) {
  return (
    <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: C.neutral50, border: `1px solid ${C.neutral200}` }}>
      <p className="font-bold text-sm mb-1" style={{ color: C.neutral800 }}>{num}. {title}</p>
      <p className="text-xs mb-2" style={{ color: C.neutral600 }}>{desc}</p>
      <SegControl cat={cat} value={value} onChange={onChange} />
    </div>
  )
}

// ─── Assessment modal ─────────────────────────────────────────────────────────
interface ModalProps { title: string; subtitle: string; onClose: () => void; onSave: () => void; children: React.ReactNode }
function AssessModal({ title, subtitle, onClose, onSave, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: C.white, maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>{title}</h3>
          <p className="text-sm mt-1" style={{ color: C.neutral500 }}>{subtitle}</p>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={onSave} className="flex-[1.5] py-3 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: C.primary600 }}>Save Assessment</button>
        </div>
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'pass' | 'warning' | 'fail' }) {
  const map = {
    pass:    { bg: C.success100, color: '#1A6640', text: 'PASS' },
    warning: { bg: C.warning100, color: '#7A5500', text: 'WARN' },
    fail:    { bg: C.error100,   color: '#7B241C', text: 'FAIL' },
  }
  const { bg, color, text } = map[status]
  return (
    <span className="inline-block px-2 py-1 rounded text-xs font-semibold"
      style={{ backgroundColor: bg, color }}>{text}</span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Nutrition() {
  const { session, targetUserId, selectedProductionYear } = useAuth()
  const navigate = useNavigate()
  const [fi, setFi] = useState<Record<string, number>>({})
  const [animals, setAnimals] = useState<any[]>([])
  const [animalWeights, setAnimalWeights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Modal visibility
  const [showHerdBcs, setShowHerdBcs] = useState(false)
  const [showDef, setShowDef]     = useState(false)
  const [showGrowth, setShowGrowth] = useState(false)
  const [showMgt, setShowMgt]     = useState(false)

  // Questionnaire values — Herd BCS
  const [herdBcs, setHerdBcs] = useState(1)

  // Questionnaire values — Deficiencies
  const [dung, setDung]         = useState(1)
  const [rumen, setRumen]       = useState(1)
  const [coat, setCoat]         = useState(1)
  const [motility, setMotility] = useState(1)

  // Questionnaire values — Growth Perception
  const [muscle, setMuscle]     = useState(1)
  const [frame, setFrame]       = useState(1)
  const [fatCover, setFatCover] = useState(1)
  const [symmetry, setSymmetry] = useState(1)

  // Questionnaire values — Management
  const [bunk, setBunk]       = useState(1)
  const [sorting, setSorting] = useState(1)
  const [water, setWater]     = useState(1)
  const [forage, setForage]   = useState(1)

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    Promise.all([
      supabase.from('farm_inspections').select('*').eq('user_id', targetUserId).maybeSingle(),
      supabase.from('animals').select('weight,previous_weight,days_between_weights,bcs,stock_type').eq('user_id', targetUserId),
      supabase.from('animal_weights').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear),
    ]).then(([{ data: ins }, { data: a }, { data: w }]) => {
      if (ins?.data) {
        const d = ins.data as Record<string, any>
        setFi(d)
        setLastUpdated(ins.updated_at || ins.created_at || null)
        setHerdBcs(d.herdBcs ?? 1)
        setDung(d.dungConsistency ?? 1); setRumen(d.rumenFill ?? 1)
        setCoat(d.coatSkin ?? 1); setMotility(d.motilityLocomotion ?? 1)
        setMuscle(d.muscleDefinition ?? 1); setFrame(d.frameSizing ?? 1)
        setFatCover(d.fatCoverDevelopment ?? 1); setSymmetry(d.skeletalSymmetry ?? 1)
        setBunk(d.bunkFeedAvailability ?? 1); setSorting(d.rationSortingBehaviour ?? 1)
        setWater(d.waterQualityAccess ?? 1); setForage(d.forageQualityPerception ?? 1)
      } else {
        setFi({})
        setHerdBcs(1)
        setDung(1); setRumen(1)
        setCoat(1); setMotility(1)
        setMuscle(1); setFrame(1)
        setFatCover(1); setSymmetry(1)
        setBunk(1); setSorting(1)
        setWater(1); setForage(1)
      }
      setAnimals(a ?? [])
      setAnimalWeights(w ?? [])
      setLoading(false)
    })
  }, [targetUserId, selectedProductionYear])

  // ── Derived metrics (same formulas as mobile) ────────────────────────────────
  let totalAdg = 0;
  let countAdg = 0;
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  animalWeights.forEach(row => {
    let lastWeight: number | null = null;
    months.forEach(m => {
      if (row[m] !== null && row[m] !== undefined && row[m] !== '') {
        const w = Number(row[m]);
        if (lastWeight !== null) {
          totalAdg += (w - lastWeight) / 30;
          countAdg++;
        }
        lastWeight = w;
      }
    });
  });
  const adgVal = countAdg > 0 ? Number((totalAdg / countAdg).toFixed(3)) : 0;
  const adgStatus: 'pass'|'warning'|'fail' = countAdg > 0 ? (adgVal >= 1.13 ? 'pass' : adgVal >= 0.9 ? 'warning' : 'fail') : 'warning'
  const adgLabel = countAdg > 0 ? `${adgVal.toFixed(3)} kg/d` : 'N/A'

  const withBCS = animals.filter(a => a.bcs)
  const bcsVal = fi.herdBcs ? fi.herdBcs : (withBCS.length ? withBCS.reduce((s, a) => s + a.bcs, 0) / withBCS.length : 0)
  const bcsStatus: 'pass'|'warning'|'fail' = bcsVal > 0 ? ((bcsVal >= 2.0 && bcsVal <= 4.0) ? 'pass' : 'fail') : 'warning'
  const bcsLabel = bcsVal > 0 ? bcsVal.toFixed(1) : 'N/A'

  const defVal = fi.nutritionalDeficiencies ?? 0
  const defStatus: 'pass'|'warning'|'fail' = defVal > 0 ? (defVal >= 4 ? 'pass' : defVal >= 3 ? 'warning' : 'fail') : 'warning'
  const defLabel = defVal > 0 ? `${defVal.toFixed(1)}/5` : 'N/A'

  // Simple FCR approx from feed/weight data
  const fcrVal = 0 // no feed data yet — show N/A
  const fcrStatus: 'pass'|'warning'|'fail' = 'warning'
  const fcrLabel = 'N/A'

  const growthVal = fi.growthRatePerception ?? 0
  const growthStatus: 'pass'|'warning'|'fail' = growthVal > 0 ? (growthVal >= 4 ? 'pass' : growthVal >= 3 ? 'warning' : 'fail') : 'warning'
  const growthLabel = growthVal > 0
    ? (growthVal >= 4.5 ? 'Excellent' : growthVal >= 3.5 ? 'Good' : growthVal >= 2.5 ? 'Moderate' : 'Poor')
    : 'N/A'

  const mgtVal = fi.overallNutritionalHealth ?? 0
  const mgtStatus: 'pass'|'warning'|'fail' = mgtVal > 0 ? (mgtVal >= 4 ? 'pass' : mgtVal >= 3 ? 'warning' : 'fail') : 'warning'
  const mgtLabel = mgtVal > 0
    ? (mgtVal >= 4.5 ? 'Excellent' : mgtVal >= 3.5 ? 'Good' : mgtVal >= 2.5 ? 'Moderate' : 'Poor')
    : 'N/A'

  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString() : 'Never';

  const nutritionMetrics: NutritionMetric[] = [
    { id: '1', category: 'Weight Gain (ADG)', result: adgLabel,   target: '0.9 – 1.13',    status: adgStatus },
    { id: '2', category: 'Herd BCS',          result: bcsLabel,   target: '2.0 – 4.0',      status: bcsStatus },
    { id: '3', category: 'Deficiencies',       result: defLabel,   target: 'Optimal (5)',    status: defStatus },
    { id: '4', category: 'Feed Ratio (FCR)',   result: fcrLabel,   target: '8.0 – 10.0',    status: fcrStatus },
    { id: '5', category: 'Growth Perception',  result: growthLabel, target: 'Excellent',     status: growthStatus },
    { id: '6', category: 'Management',         result: mgtLabel,   target: 'Excellent',      status: mgtStatus },
  ]

  // ── Save helpers ──────────────────────────────────────────────────────────────
  const saveToSupabase = async (updates: Record<string, any>) => {
    if (!session || !targetUserId) return
    const updated = { ...fi, ...updates }
    setFi(updated)
    setLastUpdated(new Date().toISOString())
    const { data: ex } = await supabase.from('farm_inspections').select('id').eq('user_id', targetUserId).maybeSingle()
    if (ex) await supabase.from('farm_inspections').update({ data: updated, updated_at: new Date().toISOString() }).eq('id', ex.id)
    else     await supabase.from('farm_inspections').insert({ user_id: targetUserId, data: updated })
  }

  const handleSaveHerdBcs = async () => {
    await saveToSupabase({ herdBcs, herdBcsUpdatedAt: new Date().toISOString() })
    setShowHerdBcs(false)
  }

  const handleSaveDef = async () => {
    const avg = (dung + rumen + coat + motility) / 4
    await saveToSupabase({ dungConsistency: dung, rumenFill: rumen, coatSkin: coat, motilityLocomotion: motility, nutritionalDeficiencies: avg, defUpdatedAt: new Date().toISOString() })
    setShowDef(false)
  }

  const handleSaveGrowth = async () => {
    const avg = (muscle + frame + fatCover + symmetry) / 4
    await saveToSupabase({ muscleDefinition: muscle, frameSizing: frame, fatCoverDevelopment: fatCover, skeletalSymmetry: symmetry, growthRatePerception: avg, growthUpdatedAt: new Date().toISOString() })
    setShowGrowth(false)
  }

  const handleSaveMgt = async () => {
    const avg = (bunk + sorting + water + forage) / 4
    await saveToSupabase({ bunkFeedAvailability: bunk, rationSortingBehaviour: sorting, waterQualityAccess: water, forageQualityPerception: forage, overallNutritionalHealth: avg, mgtUpdatedAt: new Date().toISOString() })
    setShowMgt(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: C.primary500, borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Nutrition</h2>
        <p className="text-sm mt-0.5" style={{ color: C.neutral500 }}>Review livestock nutritional metrics and make adjustments as needed.</p>
      </div>

      {/* Main metrics table card — same as mobile */}
      <div className="card w-full">
        <p className="font-semibold text-base mb-1" style={{ color: C.neutral900 }}>Nutrition Assessment</p>
        <p className="text-sm mb-4" style={{ color: C.neutral600 }}>Review your livestock's nutritional metrics and make adjustments as needed.</p>
        <div className="w-full overflow-x-auto">
          <table className="w-full data-table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Result</th>
                <th>Target</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nutritionMetrics.map(m => (
                <tr key={m.id}>
                  <td className="font-medium" style={{ color: C.neutral900 }}>{m.category}</td>
                  <td style={{ color: C.neutral700 }}>{m.result}</td>
                  <td style={{ color: C.neutral500 }}>{m.target}</td>
                  <td className="text-center"><StatusBadge status={m.status} /></td>
                  <td className="text-center">
                    {m.category === 'Herd BCS' && (
                      <div className="flex flex-col items-center justify-center">
                        <button onClick={() => setShowHerdBcs(true)}
                          className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{ backgroundColor: C.primary50, border: `1px solid ${C.primary100}`, color: C.primary500 }}>
                          Assess
                        </button>
                        <span className="text-[10px] mt-1" style={{ color: C.neutral400 }}>{formatDate(fi.herdBcsUpdatedAt as string)}</span>
                      </div>
                    )}
                    {m.category === 'Deficiencies' && (
                      <div className="flex flex-col items-center justify-center">
                        <button onClick={() => setShowDef(true)}
                          className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{ backgroundColor: C.primary50, border: `1px solid ${C.primary100}`, color: C.primary500 }}>
                          Assess
                        </button>
                        <span className="text-[10px] mt-1" style={{ color: C.neutral400 }}>{formatDate(fi.defUpdatedAt as string)}</span>
                      </div>
                    )}
                    {m.category === 'Growth Perception' && (
                      <div className="flex flex-col items-center justify-center">
                        <button onClick={() => setShowGrowth(true)}
                          className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{ backgroundColor: C.primary50, border: `1px solid ${C.primary100}`, color: C.primary500 }}>
                          Assess
                        </button>
                        <span className="text-[10px] mt-1" style={{ color: C.neutral400 }}>{formatDate(fi.growthUpdatedAt as string)}</span>
                      </div>
                    )}
                    {m.category === 'Management' && (
                      <div className="flex flex-col items-center justify-center">
                        <button onClick={() => setShowMgt(true)}
                          className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{ backgroundColor: C.primary50, border: `1px solid ${C.primary100}`, color: C.primary500 }}>
                          Assess
                        </button>
                        <span className="text-[10px] mt-1" style={{ color: C.neutral400 }}>{formatDate(fi.mgtUpdatedAt as string)}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nutrition Inventory card — same as mobile */}
      <div className="card" style={{ backgroundColor: C.primary50, borderColor: C.primary100, borderWidth: 1 }}>
        <div className="flex items-start gap-3">
          <Package size={24} style={{ color: C.primary500, flexShrink: 0 }} />
          <div className="flex-1">
            <p className="font-semibold text-base mb-1" style={{ color: C.neutral900 }}>Nutrition Inventory &amp; Management</p>
            <p className="text-sm mb-3" style={{ color: C.neutral600 }}>
              Track and manage your feed inventory, monitor consumption rates, and plan feed requirements.
            </p>
            <button onClick={() => navigate('/register?tab=feed')}
              className="flex items-center gap-1.5 font-semibold text-sm"
              style={{ color: C.primary500 }}>
              View Inventory
              <ArrowRight size={18} style={{ color: C.primary500 }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Herd BCS Questionnaire Modal ─────────────────────────────────────── */}
      {showHerdBcs && (
        <AssessModal
          title="Herd BCS Assessment"
          subtitle="Score the body condition of the herd (1–5) based on the guide."
          onClose={() => setShowHerdBcs(false)}
          onSave={handleSaveHerdBcs}>
          <QCard num={1} title="Herd Body Condition Score" cat="herdBcs" value={herdBcs} onChange={setHerdBcs}
            desc="Select the score that best represents the average or majority condition of the herd." />
        </AssessModal>
      )}

      {/* ── Deficiencies Questionnaire Modal ─────────────────────────────────── */}
      {showDef && (
        <AssessModal
          title="Deficiencies Questionnaire"
          subtitle="Rate the deficiency parameters (1–5) based on physical observations."
          onClose={() => setShowDef(false)}
          onSave={handleSaveDef}>
          <QCard num={1} title="Dung Consistency"   cat="dung"     value={dung}     onChange={setDung}
            desc="Watery fluid and wide splattering indicates deficiency; optimal is a porridge-like 3cm pat." />
          <QCard num={2} title="Rumen Fill"          cat="rumen"    value={rumen}    onChange={setRumen}
            desc="Deep skin fold and hollow flank indicate deficiency; optimal is a softly arched flank." />
          <QCard num={3} title="Coat &amp; Skin"     cat="coat"     value={coat}     onChange={setCoat}
            desc="Dull, dry hair and patchy loss indicate deficiency; optimal is shiny, smooth, and supple." />
          <QCard num={4} title="Motility &amp; Locomotion" cat="motility" value={motility} onChange={setMotility}
            desc="Stiff gait, favoring legs, and swollen joints indicate deficiency; optimal is fluid, even strides." />
        </AssessModal>
      )}

      {/* ── Growth Rate Perception Modal ──────────────────────────────────────── */}
      {showGrowth && (
        <AssessModal
          title="Growth Rate Perception Questionnaire"
          subtitle="Rate the growth parameters (1–5) based on physical observations."
          onClose={() => setShowGrowth(false)}
          onSave={handleSaveGrowth}>
          <QCard num={1} title="Muscle Definition"    cat="muscle"   value={muscle}   onChange={setMuscle}
            desc="Flat hindquarters, prominent shoulder blades, and narrow loin indicate deficiency; optimal is a thick, rounded thigh and wide, well-fleshed back." />
          <QCard num={2} title="Frame Sizing"          cat="frame"    value={frame}    onChange={setFrame}
            desc="Short, stunted height relative to age, narrow chest width, and small skeleton indicate deficiency; optimal is a long, deep-bodied frame matching benchmarks." />
          <QCard num={3} title="Fat Cover Development" cat="fatCover" value={fatCover} onChange={setFatCover}
            desc="Sharp, bony hip hooks and visible spine indicate severe energy deficiency; optimal is a smooth, soft covering over ribs and tailhead without excessive patchiness." />
          <QCard num={4} title="Skeletal Symmetry"     cat="symmetry" value={symmetry} onChange={setSymmetry}
            desc="Asymmetrical bone growth, roached back, or uneven hip height indicates structural nutrient deficiency; optimal is a straight topline and square, balanced stance." />
        </AssessModal>
      )}

      {/* ── Nutritional Management Modal ─────────────────────────────────────── */}
      {showMgt && (
        <AssessModal
          title="Nutritional Management Questionnaire"
          subtitle="Rate the management parameters (1–5) based on observations."
          onClose={() => setShowMgt(false)}
          onSave={handleSaveMgt}>
          <QCard num={1} title="Bunk &amp; Feed Availability" cat="bunk"    value={bunk}    onChange={setBunk}
            desc="Empty feed bunks for extended periods, aggressive crowding, and cattle licking the ground indicate severe underfeeding; optimal is slick bunks with less than 5% fresh leftovers." />
          <QCard num={2} title="Ration Sorting Behaviour"     cat="sorting" value={sorting} onChange={setSorting}
            desc="Large piles of coarse stems left behind, holes pushed into feed, and animals tossing feed indicate poor mixing; optimal is a uniform, undisturbed feed line." />
          <QCard num={3} title="Water Quality &amp; Access"   cat="water"   value={water}   onChange={setWater}
            desc="Algae-filled, dirty troughs, slow refilling, or cattle crowding the water source indicates restriction; optimal is clear, clean, odourless water with easy, uncrowded access." />
          <QCard num={4} title="Forage Quality Perception"    cat="forage"  value={forage}  onChange={setForage}
            desc="Coarse, stemmy, moldy, or bleached hay with low leaf-to-stem ratio indicates low energy/protein; optimal is green, leafy, sweet-smelling, pliable forage with high palatability." />
        </AssessModal>
      )}
    </div>
  )
}
