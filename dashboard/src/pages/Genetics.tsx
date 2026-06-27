import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { X } from 'lucide-react'

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  primary300: '#C3E39D', primary500: '#7AC142', primary600: '#639A34',
  secondary500: '#8B7429',
  accent500: '#FF9E2C',
  success500: '#43B97C', success600: '#359563',
  warning500: '#FFC107',
  error500: '#E74C3C',
  neutral50:  '#F8F9FA', neutral100: '#E9ECEF', neutral200: '#DEE2E6',
  neutral300: '#CED4DA', neutral400: '#ADB5BD',
  neutral500: '#6C757D', neutral600: '#495057',
  neutral700: '#343A40', neutral900: '#121416',
  white: '#FFFFFF',
}

// Chart colours for breed distribution
const CHART_COLORS = [C.primary500, C.secondary500, C.accent500, C.success500, C.neutral500, '#6C3483', '#1A5276']

type Tab = 'herds' | 'breeds' | 'pregnancy' | 'calving' | 'bulls'

const TABS: { key: Tab; label: string }[] = [
  { key: 'herds',     label: 'Breeding' },
  { key: 'breeds',    label: 'Breeds' },
  { key: 'pregnancy', label: 'Pregnancy' },
  { key: 'calving',   label: 'Calving' },
  { key: 'bulls',     label: 'Bulls' },
]

// ─── Donut chart (pure CSS/SVG) ───────────────────────────────────────────────
interface PieSlice { name: string; population: number; color: string }

