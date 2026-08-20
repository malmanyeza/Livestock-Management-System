import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  X, Plus, Search, Calendar, Phone, MapPin, Users,
  MessageSquare, ShieldCheck, Activity, BarChart3, Layers, CheckCircle2,
  Bell, Trash2, Edit, FileText
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import ExportButton from '../components/pdf/ExportButton'
import VetReportPDF from '../components/pdf/VetReportPDF'
import GenericReportPDF from '../components/pdf/GenericReportPDF'

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

type Tab = 'missions' | 'coverage' | 'reminders' | 'reports' | 'saved_reports'

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'missions', label: 'Missions Register', icon: Layers },
  { key: 'coverage',  label: 'Coverage Analysis',  icon: BarChart3 },
  { key: 'reminders', label: 'Disease & Reminders',  icon: Bell },
  { key: 'reports', label: 'Generate Reports', icon: FileText },
  { key: 'saved_reports', label: 'Report History', icon: FileText },
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<{title: string, desc: string} | null>(null)
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [customCategory, setCustomCategory] = useState('')
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

  // Reminders states
  const [reminderType, setReminderType] = useState<'guideline' | 'outbreak'>('guideline')
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDetails, setReminderDetails] = useState('')
  const [reminderAdvice, setReminderAdvice] = useState('')
  const [reminderTargetFarmerId, setReminderTargetFarmerId] = useState('all')
  const [reminderPriority, setReminderPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [sendingReminder, setSendingReminder] = useState(false)

  // Saved Reports states
  const [savedReports, setSavedReports] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [reportFarmerId, setReportFarmerId] = useState('all')
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [viewReportData, setViewReportData] = useState<{title: string, data: any} | null>(null)

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

  const fetchSavedReports = async () => {
    setLoadingReports(true)
    try {
      // Build base queries
      let qLab = supabase.from('vet_lab_reports').select('*')
      let qConsult = supabase.from('vet_consultation_reports').select('*')
      let qPostMortem = supabase.from('vet_post_mortem_reports').select('*')
      let qAI = supabase.from('vet_ai_reports').select('*')
      let qPregnancy = supabase.from('vet_pregnancy_reports').select('*')
      let qSpecial = supabase.from('vet_special_consult_reports').select('*')

      // Apply farmer filter if not 'all'
      if (reportFarmerId !== 'all') {
        qLab = qLab.eq('user_id', reportFarmerId)
        qConsult = qConsult.eq('user_id', reportFarmerId)
        qPostMortem = qPostMortem.eq('user_id', reportFarmerId)
        qAI = qAI.eq('user_id', reportFarmerId)
        qPregnancy = qPregnancy.eq('user_id', reportFarmerId)
        qSpecial = qSpecial.eq('user_id', reportFarmerId)
      }

      // Apply start date filter
      if (reportStartDate) {
        qLab = qLab.gte('report_date', reportStartDate)
        qConsult = qConsult.gte('report_date', reportStartDate)
        qPostMortem = qPostMortem.gte('report_date', reportStartDate)
        qAI = qAI.gte('record_date', reportStartDate)
        qPregnancy = qPregnancy.gte('report_date', reportStartDate)
        qSpecial = qSpecial.gte('report_date', reportStartDate)
      }

      // Apply end date filter
      if (reportEndDate) {
        qLab = qLab.lte('report_date', reportEndDate)
        qConsult = qConsult.lte('report_date', reportEndDate)
        qPostMortem = qPostMortem.lte('report_date', reportEndDate)
        qAI = qAI.lte('record_date', reportEndDate)
        qPregnancy = qPregnancy.lte('report_date', reportEndDate)
        qSpecial = qSpecial.lte('report_date', reportEndDate)
      }

      const [rLab, rConsult, rPostMortem, rAI, rPregnancy, rSpecial] = await Promise.all([
        qLab, qConsult, qPostMortem, qAI, qPregnancy, qSpecial
      ])

      // Combine and format results
      const combined = [
        ...(rLab.data || []).map(r => ({ id: r.id, type: 'Laboratory Diagnostic', date: r.report_date, user_id: r.user_id, data: r })),
        ...(rConsult.data || []).map(r => ({ id: r.id, type: 'Consultation', date: r.report_date, user_id: r.user_id, data: r })),
        ...(rPostMortem.data || []).map(r => ({ id: r.id, type: 'Post-Mortem Examination', date: r.report_date, user_id: r.user_id, data: r })),
        ...(rAI.data || []).map(r => ({ id: r.id, type: 'Artificial Insemination', date: r.record_date, user_id: r.user_id, data: r })),
        ...(rPregnancy.data || []).map(r => ({ id: r.id, type: 'Pregnancy Diagnosis', date: r.report_date, user_id: r.user_id, data: r })),
        ...(rSpecial.data || []).map(r => ({ id: r.id, type: 'Special Consultation', date: r.report_date, user_id: r.user_id, data: r }))
      ]

      // Sort by date descending
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setSavedReports(combined)
    } catch (e) {
      console.error("Error fetching saved reports:", e)
    } finally {
      setLoadingReports(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'saved_reports') {
      fetchSavedReports()
    }
  }, [activeTab, reportFarmerId, reportStartDate, reportEndDate])

  // Auto-generate mission number when modal opens
  const openAddModal = () => {
    const nextNum = missions.length + 1
    const padNum = String(nextNum).padStart(3, '0')
    setEditingMission(null)
    setCustomCategory('')
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

  const openEditModal = (m: Mission) => {
    setEditingMission(m)
    const predefined = ['Vaccination', 'Check-up', 'Audit', 'Inspection', 'Deworming', 'Sick animal check-up', 'Other']
    if (predefined.includes(m.visit_category)) {
      setNewMission({
        mission_number: m.mission_number,
        date: m.date,
        visit_category: m.visit_category,
        farm_name: m.farm_name,
        client_phone: m.client_phone || '',
        province: m.province,
        attending_team: m.attending_team,
        review_client: m.review_client || '',
        user_id: (m as any).user_id || ''
      })
      setCustomCategory('')
    } else {
      setNewMission({
        mission_number: m.mission_number,
        date: m.date,
        visit_category: 'Custom...',
        farm_name: m.farm_name,
        client_phone: m.client_phone || '',
        province: m.province,
        attending_team: m.attending_team,
        review_client: m.review_client || '',
        user_id: (m as any).user_id || ''
      })
      setCustomCategory(m.visit_category)
    }
    setIsAddModalOpen(true)
  }

  const handleDeleteMission = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this logged mission?")) return
    try {
      const { error } = await supabase.from('missions').delete().eq('id', id)
      if (error) throw error
      fetchData()
    } catch (e: any) {
      alert("Failed to delete mission: " + e.message)
    }
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

    const categoryToSave = newMission.visit_category === 'Custom...' ? customCategory.trim() : newMission.visit_category
    if (!categoryToSave) {
      alert("Please select or enter a category.")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        mission_number: newMission.mission_number,
        date: newMission.date,
        visit_category: categoryToSave,
        farm_name: newMission.farm_name,
        client_phone: newMission.client_phone || null,
        province: newMission.province,
        attending_team: newMission.attending_team,
        review_client: newMission.review_client || null,
        user_id: newMission.user_id
      }

      if (editingMission) {
        const { error } = await supabase
          .from('missions')
          .update(payload)
          .eq('id', editingMission.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('missions').insert([payload])
        if (error) throw error
      }

      setIsAddModalOpen(false)
      setEditingMission(null)
      setCustomCategory('')
      fetchData()
    } catch (err: any) {
      console.error("Error saving mission:", err)
      alert(err.message || "Failed to save mission record.")
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

  const seasonalTemplates = [
    {
      title: 'Summer Tick Dipping',
      details: 'Weekly dipping in summer is critical to prevent tick-borne diseases (Heartwater, Anaplasmosis, Babesiosis).',
      advice: 'Dip all cattle weekly. Check ears and tail-head for ticks. Report any fever or loss of coordination.'
    },
    {
      title: 'Winter BVD & Leptospirosis Vaccination',
      details: 'Vaccinate breeding herds for Bovine Viral Diarrhea (BVD) and Leptospirosis before the winter season.',
      advice: 'Administer booster shots to cows. Ensure dry calving environment. Monitor pregnant stock closely.'
    },
    {
      title: 'Spring Deworming',
      details: 'Deworming treatments for calves in spring to control worm build-up from fresh pasture grazing.',
      advice: 'Dose all calves under 12 months. Rotate grazing pastures if possible to reduce parasite load.'
    }
  ]

  const outbreakTemplates = [
    {
      title: 'Anthrax Outbreak Alert',
      details: 'Active anthrax outbreak reported in the local region. Anthrax is highly contagious and fatal.',
      advice: 'Strictly restrict livestock movement. Arrange immediate emergency vaccinations. Report any sudden deaths to veterinary services.'
    },
    {
      title: 'Foot & Mouth Disease Alert',
      details: 'Foot and mouth disease cases detected in the province. High transmission risk.',
      advice: 'Isolate new stock. Disinfect vehicle tires entering the farm. Report any salivation or limping immediately.'
    },
    {
      title: 'Lumpy Skin Disease Alert',
      details: 'Lumpy Skin Disease outbreak confirmed. Transmitted by biting insects during warm/wet weather.',
      advice: 'Vaccinate non-infected animals. Apply insect repellents/dips. Quarantine affected animals immediately.'
    }
  ]

  const handleApplyTemplate = (tpl: { title: string; details: string; advice: string }) => {
    setReminderTitle(tpl.title)
    setReminderDetails(tpl.details)
    setReminderAdvice(tpl.advice)
  }

  const handleSendReminder = async () => {
    if (!reminderTitle.trim() || !reminderDetails.trim()) {
      alert("Please enter a title and details.")
      return
    }

    setSendingReminder(true)
    try {
      const dateStr = new Date().toISOString().split('T')[0]
      const fullDescription = `${reminderType === 'outbreak' ? '🚨 OUTBREAK ALERT' : '📅 SEASONAL GUIDELINE'}\n${reminderTitle}\n\nDetails: ${reminderDetails}\n\nAdvice: ${reminderAdvice}`

      let targets: string[] = []
      if (reminderTargetFarmerId === 'all') {
        targets = farmers.map(f => f.id)
      } else {
        targets = [reminderTargetFarmerId]
      }

      if (targets.length === 0) {
        alert("No recipient farmers found.")
        setSendingReminder(false)
        return
      }

      const inserts = targets.map(userId => ({
        date: dateStr,
        description: fullDescription,
        status: 'pending',
        created_by: 'admin',
        last_edited: dateStr,
        priority: reminderPriority,
        user_id: userId
      }))

      const { error } = await supabase.from('todo_tasks').insert(inserts)
      if (error) throw error

      alert(`Successfully sent ${reminderType === 'outbreak' ? 'alert' : 'reminder'} to ${reminderTargetFarmerId === 'all' ? 'all' : 'selected'} farm(s).`)
      
      setReminderTitle('')
      setReminderDetails('')
      setReminderAdvice('')
      setReminderTargetFarmerId('all')
      setReminderPriority('medium')
    } catch (e: any) {
      alert("Failed to send: " + e.message)
    } finally {
      setSendingReminder(false)
    }
  }

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
                        <th style={{ width: '90px' }} className="text-center">Actions</th>
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
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openEditModal(row)} className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors">
                                <Edit size={14} />
                              </button>
                              <button onClick={() => handleDeleteMission(row.id)} className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredMissions.length === 0 && (
                        <tr>
                          <td colSpan={10} className="text-center py-12" style={{ color: C.neutral400 }}>
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

          {activeTab === 'reminders' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Reminder Form Card */}
              <div className="card p-6 shadow-sm lg:col-span-2 space-y-4">
                <p className="font-bold text-base" style={{ color: C.neutral900 }}>Create New Reminder / Emergency Alert</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Notification Type</label>
                    <select
                      value={reminderType}
                      onChange={e => {
                        setReminderType(e.target.value as any)
                        setReminderTitle('')
                        setReminderDetails('')
                        setReminderAdvice('')
                      }}
                      className="w-full text-sm rounded-xl px-3 py-2 border outline-none bg-white cursor-pointer"
                      style={{ borderColor: C.neutral200, color: C.neutral700 }}
                    >
                      <option value="guideline">📅 Seasonal Veterinary Guideline</option>
                      <option value="outbreak">🚨 Outbreak Emergency Alert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Priority Level</label>
                    <select
                      value={reminderPriority}
                      onChange={e => setReminderPriority(e.target.value as any)}
                      className="w-full text-sm rounded-xl px-3 py-2 border outline-none bg-white cursor-pointer"
                      style={{ borderColor: C.neutral200, color: C.neutral700 }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Destination Farm(s)</label>
                  <select
                    value={reminderTargetFarmerId}
                    onChange={e => setReminderTargetFarmerId(e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2 border outline-none bg-white cursor-pointer"
                    style={{ borderColor: C.neutral200, color: C.neutral700 }}
                  >
                    <option value="all">📢 All Active Farms (Broadcast)</option>
                    {farmers.map(f => (
                      <option key={f.id} value={f.id}>
                        🚜 {f.farm_name || f.full_name || f.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Title *</label>
                  <input
                    value={reminderTitle}
                    onChange={e => setReminderTitle(e.target.value)}
                    placeholder="e.g. Anthrax Outbreak Alert"
                    className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                    style={{ borderColor: C.neutral200, color: C.neutral800 }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Description &amp; Details *</label>
                  <textarea
                    value={reminderDetails}
                    onChange={e => setReminderDetails(e.target.value)}
                    placeholder="Detailed explanation of the alert or guideline..."
                    rows={4}
                    className="w-full text-sm rounded-xl px-3 py-2 border outline-none resize-none"
                    style={{ borderColor: C.neutral200, color: C.neutral800 }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Action Advice for Farmers</label>
                  <textarea
                    value={reminderAdvice}
                    onChange={e => setReminderAdvice(e.target.value)}
                    placeholder="e.g. Dipping twice weekly, check water temperature..."
                    rows={2}
                    className="w-full text-sm rounded-xl px-3 py-2 border outline-none resize-none"
                    style={{ borderColor: C.neutral200, color: C.neutral800 }}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSendReminder}
                    disabled={sendingReminder || !reminderTitle || !reminderDetails}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    style={{ backgroundColor: C.primary500 }}
                  >
                    {sendingReminder ? "Publishing..." : "Publish Reminder / Alert"}
                  </button>
                </div>
              </div>

              {/* Templates Card */}
              <div className="card p-6 shadow-sm space-y-4">
                <p className="font-bold text-sm" style={{ color: C.neutral700 }}>Quick Templates</p>
                <p className="text-xs text-neutral-500">Select one of the standard templates to populate the form instantly.</p>
                <div className="space-y-3">
                  {(reminderType === 'guideline' ? seasonalTemplates : outbreakTemplates).map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => handleApplyTemplate(tpl)}
                      className="w-full text-left p-3.5 border rounded-xl hover:border-primary-300 hover:bg-neutral-50 transition-all block"
                      style={{ borderColor: reminderTitle === tpl.title ? C.primary500 : C.neutral200, backgroundColor: reminderTitle === tpl.title ? C.primary50 : '#fff' }}
                    >
                      <p className="font-bold text-xs" style={{ color: reminderTitle === tpl.title ? C.primary600 : C.neutral800 }}>
                        {tpl.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{tpl.details}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab D: Generate Reports ────────────────────────────────────── */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="card p-6 shadow-sm">
                <p className="font-bold text-lg mb-2" style={{ color: C.neutral900 }}>Generate Reports</p>
                <p className="text-sm text-neutral-500 mb-6">Select a report template to generate a standardized document.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Post Mortem Report', desc: 'Generate a detailed post mortem examination report.' },
                    { title: 'Consult Report', desc: 'Generate a general consultation and advisory report.' },
                    { title: 'Benchmark Mission Report', desc: 'Generate a benchmark analysis for mission visits.' },
                    { title: 'Laboratory Report', desc: 'Generate a standardized laboratory test results report.' },
                    { title: 'Artificial Insemination Report', desc: 'Generate an AI procedure and outcome report.' },
                    { title: 'Pregnancy Diagnosis Report', desc: 'Generate a pregnancy checking and ultrasound report.' },
                    { title: 'Other', desc: 'Generate a custom report with a blank template.' }
                  ].map((report, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedReport(report)
                        setIsReportModalOpen(true)
                      }}
                      className="p-5 border rounded-xl text-left hover:border-primary-500 hover:shadow-md transition-all group bg-white"
                      style={{ borderColor: C.neutral200 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-neutral-50 group-hover:bg-primary-50 transition-colors">
                          <FileText size={20} className="text-neutral-500 group-hover:text-primary-600 transition-colors" />
                        </div>
                        <h4 className="font-bold text-sm" style={{ color: C.neutral900 }}>{report.title}</h4>
                      </div>
                      <p className="text-xs text-neutral-500">{report.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Tab E: Report History (Saved Reports) ────────────────────────────── */}
      {activeTab === 'saved_reports' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
            <div className="w-full md:w-64">
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral500 }}>Target Farmer</label>
              <select
                value={reportFarmerId}
                onChange={e => setReportFarmerId(e.target.value)}
                className="w-full text-xs rounded-xl px-3 py-2 border outline-none bg-white cursor-pointer"
                style={{ borderColor: C.neutral200, color: C.neutral700 }}
              >
                <option value="all">All Farmers</option>
                {farmers.map(f => (
                  <option key={f.id} value={f.id}>{f.full_name || f.email} {f.farm_name ? `(${f.farm_name})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-48">
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral500 }}>Start Date</label>
              <input
                type="date"
                value={reportStartDate}
                onChange={e => setReportStartDate(e.target.value)}
                className="w-full text-xs rounded-xl px-3 py-2 border outline-none bg-white cursor-pointer"
                style={{ borderColor: C.neutral200, color: C.neutral700 }}
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral500 }}>End Date</label>
              <input
                type="date"
                value={reportEndDate}
                onChange={e => setReportEndDate(e.target.value)}
                className="w-full text-xs rounded-xl px-3 py-2 border outline-none bg-white cursor-pointer"
                style={{ borderColor: C.neutral200, color: C.neutral700 }}
              />
            </div>
          </div>

          <div className="card p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-6 py-4 border-b font-semibold text-sm bg-neutral-50/50 flex justify-between items-center" style={{ borderColor: C.neutral100 }}>
              <span style={{ color: C.neutral900 }}>Saved Reports ({savedReports.length})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>No.</th>
                    <th>Report Type</th>
                    <th>Date Generated</th>
                    <th>Farmer / Client</th>
                    <th style={{ width: '90px' }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingReports ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12" style={{ color: C.neutral400 }}>
                        Loading reports...
                      </td>
                    </tr>
                  ) : savedReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12" style={{ color: C.neutral400 }}>
                        No saved reports found.
                      </td>
                    </tr>
                  ) : (
                    savedReports.map((row, index) => {
                      const farmer = farmers.find(f => f.id === row.user_id)
                      const farmerName = farmer ? (farmer.full_name || farmer.email) : 'Unknown'
                      
                      return (
                        <tr key={`${row.type}-${row.id}`}>
                          <td className="text-center font-medium" style={{ color: C.neutral500 }}>{index + 1}</td>
                          <td className="font-semibold" style={{ color: C.neutral900 }}>{row.type}</td>
                          <td style={{ color: C.neutral600 }}>{row.date}</td>
                          <td className="font-bold" style={{ color: C.neutral700 }}>{farmerName}</td>
                          <td className="text-center">
                            <button onClick={() => setViewReportData({ title: row.type, data: row.data })} className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-lg transition-colors">
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Log Mission Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-white"
            style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
              <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>
                {editingMission ? "Edit Mission Visit" : "Log Mission Visit"}
              </h3>
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
                  <option value="Custom...">Custom...</option>
                </select>
              </div>

              {newMission.visit_category === 'Custom...' && (
                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Custom Category Name *</label>
                  <input
                    required
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                    style={{ borderColor: C.neutral200, color: C.neutral800 }}
                  />
                </div>
              )}

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
                  {editingMission ? (submitting ? "Saving..." : "Save Changes") : (submitting ? "Logging..." : "Log Mission")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Report Modal Dialog */}
      {isReportModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-white"
            style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>
                  Generate {selectedReport.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-1">{selectedReport.desc}</p>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="p-1 hover:bg-neutral-100 rounded-lg">
                <X size={18} style={{ color: C.neutral500 }} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Target Farmer / Client</label>
                <select
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
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Report Date</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full text-sm rounded-xl px-3 py-2 border outline-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral800 }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: C.neutral600 }}>Report Details & Findings</label>
                <textarea
                  placeholder="Enter the main content, observations, and findings for the report..."
                  rows={6}
                  className="w-full text-sm rounded-xl px-3 py-2 border outline-none resize-none"
                  style={{ borderColor: C.neutral200, color: C.neutral800 }}
                />
              </div>
              
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800 flex gap-2">
                <FileText size={16} className="mt-0.5 shrink-0" />
                <p>Generating this report will compile the details into a standardized PDF document layout for printing or emailing.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t" style={{ borderColor: C.neutral100 }}>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-neutral-500 hover:bg-neutral-50"
                style={{ borderColor: C.neutral200 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Successfully generated ${selectedReport.title}!`)
                  setIsReportModalOpen(false)
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
                style={{ backgroundColor: C.primary500 }}
              >
                <FileText size={16} /> Generate & Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Saved Report Data Modal */}
      {viewReportData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: C.neutral200 }}>
              <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>{viewReportData.title} Details</h2>
              <button onClick={() => setViewReportData(null)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X size={20} style={{ color: C.neutral500 }} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
              <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3" style={{ borderColor: C.neutral200 }}>
                {Object.entries(viewReportData.data).map(([key, value]) => {
                  if (key === 'id' || key === 'user_id' || key === 'created_at' || value === null || value === '') return null
                  return (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-start border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: C.neutral100 }}>
                      <span className="text-xs font-bold uppercase w-1/3 pt-1 text-neutral-500">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-neutral-900 w-2/3 break-words">
                        {String(value)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-white" style={{ borderColor: C.neutral200 }}>
              {(() => {
                const farmer = farmers.find(f => f.id === viewReportData.data.user_id);
                const farmerDetails = farmer ? {
                  name: farmer.full_name || farmer.email,
                  farm: farmer.farm_name,
                  phone: farmer.phone || farmer.phone_number || ''
                } : null;

                return viewReportData.title === 'Consultation' ? (
                  <ExportButton document={<VetReportPDF data={viewReportData.data} farmer={farmerDetails} />} fileName={`Consultation_Report_${viewReportData.data.report_date || 'Download'}.pdf`} />
                ) : (
                  <ExportButton document={<GenericReportPDF title={viewReportData.title} data={viewReportData.data} farmer={farmerDetails} />} fileName={`${viewReportData.title.replace(/\s+/g, '_')}_Report.pdf`} />
                );
              })()}
              <button type="button" onClick={() => setViewReportData(null)} className="px-6 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all" style={{ backgroundColor: C.primary600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
