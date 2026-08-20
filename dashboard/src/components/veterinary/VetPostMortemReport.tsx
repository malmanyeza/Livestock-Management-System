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

export default function VetPostMortemReport({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { session, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const targetUserId = profile?.role === 'worker' ? profile.farmer_id : session?.user.id

  const [form, setForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
    case_number: '', pathologist: '', referring_vet: '', client_name: '',
    animal_id: '', species: '', breed: '', sex: '', age: '', weight: '',
    history_summary: '', time_of_death: '', time_of_pm: '', method_of_death: '', storage_history: '',
    bcs: '', hydration: '', mucous_membranes: '', head_cavity: '', integument: '', genitalia: '',
    musculoskeletal: '', body_cavities: '', cardiovascular: '', respiratory: '', digestive: '',
    hepatobiliary: '', spleen_lymph: '', urinary: '', endocrine: '', reproductive: '', nervous: '',
    histopathology: '', microbiology: '', toxicology: '', cytology: '', primary_diagnosis: '',
    secondary_diagnosis: '', tertiary_finding: '', morphological_diagnosis: '', suspected_cause: '', comments: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUserId) return
    setLoading(true)
    setError(null)

    // Convert local datetime strings to ISO for postgres
    const payload = { ...form, user_id: targetUserId }
    if (payload.time_of_death) payload.time_of_death = new Date(payload.time_of_death).toISOString()
    else payload.time_of_death = null as any
    if (payload.time_of_pm) payload.time_of_pm = new Date(payload.time_of_pm).toISOString()
    else payload.time_of_pm = null as any

    try {
      const { error: dbErr } = await supabase.from('vet_post_mortem_reports').insert(payload)
      if (dbErr) throw dbErr
      alert("Veterinary Post-Mortem Report successfully saved!")
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
            <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>Veterinary Post-Mortem Examination Report</h2>
            <p className="text-sm mt-1" style={{ color: C.neutral500 }}>Gross Pathology & Necropsy Findings</p>
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

          <form id="pm-report-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>1. General Admin Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Report Date *</label><input required type="date" name="report_date" value={form.report_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Case Number</label><input type="text" name="case_number" value={form.case_number} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Pathologist / Prosector</label><input type="text" name="pathologist" value={form.pathologist} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Referring Veterinarian</label><input type="text" name="referring_vet" value={form.referring_vet} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Client Name / Farm</label><input type="text" name="client_name" value={form.client_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>2. Animal & History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Animal ID / Tag</label><input type="text" name="animal_id" value={form.animal_id} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Species</label><input type="text" name="species" value={form.species} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Breed</label><input type="text" name="breed" value={form.breed} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Sex</label><input type="text" name="sex" value={form.sex} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Age</label><input type="text" name="age" value={form.age} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Weight</label><input type="text" name="weight" value={form.weight} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">History Summary</label><textarea name="history_summary" value={form.history_summary} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Time of Death</label><input type="datetime-local" name="time_of_death" value={form.time_of_death} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Time of PM Examination</label><input type="datetime-local" name="time_of_pm" value={form.time_of_pm} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Method of Death / Euthanasia</label><input type="text" name="method_of_death" value={form.method_of_death} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Storage History (e.g., chilled, frozen)</label><input type="text" name="storage_history" value={form.storage_history} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>3. External Examination</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Body Condition Score</label><input type="text" name="bcs" value={form.bcs} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Hydration Status</label><input type="text" name="hydration" value={form.hydration} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Mucous Membranes</label><input type="text" name="mucous_membranes" value={form.mucous_membranes} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Head & Oral Cavity</label><input type="text" name="head_cavity" value={form.head_cavity} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Integument / Skin</label><input type="text" name="integument" value={form.integument} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">External Genitalia / Umbilicus</label><input type="text" name="genitalia" value={form.genitalia} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Musculoskeletal</label><input type="text" name="musculoskeletal" value={form.musculoskeletal} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>4. Internal Examination (Gross Pathology)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Body Cavities (Fluid, fat)</label><input type="text" name="body_cavities" value={form.body_cavities} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Cardiovascular System</label><input type="text" name="cardiovascular" value={form.cardiovascular} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Respiratory System</label><input type="text" name="respiratory" value={form.respiratory} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Digestive System</label><input type="text" name="digestive" value={form.digestive} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Hepatobiliary System (Liver/Gallbladder)</label><input type="text" name="hepatobiliary" value={form.hepatobiliary} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Spleen & Lymph Nodes</label><input type="text" name="spleen_lymph" value={form.spleen_lymph} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Urinary System</label><input type="text" name="urinary" value={form.urinary} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Endocrine System</label><input type="text" name="endocrine" value={form.endocrine} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Reproductive System</label><input type="text" name="reproductive" value={form.reproductive} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Nervous System</label><input type="text" name="nervous" value={form.nervous} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>5. Ancillary Testing (Samples Submitted)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Histopathology</label><input type="text" name="histopathology" value={form.histopathology} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Microbiology (Bact/Viral)</label><input type="text" name="microbiology" value={form.microbiology} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Toxicology</label><input type="text" name="toxicology" value={form.toxicology} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">Cytology / Parasitology</label><input type="text" name="cytology" value={form.cytology} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
              <h3 className="font-bold text-lg mb-4 border-b pb-2" style={{ color: C.neutral900 }}>6. Conclusions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Primary Diagnosis</label><input type="text" name="primary_diagnosis" value={form.primary_diagnosis} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Secondary Diagnosis</label><input type="text" name="secondary_diagnosis" value={form.secondary_diagnosis} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Tertiary Finding(s)</label><input type="text" name="tertiary_finding" value={form.tertiary_finding} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Morphological Diagnosis</label><textarea name="morphological_diagnosis" value={form.morphological_diagnosis} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Suspected Cause of Death</label><textarea name="suspected_cause" value={form.suspected_cause} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Comments / Recommendations</label><textarea name="comments" value={form.comments} onChange={handleChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-white" style={{ borderColor: C.neutral200 }}>
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="pm-report-form" disabled={loading} className="px-6 py-2 rounded-xl text-sm font-bold text-white shadow-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50" style={{ backgroundColor: C.primary600 }}>
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Report'}
          </button>
        </div>

      </div>
    </div>
  )
}
