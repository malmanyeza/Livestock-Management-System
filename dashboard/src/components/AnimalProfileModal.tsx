import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, Calendar, Activity, Weight, Heart, Dna, ArrowRight } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [pedigree, setPedigree] = useState({
    dam: animal.dam || '',
    damDam: '',
    damSire: '',
    sire: animal.sire || '',
    sireDam: '',
    sireSire: ''
  })

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

        // 7. Resolve 3-Generation Pedigree Tree (Parents and Grandparents)
        let damDam = ''
        let damSire = ''
        let sireDam = ''
        let sireSire = ''

        if (animal.dam) {
          const { data: damObj } = await supabase
            .from('animals')
            .select('tag, sire, dam')
            .eq('user_id', animal.user_id)
            .eq('tag', animal.dam)
            .limit(1)
            .maybeSingle()
          if (damObj) {
            damDam = damObj.dam || ''
            damSire = damObj.sire || ''
          }
        }

        if (animal.sire) {
          const { data: sireObj } = await supabase
            .from('animals')
            .select('tag, sire, dam')
            .eq('user_id', animal.user_id)
            .eq('tag', animal.sire)
            .limit(1)
            .maybeSingle()
          if (sireObj) {
            sireDam = sireObj.dam || ''
            sireSire = sireObj.sire || ''
          }
        }

        setPedigree({
          dam: animal.dam || '',
          damDam,
          damSire,
          sire: animal.sire || '',
          sireDam,
          sireSire
        })

      } catch (e) {
        console.error("Error loading animal profile details:", e)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [animal])

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
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">3-Generation Pedigree Tree</h4>
                <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/40 flex flex-col space-y-4">
                  {/* Grid Layout of Genealogy Tree */}
                  <div className="grid grid-cols-3 gap-y-6 gap-x-2 relative text-xs">
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
                        <span className="block text-[9px] text-blue-500 font-medium mt-0.5">(Father / Sire)</span>
                      </div>
                      {/* Dam */}
                      <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 font-bold text-center shadow-xs text-neutral-800">
                        {pedigree.dam || 'Unknown Dam'}
                        <span className="block text-[9px] text-emerald-500 font-medium mt-0.5">(Mother / Dam)</span>
                      </div>
                    </div>

                    {/* Level 3: Grandparents */}
                    <div className="col-span-1 flex flex-col justify-between space-y-2">
                      {/* Paternal Grandsire */}
                      <div className="p-2 rounded-lg border border-gray-200 bg-white text-center text-gray-700 shadow-xxs">
                        <span className="font-semibold">{pedigree.sireSire || '—'}</span>
                        <span className="block text-[8px] text-gray-400">Paternal Grandsire</span>
                      </div>
                      {/* Paternal Granddam */}
                      <div className="p-2 rounded-lg border border-gray-200 bg-white text-center text-gray-700 shadow-xxs">
                        <span className="font-semibold">{pedigree.sireDam || '—'}</span>
                        <span className="block text-[8px] text-gray-400">Paternal Granddam</span>
                      </div>
                      {/* Maternal Grandsire */}
                      <div className="p-2 rounded-lg border border-gray-200 bg-white text-center text-gray-700 shadow-xxs">
                        <span className="font-semibold">{pedigree.damSire || '—'}</span>
                        <span className="block text-[8px] text-gray-400">Maternal Grandsire</span>
                      </div>
                      {/* Maternal Granddam */}
                      <div className="p-2 rounded-lg border border-gray-200 bg-white text-center text-gray-700 shadow-xxs">
                        <span className="font-semibold">{pedigree.damDam || '—'}</span>
                        <span className="block text-[8px] text-gray-400">Maternal Granddam</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 text-center">
                    Note: Connections are resolved dynamically by indexing the Dam and Sire tags inside the system database.
                  </div>
                </div>

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
                <div className="relative border-l border-gray-200 pl-6 ml-2 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  {timeline.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs">
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
                        <span className={`absolute -left-[33px] top-0 rounded-full border p-1.5 flex items-center justify-center shadow-xs ${iconColor}`}>
                          {icon}
                        </span>
                        
                        {/* Event Details */}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(evt.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="text-sm font-bold text-gray-900 leading-snug">{evt.title}</span>
                        <p className="text-xs text-gray-600 leading-normal">{evt.details}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:opacity-90 transition-all shadow-sm">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  )
}
