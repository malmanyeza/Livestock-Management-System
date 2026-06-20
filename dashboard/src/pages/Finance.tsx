import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Transaction {
  id: string; date?: string; type?: string; amount?: number
  description?: string; category?: string
}

export default function Finance() {
  const { targetUserId } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    supabase.from('transaction_records').select('*').eq('user_id', targetUserId)
      .order('date', { ascending: false })
      .then(({ data }) => { setTransactions(data ?? []); setLoading(false) })
  }, [targetUserId])

  const income = transactions.filter(t => t.type === 'Income').reduce((s, t) => s + (t.amount ?? 0), 0)
  const expenses = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + (t.amount ?? 0), 0)
  const net = income - expenses

  // Group by month
  const monthly: Record<string, { income: number; expense: number }> = {}
  transactions.forEach(t => {
    if (!t.date) return
    const key = t.date.substring(0, 7)
    if (!monthly[key]) monthly[key] = { income: 0, expense: 0 }
    if (t.type === 'Income') monthly[key].income += t.amount ?? 0
    else monthly[key].expense += t.amount ?? 0
  })
  const chartData = Object.entries(monthly).sort().slice(-6).map(([month, vals]) => ({
    month, ...vals
  }))

  const fmt = (v: number) => `R ${v.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Finance</h2>
        <p className="text-gray-400 text-sm mt-0.5">{transactions.length} transactions recorded</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card border border-primary-800">
          <p className="text-xs text-gray-400 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-primary-400">{fmt(income)}</p>
        </div>
        <div className="card border border-red-800">
          <p className="text-xs text-gray-400 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400">{fmt(expenses)}</p>
        </div>
        <div className={`card border ${net >= 0 ? 'border-primary-800' : 'border-red-800'}`}>
          <p className="text-xs text-gray-400 mb-1">Net Position</p>
          <p className={`text-2xl font-bold ${net >= 0 ? 'text-primary-400' : 'text-red-400'}`}>{fmt(net)}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Monthly Cash Flow (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }} />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
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
                  {['Date','Type','Category','Description','Amount'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transactions.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-500">No transactions found</td></tr>
                ) : transactions.slice(0, 50).map(t => (
                  <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{t.date || '—'}</td>
                    <td className="px-4 py-3">
                      {t.type && (
                        <span className={t.type === 'Income' ? 'badge-green' : 'badge-red'}>{t.type}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{t.category || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{t.description || '—'}</td>
                    <td className={`px-4 py-3 font-semibold ${t.type === 'Income' ? 'text-primary-400' : 'text-red-400'}`}>
                      {t.amount != null ? fmt(t.amount) : '—'}
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
