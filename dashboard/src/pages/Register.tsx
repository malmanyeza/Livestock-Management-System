import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Plus, Search, X, Database, ClipboardList, Heart, Dna, ShieldAlert, Scale, ChevronDown
} from 'lucide-react'

// ─── Color constants ──────────────────────────────────────────────────────────
const C = {
  primary50: '#F0F9EB', primary100: '#DCEFC5', primary400: '#92CC4E',
  primary500: '#7AC142', primary600: '#639A34',
  success500: '#43B97C', success50: '#E6F9F1',
  warning500: '#FFC107', warning50: '#FFFAEB',
  error500: '#E74C3C', error50: '#FDEDEC',
  neutral50: '#F8F9FA', neutral100: '#E9ECEF', neutral200: '#DEE2E6',
  neutral300: '#CED4DA', neutral400: '#ADB5BD',
  neutral500: '#6C757D', neutral600: '#495057',
  neutral700: '#343A40', neutral900: '#121416', white: '#FFFFFF',
}

type Tab = 'herd' | 'drugs' | 'health' | 'breeding' | 'mortality' | 'weight'

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'herd',      label: 'Herd Register',   icon: Database },
  { key: 'drugs',     label: 'Drug Register',   icon: ClipboardList },
  { key: 'health',    label: 'Health Records',  icon: Heart },
  { key: 'breeding',  label: 'Breeding Logs',   icon: Dna },
  { key: 'mortality', label: 'Mortality Logs',  icon: ShieldAlert },
  { key: 'weight',    label: 'Weight Logs',     icon: Scale },
]

// Badge helpers
const tagBadge = (tag: string) => {
  if (!tag) return '—'
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm transition-all hover:scale-105"
      style={{
        backgroundColor: '#F8F9FA',
        borderColor: '#DEE2E6',
        color: '#343A40',
        fontFamily: 'monospace',
      }}>
      🏷️ {tag}
    </span>
  )
}

const statusBadge = (s: string) => {
  let bg = '#F8F9FA', border = '#DEE2E6', color = '#495057'
  if (s.includes('Completed') || s.includes('In Stock'))  { bg = '#E6F9F1'; border = '#9FE4C1'; color = '#27714B' }
  else if (s.includes('Scheduled') || s.includes('Low Stock')) { bg = '#FFF9E6'; border = '#FFE59F'; color = '#B78A00' }
  else if (s.includes('Pending') || s.includes('Out of Stock')) { bg = '#FDEDEC'; border = '#F5B7B1'; color = '#B03A2E' }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
      style={{ backgroundColor: bg, borderColor: border, color }}>
      {s}
    </span>
  )
}

const sexBadge = (s: string) => {
  const isMale = s === 'Male'
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border"
      style={{
        backgroundColor: isMale ? '#EBF5FB' : '#FDEDEC',
        borderColor: isMale ? '#AED6F1' : '#F5B7B1',
        color: isMale ? '#2980B9' : '#C0392B',
      }}>
      {isMale ? '♂' : '♀'} {s}
    </span>
  )
}

const pregnancyBadge = (s: string) => {
  const isYes = s === 'Yes'
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
      style={{
        backgroundColor: isYes ? '#E6F9F1' : '#F8F9FA',
        borderColor: isYes ? '#9FE4C1' : '#DEE2E6',
        color: isYes ? '#27714B' : '#6C757D'
      }}>
      {s}
    </span>
  )
}

const methodBadge = (v: string) => {
  if (!v) return '—'
  const isAI = v === 'AI'
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
      style={{
        backgroundColor: isAI ? '#E8F8F5' : '#EBF5FB',
        borderColor: isAI ? '#A3E4D7' : '#AED6F1',
        color: isAI ? '#117A65' : '#2980B9'
      }}>
      {v}
    </span>
  )
}

