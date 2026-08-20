import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { X, Save, AlertCircle } from 'lucide-react'

const C = {
  primary500: '#7AC142', primary600: '#639A34',
  neutral100: '#E9ECEF', neutral200: '#DEE2E6',
  neutral500: '#6C757D', neutral600: '#495057', neutral700: '#343A40', neutral900: '#121416',
  white: '#FFFFFF',
}

export default function VetPregnancyDiagnosisReport({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { session, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const targetUserId = profile?.role === 'worker' ? profile.farmer_id : session?.user.id

  const [form, setForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
    exam_date: '', examining_vet: '', farm_name: '', diagnostic_method: '',
    animal_id: '', species_breed: '', last_breeding_date: '', days_post_breeding: '',
    pregnancy_status: '', est_gestation_age: '', expected_birthing_date: '',
    fetal_viability: '', twin_status: '', uterine_fluid: '', ovarian_status: '',
    total_examined: '', total_pregnant: '', total_open: '', total_rechecks: '',
    conception_rate: '', abortion_rate: '', open_intervention: '', nutritional_grouping: '',
    recheck_schedule: '', next_visit: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUserId) return
    setLoading(true)
    setError(null)

    const payload = { ...form, user_id: targetUserId }
    // Convert empty strings to null for date and integer fields
    Object.keys(payload).forEach(key => {
      if (payload[key as keyof typeof payload] === '') {
        (payload as any)[key] = null
      }
    })

    try {
      const { error: dbErr } = await supabase.from('vet_pregnancy_reports').insert(payload)
      if (dbErr) throw dbErr
      alert("Veterinary Pregnancy Diagnosis Report successfully saved!")
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: any) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: C.neutral200 }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Veterinary Pregnancy Diagnosis Report</h2>
            <p className="text-sm mt-1" style={{ color: C.neutral500 }}>Ultrasound and Palpation details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <X size={20} style={{ color: C.neutral500 }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form id="pd-report-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>1. General Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Report Date *</label><input required type="date" name="report_date" value={form.report_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Examination Date</label><input type="date" name="exam_date" value={form.exam_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Examining Vet</label><input type="text" name="examining_vet" value={form.examining_vet} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Farm / Client Name</label><input type="text" name="farm_name" value={form.farm_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Diagnostic Method (e.g., Ultrasound, Rectal palpation)</label><input type="text" name="diagnostic_method" value={form.diagnostic_method} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>2. Individual Animal Findings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Animal ID / Tag</label><input type="text" name="animal_id" value={form.animal_id} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Species / Breed</label><input type="text" name="species_breed" value={form.species_breed} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Last Breeding/AI Date</label><input type="date" name="last_breeding_date" value={form.last_breeding_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Days Post-Breeding</label><input type="text" name="days_post_breeding" value={form.days_post_breeding} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div>
                  <label className="block text-xs font-bold mb-1">Pregnancy Status</label>
                  <select name="pregnancy_status" value={form.pregnancy_status} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">-- Select Status --</option>
                    <option value="Pregnant">Pregnant</option>
                    <option value="Open">Open (Not pregnant)</option>
                    <option value="Recheck">Recheck Required</option>
                  </select>
                </div>
                <div><label className="block text-xs font-bold mb-1">Estimated Gestation Age</label><input type="text" name="est_gestation_age" value={form.est_gestation_age} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Expected Birthing Date</label><input type="date" name="expected_birthing_date" value={form.expected_birthing_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Fetal Viability (Heartbeat)</label><input type="text" name="fetal_viability" value={form.fetal_viability} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Twin / Multiple Status</label><input type="text" name="twin_status" value={form.twin_status} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Uterine Fluid / Abnormalities</label><input type="text" name="uterine_fluid" value={form.uterine_fluid} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Ovarian Status (CL, Cysts)</label><input type="text" name="ovarian_status" value={form.ovarian_status} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>3. Herd Summary & Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Total Examined</label><input type="number" name="total_examined" value={form.total_examined} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Total Pregnant</label><input type="number" name="total_pregnant" value={form.total_pregnant} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Total Open</label><input type="number" name="total_open" value={form.total_open} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Total Rechecks</label><input type="number" name="total_rechecks" value={form.total_rechecks} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Conception Rate (%)</label><input type="text" name="conception_rate" value={form.conception_rate} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Estimated Abortion/Loss Rate</label><input type="text" name="abortion_rate" value={form.abortion_rate} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>4. Recommendations & Interventions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Intervention for Open Cows (e.g., resync)</label><textarea name="open_intervention" value={form.open_intervention} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Nutritional Grouping Advice</label><textarea name="nutritional_grouping" value={form.nutritional_grouping} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Recheck Schedule (Days)</label><input type="text" name="recheck_schedule" value={form.recheck_schedule} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Next Visit Date</label><input type="date" name="next_visit" value={form.next_visit} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-white" style={{ borderColor: C.neutral200 }}>
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="pd-report-form" disabled={loading} className="px-6 py-2 rounded-xl text-sm font-bold text-white shadow-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50" style={{ backgroundColor: C.primary600 }}>
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Report'}
          </button>
        </div>

      </div>
    </div>
  )
}
