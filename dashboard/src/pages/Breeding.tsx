import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface BreedingRecord {
  id: string; animal_tag?: string; date_served?: string
  breeding_method?: string; sire_used?: string
  pregnancy_status?: string; return_to_heat_date?: string
}

export default function Breeding() {
  const { targetUserId } = useAuth()
  const [records, setRecords] = useState<BreedingRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    supabase.from('breeding_records').select('*').eq('user_id', targetUserId)
      .order('date_served', { ascending: false })
      .then(({ data }) => { setRecords(data ?? []); setLoading(false) })
  }, [targetUserId])

  const aiCount = records.filter(r => r.breeding_method === 'AI').length
  const naturalCount = records.filter(r => r.breeding_method === 'Natural').length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Breeding Records</h2>
        <p className="text-gray-400 text-sm mt-0.5">{records.length} records · {aiCount} AI · {naturalCount} Natural</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: records.length },
          { label: 'AI Inseminations', value: aiCount },
          { label: 'Natural Service', value: naturalCount },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-3xl font-bold text-primary-400">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  {['Animal Tag','Date Served','Method','Sire','Return to Heat'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {records.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-500">No breeding records found</td></tr>
                ) : records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{r.animal_tag || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{r.date_served || '—'}</td>
                    <td className="px-4 py-3">
                      {r.breeding_method && (
                        <span className={r.breeding_method === 'AI' ? 'badge-blue' : 'badge-green'}>
                          {r.breeding_method}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{r.sire_used || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{r.return_to_heat_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
