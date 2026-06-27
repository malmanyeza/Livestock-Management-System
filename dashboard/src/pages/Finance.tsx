import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react'

interface Transaction {
  id: string;
  date?: string;
  type?: string;
  amount?: number;
  description?: string;
  category?: string;
}

interface Animal {
  id: string;
  tag: string;
  breed?: string;
  stock_type?: string;
}

export default function Finance() {
  const { targetUserId } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  // Form states
  const [formDate, setFormDate] = useState('')
  const [formType, setFormType] = useState('Sale')
  const [formAmount, setFormAmount] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formAnimalTag, setFormAnimalTag] = useState('')

  const fetchFinancials = () => {
    if (!targetUserId) return
    setLoading(true)
    Promise.all([
      supabase.from('transaction_records').select('*').eq('user_id', targetUserId).order('date', { ascending: false }),
      supabase.from('animals').select('*').eq('user_id', targetUserId).order('tag'),
    ]).then(([txs, anims]) => {
      setTransactions(txs.data ?? [])
      setAnimals(anims.data ?? [])
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchFinancials()
  }, [targetUserId])

  // Support both Income/Expense and Sale/Purchase
  const sales = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Sale' || t.type === 'Income')
      .reduce((s, t) => s + Math.abs(t.amount ?? 0), 0)
  }, [transactions])

  const purchases = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Purchase' || t.type === 'Expense')
      .reduce((s, t) => s + Math.abs(t.amount ?? 0), 0)
  }, [transactions])

  const net = sales - purchases

  // Group by month
  const monthly: Record<string, { income: number; expense: number }> = {}
  transactions.forEach(t => {
    if (!t.date) return
    const key = t.date.substring(0, 7)
    if (!monthly[key]) monthly[key] = { income: 0, expense: 0 }
    const amt = Math.abs(t.amount ?? 0)
    if (t.type === 'Sale' || t.type === 'Income') {
      monthly[key].income += amt
    } else {
      monthly[key].expense += amt
    }
  })
  const chartData = Object.entries(monthly).sort().slice(-6).map(([month, vals]) => ({
    month, ...vals
  }))

  const fmt = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

  const handleOpenAdd = () => {
    setFormDate(new Date().toISOString().split('T')[0])
    setFormType('Sale')
    setFormAmount('')
    setFormDesc('')
    setFormCategory('Livestock')
    setFormAnimalTag('')
    setIsAddOpen(true)
  }

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setFormDate(tx.date || '')
    setFormType(tx.type || 'Sale')
    setFormAmount(Math.abs(tx.amount || 0).toString())
    setFormDesc(tx.description || '')
    setFormCategory(tx.category || '')
    setFormAnimalTag('')
    setIsEditOpen(true)
  }

  const handleSaveAdd = async () => {
    if (!targetUserId) return
    const amt = parseFloat(formAmount)
    if (isNaN(amt) || !formDesc.trim() || !formDate) {
      alert('Please fill out all required fields.')
      return
    }
    setSaving(true)
    try {
      // 1. If Sale and selected animal, remove from register
      if (formType === 'Sale' && formAnimalTag) {
        const { error: delErr } = await supabase
          .from('animals')
          .delete()
          .eq('tag', formAnimalTag)
        if (delErr) console.warn("Error deleting sold animal:", delErr)
      }

      // 2. Insert transaction
      const { error } = await supabase.from('transaction_records').insert({
        user_id: targetUserId,
        date: formDate,
        type: formType,
        amount: formType === 'Sale' ? Math.abs(amt) : -Math.abs(amt),
        description: formDesc,
        category: formCategory,
      })

      if (error) throw error
      setIsAddOpen(false)
      fetchFinancials()
    } catch (err: any) {
      alert('Error saving record: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingTx) return
    const amt = parseFloat(formAmount)
    if (isNaN(amt) || !formDesc.trim() || !formDate) {
      alert('Please fill out all required fields.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('transaction_records')
        .update({
          date: formDate,
          type: formType,
          amount: formType === 'Sale' ? Math.abs(amt) : -Math.abs(amt),
          description: formDesc,
          category: formCategory,
        })
        .eq('id', editingTx.id)

      if (error) throw error
      setIsEditOpen(false)
      setEditingTx(null)
      fetchFinancials()
    } catch (err: any) {
      alert('Error updating record: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this financial record?')) return
    try {
      const { error } = await supabase
        .from('transaction_records')
        .delete()
        .eq('id', id)
      if (error) throw error
      fetchFinancials()
    } catch (err: any) {
      alert('Error deleting record: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Finance</h2>
          <p className="text-neutral-500 text-sm mt-0.5">{transactions.length} transactions recorded</p>
        </div>
        <button onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all bg-[#7AC142]">
          <Plus size={16} /> Add Record
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-white border border-neutral-100 shadow-sm p-5 rounded-2xl">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-[#43B97C]">{fmt(sales)}</p>
        </div>
        <div className="card bg-white border border-neutral-100 shadow-sm p-5 rounded-2xl">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Total Purchases</p>
          <p className="text-2xl font-bold text-[#E74C3C]">{fmt(purchases)}</p>
        </div>
        <div className="card bg-white border border-neutral-100 shadow-sm p-5 rounded-2xl">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Net Profit / Loss</p>
          <p className={`text-2xl font-bold ${net >= 0 ? 'text-[#7AC142]' : 'text-[#E74C3C]'}`}>{fmt(net)}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-700 mb-4">Monthly Cash Flow (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#1f2937' }} />
              <Bar dataKey="income" name="Sales / Income" fill="#43B97C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Purchases / Expense" fill="#E74C3C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden bg-white rounded-2xl border border-neutral-100 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-[#7AC142] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table" style={{ minWidth: '100%' }}>
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50">
                  {['Date','Type','Category','Description','Amount','Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transactions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-neutral-400">No transactions found</td></tr>
                ) : transactions.slice(0, 50).map(t => (
                  <tr key={t.id} className="transition-colors">
                    <td className="px-5 py-3.5 text-neutral-600">{t.date || '—'}</td>
                    <td className="px-5 py-3.5">
                      {t.type && (
                        <span className={t.type === 'Sale' || t.type === 'Income' ? 'badge-green' : 'badge-red'}>{t.type}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-600">{t.category || '—'}</td>
                    <td className="px-5 py-3.5 text-neutral-800 font-medium">{t.description || '—'}</td>
                    <td className={`px-5 py-3.5 font-semibold ${t.type === 'Sale' || t.type === 'Income' ? 'text-[#43B97C]' : 'text-[#E74C3C]'}`}>
                      {t.amount != null ? fmt(t.amount) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-400">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleOpenEdit(t)} className="p-1 text-neutral-500 hover:text-neutral-900 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1 text-neutral-400 hover:text-[#E74C3C] transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white border border-neutral-200 flex flex-col p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">Add Financial Entry</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Date *</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="field-input" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Type *</label>
                <div className="flex gap-2">
                  {['Sale', 'Purchase'].map(t => (
                    <button key={t} onClick={() => setFormType(t)}
                      className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-all ${formType === t ? 'bg-[#F0F9EB] border-[#7AC142] text-[#639A34]' : 'bg-neutral-50 border-neutral-200 text-neutral-500'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {formType === 'Sale' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Select Animal to Sell (Optional)</label>
                  <select value={formAnimalTag} onChange={e => setFormAnimalTag(e.target.value)}
                    className="field-input">
                    <option value="">Select an animal...</option>
                    {animals.map(a => (
                      <option key={a.id} value={a.tag}>{a.tag} ({a.breed || 'Unknown'} - {a.stock_type || 'Unknown'})</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[#FF9E2C]">
                    <AlertCircle size={12} />
                    <p className="text-[10px] font-medium">Selling this animal will automatically remove it from the Herd Register.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Category</label>
                <input type="text" value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="e.g. Livestock, Feed, Vet"
                  className="field-input" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Description *</label>
                <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="e.g. Sold Brahman cow"
                  className="field-input" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Amount ($) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">$</span>
                  <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0.00"
                    className="field-input pl-8" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-neutral-100">
              <button onClick={() => setIsAddOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveAdd} disabled={saving || !formDesc.trim() || !formAmount}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#7AC142] hover:bg-[#639A34] text-white transition-colors duration-150 disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white border border-neutral-200 flex flex-col p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">Edit Financial Entry</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Date *</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="field-input" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Type *</label>
                <div className="flex gap-2">
                  {['Sale', 'Purchase'].map(t => (
                    <button key={t} onClick={() => setFormType(t)}
                      className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-all ${formType === t ? 'bg-[#F0F9EB] border-[#7AC142] text-[#639A34]' : 'bg-neutral-50 border-neutral-200 text-neutral-500'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Category</label>
                <input type="text" value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="e.g. Livestock, Feed, Vet"
                  className="field-input" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Description *</label>
                <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="e.g. Sold Brahman cow"
                  className="field-input" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Amount ($) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">$</span>
                  <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0.00"
                    className="field-input pl-8" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-neutral-100">
              <button onClick={() => setIsEditOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={saving || !formDesc.trim() || !formAmount}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#7AC142] hover:bg-[#639A34] text-white transition-colors duration-150 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
