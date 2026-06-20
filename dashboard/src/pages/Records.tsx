import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { X } from 'lucide-react'

// ─── Colour helpers ───────────────────────────────────────────────────────────

const C = {
  primary50: '#F0F9EB', primary100: '#DCEFC5',
  primary500: '#7AC142', primary600: '#639A34',
  success500: '#43B97C', warning500: '#FFC107',
  error400: '#EC7063', error500: '#E74C3C', error600: '#CB4335',
  accent500: '#A48D3D',
  neutral50: '#F8F9FA', neutral100: '#E9ECEF', neutral200: '#DEE2E6',
  neutral300: '#CED4DA', neutral400: '#ADB5BD',
  neutral500: '#6C757D', neutral600: '#495057',
  neutral700: '#343A40', neutral800: '#23272B', neutral900: '#121416',
  white: '#FFFFFF',
}

// ─── Mark helpers — identical to mobile ──────────────────────────────────────

function getMark(percentage: number): string {
  if (isNaN(percentage)) return '—'
  if (percentage >= 97) return 'A+'
  if (percentage >= 93) return 'A'
  if (percentage >= 90) return 'A-'
  if (percentage >= 87) return 'B+'
  if (percentage >= 83) return 'B'
  if (percentage >= 80) return 'B-'
  if (percentage >= 77) return 'C+'
  if (percentage >= 73) return 'C'
  if (percentage >= 70) return 'C-'
  if (percentage >= 60) return 'D'
  return 'F'
}

function getMarkColor(mark: string): string {
  if (mark === '—') return C.neutral300
  switch (mark.charAt(0)) {
    case 'A': return C.success500
    case 'B': return C.primary500
    case 'C': return C.warning500
    case 'D': return C.error400
    case 'F': return C.error600
    default:  return C.neutral500
  }
}

function getBadgeColor(badge: string): string {
  if (badge === 'Gold')     return '#FFD700'
  if (badge === 'Platinum') return '#E5E4E2'
  if (badge === 'Diamond')  return '#B9F2FF'
  return C.accent500
}

// ─── Metric groups — same as mobile ──────────────────────────────────────────

const METRIC_GROUPS = [
  {
    title: 'Identification',
    metrics: [
      { key: 'ear tags',           label: 'Ear Tags' },
      { key: 'electronic id',      label: 'Electronic ID' },
      { key: 'brand registration', label: 'Brand Registration' },
      { key: 'dna profiles',       label: 'DNA Profiles' },
    ],
  },
  {
    title: 'Accessibility and Usage',
    metrics: [
      { key: 'data accuracy',          label: 'Data Accuracy' },
      { key: 'knowledge',              label: 'Knowledge' },
      { key: 'use in decision making', label: 'Use in Decision Making' },
    ],
  },
  {
    title: 'Record System Traceability',
    metrics: [
      { key: 'birth registration', label: 'Birth Registration' },
      { key: 'movement records',   label: 'Movement Records' },
      { key: 'health treatments',  label: 'Health Treatments' },
      { key: 'mortality records',  label: 'Mortality Records' },
      { key: 'feed records',       label: 'Feed Records' },
    ],
  },
]

const DEFAULT_TARGETS: Record<string, string> = {
  'ear tags': '100%', 'electronic id': '90%', 'brand registration': '95%', 'dna profiles': '70%',
  'data accuracy': '95%', 'knowledge': '85%', 'use in decision making': '90%',
  'birth registration': '100%', 'movement records': '95%', 'health treatments': '100%',
  'mortality records': '100%', 'feed records': '90%',
}

// ─── Table component ──────────────────────────────────────────────────────────

