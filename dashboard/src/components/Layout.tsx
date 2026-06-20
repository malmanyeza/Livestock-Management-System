import { NavLink, useLocation } from 'react-router-dom'
import {
  Heart, Dna, Wheat, BarChart3, ClipboardList,
  FileEdit, ShoppingCart, Settings, User, Menu, X, ShieldCheck, LogOut,
  Search, Check, ChevronDown
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',           icon: BarChart3,     label: 'Dashboard',    color: '#7AC142' },
  { to: '/health',     icon: Heart,         label: 'Health',       color: '#E74C3C' },
  { to: '/genetics',   icon: Dna,           label: 'Genetics',     color: '#7AC142' },
  { to: '/production', icon: BarChart3,     label: 'Production',   color: '#43B97C' },
  { to: '/records',    icon: ClipboardList, label: 'Records',      color: '#8B7429' },
  { to: '/nutrition',  icon: Wheat,         label: 'Nutrition',    color: '#FF9E2C' },
  { to: '/register',   icon: FileEdit,      label: 'Register',     color: '#6C757D' },
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
    farmerModalOpen, setFarmerModalOpen
  } = useAuth()

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
          {NAV.map(({ to, icon: Icon, label, color }) => {
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
                  {profile?.role === 'admin' ? 'Admin' : 'Farmer'}
                </p>
              </div>
            </div>
          )}
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
    </div>
  )
}
