import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Types & constants ────────────────────────────────────────────────────────

interface ProductionMetric {
  key: string; title: string; value: number; target: number; unit: string; description: string
}

const DEFAULT_TARGETS: Record<string, number> = {
  weaning:            94,
  adg:                0.9,
  preWeaningDLWG:     0.7,
  postWeaningDLWG:    0.9,
  preWeaningMortality:5.0,
  postWeaningMortality:3.0,
  herdMortality:      5.0,
  weaningRate:        75,
}

const TARGET_DESCRIPTIONS: Record<string, string> = {
  weaning:              'Industry benchmark: ≥ 94%',
  adg:                  'Industry benchmark: 0.9 – 1.13 kg/day',
  preWeaningDLWG:       'Industry benchmark: > 0.7 kg/day',
  postWeaningDLWG:      'Industry benchmark: 0.8 – 1.0 kg/day',
  preWeaningMortality:  'Industry benchmark: < 5% (lower is better)',
  postWeaningMortality: 'Industry benchmark: < 3% (lower is better)',
  herdMortality:        'Industry benchmark: < 5% (lower is better)',
  weaningRate:          'Industry benchmark: 70 – 80%',
}

const C = {
  success500: '#43B97C', success200: '#9FE4C1',
  warning500: '#FFC107', warning200: '#FFE6A3',
  error500:   '#E74C3C', error200:   '#F5B7B1',
  primary50:  '#F0F9EB', primary400: '#92CC4E',
  primary600: '#639A34', primary500: '#7AC142',
  neutral50:  '#F8F9FA', neutral100: '#E9ECEF',
  neutral200: '#DEE2E6', neutral400: '#ADB5BD',
  neutral500: '#6C757D', neutral600: '#495057',
  neutral700: '#343A40', neutral900: '#121416',
  white: '#FFFFFF',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getColor(value: number, target: number, isMortality: boolean): string {
  if (isMortality) {
    if (value > target * 1.5) return C.error500
    if (value > target)       return C.warning500
    return C.success500
  }
  const pct = (value / target) * 100
  if (pct < 70) return C.error500
  if (pct < 90) return C.warning500
  return C.success500
}

function getBorderColor(color: string): string {
  if (color === C.error500)   return C.error200
  if (color === C.warning500) return C.warning200
  return C.success200
}

function getPercentage(value: number, target: number, isMortality: boolean): number {
  if (target === 0) return 0
  if (isMortality) {
    if (value <= 0) return 100
    if (value <= target) {
      // 100% at 0 deaths down to 70% at target
      return Math.round(100 - (value / target) * 30)
    }
    const excessRatio = (value - target) / target
    // Smoothly scale down from 70% to 10%
    return Math.max(10, Math.round(70 - excessRatio * 60))
  }
  return Math.min(100, (value / target) * 100)
}

const YOUNG_STOCK_TYPES = ['Calve', 'Calf', 'Kid', 'Lamb', 'Piglet']

export const getAnimalAgeInMonths = (animal: any): number | null => {
  if (!animal) return null
  const dobStr = animal.date_of_birth || animal.dateOfBirth
  if (dobStr) {
    const dob = new Date(dobStr)
    if (!isNaN(dob.getTime())) {
      const now = new Date()
      let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth())
      if (now.getDate() < dob.getDate()) months -= 1
      return Math.max(0, months)
    }
  }

  const ageStr = animal.age || (typeof animal === 'string' ? animal : '')
  if (ageStr) {
    let totalMonths = 0
    let matched = false
    const yMatch = ageStr.match(/(\d+)\s*y/i)
    const mMatch = ageStr.match(/(\d+)\s*m/i)
    const dMatch = ageStr.match(/(\d+)\s*d/i)
    if (yMatch) {
      totalMonths += parseInt(yMatch[1], 10) * 12
      matched = true
    }
    if (mMatch) {
      totalMonths += parseInt(mMatch[1], 10)
      matched = true
    }
    if (dMatch && !yMatch && !mMatch) {
      totalMonths += parseInt(dMatch[1], 10) / 30.4375
      matched = true
    }
    if (matched) return totalMonths
  }

  return null
}

