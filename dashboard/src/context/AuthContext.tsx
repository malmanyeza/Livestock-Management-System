import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string
  email: string
  role: string
  full_name?: string
  farm_name?: string
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
  setFarmerModalOpen: () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [farmers, setFarmers] = useState<Profile[]>([])
  const [selectedFarmer, setSelectedFarmer] = useState<Profile | null>(null)
  const [farmerModalOpen, setFarmerModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProfileAndFarmers = async (uid: string) => {
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
      setProfile(prof)
      if (prof?.role === 'admin') {
        const { data: farmersList } = await supabase.from('profiles').select('*').eq('role', 'farmer').order('full_name')
        const list = farmersList || []
        setFarmers(list)
        if (list.length > 0) {
          setSelectedFarmer(list[0]) // Auto-select first farmer
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

  const targetUserId = profile?.role === 'admin' ? (selectedFarmer?.id || session?.user.id) : session?.user.id

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
      setFarmerModalOpen
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
