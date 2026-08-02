import React, { useState, useEffect } from 'react'
import { User, Save, Trash2, Shield, MapPin, Phone, Building } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { profile, refreshProfile, signOut } = useAuth()
  
  const [editingProfile, setEditingProfile] = useState<Partial<typeof profile> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const isWorker = profile?.role === 'worker'

  useEffect(() => {
    if (profile) {
      setEditingProfile({
        full_name: profile.full_name || '',
        owner_first_name: profile.owner_first_name || '',
        owner_last_name: profile.owner_last_name || '',
        farm_name: profile.farm_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        location: profile.location || '',
        province: profile.province || ''
      })
    }
  }, [profile])

  const handleSaveProfile = async () => {
    if (!profile || !editingProfile) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editingProfile)
        .eq('id', profile.id)
      
      if (error) throw error
      
      await refreshProfile()
      alert('Profile updated successfully.')
    } catch (err: any) {
      console.error(err)
      alert('Failed to update profile: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) return
    if (!window.confirm('Final confirmation: Delete account?')) return
    
    try {
      // In Supabase, deleting the auth user will cascade delete the profile if set up that way,
      // but usually requires an edge function or admin API for safety.
      // We will try deleting from profiles which might cascade, or just sign out.
      // (The mobile app uses a custom edge function or standard auth delete if permitted)
      const { error } = await supabase.rpc('delete_user')
      if (error) {
        alert("Your account must be deleted by an administrator or via the support team.")
        return
      }
      await signOut()
    } catch (err: any) {
      alert("Failed to delete account: " + err.message)
    }
  }

  if (!profile) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-neutral-50">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">My Profile</h1>
          <p className="text-neutral-500 text-sm">Manage your account details and farm settings.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-primary-600" style={{ backgroundColor: '#F0F9EB' }}>
              <User size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">{profile.full_name || profile.owner_first_name || 'User'}</h2>
              <p className="text-neutral-500 font-medium">{profile.email}</p>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 mt-2">
                <Shield size={14} className="text-neutral-600" />
                <span className="text-xs font-semibold text-neutral-700 capitalize">{profile.role}</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-700">First Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingProfile?.owner_first_name || ''}
                  onChange={e => setEditingProfile({ ...editingProfile, owner_first_name: e.target.value })}
                  placeholder="e.g. John"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-700">Last Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingProfile?.owner_last_name || ''}
                  onChange={e => setEditingProfile({ ...editingProfile, owner_last_name: e.target.value })}
                  placeholder="e.g. Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-700">Display Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingProfile?.full_name || ''}
                  onChange={e => setEditingProfile({ ...editingProfile, full_name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Phone size={14} /> Phone Number
                </label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingProfile?.phone_number || ''}
                  onChange={e => setEditingProfile({ ...editingProfile, phone_number: e.target.value })}
                  placeholder="e.g. +263 77 123 4567"
                />
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-5 mt-2 grid grid-cols-1 md:grid-cols-2 gap-5">
              {!isWorker && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                    <Building size={14} /> Farm Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={editingProfile?.farm_name || ''}
                    onChange={e => setEditingProfile({ ...editingProfile, farm_name: e.target.value })}
                    placeholder="e.g. Green Valley Farm"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <MapPin size={14} /> Address
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingProfile?.address || ''}
                  onChange={e => setEditingProfile({ ...editingProfile, address: e.target.value })}
                  placeholder="e.g. Stand 45, Valley Road"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-700">Location (City/Town)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingProfile?.location || ''}
                  onChange={e => setEditingProfile({ ...editingProfile, location: e.target.value })}
                  placeholder="e.g. Bindura"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-neutral-700">Province</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editingProfile?.province || ''}
                  onChange={e => setEditingProfile({ ...editingProfile, province: e.target.value })}
                  placeholder="e.g. Mashonaland Central"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSaveProfile}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#7AC142' }}
              >
                <Save size={18} />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden mt-8">
          <div className="p-6">
            <h2 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-2">
              <Trash2 size={20} />
              Danger Zone
            </h2>
            <p className="text-neutral-500 text-sm mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button 
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-100 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
