import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { 
  Plus, Edit, Trash2, CheckSquare, Clock, AlertTriangle, 
  Search, X, CheckCircle, HelpCircle, ChevronDown, Check
} from 'lucide-react'

// ─── Colors Constants ────────────────────────────────────────────────────────
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
  warning50:   '#FFFDEB',
  warning500:  '#FF9E2C',
  error50:     '#FDF2F2',
  error500:    '#E74C3C',
  purple50:    '#F5EEF8',
  purple500:   '#8E44AD',
  white:       '#FFFFFF'
}

type TabType = 'events' | 'todos' | 'observations'

export default function Tasks() {
  const { session, targetUserId } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('events')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Data states
  const [events, setEvents] = useState<any[]>([])
  const [todos, setTodos] = useState<any[]>([])
  const [observations, setObservations] = useState<any[]>([])
  const [animals, setAnimals] = useState<any[]>([])

  // Modal show states
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  
  const [showAddTodo, setShowAddTodo] = useState(false)
  const [editingTodo, setEditingTodo] = useState<any | null>(null)
  
  const [showAddObs, setShowAddObs] = useState(false)
  const [editingObs, setEditingObs] = useState<any | null>(null)

  // Fetch all tasks and records
  const fetchData = async () => {
    if (!targetUserId) return
    setLoading(true)
    try {
      const [evRes, todoRes, obsRes, aniRes] = await Promise.all([
        supabase.from('farm_events').select('*').eq('user_id', targetUserId).order('date', { ascending: false }),
        supabase.from('todo_tasks').select('*').eq('user_id', targetUserId).order('date', { ascending: false }),
        supabase.from('observations').select('*').eq('user_id', targetUserId).order('date', { ascending: false }),
        supabase.from('animals').select('tag, breed, stock_type').eq('user_id', targetUserId).order('tag')
      ])

      setEvents(evRes.data ?? [])
      setTodos(todoRes.data ?? [])
      setObservations(obsRes.data ?? [])
      setAnimals(aniRes.data ?? [])
    } catch (err) {
      console.error('Error fetching tasks data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [targetUserId])

  // Filtered lists based on search query
  const q = search.toLowerCase().trim()

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      !q || 
      (e.event || '').toLowerCase().includes(q) || 
      (e.type || '').toLowerCase().includes(q) || 
      (e.tag || '').toLowerCase().includes(q) || 
      (e.done_by || '').toLowerCase().includes(q)
    )
  }, [events, q])

  const filteredTodos = useMemo(() => {
    return todos.filter(t => 
      !q || 
      (t.description || '').toLowerCase().includes(q) || 
      (t.created_by || '').toLowerCase().includes(q) || 
      (t.priority || '').toLowerCase().includes(q)
    )
  }, [todos, q])

  const filteredObs = useMemo(() => {
    return observations.filter(o => 
      !q || 
      (o.observation || '').toLowerCase().includes(q) || 
      (o.tag || '').toLowerCase().includes(q) || 
      (o.observer || '').toLowerCase().includes(q)
    )
  }, [observations, q])

  // Count summaries
  const pendingEventsCount = useMemo(() => events.filter(e => e.status === 'pending').length, [events])
  const activeTodosCount = useMemo(() => todos.filter(t => t.status === 'pending' || t.status === 'overdue').length, [todos])
  const unresolvedObsCount = useMemo(() => observations.filter(o => o.status === 'unresolved' || !o.status).length, [observations])

  // ─── Event handlers ─────────────────────────────────────────────────────────
  const handleSaveEvent = async (form: any) => {
    if (!targetUserId) return
    const payload = {
      user_id: targetUserId,
      type: form.type,
      event: form.event,
      tag: form.tag,
      diagnosis: form.diagnosis || null,
      notes: form.notes || null,
      done_by: form.doneBy || null,
      status: form.status,
      date: form.date
    }

    if (editingEvent) {
      const { data, error } = await supabase
        .from('farm_events')
        .update(payload)
        .eq('id', editingEvent.id)
        .select()
        .single()
      if (error) throw error
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? data : e))
      setEditingEvent(null)
    } else {
      const { data, error } = await supabase
        .from('farm_events')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      setEvents(prev => [data, ...prev])
      setShowAddEvent(false)
    }
  }

  const handleDeleteEvent = async (id: any) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try {
      const { error } = await supabase.from('farm_events').delete().eq('id', id)
      if (error) throw error
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (err: any) {
      alert('Failed to delete event: ' + err.message)
    }
  }

  const handleToggleEventStatus = async (item: any) => {
    try {
      const newStatus = item.status === 'completed' ? 'pending' : 'completed'
      const { data, error } = await supabase
        .from('farm_events')
        .update({ status: newStatus })
        .eq('id', item.id)
        .select()
        .single()
      if (error) throw error
      setEvents(prev => prev.map(e => e.id === item.id ? data : e))
    } catch (err: any) {
      alert('Failed to update event status: ' + err.message)
    }
  }

  // ─── Todo handlers ──────────────────────────────────────────────────────────
  const handleSaveTodo = async (form: any) => {
    if (!targetUserId) return
    const payload = {
      user_id: targetUserId,
      description: form.description,
      priority: form.priority,
      status: form.status,
      date: form.date,
      created_by: form.createdBy || null,
      last_edited: new Date().toISOString().split('T')[0]
    }

    if (editingTodo) {
      const { data, error } = await supabase
        .from('todo_tasks')
        .update(payload)
        .eq('id', editingTodo.id)
        .select()
        .single()
      if (error) throw error
      setTodos(prev => prev.map(t => t.id === editingTodo.id ? data : t))
      setEditingTodo(null)
    } else {
      const { data, error } = await supabase
        .from('todo_tasks')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      setTodos(prev => [data, ...prev])
      setShowAddTodo(false)
    }
  }

  const handleDeleteTodo = async (id: any) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      const { error } = await supabase.from('todo_tasks').delete().eq('id', id)
      if (error) throw error
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch (err: any) {
      alert('Failed to delete task: ' + err.message)
    }
  }

  const handleToggleTodoStatus = async (item: any) => {
    try {
      const newStatus = item.status === 'completed' ? 'pending' : 'completed'
      const { data, error } = await supabase
        .from('todo_tasks')
        .update({ status: newStatus, last_edited: new Date().toISOString().split('T')[0] })
        .eq('id', item.id)
        .select()
        .single()
      if (error) throw error
      setTodos(prev => prev.map(t => t.id === item.id ? data : t))
    } catch (err: any) {
      alert('Failed to update task status: ' + err.message)
    }
  }

  // ─── Observation handlers ───────────────────────────────────────────────────
  const handleSaveObs = async (form: any) => {
    if (!targetUserId) return
    const payload = {
      user_id: targetUserId,
      observation: form.observation,
      severity: form.severity,
      status: form.status,
      date: form.date,
      tag: form.tag,
      observer: form.observer || null
    }

    if (editingObs) {
      const { data, error } = await supabase
        .from('observations')
        .update(payload)
        .eq('id', editingObs.id)
        .select()
        .single()
      if (error) throw error
      setObservations(prev => prev.map(o => o.id === editingObs.id ? data : o))
      setEditingObs(null)
    } else {
      const { data, error } = await supabase
        .from('observations')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      setObservations(prev => [data, ...prev])
      setShowAddObs(false)
    }
  }

  const handleDeleteObs = async (id: any) => {
    if (!window.confirm('Are you sure you want to delete this observation?')) return
    try {
      const { error } = await supabase.from('observations').delete().eq('id', id)
      if (error) throw error
      setObservations(prev => prev.filter(o => o.id !== id))
    } catch (err: any) {
      alert('Failed to delete observation: ' + err.message)
    }
  }

  const handleToggleObsStatus = async (item: any) => {
    try {
      const newStatus = item.status === 'resolved' ? 'unresolved' : 'resolved'
      const { data, error } = await supabase
        .from('observations')
        .update({ status: newStatus })
        .eq('id', item.id)
        .select()
        .single()
      if (error) throw error
      setObservations(prev => prev.map(o => o.id === item.id ? data : o))
    } catch (err: any) {
      alert('Failed to update observation status: ' + err.message)
    }
  }

  // Helper styles/renderers
  const severityBadge = (val: string) => {
    const isHigh = val === 'high'
    const isMedium = val === 'medium'
    const color = isHigh ? C.error500 : isMedium ? C.warning500 : C.primary500
    const bg = isHigh ? C.error50 : isMedium ? C.warning50 : C.primary50
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize" style={{ backgroundColor: bg, color }}>
        {val}
      </span>
    )
  }

  const priorityBadge = (val: string) => {
    const isHigh = val === 'high'
    const isMedium = val === 'medium'
    const color = isHigh ? C.error500 : isMedium ? C.warning500 : C.purple500
    const bg = isHigh ? C.error50 : isMedium ? C.warning50 : C.purple50
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize" style={{ backgroundColor: bg, color }}>
        {val}
      </span>
    )
  }

  const statusBadge = (val: string) => {
    const isDone = val === 'completed' || val === 'resolved'
    const color = isDone ? C.success600 : C.warning500
    const bg = isDone ? C.success50 : C.warning50
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize" style={{ backgroundColor: bg, color }}>
        {val === 'completed' ? 'Completed' : val === 'pending' ? 'Pending' : val === 'resolved' ? 'Resolved' : 'Unresolved'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.primary500 }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upper Count Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1 - Todo Tasks */}
        <div className="rounded-2xl p-5 border flex items-center justify-between shadow-sm transition-all hover:scale-[1.01]"
          style={{ backgroundColor: C.white, borderColor: C.neutral200 }}>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.neutral500 }}>Active Tasks</p>
            <h4 className="text-3xl font-black" style={{ color: C.neutral900 }}>{activeTodosCount}</h4>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: C.purple50 }}>
            <CheckSquare size={24} style={{ color: C.purple500 }} />
          </div>
        </div>

        {/* CARD 2 - Events */}
        <div className="rounded-2xl p-5 border flex items-center justify-between shadow-sm transition-all hover:scale-[1.01]"
          style={{ backgroundColor: C.white, borderColor: C.neutral200 }}>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.neutral500 }}>Pending Events</p>
            <h4 className="text-3xl font-black" style={{ color: C.neutral900 }}>{pendingEventsCount}</h4>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: C.primary50 }}>
            <Clock size={24} style={{ color: C.primary500 }} />
          </div>
        </div>

        {/* CARD 3 - Observations */}
        <div className="rounded-2xl p-5 border flex items-center justify-between shadow-sm transition-all hover:scale-[1.01]"
          style={{ backgroundColor: C.white, borderColor: C.neutral200 }}>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.neutral500 }}>Unresolved Observations</p>
            <h4 className="text-3xl font-black" style={{ color: C.neutral900 }}>{unresolvedObsCount}</h4>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: C.error50 }}>
            <AlertTriangle size={24} style={{ color: C.error500 }} />
          </div>
        </div>
      </div>

      {/* Main Section Header with Tabs, Search and Add Button */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: C.neutral200 }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 gap-4 border-b" style={{ borderColor: C.neutral100 }}>
          
          {/* Tabs */}
          <div className="flex bg-neutral-100 p-1 rounded-xl w-fit">
            {(['events', 'todos', 'observations'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearch('') }}
                className="px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all"
                style={{
                  backgroundColor: activeTab === tab ? C.white : 'transparent',
                  color: activeTab === tab ? C.neutral900 : C.neutral500,
                  boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {tab === 'todos' ? 'To-Do List' : tab}
              </button>
            ))}
          </div>

          {/* Search and Action Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl px-4 py-2 border w-64 text-sm"
              style={{ borderColor: C.neutral200, backgroundColor: C.neutral50 }}>
              <Search size={16} style={{ color: C.neutral500 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-transparent outline-none flex-1"
                style={{ color: C.neutral900 }}
              />
              {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: C.neutral500 }} /></button>}
            </div>

            <button
              onClick={() => {
                if (activeTab === 'events') setShowAddEvent(true)
                else if (activeTab === 'todos') setShowAddTodo(true)
                else setShowAddObs(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
              style={{ backgroundColor: C.primary500 }}
            >
              <Plus size={16} />
              <span>Add Record</span>
            </button>
          </div>
        </div>

        {/* ─── TABLES CONTENT ─── */}
        <div className="overflow-x-auto">
          {/* TAB 1 - EVENTS */}
          {activeTab === 'events' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/50" style={{ borderColor: C.neutral100 }}>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Event/Activity</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Diagnosis</th>
                  <th className="px-6 py-4">Done By</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm font-medium" style={{ borderColor: C.neutral100 }}>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-neutral-500 font-normal">
                      No events found.
                    </td>
                  </tr>
                ) : filteredEvents.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-neutral-900">{item.type}</td>
                    <td className="px-6 py-4 text-neutral-800">
                      <div>
                        <p className="font-semibold">{item.event}</p>
                        {item.notes && <p className="text-xs font-normal text-neutral-500 mt-0.5">{item.notes}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{item.tag}</td>
                    <td className="px-6 py-4 text-neutral-600">{item.diagnosis || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-600">{item.done_by || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button onClick={() => handleToggleEventStatus(item)} className="focus:outline-none hover:opacity-80 transition-opacity">
                        {statusBadge(item.status)}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingEvent(item)} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteEvent(item.id)} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 2 - TODOS */}
          {activeTab === 'todos' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/50" style={{ borderColor: C.neutral100 }}>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4 text-center">Priority</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm font-medium" style={{ borderColor: C.neutral100 }}>
                {filteredTodos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-neutral-500 font-normal">
                      No tasks found.
                    </td>
                  </tr>
                ) : filteredTodos.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{item.date}</td>
                    <td className="px-6 py-4 text-neutral-900 font-semibold">{item.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-600">{item.created_by || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{priorityBadge(item.priority)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button onClick={() => handleToggleTodoStatus(item)} className="focus:outline-none hover:opacity-80 transition-opacity">
                        {statusBadge(item.status)}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingTodo(item)} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteTodo(item.id)} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 3 - OBSERVATIONS */}
          {activeTab === 'observations' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/50" style={{ borderColor: C.neutral100 }}>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Observation / Finding</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Observer</th>
                  <th className="px-6 py-4 text-center">Severity</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm font-medium" style={{ borderColor: C.neutral100 }}>
                {filteredObs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-neutral-500 font-normal">
                      No observations found.
                    </td>
                  </tr>
                ) : filteredObs.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{item.date}</td>
                    <td className="px-6 py-4 text-neutral-900 font-semibold">{item.observation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-800">{item.tag}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-600">{item.observer || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{severityBadge(item.severity)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button onClick={() => handleToggleObsStatus(item)} className="focus:outline-none hover:opacity-80 transition-opacity">
                        {statusBadge(item.status)}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingObs(item)} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteObs(item.id)} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── MODALS ─── */}
      {/* 1. EVENT MODAL */}
      {(showAddEvent || editingEvent) && (
        <EventModal
          animals={animals}
          editingItem={editingEvent}
          onClose={() => { setShowAddEvent(false); setEditingEvent(null) }}
          onSave={handleSaveEvent}
        />
      )}

      {/* 2. TODO MODAL */}
      {(showAddTodo || editingTodo) && (
        <TodoModal
          editingItem={editingTodo}
          onClose={() => { setShowAddTodo(false); setEditingTodo(null) }}
          onSave={handleSaveTodo}
        />
      )}

      {/* 3. OBSERVATION MODAL */}
      {(showAddObs || editingObs) && (
        <ObsModal
          animals={animals}
          editingItem={editingObs}
          onClose={() => { setShowAddObs(false); setEditingObs(null) }}
          onSave={handleSaveObs}
        />
      )}
    </div>
  )
}

