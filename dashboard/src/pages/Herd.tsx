import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Search } from 'lucide-react'

interface Animal {
  id: string; tag: string; breed: string; sex: string
  stock_type: string; source: string; age: string
  date_of_birth: string; weight?: number; bcs?: number
  sire?: string; dam?: string; birth_weight?: string
  date_of_weaning?: string; weaning_weight?: number; description?: string
}

export default function Herd() {
  const { targetUserId } = useAuth()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSex, setFilterSex] = useState('')
  const [filterStock, setFilterStock] = useState('')

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    supabase.from('animals').select('*').eq('user_id', targetUserId)
      .order('tag').then(({ data }) => {
        setAnimals(data ?? [])
        setLoading(false)
      })
  }, [targetUserId])

  const filtered = animals.filter(a => {
    const q = search.toLowerCase()
    return (
      (!q || a.tag?.toLowerCase().includes(q) || a.breed?.toLowerCase().includes(q)) &&
      (!filterSex || a.sex === filterSex) &&
      (!filterStock || a.stock_type === filterStock)
    )
  })

  const stockTypes = [...new Set(animals.map(a => a.stock_type).filter(Boolean))]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Herd Register</h2>
          <p className="text-gray-400 text-sm mt-0.5">{animals.length} animals on record</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tag or breed…"
              className="bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 w-52" />
          </div>
          <select value={filterSex} onChange={e => setFilterSex(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            <option value="">All Sexes</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            <option value="">All Types</option>
            {stockTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '1200px' }}>
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  {['Count','Tag','Breed','Sex','Type','Source','Age','DOB','Weight','BCS','Sire','Dam','Birth Wt','Wean Date','Wean Wt','Description'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={16} className="text-center py-10 text-gray-500">No animals found</td></tr>
                ) : filtered.map((a, index) => (
                  <tr key={a.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-medium">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white">{a.tag}</td>
                    <td className="px-4 py-3 text-gray-300">{a.breed || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={a.sex === 'Male' ? 'badge-blue' : 'badge-green'}>{a.sex}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{a.stock_type}</td>
                    <td className="px-4 py-3 text-gray-400">{a.source}</td>
                    <td className="px-4 py-3 text-gray-400">{a.age || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{a.date_of_birth || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{a.weight ? `${a.weight} kg` : '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{a.bcs ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{a.sire || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{a.dam || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{a.birth_weight ? `${a.birth_weight} kg` : '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{a.date_of_weaning || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{a.weaning_weight ? `${a.weaning_weight} kg` : '—'}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{a.description || '—'}</td>
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
