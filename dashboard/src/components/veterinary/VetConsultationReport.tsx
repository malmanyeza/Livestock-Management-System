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

export default function VetConsultationReport({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { session, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const targetUserId = profile?.role === 'worker' ? profile.farmer_id : session?.user.id

  const [form, setForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
    visit_date: '', case_number: '', attending_vet: '', follow_up_required: false, follow_up_date: '',
    client_name: '', contact_person: '', address: '', holding_number: '', enterprise_type: '',
    total_stock: '', primary_purpose: '', presenting_complaints: '', group_behavior: '',
    average_bcs: '', clinical_signs: '', individual_exams: '', housing_ventilation: '',
    biosecurity: '', nutrition: '', pasture_management: '', blood_samples: '', fecal_samples: '',
    milk_samples: '', other_samples: '', preliminary_diagnosis: '', definitive_diagnosis: '',
    prescriptions: '', meat_withdrawal: '', milk_withdrawal: '', isolate_management: '',
    husbandry_changes: '', vaccination_updates: '', nutritional_adjustments: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUserId) return
    setLoading(true)
    setError(null)
    try {
      const { error: dbErr } = await supabase.from('vet_consultation_reports').insert({
        ...form,
        user_id: targetUserId
      })
      if (dbErr) throw dbErr
      alert("Veterinary Consultation Report successfully saved!")
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: C.neutral200 }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Livestock Farm Veterinary Consultation Report</h2>
            <p className="text-sm mt-1" style={{ color: C.neutral500 }}>Comprehensive farm visit and advisory details</p>
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

          <form id="consult-report-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>1. General Admin & Farm Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Report Date *</label><input required type="date" name="report_date" value={form.report_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Visit Date</label><input type="date" name="visit_date" value={form.visit_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Case Number</label><input type="text" name="case_number" value={form.case_number} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Attending Vet</label><input type="text" name="attending_vet" value={form.attending_vet} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Client Name / Farm Name</label><input type="text" name="client_name" value={form.client_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Contact Person</label><input type="text" name="contact_person" value={form.contact_person} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Address / Location</label><input type="text" name="address" value={form.address} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Holding Number</label><input type="text" name="holding_number" value={form.holding_number} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Enterprise Type (e.g., Dairy, Beef)</label><input type="text" name="enterprise_type" value={form.enterprise_type} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Total Stock</label><input type="text" name="total_stock" value={form.total_stock} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Primary Purpose of Visit</label><input type="text" name="primary_purpose" value={form.primary_purpose} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>2. Farm History & Presenting Problem</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Presenting Complaints</label><textarea name="presenting_complaints" value={form.presenting_complaints} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>3. Clinical Examination & Observations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Herd/Group Behavior</label><input type="text" name="group_behavior" value={form.group_behavior} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Average Body Condition Score (BCS)</label><input type="text" name="average_bcs" value={form.average_bcs} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Clinical Signs Noted</label><textarea name="clinical_signs" value={form.clinical_signs} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Individual Examinations (Tags & Details)</label><textarea name="individual_exams" value={form.individual_exams} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>4. Husbandry & Management Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Housing & Ventilation</label><input type="text" name="housing_ventilation" value={form.housing_ventilation} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Biosecurity & Hygiene</label><input type="text" name="biosecurity" value={form.biosecurity} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Nutrition & Water Quality</label><input type="text" name="nutrition" value={form.nutrition} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Pasture / Grazing Management</label><input type="text" name="pasture_management" value={form.pasture_management} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>5. Diagnostic Sampling & Action</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Blood Samples Collected</label><input type="text" name="blood_samples" value={form.blood_samples} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Fecal Samples Collected</label><input type="text" name="fecal_samples" value={form.fecal_samples} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Milk / Mastitis Sampling</label><input type="text" name="milk_samples" value={form.milk_samples} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Other Samples (Skin scrapings, swabs)</label><input type="text" name="other_samples" value={form.other_samples} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>6. Diagnoses & Treatment Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Preliminary Diagnosis</label><textarea name="preliminary_diagnosis" value={form.preliminary_diagnosis} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Definitive Diagnosis</label><textarea name="definitive_diagnosis" value={form.definitive_diagnosis} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Medications Prescribed / Administered</label><textarea name="prescriptions" value={form.prescriptions} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Meat Withdrawal Periods</label><input type="text" name="meat_withdrawal" value={form.meat_withdrawal} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Milk Withdrawal Periods</label><input type="text" name="milk_withdrawal" value={form.milk_withdrawal} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 7 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>7. Veterinary Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Isolation / Quarantine Advice</label><textarea name="isolate_management" value={form.isolate_management} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Husbandry Changes Required</label><textarea name="husbandry_changes" value={form.husbandry_changes} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Vaccination Program Updates</label><input type="text" name="vaccination_updates" value={form.vaccination_updates} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Nutritional Adjustments</label><input type="text" name="nutritional_adjustments" value={form.nutritional_adjustments} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                
                <div className="flex items-center gap-2 mt-2 md:col-span-2">
                  <input type="checkbox" id="follow_up_required" name="follow_up_required" checked={form.follow_up_required} onChange={handleChange} className="w-4 h-4" />
                  <label htmlFor="follow_up_required" className="text-sm font-bold">Follow-Up Required</label>
                </div>
                {form.follow_up_required && (
                  <div><label className="block text-xs font-bold mb-1">Follow-Up Date</label><input type="date" name="follow_up_date" value={form.follow_up_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-white" style={{ borderColor: C.neutral200 }}>
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="consult-report-form" disabled={loading} className="px-6 py-2 rounded-xl text-sm font-bold text-white shadow-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50" style={{ backgroundColor: C.primary600 }}>
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Report'}
          </button>
        </div>

      </div>
    </div>
  )
}