// ─── Modal Sub-components ───────────────────────────────────────────────────

function EventModal({ animals, editingItem, onClose, onSave }: { animals: any[]; editingItem?: any; onClose: () => void; onSave: (form: any) => Promise<void> }) {
  const [form, setForm] = useState({
    date: editingItem?.date || new Date().toISOString().split('T')[0],
    type: editingItem?.type || 'Vaccination',
    event: editingItem?.event || '',
    tag: editingItem?.tag || 'Whole Herd',
    diagnosis: editingItem?.diagnosis || '',
    notes: editingItem?.notes || '',
    doneBy: editingItem?.done_by || '',
    status: editingItem?.status || 'pending'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.event.trim()) { setError('Please enter event or activity name.'); return }
    setError(''); setSaving(true)
    try {
      await onSave(form)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>
            {editingItem ? 'Edit Event Record' : 'Add Event Record'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Event Type</label>
              <div className="relative">
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  {['Vaccination', 'Treatment', 'Insemination', 'Weaning', 'Sale', 'Purchase', 'Other'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Event/Activity Name *</label>
            <input value={form.event} onChange={e => setForm(p => ({ ...p, event: e.target.value }))}
              placeholder="e.g. Foot and Mouth Vaccination"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Target Group / Animal Tag</label>
            <div className="relative">
              <select value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                <option value="Whole Herd">Whole Herd</option>
                <option value="Calves">Calves (All)</option>
                <option value="Cows">Cows (All)</option>
                <option value="Bulls">Bulls (All)</option>
                <option value="Heifers">Heifers (All)</option>
                {animals.map(a => <option key={a.tag} value={a.tag}>Animal: {a.tag} ({a.breed} {a.stock_type})</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Diagnosis (Optional)</label>
              <input value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))}
                placeholder="e.g. Tick infestation"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Done By</label>
              <input value={form.doneBy} onChange={e => setForm(p => ({ ...p, doneBy: e.target.value }))}
                placeholder="e.g. John Vet"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="status" checked={form.status === 'pending'} onChange={() => setForm(p => ({ ...p, status: 'pending' }))}
                  className="w-4 h-4 accent-[#7AC142]" />
                <span>Pending</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="status" checked={form.status === 'completed'} onChange={() => setForm(p => ({ ...p, status: 'completed' }))}
                  className="w-4 h-4 accent-[#7AC142]" />
                <span>Completed</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Provide extra details..."
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>
        </div>
        
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary500, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TodoModal({ editingItem, onClose, onSave }: { editingItem?: any; onClose: () => void; onSave: (form: any) => Promise<void> }) {
  const [form, setForm] = useState({
    date: editingItem?.date || new Date().toISOString().split('T')[0],
    description: editingItem?.description || '',
    priority: editingItem?.priority || 'medium',
    status: editingItem?.status || 'pending',
    createdBy: editingItem?.created_by || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.description.trim()) { setError('Please enter task description.'); return }
    setError(''); setSaving(true)
    try {
      await onSave(form)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>
            {editingItem ? 'Edit Task' : 'Add Task'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Due Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Priority</label>
              <div className="relative">
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Task Description *</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Inspect fences along East pasture"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Created By</label>
            <input value={form.createdBy} onChange={e => setForm(p => ({ ...p, createdBy: e.target.value }))}
              placeholder="e.g. Manager Bob"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="todo-status" checked={form.status === 'pending'} onChange={() => setForm(p => ({ ...p, status: 'pending' }))}
                  className="w-4 h-4 accent-[#7AC142]" />
                <span>Pending</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="todo-status" checked={form.status === 'completed'} onChange={() => setForm(p => ({ ...p, status: 'completed' }))}
                  className="w-4 h-4 accent-[#7AC142]" />
                <span>Completed</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary500, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ObsModal({ animals, editingItem, onClose, onSave }: { animals: any[]; editingItem?: any; onClose: () => void; onSave: (form: any) => Promise<void> }) {
  const [form, setForm] = useState({
    date: editingItem?.date || new Date().toISOString().split('T')[0],
    observation: editingItem?.observation || '',
    tag: editingItem?.tag || 'Whole Herd',
    severity: editingItem?.severity || 'medium',
    observer: editingItem?.observer || '',
    status: editingItem?.status || 'unresolved'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.observation.trim()) { setError('Please enter observation details.'); return }
    setError(''); setSaving(true)
    try {
      await onSave(form)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all" style={{ backgroundColor: C.white, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.neutral100 }}>
          <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>
            {editingItem ? 'Edit Observation' : 'Add Observation'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={18} style={{ color: C.neutral500 }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: C.error50, color: C.error500 }}>{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Severity</label>
              <div className="relative">
                <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                  style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Observation Details *</label>
            <input value={form.observation} onChange={e => setForm(p => ({ ...p, observation: e.target.value }))}
              placeholder="e.g. Limping calf near watering trough"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Target Group / Animal Tag</label>
            <div className="relative">
              <select value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border appearance-none cursor-pointer"
                style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }}>
                <option value="Whole Herd">Whole Herd</option>
                <option value="Calves">Calves (All)</option>
                <option value="Cows">Cows (All)</option>
                <option value="Bulls">Bulls (All)</option>
                <option value="Heifers">Heifers (All)</option>
                {animals.map(a => <option key={a.tag} value={a.tag}>Animal: {a.tag} ({a.breed} {a.stock_type})</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.neutral500 }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Observer</label>
            <input value={form.observer} onChange={e => setForm(p => ({ ...p, observer: e.target.value }))}
              placeholder="e.g. John Doe"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors focus:border-[#7AC142]"
              style={{ borderColor: C.neutral200, color: C.neutral900, backgroundColor: C.neutral50 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: C.neutral500 }}>Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="obs-status" checked={form.status === 'unresolved'} onChange={() => setForm(p => ({ ...p, status: 'unresolved' }))}
                  className="w-4 h-4 accent-[#7AC142]" />
                <span>Unresolved</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="obs-status" checked={form.status === 'resolved'} onChange={() => setForm(p => ({ ...p, status: 'resolved' }))}
                  className="w-4 h-4 accent-[#7AC142]" />
                <span>Resolved</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: C.neutral100 }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
            style={{ backgroundColor: C.neutral100, color: C.neutral700 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            style={{ backgroundColor: C.primary500, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  )
}
