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

export default function VetAIRecordReport({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { session, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const targetUserId = profile?.role === 'worker' ? profile.farmer_id : session?.user.id

  const [form, setForm] = useState({
    record_date: new Date().toISOString().split('T')[0],
    ai_technician: '', session_type: '', sync_protocol: '', protocol_dates: '',
    straw_id: '', sire_name: '', sire_breed: '', semen_provider: '', semen_type: '',
    batch_number: '', storage_location: '', thawing_temp: '', thawing_duration: '',
    post_thaw_motility: '', straw_integrity: '', animal_id: '', eid: '', age_parity: '',
    days_open: '', heat_signs: '', estrus_score: '', ai_date: '', time_elapsed: '',
    insemination_site: '', ease_of_service: '', hygiene_status: '', concurrent_treatments: '',
    scheduled_return_check: '', scheduled_pregnancy_check: '', preferred_diagnostic: '',
    expected_calving_date: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUserId) return
    setLoading(true)
    setError(null)

    const payload = { ...form, user_id: targetUserId }
    if (payload.ai_date) payload.ai_date = new Date(payload.ai_date).toISOString()
    else payload.ai_date = null as any

    Object.keys(payload).forEach(key => {
      if (payload[key as keyof typeof payload] === '') {
        (payload as any)[key] = null
      }
    })

    try {
      const { error: dbErr } = await supabase.from('vet_ai_reports').insert(payload)
      if (dbErr) throw dbErr
      alert("Artificial Insemination (AI) Record Report successfully saved!")
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
            <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Artificial Insemination (AI) Record Report</h2>
            <p className="text-sm mt-1" style={{ color: C.neutral500 }}>Breeding log, semen quality & insemination details</p>
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

          <form id="ai-report-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>1. General & Protocol Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Record Date *</label><input required type="date" name="record_date" value={form.record_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">AI Technician / Vet</label><input type="text" name="ai_technician" value={form.ai_technician} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Session Type (e.g., natural heat, sync)</label><input type="text" name="session_type" value={form.session_type} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Synchronization Protocol</label><input type="text" name="sync_protocol" value={form.sync_protocol} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Protocol Dates & Details</label><input type="text" name="protocol_dates" value={form.protocol_dates} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>2. Semen Identification & Quality</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Straw ID / Code</label><input type="text" name="straw_id" value={form.straw_id} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Sire Name</label><input type="text" name="sire_name" value={form.sire_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Sire Breed</label><input type="text" name="sire_breed" value={form.sire_breed} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Semen Provider / Company</label><input type="text" name="semen_provider" value={form.semen_provider} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Semen Type (Conventional/Sexed)</label><input type="text" name="semen_type" value={form.semen_type} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Batch / Lot Number</label><input type="text" name="batch_number" value={form.batch_number} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Storage Location (Flask/Canister)</label><input type="text" name="storage_location" value={form.storage_location} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Thawing Temperature</label><input type="text" name="thawing_temp" value={form.thawing_temp} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Thawing Duration</label><input type="text" name="thawing_duration" value={form.thawing_duration} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Post-Thaw Motility (If checked)</label><input type="text" name="post_thaw_motility" value={form.post_thaw_motility} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Straw Integrity Notes</label><input type="text" name="straw_integrity" value={form.straw_integrity} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>3. Female Evaluation & Heat Observation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Animal ID</label><input type="text" name="animal_id" value={form.animal_id} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">EID / Microchip</label><input type="text" name="eid" value={form.eid} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Age / Parity</label><input type="text" name="age_parity" value={form.age_parity} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Days Open</label><input type="text" name="days_open" value={form.days_open} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Heat Signs Observed</label><input type="text" name="heat_signs" value={form.heat_signs} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Estrus Score / Intensity</label><input type="text" name="estrus_score" value={form.estrus_score} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>4. Insemination Procedure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Date & Time of AI</label><input type="datetime-local" name="ai_date" value={form.ai_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Time Elapsed Since Standing Heat</label><input type="text" name="time_elapsed" value={form.time_elapsed} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Insemination Site (e.g., Uterine body)</label><input type="text" name="insemination_site" value={form.insemination_site} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Ease of Service</label><input type="text" name="ease_of_service" value={form.ease_of_service} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Vulvar Hygiene Status</label><input type="text" name="hygiene_status" value={form.hygiene_status} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Concurrent Treatments (e.g., GnRH)</label><input type="text" name="concurrent_treatments" value={form.concurrent_treatments} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>5. Follow-Up Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Scheduled Return-to-Heat Check</label><input type="date" name="scheduled_return_check" value={form.scheduled_return_check} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Scheduled Pregnancy Check Date</label><input type="date" name="scheduled_pregnancy_check" value={form.scheduled_pregnancy_check} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Preferred PD Method (Ultrasound/Palpation)</label><input type="text" name="preferred_diagnostic" value={form.preferred_diagnostic} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Expected Calving Date</label><input type="date" name="expected_calving_date" value={form.expected_calving_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-white" style={{ borderColor: C.neutral200 }}>
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="ai-report-form" disabled={loading} className="px-6 py-2 rounded-xl text-sm font-bold text-white shadow-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50" style={{ backgroundColor: C.primary600 }}>
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Report'}
          </button>
        </div>

      </div>
    </div>
  )
}
