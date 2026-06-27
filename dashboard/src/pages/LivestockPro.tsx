import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  X, Plus, Search, Calendar, Phone, MapPin, Users,
  MessageSquare, ShieldCheck, Activity, BarChart3, Layers, CheckCircle2
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  primary300: '#C3E39D', primary500: '#7AC142', primary600: '#639A34', primary50: '#F0F9EB',
  secondary500: '#8B7429',
  accent500: '#FF9E2C',
  success500: '#43B97C', success600: '#359563', success50: '#E6F9F1',
  warning500: '#FFC107',
  error500: '#E74C3C',
  neutral50:  '#F8F9FA', neutral100: '#E9ECEF', neutral200: '#DEE2E6',
  neutral300: '#CED4DA', neutral400: '#ADB5BD',
  neutral500: '#6C757D', neutral600: '#495057',
  neutral700: '#343A40', neutral800: '#212529', neutral900: '#121416',
  white: '#FFFFFF',
}

interface Mission {
  id: string
  mission_number: string
  date: string
  visit_category: string
  farm_name: string
  client_phone: string
  province: string
  attending_team: string
  review_client: string
  created_at: string
}

type Tab = 'missions' | 'coverage'

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'missions', label: 'Missions Register', icon: Layers },
  { key: 'coverage',  label: 'Coverage Analysis',  icon: BarChart3 },
]

