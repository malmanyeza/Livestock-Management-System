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

export default function VetLabReport({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { session, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const targetUserId = profile?.role === 'worker' ? profile.farmer_id : session?.user.id

  const [form, setForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
    case_number: '', attending_vet: '', animal_id: '', species_breed: '', age_sex: '',
    collection_method: '', smear_quality: '', rbc_anisocytosis: '', rbc_polychromasia: '',
    rbc_poikilocytosis: '', rbc_nucleated: '', wbc_neutrophils: '', wbc_lymphocytes: '',
    wbc_monocytes: '', wbc_eosinophils: '', wbc_basophils: '', platelet_estimation: '',
    blood_parasites: '', fecal_collection: '', fecal_gross: '', fecal_flotation: '',
    fecal_quantitative: '', fecal_sedimentation: '', fecal_direct_smear: '',
    urine_collection: '', urine_physical: '', urine_ph: '', urine_protein: '',
    urine_glucose: '', urine_ketones: '', urine_blood: '', urine_sediment: '',
    ref_lab_name: '', ref_lab_tracking: '', ref_lab_tests: '', ref_lab_accession: '',
    ref_lab_status: '', diagnostic_summary: '', clinical_correlation: '', interim_treatment: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUserId) return
    setLoading(true)
    setError(null)
    try {
      const { error: dbErr } = await supabase.from('vet_lab_reports').insert({
        ...form,
        user_id: targetUserId
      })
      if (dbErr) throw dbErr
      alert("Veterinary Laboratory Diagnostic Report successfully saved!")
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
            <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Veterinary Laboratory Diagnostic Report</h2>
            <p className="text-sm mt-1" style={{ color: C.neutral500 }}>In-House Hematology, Parasitology & Urinalysis</p>
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

          <form id="lab-report-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>1. General Case & Patient Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Report Date *</label><input required type="date" name="report_date" value={form.report_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Case / Accession Number</label><input type="text" name="case_number" value={form.case_number} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Attending Veterinarian</label><input type="text" name="attending_vet" value={form.attending_vet} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Animal ID / Tag</label><input type="text" name="animal_id" value={form.animal_id} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Species & Breed</label><input type="text" name="species_breed" value={form.species_breed} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Age & Sex</label><input type="text" name="age_sex" value={form.age_sex} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>2. Hematology (Blood Smear)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Collection Method</label><input type="text" name="collection_method" value={form.collection_method} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Smear Quality</label><input type="text" name="smear_quality" value={form.smear_quality} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">RBC Anisocytosis</label><input type="text" name="rbc_anisocytosis" value={form.rbc_anisocytosis} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">RBC Polychromasia</label><input type="text" name="rbc_polychromasia" value={form.rbc_polychromasia} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">RBC Poikilocytosis (Shapes)</label><input type="text" name="rbc_poikilocytosis" value={form.rbc_poikilocytosis} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Nucleated RBCs</label><input type="text" name="rbc_nucleated" value={form.rbc_nucleated} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">WBC Neutrophils</label><input type="text" name="wbc_neutrophils" value={form.wbc_neutrophils} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">WBC Lymphocytes</label><input type="text" name="wbc_lymphocytes" value={form.wbc_lymphocytes} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">WBC Monocytes / Eosinophils / Basophils</label><input type="text" name="wbc_monocytes" value={form.wbc_monocytes} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Platelet Estimation</label><input type="text" name="platelet_estimation" value={form.platelet_estimation} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Blood Parasites / Inclusions</label><input type="text" name="blood_parasites" value={form.blood_parasites} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>3. Parasitology (Fecal Exam)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Collection Method</label><input type="text" name="fecal_collection" value={form.fecal_collection} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Gross Evaluation</label><input type="text" name="fecal_gross" value={form.fecal_gross} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Flotation Findings</label><input type="text" name="fecal_flotation" value={form.fecal_flotation} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Quantitative Count (EPG)</label><input type="text" name="fecal_quantitative" value={form.fecal_quantitative} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Sedimentation (Fluke)</label><input type="text" name="fecal_sedimentation" value={form.fecal_sedimentation} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Direct Smear / Snap Test</label><input type="text" name="fecal_direct_smear" value={form.fecal_direct_smear} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>4. Urinalysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Collection Method</label><input type="text" name="urine_collection" value={form.urine_collection} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Physical (Color/Clarity/USG)</label><input type="text" name="urine_physical" value={form.urine_physical} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">pH</label><input type="text" name="urine_ph" value={form.urine_ph} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Protein</label><input type="text" name="urine_protein" value={form.urine_protein} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Glucose / Ketones / Blood</label><input type="text" name="urine_glucose" value={form.urine_glucose} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Sediment Microscopy</label><input type="text" name="urine_sediment" value={form.urine_sediment} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 5 & 6 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>5 & 6. Reference Lab & Interpretation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Ref Lab Name</label><input type="text" name="ref_lab_name" value={form.ref_lab_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Tests Requested</label><input type="text" name="ref_lab_tests" value={form.ref_lab_tests} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Diagnostic Summary (In-House)</label><textarea name="diagnostic_summary" value={form.diagnostic_summary} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Clinical Correlation</label><textarea name="clinical_correlation" value={form.clinical_correlation} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Interim Treatment Action</label><textarea name="interim_treatment" value={form.interim_treatment} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-white" style={{ borderColor: C.neutral200 }}>
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="lab-report-form" disabled={loading} className="px-6 py-2 rounded-xl text-sm font-bold text-white shadow-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50" style={{ backgroundColor: C.primary600 }}>
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Report'}
          </button>
        </div>

      </div>
    </div>
  )
}
