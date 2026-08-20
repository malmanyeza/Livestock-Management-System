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

export default function VetSpecialConsultReport({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { session, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const targetUserId = profile?.role === 'worker' ? profile.farmer_id : session?.user.id

  const [form, setForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
    procedure_date: '', case_number: '', surgeon: '', assisting_staff: '', urgency_level: '',
    owner_name: '', patient_id: '', species_breed: '', age_sex_weight: '', current_location: '',
    primary_complaint: '', history: '', triage_vitals: '', mentation: '', procedure_name: '',
    sedation_protocol: '', surgical_technique: '', monitoring_complications: '', in_house_testing: '',
    imaging_findings: '', recovery_quality: '', post_op_plan: '', definitive_diagnosis: '',
    prognosis: '', dispensed_meds: '', meat_withdrawal: '', milk_withdrawal: '', follow_up_instructions: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUserId) return
    setLoading(true)
    setError(null)

    const payload = { ...form, user_id: targetUserId }
    // Convert empty strings to null for date fields
    Object.keys(payload).forEach(key => {
      if (payload[key as keyof typeof payload] === '') {
        (payload as any)[key] = null
      }
    })

    try {
      const { error: dbErr } = await supabase.from('vet_special_consult_reports').insert(payload)
      if (dbErr) throw dbErr
      alert("Veterinary Special Consultation & Procedure Report successfully saved!")
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
            <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Veterinary Special Consultation & Procedure Report</h2>
            <p className="text-sm mt-1" style={{ color: C.neutral500 }}>Surgical, Emergency, or Specialized Care</p>
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

          <form id="sc-report-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>1. General & Administrative</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Report Date *</label><input required type="date" name="report_date" value={form.report_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Procedure Date</label><input type="date" name="procedure_date" value={form.procedure_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Case Number</label><input type="text" name="case_number" value={form.case_number} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Urgency Level (e.g., Routine, Emergency)</label><input type="text" name="urgency_level" value={form.urgency_level} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Attending Vet / Surgeon</label><input type="text" name="surgeon" value={form.surgeon} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Assisting Staff / Vet Techs</label><input type="text" name="assisting_staff" value={form.assisting_staff} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>2. Patient Info & Admission Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Owner / Client Name</label><input type="text" name="owner_name" value={form.owner_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Patient ID / Tag</label><input type="text" name="patient_id" value={form.patient_id} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Species & Breed</label><input type="text" name="species_breed" value={form.species_breed} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Age, Sex & Weight</label><input type="text" name="age_sex_weight" value={form.age_sex_weight} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Current Location (e.g., Barn A, Clinic ICU)</label><input type="text" name="current_location" value={form.current_location} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Primary Complaint</label><textarea name="primary_complaint" value={form.primary_complaint} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">History / Prior Treatments</label><textarea name="history" value={form.history} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>3. Clinical Status & Diagnostics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Triage Vitals (HR, RR, Temp, CRT)</label><input type="text" name="triage_vitals" value={form.triage_vitals} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Mentation Status (e.g., Alert, Depressed)</label><input type="text" name="mentation" value={form.mentation} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">In-House Testing Results (PCV/TP, BG, etc.)</label><input type="text" name="in_house_testing" value={form.in_house_testing} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Imaging Findings (X-ray, Ultrasound)</label><input type="text" name="imaging_findings" value={form.imaging_findings} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>4. Procedure Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Name of Procedure(s)</label><input type="text" name="procedure_name" value={form.procedure_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Sedation / Anesthesia Protocol</label><textarea name="sedation_protocol" value={form.sedation_protocol} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Surgical / Treatment Technique</label><textarea name="surgical_technique" value={form.surgical_technique} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Monitoring & Intra-op Complications</label><textarea name="monitoring_complications" value={form.monitoring_complications} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>5. Outcomes & Follow-up</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Recovery Quality</label><input type="text" name="recovery_quality" value={form.recovery_quality} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Prognosis (e.g., Excellent, Guarded, Poor)</label><input type="text" name="prognosis" value={form.prognosis} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Definitive Diagnosis</label><input type="text" name="definitive_diagnosis" value={form.definitive_diagnosis} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Immediate Post-Op / Discharge Plan</label><textarea name="post_op_plan" value={form.post_op_plan} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Dispensed Medications (Dose, route, frequency)</label><textarea name="dispensed_meds" value={form.dispensed_meds} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Meat Withdrawal Time</label><input type="text" name="meat_withdrawal" value={form.meat_withdrawal} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Milk Withdrawal Time</label><input type="text" name="milk_withdrawal" value={form.milk_withdrawal} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Client Follow-Up Instructions (Rechecks, bandaging)</label><textarea name="follow_up_instructions" value={form.follow_up_instructions} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-white" style={{ borderColor: C.neutral200 }}>
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="sc-report-form" disabled={loading} className="px-6 py-2 rounded-xl text-sm font-bold text-white shadow-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50" style={{ backgroundColor: C.primary600 }}>
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Report'}
          </button>
        </div>

      </div>
    </div>
  )
}
