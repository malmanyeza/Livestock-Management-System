import { NavLink, useLocation } from 'react-router-dom'
import {
  Heart, Dna, Wheat, BarChart3, ClipboardList,
  FileEdit, ShoppingCart, Settings, User, Menu, X, ShieldCheck, LogOut,
  Search, Check, ChevronDown, CheckSquare, Stethoscope
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/',           icon: BarChart3,     label: 'Dashboard',    color: '#7AC142' },
  { to: '/health',     icon: Heart,         label: 'Health',       color: '#E74C3C' },
  { to: '/genetics',   icon: Dna,           label: 'Genetics',     color: '#7AC142' },
  { to: '/production', icon: BarChart3,     label: 'Production',   color: '#43B97C' },
  { to: '/records',    icon: ClipboardList, label: 'Records',      color: '#8B7429' },
  { to: '/nutrition',  icon: Wheat,         label: 'Nutrition',    color: '#FF9E2C' },
  { to: '/register',   icon: FileEdit,      label: 'Register',     color: '#6C757D' },
  { to: '/tasks',      icon: CheckSquare,   label: 'Task Panel',   color: '#8E44AD' },
  
  { to: '/marketplace',icon: ShoppingCart,  label: 'Marketplace',  color: '#359563' },
]

const C = {
  primary500:  '#7AC142',
  primary600:  '#639A34',
  primary50:   '#F0F9EB',
  primary100:  '#DCEFC5',
  primary300:  '#AAD775',
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
  white:       '#FFFFFF',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024)
  const {
    signOut, session, profile, farmers, selectedFarmer, setSelectedFarmer,
    farmerModalOpen, setFarmerModalOpen,
    selectedProductionYear, setSelectedProductionYear, refreshProfile, targetUserId
  } = useAuth()

  // Transition States
  const [transitionModalOpen, setTransitionModalOpen] = useState(false)
  const [transitionLoading, setTransitionLoading] = useState(false)
  const [transitionKpis, setTransitionKpis] = useState<any>(null)
  const [newYear, setNewYear] = useState<number>(2027)
  const [breedingHerdPreview, setBreedingHerdPreview] = useState<any[]>([])

  const handleOpenTransition = async () => {
    if (!targetUserId) return
    setTransitionModalOpen(true)
    setTransitionLoading(true)
    try {
      const year = selectedProductionYear
      setNewYear(year + 1)

      const [
        { data: ani },
        { data: breed },
        { data: preg },
        { data: feed },
        { data: mort }
      ] = await Promise.all([
        supabase.from('animals').select('*').eq('user_id', targetUserId).eq('production_year', year),
        supabase.from('breeding_records').select('*').eq('user_id', targetUserId).eq('production_year', year),
        supabase.from('pregnancy_records').select('*').eq('user_id', targetUserId).eq('production_year', year),
        supabase.from('feed_records').select('*').eq('user_id', targetUserId).eq('production_year', year),
        supabase.from('mortality_records').select('*').eq('user_id', targetUserId).eq('production_year', year)
      ])

      const animalsList = ani ?? []
      const breedingList = breed ?? []
      const feedList = feed ?? []
      const mortalityList = mort ?? []

      const isCalfLocal = (age: string | null | undefined, stockType?: string | null) => {
        if (stockType === 'Calve' || stockType === 'Calf') return true
        if (!age) return false
        const ageMatch = age.match(/(\d+)([ym])/)
        if (!ageMatch) return false
        const [_, value, unit] = ageMatch
        return (unit === 'm' && parseInt(value) < 12) || (unit === 'y' && parseInt(value) === 0)
      }

      // 1. Conception Rate
      const serviced = breedingList.filter(b => b.serviced_date).length
      const pregnant = breedingList.filter(b => b.breeding_status === 'Confirmed Pregnant').length
      const conceptionRate = serviced > 0 ? Math.round((pregnant / serviced) * 100) : 0

      // 2. Calving Rate
      const calves = animalsList.filter(a => isCalfLocal(a.age, a.stock_type))
      const calvingRate = animalsList.length > 0 ? Math.round((calves.length / animalsList.length) * 100) : 0

      // 3. Mortality Rate
      const mortalityRate = animalsList.length > 0 ? Math.round((mortalityList.length / animalsList.length) * 100) : 0

      // 4. Avg Weaning Weight
      const weanedCalves = animalsList.filter(a => isCalfLocal(a.age, a.stock_type) && Number(a.weaning_weight || 0) > 0)
      const avgWeaningWeight = weanedCalves.length > 0
        ? Math.round(weanedCalves.reduce((sum, a) => sum + Number(a.weaning_weight), 0) / weanedCalves.length)
        : 0

      // 5. FCR
      const feedQty = feedList.filter(f => f.animal_group === 'Cattle-fattening' || f.animal_group === 'Cattle').reduce((sum, f) => sum + Number(f.quantity_consumed || 0), 0)
      const weightGain = animalsList.filter(a => ['Bull', 'Steer', 'Cow', 'Heifer'].includes(a.stock_type)).reduce((sum, a) => sum + (Number(a.weight || 0) - Number(a.previous_weight || 0)), 0)
      const fcr = weightGain > 0 ? Number((feedQty / weightGain).toFixed(2)) : 0

      // 6. Weaning Percentage
      const weaningPercentage = calvingRate

      // 7. Breeding Herd
      const breedingHerd = animalsList.filter(a => a.stock_type === 'Cow' || a.stock_type === 'Bull' || a.stock_type === 'Heifer' || a.stock_type === 'Bullying Heifer')
      setBreedingHerdPreview(breedingHerd)

      setTransitionKpis({
        conceptionRate,
        calvingRate,
        mortalityRate,
        avgWeaningWeight,
        fcr,
        weaningPercentage,
        breedingHerdCount: breedingHerd.length
      })
    } catch (e) {
      console.error("Error fetching transition KPIs:", e)
    } finally {
      setTransitionLoading(false)
    }
  }

  const handleConfirmTransition = async () => {
    if (!targetUserId || !transitionKpis) return
    setTransitionLoading(true)
    try {
      const year = selectedProductionYear
      
      // 1. Save compiled metrics
      const baseline = breedingHerdPreview.map(a => ({ id: a.id, tag: a.tag, sex: a.sex, breed: a.breed, stock_type: a.stock_type }))
      
      const { error: insErr } = await supabase.from('yearly_performance').insert({
        user_id: targetUserId,
        year: year,
        conception_rate: transitionKpis.conceptionRate,
        calving_rate: transitionKpis.calvingRate,
        mortality_rate: transitionKpis.mortalityRate,
        avg_weaning_weight: transitionKpis.avgWeaningWeight,
        fcr: transitionKpis.fcr,
        weaning_percentage: transitionKpis.weaningPercentage,
        breeding_herd_count: transitionKpis.breedingHerdCount,
        breeding_herd_baseline: baseline
      })

      if (insErr) throw insErr

      // 2. Transition active living animals
      const { data: mortRecs } = await supabase.from('mortality_records').select('animal_tag').eq('user_id', targetUserId).eq('production_year', year)
      const deadTags = new Set((mortRecs || []).map(m => m.animal_tag).filter(Boolean))
      
      const { data: currentAnimals } = await supabase.from('animals').select('*').eq('user_id', targetUserId).eq('production_year', year)
      const livingAnimals = (currentAnimals || []).filter(a => !deadTags.has(a.tag))

      if (livingAnimals.length > 0) {
        const transitionedAnimals = livingAnimals.map(a => {
          const { id, created_at, ...rest } = a
          return {
            ...rest,
            production_year: newYear
          }
        })
        const { error: trErr } = await supabase.from('animals').insert(transitionedAnimals)
        if (trErr) throw trErr
      }

      // 3. Update profiles table
      const { error: profErr } = await supabase.from('profiles').update({
        current_production_year: newYear
      }).eq('id', targetUserId)

      if (profErr) throw profErr

      await refreshProfile()
      setSelectedProductionYear(newYear)
      setTransitionModalOpen(false)
      alert(`Successfully transitioned to production year ${newYear}!`)
    } catch (e: any) {
      console.error("Transition failed:", e)
      alert("Transition failed: " + (e.message || e))
    } finally {
      setTransitionLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => {
      // Auto-collapse sidebar on screens smaller than 1024px (e.g. iPad landscape/portrait)
      setSidebarOpen(window.innerWidth >= 1024)
    }
    // Set initial on mount
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const location = useLocation()
  const isAdmin = profile?.role === 'admin'

  const activeNav = NAV.find(n => n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to))

  const [farmerSearch, setFarmerSearch] = useState('')
  const [sortBy, setSortBy]             = useState<'name'|'farm'|'email'>('name')
  const [sortAsc, setSortAsc]           = useState(true)

  const filteredFarmers = useMemo(() => {
    const q = farmerSearch.toLowerCase()
    const filtered = farmers.filter(f =>
      (f.full_name || '').toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q) ||
      (f.farm_name || '').toLowerCase().includes(q)
    )
    return [...filtered].sort((a, b) => {
      const valA = sortBy === 'name' ? (a.full_name || '') : sortBy === 'farm' ? (a.farm_name || '') : (a.email || '')
      const valB = sortBy === 'name' ? (b.full_name || '') : sortBy === 'farm' ? (b.farm_name || '') : (b.email || '')
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
    })
  }, [farmers, farmerSearch, sortBy, sortAsc])

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F8F9FA' }}>
      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col border-r transition-all duration-300 overflow-hidden"
        style={{
          width: sidebarOpen ? 220 : 64,
          backgroundColor: '#FFFFFF',
          borderColor: '#E9ECEF',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: '#E9ECEF' }}>
          <img
            src={`${import.meta.env.BASE_URL}logo.jpg`}
            className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
            alt="Zvipfuwo Logo"
          />
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate" style={{ color: '#121416' }}>Zvipfuwo</p>
              <p className="text-xs truncate" style={{ color: '#6C757D' }}>Web Dashboard</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.filter(n => {
            if (n.to === '/marketplace' && profile?.role === 'worker') return false;
            return true;
          }).map(({ to, icon: Icon, label, color }) => {
            const exact = to === '/'
            const active = exact ? location.pathname === '/' : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={active ? 'nav-link-active' : 'nav-link'}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" style={{ color: active ? color : '#6C757D' }} />
                {sidebarOpen && <span className="truncate">{label}</span>}
              </NavLink>
            )
          })}
          {(profile?.role === 'farmer' || (profile?.role === 'admin' && selectedFarmer)) && (
            <NavLink
              to="/workers"
              className={location.pathname.startsWith('/workers') ? 'nav-link-active' : 'nav-link'}
              title={!sidebarOpen ? 'Manage Workers' : undefined}
            >
              <User size={18} className="flex-shrink-0" style={{ color: location.pathname.startsWith('/workers') ? '#8E44AD' : '#6C757D' }} />
              {sidebarOpen && <span className="truncate">Manage Workers</span>}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/livestock-pro"
              className={location.pathname.startsWith('/livestock-pro') ? 'nav-link-active' : 'nav-link'}
              title={!sidebarOpen ? 'Livestock Pro' : undefined}
            >
              <ShieldCheck size={18} className="flex-shrink-0" style={{ color: location.pathname.startsWith('/livestock-pro') ? '#7AC142' : '#6C757D' }} />
              {sidebarOpen && <span className="truncate">Livestock Pro</span>}
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t p-3" style={{ borderColor: '#E9ECEF' }}>
          {sidebarOpen && session && (
            <div className="flex items-center gap-2 px-2 pb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#F0F9EB' }}>
                <User size={16} style={{ color: '#639A34' }} />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: '#121416' }}>{session.user.email}</p>
                <p className="text-xs font-medium" style={{ color: '#7AC142' }}>
                  {profile?.role === 'admin' ? 'Admin' : (profile?.role === 'worker' ? 'Worker' : 'Farmer')}
                </p>
              </div>
            </div>
          )}
          <NavLink
            to="/profile"
            className={location.pathname === '/profile' ? 'nav-link-active w-full mb-1' : 'nav-link w-full mb-1'}
            title={!sidebarOpen ? 'Profile Settings' : undefined}
          >
            <Settings size={18} className="flex-shrink-0" style={{ color: location.pathname === '/profile' ? '#7AC142' : '#6C757D' }} />
            {sidebarOpen && <span className="truncate">Profile Settings</span>}
          </NavLink>
          <button
            onClick={signOut}
            className="nav-link w-full"
            style={{ color: '#E74C3C' }}
            title={!sidebarOpen ? 'Sign out' : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-white" style={{ borderColor: '#E9ECEF' }}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#6C757D' }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = '#F8F9FA')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h1 className="text-base font-bold" style={{ color: '#121416' }}>
                {activeNav?.label ?? 'Dashboard'}
              </h1>
              <p className="text-xs" style={{ color: '#6C757D' }}>Zvipfuwo Livestock Management System</p>
            </div>
          </div>

          {/* Production Year & Farmer Selectors */}
          <div className="flex items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold" style={{ color: '#6C757D' }}>Year:</span>
              <select
                value={selectedProductionYear}
                onChange={e => setSelectedProductionYear(Number(e.target.value))}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 outline-none focus:border-[#7AC142]"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* End Cycle Button */}
            {profile && (profile.role === 'farmer' || profile.role === 'admin') && selectedProductionYear === profile.current_production_year && (
              <button
                onClick={handleOpenTransition}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all bg-red-600 hover:bg-red-700 shadow-sm"
              >
                End Cycle
              </button>
            )}

            {/* Farmer selector button for Admin */}
            {isAdmin && farmers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: '#6C757D' }}>Viewing Farmer:</span>
                <button
                  onClick={() => setFarmerModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all hover:bg-neutral-50"
                  style={{
                    backgroundColor: '#F8F9FA',
                    borderColor: '#DEE2E6',
                    color: '#121416',
                  }}
                >
                  <span>{selectedFarmer?.full_name || selectedFarmer?.email || 'Select Farmer'}</span>
                  {selectedFarmer?.farm_name && <span className="text-neutral-500 font-normal">(🐄 {selectedFarmer.farm_name})</span>}
                  <ChevronDown size={14} style={{ color: '#6C757D' }} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Global Farmer Selector Modal */}
      {farmerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ backgroundColor: C.white, maxHeight: '85vh' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b"
              style={{ borderColor: C.neutral100 }}>
              <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>Select Farmer Portal</h3>
              <button onClick={() => { setFarmerModalOpen(false); setFarmerSearch('') }}
                className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                <X size={18} style={{ color: C.neutral500 }} />
              </button>
            </div>

            <div className="px-6 pt-4 pb-2">
              {/* Search */}
              <div className="flex items-center gap-2 rounded-xl px-4 h-12 mb-4"
                style={{ backgroundColor: C.neutral50, border: `1px solid ${C.neutral200}` }}>
                <Search size={16} style={{ color: C.neutral500, flexShrink: 0 }} />
                <input
                  value={farmerSearch}
                  onChange={e => setFarmerSearch(e.target.value)}
                  placeholder="Search farmers by name, farm or email…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: C.neutral900 }}
                />
                {farmerSearch && (
                  <button onClick={() => setFarmerSearch('')} className="p-1 hover:bg-neutral-200 rounded-full">
                    <X size={14} style={{ color: C.neutral500 }} />
                  </button>
                )}
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="text-xs font-semibold" style={{ color: C.neutral500 }}>Sort by:</span>
                {(['name','farm','email'] as const).map(key => {
                  const isActive = sortBy === key
                  const label = key === 'name' ? 'Name' : key === 'farm' ? 'Farm Name' : 'Email'
                  return (
                    <button key={key}
                      onClick={() => { if (sortBy === key) setSortAsc(a => !a); else { setSortBy(key); setSortAsc(true) } }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                      style={{
                        backgroundColor: isActive ? C.primary50  : C.neutral100,
                        color:           isActive ? C.primary600 : C.neutral600,
                        border:          `1px solid ${isActive ? C.primary300 : C.neutral200}`,
                      }}>
                      {label} {isActive ? (sortAsc ? '↑' : '↓') : ''}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Farmer list */}
            <div className="overflow-y-auto flex-1 px-6 pb-6">
              {filteredFarmers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-sm" style={{ color: C.neutral500 }}>
                    No farmers found matching "{farmerSearch}"
                  </p>
                </div>
              ) : filteredFarmers.map(f => {
                const isSelected = selectedFarmer?.id === f.id
                return (
                  <button key={f.id}
                    onClick={() => { setSelectedFarmer(f); setFarmerModalOpen(false); setFarmerSearch('') }}
                    className="w-full flex items-center justify-between py-4 border-b text-left transition-colors hover:bg-neutral-50 px-2 rounded-lg"
                    style={{ borderColor: isSelected ? C.primary100 : C.neutral100 }}>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm" style={{ color: isSelected ? C.primary600 : C.neutral900 }}>
                        {f.full_name || 'Farmer'}
                      </span>
                      {f.farm_name && (
                        <span className="text-xs" style={{ color: C.neutral600 }}>🐄 {f.farm_name}</span>
                      )}
                      <span className="text-xs" style={{ color: C.neutral500 }}>{f.email}</span>
                    </div>
                    {isSelected && <Check size={18} style={{ color: C.primary600, flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* End Production Cycle Transition Modal */}
      {transitionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">End Production Cycle ({selectedProductionYear})</h3>
                <p className="text-xs text-gray-500 mt-1">Compile performance metrics & baseline the breeding herd roster</p>
              </div>
              <button onClick={() => setTransitionModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {transitionLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="w-10 h-10 border-4 border-[#7AC142] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-gray-600">Processing transition data...</p>
                </div>
              ) : (
                <>
                  {/* KPI Grid */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Key Performance Indicators</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Conception Rate', value: `${transitionKpis?.conceptionRate ?? 0}%`, color: '#3498DB' },
                        { label: 'Calving Rate', value: `${transitionKpis?.calvingRate ?? 0}%`, color: '#2ECC71' },
                        { label: 'Mortality Rate', value: `${transitionKpis?.mortalityRate ?? 0}%`, color: '#E74C3C' },
                        { label: 'Avg Weaning Weight', value: `${transitionKpis?.avgWeaningWeight ?? 0} kg`, color: '#F39C12' },
                        { label: 'Feed Conversion (FCR)', value: transitionKpis?.fcr ?? '—', color: '#9B59B6' },
                        { label: 'Weaning Percentage', value: `${transitionKpis?.weaningPercentage ?? 0}%`, color: '#16A085' },
                      ].map(k => (
                        <div key={k.label} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-center">
                          <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
                          <p className="text-xs font-semibold text-gray-500 mt-1">{k.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Breeding Herd Baseline */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Breeding Herd Baseline</h4>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        {breedingHerdPreview.length} Active Animals
                      </span>
                    </div>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden max-h-40 overflow-y-auto bg-gray-50/35">
                      <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-100/70 sticky top-0 font-bold">
                          <tr>
                            <th className="px-4 py-2">Tag</th>
                            <th className="px-4 py-2">Breed</th>
                            <th className="px-4 py-2">Sex</th>
                            <th className="px-4 py-2">Stock Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {breedingHerdPreview.map(a => (
                            <tr key={a.id}>
                              <td className="px-4 py-2 font-bold text-gray-800">{a.tag}</td>
                              <td className="px-4 py-2">{a.breed || '—'}</td>
                              <td className="px-4 py-2">{a.sex}</td>
                              <td className="px-4 py-2">{a.stock_type}</td>
                            </tr>
                          ))}
                          {breedingHerdPreview.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-6 text-gray-400">No active breeding herd detected.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Transition Form */}
                  <div className="p-5 rounded-2xl border border-[#DCEFC5] bg-[#F0F9EB]/65 space-y-4">
                    <h4 className="text-sm font-bold text-emerald-800">Transition Details</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">New Production Year</label>
                        <input
                          type="number"
                          value={newYear}
                          onChange={e => setNewYear(parseInt(e.target.value) || newYear)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-800 focus:border-[#7AC142] outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Living Animals to Copy</label>
                        <input
                          type="text"
                          readOnly
                          value={`${breedingHerdPreview.length} animals`}
                          className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-emerald-700 leading-normal">
                      ⚠️ Ending this production cycle will permanently archive the metrics above for Year {selectedProductionYear}.
                      All living animals will be copied into the roster for the new Production Year {newYear}, while all health, feed,
                      breeding, and pregnancy records will start fresh to avoid blending or overwriting past data.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!transitionLoading && (
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setTransitionModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmTransition}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: '#E74C3C' }}
                >
                  Confirm Transition
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