export default function LivestockPro() {
  const { profile, farmers } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [activeTab, setActiveTab] = useState<Tab>('missions')
  const [missions, setMissions] = useState<Mission[]>([])
  const [animalsCount, setAnimalsCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedProvince, setSelectedProvince] = useState('All')
  const [selectedTeam, setSelectedTeam] = useState('All')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newMission, setNewMission] = useState({
    mission_number: '',
    date: new Date().toISOString().split('T')[0],
    visit_category: 'Vaccination',
    farm_name: '',
    client_phone: '',
    province: '',
    attending_team: 'Team Vet',
    review_client: '',
    user_id: ''
  })

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [mRes, aRes] = await Promise.all([
        supabase.from('missions').select('*').order('date', { ascending: false }),
        supabase.from('animals').select('id', { count: 'estimated' })
      ])

      setMissions(mRes.data ?? [])
      setAnimalsCount(aRes.count ?? 0)
    } catch (e) {
      console.error("Error loading Livestock Pro data:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-generate mission number when modal opens
  const openAddModal = () => {
    const nextNum = missions.length + 1
    const padNum = String(nextNum).padStart(3, '0')
    setNewMission({
      mission_number: `MIS-${padNum}`,
      date: new Date().toISOString().split('T')[0],
      visit_category: 'Vaccination',
      farm_name: '',
      client_phone: '',
      province: '',
      attending_team: 'Team Vet',
      review_client: '',
      user_id: ''
    })
    setIsAddModalOpen(true)
  }

  // Handle Add Mission Submit
  const handleAddMission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMission.user_id) {
      alert("Please select a farmer from the database.")
      return
    }
    if (!newMission.mission_number || !newMission.date || !newMission.farm_name || !newMission.province) {
      alert("Please fill in all required fields.")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        mission_number: newMission.mission_number,
        date: newMission.date,
        visit_category: newMission.visit_category,
        farm_name: newMission.farm_name,
        client_phone: newMission.client_phone || null,
        province: newMission.province,
        attending_team: newMission.attending_team,
        review_client: newMission.review_client || null,
        user_id: newMission.user_id
      }
      const { error } = await supabase.from('missions').insert([payload])
      if (error) throw error

      setIsAddModalOpen(false)
      fetchData()
    } catch (err: any) {
      console.error("Error creating mission:", err)
      alert(err.message || "Failed to create mission record.")
    } finally {
      setSubmitting(false)
    }
  }

  // Filter lists
  const categories = useMemo(() => {
    const list = new Set(missions.map(m => m.visit_category))
    return ['All', ...Array.from(list)]
  }, [missions])

  const provinces = useMemo(() => {
    const list = new Set(missions.map(m => m.province))
    return ['All', ...Array.from(list)]
  }, [missions])

  const teams = useMemo(() => {
    const list = new Set(missions.map(m => m.attending_team))
    return ['All', ...Array.from(list)]
  }, [missions])

  // Filtered Missions
  const filteredMissions = useMemo(() => {
    return missions.filter(m => {
      const matchSearch = m.farm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.mission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.client_phone || '').includes(searchQuery)
      const matchCat = selectedCategory === 'All' || m.visit_category === selectedCategory
      const matchProv = selectedProvince === 'All' || m.province === selectedProvince
      const matchTeam = selectedTeam === 'All' || m.attending_team === selectedTeam
      return matchSearch && matchCat && matchProv && matchTeam
    })
  }, [missions, searchQuery, selectedCategory, selectedProvince, selectedTeam])

  // Coverage computations
  const totalFarms = useMemo(() => {
    return new Set(missions.map(m => m.farm_name.toLowerCase().trim())).size
  }, [missions])

  // Aggregate monthly trend for AreaChart
  const monthlyTrendData = useMemo(() => {
    const counts: Record<string, number> = {}
    // Get last 6 months list or aggregate all
    missions.forEach(m => {
      if (!m.date) return
      const d = new Date(m.date)
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      counts[label] = (counts[label] || 0) + 1
    })

    return Object.entries(counts)
      .map(([month, count]) => ({ month, count }))
      .reverse() // Display chronological order
  }, [missions])

  // Aggregate missions by province for BarChart
  const provinceDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    missions.forEach(m => {
      if (!m.province) return
      counts[m.province] = (counts[m.province] || 0) + 1
    })
    return Object.entries(counts).map(([province, count]) => ({ province, count }))
  }, [missions])

  // Top visit reason/issue by Province
  const hotTopics = useMemo(() => {
    const provinceMap: Record<string, Record<string, number>> = {}
    missions.forEach(m => {
      if (!m.province || !m.visit_category) return
      if (!provinceMap[m.province]) {
        provinceMap[m.province] = {}
      }
      provinceMap[m.province][m.visit_category] = (provinceMap[m.province][m.visit_category] || 0) + 1
    })

    return Object.entries(provinceMap).map(([province, catCounts]) => {
      const topIssue = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]
      return {
        province,
        issue: topIssue ? topIssue[0] : 'None',
        count: topIssue ? topIssue[1] : 0
      }
    })
  }, [missions])

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-6 text-center bg-white rounded-2xl border shadow-sm" style={{ borderColor: C.neutral200 }}>
        <ShieldCheck size={48} style={{ color: C.error500 }} className="mb-4" />
        <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>Access Restricted</h3>
        <p className="text-sm mt-1 max-w-sm text-neutral-500">
          This portal is reserved for System Administrators. If you believe this is an error, please contact support.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.neutral900 }}>
            <ShieldCheck size={22} style={{ color: C.primary500 }} /> Livestock Pro
          </h2>
          <p className="text-sm mt-0.5" style={{ color: C.neutral500 }}>Admin Mission Register &amp; Regional Coverage Analytics</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ backgroundColor: C.primary500 }}
        >
          <Plus size={16} /> Log Mission Visit
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b" style={{ borderColor: C.neutral200 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all mr-1 whitespace-nowrap"
            style={activeTab === key
              ? { color: C.primary500, borderBottom: `2px solid ${C.primary500}`, marginBottom: -1 }
              : { color: C.neutral600 }}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 border rounded-2xl bg-white shadow-sm" style={{ borderColor: C.neutral100 }}>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: C.primary500, borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <>
          {/* ── Tab A: Missions Register ────────────────────────────────────── */}
          {activeTab === 'missions' && (
            <div className="space-y-4">
              {/* Filtering Controls */}
              <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end shadow-sm">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral500 }}>Search Visit</label>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 border bg-white" style={{ borderColor: C.neutral200 }}>
                    <Search size={15} style={{ color: C.neutral400 }} />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Number, farm or client phone..."
                      className="text-xs bg-transparent outline-none flex-1"
                      style={{ color: C.neutral900 }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral500 }}>Visit Category</label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full text-xs rounded-xl px-3 py-2 border outline-none bg-white cursor-pointer"
                    style={{ borderColor: C.neutral200, color: C.neutral700 }}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral500 }}>Province / Region</label>
                  <select
                    value={selectedProvince}
                    onChange={e => setSelectedProvince(e.target.value)}
                    className="w-full text-xs rounded-xl px-3 py-2 border outline-none bg-white cursor-pointer"
                    style={{ borderColor: C.neutral200, color: C.neutral700 }}
                  >
                    {provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral500 }}>Attending Team</label>
                  <select
                    value={selectedTeam}
                    onChange={e => setSelectedTeam(e.target.value)}
                    className="w-full text-xs rounded-xl px-3 py-2 border outline-none bg-white cursor-pointer"
                    style={{ borderColor: C.neutral200, color: C.neutral700 }}
                  >
                    {teams.map(team => <option key={team} value={team}>{team}</option>)}
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="card p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="px-6 py-4 border-b font-semibold text-sm bg-neutral-50/50 flex justify-between items-center" style={{ borderColor: C.neutral100 }}>
                  <span style={{ color: C.neutral900 }}>Missions Logs ({filteredMissions.length})</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full data-table" style={{ minWidth: '1000px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>Count</th>
                        <th>Mission Number</th>
                        <th>Date</th>
                        <th>Visit Category</th>
                        <th>Farm Name</th>
                        <th>Client Phone</th>
                        <th>Province</th>
                        <th>Attending Team</th>
                        <th>Review (Client)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMissions.map((row, index) => (
                        <tr key={row.id}>
                          <td className="text-center font-medium" style={{ color: C.neutral500 }}>{index + 1}</td>
                          <td className="font-semibold" style={{ color: C.neutral900 }}>
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ backgroundColor: C.primary50, color: C.primary600 }}>
                              {row.mission_number}
                            </span>
                          </td>
                          <td style={{ color: C.neutral600 }}>{row.date}</td>
                          <td className="font-semibold" style={{ color: C.neutral700 }}>{row.visit_category}</td>
                          <td className="font-bold" style={{ color: C.neutral900 }}>{row.farm_name}</td>
                          <td style={{ color: C.neutral600 }}>{row.client_phone || '—'}</td>
                          <td style={{ color: C.neutral700 }}>
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} style={{ color: C.neutral400 }} />
                              {row.province}
                            </span>
                          </td>
                          <td style={{ color: C.neutral700 }}>{row.attending_team}</td>
                          <td style={{ color: C.neutral500, maxWidth: '250px' }} className="truncate" title={row.review_client || undefined}>
                            {row.review_client || '—'}
                          </td>
                        </tr>
                      ))}
                      {filteredMissions.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center py-12" style={{ color: C.neutral400 }}>
                            No mission logs found matching the filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab B: Coverage Analysis ───────────────────────────────────── */}
          {activeTab === 'coverage' && (
            <div className="space-y-6">
              {/* Coverage Totals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.neutral500 }}>Total Missions Logged</p>
                    <p className="text-3xl font-extrabold mt-1" style={{ color: C.primary600 }}>{missions.length}</p>
                  </div>
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: C.primary50 }}>
                    <Activity size={24} style={{ color: C.primary500 }} />
                  </div>
                </div>

                <div className="card p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.neutral500 }}>Farms/Clients Visited</p>
                    <p className="text-3xl font-extrabold mt-1" style={{ color: C.accent500 }}>{totalFarms}</p>
                  </div>
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: '#FFF5EB' }}>
                    <Users size={24} style={{ color: C.accent500 }} />
                  </div>
                </div>

                <div className="card p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.neutral500 }}>Total Registered Animals</p>
                    <p className="text-3xl font-extrabold mt-1" style={{ color: C.success600 }}>{animalsCount}</p>
                  </div>
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: C.success50 }}>
                    <Layers size={24} style={{ color: C.success500 }} />
                  </div>
                </div>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Missions Trend Chart */}
                <div className="card p-5 shadow-sm">
                  <p className="font-bold text-sm mb-4" style={{ color: C.neutral900 }}>Missions Over Time (Trend)</p>
                  <div className="h-64">
                    {monthlyTrendData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-xs text-neutral-400">No missions data available.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={C.primary500} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={C.primary500} stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.neutral100} />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.neutral500 }} />
                          <YAxis tick={{ fontSize: 10, fill: C.neutral500 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: '12px', border: `1px solid ${C.neutral200}` }} />
                          <Area type="monotone" dataKey="count" stroke={C.primary500} strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="Missions" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Distribution per Province */}
                <div className="card p-5 shadow-sm">
                  <p className="font-bold text-sm mb-4" style={{ color: C.neutral900 }}>Missions Distribution by Province</p>
                  <div className="h-64">
                    {provinceDistribution.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-xs text-neutral-400">No province distribution data.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={provinceDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.neutral100} />
                          <XAxis dataKey="province" tick={{ fontSize: 10, fill: C.neutral500 }} />
                          <YAxis tick={{ fontSize: 10, fill: C.neutral500 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: '12px', border: `1px solid ${C.neutral200}` }} />
                          <Bar dataKey="count" fill={C.accent500} radius={[6, 6, 0, 0]} name="Missions" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Hot Topics / Top Issue by Region */}
              <div className="card p-5 shadow-sm">
                <p className="font-bold text-sm mb-4" style={{ color: C.neutral900 }}>Regional Hot Topics &amp; Common Visit Issues</p>
                {hotTopics.length === 0 ? (
                  <p className="text-center py-6 text-sm text-neutral-500">No regional data available yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {hotTopics.map(topic => (
                      <div key={topic.province} className="p-4 border rounded-xl flex items-start gap-3 bg-white" style={{ borderColor: C.neutral200 }}>
                        <div className="p-2 rounded-xl" style={{ backgroundColor: C.primary50 }}>
                          <Activity size={16} style={{ color: C.primary600 }} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: C.neutral500 }}>{topic.province}</p>
                          <p className="font-bold text-sm mt-0.5" style={{ color: C.neutral900 }}>{topic.issue}</p>
                          <p className="text-xs text-neutral-400 mt-1">{topic.count} visits registered</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Log Mission Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-white"
            style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
              <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>Log Mission Visit</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-lg">
                <X size={18} style={{ color: C.neutral500 }} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleAddMission} className="overflow-y-auto p-6 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Mission Number *</label>
                  <input
                    required
                    value={newMission.mission_number}
                    onChange={e => setNewMission(prev => ({ ...prev, mission_number: e.target.value }))}
                    placeholder="e.g. MIS-001"
                    className="w-full text-sm rounded-xl px-3 py-2 border outline-none bg-neutral-50/50"
                    style={{ borderColor: C.neutral200, color: C.neutral800 }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Visit Date *</label>
                  <input
                    type="date"
                    required
                    value={newMission.date}
                    onChange={e => setNewMission(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full text-sm rounded-xl px-3 py-2 border outline-none cursor-pointer"
                    style={{ borderColor: C.neutral200, color: C.neutral800 }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Attending Farmer *</label>
                <select
                  required
                  value={newMission.user_id}
                  onChange={e => {
                    const fid = e.target.value
                    const farmer = farmers.find(f => f.id === fid)
                    setNewMission(prev => ({
                      ...prev,
                      user_id: fid,
                      farm_name: farmer?.farm_name || prev.farm_name
                    }))
                  }}
                  className="w-full text-sm rounded-xl px-3 py-2 border outline-none bg-white cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral700 }}
                >
                  <option value="">-- Select Farmer --</option>
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.full_name || f.email} {f.farm_name ? `(${f.farm_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Visit Category *</label>
                <select
                  value={newMission.visit_category}
                  onChange={e => setNewMission(prev => ({ ...prev, visit_category: e.target.value }))}
                  className="w-full text-sm rounded-xl px-3 py-2 border outline-none bg-white cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral700 }}
                >
                  <option value="Vaccination">Vaccination</option>
                  <option value="Check-up">Check-up</option>
                  <option value="Audit">Audit</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Deworming">Deworming</option>
                  <option value="Sick animal check-up">Sick animal check-up</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Farm Name *</label>
                <input
                  required
                  value={newMission.farm_name}
                  onChange={e => setNewMission(prev => ({ ...prev, farm_name: e.target.value }))}
                  placeholder="e.g. Green Valley Farm"
                  className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                  style={{ borderColor: C.neutral200, color: C.neutral800 }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Province / Region *</label>
                  <input
                    required
                    value={newMission.province}
                    onChange={e => setNewMission(prev => ({ ...prev, province: e.target.value }))}
                    placeholder="e.g. Texas, Bavaria, Ontario"
                    className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                    style={{ borderColor: C.neutral200, color: C.neutral800 }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Attending Team *</label>
                  <input
                    required
                    value={newMission.attending_team}
                    onChange={e => setNewMission(prev => ({ ...prev, attending_team: e.target.value }))}
                    placeholder="e.g. Team Alpha"
                    className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                    style={{ borderColor: C.neutral200, color: C.neutral800 }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Client Phone #</label>
                <input
                  value={newMission.client_phone}
                  onChange={e => setNewMission(prev => ({ ...prev, client_phone: e.target.value }))}
                  placeholder="e.g. +1 555-0199"
                  className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                  style={{ borderColor: C.neutral200, color: C.neutral800 }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Client Review / Visit Notes</label>
                <textarea
                  value={newMission.review_client}
                  onChange={e => setNewMission(prev => ({ ...prev, review_client: e.target.value }))}
                  placeholder="Enter any client feedback or observation reviews from this mission..."
                  rows={3}
                  className="w-full text-sm rounded-xl px-3 py-2 border outline-none resize-none"
                  style={{ borderColor: C.neutral200, color: C.neutral800 }}
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: C.neutral100 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-neutral-500 hover:bg-neutral-50"
                  style={{ borderColor: C.neutral200 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: C.primary500 }}
                >
                  {submitting ? "Logging..." : "Log Mission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
