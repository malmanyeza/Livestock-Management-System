import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { X, Calendar, Activity, Weight, Heart, Dna, ArrowRight } from 'lucide-react'
import ExportButton from './pdf/ExportButton'
import AnimalProfilePDF from './pdf/AnimalProfilePDF'

interface Animal {
  id: string
  tag: string
  breed: string
  sex: string
  stock_type: string
  source: string
  age: string
  date_of_birth: string
  weight?: number
  bcs?: number
  sire?: string
  dam?: string
  birth_weight?: string
  date_of_weaning?: string
  weaning_weight?: number
  description?: string
  user_id: string
}

interface TimelineEvent {
  date: string
  type: 'birth' | 'breeding' | 'pregnancy' | 'health' | 'weight' | 'mortality'
  title: string
  details: string
}

export default function AnimalProfileModal({
  animal,
  onClose
}: {
  animal: Animal
  onClose: () => void
}) {
  const { farmers } = useAuth()
  const [loading, setLoading] = useState(true)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [pedigree, setPedigree] = useState({
    dam: animal.dam || '',
    damDam: '',
    damSire: '',
    sire: animal.sire || '',
    sireDam: '',
    sireSire: '',
    sireSireSire: '',
    sireSireDam: '',
    sireDamSire: '',
    sireDamDam: '',
    damSireSire: '',
    damSireDam: '',
    damDamSire: '',
    damDamDam: ''
  })
  const [isEditingPedigree, setIsEditingPedigree] = useState(false)
  const [editPedigree, setEditPedigree] = useState({
    dam: '',
    damDam: '',
    damSire: '',
    sire: '',
    sireDam: '',
    sireSire: '',
    sireSireSire: '',
    sireSireDam: '',
    sireDamSire: '',
    sireDamDam: '',
    damSireSire: '',
    damSireDam: '',
    damDamSire: '',
    damDamDam: ''
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true)
      try {
        const events: TimelineEvent[] = []

        // 1. Add Birth Event
        if (animal.date_of_birth) {
          events.push({
            date: animal.date_of_birth,
            type: 'birth',
            title: 'Animal Registered (Born)',
            details: `Registered breed ${animal.breed || 'unknown'} (${animal.sex}). Birth weight: ${animal.birth_weight ? `${animal.birth_weight} kg` : 'N/A'}`
          })
        }

        // 2. Fetch Health Records
        const { data: health } = await supabase
          .from('health_records')
          .select('*')
          .eq('user_id', animal.user_id)
          .eq('animal_tag', animal.tag)
        if (health) {
          health.forEach(h => {
            events.push({
              date: h.date,
              type: 'health',
              title: `Health Treatment: ${h.treatment}`,
              details: `Status: ${h.status}. Done by: ${h.done_by || 'Unknown'}. Notes: ${h.special_notes || 'None'}`
            })
          })
        }

        // 3. Fetch Breeding Records
        const { data: breeding } = await supabase
          .from('breeding_records')
          .select('*')
          .eq('user_id', animal.user_id)
          .eq('ear_tag_number', animal.tag)
        if (breeding) {
          breeding.forEach(b => {
            events.push({
              date: b.heat_detection_date,
              type: 'breeding',
              title: 'Bred / Serviced',
              details: `Status: ${b.breeding_status}. Method: ${b.breeding_method || 'N/A'}. Sire ID: ${b.sire_id || 'N/A'}. Observer: ${b.observer}`
            })
          })
        }

        // 4. Fetch Pregnancy/Calving Records
        const { data: preg } = await supabase
          .from('pregnancy_records')
          .select('*')
          .eq('user_id', animal.user_id)
          .eq('cow_ear_tag', animal.tag)
        if (preg) {
          preg.forEach(p => {
            if (p.expected_calving_date) {
              events.push({
                date: p.expected_calving_date,
                type: 'pregnancy',
                title: 'Expected Calving Date',
                details: `Based on service: ${p.last_service_date}`
              })
            }
            if (p.actual_calving_date) {
              events.push({
                date: p.actual_calving_date,
                type: 'pregnancy',
                title: 'Gave Birth (Calved)',
                details: `Delivered ${p.calf_sex || 'unknown'} calf (ID: ${p.calf_id || 'N/A'}) via ${p.delivery_type || 'Natural'}`
              })
            }
          })
        }

        // 5. Fetch Weight Records
        const { data: weights } = await supabase
          .from('animal_weights')
          .select('*')
          .eq('user_id', animal.user_id)
          .eq('animal_tag', animal.tag)
        if (weights) {
          const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
          weights.forEach(w => {
            months.forEach((m, idx) => {
              if (w[m]) {
                const monthName = m.toUpperCase()
                events.push({
                  date: `${w.year}-${String(idx + 1).padStart(2, '0')}-01`,
                  type: 'weight',
                  title: 'Weight Logged',
                  details: `Recorded weight: ${w[m]} kg (Year ${w.year}, ${monthName})`
                })
              }
            })
          })
        }

        // 6. Fetch Mortality
        const { data: mort } = await supabase
          .from('mortality_records')
          .select('*')
          .eq('user_id', animal.user_id)
          .eq('animal_tag', animal.tag)
        if (mort && mort.length > 0) {
          events.push({
            date: mort[0].date,
            type: 'mortality',
            title: 'Animal Deceased',
            details: `Cause: ${mort[0].cause}. Description: ${mort[0].description || 'None'}. Observer: ${mort[0].observer || 'Unknown'}`
          })
        }

        // Sort events chronologically
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setTimeline(events)

        // 7. Resolve 4-Generation Pedigree Tree
        let damDam = ''
        let damSire = ''
        let sireDam = ''
        let sireSire = ''
        let sireSireSire = ''
        let sireSireDam = ''
        let sireDamSire = ''
        let sireDamDam = ''
        let damSireSire = ''
        let damSireDam = ''
        let damDamSire = ''
        let damDamDam = ''

        const fetchParents = async (tag: string) => {
          if (!tag) return null;
          const { data } = await supabase
            .from('animals')
            .select('tag, sire, dam')
            .eq('user_id', animal.user_id)
            .eq('tag', tag)
            .limit(1)
            .maybeSingle()
          return data;
        };

        if (animal.dam) {
          const damObj = await fetchParents(animal.dam);
          if (damObj) {
            damDam = damObj.dam || '';
            damSire = damObj.sire || '';
            
            if (damSire) {
              const damSireObj = await fetchParents(damSire);
              if (damSireObj) {
                damSireSire = damSireObj.sire || '';
                damSireDam = damSireObj.dam || '';
              }
            }
            if (damDam) {
              const damDamObj = await fetchParents(damDam);
              if (damDamObj) {
                damDamSire = damDamObj.sire || '';
                damDamDam = damDamObj.dam || '';
              }
            }
          }
        }

        if (animal.sire) {
          const sireObj = await fetchParents(animal.sire);
          if (sireObj) {
            sireDam = sireObj.dam || '';
            sireSire = sireObj.sire || '';

            if (sireSire) {
              const sireSireObj = await fetchParents(sireSire);
              if (sireSireObj) {
                sireSireSire = sireSireObj.sire || '';
                sireSireDam = sireSireObj.dam || '';
              }
            }
            if (sireDam) {
              const sireDamObj = await fetchParents(sireDam);
              if (sireDamObj) {
                sireDamSire = sireDamObj.sire || '';
                sireDamDam = sireDamObj.dam || '';
              }
            }
          }
        }

        setPedigree({
          dam: animal.dam || '',
          damDam,
          damSire,
          sire: animal.sire || '',
          sireDam,
          sireSire,
          sireSireSire,
          sireSireDam,
          sireDamSire,
          sireDamDam,
          damSireSire,
          damSireDam,
          damDamSire,
          damDamDam
        })

      } catch (e) {
        console.error("Error loading animal profile details:", e)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [animal, refreshTrigger])

  const handleSavePedigree = async () => {
    try {
      const { error: updateSelfError } = await supabase
        .from('animals')
        .update({
          sire: editPedigree.sire || null,
          dam: editPedigree.dam || null
        })
        .eq('id', animal.id)

      if (updateSelfError) throw updateSelfError

      const upsertParent = async (parentTag: string, sex: 'Male' | 'Female', parentSire: string, parentDam: string) => {
        const cleanTag = parentTag.trim();
        if (!cleanTag) return;
        
        const { data: existing } = await supabase
          .from('animals')
          .select('id')
          .eq('user_id', animal.user_id)
          .ilike('tag', cleanTag)
          .limit(1)
          .maybeSingle()

        if (existing) {
          const { error: updateError } = await supabase
            .from('animals')
            .update({
              sire: parentSire || null,
              dam: parentDam || null
            })
            .eq('id', existing.id)
          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase
            .from('animals')
            .insert({
              user_id: animal.user_id,
              tag: cleanTag,
              sex,
              stock_type: sex === 'Male' ? 'Bull' : 'Cow',
              breed: animal.breed || 'Unknown',
              sire: parentSire || null,
              dam: parentDam || null,
              source: 'Purchased',
              production_year: (animal as any).production_year || new Date().getFullYear()
            })
          if (insertError) throw insertError
        }
      }

      if (editPedigree.sire) {
        await upsertParent(editPedigree.sire, 'Male', editPedigree.sireSire, editPedigree.sireDam)
        if (editPedigree.sireSire) {
          await upsertParent(editPedigree.sireSire, 'Male', editPedigree.sireSireSire, editPedigree.sireSireDam)
          if (editPedigree.sireSireSire) await upsertParent(editPedigree.sireSireSire, 'Male', '', '')
          if (editPedigree.sireSireDam) await upsertParent(editPedigree.sireSireDam, 'Female', '', '')
        }
        if (editPedigree.sireDam) {
          await upsertParent(editPedigree.sireDam, 'Female', editPedigree.sireDamSire, editPedigree.sireDamDam)
          if (editPedigree.sireDamSire) await upsertParent(editPedigree.sireDamSire, 'Male', '', '')
          if (editPedigree.sireDamDam) await upsertParent(editPedigree.sireDamDam, 'Female', '', '')
        }
      }
      if (editPedigree.dam) {
        await upsertParent(editPedigree.dam, 'Female', editPedigree.damSire, editPedigree.damDam)
        if (editPedigree.damSire) {
          await upsertParent(editPedigree.damSire, 'Male', editPedigree.damSireSire, editPedigree.damSireDam)
          if (editPedigree.damSireSire) await upsertParent(editPedigree.damSireSire, 'Male', '', '')
          if (editPedigree.damSireDam) await upsertParent(editPedigree.damSireDam, 'Female', '', '')
        }
        if (editPedigree.damDam) {
          await upsertParent(editPedigree.damDam, 'Female', editPedigree.damDamSire, editPedigree.damDamDam)
          if (editPedigree.damDamSire) await upsertParent(editPedigree.damDamSire, 'Male', '', '')
          if (editPedigree.damDamDam) await upsertParent(editPedigree.damDamDam, 'Female', '', '')
        }
      }

      animal.sire = editPedigree.sire
      animal.dam = editPedigree.dam

      setIsEditingPedigree(false)
      setRefreshTrigger(prev => prev + 1)
    } catch (err: any) {
      alert("Error saving pedigree: " + (err.message || err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-black text-gray-900">Animal Profile: {animal.tag}</span>
              <span className={animal.sex === 'Male' ? 'badge-blue' : 'badge-green'}>{animal.sex}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Breed: {animal.breed || 'Unknown'} • Type: {animal.stock_type} • Age: {animal.age || '—'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-10 h-10 border-4 border-[#7AC142] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Loading pedigree & timeline...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Left Column: Pedigree Tree */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    {isEditingPedigree ? 'Edit Pedigree Tree' : '4-Generation Pedigree Tree'}
                  </h4>
                  {isEditingPedigree ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditingPedigree(false)} 
                        className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSavePedigree} 
                        className="text-xs font-semibold px-2 py-1 rounded bg-[#7AC142] text-white hover:opacity-90 transition-opacity"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setEditPedigree({ ...pedigree })
                        setIsEditingPedigree(true)
                      }} 
                      className="text-xs font-semibold text-[#7AC142] hover:underline"
                    >
                      Edit Pedigree
                    </button>
                  )}
                </div>

                {isEditingPedigree ? (
                  <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/40 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-500 font-semibold mb-1">Father / Sire Tag</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white" 
                          value={editPedigree.sire} 
                          onChange={e => setEditPedigree({ ...editPedigree, sire: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 font-semibold mb-1">Mother / Dam Tag</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white" 
                          value={editPedigree.dam} 
                          onChange={e => setEditPedigree({ ...editPedigree, dam: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200/60 my-2 pt-2">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Paternal Grandparents (Father's side)</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Paternal Grandsire</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white" 
                            value={editPedigree.sireSire} 
                            onChange={e => setEditPedigree({ ...editPedigree, sireSire: e.target.value })} 
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Paternal Granddam</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white" 
                            value={editPedigree.sireDam} 
                            onChange={e => setEditPedigree({ ...editPedigree, sireDam: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200/60 my-2 pt-2">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Maternal Grandparents (Mother's side)</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Maternal Grandsire</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white" 
                            value={editPedigree.damSire} 
                            onChange={e => setEditPedigree({ ...editPedigree, damSire: e.target.value })} 
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1">Maternal Granddam</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white" 
                            value={editPedigree.damDam} 
                            onChange={e => setEditPedigree({ ...editPedigree, damDam: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200/60 my-2 pt-2">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Paternal Great-Grandparents</span>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1 text-[9px]">Sire's Sire Sire</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white text-[10px]" value={editPedigree.sireSireSire} onChange={e => setEditPedigree({ ...editPedigree, sireSireSire: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1 text-[9px]">Sire's Sire Dam</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white text-[10px]" value={editPedigree.sireSireDam} onChange={e => setEditPedigree({ ...editPedigree, sireSireDam: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1 text-[9px]">Sire's Dam Sire</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white text-[10px]" value={editPedigree.sireDamSire} onChange={e => setEditPedigree({ ...editPedigree, sireDamSire: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1 text-[9px]">Sire's Dam Dam</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white text-[10px]" value={editPedigree.sireDamDam} onChange={e => setEditPedigree({ ...editPedigree, sireDamDam: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200/60 my-2 pt-2">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Maternal Great-Grandparents</span>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1 text-[9px]">Dam's Sire Sire</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white text-[10px]" value={editPedigree.damSireSire} onChange={e => setEditPedigree({ ...editPedigree, damSireSire: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1 text-[9px]">Dam's Sire Dam</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white text-[10px]" value={editPedigree.damSireDam} onChange={e => setEditPedigree({ ...editPedigree, damSireDam: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1 text-[9px]">Dam's Dam Sire</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white text-[10px]" value={editPedigree.damDamSire} onChange={e => setEditPedigree({ ...editPedigree, damDamSire: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-gray-500 font-semibold mb-1 text-[9px]">Dam's Dam Dam</label>
                          <input type="text" className="w-full p-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#7AC142] bg-white text-[10px]" value={editPedigree.damDamDam} onChange={e => setEditPedigree({ ...editPedigree, damDamDam: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/40 flex flex-col space-y-4">
                    {/* Grid Layout of Genealogy Tree */}
                    <div className="grid grid-cols-4 gap-y-6 gap-x-2 relative text-xs">
                      {/* Level 1: Child */}
                      <div className="col-span-1 flex items-center justify-center">
                        <div className="p-3 rounded-xl border-2 border-[#7AC142] bg-[#F0F9EB] font-bold text-center w-full shadow-sm text-neutral-800">
                          {animal.tag}
                          <span className="block text-[9px] text-[#639A34] font-medium mt-0.5">(Child)</span>
                        </div>
                      </div>

                      {/* Level 2: Parents */}
                      <div className="col-span-1 flex flex-col justify-around space-y-6">
                        {/* Sire */}
                        <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 font-bold text-center shadow-xs text-neutral-800">
                          {pedigree.sire || 'Unknown Sire'}
                          <span className="block text-[9px] text-blue-500 font-medium mt-0.5">(Father)</span>
                        </div>
                        {/* Dam */}
                        <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 font-bold text-center shadow-xs text-neutral-800">
                          {pedigree.dam || 'Unknown Dam'}
                          <span className="block text-[9px] text-emerald-500 font-medium mt-0.5">(Mother)</span>
                        </div>
                      </div>

                      {/* Level 3: Grandparents */}
                      <div className="col-span-1 flex flex-col justify-between space-y-2">
                        {/* Paternal Grandsire */}
                        <div className="p-2 rounded-lg border border-gray-200 bg-white text-center text-gray-700 shadow-xxs">
                          <span className="font-semibold text-[10px]">{pedigree.sireSire || '—'}</span>
                          <span className="block text-[8px] text-gray-400">Paternal Grandsire</span>
                        </div>
                        {/* Paternal Granddam */}
                        <div className="p-2 rounded-lg border border-gray-200 bg-white text-center text-gray-700 shadow-xxs">
                          <span className="font-semibold text-[10px]">{pedigree.sireDam || '—'}</span>
                          <span className="block text-[8px] text-gray-400">Paternal Granddam</span>
                        </div>
                        {/* Maternal Grandsire */}
                        <div className="p-2 rounded-lg border border-gray-200 bg-white text-center text-gray-700 shadow-xxs">
                          <span className="font-semibold text-[10px]">{pedigree.damSire || '—'}</span>
                          <span className="block text-[8px] text-gray-400">Maternal Grandsire</span>
                        </div>
                        {/* Maternal Granddam */}
                        <div className="p-2 rounded-lg border border-gray-200 bg-white text-center text-gray-700 shadow-xxs">
                          <span className="font-semibold text-[10px]">{pedigree.damDam || '—'}</span>
                          <span className="block text-[8px] text-gray-400">Maternal Granddam</span>
                        </div>
                      </div>

                      {/* Level 4: Great-Grandparents */}
                      <div className="col-span-1 flex flex-col justify-between space-y-1">
                        <div className="p-1 rounded border border-gray-100 bg-white text-center shadow-xxs text-[9px]"><span className="font-bold">{pedigree.sireSireSire || '—'}</span></div>
                        <div className="p-1 rounded border border-gray-100 bg-white text-center shadow-xxs text-[9px]"><span className="font-bold">{pedigree.sireSireDam || '—'}</span></div>
                        <div className="p-1 rounded border border-gray-100 bg-white text-center shadow-xxs text-[9px] mt-1"><span className="font-bold">{pedigree.sireDamSire || '—'}</span></div>
                        <div className="p-1 rounded border border-gray-100 bg-white text-center shadow-xxs text-[9px]"><span className="font-bold">{pedigree.sireDamDam || '—'}</span></div>
                        <div className="p-1 rounded border border-gray-100 bg-white text-center shadow-xxs text-[9px] mt-2"><span className="font-bold">{pedigree.damSireSire || '—'}</span></div>
                        <div className="p-1 rounded border border-gray-100 bg-white text-center shadow-xxs text-[9px]"><span className="font-bold">{pedigree.damSireDam || '—'}</span></div>
                        <div className="p-1 rounded border border-gray-100 bg-white text-center shadow-xxs text-[9px] mt-1"><span className="font-bold">{pedigree.damDamSire || '—'}</span></div>
                        <div className="p-1 rounded border border-gray-100 bg-white text-center shadow-xxs text-[9px]"><span className="font-bold">{pedigree.damDamDam || '—'}</span></div>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2 text-center">
                      Note: Connections are resolved dynamically by indexing the Dam and Sire tags inside the system database.
                    </div>
                  </div>
                )}

                {/* Additional Animal Details Card */}
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mt-6">Animal Record Roster Details</h4>
                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/40 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-gray-400 block">Weaning Date</span>
                    <span className="text-gray-900 font-bold text-sm">{animal.date_of_weaning || '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-400 block">Weaning Weight</span>
                    <span className="text-gray-900 font-bold text-sm">{animal.weaning_weight ? `${animal.weaning_weight} kg` : '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-400 block">Current Weight</span>
                    <span className="text-gray-900 font-bold text-sm">{animal.weight ? `${animal.weight} kg` : '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-400 block">Body Condition Score (BCS)</span>
                    <span className="text-gray-900 font-bold text-sm">{animal.bcs ?? '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-400 block">Description / Notes</span>
                    <p className="text-gray-700 mt-0.5 leading-relaxed bg-white p-2.5 rounded-xl border border-gray-100">{animal.description || 'No notes added for this animal.'}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Lifetime Timeline */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Lifetime History Timeline</h4>
                <div className="max-h-[60vh] overflow-y-auto pr-2 pl-4">
                  <div className="relative border-l border-gray-200 pl-8 ml-1 space-y-6">
                    {timeline.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-xs border-none">
                        No historical events recorded for this animal tag.
                      </div>
                    ) : timeline.map((evt, idx) => {
                      let icon = <Calendar size={12} />
                      let iconColor = 'bg-gray-100 text-gray-600 border-gray-200'
                      if (evt.type === 'birth') {
                        icon = <ArrowRight size={12} className="rotate-45" />
                        iconColor = 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      } else if (evt.type === 'health') {
                        icon = <Heart size={12} />
                        iconColor = 'bg-rose-100 text-rose-700 border-rose-200'
                      } else if (evt.type === 'breeding' || evt.type === 'pregnancy') {
                        icon = <Dna size={12} />
                        iconColor = 'bg-blue-100 text-blue-700 border-blue-200'
                      } else if (evt.type === 'weight') {
                        icon = <Weight size={12} />
                        iconColor = 'bg-amber-100 text-amber-700 border-amber-200'
                      } else if (evt.type === 'mortality') {
                        icon = <Activity size={12} />
                        iconColor = 'bg-red-200 text-red-800 border-red-300'
                      }

                      return (
                        <div key={idx} className="relative flex flex-col space-y-1">
                          {/* Timeline Bullet */}
                          <span className={`absolute -left-[45px] top-0.5 rounded-full border p-1.5 flex items-center justify-center shadow-xs ${iconColor}`}>
                            {icon}
                          </span>
                          
                          {/* Event Details */}
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(evt.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="text-sm font-bold text-gray-900 leading-snug">{evt.title}</span>
                          <p className="text-xs text-gray-600 leading-normal">{evt.details}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          {!loading && (() => {
            const farmer = farmers.find(f => f.id === animal.user_id)
            const farmerDetails = farmer ? {
              name: farmer.full_name || farmer.email,
              farm: farmer.farm_name,
              phone: farmer.phone || farmer.phone_number || ''
            } : null;
            return (
              <ExportButton 
                document={<AnimalProfilePDF animal={animal} pedigree={pedigree} timeline={timeline} farmer={farmerDetails} />} 
                fileName={`Profile_${animal.tag}.pdf`} 
              />
            )
          })()}
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:opacity-90 transition-all shadow-sm">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  )
}
