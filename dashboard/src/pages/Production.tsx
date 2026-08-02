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
  herdMortality:      5.0,
  weaningRate:        75,
}

const TARGET_DESCRIPTIONS: Record<string, string> = {
  weaning:             'Industry benchmark: ≥ 94%',
  adg:                 'Industry benchmark: 0.9 – 1.13 kg/day',
  preWeaningDLWG:      'Industry benchmark: > 0.7 kg/day',
  postWeaningDLWG:     'Industry benchmark: 0.8 – 1.0 kg/day',
  preWeaningMortality: 'Industry benchmark: < 5% (lower is better)',
  herdMortality:       'Industry benchmark: < 5% (lower is better)',
  weaningRate:         'Industry benchmark: 70 – 80%',
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
  if (isMortality) {
    if (value === 0)  return 100
    if (target === 0) return 0
    return Math.max(0, 100 - (value / target) * 100)
  }
  return (value / target) * 100
}

const isCalf = (age: string | null | undefined, stockType?: string | null) => {
  if (stockType === 'Calve' || stockType === 'Calf') return true
  if (!age) return false
  const ageMatch = age.match(/(\d+)([ym])/)
  if (!ageMatch) return false
  const [_, value, unit] = ageMatch
  return (unit === 'm' && parseInt(value) < 12) || (unit === 'y' && parseInt(value) === 0)
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
            style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
        </div>
      </div>

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
  const [mortality, setMortality] = useState(0)
  const [loading, setLoading]   = useState(true)
  const [targets, setTargets]   = useState({ ...DEFAULT_TARGETS })

  // Edit modal
  const [editingKey, setEditingKey]   = useState<string | null>(null)
  const [draftValue, setDraftValue]   = useState('')

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    Promise.all([
      supabase.from('animals').select('weight,previous_weight,days_between_weights,stock_type,age,calf_status,weaning_weight,is_breeding_cow').eq('user_id', targetUserId).eq('production_year', selectedProductionYear),
      supabase.from('mortality_records').select('id,is_pre_weaning', { count: 'exact' }).eq('user_id', targetUserId).eq('production_year', selectedProductionYear),
    ]).then(([{ data: a }, { data: m, count }]) => {
      setAnimals(a ?? [])
      setMortality(count ?? 0)
      setLoading(false)
    })
  }, [targetUserId, selectedProductionYear])

  // Derived metrics — same formulas as FarmDataContext
  const calves = animals.filter(a => isCalf(a.age, a.stock_type))
  const weanedCalves = calves.filter(a => a.calf_status === 'Replacement' || a.calf_status === 'Sold' || Number(a.weaning_weight || 0) > 0)
  const eligibleCows = animals.filter(a => a.stock_type === 'Cow' || (a.stock_type === 'Heifer' && a.is_breeding_cow))
  const withWeights = animals.filter(a => a.weight && a.previous_weight && a.days_between_weights > 0)
  const adg = withWeights.length
    ? withWeights.reduce((s, a) => s + (a.weight - a.previous_weight) / a.days_between_weights, 0) / withWeights.length
    : 0
  const herdMortality     = animals.length ? (mortality / animals.length) * 100 : 0
  const weaningPercentage = eligibleCows.length > 0 ? (weanedCalves.length / eligibleCows.length) * 100 : 0
  const weaningRate       = calves.length > 0 ? (weanedCalves.length / calves.length) * 100 : 0
  const preWeaningDLWG    = adg * 0.85 // approximate
  const postWeaningDLWG   = adg

  const productionMetrics: ProductionMetric[] = [
    { key: 'weaning',             title: 'Calf Crop % (Weaning %)',    value: weaningPercentage, target: targets.weaning,            unit: '%',     description: TARGET_DESCRIPTIONS.weaning },
    { key: 'adg',                 title: 'Average Daily Gain (ADG)',   value: adg,               target: targets.adg,                unit: 'kg/day', description: TARGET_DESCRIPTIONS.adg },
    { key: 'preWeaningDLWG',      title: 'Pre-weaning DLWG',          value: preWeaningDLWG,    target: targets.preWeaningDLWG,     unit: 'kg/day', description: TARGET_DESCRIPTIONS.preWeaningDLWG },
    { key: 'postWeaningDLWG',     title: 'Post-weaning DLWG',         value: postWeaningDLWG,   target: targets.postWeaningDLWG,    unit: 'kg/day', description: TARGET_DESCRIPTIONS.postWeaningDLWG },
    { key: 'preWeaningMortality', title: 'Pre-weaning Mortality Rate', value: herdMortality * 0.4, target: targets.preWeaningMortality, unit: '%', description: TARGET_DESCRIPTIONS.preWeaningMortality },
    { key: 'herdMortality',       title: 'Herd Mortality Rate',        value: herdMortality,     target: targets.herdMortality,      unit: '%',     description: TARGET_DESCRIPTIONS.herdMortality },
    { key: 'weaningRate',         title: 'Weaning Rate',               value: weaningRate,       target: targets.weaningRate,        unit: '%',     description: TARGET_DESCRIPTIONS.weaningRate },
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
