import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { createClient } from '@supabase/supabase-js'
import { Plus, Trash2, User, Key, Search, X, ShieldAlert, Users } from 'lucide-react'

const C = {
  primary50:   '#F0F9EB',
  primary100:  '#DCEFC5',
  primary500:  '#7AC142',
  primary600:  '#639A34',
  neutral50:   '#F8F9FA',
  neutral100:  '#E9ECEF',
  neutral200:  '#DEE2E6',
  neutral300:  '#CED4DA',
  neutral500:  '#6C757D',
  neutral600:  '#495057',
  neutral700:  '#343A40',
  neutral900:  '#121416',
  success50:   '#E6F9F1',
  success500:  '#43B97C',
  success600:  '#359563',
  error50:     '#FDF2F2',
  error500:    '#E74C3C',
  purple50:    '#F5EEF8',
  purple500:   '#8E44AD',
  white:       '#FFFFFF'
}

// Temporary, non-persisted client for worker sign-up
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const workerAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

export default function Workers() {
  const { profile, selectedFarmer } = useAuth()
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [workerName, setWorkerName] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isSystemAdmin = profile?.role === 'admin'
  const targetFarmerId = isSystemAdmin ? selectedFarmer?.id : profile?.id
  const targetFarmerEmail = isSystemAdmin ? selectedFarmer?.email : profile?.email
  const targetFarmerName = isSystemAdmin ? (selectedFarmer?.full_name || selectedFarmer?.email) : (profile?.full_name || profile?.email)

  const fetchWorkers = async () => {
    if (!targetFarmerId) {
      setWorkers([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('farmer_id', targetFarmerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setWorkers(data || [])
    } catch (err) {
      console.error('Error fetching workers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [targetFarmerId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetFarmerEmail || !targetFarmerId) {
      setError('No active farmer selected.')
      return
    }
    if (!workerName.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setSaving(true)
    setError('')
    try {
      // Create unique internal email suffix
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      const sanitizedName = workerName.toLowerCase().replace(/[^a-z0-9]/g, '')
      const authEmail = `${targetFarmerEmail.split('@')[0]}+${sanitizedName}_${randomSuffix}@zvipfuwo.internal`

      // 1. Create Auth user inside auth.users (triggers profile creation)
      const { data: signUpData, error: signUpError } = await workerAuthClient.auth.signUp({
        email: authEmail,
        password: password,
        options: {
          data: {
            full_name: workerName,
            role: 'worker'
          }
        }
      })

      if (signUpError) throw signUpError
      if (!signUpData.user) throw new Error('Worker auth account registration failed.')

      // 2. Log worker in workers database table
      const { error: insertError } = await supabase.from('workers').insert({
        farmer_id: targetFarmerId,
        farmer_email: targetFarmerEmail,
        worker_name: workerName,
        password: password,
        auth_email: authEmail
      })

      if (insertError) throw insertError

      // Reset & refresh
      setWorkerName('')
      setPassword('')
      setShowAddModal(false)
      fetchWorkers()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to save worker.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (worker: any) => {
    if (!window.confirm(`Are you sure you want to delete worker "${worker.worker_name}"? This will immediately revoke their access.`)) return
    try {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', worker.id)
      
      if (error) throw error
      fetchWorkers()
    } catch (err: any) {
      alert('Failed to delete worker: ' + err.message)
    }
  }

  const filteredWorkers = workers.filter(w => 
    w.worker_name.toLowerCase().includes(search.toLowerCase()) ||
    w.auth_email.toLowerCase().includes(search.toLowerCase())
  )

  if (isSystemAdmin && !selectedFarmer) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-6 text-center bg-white rounded-2xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
        <Users size={48} style={{ color: C.purple500 }} className="mb-4" />
        <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>Select a Farmer</h3>
        <p className="text-sm mt-1 max-w-sm text-neutral-500">
          Please select a farmer portal from the top bar dropdown list to view or register their farm workers.
        </p>
      </div>
    )
  }

  if (loading && workers.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.primary500 }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: C.neutral100 }}>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Farm Workers</h2>
          <p className="text-sm mt-0.5 text-neutral-500">
            Add and manage worker credentials linked to {isSystemAdmin ? `${targetFarmerName}'s` : 'your'} farm portal.
          </p>
        </div>
      </div>

      {/* Info Warning Card */}
      <div className="rounded-2xl p-5 border flex items-start gap-4 shadow-sm"
        style={{ backgroundColor: C.purple50, borderColor: '#EBDEF0' }}>
        <div className="p-3 rounded-xl bg-white shadow-sm flex-shrink-0">
          <Key size={24} style={{ color: C.purple500 }} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-neutral-900">How Workers Log In</h4>
          <p className="text-xs leading-relaxed text-neutral-600">
            Workers log in using **the farmer's email address** (<span className="font-semibold">{targetFarmerEmail}</span>) and the **unique password** assigned to them below. 
            Once logged in, they can view and update herd registers, health logs, and events, but **marketplace, financial dashboards, and transaction tabs** will be completely hidden and inaccessible to them.
          </p>
        </div>
      </div>

      {/* Main Section Card */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: C.neutral200 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 border-b" style={{ borderColor: C.neutral100 }}>
          
          <div className="flex items-center gap-2 rounded-xl px-4 py-2 border w-64 text-sm"
            style={{ borderColor: C.neutral200, backgroundColor: C.neutral50 }}>
            <Search size={16} style={{ color: C.neutral500 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search workers..."
              className="bg-transparent outline-none flex-1"
              style={{ color: C.neutral900 }}
            />
            {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: C.neutral500 }} /></button>}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
            style={{ backgroundColor: C.primary500 }}
          >
            <Plus size={16} />
            <span>Add Worker</span>
          </button>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/50" style={{ borderColor: C.neutral100 }}>
                <th className="px-6 py-4">Worker Name</th>
                <th className="px-6 py-4">Farmer Login Email</th>
                <th className="px-6 py-4">Worker Login Password</th>
                <th className="px-6 py-4">Internal Auth Email</th>
                <th className="px-6 py-4">Added Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm font-medium" style={{ borderColor: C.neutral100 }}>
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-500 font-normal">
                    No worker accounts found for this farmer portal.
                  </td>
                </tr>
              ) : filteredWorkers.map(item => (
                <tr key={item.id} className="hover:bg-neutral-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-900 font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-100">
                        <User size={14} style={{ color: C.neutral500 }} />
                      </div>
                      <span>{item.worker_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-600 font-semibold">{item.farmer_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-800 font-mono font-bold">{item.password}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-400 font-mono text-xs">{item.auth_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-500 text-xs">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-500"
                      title="Delete worker"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all bg-white" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
              <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>Register Worker Account</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
              
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Worker Name *</label>
                <input 
                  value={workerName} 
                  onChange={e => setWorkerName(e.target.value)}
                  placeholder="e.g. John"
                  required
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Worker Password *</label>
                <input 
                  type="password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter worker login password"
                  required
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} 
                />
                <p className="text-xs text-neutral-400 mt-1">Minimum 6 characters. This password will be used along with the farmer email to log in.</p>
              </div>

              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: C.neutral100 }}>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)} 
                  className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
                  style={{ backgroundColor: C.neutral100, color: C.neutral700 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: C.primary500, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Creating…' : 'Create Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
