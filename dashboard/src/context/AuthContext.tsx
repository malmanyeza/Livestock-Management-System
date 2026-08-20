import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string
  email: string
  role: string
  full_name?: string
  owner_first_name?: string
  owner_last_name?: string
  farm_name?: string
  phone_number?: string
  phone?: string
  address?: string
  location?: string
  province?: string
  farmer_id?: string
  current_production_year?: number
}

interface AuthContextType {
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  profile: Profile | null
  farmers: Profile[]
  selectedFarmer: Profile | null
  setSelectedFarmer: (farmer: Profile | null) => void
  targetUserId: string | undefined
  farmerModalOpen: boolean
  setFarmerModalOpen: (open: boolean) => void
  selectedProductionYear: number
  setSelectedProductionYear: (year: number) => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: async () => {},
  profile: null,
  farmers: [],
  selectedFarmer: null,
  setSelectedFarmer: () => {},
  targetUserId: undefined,
  farmerModalOpen: false,
  setFarmerModalOpen: () => {},
  selectedProductionYear: 2026,
  setSelectedProductionYear: () => {},
  refreshProfile: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [farmers, setFarmers] = useState<Profile[]>([])
  const [selectedFarmer, setSelectedFarmerState] = useState<Profile | null>(null)
  const [farmerModalOpen, setFarmerModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedProductionYear, setSelectedProductionYear] = useState<number>(2026)

  const setSelectedFarmer = (farmer: Profile | null) => {
    setSelectedFarmerState(farmer)
    if (typeof window !== 'undefined' && window.localStorage) {
      if (farmer) {
        localStorage.setItem('selectedFarmerId', farmer.id)
      } else {
        localStorage.removeItem('selectedFarmerId')
      }
    }
  }

  const refreshProfile = async () => {
    if (session?.user.id) {
      await loadProfileAndFarmers(session.user.id)
    }
  }

  const loadProfileAndFarmers = async (uid: string) => {
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
      setProfile(prof)
      if (prof?.current_production_year) {
        setSelectedProductionYear(prof.current_production_year)
      }
      if (prof?.role === 'admin') {
        const { data: farmersList } = await supabase.from('profiles').select('*').eq('role', 'farmer').order('full_name')
        const list = farmersList || []
        setFarmers(list)
        if (list.length > 0) {
          setSelectedFarmerState((prev) => {
            // Keep current selected farmer if they are still in the loaded list
            if (prev && list.some(f => f.id === prev.id)) {
              return prev
            }
            // Fallback to localStorage choice if valid
            if (typeof window !== 'undefined' && window.localStorage) {
              const storedId = localStorage.getItem('selectedFarmerId')
              const matched = list.find(f => f.id === storedId)
              if (matched) {
                return matched
              }
            }
            // Otherwise, auto-select the first farmer as a default fallback
            const defaultFarmer = list[0]
            if (typeof window !== 'undefined' && window.localStorage && defaultFarmer) {
              localStorage.setItem('selectedFarmerId', defaultFarmer.id)
            }
            return defaultFarmer
          })
        }
      }
    } catch (e) {
      console.error("Error loading profile/farmers:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        loadProfileAndFarmers(data.session.user.id)
      } else {
        setLoading(false)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        loadProfileAndFarmers(session.user.id)
      } else {
        setProfile(null)
        setFarmers([])
        setSelectedFarmer(null)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => { await supabase.auth.signOut() }

  const targetUserId = profile?.role === 'admin' ? (selectedFarmer?.id || session?.user.id) : (profile?.role === 'worker' ? profile?.farmer_id : session?.user.id)

  return (
    <AuthContext.Provider value={{
      session,
      loading,
      signOut,
      profile,
      farmers,
      selectedFarmer,
      setSelectedFarmer,
      targetUserId,
      farmerModalOpen,
      setFarmerModalOpen,
      selectedProductionYear,
      setSelectedProductionYear,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