// ─── Simple data table ────────────────────────────────────────────────────────
interface ColDef {
  key: string
  label: string
  render?: (v: any, row: any) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

function Table({ data, cols }: { data: any[]; cols: ColDef[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full data-table">
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} style={{ textAlign: c.align || 'left' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={cols.length} className="text-center py-12" style={{ color: C.neutral400 }}>
                <Database size={24} className="mx-auto mb-2 opacity-40" />
                No records found
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                {cols.map(c => (
                  <td key={c.key} style={{ textAlign: c.align || 'left' }}>
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Add Drug Modal ───────────────────────────────────────────────────────────
function AddDrugModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ drugClass: '', type: '', name: '', withdrawalPeriod: '', pregnancySafe: 'No', stockStatus: 'In Stock' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.drugClass.trim()) { setError('Please enter the Drug Class.'); return }
    if (!form.type.trim())      { setError('Please enter the Drug Type.'); return }
    if (!form.name.trim())      { setError('Please enter the Drug Name.'); return }
    setError(''); setSaving(true)
    try { await onSave(form) } catch (e: any) { setError(e.message || 'Failed to save drug') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>Add New Drug</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          {[
            { label: 'Drug Class', key: 'drugClass', placeholder: 'e.g., Antibiotic, Vitamin' },
            { label: 'Type', key: 'type', placeholder: 'e.g., Injectable, Oral' },
            { label: 'Drug Name', key: 'name', placeholder: 'e.g., Oxytetracycline' },
            { label: 'Withdrawal Period', key: 'withdrawalPeriod', placeholder: 'e.g., 21 days' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: C.neutral500 }}>Pregnancy Safe</label>
            <div className="flex gap-3">
              {['Yes', 'No'].map(v => (
                <button key={v} onClick={() => setForm(p => ({ ...p, pregnancySafe: v }))}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border"
                  style={{
                    backgroundColor: form.pregnancySafe === v ? C.primary600 : C.neutral100,
                    borderColor: form.pregnancySafe === v ? C.primary600 : C.neutral200,
                    color: form.pregnancySafe === v ? C.white : C.neutral700
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Stock Status</label>
            <div className="relative">
              <select value={form.stockStatus} onChange={e => setForm(p => ({ ...p, stockStatus: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                {['In Stock', 'Low Stock', 'Out of Stock'].map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Adding…' : 'Add Drug'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Mortality Modal ──────────────────────────────────────────────────────
function AddMortalityModal({ animals, onClose, onSave }: { animals: any[]; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], animalId: '', cause: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.animalId) { setError('Please select an animal.'); return }
    if (!form.cause.trim()) { setError('Please enter the cause of death.'); return }
    setError(''); setSaving(true)
    try { await onSave(form) } catch (e: any) { setError(e.message || 'Failed to save') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>Add Mortality Record</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Select Animal</label>
            <div className="relative">
              <select value={form.animalId} onChange={e => setForm(p => ({ ...p, animalId: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                <option value="">Select an animal…</option>
                {animals.map(a => <option key={a.id} value={a.tag}>{a.tag} ({a.breed} {a.stock_type})</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Cause</label>
            <input value={form.cause} onChange={e => setForm(p => ({ ...p, cause: e.target.value }))}
              placeholder="e.g., Disease, Injury"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Enter description"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.error500, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Register() {
  const { session, targetUserId } = useAuth()
  const [activeTab, setActiveTab]   = useState<Tab>('herd')
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)

  // Data state
  const [animals, setAnimals]           = useState<any[]>([])
  const [drugs, setDrugs]               = useState<any[]>([])
  const [healthRecords, setHealthRecords] = useState<any[]>([])
  const [breedingRecords, setBreeding]  = useState<any[]>([])
  const [mortalityRecords, setMortality]= useState<any[]>([])
  const [weightRecords, setWeights]     = useState<any[]>([])

  // Modal state
  const [showAddDrug, setShowAddDrug]           = useState(false)
  const [showAddMortality, setShowAddMortality] = useState(false)

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    Promise.all([
      supabase.from('animals').select('*').eq('user_id', targetUserId).order('tag'),
      supabase.from('drugs').select('*').eq('user_id', targetUserId).order('name'),
      supabase.from('health_records').select('*').eq('user_id', targetUserId).order('date', { ascending: false }),
      supabase.from('breeding_records').select('*').eq('user_id', targetUserId).order('heat_detection_date', { ascending: false }),
      supabase.from('mortality_records').select('*').eq('user_id', targetUserId).order('date', { ascending: false }),
      supabase.from('animal_weights').select('*').eq('user_id', targetUserId).order('animal_tag'),
    ]).then(([a, d, h, b, m, w]) => {
      setAnimals(a.data ?? [])
      setDrugs(d.data ?? [])
      setHealthRecords(h.data ?? [])
      setBreeding(b.data ?? [])
      setMortality(m.data ?? [])
      setWeights(w.data ?? [])
      setLoading(false)
    })
  }, [targetUserId])

  // Filtered search
  const q = search.toLowerCase()
  const filteredAnimals  = animals.filter(a => !q || a.tag?.toLowerCase().includes(q) || a.breed?.toLowerCase().includes(q) || a.stock_type?.toLowerCase().includes(q))
  const filteredDrugs    = drugs.filter(d   => !q || d.name?.toLowerCase().includes(q) || d.drug_class?.toLowerCase().includes(q))
  const filteredHealth   = healthRecords.filter(r => !q || r.animal_tag?.toLowerCase().includes(q) || r.treatment?.toLowerCase().includes(q))
  const filteredBreeding = breedingRecords.filter(r => !q || r.ear_tag_number?.toLowerCase().includes(q))
  const filteredMortality= mortalityRecords.filter(r => !q || r.animal_tag?.toLowerCase().includes(q) || r.cause?.toLowerCase().includes(q))
  const filteredWeights  = weightRecords.filter(r => !q || r.animal_tag?.toLowerCase().includes(q))

  // Herd stats
  const herdTotals = useMemo(() => ({
    cows:         animals.filter(a => a.stock_type === 'Cow').length,
    bulls:        animals.filter(a => a.stock_type === 'Bull').length,
    heifers:      animals.filter(a => a.stock_type === 'Heifer').length,
    steers:       animals.filter(a => a.stock_type === 'Steer').length,
    calves:       animals.filter(a => a.stock_type === 'Calve' || a.stock_type === 'Calf').length,
  }), [animals])

  const addDrug = async (d: any) => {
    if (!session || !targetUserId) return
    const { data, error } = await supabase.from('drugs').insert({ ...d, user_id: targetUserId }).select().single()
    if (error) throw error
    setDrugs(prev => [...prev, data])
    setShowAddDrug(false)
  }

  const addMortality = async (d: any) => {
    if (!session || !targetUserId) return
    const { data, error } = await supabase.from('mortality_records').insert({ ...d, user_id: targetUserId, is_pre_weaning: false }).select().single()
    if (error) throw error
    setMortality(prev => [data, ...prev])
    setShowAddMortality(false)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: C.neutral100 }}>
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: C.neutral900 }}>Registers</h2>
          <p className="text-sm mt-0.5" style={{ color: C.neutral500 }}>View and manage all records across different registers.</p>
        </div>
      </div>

      {/* Tab bar — exact mobile pill style */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto bg-neutral-100 shadow-sm border border-neutral-200/40">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setActiveTab(key); setSearch('') }}
            className="flex items-center gap-2 flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
            style={activeTab === key
              ? { backgroundColor: C.white, color: C.primary600, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
              : { backgroundColor: 'transparent', color: C.neutral500 }}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Search + add button row */}
      <div className="flex items-center gap-3 p-3 rounded-2xl border bg-white shadow-sm" style={{ borderColor: C.neutral100 }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.neutral400 }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()}…`}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
            style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}
            onFocus={e => e.target.style.borderColor = C.primary500}
            onBlur={e => e.target.style.borderColor = C.neutral200}
          />
        </div>
        {activeTab === 'drugs' && (
          <button onClick={() => setShowAddDrug(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600 }}>
            <Plus size={16} /> Add Drug
          </button>
        )}
        {activeTab === 'mortality' && (
          <button onClick={() => setShowAddMortality(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.error500 }}>
            <Plus size={16} /> Add Record
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 border rounded-2xl bg-white shadow-sm" style={{ borderColor: C.neutral100 }}>
          <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: C.primary500, borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* HERD REGISTER */}
          {activeTab === 'herd' && (
            <>
              {/* Herd at a glance stats */}
              <div className="px-6 py-4 border-b flex gap-6 flex-wrap bg-neutral-50/50" style={{ borderColor: C.neutral100 }}>
                {[
                  ['Cows', herdTotals.cows, '#639A34'],
                  ['Bulls', herdTotals.bulls, '#E74C3C'],
                  ['Heifers', herdTotals.heifers, '#FF9E2C'],
                  ['Steers', herdTotals.steers, '#2980B9'],
                  ['Calves', herdTotals.calves, '#359563'],
                ].map(([label, count, color]) => (
                  <div key={label as string} className="text-center px-4 py-2 border rounded-xl bg-white shadow-sm" style={{ borderColor: C.neutral100, minWidth: '90px' }}>
                    <p className="text-xl font-bold" style={{ color: color as string }}>{count}</p>
                    <p className="text-xs font-semibold" style={{ color: C.neutral500 }}>{label}</p>
                  </div>
                ))}
                <div className="text-center px-5 py-2 border rounded-xl bg-white shadow-sm ml-auto" style={{ borderColor: C.primary100, backgroundColor: C.primary50, minWidth: '90px' }}>
                  <p className="text-xl font-extrabold" style={{ color: C.primary600 }}>{animals.length}</p>
                  <p className="text-xs font-bold" style={{ color: C.primary600 }}>Total</p>
                </div>
              </div>
              <Table data={filteredAnimals} cols={[
                { key: 'tag',         label: 'Tag',    render: tagBadge },
                { key: 'breed',       label: 'Breed' },
                { key: 'sex',         label: 'Sex',    render: sexBadge },
                { key: 'stock_type',  label: 'Type' },
                { key: 'source',      label: 'Source' },
                { key: 'age',         label: 'Age' },
                { key: 'date_of_birth', label: 'DOB' },
                { key: 'weight',      label: 'Weight (kg)', align: 'center' },
                { key: 'bcs',         label: 'BCS', align: 'center' },
              ]} />
            </>
          )}

          {/* DRUG REGISTER */}
          {activeTab === 'drugs' && (
            <>
              <div className="flex items-center gap-4 px-6 py-4 border-b bg-neutral-50/50" style={{ borderColor: C.neutral100 }}>
                <span className="font-bold text-sm" style={{ color: C.neutral900 }}>Drug Inventories ({filteredDrugs.length})</span>
                <div className="flex gap-2 ml-auto">
                  {statusBadge(`${drugs.filter(d => d.stock_status === 'In Stock').length} In Stock`)}
                  {statusBadge(`${drugs.filter(d => d.stock_status !== 'In Stock').length} Other`)}
                </div>
              </div>
              <Table data={filteredDrugs} cols={[
                { key: 'name',              label: 'Name',       render: (v) => <span className="font-semibold text-neutral-800">{v}</span> },
                { key: 'drug_class',        label: 'Class' },
                { key: 'type',              label: 'Type' },
                { key: 'withdrawal_period', label: 'Withdrawal' },
                { key: 'pregnancy_safe',    label: 'Preg. Safe', render: pregnancyBadge, align: 'center' },
                { key: 'stock_status',      label: 'Stock',      render: statusBadge, align: 'center' },
                { key: 'created_at',        label: 'Added',
                  render: (v) => v ? <span className="font-medium" style={{ color: C.neutral500, fontSize: 13 }}>{new Date(v).toLocaleDateString()}</span> : '—' },
              ]} />
            </>
          )}

          {/* HEALTH RECORDS */}
          {activeTab === 'health' && (
            <>
              <div className="px-6 py-4 border-b font-bold text-sm bg-neutral-50/50" style={{ borderColor: C.neutral100, color: C.neutral900 }}>
                Health Logs ({filteredHealth.length})
              </div>
              <Table data={filteredHealth} cols={[
                { key: 'animal_tag',        label: 'Animal',     render: tagBadge },
                { key: 'date',              label: 'Date' },
                { key: 'treatment',         label: 'Treatment' },
                { key: 'withdrawal_period', label: 'Withdrawal' },
                { key: 'pregnancy_safe',    label: 'Preg. Safe', render: pregnancyBadge, align: 'center' },
                { key: 'status',            label: 'Status',     render: statusBadge, align: 'center' },
              ]} />
            </>
          )}

          {/* BREEDING */}
          {activeTab === 'breeding' && (
            <>
              <div className="px-6 py-4 border-b font-bold text-sm bg-neutral-50/50" style={{ borderColor: C.neutral100, color: C.neutral900 }}>
                Breeding Records ({filteredBreeding.length})
              </div>
              <Table data={filteredBreeding} cols={[
                { key: 'ear_tag_number',   label: 'Animal',       render: tagBadge },
                { key: 'heat_detection_date', label: 'Heat Date' },
                { key: 'serviced_date',    label: 'Serviced' },
                { key: 'breeding_method',  label: 'Method',       render: methodBadge, align: 'center' },
                { key: 'breeding_status',  label: 'Status',       render: statusBadge, align: 'center' },
                { key: 'body_condition_score', label: 'BCS', align: 'center', render: (v) => v ? <span className="font-semibold text-neutral-800">{v}</span> : '—' },
              ]} />
            </>
          )}

          {/* MORTALITY */}
          {activeTab === 'mortality' && (
            <>
              <div className="px-6 py-4 border-b font-bold text-sm bg-neutral-50/50" style={{ borderColor: C.neutral100, color: C.neutral900 }}>
                Mortality Records ({filteredMortality.length})
              </div>
              <Table data={filteredMortality} cols={[
                { key: 'animal_tag',  label: 'Animal',      render: tagBadge },
                { key: 'date',        label: 'Date' },
                { key: 'cause',       label: 'Cause',       render: (v) => <span className="font-semibold" style={{ color: C.error500 }}>{v}</span> },
                { key: 'description', label: 'Description', render: (v) => <span className="font-medium" style={{ color: C.neutral500 }}>{v}</span> },
              ]} />
            </>
          )}

          {/* WEIGHT RECORDS */}
          {activeTab === 'weight' && (
            <>
              <div className="px-6 py-4 border-b font-bold text-sm bg-neutral-50/50" style={{ borderColor: C.neutral100, color: C.neutral900 }}>
                Monthly Weight Log ({filteredWeights.length})
              </div>
              <Table data={filteredWeights} cols={[
                { key: 'animal_tag', label: 'Animal', render: tagBadge },
                { key: 'year', label: 'Year', align: 'center' },
                ...['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].map(m => ({
                  key: m, label: m.charAt(0).toUpperCase() + m.slice(1),
                  render: (v: any) => v ? <span className="font-bold text-neutral-800">{v}</span> : <span style={{ color: C.neutral300 }}>—</span>,
                  align: 'center' as const
                }))
              ]} />
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddDrug     && <AddDrugModal     onClose={() => setShowAddDrug(false)}     onSave={addDrug} />}
      {showAddMortality && <AddMortalityModal animals={animals} onClose={() => setShowAddMortality(false)} onSave={addMortality} />}
    </div>
  )
}
