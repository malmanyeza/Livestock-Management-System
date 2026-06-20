import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, XCircle } from 'lucide-react'

interface Drug {
  id: string; name?: string; drug_class?: string; type?: string
  withdrawal_period?: string; pregnancy_safe?: string; stock_status?: string
  created_at?: string
}

export default function Drugs() {
  const { targetUserId } = useAuth()
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    supabase.from('drugs').select('*').eq('user_id', targetUserId)
      .order('name').then(({ data }) => { setDrugs(data ?? []); setLoading(false) })
  }, [targetUserId])

  const inStock = drugs.filter(d => d.stock_status === 'In Stock').length

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Drug Register</h2>
          <p className="text-gray-400 text-sm mt-0.5">{drugs.length} drugs · {inStock} in stock</p>
        </div>
        <div className="flex gap-3">
          <div className="card-sm border border-primary-800 text-center px-5">
            <p className="text-2xl font-bold text-primary-400">{inStock}</p>
            <p className="text-xs text-gray-400 mt-0.5">In Stock</p>
          </div>
          <div className="card-sm border border-red-800 text-center px-5">
            <p className="text-2xl font-bold text-red-400">{drugs.length - inStock}</p>
            <p className="text-xs text-gray-400 mt-0.5">Out of Stock</p>
          </div>
        </div>
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
                  {['Name','Class','Type','Withdrawal Period','Preg. Safe','Stock','Added'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {drugs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-500">No drugs registered</td></tr>
                ) : drugs.map(d => (
                  <tr key={d.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{d.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{d.drug_class || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{d.type || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{d.withdrawal_period || '—'}</td>
                    <td className="px-4 py-3">
                      {d.pregnancy_safe === 'Yes'
                        ? <CheckCircle size={16} className="text-primary-400" />
                        : <XCircle size={16} className="text-red-400" />}
                    </td>
                    <td className="px-4 py-3">
                      <span className={d.stock_status === 'In Stock' ? 'badge-green' : 'badge-red'}>
                        {d.stock_status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
                    </td>
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