function DonutChart({ data, size = 200 }: { data: PieSlice[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.population, 0)
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="rounded-full" style={{ width: size * 0.7, height: size * 0.7, border: `18px solid ${C.neutral200}` }} />
        <p className="text-xs mt-3" style={{ color: C.neutral400 }}>No data</p>
      </div>
    )
  }

  const R = 42; const cx = 50; const cy = 50; const strokeW = 14
  let offset = 0
  const slices = data.map(d => {
    const pct = (d.population / total) * 100
    const s = { pct, offset, color: d.color }
    offset += pct
    return s
  })
  const circum = 2 * Math.PI * R

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={R}
            fill="none" stroke={s.color} strokeWidth={strokeW}
            strokeDasharray={`${(s.pct / 100) * circum} ${circum}`}
            strokeDashoffset={-((s.offset / 100) * circum)}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        ))}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs" style={{ color: C.neutral600 }}>{d.name}</span>
            <span className="text-xs font-semibold" style={{ color: C.neutral900 }}>
              {d.population} ({total > 0 ? Math.round((d.population / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs w-12 flex-shrink-0" style={{ color: C.neutral600 }}>{label}</span>
      <div className="flex-1 h-2.5 rounded-full" style={{ backgroundColor: C.neutral100 }}>
        <div className="h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs w-8 text-right flex-shrink-0 font-semibold"
        style={{ color: C.neutral700 }}>{pct}%</span>
    </div>
  )
}

const isCalf = (age: string | null | undefined, stockType?: string | null) => {
  if (stockType === 'Calve' || stockType === 'Calf') return true
  if (!age) return false
  const ageMatch = age.match(/(\d+)([ym])/)
  if (!ageMatch) return false
  const [_, value, unit] = ageMatch
  return (unit === 'm' && parseInt(value) < 12) || (unit === 'y' && parseInt(value) === 0)
}

// ─── Stat row (for tables inside cards) ─────────────────────────────────────
function StatRow({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b"
      style={{ borderColor: C.neutral200 }}>
      <span className="text-sm font-medium" style={{ color: C.neutral700 }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: valueColor || C.neutral900 }}>{value}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Genetics() {
  const { session, profile, targetUserId } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [activeTab, setActiveTab] = useState<Tab>('herds')
  const [animals, setAnimals]         = useState<any[]>([])
  const [breedingRecs, setBreeding]   = useState<any[]>([])
  const [pregnancyRecs, setPregnancy] = useState<any[]>([])
  const [bullRecs, setBullRecs]       = useState<any[]>([])
  const [mortalityRecs, setMortality] = useState<any[]>([])
  const [fi, setFi]                   = useState<Record<string, any>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formOverrides, setFormOverrides] = useState<Record<string, { attained: string; target: string }>>({})
  const [saving, setSaving]           = useState(false)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    setFi({})
    Promise.all([
      supabase.from('animals').select('*').eq('user_id', targetUserId),
      supabase.from('breeding_records').select('*').eq('user_id', targetUserId),
      supabase.from('pregnancy_records').select('*').eq('user_id', targetUserId),
      supabase.from('bull_breeding_records').select('*').eq('user_id', targetUserId),
      supabase.from('mortality_records').select('*').eq('user_id', targetUserId),
      supabase.from('farm_inspections').select('*').eq('user_id', targetUserId).maybeSingle(),
    ]).then(([a, b, p, bull, m, ins]) => {
      setAnimals(a.data ?? [])
      setBreeding(b.data ?? [])
      setPregnancy(p.data ?? [])
      setBullRecs(bull.data ?? [])
      setMortality(m.data ?? [])
      if (ins?.data?.data) {
        setFi(ins.data.data as Record<string, any>)
      } else {
        setFi({})
      }
      setLoading(false)
    })
  }, [targetUserId])

  // ── 1. Breeding Herd Composition ──────────────────────────────────────────
  const cowCount    = animals.filter(a => a.stock_type === 'Cow').length
  const heiferCount = animals.filter(a => a.stock_type === 'Heifer' || a.stock_type === 'Bullying Heifer').length
  const totalBreedable = cowCount + heiferCount

  const breedingHerdData: PieSlice[] = [
    { name: 'Cows',    population: cowCount,    color: C.primary500 },
    { name: 'Heifers', population: heiferCount, color: C.secondary500 },
  ]

  // ── 2. BCS Distribution ───────────────────────────────────────────────────
  const animalsWithBCS = animals.filter(a => a.bcs)
  const totalWithBCS   = animalsWithBCS.length
  const bcsAvg = totalWithBCS ? animalsWithBCS.reduce((s, a) => s + a.bcs, 0) / totalWithBCS : 0

  const bcsRanges = useMemo(() => {
    let b1 = 0, b2 = 0, b3 = 0, b4 = 0
    animalsWithBCS.forEach(a => {
      const s = a.bcs || 0
      if      (s >= 1 && s < 2) b1++
      else if (s >= 2 && s < 3) b2++
      else if (s >= 3 && s < 4) b3++
      else if (s >= 4 && s <= 5) b4++
    })
    return [
      { score: '1–2', pct: totalWithBCS ? Math.round((b1 / totalWithBCS) * 100) : 0 },
      { score: '2–3', pct: totalWithBCS ? Math.round((b2 / totalWithBCS) * 100) : 0 },
      { score: '3–4', pct: totalWithBCS ? Math.round((b3 / totalWithBCS) * 100) : 0 },
      { score: '4–5', pct: totalWithBCS ? Math.round((b4 / totalWithBCS) * 100) : 0 },
    ]
  }, [animalsWithBCS, totalWithBCS])

  // ── 3. Breed Distribution ─────────────────────────────────────────────────
  const breedCounts: Record<string, number> = {}
  animals.forEach(a => { const b = a.breed || 'Unknown'; breedCounts[b] = (breedCounts[b] || 0) + 1 })
  const breedDistributionData: PieSlice[] = animals.length > 0
    ? Object.entries(breedCounts).map(([name, population], idx) => ({ name, population, color: CHART_COLORS[idx % CHART_COLORS.length] }))
    : [{ name: 'No Animals', population: 1, color: C.neutral300 }]

  // ── 4. Pregnancy Stats ────────────────────────────────────────────────────
  const totalServed  = breedingRecs.filter(b => b.serviced_date).length
  const totalInCalf  = breedingRecs.filter(b => b.breeding_status === 'Confirmed Pregnant').length
  const t1 = pregnancyRecs.filter(p => p.first_trimester_pd === 'Positive').length
  const t2 = pregnancyRecs.filter(p => p.second_trimester_pd === 'Positive').length
  const t3 = pregnancyRecs.filter(p => p.third_trimester_pd === 'Positive').length
  const liveConceptionRate = totalServed > 0 ? Math.round((totalInCalf / totalServed) * 100) : 0
  const live42dRate = breedingRecs.length > 0 ? Math.round((totalInCalf / breedingRecs.length) * 100) : 0
  const live100dRate = pregnancyRecs.length > 0 ? Math.round((t2 / pregnancyRecs.length) * 100) : 0

  const getPregnancyMetric = (key: string, liveAttained: string, defaultTarget: string) => {
    const overrides = fi.pregnancyOverrides || {}
    const override = overrides[key]
    const attained = override?.attained || liveAttained
    const target = override?.target || defaultTarget
    return { attained, target }
  }

  const cr = getPregnancyMetric('conceptionRate', `${liveConceptionRate}%`, '65%')
  const ir42 = getPregnancyMetric('incalfRate42d', `${live42dRate}%`, '75%')
  const ir100 = getPregnancyMetric('incalfRate100d', `${live100dRate}%`, '90%')
  const pd1 = getPregnancyMetric('firstTrimesterPD', String(t1), '—')
  const pd2 = getPregnancyMetric('secondTrimesterPD', String(t2), '—')
  const pd3 = getPregnancyMetric('thirdTrimesterPD', String(t3), '—')

  const handleOpenModal = () => {
    const overrides = fi.pregnancyOverrides || {}
    setFormOverrides({
      conceptionRate: {
        attained: overrides.conceptionRate?.attained?.replace('%', '') || '',
        target: overrides.conceptionRate?.target?.replace('%', '') || '',
      },
      incalfRate42d: {
        attained: overrides.incalfRate42d?.attained?.replace('%', '') || '',
        target: overrides.incalfRate42d?.target?.replace('%', '') || '',
      },
      incalfRate100d: {
        attained: overrides.incalfRate100d?.attained?.replace('%', '') || '',
        target: overrides.incalfRate100d?.target?.replace('%', '') || '',
      },
      firstTrimesterPD: {
        attained: overrides.firstTrimesterPD?.attained || '',
        target: overrides.firstTrimesterPD?.target || '',
      },
      secondTrimesterPD: {
        attained: overrides.secondTrimesterPD?.attained || '',
        target: overrides.secondTrimesterPD?.target || '',
      },
      thirdTrimesterPD: {
        attained: overrides.thirdTrimesterPD?.attained || '',
        target: overrides.thirdTrimesterPD?.target || '',
      },
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!session) return
    setSaving(true)

    const formatPct = (val: string) => {
      let trimmed = val.trim()
      if (!trimmed) return ''
      if (!trimmed.endsWith('%') && /^\d+(\.\d+)?$/.test(trimmed)) {
        return trimmed + '%'
      }
      return trimmed
    }

    const formatVal = (val: string) => val.trim()

    const formattedOverrides = {
      conceptionRate: {
        attained: formatPct(formOverrides.conceptionRate.attained),
        target: formatPct(formOverrides.conceptionRate.target),
      },
      incalfRate42d: {
        attained: formatPct(formOverrides.incalfRate42d.attained),
        target: formatPct(formOverrides.incalfRate42d.target),
      },
      incalfRate100d: {
        attained: formatPct(formOverrides.incalfRate100d.attained),
        target: formatPct(formOverrides.incalfRate100d.target),
      },
      firstTrimesterPD: {
        attained: formatVal(formOverrides.firstTrimesterPD.attained),
        target: formatVal(formOverrides.firstTrimesterPD.target),
      },
      secondTrimesterPD: {
        attained: formatVal(formOverrides.secondTrimesterPD.attained),
        target: formatVal(formOverrides.secondTrimesterPD.target),
      },
      thirdTrimesterPD: {
        attained: formatVal(formOverrides.thirdTrimesterPD.attained),
        target: formatVal(formOverrides.thirdTrimesterPD.target),
      },
      lastUpdated: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const cleanedOverrides: any = {}
    Object.entries(formattedOverrides).forEach(([key, val]) => {
      if (key === 'lastUpdated') {
        cleanedOverrides.lastUpdated = val
        return
      }
      const overrideVal = val as { attained: string; target: string }
      if (overrideVal.attained || overrideVal.target) {
        cleanedOverrides[key] = {
          attained: overrideVal.attained || undefined,
          target: overrideVal.target || undefined,
        }
      }
    })

    const updated = { ...fi, pregnancyOverrides: cleanedOverrides }
    setFi(updated)

    try {
      const { data: ex } = await supabase.from('farm_inspections').select('id').eq('user_id', targetUserId).maybeSingle()
      if (ex) {
        await supabase.from('farm_inspections').update({ data: updated, updated_at: new Date().toISOString() }).eq('id', ex.id)
      } else {
        await supabase.from('farm_inspections').insert({ user_id: targetUserId, data: updated, updated_at: new Date().toISOString() })
      }
      setIsModalOpen(false)
    } catch (e) {
      console.error("Error saving pregnancy overrides:", e)
    } finally {
      setSaving(false)
    }
  }

  // ── 5. Calving Stats ──────────────────────────────────────────────────────
  const calves = animals.filter(a => isCalf(a.age, a.stock_type))
  const preWeanMortality = mortalityRecs.filter(m => m.is_pre_weaning).length
  const calvingRate = animals.length > 0 ? Math.round((calves.length / animals.length) * 100) : 0

  // ── 6. Bull Breeding Soundness ────────────────────────────────────────────
  const bullAnimals = animals.filter(a => a.stock_type === 'Bull')
  const mappedBulls = bullRecs.map(b => ({
    id:   b.bull_id,
    date: b.date,
    category: b.classification === 'SPB' ? 'Satisfactory Potential Breeder' :
              b.classification === 'USPB' ? 'Un-Satisfactory Potential Breeder' :
              'Classification Deferred',
    statusColor: b.classification === 'SPB' ? C.success500 :
                 b.classification === 'USPB' ? C.error500  : C.warning500,
  }))

  const bullDistribution: PieSlice[] = [
    { name: 'Weaners', population: bullAnimals.filter(a => a.age?.includes('m')).length || 0, color: C.primary300 },
    { name: 'Mature',  population: bullAnimals.filter(a => !a.age?.includes('m')).length || 0, color: C.primary600 },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: C.primary500, borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Genetics &amp; Production</h2>
        <p className="text-sm mt-0.5" style={{ color: C.neutral500 }}>Herd composition, breeding, and pregnancy statistics</p>
      </div>

      {/* Tab bar — underline style matching mobile */}
      <div className="flex border-b" style={{ borderColor: C.neutral200 }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="px-4 py-3 text-sm font-medium transition-all mr-1 whitespace-nowrap"
            style={activeTab === key
              ? { color: C.primary500, borderBottom: `2px solid ${C.primary500}`, marginBottom: -1 }
              : { color: C.neutral600 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── BREEDING (herds) tab ────────────────────────────────────────────── */}
      {activeTab === 'herds' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Herd Composition card */}
          <div className="card">
            <p className="font-semibold text-base mb-4" style={{ color: C.neutral900 }}>Herd Composition</p>
            <DonutChart data={breedingHerdData} size={200} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ['Cows', cowCount, C.primary500],
                ['Heifers', heiferCount, C.secondary500],
              ].map(([label, count, color]) => (
                <div key={label as string} className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: C.neutral50, border: `1px solid ${C.neutral100}` }}>
                  <p className="text-2xl font-bold" style={{ color: color as string }}>{count}</p>
                  <p className="text-xs" style={{ color: C.neutral500 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* BCS card */}
          <div className="card">
            <p className="font-semibold text-base mb-4" style={{ color: C.neutral900 }}>Body Condition Score (BCS)</p>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm" style={{ color: C.neutral600 }}>Average BCS</p>
                <p className="text-3xl font-bold" style={{ color: C.primary500 }}>{bcsAvg.toFixed(1)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm" style={{ color: C.neutral600 }}>Target Range</p>
                <p className="text-base font-semibold" style={{ color: C.success500 }}>2.0 – 4.0</p>
              </div>
            </div>
            <div className="space-y-1">
              {bcsRanges.map(r => (
                <ProgressBar key={r.score} label={`BCS ${r.score}`} pct={r.pct} color={C.primary500} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BREEDS tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'breeds' && (
        <div className="card">
          <p className="font-semibold text-base mb-4" style={{ color: C.neutral900 }}>Breed Distribution</p>
          <DonutChart data={breedDistributionData} size={220} />
          <div className="mt-5 space-y-2">
            {Object.entries(breedCounts).map(([breed, count], idx) => (
              <div key={breed} className="flex items-center justify-between py-2 border-b"
                style={{ borderColor: C.neutral100 }}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="text-sm font-medium" style={{ color: C.neutral900 }}>{breed}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color: C.neutral900 }}>{count}</span>
                  <span className="text-xs ml-1" style={{ color: C.neutral500 }}>
                    ({animals.length > 0 ? Math.round((count / animals.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
            {Object.keys(breedCounts).length === 0 && (
              <p className="text-center py-6 text-sm" style={{ color: C.neutral400 }}>No animals registered</p>
            )}
          </div>
        </div>
      )}

      {/* ── PREGNANCY tab ──────────────────────────────────────────────────── */}
      {activeTab === 'pregnancy' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <p className="font-semibold text-base" style={{ color: C.neutral900 }}>Pregnancy Statistics</p>
            {isAdmin && (
              <button onClick={handleOpenModal}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:brightness-95"
                style={{ backgroundColor: C.primary600 }}>
                Modify Stats
              </button>
            )}
          </div>
          
          <StatRow label="Total Served"            value={totalServed} />
          <StatRow label="Total In-Calf"           value={totalInCalf} />

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: '100%' }}>
              <thead>
                <tr className="border-b" style={{ borderColor: C.neutral200 }}>
                  <th className="py-2 text-xs font-bold uppercase" style={{ color: C.neutral500 }}>Metric</th>
                  <th className="py-2 text-xs font-bold uppercase text-center" style={{ color: C.neutral500 }}>Attained</th>
                  <th className="py-2 text-xs font-bold uppercase text-center" style={{ color: C.neutral500 }}>Target</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b" style={{ borderColor: C.neutral100 }}>
                  <td className="py-3 text-sm font-medium" style={{ color: C.neutral700 }}>Conception Rate</td>
                  <td className="py-3 text-sm font-bold text-center" style={{ color: parseFloat(cr.attained) >= 65 ? C.success500 : C.error500 }}>{cr.attained}</td>
                  <td className="py-3 text-sm font-medium text-center" style={{ color: C.neutral500 }}>{cr.target}</td>
                </tr>
                <tr className="border-b" style={{ borderColor: C.neutral100 }}>
                  <td className="py-3 text-sm font-medium" style={{ color: C.neutral700 }}>42-Day Incalf Rate</td>
                  <td className="py-3 text-sm font-semibold text-center" style={{ color: C.primary500 }}>{ir42.attained}</td>
                  <td className="py-3 text-sm font-medium text-center" style={{ color: C.neutral500 }}>{ir42.target}</td>
                </tr>
                <tr className="border-b" style={{ borderColor: C.neutral100 }}>
                  <td className="py-3 text-sm font-medium" style={{ color: C.neutral700 }}>100-Day Incalf Rate</td>
                  <td className="py-3 text-sm font-semibold text-center" style={{ color: C.primary500 }}>{ir100.attained}</td>
                  <td className="py-3 text-sm font-medium text-center" style={{ color: C.neutral500 }}>{ir100.target}</td>
                </tr>
                <tr className="border-b" style={{ borderColor: C.neutral100 }}>
                  <td className="py-3 text-sm font-medium" style={{ color: C.neutral700 }}>1st Trimester PD</td>
                  <td className="py-3 text-sm font-semibold text-center" style={{ color: C.neutral700 }}>{pd1.attained}</td>
                  <td className="py-3 text-sm font-medium text-center" style={{ color: C.neutral500 }}>{pd1.target}</td>
                </tr>
                <tr className="border-b" style={{ borderColor: C.neutral100 }}>
                  <td className="py-3 text-sm font-medium" style={{ color: C.neutral700 }}>2nd Trimester PD</td>
                  <td className="py-3 text-sm font-semibold text-center" style={{ color: C.neutral700 }}>{pd2.attained}</td>
                  <td className="py-3 text-sm font-medium text-center" style={{ color: C.neutral500 }}>{pd2.target}</td>
                </tr>
                <tr className="border-b" style={{ borderColor: C.neutral100 }}>
                  <td className="py-3 text-sm font-medium" style={{ color: C.neutral700 }}>3rd Trimester PD</td>
                  <td className="py-3 text-sm font-semibold text-center" style={{ color: C.neutral700 }}>{pd3.attained}</td>
                  <td className="py-3 text-sm font-medium text-center" style={{ color: C.neutral500 }}>{pd3.target}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {fi.pregnancyOverrides?.lastUpdated && (
            <p className="text-right text-xs mt-4 italic" style={{ color: C.neutral400 }}>
              Last updated: {fi.pregnancyOverrides.lastUpdated}
            </p>
          )}
        </div>
      )}

      {/* ── CALVING tab ────────────────────────────────────────────────────── */}
      {activeTab === 'calving' && (
        <div className="card">
          <p className="font-semibold text-base mb-4" style={{ color: C.neutral900 }}>Calving Performance</p>
          <StatRow label="Calving Interval"        value="365 days" />
          <StatRow label="Calving Rate (3-week)"   value={`${calvingRate}%`}   valueColor={C.success500} />
          <StatRow label="Calf Mortality"          value={`${animals.length > 0 ? Math.round((preWeanMortality / animals.length) * 100) : 0}%`} valueColor={C.error500} />
          <StatRow label="Total Calves"            value={calves.length} />
          <StatRow label="Male Calves"             value={calves.filter(c => c.sex === 'Male').length} />
          <StatRow label="Female Calves"           value={calves.filter(c => c.sex === 'Female').length} />
        </div>
      )}

      {/* ── BULLS tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'bulls' && (
        <div className="card">
          <p className="font-semibold text-base mb-4" style={{ color: C.neutral900 }}>Bulls and Breeding Soundness</p>

          {/* Bull Distribution chart */}
          <div className="mb-6">
            <p className="text-sm font-semibold mb-3" style={{ color: C.neutral700 }}>Bull Distribution</p>
            <DonutChart data={bullDistribution} size={160} />
          </div>

          {/* Bull Breeding Soundness table */}
          <p className="text-sm font-semibold mb-3" style={{ color: C.neutral700 }}>Bull Breeding Soundness</p>
          {mappedBulls.length === 0 ? (
            <div className="text-center py-8 rounded-xl" style={{ backgroundColor: C.neutral50, border: `1px solid ${C.neutral200}` }}>
              <p className="text-sm" style={{ color: C.neutral500 }}>No breeding soundness records available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${C.neutral200}` }}>
              <table className="w-full data-table" style={{ minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Bull ID</th>
                    <th>Category</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedBulls.map((bull, i) => (
                    <tr key={i}>
                      <td style={{ color: C.neutral600 }}>{bull.date}</td>
                      <td className="font-semibold" style={{ color: C.neutral900 }}>{bull.id}</td>
                      <td style={{ color: C.neutral700 }}>{bull.category}</td>
                      <td className="text-center">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: bull.statusColor }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bull count summary */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: C.neutral50, border: `1px solid ${C.neutral100}` }}>
              <p className="text-2xl font-bold" style={{ color: C.primary500 }}>{bullAnimals.length}</p>
              <p className="text-xs" style={{ color: C.neutral500 }}>Total Bulls</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: C.neutral50, border: `1px solid ${C.neutral100}` }}>
              <p className="text-2xl font-bold" style={{ color: C.success500 }}>
                {mappedBulls.filter(b => b.statusColor === C.success500).length}
              </p>
              <p className="text-xs" style={{ color: C.neutral500 }}>Satisfactory</p>
            </div>
          </div>
        </div>
      )}

      {/* Modify Pregnancy Stats Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg rounded-t-2xl flex flex-col"
            style={{ backgroundColor: C.white, maxHeight: '85vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b"
              style={{ borderColor: C.neutral100 }}>
              <h3 className="text-xl font-bold" style={{ color: C.neutral700 }}>Modify Pregnancy Stats</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={20} style={{ color: C.error500 }} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-3"
                  style={{ color: C.primary600 }}>Pregnancy Metric Overrides</p>
                
                {/* Conception Rate */}
                <div className="flex items-center justify-between py-3 border-b"
                  style={{ borderColor: C.neutral50 }}>
                  <span className="text-sm font-medium flex-1 mr-4"
                    style={{ color: C.neutral700 }}>Conception Rate (%)</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Attained</p>
                      <input
                        type="number"
                        value={formOverrides.conceptionRate?.attained ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, conceptionRate: { ...prev.conceptionRate, attained: e.target.value } }))}
                        placeholder="e.g. 67"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Target</p>
                      <input
                        type="number"
                        value={formOverrides.conceptionRate?.target ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, conceptionRate: { ...prev.conceptionRate, target: e.target.value } }))}
                        placeholder="e.g. 65"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 42-Day Incalf Rate */}
                <div className="flex items-center justify-between py-3 border-b"
                  style={{ borderColor: C.neutral50 }}>
                  <span className="text-sm font-medium flex-1 mr-4"
                    style={{ color: C.neutral700 }}>42-Day Incalf Rate (%)</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Attained</p>
                      <input
                        type="number"
                        value={formOverrides.incalfRate42d?.attained ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, incalfRate42d: { ...prev.incalfRate42d, attained: e.target.value } }))}
                        placeholder="e.g. 78"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Target</p>
                      <input
                        type="number"
                        value={formOverrides.incalfRate42d?.target ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, incalfRate42d: { ...prev.incalfRate42d, target: e.target.value } }))}
                        placeholder="e.g. 75"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 100-Day Incalf Rate */}
                <div className="flex items-center justify-between py-3 border-b"
                  style={{ borderColor: C.neutral50 }}>
                  <span className="text-sm font-medium flex-1 mr-4"
                    style={{ color: C.neutral700 }}>100-Day Incalf Rate (%)</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Attained</p>
                      <input
                        type="number"
                        value={formOverrides.incalfRate100d?.attained ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, incalfRate100d: { ...prev.incalfRate100d, attained: e.target.value } }))}
                        placeholder="e.g. 92"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Target</p>
                      <input
                        type="number"
                        value={formOverrides.incalfRate100d?.target ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, incalfRate100d: { ...prev.incalfRate100d, target: e.target.value } }))}
                        placeholder="e.g. 90"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 1st Trimester PD */}
                <div className="flex items-center justify-between py-3 border-b"
                  style={{ borderColor: C.neutral50 }}>
                  <span className="text-sm font-medium flex-1 mr-4"
                    style={{ color: C.neutral700 }}>1st Trimester PD</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Attained</p>
                      <input
                        type="number"
                        value={formOverrides.firstTrimesterPD?.attained ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, firstTrimesterPD: { ...prev.firstTrimesterPD, attained: e.target.value } }))}
                        placeholder="e.g. 15"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Target</p>
                      <input
                        type="number"
                        value={formOverrides.firstTrimesterPD?.target ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, firstTrimesterPD: { ...prev.firstTrimesterPD, target: e.target.value } }))}
                        placeholder="e.g. 20"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2nd Trimester PD */}
                <div className="flex items-center justify-between py-3 border-b"
                  style={{ borderColor: C.neutral50 }}>
                  <span className="text-sm font-medium flex-1 mr-4"
                    style={{ color: C.neutral700 }}>2nd Trimester PD</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Attained</p>
                      <input
                        type="number"
                        value={formOverrides.secondTrimesterPD?.attained ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, secondTrimesterPD: { ...prev.secondTrimesterPD, attained: e.target.value } }))}
                        placeholder="e.g. 10"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Target</p>
                      <input
                        type="number"
                        value={formOverrides.secondTrimesterPD?.target ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, secondTrimesterPD: { ...prev.secondTrimesterPD, target: e.target.value } }))}
                        placeholder="e.g. 15"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3rd Trimester PD */}
                <div className="flex items-center justify-between py-3 border-b"
                  style={{ borderColor: C.neutral50 }}>
                  <span className="text-sm font-medium flex-1 mr-4"
                    style={{ color: C.neutral700 }}>3rd Trimester PD</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Attained</p>
                      <input
                        type="number"
                        value={formOverrides.thirdTrimesterPD?.attained ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, thirdTrimesterPD: { ...prev.thirdTrimesterPD, attained: e.target.value } }))}
                        placeholder="e.g. 5"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Target</p>
                      <input
                        type="number"
                        value={formOverrides.thirdTrimesterPD?.target ?? ''}
                        onChange={e => setFormOverrides(prev => ({ ...prev, thirdTrimesterPD: { ...prev.thirdTrimesterPD, target: e.target.value } }))}
                        placeholder="e.g. 8"
                        className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                        style={{ border: `1px solid ${C.neutral200}`, color: C.neutral700 }}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
              <button onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: C.primary600, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
