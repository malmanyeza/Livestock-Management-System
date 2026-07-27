import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Plus, Search, X, Database, ClipboardList, Heart, Dna, ShieldAlert, Scale, ChevronDown, Package, DollarSign, Edit, Trash2
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import AnimalProfileModal from '../components/AnimalProfileModal'

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

type Tab = 'herd' | 'calf' | 'drugs' | 'health' | 'breeding' | 'pregnancy' | 'bulls' | 'mortality' | 'weight' | 'feed' | 'sales'

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'herd',      label: 'Herd Register',   icon: Database },
  { key: 'calf',      label: 'Calf Register',   icon: Database },
  { key: 'drugs',     label: 'Drug Register',   icon: ClipboardList },
  { key: 'health',    label: 'Health Records',  icon: Heart },
  { key: 'breeding',  label: 'Breeding Logs',   icon: Dna },
  { key: 'pregnancy', label: 'Pregnancy & Calving', icon: Dna },
  { key: 'bulls',     label: 'Bull Soundness',  icon: ClipboardList },
  { key: 'mortality', label: 'Mortality Logs',  icon: ShieldAlert },
  { key: 'weight',    label: 'Weight Logs',     icon: Scale },
  { key: 'feed',      label: 'Feed Inventory',  icon: Package },
  { key: 'sales',     label: 'Sales & Purchases', icon: DollarSign },
]

