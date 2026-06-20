import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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
              {total > 0 ? Math.round((d.population / total) * 100) : 0}%
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
  const { targetUserId } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('herds')
  const [animals, setAnimals]         = useState<any[]>([])
  const [breedingRecs, setBreeding]   = useState<any[]>([])
  const [pregnancyRecs, setPregnancy] = useState<any[]>([])
  const [bullRecs, setBullRecs]       = useState<any[]>([])
  const [mortalityRecs, setMortality] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    Promise.all([
      supabase.from('animals').select('*').eq('user_id', targetUserId),
      supabase.from('breeding_records').select('*').eq('user_id', targetUserId),
      supabase.from('pregnancy_records').select('*').eq('user_id', targetUserId),
      supabase.from('bull_breeding_records').select('*').eq('user_id', targetUserId),
      supabase.from('mortality_records').select('*').eq('user_id', targetUserId),
    ]).then(([a, b, p, bull, m]) => {
      setAnimals(a.data ?? [])
      setBreeding(b.data ?? [])
      setPregnancy(p.data ?? [])
      setBullRecs(bull.data ?? [])
      setMortality(m.data ?? [])
      setLoading(false)
    })
  }, [targetUserId])

  // ── 1. Breeding Herd Composition ──────────────────────────────────────────
  const cowCount    = animals.filter(a => a.stock_type === 'Cow').length
  const heiferCount = animals.filter(a => a.stock_type === 'Heifer').length
  const totalBreedable = cowCount + heiferCount

  const breedingHerdData: PieSlice[] = [
    { name: 'Cows',    population: totalBreedable > 0 ? Math.round((cowCount / totalBreedable) * 100) : 0,    color: C.primary500 },
    { name: 'Heifers', population: totalBreedable > 0 ? Math.round((heiferCount / totalBreedable) * 100) : 0, color: C.secondary500 },
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
  const conceptionRate = totalServed > 0 ? Math.round((totalInCalf / totalServed) * 100) : 0

  // ── 5. Calving Stats ──────────────────────────────────────────────────────
  const calves = animals.filter(a => a.stock_type === 'Calve' || a.stock_type === 'Calf')
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
    <div className="space-y-5 max-w-3xl mx-auto">
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
        <>
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
        </>
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
          <p className="font-semibold text-base mb-4" style={{ color: C.neutral900 }}>Pregnancy Statistics</p>
          <StatRow label="Total Served"            value={totalServed} />
          <StatRow label="Total In-Calf"           value={totalInCalf} />
          <StatRow label="Conception Rate"         value={`${conceptionRate}%`}
            valueColor={conceptionRate >= 65 ? C.success500 : C.error500} />
          <StatRow label="42-Day Incalf Rate"      value={`${breedingRecs.length > 0 ? Math.round((totalInCalf / breedingRecs.length) * 100) : 0}%`}
            valueColor={C.primary500} />
          <StatRow label="100-Day Incalf Rate"     value={`${pregnancyRecs.length > 0 ? Math.round((t2 / pregnancyRecs.length) * 100) : 0}%`}
            valueColor={C.primary500} />
          <StatRow label="Trimester PDs (1st|2nd|3rd)" value={`${t1} | ${t2} | ${t3}`} />
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
              <table className="w-full data-table" style={{ minWidth: '750px' }}>
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
    </div>
  )
}