export const determineAnimalStage = (animal: any): 'pre_weaning' | 'post_weaning' | 'adult' => {
  if (!animal) return 'adult'
  const ageMonths = getAnimalAgeInMonths(animal)
  if (ageMonths !== null) {
    if (ageMonths < 6) return 'pre_weaning'
    if (ageMonths < 12) return 'post_weaning'
    return 'adult'
  }

  const stockType = animal.stock_type || animal.stockType || ''
  const isYoungStock = YOUNG_STOCK_TYPES.includes(stockType)
  if (isYoungStock) {
    const isWeaned = Boolean(animal.date_of_weaning || animal.dateOfWeaning) ||
      animal.calf_status === 'Weaned' || animal.calfStatus === 'Weaned' ||
      animal.calf_status === 'Replacement' || animal.calfStatus === 'Replacement' ||
      animal.calf_status === 'Sold' || animal.calfStatus === 'Sold' ||
      Number(animal.weaning_weight || animal.weaningWeight || 0) > 0
    return isWeaned ? 'post_weaning' : 'pre_weaning'
  }

  return 'adult'
}

const isCalf = (animalOrAge: any, stockType?: string | null) => {
  if (animalOrAge && typeof animalOrAge === 'object') {
    return determineAnimalStage(animalOrAge) === 'pre_weaning'
  }
  const ageMonths = getAnimalAgeInMonths({ age: animalOrAge })
  if (ageMonths !== null) {
    return ageMonths < 6
  }
  if (stockType && YOUNG_STOCK_TYPES.includes(stockType)) return true
  return false
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function ProductionMetricCard({
  metric, isAdmin, onEdit
}: { metric: ProductionMetric; isAdmin: boolean; onEdit: () => void }) {
  const isMortality = metric.title.toLowerCase().includes('mortality')
  const color       = getColor(metric.value, metric.target, isMortality)
  const borderColor = getBorderColor(color)
  const pct         = getPercentage(metric.value, metric.target, isMortality)
  const display     = metric.unit === '%' ? metric.value.toFixed(2) : metric.value.toFixed(3)
  const targetDisplay = metric.unit === '%' ? metric.target.toFixed(2) : metric.target

  return (
    <div className="card" style={{ borderColor, borderWidth: 1 }}>
      {/* Header: title + status dot — exactly like mobile */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-sm flex-1" style={{ color: C.neutral900 }}>{metric.title}</span>
        <div className="w-3 h-3 rounded-full ml-2 flex-shrink-0" style={{ backgroundColor: color }} />
      </div>

      {/* Value + target row */}
      <div className="mb-3">
        <span className="text-2xl font-bold" style={{ color }}>
          {display}
        </span>
        <span className="text-sm ml-1" style={{ color: C.neutral600 }}>{metric.unit}</span>
        <p className="text-xs mt-1" style={{ color: C.neutral500 }}>
          Target: {targetDisplay} {metric.unit}
        </p>
      </div>

      {/* Progress bar — ProgressIndicator component equivalent */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: C.neutral500 }}>Progress to Target</span>
          <span className="text-xs font-semibold" style={{ color }}>{Math.min(100, pct).toFixed(0)}%</span>
        </div>
        <div className="h-2.5 rounded-full" style={{ backgroundColor: C.neutral100 }}>
          <div className="h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }} />
        </div>
      </div>

      {metric.description && (
        <p className="text-[11px] mt-2.5 pt-2 border-t line-clamp-2" style={{ borderColor: C.neutral100, color: C.neutral500 }}>
          {metric.description}
        </p>
      )}

      {/* Admin: Set Target button — same style as mobile setTargetBtn */}
      {isAdmin && (
        <div className="pt-3 mt-3 border-t text-center" style={{ borderColor: C.neutral100 }}>
          <button onClick={onEdit}
            className="text-sm font-semibold"
            style={{ color: C.primary500 }}>
            Set Target
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Production() {
  const { targetUserId, selectedProductionYear } = useAuth()
  const [animals, setAnimals]   = useState<any[]>([])
  const [mortalityRecords, setMortalityRecords] = useState<any[]>([])
  const [animalWeights, setAnimalWeights] = useState<any[]>([])
  const [breedingRecords, setBreedingRecords] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [targets, setTargets]   = useState({ ...DEFAULT_TARGETS })

  // Edit modal
  const [editingKey, setEditingKey]   = useState<string | null>(null)
  const [draftValue, setDraftValue]   = useState('')

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    Promise.all([
      supabase.from('animals').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear),
      supabase.from('mortality_records').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear),
      supabase.from('animal_weights').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear),
      supabase.from('breeding_records').select('ear_tag_number').eq('user_id', targetUserId).eq('production_year', selectedProductionYear),
    ]).then(([{ data: a }, { data: m, count }, { data: w }, { data: b }]) => {
      setAnimals(a ?? [])
      setMortalityRecords(m ?? [])
      setAnimalWeights(w ?? [])
      setBreedingRecords(b ?? [])
      setLoading(false)
    })
  }, [targetUserId, selectedProductionYear])

  // Helper for sanity-checking weights (avoids test gibberish like 88858885 kg)
  const isValidWeight = (val: any, max = 1500): boolean => {
    if (val === null || val === undefined || val === '') return false;
    const n = Number(val);
    return !isNaN(n) && n > 0 && n <= max;
  };

  // Derived metrics — Calf Crop formula: (Number of Calves Weaned) ÷ (Number of Exposed Females) * 100
  const calves = animals.filter(a => isCalf(a.age, a.stock_type))
  const weanedCalves = calves.filter(a => Boolean(a.date_of_weaning) || a.calf_status === 'Replacement' || a.calf_status === 'Sold' || Number(a.weaning_weight || 0) > 0)
  
  // Exposed females recorded for that year:
  // 1) Females with breeding records in that year
  // 2) Fallback to eligible breeding females recorded in herd (Cows, Bullying Heifers, or breeding-flagged Heifers)
  const breedingFemalesCount = new Set((breedingRecords || []).map(b => b.ear_tag_number).filter(Boolean)).size
  const herdEligibleFemalesCount = animals.filter(a => (a.sex === 'Female' || !a.sex) && (a.stock_type === 'Cow' || a.stock_type === 'Bullying Heifer' || (a.stock_type === 'Heifer' && a.is_breeding_cow) || a.is_breeding_cow)).length
  const exposedFemalesCount = breedingFemalesCount > 0 ? breedingFemalesCount : herdEligibleFemalesCount

  const weaningPercentage = exposedFemalesCount > 0 ? (weanedCalves.length / exposedFemalesCount) * 100 : 0

  // Helper for computing individual animal ADG: (current recorded weight - last recorded weight) ÷ age in days
  const weightMonths = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const getAnimalADG = (a: any): number | null => {
    let currentWeight: number | null = null;
    let lastWeight: number | null = null;

    // Check animal_weights table for this animal's tag
    const weightRow = animalWeights.find(w => w.animal_tag === a.tag);
    if (weightRow) {
      const recorded: number[] = [];
      weightMonths.forEach(m => {
        if (isValidWeight(weightRow[m], 1500)) {
          recorded.push(Number(weightRow[m]));
        }
      });
      if (recorded.length >= 2) {
        currentWeight = recorded[recorded.length - 1];
        lastWeight = recorded[recorded.length - 2];
      } else if (recorded.length === 1) {
        currentWeight = recorded[0];
        if (isValidWeight(a.previous_weight, 1500)) {
          lastWeight = Number(a.previous_weight);
        } else if (isValidWeight(a.birth_weight, 120)) {
          lastWeight = Number(a.birth_weight);
        }
      }
    }

    // Fallback to animal record fields (weight & previous_weight, or weaning_weight & birth_weight)
    if (currentWeight === null || lastWeight === null) {
      if (isValidWeight(a.weight, 1500) && isValidWeight(a.previous_weight, 1500)) {
        currentWeight = Number(a.weight);
        lastWeight = Number(a.previous_weight);
      } else if (isValidWeight(a.weaning_weight, 600) && isValidWeight(a.birth_weight, 120)) {
        currentWeight = Number(a.weaning_weight);
        lastWeight = Number(a.birth_weight);
      }
    }

    if (currentWeight !== null && lastWeight !== null) {
      let ageInDays = 0;
      if (a.date_of_birth) {
        const dob = new Date(a.date_of_birth);
        ageInDays = Math.round((new Date().getTime() - dob.getTime()) / (1000 * 3600 * 24));
      } else if (a.age) {
        const y = a.age.match(/(\d+)\s*y/);
        const m = a.age.match(/(\d+)\s*m/);
        const d = a.age.match(/(\d+)\s*d/);
        ageInDays = (y ? parseInt(y[1]) * 365 : 0) + (m ? parseInt(m[1]) * 30.4 : 0) + (d ? parseInt(d[1]) : 0);
      }

      if (ageInDays > 0) {
        const animalAdg = (currentWeight - lastWeight) / ageInDays;
        // Biological livestock outlier filter: daily gain must be realistically between -5.0 and +5.0 kg/day
        if (animalAdg >= -5 && animalAdg <= 5) {
          return animalAdg;
        }
      }
    }
    return null;
  };

  // 1. Herd ADG
  let totalAdg = 0;
  let countAdg = 0;
  animals.forEach(a => {
    const val = getAnimalADG(a);
    if (val !== null) {
      totalAdg += val;
      countAdg++;
    }
  });
  const adg = countAdg > 0 ? Number((totalAdg / countAdg).toFixed(3)) : 0;

  // 2. Pre-weaning DLWG: ADG for unweaned calves recorded for that year
  const unweanedCalves = calves.filter(a => !Boolean(a.date_of_weaning) && a.calf_status !== 'Replacement' && a.calf_status !== 'Sold' && !(Number(a.weaning_weight || 0) > 0));
  let preWeaningSum = 0; 
  let preWeaningCount = 0;
  unweanedCalves.forEach(a => {
    const val = getAnimalADG(a);
    if (val !== null) {
      preWeaningSum += val;
      preWeaningCount++;
    }
  });
  const preWeaningDLWG = preWeaningCount > 0 ? Number((preWeaningSum / preWeaningCount).toFixed(3)) : 0;

  // 3. Post-weaning DLWG: ADG for weaned calves recorded for that year
  let postWeaningSum = 0; 
  let postWeaningCount = 0;
  weanedCalves.forEach(a => {
    const val = getAnimalADG(a);
    if (val !== null) {
      postWeaningSum += val;
      postWeaningCount++;
    }
  });
  const postWeaningDLWG = postWeaningCount > 0 ? Number((postWeaningSum / postWeaningCount).toFixed(3)) : 0;

  // a. Pre-weaning Mortality: (Calves that died prior to weaning) ÷ (Total calves born) * 100
  const preWeaningMortCount = mortalityRecords.filter(m => m.is_pre_weaning || m.stage === 'pre_weaning' || m.cause === 'Pre-weaning Mortality' || m.description?.toLowerCase().includes('pre-weaning')).length;
  const totalCalvesBorn = calves.length + preWeaningMortCount;
  const preWeaningMortality = totalCalvesBorn > 0 ? Number(((preWeaningMortCount / totalCalvesBorn) * 100).toFixed(2)) : 0;

  // b. Post-weaning Mortality: (Calves that died post weaning) ÷ (Total calves weaned) * 100
  const postWeaningMortCount = mortalityRecords.filter(m => (!m.is_pre_weaning && m.stage !== 'pre_weaning') && (m.stage === 'post_weaning' || m.cause?.toLowerCase().includes('post-weaning') || m.description?.toLowerCase().includes('post-weaning'))).length;
  const totalCalvesWeaned = weanedCalves.length + postWeaningMortCount;
  const postWeaningMortality = totalCalvesWeaned > 0 ? Number(((postWeaningMortCount / totalCalvesWeaned) * 100).toFixed(2)) : 0;

  // c. Herd Mortality: number of deaths / (opening stock + number of newborns) x 100
  const totalDeaths = mortalityRecords.length;
  const adultAnimalsInHerd = animals.filter(a => determineAnimalStage(a) === 'adult').length;
  const adultDeaths = Math.max(0, totalDeaths - preWeaningMortCount - postWeaningMortCount);
  const openingStock = adultAnimalsInHerd + adultDeaths;
  const totalHerdExposed = openingStock + totalCalvesBorn;
  const herdMortality = totalHerdExposed > 0 ? Number(((totalDeaths / totalHerdExposed) * 100).toFixed(2)) : 0;

  // d. Weaning Rate: (Total calves weaned) ÷ (Total calves born) * 100
  const weaningRate = totalCalvesBorn > 0 ? Number(((weanedCalves.length / totalCalvesBorn) * 100).toFixed(2)) : 0;

  const productionMetrics: ProductionMetric[] = [
    { 
      key: 'weaning',             
      title: 'Calf Crop % (Weaning %)',    
      value: weaningPercentage, 
      target: targets.weaning,            
      unit: '%',     
      description: `Formula: (${weanedCalves.length} weaned ÷ ${exposedFemalesCount} exposed females) × 100` 
    },
    { 
      key: 'adg',                 
      title: 'Average Daily Gain (ADG)',   
      value: adg,               
      target: targets.adg,                
      unit: 'kg/day', 
      description: `Benchmark: 0.9 – 1.13 kg/day • Formula: (Current Wt - Last Wt) ÷ Age (days) • (${countAdg} animals evaluated)` 
    },
    { 
      key: 'preWeaningDLWG',      
      title: 'Pre-weaning DLWG',          
      value: preWeaningDLWG,    
      target: targets.preWeaningDLWG,     
      unit: 'kg/day', 
      description: `Benchmark: > 0.7 kg/day • ADG of unweaned calves • (${preWeaningCount} evaluated)` 
    },
    { 
      key: 'postWeaningDLWG',     
      title: 'Post-weaning DLWG',         
      value: postWeaningDLWG,   
      target: targets.postWeaningDLWG,    
      unit: 'kg/day', 
      description: `Benchmark: 0.8 – 1.0 kg/day • ADG of weaned calves • (${postWeaningCount} evaluated)` 
    },
    { 
      key: 'preWeaningMortality', 
      title: 'Pre-weaning Mortality Rate', 
      value: preWeaningMortality, 
      target: targets.preWeaningMortality, 
      unit: '%', 
      description: `Benchmark: < 5% • Formula: (${preWeaningMortCount} pre-weaning deaths ÷ ${totalCalvesBorn} calves born) × 100` 
    },
    { 
      key: 'postWeaningMortality', 
      title: 'Post-weaning Mortality Rate', 
      value: postWeaningMortality, 
      target: targets.postWeaningMortality, 
      unit: '%', 
      description: `Benchmark: < 3% • Formula: (${postWeaningMortCount} post-weaning deaths ÷ ${totalCalvesWeaned} weaned) × 100` 
    },
    { 
      key: 'herdMortality',       
      title: 'Herd Mortality Rate',        
      value: herdMortality,     
      target: targets.herdMortality,      
      unit: '%',     
      description: `Benchmark: < 5% • Formula: ${totalDeaths} deaths ÷ (${openingStock} opening stock + ${totalCalvesBorn} newborns) × 100` 
    },
    { 
      key: 'weaningRate',         
      title: 'Weaning Rate',               
      value: weaningRate,       
      target: targets.weaningRate,        
      unit: '%',     
      description: `Benchmark: 70 – 80% • Formula: (${weanedCalves.length} weaned ÷ ${totalCalvesBorn} born) × 100` 
    },
  ]

  const openEdit = (m: ProductionMetric) => { setEditingKey(m.key); setDraftValue(String(m.target)) }
  const saveEdit = () => {
    if (!editingKey) return
    const v = parseFloat(draftValue)
    if (!isNaN(v) && v > 0) setTargets(prev => ({ ...prev, [editingKey]: v }))
    setEditingKey(null); setDraftValue('')
  }
  const editingMetric = productionMetrics.find(m => m.key === editingKey)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: C.primary500, borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Production Metrics</h2>
      </div>

      {/* Metric cards — responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {productionMetrics.map(m => (
          <ProductionMetricCard key={m.key} metric={m} isAdmin onEdit={() => openEdit(m)} />
        ))}
      </div>

      {/* Per-metric target edit modal — same as mobile */}
      {editingKey && editingMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: C.white, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p className="font-bold text-base mb-1" style={{ color: C.neutral900 }}>Set Target</p>
            <p className="font-medium text-sm mb-1" style={{ color: C.neutral900 }}>{editingMetric.title}</p>
            <p className="text-xs mb-4" style={{ color: C.neutral500 }}>{editingMetric.description}</p>

            {/* Input row */}
            <div className="flex items-center gap-3 mb-5">
              <input
                type="number"
                value={draftValue}
                onChange={e => setDraftValue(e.target.value)}
                autoFocus
                className="flex-1 text-center text-lg font-bold rounded-xl px-4 py-3 outline-none"
                style={{
                  border: `1.5px solid ${C.primary400}`,
                  backgroundColor: C.primary50,
                  color: C.neutral900,
                }}
              />
              <span className="text-sm" style={{ color: C.neutral600 }}>{editingMetric.unit}</span>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingKey(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>
                Cancel
              </button>
              <button onClick={saveEdit}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: C.primary600 }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
