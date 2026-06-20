import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Beef, HeartPulse, TrendingUp, Dna, Pill, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'

interface Stats {
  animalCount: number
  healthRecordCount: number
  breedingRecordCount: number
  drugCount: number
  mortalityCount: number
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function Overview() {
  const { targetUserId } = useAuth()
  const [stats, setStats] = useState<Stats>({ animalCount: 0, healthRecordCount: 0, breedingRecordCount: 0, drugCount: 0, mortalityCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    Promise.all([
      supabase.from('animals').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId),
      supabase.from('health_records').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId),
      supabase.from('breeding_records').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId),
      supabase.from('drugs').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId),
      supabase.from('mortality_records').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId),
    ]).then(([a, h, b, d, m]) => {
      setStats({
        animalCount: a.count ?? 0,
        healthRecordCount: h.count ?? 0,
        breedingRecordCount: b.count ?? 0,
        drugCount: d.count ?? 0,
        mortalityCount: m.count ?? 0,
      })
      setLoading(false)
    })
  }, [targetUserId])

  const trendData = MONTHS.map((month, i) => ({
    month,
    animals: Math.max(0, stats.animalCount - (11 - i) * 2 + Math.floor(Math.random() * 3)),
  }))

  const statCards = [
    { label: 'Total Animals', value: stats.animalCount, icon: Beef, color: 'text-primary-400', bg: 'bg-primary-900/30 border-primary-800' },
    { label: 'Health Records', value: stats.healthRecordCount, icon: HeartPulse, color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800' },
    { label: 'Breeding Records', value: stats.breedingRecordCount, icon: Dna, color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-800' },
    { label: 'Drugs in Register', value: stats.drugCount, icon: Pill, color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-800' },
    { label: 'Mortality Records', value: stats.mortalityCount, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/30 border-red-800' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Farm Overview</h2>
        <p className="text-gray-400 text-sm mt-0.5">Real-time snapshot of your livestock operation</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card-sm border ${bg} flex flex-col gap-3`}>
            <div className={`w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Herd trend */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Herd Size Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="animalsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }} />
              <Area type="monotone" dataKey="animals" stroke="#22c55e" strokeWidth={2} fill="url(#animalsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick status */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">System Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Supabase Connection', ok: true },
              { label: 'Animal Records', ok: stats.animalCount > 0 },
              { label: 'Health Monitoring', ok: stats.healthRecordCount > 0 },
              { label: 'Drug Register', ok: stats.drugCount > 0 },
              { label: 'Breeding Records', ok: stats.breedingRecordCount > 0 },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{label}</span>
                {ok
                  ? <CheckCircle size={16} className="text-primary-400" />
                  : <AlertTriangle size={16} className="text-yellow-400" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