// Badge helpers
const statusBadge = (s: string | null | undefined) => {
  if (!s) return <span className="text-neutral-400">—</span>
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

const sexBadge = (s: string | null | undefined) => {
  if (!s) return <span className="text-neutral-400">—</span>
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

const pregnancyBadge = (s: string | null | undefined) => {
  if (!s) return <span className="text-neutral-400">—</span>
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

const methodBadge = (v: string | null | undefined) => {
  if (!v) return <span className="text-neutral-400">—</span>
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

const isCalf = (age: string | null | undefined, stockType?: string | null) => {
  if (stockType === 'Calve' || stockType === 'Calf') return true
  if (!age) return false
  const ageMatch = age.match(/(\d+)([ym])/)
  if (!ageMatch) return false
  const [_, value, unit] = ageMatch
  return (unit === 'm' && parseInt(value) < 12) || (unit === 'y' && parseInt(value) === 0)
}

// ─── Simple data table ────────────────────────────────────────────────────────
interface ColDef {
  key: string
  label: string
  render?: (v: any, row: any) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

function Table({ data, cols }: { data: any[]; cols: ColDef[] }) {
  const minWidth = cols.length > 10 ? '1200px' : cols.length > 6 ? '900px' : '800px'
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full data-table" style={{ minWidth }}>
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
function AddDrugModal({ editingDrug, onClose, onSave }: { editingDrug?: any; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({
    drugClass: editingDrug?.drug_class || '',
    type: editingDrug?.type || '',
    name: editingDrug?.name || '',
    withdrawalPeriod: editingDrug?.withdrawal_period || '',
    pregnancySafe: editingDrug?.pregnancy_safe || 'No',
    stockStatus: editingDrug?.stock_status || 'In Stock'
  })
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
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>{editingDrug ? 'Edit Drug' : 'Add New Drug'}</h3>
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
            {saving ? 'Saving…' : (editingDrug ? 'Save Changes' : 'Add Drug')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Mortality Modal ──────────────────────────────────────────────────────
function AddMortalityModal({ animals, onClose, onSave, editingMortality }: { animals: any[]; onClose: () => void; onSave: (d: any) => Promise<void>; editingMortality?: any }) {
  const [form, setForm] = useState({
    date: editingMortality?.date || new Date().toISOString().split('T')[0],
    animalId: editingMortality?.animal_tag || '',
    cause: editingMortality?.cause || '',
    description: editingMortality?.description || '',
    observer: editingMortality?.observer || ''
  })
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
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>{editingMortality ? 'Edit Mortality Record' : 'Add Mortality Record'}</h3>
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
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Observer</label>
            <input value={form.observer} onChange={e => setForm(p => ({ ...p, observer: e.target.value }))}
              placeholder="e.g., John Doe"
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

// ─── Add Animal Modal ─────────────────────────────────────────────────────────
function AddAnimalModal({ editingAnimal, onClose, onSave }: { editingAnimal?: any; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({
    tag: editingAnimal?.tag || '',
    date_of_birth: editingAnimal?.date_of_birth || '',
    breed: editingAnimal?.breed || '',
    sex: editingAnimal?.sex || 'Male',
    stock_type: editingAnimal?.stock_type || '',
    source: editingAnimal?.source || '',
    sire: editingAnimal?.sire || '',
    dam: editingAnimal?.dam || '',
    birth_weight: editingAnimal?.birth_weight || '',
    date_of_weaning: editingAnimal?.date_of_weaning || '',
    weaning_weight: editingAnimal?.weaning_weight || '',
    description: editingAnimal?.description || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.tag.trim()) { setError('Please enter the Animal Tag.'); return }
    if (!form.date_of_birth) { setError('Please select the Date of Birth.'); return }
    if (!form.breed.trim()) { setError('Please enter the Breed.'); return }
    if (!form.stock_type) { setError('Please select a Stock Type.'); return }
    if (!form.source) { setError('Please select the Source.'); return }

    if (form.sex === 'Male' && ['Cow', 'Heifer', 'Bullying Heifer'].includes(form.stock_type)) {
      setError(`A ${form.stock_type} must be Female.`); return
    }
    if (form.sex === 'Female' && ['Bull', 'Steer'].includes(form.stock_type)) {
      setError(`A ${form.stock_type} must be Male.`); return
    }

    setError(''); setSaving(true)
    try {
      // Calculate age
      const dob = new Date(form.date_of_birth)
      const today = new Date()
      let years = today.getFullYear() - dob.getFullYear()
      let months = today.getMonth() - dob.getMonth()
      if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
        years--
        months += 12
      }
      const age = years > 0 ? `${years}y ${months}m` : `${months}m`

      await onSave({
        tag: form.tag.trim(),
        date_of_birth: form.date_of_birth,
        breed: form.breed.trim(),
        sex: form.sex,
        stock_type: form.stock_type,
        source: form.source,
        age,
        sire: form.sire.trim() || null,
        dam: form.dam.trim() || null,
        birth_weight: form.birth_weight.trim() || null,
        date_of_weaning: form.date_of_weaning || null,
        weaning_weight: form.weaning_weight ? Number(form.weaning_weight) : null,
        description: form.description.trim() || null,
        bcs: editingAnimal?.bcs ?? 3.0,
      })
    } catch (e: any) {
      setError(e.message || 'Failed to save animal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>{editingAnimal ? 'Edit Animal' : 'Add New Animal'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Tag *</label>
              <input value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}
                placeholder="e.g., TAG123"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Date of Birth *</label>
              <input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Breed *</label>
              <input value={form.breed} onChange={e => setForm(p => ({ ...p, breed: e.target.value }))}
                placeholder="e.g., Brahman, Angus"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Sex *</label>
              <div className="flex gap-2">
                {['Male', 'Female'].map(v => (
                  <button key={v} type="button" onClick={() => setForm(p => ({ ...p, sex: v }))}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border"
                    style={{
                      backgroundColor: form.sex === v ? C.primary600 : C.neutral100,
                      borderColor: form.sex === v ? C.primary600 : C.neutral200,
                      color: form.sex === v ? C.white : C.neutral700
                    }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Stock Type *</label>
              <div className="relative">
                <select value={form.stock_type} onChange={e => setForm(p => ({ ...p, stock_type: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="">Select type…</option>
                  {['Bull', 'Cow', 'Heifer', 'Bullying Heifer', 'Steer', 'Calve'].map(s => <option key={s} value={s}>{s === 'Calve' ? 'Calf' : s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Source *</label>
              <div className="relative">
                <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="">Select source…</option>
                  <option value="Born">Born on Farm</option>
                  <option value="Purchased">Purchased</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Sire</label>
              <input value={form.sire} onChange={e => setForm(p => ({ ...p, sire: e.target.value }))}
                placeholder="Sire Tag / ID"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Dam</label>
              <input value={form.dam} onChange={e => setForm(p => ({ ...p, dam: e.target.value }))}
                placeholder="Dam Tag / ID"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Birth Wt (kg)</label>
              <input type="number" step="any" value={form.birth_weight} onChange={e => setForm(p => ({ ...p, birth_weight: e.target.value }))}
                placeholder="e.g., 35"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Wean Date</label>
              <input type="date" value={form.date_of_weaning} onChange={e => setForm(p => ({ ...p, date_of_weaning: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Wean Wt (kg)</label>
              <input type="number" step="any" value={form.weaning_weight} onChange={e => setForm(p => ({ ...p, weaning_weight: e.target.value }))}
                placeholder="e.g., 180"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Enter animal description/markings"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : (editingAnimal ? 'Save Changes' : 'Add Animal')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Calf Modal ───────────────────────────────────────────────────────────
function AddCalfModal({ editingCalf, onClose, onSave }: { editingCalf?: any; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({
    tag: editingCalf?.tag || '',
    date_of_birth: editingCalf?.date_of_birth || '',
    breed: editingCalf?.breed || '',
    sex: editingCalf?.sex || 'Male',
    sire: editingCalf?.sire || '',
    dam: editingCalf?.dam || '',
    birth_weight: editingCalf?.birth_weight || '',
    weight_30day: editingCalf?.weight_30day || '',
    weight_100day: editingCalf?.weight_100day || '',
    date_of_weaning: editingCalf?.date_of_weaning || '',
    weaning_weight: editingCalf?.weaning_weight || '',
    weight_1week_post_weaning: editingCalf?.weight_1week_post_weaning || '',
    weight_6months_post_weaning: editingCalf?.weight_6months_post_weaning || '',
    calf_status: editingCalf?.calf_status || 'Active',
    pre_weaning_mortality: editingCalf?.pre_weaning_mortality ? 'Yes' : 'No',
    description: editingCalf?.description || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.tag.trim()) { setError('Please enter the Animal Tag.'); return }
    if (!form.date_of_birth) { setError('Please select the Date of Birth.'); return }
    if (!form.breed.trim()) { setError('Please enter the Breed.'); return }

    setError(''); setSaving(true)
    try {
      const dob = new Date(form.date_of_birth)
      const today = new Date()
      let years = today.getFullYear() - dob.getFullYear()
      let months = today.getMonth() - dob.getMonth()
      if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
        years--
        months += 12
      }
      const age = years > 0 ? `${years}y ${months}m` : `${months}m`

      await onSave({
        tag: form.tag.trim(),
        date_of_birth: form.date_of_birth,
        breed: form.breed.trim(),
        sex: form.sex,
        stock_type: editingCalf?.stock_type || 'Calve',
        source: editingCalf?.source || 'Born',
        age,
        sire: form.sire.trim() || null,
        dam: form.dam.trim() || null,
        birth_weight: form.birth_weight.trim() || null,
        weight_30day: form.weight_30day ? Number(form.weight_30day) : null,
        weight_100day: form.weight_100day ? Number(form.weight_100day) : null,
        date_of_weaning: form.date_of_weaning || null,
        weaning_weight: form.weaning_weight ? Number(form.weaning_weight) : null,
        weight_1week_post_weaning: form.weight_1week_post_weaning ? Number(form.weight_1week_post_weaning) : null,
        weight_6months_post_weaning: form.weight_6months_post_weaning ? Number(form.weight_6months_post_weaning) : null,
        calf_status: form.calf_status,
        pre_weaning_mortality: form.pre_weaning_mortality === 'Yes',
        description: form.description.trim() || null,
        bcs: editingCalf?.bcs ?? 3.0,
      })
    } catch (e: any) {
      setError(e.message || 'Failed to save calf')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>{editingCalf ? `Edit Calf ${editingCalf.tag}` : 'Add New Calf'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Tag *</label>
              <input value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}
                placeholder="e.g., CLF25001"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Date of Birth *</label>
              <input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Breed *</label>
              <input value={form.breed} onChange={e => setForm(p => ({ ...p, breed: e.target.value }))}
                placeholder="e.g., Mashona, Brahman"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Sex *</label>
              <div className="flex gap-2">
                {['Male', 'Female'].map(v => (
                  <button key={v} type="button" onClick={() => setForm(p => ({ ...p, sex: v }))}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border"
                    style={{
                      backgroundColor: form.sex === v ? C.primary600 : C.neutral100,
                      borderColor: form.sex === v ? C.primary600 : C.neutral200,
                      color: form.sex === v ? C.white : C.neutral700
                    }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Sire</label>
              <input value={form.sire} onChange={e => setForm(p => ({ ...p, sire: e.target.value }))}
                placeholder="Sire Tag / ID"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Dam</label>
              <input value={form.dam} onChange={e => setForm(p => ({ ...p, dam: e.target.value }))}
                placeholder="Dam Tag / ID"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Birth Wt (kg)</label>
              <input type="number" step="any" value={form.birth_weight} onChange={e => setForm(p => ({ ...p, birth_weight: e.target.value }))}
                placeholder="e.g., 35"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>30d Wt (kg)</label>
              <input type="number" step="any" value={form.weight_30day} onChange={e => setForm(p => ({ ...p, weight_30day: e.target.value }))}
                placeholder="e.g., 55"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>100d Wt (kg)</label>
              <input type="number" step="any" value={form.weight_100day} onChange={e => setForm(p => ({ ...p, weight_100day: e.target.value }))}
                placeholder="e.g., 110"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Wean Date</label>
              <input type="date" value={form.date_of_weaning} onChange={e => setForm(p => ({ ...p, date_of_weaning: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Wean Wt (kg)</label>
              <input type="number" step="any" value={form.weaning_weight} onChange={e => setForm(p => ({ ...p, weaning_weight: e.target.value }))}
                placeholder="e.g., 180"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>1w Post-Wean (kg)</label>
              <input type="number" step="any" value={form.weight_1week_post_weaning} onChange={e => setForm(p => ({ ...p, weight_1week_post_weaning: e.target.value }))}
                placeholder="e.g., 185"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>6m Post-Wean (kg)</label>
              <input type="number" step="any" value={form.weight_6months_post_weaning} onChange={e => setForm(p => ({ ...p, weight_6months_post_weaning: e.target.value }))}
                placeholder="e.g., 250"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Status</label>
              <div className="relative">
                <select value={form.calf_status} onChange={e => setForm(p => ({ ...p, calf_status: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  {['Active', 'Replacement', 'Sold'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Pre-Wean Mort.</label>
              <div className="flex gap-2">
                {['Yes', 'No'].map(v => (
                  <button key={v} type="button" onClick={() => setForm(p => ({ ...p, pre_weaning_mortality: v }))}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border"
                    style={{
                      backgroundColor: form.pre_weaning_mortality === v ? C.primary600 : C.neutral100,
                      borderColor: form.pre_weaning_mortality === v ? C.primary600 : C.neutral200,
                      color: form.pre_weaning_mortality === v ? C.white : C.neutral700
                    }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Enter markings or additional notes"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : (editingCalf ? 'Save Changes' : 'Add Calf')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Health Modal ────────────────────────────────────────────────────────
function AddHealthModal({ animals, editingHealth, onClose, onSave }: { animals: any[]; editingHealth?: any; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({
    applyToAll: editingHealth?.animal_tag?.toLowerCase() === 'all',
    animalTag: editingHealth?.animal_tag || '',
    date: editingHealth?.date || new Date().toISOString().split('T')[0],
    treatment: editingHealth?.treatment || '',
    doneBy: editingHealth?.done_by || '',
    specialNotes: editingHealth?.special_notes || '',
    status: editingHealth?.status || 'Completed'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.applyToAll && !form.animalTag) { setError('Please select an animal.'); return }
    if (!form.treatment.trim()) { setError('Please enter the treatment.'); return }
    if (!form.date) { setError('Please select the date.'); return }

    setError(''); setSaving(true)
    try {
      await onSave(form)
    } catch (e: any) {
      setError(e.message || 'Failed to save health record')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>{editingHealth ? 'Edit Health Record' : 'Add Health Record'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          {!editingHealth && (
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: C.neutral500 }}>Apply To</label>
              <div className="flex gap-3">
                {[
                  { label: 'Single Animal', value: false },
                  { label: 'All Herd', value: true }
                ].map(opt => (
                  <button key={opt.label} type="button" onClick={() => setForm(p => ({ ...p, applyToAll: opt.value }))}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border"
                    style={{
                      backgroundColor: form.applyToAll === opt.value ? C.primary600 : C.neutral100,
                      borderColor: form.applyToAll === opt.value ? C.primary600 : C.neutral200,
                      color: form.applyToAll === opt.value ? C.white : C.neutral700
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.applyToAll ? (
            <div className="p-3 rounded-xl border text-sm" style={{ backgroundColor: C.primary50, borderColor: C.primary100, color: C.primary600 }}>
              📢 This health log will be applied to all <strong>{animals.length} animals</strong> in the herd.
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Select Animal</label>
              <div className="relative">
                <select value={form.animalTag} onChange={e => setForm(p => ({ ...p, animalTag: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="">Select an animal…</option>
                  {animals.map(a => <option key={a.id} value={a.tag}>{a.tag} ({a.breed} {a.stock_type})</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Treatment</label>
            <input value={form.treatment} onChange={e => setForm(p => ({ ...p, treatment: e.target.value }))}
              placeholder="e.g., Deworming, Vaccination"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Done By (person who did the task)</label>
            <input value={form.doneBy} onChange={e => setForm(p => ({ ...p, doneBy: e.target.value }))}
              placeholder="e.g., John Doe"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Special Notes</label>
            <textarea value={form.specialNotes} onChange={e => setForm(p => ({ ...p, specialNotes: e.target.value }))}
              placeholder="Enter special notes here…"
              rows={3}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Status</label>
            <div className="relative">
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                {['Completed', 'Scheduled', 'Pending'].map(s => <option key={s} value={s}>{s}</option>)}
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
            {saving ? 'Saving…' : (editingHealth ? 'Save Changes' : 'Add Record')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Breeding Modal ──────────────────────────────────────────────────────
function AddBreedingModal({ animals, editingBreeding, onClose, onSave }: { animals: any[]; editingBreeding?: any; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({
    earTagNumber: editingBreeding?.ear_tag_number || '',
    stockType: editingBreeding?.stock_type || 'Cow',
    bodyConditionScore: editingBreeding?.body_condition_score !== undefined && editingBreeding?.body_condition_score !== null ? String(editingBreeding.body_condition_score) : '3.0',
    heatDetectionDate: editingBreeding?.heat_detection_date || new Date().toISOString().split('T')[0],
    observer: editingBreeding?.observer || '',
    servicedDate: editingBreeding?.serviced_date || '',
    breedingStatus: editingBreeding?.breeding_status || 'Bred',
    breedingMethod: editingBreeding?.breeding_method || 'Natural',
    aiTechnician: editingBreeding?.ai_technician || '',
    sireId: editingBreeding?.sire_id || '',
    strawId: editingBreeding?.straw_id || '',
    semenViability: editingBreeding?.semen_viability !== undefined && editingBreeding?.semen_viability !== null ? String(editingBreeding.semen_viability) : '',
    returnToHeatDate1: editingBreeding?.return_to_heat_date_1 || '',
    dateServed2: editingBreeding?.date_served_2 || '',
    breedingMethod2: editingBreeding?.breeding_method_2 || 'Natural',
    sireUsed2: editingBreeding?.sire_used_2 || '',
    returnToHeatDate2: editingBreeding?.return_to_heat_date_2 || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.earTagNumber) { setError('Please select an animal.'); return }
    if (!form.heatDetectionDate) { setError('Please select the heat detection date.'); return }

    setError(''); setSaving(true)
    try {
      await onSave(form)
    } catch (e: any) {
      setError(e.message || 'Failed to save breeding log')
    } finally {
      setSaving(false)
    }
  }

  const femaleAnimals = animals.filter(a => a.sex === 'Female')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>{editingBreeding ? 'Edit Breeding Record' : 'Add Breeding Record'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Select Cow/Heifer</label>
              <div className="relative">
                <select value={form.earTagNumber} onChange={e => {
                  const tag = e.target.value
                  const selected = femaleAnimals.find(a => a.tag === tag)
                  setForm(p => ({ ...p, earTagNumber: tag, stockType: selected?.stock_type || 'Cow' }))
                }}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="">Select animal…</option>
                  {femaleAnimals.map(a => <option key={a.id} value={a.tag}>{a.tag} ({a.breed} {a.stock_type})</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Stock Type</label>
              <div className="relative">
                <select value={form.stockType} onChange={e => setForm(p => ({ ...p, stockType: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  {['Cow', 'Heifer', 'Bullying Heifer'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Heat Detection Date</label>
              <input type="date" value={form.heatDetectionDate} onChange={e => setForm(p => ({ ...p, heatDetectionDate: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Body Condition Score (BCS)</label>
              <input type="number" step="0.1" value={form.bodyConditionScore} onChange={e => setForm(p => ({ ...p, bodyConditionScore: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Observer</label>
              <input value={form.observer} onChange={e => setForm(p => ({ ...p, observer: e.target.value }))}
                placeholder="e.g., John Doe"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Serviced Date</label>
              <input type="date" value={form.servicedDate} onChange={e => setForm(p => ({ ...p, servicedDate: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Breeding Method</label>
              <div className="relative">
                <select value={form.breedingMethod} onChange={e => setForm(p => ({ ...p, breedingMethod: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="Natural">Natural</option>
                  <option value="AI">AI</option>
                  <option value="Embryo Transfer">Embryo Transfer</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Breeding Status</label>
              <div className="relative">
                <select value={form.breedingStatus} onChange={e => setForm(p => ({ ...p, breedingStatus: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  {['Bred', 'Open', 'Confirmed Pregnant', 'Failed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          </div>

          {form.breedingMethod === 'AI' && (
            <div className="p-4 rounded-xl space-y-4 border" style={{ borderColor: C.neutral200, backgroundColor: C.neutral50 }}>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">AI Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>AI Technician</label>
                  <input value={form.aiTechnician} onChange={e => setForm(p => ({ ...p, aiTechnician: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2 bg-white text-sm outline-none border transition-colors focus:border-[#7AC142]"
                    style={{ borderColor: C.neutral200, color: C.neutral900 }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Straw ID</label>
                  <input value={form.strawId} onChange={e => setForm(p => ({ ...p, strawId: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2 bg-white text-sm outline-none border transition-colors focus:border-[#7AC142]"
                    style={{ borderColor: C.neutral200, color: C.neutral900 }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Semen Viability (%)</label>
                  <input type="number" value={form.semenViability} onChange={e => setForm(p => ({ ...p, semenViability: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2 bg-white text-sm outline-none border transition-colors focus:border-[#7AC142]"
                    style={{ borderColor: C.neutral200, color: C.neutral900 }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Sire ID</label>
                  <input value={form.sireId} onChange={e => setForm(p => ({ ...p, sireId: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2 bg-white text-sm outline-none border transition-colors focus:border-[#7AC142]"
                    style={{ borderColor: C.neutral200, color: C.neutral900 }} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Return to Heat Date (1)</label>
              <input type="date" value={form.returnToHeatDate1} onChange={e => setForm(p => ({ ...p, returnToHeatDate1: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="border-t pt-4 mt-4 space-y-4" style={{ borderColor: C.neutral100 }}>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Secondary Service Details (Optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Date Served (2nd)</label>
                <input type="date" value={form.dateServed2} onChange={e => setForm(p => ({ ...p, dateServed2: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Breeding Method (2nd)</label>
                <div className="relative">
                  <select value={form.breedingMethod2} onChange={e => setForm(p => ({ ...p, breedingMethod2: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                    style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                    <option value="Natural">Natural</option>
                    <option value="AI">AI</option>
                    <option value="Embryo Transfer">Embryo Transfer</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Sire Used (2nd)</label>
                <input value={form.sireUsed2} onChange={e => setForm(p => ({ ...p, sireUsed2: e.target.value }))}
                  placeholder="Sire ID for 2nd service"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Return to Heat Date (2nd)</label>
                <input type="date" value={form.returnToHeatDate2} onChange={e => setForm(p => ({ ...p, returnToHeatDate2: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
              </div>
            </div>
          </div>

        </div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : (editingBreeding ? 'Save Changes' : 'Save Record')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Pregnancy Modal ────────────────────────────────────────────────────
function AddPregnancyModal({ animals, editingPregnancy, onClose, onSave }: { animals: any[]; editingPregnancy?: any; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({
    cowEarTag: editingPregnancy?.cow_ear_tag || '',
    bodyConditionScore: editingPregnancy?.body_condition_score !== undefined && editingPregnancy?.body_condition_score !== null ? String(editingPregnancy.body_condition_score) : '3.0',
    lastServiceDate: editingPregnancy?.last_service_date || new Date().toISOString().split('T')[0],
    firstTrimesterPD: editingPregnancy?.first_trimester_pd || 'Not Tested',
    secondTrimesterPD: editingPregnancy?.second_trimester_pd || 'Not Tested',
    thirdTrimesterPD: editingPregnancy?.third_trimester_pd || 'Not Tested',
    gestationPeriod: editingPregnancy?.gestation_period ? String(editingPregnancy.gestation_period) : '',
    expectedCalvingDate: editingPregnancy?.expected_calving_date || '',
    actualCalvingDate: editingPregnancy?.actual_calving_date || '',
    calfId: editingPregnancy?.calf_id || '',
    calfSex: editingPregnancy?.calf_sex || '',
    deliveryType: editingPregnancy?.delivery_type || '',
    averageBCS: editingPregnancy?.average_bcs !== undefined && editingPregnancy?.average_bcs !== null ? String(editingPregnancy.average_bcs) : '3.0',
    expectedReturnToHeatDate: editingPregnancy?.expected_return_to_heat_date || '',
    actualFirstHeatDate: editingPregnancy?.actual_first_heat_date || '',
    expectedSecondHeatDate: editingPregnancy?.expected_second_heat_date || '',
    actualSecondHeatDate: editingPregnancy?.actual_second_heat_date || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (form.lastServiceDate && form.gestationPeriod) {
      const serviceDate = new Date(form.lastServiceDate)
      const gestationNum = Number(form.gestationPeriod)
      if (!isNaN(serviceDate.getTime()) && gestationNum > 0) {
        const expected = new Date(serviceDate.getTime() + gestationNum * 24 * 60 * 60 * 1000)
        setForm(p => ({ ...p, expectedCalvingDate: expected.toISOString().split('T')[0] }))
      }
    }
  }, [form.lastServiceDate, form.gestationPeriod])

  const handleSave = async () => {
    if (!form.cowEarTag) { setError('Please select a cow.'); return }
    if (!form.lastServiceDate) { setError('Please select the last service date.'); return }

    setError(''); setSaving(true)
    try {
      await onSave(form)
    } catch (e: any) {
      setError(e.message || 'Failed to save pregnancy record')
    } finally {
      setSaving(false)
    }
  }

  const femaleAnimals = animals.filter(a => a.sex === 'Female')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>{editingPregnancy ? 'Edit Pregnancy Record' : 'Add Pregnancy Record'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Select Cow</label>
              <div className="relative">
                <select value={form.cowEarTag} onChange={e => setForm(p => ({ ...p, cowEarTag: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="">Select animal…</option>
                  {femaleAnimals.map(a => <option key={a.id} value={a.tag}>{a.tag} ({a.breed} {a.stock_type})</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>BCS</label>
              <input type="number" step="0.1" value={form.bodyConditionScore} onChange={e => setForm(p => ({ ...p, bodyConditionScore: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Last Service Date</label>
              <input type="date" value={form.lastServiceDate} onChange={e => setForm(p => ({ ...p, lastServiceDate: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Gestation Period (days)</label>
              <input type="number" value={form.gestationPeriod} onChange={e => setForm(p => ({ ...p, gestationPeriod: e.target.value }))}
                placeholder="e.g., 283"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>1st Tri PD</label>
              <div className="relative">
                <select value={form.firstTrimesterPD} onChange={e => setForm(p => ({ ...p, firstTrimesterPD: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2 text-xs outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  {['Not Tested', 'Positive', 'Negative', 'Inconclusive'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>2nd Tri PD</label>
              <div className="relative">
                <select value={form.secondTrimesterPD} onChange={e => setForm(p => ({ ...p, secondTrimesterPD: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2 text-xs outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  {['Not Tested', 'Positive', 'Negative', 'Inconclusive'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>3rd Tri PD</label>
              <div className="relative">
                <select value={form.thirdTrimesterPD} onChange={e => setForm(p => ({ ...p, thirdTrimesterPD: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2 text-xs outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  {['Not Tested', 'Positive', 'Negative', 'Inconclusive'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Expected Calving</label>
              <input type="date" value={form.expectedCalvingDate} onChange={e => setForm(p => ({ ...p, expectedCalvingDate: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Actual Calving</label>
              <input type="date" value={form.actualCalvingDate} onChange={e => setForm(p => ({ ...p, actualCalvingDate: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Calf ID</label>
              <input value={form.calfId} onChange={e => setForm(p => ({ ...p, calfId: e.target.value }))}
                placeholder="Calf Tag"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Calf Sex</label>
              <div className="relative">
                <select value={form.calfSex} onChange={e => setForm(p => ({ ...p, calfSex: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Delivery Type</label>
              <div className="relative">
                <select value={form.deliveryType} onChange={e => setForm(p => ({ ...p, deliveryType: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="">Select...</option>
                  <option value="Natural">Natural</option>
                  <option value="Assisted">Assisted</option>
                  <option value="C-Section">C-Section</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Expected Return to Heat</label>
              <input type="date" value={form.expectedReturnToHeatDate} onChange={e => setForm(p => ({ ...p, expectedReturnToHeatDate: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Average BCS</label>
              <input type="number" step="0.1" value={form.averageBCS} onChange={e => setForm(p => ({ ...p, averageBCS: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Bull Modal ──────────────────────────────────────────────────────────
function AddBullModal({ animals, editingBull, onClose, onSave }: { animals: any[]; editingBull?: any; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({
    bullId: editingBull?.bull_id || '',
    date: editingBull?.date || new Date().toISOString().split('T')[0],
    age: editingBull?.age || '',
    pe: editingBull?.pe || 'Good',
    spermMotility: editingBull?.sperm_motility || '',
    spermMorphology: editingBull?.sperm_morphology || '',
    scrotal: editingBull?.scrotal || '',
    libido: editingBull?.libido || 'Good',
    score: editingBull?.score || '',
    classification: editingBull?.classification || 'SPB'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.bullId) { setError('Please select a bull.'); return }
    if (!form.date) { setError('Please select the evaluation date.'); return }

    setError(''); setSaving(true)
    try {
      await onSave(form)
    } catch (e: any) {
      setError(e.message || 'Failed to save bull evaluation')
    } finally {
      setSaving(false)
    }
  }

  const bullAnimals = animals.filter(a => a.stock_type === 'Bull' || a.sex === 'Male')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>{editingBull ? 'Edit Bull Evaluation' : 'Add Bull Evaluation'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral50 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Select Bull</label>
            <div className="relative">
              <select value={form.bullId} onChange={e => setForm(p => ({ ...p, bullId: e.target.value }))} disabled={!!editingBull}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer disabled:opacity-60"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                <option value="">Select bull…</option>
                {bullAnimals.map(a => <option key={a.id} value={a.tag}>{a.tag} ({a.breed})</option>)}
              </select>
              {!editingBull && <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Age</label>
              <input value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                placeholder="e.g., 2.5 years"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Physical Exam (PE)</label>
              <div className="relative">
                <select value={form.pe} onChange={e => setForm(p => ({ ...p, pe: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  {['Excellent', 'Good', 'Poor'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Libido</label>
              <div className="relative">
                <select value={form.libido} onChange={e => setForm(p => ({ ...p, libido: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  {['Excellent', 'Good', 'Poor'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Sperm Motility</label>
              <input value={form.spermMotility} onChange={e => setForm(p => ({ ...p, spermMotility: e.target.value }))}
                placeholder="e.g., 80%"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Sperm Morphology</label>
              <input value={form.spermMorphology} onChange={e => setForm(p => ({ ...p, spermMorphology: e.target.value }))}
                placeholder="e.g., 85%"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Scrotal (cm)</label>
              <input value={form.scrotal} onChange={e => setForm(p => ({ ...p, scrotal: e.target.value }))}
                placeholder="e.g., 36 cm"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Score</label>
              <input value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))}
                placeholder="e.g., 95"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Classification</label>
              <div className="relative">
                <select value={form.classification} onChange={e => setForm(p => ({ ...p, classification: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2 text-xs outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="SPB">SPB (Satisfactory)</option>
                  <option value="USPB">USPB (Unsatisfactory)</option>
                  <option value="CD">CD (Deferred)</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : (editingBull ? 'Save Changes' : 'Add Record')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Weight Modal ────────────────────────────────────────────────────────
function AddWeightModal({ animals, onClose, onSave, editingWeight }: { animals: any[]; onClose: () => void; onSave: (d: any) => Promise<void>; editingWeight?: any }) {
  const [form, setForm] = useState({
    animalTag: '',
    year: new Date().getFullYear().toString(),
    jan: '', feb: '', mar: '', apr: '', may: '', jun: '',
    jul: '', aug: '', sep: '', oct: '', nov: '', dec: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.animalTag) { setError('Please select an animal.'); return }
    if (!form.year) { setError('Please enter the year.'); return }

    setError(''); setSaving(true)
    try {
      await onSave(form)
    } catch (e: any) {
      setError(e.message || 'Failed to save weights')
    } finally {
      setSaving(false)
    }
  }

  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>Add/Update Animal Weight Log</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Select Animal</label>
              <div className="relative">
                <select value={form.animalTag} onChange={e => setForm(p => ({ ...p, animalTag: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="">Select animal…</option>
                  {animals.map(a => <option key={a.id} value={a.tag}>{a.tag} ({a.breed} {a.stock_type})</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Year</label>
              <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Monthly Weights (kg)</p>
            <div className="grid grid-cols-4 gap-3">
              {months.map(m => (
                <div key={m}>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>{m}</label>
                  <input type="number" value={(form as any)[m]} onChange={e => setForm(p => ({ ...p, [m]: e.target.value }))}
                    placeholder="—"
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                    style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Feed Modal ──────────────────────────────────────────────────────────
function AddFeedModal({ onClose, onSave, editingFeed }: { onClose: () => void; onSave: (d: any) => Promise<void>; editingFeed?: any }) {
  const [form, setForm] = useState({
    name: '',
    type: '',
    quantity: '',
    unit: 'kg',
    supplier: '',
    status: 'In Stock'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Please enter feed name.'); return }
    if (!form.type.trim()) { setError('Please enter feed type.'); return }
    if (!form.quantity.trim()) { setError('Please enter quantity.'); return }

    setError(''); setSaving(true)
    try {
      await onSave(form)
    } catch (e: any) {
      setError(e.message || 'Failed to save feed inventory')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>Add Feed Inventory</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Feed Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Grower Mash"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Feed Type *</label>
            <input value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              placeholder="e.g., Concentrates, Roughage"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Quantity *</label>
              <input value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                placeholder="e.g., 500"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Unit</label>
              <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                placeholder="e.g., kg, bags"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Supplier</label>
            <input value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}
              placeholder="e.g., Agrifoods"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Status</label>
            <div className="relative">
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                {['In Stock', 'Low Stock', 'Out of Stock'].map(s => <option key={s} value={s}>{s}</option>)}
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
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Transaction Modal ───────────────────────────────────────────────────
function AddTransactionModal({ animals, onClose, onSave }: { animals: any[]; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Sale',
    animalTag: '',
    description: '',
    amount: '',
    category: 'Livestock'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.date) { setError('Please select a date.'); return }
    if (!form.amount || isNaN(parseFloat(form.amount))) { setError('Please enter a valid amount.'); return }
    if (!form.description.trim()) { setError('Please enter a description.'); return }

    setError(''); setSaving(true)
    try {
      await onSave(form)
    } catch (e: any) {
      setError(e.message || 'Failed to save transaction')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>Add Transaction</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Category</label>
              <div className="relative">
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  {['Livestock', 'Feed', 'Veterinary', 'Equipment', 'Labor', 'Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: C.neutral500 }}>Transaction Type</label>
            <div className="flex gap-3">
              {['Sale', 'Purchase'].map(v => (
                <button key={v} type="button" onClick={() => setForm(p => ({ ...p, type: v, animalTag: v === 'Purchase' ? '' : p.animalTag }))}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border"
                  style={{
                    backgroundColor: form.type === v ? (v === 'Sale' ? C.success500 : C.error500) : C.neutral100,
                    borderColor: form.type === v ? (v === 'Sale' ? C.success500 : C.error500) : C.neutral200,
                    color: form.type === v ? C.white : C.neutral700
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'Sale' && (
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Select Animal to Sell (Optional)</label>
              <div className="relative">
                <select value={form.animalTag} onChange={e => {
                  const tag = e.target.value
                  const animal = animals.find(a => a.tag === tag)
                  setForm(p => ({
                    ...p,
                    animalTag: tag,
                    description: tag ? `Sale of animal ${tag} (${animal?.breed} ${animal?.stock_type})` : p.description
                  }))
                }}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="">None (General Sale)</option>
                  {animals.map(a => (
                    <option key={a.id} value={a.tag}>{a.tag} ({a.breed} {a.stock_type})</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Amount (R) *</label>
            <input type="number" step="any" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="e.g., 8500"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Description *</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Enter details of transaction"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: form.type === 'Sale' ? C.success500 : C.error500, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Register() {
  const { session, targetUserId, profile, selectedProductionYear } = useAuth()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab
  const [activeTab, setActiveTab]   = useState<Tab>(tabParam || 'herd')
  const [search, setSearch]         = useState('')
  const [herdFilter, setHerdFilter] = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)

  // Data state
  const [animals, setAnimals]           = useState<any[]>([])
  const [drugs, setDrugs]               = useState<any[]>([])
  const [healthRecords, setHealthRecords] = useState<any[]>([])
  const [breedingRecords, setBreeding]  = useState<any[]>([])
  const [mortalityRecords, setMortality]= useState<any[]>([])
  const [weightRecords, setWeights]     = useState<any[]>([])
  const [feedInventory, setFeedInventory] = useState<any[]>([])
  const [pregnancyRecords, setPregnancyRecords] = useState<any[]>([])
  const [bullRecords, setBullRecords]           = useState<any[]>([])
  const [transactions, setTransactions]         = useState<any[]>([])

  const [selectedAnimalProfile, setSelectedAnimalProfile] = useState<any | null>(null)

  const openAnimalProfileByTag = (tag: string | null | undefined) => {
    if (!tag || tag.toLowerCase() === 'all') return
    const found = animals.find(a => a.tag === tag)
    if (found) {
      setSelectedAnimalProfile(found)
    } else {
      setSelectedAnimalProfile({
        tag,
        user_id: targetUserId,
        breed: 'Unknown',
        sex: 'Unknown',
        stock_type: 'Unknown'
      })
    }
  }

  const tagBadge = (tag: string) => {
    if (!tag) return '—'
    const isAll = tag.toLowerCase() === 'all'
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          openAnimalProfileByTag(tag)
        }}
        className="outline-none text-left hover:opacity-80 transition-opacity"
      >
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm transition-all hover:scale-105"
          style={{
            backgroundColor: isAll ? '#E6F9F1' : '#F8F9FA',
            borderColor: isAll ? '#9FE4C1' : '#DEE2E6',
            color: isAll ? '#27714B' : '#343A40',
            fontFamily: 'monospace',
          }}>
          {isAll ? '👥 All Herd' : `🏷️ ${tag}`}
        </span>
      </button>
    )
  }

  useEffect(() => {
    if (tabParam && TABS.some(t => t.key === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Modal state
  const [showAddDrug, setShowAddDrug]           = useState(false)
  const [showAddMortality, setShowAddMortality] = useState(false)
  const [showAddAnimal, setShowAddAnimal]       = useState(false)
  const [showAddCalf, setShowAddCalf]           = useState(false)
  const [showAddHealth, setShowAddHealth]       = useState(false)
  const [showAddBreeding, setShowAddBreeding]   = useState(false)
  const [showAddPregnancy, setShowAddPregnancy] = useState(false)
  const [showAddBull, setShowAddBull]           = useState(false)
  const [showAddWeight, setShowAddWeight]       = useState(false)
  const [showAddFeed, setShowAddFeed]           = useState(false)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [editingAnimal, setEditingAnimal]       = useState<any | null>(null)
  const [editingCalf, setEditingCalf]           = useState<any | null>(null)
  const [editingDrug, setEditingDrug]           = useState<any | null>(null)
  const [editingHealth, setEditingHealth]       = useState<any | null>(null)
  const [editingBreeding, setEditingBreeding]   = useState<any | null>(null)
  const [editingBull, setEditingBull]           = useState<any | null>(null)
  const [editingPregnancy, setEditingPregnancy] = useState<any | null>(null)
  const [editingMortality, setEditingMortality] = useState<any | null>(null)
  const [editingWeight, setEditingWeight]       = useState<any | null>(null)
  const [editingFeed, setEditingFeed]           = useState<any | null>(null)

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    Promise.all([
      supabase.from('animals').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear).order('tag'),
      supabase.from('drugs').select('*').eq('user_id', targetUserId).order('name'),
      supabase.from('health_records').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear).order('date', { ascending: false }),
      supabase.from('breeding_records').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear).order('heat_detection_date', { ascending: false }),
      supabase.from('mortality_records').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear).order('date', { ascending: false }),
      supabase.from('animal_weights').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear).order('animal_tag'),
      supabase.from('feed_inventory').select('*').eq('user_id', targetUserId).order('name'),
      supabase.from('pregnancy_records').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear).order('last_service_date', { ascending: false }),
      supabase.from('bull_breeding_records').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear).order('date', { ascending: false }),
      supabase.from('transaction_records').select('*').eq('user_id', targetUserId).eq('production_year', selectedProductionYear).order('date', { ascending: false }),
    ]).then(([a, d, h, b, m, w, f, p, bull, txs]) => {
      const deadTags = new Set((m.data || []).map((row: any) => row.animal_tag).filter(Boolean))
      const aliveAnimals = (a.data || []).filter((row: any) => !deadTags.has(row.tag))

      setAnimals(aliveAnimals)
      setDrugs(d.data ?? [])
      setHealthRecords(h.data ?? [])
      setBreeding(b.data ?? [])
      setMortality(m.data ?? [])
      setWeights(w.data ?? [])
      setFeedInventory(f.data ?? [])
      setPregnancyRecords(p.data ?? [])
      setBullRecords(bull.data ?? [])
      setTransactions(txs.data ?? [])
      setLoading(false)
    })
  }, [targetUserId, selectedProductionYear])

  // Filtered search
  const q = search.toLowerCase()
  const filteredAnimals  = animals.filter(a => {
    const searchMatch = !q || a.tag?.toLowerCase().includes(q) || a.breed?.toLowerCase().includes(q) || a.stock_type?.toLowerCase().includes(q)
    const filterMatch = !herdFilter || a.stock_type === herdFilter || (herdFilter === 'Calves' && a.stock_type === 'Calve')
    return searchMatch && filterMatch
  })
  const filteredHerd     = filteredAnimals.filter(a => !isCalf(a.age, a.stock_type))
  const filteredCalves   = filteredAnimals.filter(a => isCalf(a.age, a.stock_type))
  const filteredDrugs    = drugs.filter(d   => !q || d.name?.toLowerCase().includes(q) || d.drug_class?.toLowerCase().includes(q))
  const filteredHealth   = healthRecords.filter(r => !q || r.animal_tag?.toLowerCase().includes(q) || r.treatment?.toLowerCase().includes(q))
  const filteredBreeding = breedingRecords.filter(r => !q || r.ear_tag_number?.toLowerCase().includes(q))
  const filteredPregnancy = pregnancyRecords.filter(r => !q || r.cow_ear_tag?.toLowerCase().includes(q))
  const filteredBulls    = bullRecords.filter(r => !q || r.bull_id?.toLowerCase().includes(q))
  const filteredMortality= mortalityRecords.filter(r => !q || r.animal_tag?.toLowerCase().includes(q) || r.cause?.toLowerCase().includes(q))
  const filteredWeights  = weightRecords.filter(r => !q || r.animal_tag?.toLowerCase().includes(q))
  const filteredFeed     = feedInventory.filter(f => !q || f.name?.toLowerCase().includes(q) || f.type?.toLowerCase().includes(q) || f.supplier?.toLowerCase().includes(q))
  const filteredTransactions = transactions.filter(r => !q || r.description?.toLowerCase().includes(q) || r.type?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q))

  // Herd stats
  const herdTotals = useMemo(() => {
    const calfList = animals.filter(a => isCalf(a.age, a.stock_type))
    const nonCalfList = animals.filter(a => !isCalf(a.age, a.stock_type))
    return {
      cows:         nonCalfList.filter(a => a.stock_type === 'Cow').length,
      bulls:        nonCalfList.filter(a => a.stock_type === 'Bull').length,
      heifers:      nonCalfList.filter(a => a.stock_type === 'Heifer' || a.stock_type === 'Bullying Heifer').length,
      steers:       nonCalfList.filter(a => a.stock_type === 'Steer').length,
      calves:       calfList.length,
    }
  }, [animals])

  const addDrug = async (d: any) => {
    if (!session || !targetUserId) return
    const dbPayload = {
      user_id: targetUserId,
      name: d.name,
      drug_class: d.drugClass,
      type: d.type,
      withdrawal_period: d.withdrawalPeriod,
      pregnancy_safe: d.pregnancySafe,
      stock_status: d.stockStatus
    }
    const { data, error } = await supabase.from('drugs').insert(dbPayload).select().single()
    if (error) throw error
    setDrugs(prev => [...prev, data])
    setShowAddDrug(false)
  }

  const saveEditedDrug = async (d: any) => {
    if (!session || !targetUserId || !editingDrug) return
    const dbPayload = {
      name: d.name,
      drug_class: d.drugClass,
      type: d.type,
      withdrawal_period: d.withdrawalPeriod,
      pregnancy_safe: d.pregnancySafe,
      stock_status: d.stockStatus
    }
    const { data, error } = await supabase.from('drugs').update(dbPayload).eq('id', editingDrug.id).select().single()
    if (error) throw error
    setDrugs(prev => prev.map(item => item.id === editingDrug.id ? data : item))
    setEditingDrug(null)
  }

  const addMortality = async (d: any) => {
    if (!session || !targetUserId) return
    const dbPayload = {
      user_id: targetUserId,
      animal_tag: d.animalId,
      date: d.date,
      cause: d.cause,
      description: d.description || null,
      observer: d.observer || null,
      is_pre_weaning: false,
      production_year: selectedProductionYear
    }
    const { data, error } = await supabase.from('mortality_records').insert(dbPayload).select().single()
    if (error) throw error

    // Remove the animal from the active register database table
    const { error: delErr } = await supabase
      .from('animals')
      .delete()
      .eq('tag', d.animalId)
      .eq('user_id', targetUserId)
      .eq('production_year', selectedProductionYear)
    if (delErr) console.warn("Error deleting dead animal:", delErr)

    setAnimals(prev => prev.filter(a => a.tag !== d.animalId))
    setMortality(prev => [data, ...prev])
    setShowAddMortality(false)
  }

  const addAnimal = async (d: any) => {
    if (!session || !targetUserId) return
    const { data, error } = await supabase.from('animals').insert({ ...d, user_id: targetUserId, production_year: selectedProductionYear }).select().single()
    if (error) throw error
    setAnimals(prev => [...prev, data])
    setShowAddAnimal(false)
  }

  const addCalf = async (d: any) => {
    if (!session || !targetUserId) return
    const { data, error } = await supabase.from('animals').insert({ ...d, user_id: targetUserId, production_year: selectedProductionYear }).select().single()
    if (error) throw error
    setAnimals(prev => [...prev, data])
    setShowAddCalf(false)
  }

  const saveEditedAnimal = async (d: any) => {
    if (!session || !targetUserId || !editingAnimal) return
    const { data, error } = await supabase.from('animals').update(d).eq('id', editingAnimal.id).select().single()
    if (error) throw error
    setAnimals(prev => prev.map(a => a.id === editingAnimal.id ? data : a))
    setEditingAnimal(null)
  }

  const saveEditedCalf = async (d: any) => {
    if (!session || !targetUserId || !editingCalf) return
    const { data, error } = await supabase.from('animals').update(d).eq('id', editingCalf.id).select().single()
    if (error) throw error
    setAnimals(prev => prev.map(a => a.id === editingCalf.id ? data : a))
    setEditingCalf(null)
  }

  const addHealthRecord = async (d: any) => {
    if (!session || !targetUserId) return
    const dbPayload = {
      user_id: targetUserId,
      animal_tag: d.applyToAll ? 'All' : d.animalTag,
      date: d.date,
      treatment: d.treatment,
      status: d.status,
      done_by: d.doneBy || null,
      special_notes: d.specialNotes || null,
      production_year: selectedProductionYear
    }
    const { data, error } = await supabase.from('health_records').insert(dbPayload).select().single()
    if (error) throw error
    setHealthRecords(prev => [data, ...prev])
    setShowAddHealth(false)
  }

  const saveEditedHealth = async (d: any) => {
    if (!session || !targetUserId || !editingHealth) return
    const dbPayload = {
      animal_tag: d.applyToAll ? 'All' : d.animalTag,
      date: d.date,
      treatment: d.treatment,
      status: d.status,
      done_by: d.doneBy || null,
      special_notes: d.specialNotes || null
    }
    const { data, error } = await supabase.from('health_records').update(dbPayload).eq('id', editingHealth.id).select().single()
    if (error) throw error
    setHealthRecords(prev => prev.map(item => item.id === editingHealth.id ? data : item))
    setEditingHealth(null)
  }

  const addBreedingRecord = async (d: any) => {
    if (!session || !targetUserId) return
    const dbPayload = {
      user_id: targetUserId,
      ear_tag_number: d.earTagNumber,
      stock_type: d.stockType,
      body_condition_score: d.bodyConditionScore ? Number(d.bodyConditionScore) : null,
      heat_detection_date: d.heatDetectionDate,
      observer: d.observer || null,
      serviced_date: d.servicedDate || null,
      breeding_status: d.breedingStatus,
      breeding_method: d.breedingMethod || null,
      ai_technician: d.aiTechnician || null,
      sire_id: d.sireId || null,
      straw_id: d.strawId || null,
      semen_viability: d.semenViability ? Number(d.semenViability) : null,
      return_to_heat_date_1: d.returnToHeatDate1 || null,
      date_served_2: d.dateServed2 || null,
      breeding_method_2: d.breedingMethod2 || null,
      sire_used_2: d.sireUsed2 || null,
      return_to_heat_date_2: d.returnToHeatDate2 || null,
      production_year: selectedProductionYear
    }
    const { data, error } = await supabase.from('breeding_records').insert(dbPayload).select().single()
    if (error) throw error
    setBreeding(prev => [...prev, data])
    setShowAddBreeding(false)
  }

  const saveEditedBreeding = async (d: any) => {
    if (!session || !targetUserId || !editingBreeding) return
    const dbPayload = {
      ear_tag_number: d.earTagNumber,
      stock_type: d.stockType,
      body_condition_score: d.bodyConditionScore ? Number(d.bodyConditionScore) : null,
      heat_detection_date: d.heatDetectionDate,
      observer: d.observer || null,
      serviced_date: d.servicedDate || null,
      breeding_status: d.breedingStatus,
      breeding_method: d.breedingMethod || null,
      ai_technician: d.aiTechnician || null,
      sire_id: d.sireId || null,
      straw_id: d.strawId || null,
      semen_viability: d.semenViability ? Number(d.semenViability) : null,
      return_to_heat_date_1: d.returnToHeatDate1 || null,
      date_served_2: d.dateServed2 || null,
      breeding_method_2: d.breedingMethod2 || null,
      sire_used_2: d.sireUsed2 || null,
      return_to_heat_date_2: d.returnToHeatDate2 || null
    }
    const { data, error } = await supabase.from('breeding_records').update(dbPayload).eq('id', editingBreeding.id).select().single()
    if (error) throw error
    setBreeding(prev => prev.map(item => item.id === editingBreeding.id ? data : item))
    setEditingBreeding(null)
  }

  const addPregnancyRecord = async (d: any) => {
    if (!session || !targetUserId) return
    const dbPayload = {
      user_id: targetUserId,
      cow_ear_tag: d.cowEarTag,
      body_condition_score: d.bodyConditionScore ? Number(d.bodyConditionScore) : null,
      last_service_date: d.lastServiceDate,
      first_trimester_pd: d.firstTrimesterPD,
      second_trimester_pd: d.secondTrimesterPD,
      third_trimester_pd: d.thirdTrimesterPD,
      gestation_period: d.gestationPeriod ? Number(d.gestationPeriod) : 0,
      expected_calving_date: d.expectedCalvingDate || null,
      actual_calving_date: d.actualCalvingDate || null,
      calf_id: d.calfId || null,
      calf_sex: d.calfSex || null,
      delivery_type: d.deliveryType || null,
      average_bcs: d.averageBCS ? Number(d.averageBCS) : (d.bodyConditionScore ? Number(d.bodyConditionScore) : null),
      expected_return_to_heat_date: d.expectedReturnToHeatDate || null,
      actual_first_heat_date: d.actualFirstHeatDate || null,
      expected_second_heat_date: d.expectedSecondHeatDate || null,
      actual_second_heat_date: d.actualSecondHeatDate || null,
      production_year: selectedProductionYear
    }
    try {
      const { data, error } = await supabase.from('pregnancy_records').insert(dbPayload).select().single()
      if (error) throw error
      setPregnancyRecords(prev => [...prev, data])
      setShowAddPregnancy(false)
    } catch (e: any) {
      throw new Error(`${e.message} | Payload: ${JSON.stringify(dbPayload)}`)
    }
  }

  const addBullRecord = async (d: any) => {
    if (!session || !targetUserId) return
    const dbPayload = {
      user_id: targetUserId,
      bull_id: d.bullId,
      date: d.date,
      age: d.age || null,
      pe: d.pe,
      sperm_motility: d.spermMotility || null,
      sperm_morphology: d.spermMorphology || null,
      scrotal: d.scrotal || null,
      libido: d.libido,
      score: d.score || null,
      classification: d.classification,
      production_year: selectedProductionYear
    }
    const { data, error } = await supabase.from('bull_breeding_records').insert(dbPayload).select().single()
    if (error) throw error
    setBullRecords(prev => [...prev, data])
    setShowAddBull(false)
  }

  const saveEditedBull = async (d: any) => {
    if (!session || !targetUserId || !editingBull) return
    const dbPayload = {
      date: d.date,
      age: d.age || null,
      pe: d.pe,
      sperm_motility: d.spermMotility || null,
      sperm_morphology: d.spermMorphology || null,
      scrotal: d.scrotal || null,
      libido: d.libido,
      score: d.score || null,
      classification: d.classification
    }
    const { data, error } = await supabase.from('bull_breeding_records').update(dbPayload).eq('id', editingBull.id).select().single()
    if (error) throw error
    setBullRecords(prev => prev.map(item => item.id === editingBull.id ? data : item))
    setEditingBull(null)
  }

  const saveEditedPregnancy = async (d: any) => {
    if (!session || !targetUserId || !editingPregnancy) return
    const dbPayload = {
      user_id: targetUserId,
      cow_ear_tag: d.cowEarTag,
      body_condition_score: d.bodyConditionScore ? Number(d.bodyConditionScore) : null,
      last_service_date: d.lastServiceDate,
      first_trimester_pd: d.firstTrimesterPD,
      second_trimester_pd: d.secondTrimesterPD,
      third_trimester_pd: d.thirdTrimesterPD,
      gestation_period: d.gestationPeriod ? Number(d.gestationPeriod) : 0,
      expected_calving_date: d.expectedCalvingDate || null,
      actual_calving_date: d.actualCalvingDate || null,
      calf_id: d.calfId || null,
      calf_sex: d.calfSex || null,
      delivery_type: d.deliveryType || null,
      average_bcs: d.averageBCS ? Number(d.averageBCS) : (d.bodyConditionScore ? Number(d.bodyConditionScore) : null),
      expected_return_to_heat_date: d.expectedReturnToHeatDate || null,
      actual_first_heat_date: d.actualFirstHeatDate || null,
      expected_second_heat_date: d.expectedSecondHeatDate || null,
      actual_second_heat_date: d.actualSecondHeatDate || null,
      production_year: selectedProductionYear
    }
    const { data, error } = await supabase.from('pregnancy_records').update(dbPayload).eq('id', editingPregnancy.id).select().single()
    if (error) throw error
    setPregnancyRecords(prev => prev.map(item => item.id === editingPregnancy.id ? data : item))
    setEditingPregnancy(null)
  }

  const saveEditedMortality = async (d: any) => {
    if (!session || !targetUserId || !editingMortality) return
    const dbPayload = {
      user_id: targetUserId,
      animal_tag: d.animalTag,
      date_of_death: d.dateOfDeath,
      cause_of_death: d.causeOfDeath,
      carcass_disposal_method: d.carcassDisposalMethod,
      necropsy_results: d.necropsyResults,
      veterinarian_notes: d.veterinarianNotes,
      production_year: selectedProductionYear
    }
    const { data, error } = await supabase.from('mortality_records').update(dbPayload).eq('id', editingMortality.id).select().single()
    if (error) throw error
    setMortality(prev => prev.map((item: any) => item.id === editingMortality.id ? data : item))
    setEditingMortality(null)
  }

  const saveEditedWeight = async (d: any) => {
    if (!session || !targetUserId || !editingWeight) return
    const dbPayload = {
      user_id: targetUserId,
      animal_tag: d.animalTag,
      year: Number(d.year),
      jan: d.jan ? Number(d.jan) : null,
      feb: d.feb ? Number(d.feb) : null,
      mar: d.mar ? Number(d.mar) : null,
      apr: d.apr ? Number(d.apr) : null,
      may: d.may ? Number(d.may) : null,
      jun: d.jun ? Number(d.jun) : null,
      jul: d.jul ? Number(d.jul) : null,
      aug: d.aug ? Number(d.aug) : null,
      sep: d.sep ? Number(d.sep) : null,
      oct: d.oct ? Number(d.oct) : null,
      nov: d.nov ? Number(d.nov) : null,
      dec: d.dec ? Number(d.dec) : null,
      production_year: selectedProductionYear
    }
    const { data, error } = await supabase.from('animal_weights').update(dbPayload).eq('id', editingWeight.id).select().single()
    if (error) throw error
    setWeights(prev => prev.map((item: any) => item.id === editingWeight.id ? data : item))
    setEditingWeight(null)
  }

  const saveEditedFeed = async (d: any) => {
    if (!session || !targetUserId || !editingFeed) return
    const dbPayload = {
      user_id: targetUserId,
      stock_type: d.stockType,
      date: d.date,
      pasture_grazing_time: d.pastureGrazingTime,
      pasture_quality: d.pastureQuality,
      hay_type: d.hayType,
      hay_amount: d.hayAmount ? Number(d.hayAmount) : null,
      silage_type: d.silageType,
      silage_amount: d.silageAmount ? Number(d.silageAmount) : null,
      grain_concentrate_type: d.grainConcentrateType,
      grain_concentrate_amount: d.grainConcentrateAmount ? Number(d.grainConcentrateAmount) : null,
      protein_supplement: d.proteinSupplement,
      protein_amount: d.proteinAmount ? Number(d.proteinAmount) : null,
      minerals_vitamins: d.mineralsVitamins,
      water_intake_estimate: d.waterIntakeEstimate,
      notes_issues: d.notesIssues,
      production_year: selectedProductionYear
    }
    const { data, error } = await supabase.from('feed_records').update(dbPayload).eq('id', editingFeed.id).select().single()
    if (error) throw error
    setFeedInventory(prev => prev.map((item: any) => item.id === editingFeed.id ? data : item))
    setEditingFeed(null)
  }

  const deleteBullRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bull evaluation record?')) return
    const { error } = await supabase.from('bull_breeding_records').delete().eq('id', id)
    if (error) throw error
    setBullRecords(prev => prev.filter(item => item.id !== id))
    setEditingBull(null)
  }

  const addWeightRecord = async (d: any) => {
    if (!session || !targetUserId) return
    const dbPayload = {
      user_id: targetUserId,
      animal_tag: d.animalTag,
      year: Number(d.year),
      jan: d.jan ? Number(d.jan) : null,
      feb: d.feb ? Number(d.feb) : null,
      mar: d.mar ? Number(d.mar) : null,
      apr: d.apr ? Number(d.apr) : null,
      may: d.may ? Number(d.may) : null,
      jun: d.jun ? Number(d.jun) : null,
      jul: d.jul ? Number(d.jul) : null,
      aug: d.aug ? Number(d.aug) : null,
      sep: d.sep ? Number(d.sep) : null,
      oct: d.oct ? Number(d.oct) : null,
      nov: d.nov ? Number(d.nov) : null,
      dec: d.dec ? Number(d.dec) : null,
      production_year: selectedProductionYear
    }
    const { data, error } = await supabase.from('animal_weights').upsert(dbPayload, { onConflict: 'user_id,animal_tag,year' }).select().single()
    if (error) throw error
    setWeights(prev => {
      const idx = prev.findIndex(w => w.animal_tag === d.animalTag && w.year === Number(d.year))
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = data
        return copy
      }
      return [...prev, data]
    })
    setShowAddWeight(false)
  }

  const addFeedItem = async (d: any) => {
    if (!session || !targetUserId) return
    const dbPayload = {
      user_id: targetUserId,
      name: d.name,
      type: d.type,
      quantity: d.quantity,
      unit: d.unit,
      supplier: d.supplier || null,
      status: d.status,
      last_updated: new Date().toISOString().split('T')[0]
    }
    const { data, error } = await supabase.from('feed_inventory').insert(dbPayload).select().single()
    if (error) throw error
    setFeedInventory(prev => [...prev, data])
    setShowAddFeed(false)
  }

  const addTransaction = async (d: any) => {
    if (!session || !targetUserId) return
    const amt = parseFloat(d.amount)
    if (isNaN(amt)) throw new Error('Invalid amount')

    if (d.type === 'Sale' && d.animalTag) {
      const { error: delErr } = await supabase
        .from('animals')
        .delete()
        .eq('tag', d.animalTag)
        .eq('user_id', targetUserId)
        .eq('production_year', selectedProductionYear)
      if (delErr) console.warn("Error deleting sold animal:", delErr)
      setAnimals(prev => prev.filter(a => a.tag !== d.animalTag))
    }

    const dbPayload = {
      user_id: targetUserId,
      date: d.date,
      type: d.type,
      amount: d.type === 'Sale' ? Math.abs(amt) : -Math.abs(amt),
      description: d.description,
      category: d.category || 'Livestock',
      production_year: selectedProductionYear
    }

    const { data, error } = await supabase.from('transaction_records').insert(dbPayload).select().single()
    if (error) throw error
    setTransactions(prev => [data, ...prev])
    setShowAddTransaction(false)
  }

  const transactionStats = useMemo(() => {
    const sales = transactions
      .filter(t => t.type === 'Sale' || t.type === 'Income')
      .reduce((s, t) => s + Math.abs(t.amount ?? 0), 0)
    const purchases = transactions
      .filter(t => t.type === 'Purchase' || t.type === 'Expense')
      .reduce((s, t) => s + Math.abs(t.amount ?? 0), 0)
    const net = sales - purchases
    return { sales, purchases, net }
  }, [transactions])

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: C.neutral100 }}>
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: C.neutral900 }}>Registers</h2>
          <p className="text-sm mt-0.5" style={{ color: C.neutral500 }}>View and manage all records across different registers.</p>
        </div>
      </div>

      {/* Tab bar — exact mobile pill style */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto bg-neutral-100 shadow-sm border border-neutral-200/40">
        {TABS.filter(t => {
          if (t.key === 'sales' && profile?.role === 'worker') return false;
          return true;
        }).map(({ key, label, icon: Icon }) => (
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
        {activeTab === 'herd' && (
          <button onClick={() => setShowAddAnimal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600 }}>
            <Plus size={16} /> Add Animal
          </button>
        )}

        {activeTab === 'drugs' && (
          <button onClick={() => setShowAddDrug(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600 }}>
            <Plus size={16} /> Add Drug
          </button>
        )}
        {activeTab === 'health' && (
          <button onClick={() => setShowAddHealth(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600 }}>
            <Plus size={16} /> Add Health Record
          </button>
        )}
        {activeTab === 'breeding' && (
          <button onClick={() => setShowAddBreeding(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600 }}>
            <Plus size={16} /> Add Breeding Log
          </button>
        )}
        {activeTab === 'pregnancy' && (
          <button onClick={() => setShowAddPregnancy(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600 }}>
            <Plus size={16} /> Add Pregnancy Record
          </button>
        )}
        {activeTab === 'bulls' && (
          <button onClick={() => setShowAddBull(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600 }}>
            <Plus size={16} /> Add Evaluation
          </button>
        )}
        {activeTab === 'mortality' && (
          <button onClick={() => setShowAddMortality(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.error500 }}>
            <Plus size={16} /> Add Record
          </button>
        )}
        {activeTab === 'weight' && (
          <button onClick={() => setShowAddWeight(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600 }}>
            <Plus size={16} /> Add/Update Weight
          </button>
        )}
        {activeTab === 'feed' && (
          <button onClick={() => setShowAddFeed(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary600 }}>
            <Plus size={16} /> Add Feed Item
          </button>
        )}
        {activeTab === 'sales' && (
          <button onClick={() => setShowAddTransaction(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.success500 }}>
            <Plus size={16} /> Add Transaction
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
                  ['Cows', herdTotals.cows, '#639A34', 'Cow'],
                  ['Bulls', herdTotals.bulls, '#E74C3C', 'Bull'],
                  ['Heifers', herdTotals.heifers, '#FF9E2C', 'Heifer'],
                  ['Steers', herdTotals.steers, '#2980B9', 'Steer'],
                  ['Calves', herdTotals.calves, '#359563', 'Calves'],
                ].map(([label, count, color, filterKey]) => {
                  const isSelected = herdFilter === filterKey;
                  return (
                  <div key={label as string} onClick={() => setHerdFilter(isSelected ? null : (filterKey as string))} className="text-center px-4 py-2 border rounded-xl bg-white shadow-sm cursor-pointer hover:shadow-md transition-all" style={{ borderColor: isSelected ? (color as string) : C.neutral100, backgroundColor: isSelected ? `${color}1A` : 'white', transform: isSelected ? 'scale(1.05)' : 'scale(1)', minWidth: '90px' }}>
                    <p className="text-xl font-bold" style={{ color: color as string }}>{count}</p>
                    <p className="text-xs font-semibold" style={{ color: C.neutral500 }}>{label}</p>
                  </div>
                )})}
                <div onClick={() => setHerdFilter(null)} className="text-center px-5 py-2 border rounded-xl bg-white shadow-sm ml-auto cursor-pointer hover:shadow-md transition-all" style={{ borderColor: !herdFilter ? C.primary400 : C.primary100, backgroundColor: !herdFilter ? C.primary50 : 'white', transform: !herdFilter ? 'scale(1.05)' : 'scale(1)', minWidth: '90px' }}>
                  <p className="text-xl font-extrabold" style={{ color: !herdFilter ? C.primary600 : C.primary400 }}>{animals.length}</p>
                  <p className="text-xs font-bold" style={{ color: !herdFilter ? C.primary600 : C.primary400 }}>Total Herd</p>
                </div>
              </div>
              <Table data={filteredAnimals.map((row, index) => ({ ...row, count: index + 1 }))} cols={[
                { key: 'count',       label: 'Count' },
                { key: 'tag',         label: 'Tag',    render: tagBadge },
                { key: 'breed',       label: 'Breed' },
                { key: 'sex',         label: 'Sex',    render: sexBadge },
                { key: 'stock_type',  label: 'Type' },
                { key: 'source',      label: 'Source' },
                { key: 'age',         label: 'Age' },
                { key: 'date_of_birth', label: 'DOB' },
                { key: 'weight',      label: 'Weight (kg)', align: 'center' },
                { key: 'bcs',         label: 'BCS', align: 'center' },
                { key: 'sire',        label: 'Sire' },
                { key: 'dam',         label: 'Dam' },
                { key: 'birth_weight', label: 'Birth Wt (kg)', align: 'center' },
                { key: 'date_of_weaning', label: 'Wean Date' },
                { key: 'weaning_weight', label: 'Wean Wt (kg)', align: 'center' },
                { key: 'description', label: 'Description' },
                {
                  key: 'actions',
                  label: 'Actions',
                  align: 'center',
                  render: (_, row) => (
                    <button onClick={() => setEditingAnimal(row)} className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                  )
                }
              ]} />
            </>
          )}

          {/* CALF REGISTER */}
          {activeTab === 'calf' && (
            <>
              <div className="px-6 py-4 border-b font-bold text-sm bg-neutral-50/50" style={{ borderColor: C.neutral100, color: C.neutral900 }}>
                Calf Register ({filteredCalves.length})
              </div>
              <Table data={filteredCalves.map((row, index) => ({ ...row, count: index + 1 }))} cols={[
                { key: 'count',                      label: 'Count' },
                { key: 'tag',                        label: 'Calf ID', render: tagBadge },
                { key: 'sire',                       label: 'Sire ID' },
                { key: 'dam',                        label: 'Dam ID' },
                { key: 'sex',                        label: 'Sex', render: sexBadge },
                { key: 'age',                        label: 'Age' },
                { key: 'birth_weight',               label: 'Birth Wt', align: 'center', render: (v) => v ? `${v} kg` : '—' },
                { key: 'weight_30day',               label: '30d Wt', align: 'center', render: (v) => v ? `${v} kg` : '—' },
                { key: 'weight_100day',              label: '100d Wt', align: 'center', render: (v) => v ? `${v} kg` : '—' },
                { key: 'date_of_weaning',            label: 'Wean Date' },
                { key: 'weaning_weight',             label: 'Wean Wt', align: 'center', render: (v) => v ? `${v} kg` : '—' },
                { key: 'weight_1week_post_weaning',   label: '1w Post Wean', align: 'center', render: (v) => v ? `${v} kg` : '—' },
                { key: 'weight_6months_post_weaning', label: '6m Post Wean', align: 'center', render: (v) => v ? `${v} kg` : '—' },
                { key: 'calf_status',                label: 'Status', render: statusBadge, align: 'center' },
                { key: 'pre_weaning_mortality',      label: 'Mortality', render: (v) => pregnancyBadge(v ? 'Yes' : 'No'), align: 'center' },
                { key: 'observer',                   label: 'Observer' },
                {
                  key: 'actions',
                  label: 'Actions',
                  align: 'center',
                  render: (_, row) => (
                    <button onClick={() => setEditingCalf(row)} className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                  )
                }
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
                {
                  key: 'actions',
                  label: 'Actions',
                  align: 'center',
                  render: (_, row) => (
                    <button onClick={() => setEditingDrug(row)} className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                  )
                }
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
                { key: 'done_by',           label: 'Done By' },
                { key: 'special_notes',     label: 'Special Notes' },
                { key: 'status',            label: 'Status',     render: statusBadge, align: 'center' },
                {
                  key: 'actions',
                  label: 'Actions',
                  align: 'center',
                  render: (_, row) => (
                    <button onClick={() => setEditingHealth(row)} className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                  )
                }
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
                { key: 'ear_tag_number',       label: 'Ear Tag', render: tagBadge },
                { key: 'stock_type',           label: 'Stock Type' },
                { key: 'body_condition_score', label: 'BCS', align: 'center', render: (v) => v !== null && v !== undefined ? <span className="font-semibold text-neutral-800">{Number(v).toFixed(1)}</span> : '—' },
                { key: 'heat_detection_date',  label: 'Heat Detected' },
                { key: 'observer',             label: 'Observer' },
                { key: 'serviced_date',        label: 'Serviced Date' },
                { key: 'breeding_status',      label: 'Status', render: statusBadge, align: 'center' },
                { key: 'breeding_method',      label: 'Method', render: methodBadge, align: 'center' },
                { key: 'ai_technician',        label: 'AI Tech' },
                { 
                  key: 'sire_id', 
                  label: 'Sire/Straw ID',
                  render: (_, row) => row.breeding_method === 'AI' 
                    ? `${row.sire_id || ''}${row.sire_id && row.straw_id ? ' / ' : ''}${row.straw_id || ''}` || '—'
                    : (row.sire_id || '—')
                },
                { key: 'semen_viability',      label: 'Viability %', align: 'center', render: (v) => v ? `${v}%` : '—' },
                { key: 'return_to_heat_date_1',label: 'Return to Heat 1' },
                { key: 'date_served_2',        label: 'Date Served 2' },
                { key: 'breeding_method_2',    label: 'Method 2', render: methodBadge, align: 'center' },
                { key: 'sire_used_2',          label: 'Sire Used 2' },
                { key: 'return_to_heat_date_2',label: 'Return to Heat 2' },
                {
                  key: 'actions',
                  label: 'Actions',
                  align: 'center',
                  render: (_, row) => (
                    <button onClick={() => setEditingBreeding(row)} className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                  )
                }
              ]} />
            </>
          )}
          {/* PREGNANCY & CALVING */}
          {activeTab === 'pregnancy' && (
            <>
              <div className="px-6 py-4 border-b font-bold text-sm bg-neutral-50/50" style={{ borderColor: C.neutral100, color: C.neutral900 }}>
                Pregnancy & Calving Records ({filteredPregnancy.length})
              </div>
              <Table data={filteredPregnancy} cols={[
                { key: 'cow_ear_tag',                label: 'Cow Tag', render: tagBadge },
                { key: 'body_condition_score',       label: 'BCS', align: 'center', render: (v) => v ? <span className="font-semibold text-neutral-800">{v}</span> : '—' },
                { key: 'last_service_date',          label: 'Service Date' },
                { key: 'first_trimester_pd',         label: '1st Tri PD', render: statusBadge, align: 'center' },
                { key: 'second_trimester_pd',        label: '2nd Tri PD', render: statusBadge, align: 'center' },
                { key: 'third_trimester_pd',         label: '3rd Tri PD', render: statusBadge, align: 'center' },
                { key: 'gestation_period',           label: 'Gestation (days)', align: 'center' },
                { key: 'expected_calving_date',      label: 'Expected Calving' },
                { key: 'actual_calving_date',        label: 'Actual Calving' },
                { key: 'calf_id',                    label: 'Calf ID', render: tagBadge },
                { key: 'calf_sex',                   label: 'Calf Sex', render: sexBadge, align: 'center' },
                { key: 'delivery_type',              label: 'Delivery' },
                { key: 'average_bcs',                label: 'Avg BCS', align: 'center' },
                { key: 'expected_return_to_heat_date', label: 'Expected Return to Heat' },
                {
                  key: 'actions',
                  label: 'Actions',
                  align: 'center',
                  render: (_, row) => (
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setEditingPregnancy(row)} className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                        <Edit size={14} />
                      </button>
                    </div>
                  )
                }
              ]} />
            </>
          )}

          {/* BULL BREEDING SOUNDNESS */}
          {activeTab === 'bulls' && (
            <>
              <div className="px-6 py-4 border-b font-bold text-sm bg-neutral-50/50" style={{ borderColor: C.neutral100, color: C.neutral900 }}>
                Bull Breeding Soundness Evaluations ({filteredBulls.length})
              </div>
              <Table data={filteredBulls} cols={[
                { key: 'bull_id',          label: 'Bull ID', render: tagBadge },
                { key: 'date',             label: 'Date' },
                { key: 'age',              label: 'Age' },
                { key: 'pe',               label: 'Physical Exam', render: statusBadge, align: 'center' },
                { key: 'sperm_motility',   label: 'Sperm Motility' },
                { key: 'sperm_morphology', label: 'Sperm Morphology' },
                { key: 'scrotal',          label: 'Scrotal size' },
                { key: 'libido',           label: 'Libido', render: statusBadge, align: 'center' },
                { key: 'score',            label: 'Score', align: 'center', render: (v) => v ? <span className="font-bold text-neutral-800">{v}</span> : '—' },
                { key: 'classification',   label: 'Classification', render: statusBadge, align: 'center' },
                {
                  key: 'actions',
                  label: 'Actions',
                  align: 'center',
                  render: (_, row) => (
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setEditingBull(row)} className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => deleteBullRecord(row.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                }
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
                { key: 'observer',    label: 'Observer',    render: (v) => <span className="font-medium" style={{ color: C.neutral700 }}>{v || '—'}</span> },
                { key: 'description', label: 'Description', render: (v) => <span className="font-medium" style={{ color: C.neutral500 }}>{v}</span> },
                {
                  key: 'actions',
                  label: 'Actions',
                  align: 'center',
                  render: (_, row) => (
                    <button onClick={() => setEditingMortality(row)} className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                  )
                }
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

          {/* FEED INVENTORY */}
          {activeTab === 'feed' && (
            <>
              <div className="px-6 py-4 border-b font-bold text-sm bg-neutral-50/50" style={{ borderColor: C.neutral100, color: C.neutral900 }}>
                Feed Inventory ({filteredFeed.length})
              </div>
              <Table data={filteredFeed} cols={[
                { key: 'name',         label: 'Feed Name', render: (v) => <span className="font-semibold text-neutral-800">{v}</span> },
                { key: 'type',         label: 'Type' },
                { key: 'quantity',     label: 'Quantity', render: (v, row) => <span>{v} {row.unit}</span> },
                { key: 'supplier',     label: 'Supplier' },
                { key: 'last_updated', label: 'Last Updated', render: (v) => v ? <span>{new Date(v).toLocaleDateString()}</span> : '—' },
                { key: 'status',       label: 'Status', render: statusBadge, align: 'center' },
              ]} />
            </>
          )}

          {/* SALES & PURCHASES */}
          {activeTab === 'sales' && (
            <>
              <div className="px-6 py-4 border-b flex gap-6 flex-wrap bg-neutral-50/50" style={{ borderColor: C.neutral100 }}>
                <div className="text-center px-4 py-2 border rounded-xl bg-white shadow-sm" style={{ borderColor: C.neutral100, minWidth: '120px' }}>
                  <p className="text-xl font-bold text-[#43B97C]">${transactionStats.sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs font-semibold text-neutral-500">Total Sales</p>
                </div>
                <div className="text-center px-4 py-2 border rounded-xl bg-white shadow-sm" style={{ borderColor: C.neutral100, minWidth: '120px' }}>
                  <p className="text-xl font-bold text-[#E74C3C]">${transactionStats.purchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs font-semibold text-neutral-500">Total Purchases</p>
                </div>
                <div className="text-center px-4 py-2 border rounded-xl bg-white shadow-sm" style={{ borderColor: C.neutral100, minWidth: '120px' }}>
                  <p className={`text-xl font-bold ${transactionStats.net >= 0 ? 'text-[#7AC142]' : 'text-[#E74C3C]'}`}>
                    ${transactionStats.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs font-semibold text-neutral-500">Net Profit / Loss</p>
                </div>
              </div>
              <Table data={filteredTransactions} cols={[
                { key: 'date',        label: 'Date', render: (v) => <span className="font-semibold text-neutral-800">{v}</span> },
                { key: 'description', label: 'Description' },
                { key: 'category',    label: 'Category' },
                { key: 'type',        label: 'Type', render: (v) => (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
                    style={{
                      backgroundColor: v === 'Sale' || v === 'Income' ? '#E6F9F1' : '#FDEDEC',
                      borderColor: v === 'Sale' || v === 'Income' ? '#9FE4C1' : '#F5B7B1',
                      color: v === 'Sale' || v === 'Income' ? '#27714B' : '#B03A2E'
                    }}>
                    {v}
                  </span>
                )},
                { key: 'amount',      label: 'Amount', align: 'right', render: (v, row) => {
                  const amt = Math.abs(v || 0)
                  const isSale = row.type === 'Sale' || row.type === 'Income'
                  return (
                    <span className={`font-bold ${isSale ? 'text-[#43B97C]' : 'text-[#E74C3C]'}`}>
                      {isSale ? '+' : '-'} ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  )
                }}
              ]} />
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddDrug     && <AddDrugModal     onClose={() => setShowAddDrug(false)}     onSave={addDrug} />}
      {showAddMortality && <AddMortalityModal animals={animals} onClose={() => setShowAddMortality(false)} onSave={addMortality} />}
      {showAddAnimal   && <AddAnimalModal   onClose={() => setShowAddAnimal(false)}   onSave={addAnimal} />}
      {showAddCalf     && <AddCalfModal     onClose={() => setShowAddCalf(false)}     onSave={addCalf} />}
      {showAddHealth   && <AddHealthModal   animals={animals} onClose={() => setShowAddHealth(false)} onSave={addHealthRecord} />}
      {showAddBreeding && <AddBreedingModal animals={animals} onClose={() => setShowAddBreeding(false)} onSave={addBreedingRecord} />}
      {showAddPregnancy && <AddPregnancyModal animals={animals} onClose={() => setShowAddPregnancy(false)} onSave={addPregnancyRecord} />}
      {showAddBull     && <AddBullModal     animals={animals} onClose={() => setShowAddBull(false)} onSave={addBullRecord} />}
      {showAddWeight   && <AddWeightModal   animals={animals} onClose={() => setShowAddWeight(false)} onSave={addWeightRecord} />}
      {showAddFeed     && <AddFeedModal     onClose={() => setShowAddFeed(false)}     onSave={addFeedItem} />}
      {showAddTransaction && <AddTransactionModal animals={animals} onClose={() => setShowAddTransaction(false)} onSave={addTransaction} />}
      {editingAnimal   && <AddAnimalModal   editingAnimal={editingAnimal} onClose={() => setEditingAnimal(null)} onSave={saveEditedAnimal} />}
      {editingCalf     && <AddCalfModal     editingCalf={editingCalf} onClose={() => setEditingCalf(null)} onSave={saveEditedCalf} />}
      {editingDrug     && <AddDrugModal     editingDrug={editingDrug} onClose={() => setEditingDrug(null)} onSave={saveEditedDrug} />}
      {editingHealth   && <AddHealthModal   animals={animals} editingHealth={editingHealth} onClose={() => setEditingHealth(null)} onSave={saveEditedHealth} />}
      {editingBreeding && <AddBreedingModal animals={animals} editingBreeding={editingBreeding} onClose={() => setEditingBreeding(null)} onSave={saveEditedBreeding} />}
      {editingBull     && <AddBullModal     animals={animals} editingBull={editingBull} onClose={() => setEditingBull(null)} onSave={saveEditedBull} />}
      {editingPregnancy && <AddPregnancyModal animals={animals} editingPregnancy={editingPregnancy} onClose={() => setEditingPregnancy(null)} onSave={saveEditedPregnancy} />}
      {editingMortality && <AddMortalityModal animals={animals} editingMortality={editingMortality} onClose={() => setEditingMortality(null)} onSave={saveEditedMortality} />}
      {editingWeight    && <AddWeightModal    animals={animals} editingWeight={editingWeight} onClose={() => setEditingWeight(null)} onSave={saveEditedWeight} />}
      {editingFeed      && <AddFeedModal      editingFeed={editingFeed} onClose={() => setEditingFeed(null)} onSave={saveEditedFeed} />}

      {selectedAnimalProfile && (
        <AnimalProfileModal
          animal={selectedAnimalProfile}
          onClose={() => setSelectedAnimalProfile(null)}
        />
      )}
    </div>
  )
}