function DataTable({ title, rows, cols }: {
  title: string
  rows: Record<string, any>[]
  cols: { key: string; label: string; render?: (v: any) => React.ReactNode }[]
}) {
  return (
    <div className="card p-0 overflow-hidden mb-4">
      <div className="px-5 py-4 border-b font-semibold"
        style={{ borderColor: C.neutral100, color: C.neutral900 }}>{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>{cols.map(c => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length} className="text-center py-8" style={{ color: C.neutral400 }}>No data</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i}>
                {cols.map(c => (
                  <td key={c.key}>
                    {c.render ? c.render(row[c.key]) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Records() {
  const { session, targetUserId } = useAuth()
  const [fi, setFi] = useState<Record<string, any>>({})
  const [animalCount, setAnimalCount] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formOverrides, setFormOverrides] = useState<Record<string, { attained: string; target: string }>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!targetUserId) return
    setFi({})
    setAnimalCount(0)
    supabase.from('farm_inspections').select('*').eq('user_id', targetUserId).maybeSingle()
      .then(({ data }) => { 
        if (data?.data) setFi(data.data as Record<string, any>)
        else setFi({})
      })
    supabase.from('animals').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId)
      .then(({ count }) => setAnimalCount(count ?? 0))
  }, [targetUserId])

  const hasAnimals = animalCount > 0

  // Derived percentages — same as mobile
  const accuracyPct  = Math.round((fi.recordsSatisfaction    ?? 0) * 20)
  const knowledgePct = Math.round((fi.recordsTrainingEvidence ?? 0) * 20)
  const usagePct     = Math.round((fi.recordAccessibilityUsage ?? 0) * 20)

  const defaultAttained: Record<string, string> = {
    'ear tags':           hasAnimals ? '100%' : '0%',
    'electronic id':      hasAnimals ? '85%'  : '0%',
    'brand registration': hasAnimals ? '92%'  : '0%',
    'dna profiles':       hasAnimals ? '65%'  : '0%',
    'data accuracy':          `${accuracyPct}%`,
    'knowledge':              `${knowledgePct}%`,
    'use in decision making': `${usagePct}%`,
    'birth registration': fi.maintainsBirth        ? '100%' : '0%',
    'movement records':   fi.maintainsMovements    ? '100%' : '0%',
    'health treatments':  fi.maintainsHealth       ? '100%' : '0%',
    'mortality records':  fi.maintainsMortalities  ? '100%' : '0%',
    'feed records':       fi.maintainsFeed         ? '100%' : '0%',
  }

  const COMPUTED_KEYS = new Set([
    'data accuracy', 'knowledge', 'use in decision making',
    'birth registration', 'movement records', 'health treatments', 'mortality records', 'feed records',
  ])

  const getMetric = (key: string) => {
    const override = (fi.recordsOverrides ?? {})[key]
    const isComputed = COMPUTED_KEYS.has(key)
    if (override?.attained || override?.target) {
      const a = override.attained ?? (isComputed ? defaultAttained[key] : '—')
      const t = override.target   ?? (isComputed ? DEFAULT_TARGETS[key]  : '—')
      return { attained: a, target: t, mark: getMark(parseFloat(a)) }
    }
    if (isComputed) {
      const a = defaultAttained[key]; const t = DEFAULT_TARGETS[key]
      return { attained: a, target: t, mark: getMark(parseFloat(a)) }
    }
    return { attained: '—', target: '—', mark: '—' }
  }

  // Build table rows
  const accessibilityData = [
    { metric: 'Data Accuracy',          ...getMetric('data accuracy') },
    { metric: 'Knowledge',              ...getMetric('knowledge') },
    { metric: 'Use in Decision Making', ...getMetric('use in decision making') },
  ]
  const traceabilityData = [
    { metric: 'Birth Registration', ...getMetric('birth registration') },
    { metric: 'Movement Records',   ...getMetric('movement records') },
    { metric: 'Health Treatments',  ...getMetric('health treatments') },
    { metric: 'Mortality Records',  ...getMetric('mortality records') },
    { metric: 'Feed Records',       ...getMetric('feed records') },
  ]
  const identificationData = [
    { method: 'Ear Tags',           ...getMetric('ear tags') },
    { method: 'Electronic ID',      ...getMetric('electronic id') },
    { method: 'Brand Registration', ...getMetric('brand registration') },
    { method: 'DNA Profiles',       ...getMetric('dna profiles') },
  ]
  const observerAwards = hasAnimals ? [
    { category: 'Heat Detection',    name: 'John Smith',    count: 28, badge: 'Gold' },
    { category: 'Calving Observer',  name: 'Maria Garcia',  count: 32, badge: 'Platinum' },
    { category: 'Health Monitor',    name: 'David Johnson', count: 45, badge: 'Diamond' },
  ] : []

  // Mark badge renderer
  const MarkBadge = (mark: string) => (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white"
      style={{ backgroundColor: getMarkColor(mark) }}>
      {mark}
    </span>
  )
  const BadgePill = (badge: string) => (
    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: getBadgeColor(badge), color: badge === 'Gold' ? '#7A5500' : '#333' }}>
      {badge}
    </span>
  )

  // Modify metrics modal handlers
  const handleOpenModal = () => {
    const init: Record<string, { attained: string; target: string }> = {}
    Object.keys(defaultAttained).forEach(k => {
      const saved = (fi.recordsOverrides ?? {})[k]
      init[k] = { attained: saved?.attained?.replace('%', '') ?? '', target: saved?.target?.replace('%', '') ?? '' }
    })
    setFormOverrides(init)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    const formatted: Record<string, { attained: string; target: string }> = {}
    Object.keys(formOverrides).forEach(key => {
      let a = formOverrides[key].attained.trim()
      let t = formOverrides[key].target.trim()
      if (!a && !t) return
      if (a && !a.endsWith('%') && /^\d+(\.\d+)?$/.test(a)) a += '%'
      if (t && !t.endsWith('%') && /^\d+(\.\d+)?$/.test(t)) t += '%'
      const existing = (fi.recordsOverrides ?? {})[key]
      formatted[key] = {
        attained: a || existing?.attained || defaultAttained[key],
        target:   t || existing?.target   || DEFAULT_TARGETS[key],
      }
    })
    const updated = { ...fi, recordsOverrides: formatted }
    setFi(updated)

    const { data: ex } = await supabase.from('farm_inspections').select('id').eq('user_id', targetUserId).maybeSingle()
    if (ex) await supabase.from('farm_inspections').update({ data: updated }).eq('id', ex.id)
    else     await supabase.from('farm_inspections').insert({ user_id: targetUserId, data: updated })

    setSaving(false)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Records</h2>
          <p className="text-sm mt-0.5" style={{ color: C.neutral500 }}>Farm records analysis and traceability</p>
        </div>
        {/* Admin: Modify Metrics button — same as mobile */}
        <button onClick={handleOpenModal}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: C.primary600 }}>
          Modify Metrics
        </button>
      </div>

      {/* Accessibility and Usage */}
      <DataTable title="Accessibility and Usage" rows={accessibilityData} cols={[
        { key: 'metric',   label: 'Metric' },
        { key: 'attained', label: 'Attained' },
        { key: 'target',   label: 'Target' },
        { key: 'mark',     label: 'Mark', render: MarkBadge },
      ]} />

      {/* Record System Traceability */}
      <DataTable title="Record System Traceability" rows={traceabilityData} cols={[
        { key: 'metric',   label: 'Metric' },
        { key: 'attained', label: 'Attained' },
        { key: 'target',   label: 'Target' },
        { key: 'mark',     label: 'Mark', render: MarkBadge },
      ]} />

      {/* Identification */}
      <DataTable title="Identification" rows={identificationData} cols={[
        { key: 'method',   label: 'Method' },
        { key: 'attained', label: 'Attained' },
        { key: 'target',   label: 'Target' },
        { key: 'mark',     label: 'Mark', render: MarkBadge },
      ]} />

      {/* Observer Awards */}
      <DataTable title="Observer Awards" rows={observerAwards} cols={[
        { key: 'category', label: 'Category' },
        { key: 'name',     label: 'Observer' },
        { key: 'count',    label: 'Count' },
        { key: 'badge',    label: 'Badge', render: BadgePill },
      ]} />

      {/* Modify Metrics Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg rounded-t-2xl flex flex-col"
            style={{ backgroundColor: C.white, maxHeight: '85vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b"
              style={{ borderColor: C.neutral100 }}>
              <h3 className="text-xl font-bold" style={{ color: C.neutral800 }}>Modify Metrics</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={20} style={{ color: C.error500 }} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
              {METRIC_GROUPS.map(group => (
                <div key={group.title}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-3"
                    style={{ color: C.primary600 }}>{group.title}</p>
                  {group.metrics.map(m => (
                    <div key={m.key}
                      className="flex items-center justify-between py-3 border-b"
                      style={{ borderColor: C.neutral50 }}>
                      <span className="text-sm font-medium flex-1 mr-4"
                        style={{ color: C.neutral700 }}>{m.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Attained</p>
                          <input
                            type="number"
                            value={formOverrides[m.key]?.attained ?? ''}
                            onChange={e => setFormOverrides(prev => ({ ...prev, [m.key]: { ...prev[m.key], attained: e.target.value } }))}
                            placeholder="0"
                            className="w-16 text-center text-sm rounded-lg px-2 py-1 outline-none"
                            style={{ border: `1px solid ${C.neutral200}`, color: C.neutral800 }}
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-xs mb-1" style={{ color: C.neutral400 }}>Target</p>
                          <input
                            type="number"
                            value={formOverrides[m.key]?.target ?? ''}
                            onChange={e => setFormOverrides(prev => ({ ...prev, [m.key]: { ...prev[m.key], target: e.target.value } }))}
                            placeholder="0"
                            className="w-16 text-center text-sm rounded-lg px-2 py-1 outline-none"
                            style={{ border: `1px solid ${C.neutral200}`, color: C.neutral800 }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
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
