import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    let loginEmail = email.trim()
    try {
      const { data: resolvedEmail, error: rpcError } = await supabase.rpc('get_worker_auth_email', { 
        f_email: loginEmail, 
        w_pass: password 
      })
      if (!rpcError && resolvedEmail) {
        loginEmail = resolvedEmail
      }
    } catch (err) {
      console.warn('Worker resolution bypassed:', err)
    }

    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="w-full max-w-sm">
        {/* Logo block */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={`${import.meta.env.BASE_URL}logo.jpg`}
            className="w-20 h-20 rounded-3xl object-cover mb-4"
            style={{ boxShadow: '0 8px 24px rgba(122,193,66,0.3)' }}
            alt="Zvipfuwo Logo"
          />
          <h1 className="text-2xl font-bold" style={{ color: '#121416' }}>Zvipfuwo</h1>
          <p className="text-sm mt-1" style={{ color: '#6C757D' }}>Sign in to your admin dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4">
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#FDEDEC', color: '#B03A2E', border: '1px solid #F5B7B1' }}>
              {error}
            </div>
          )}
          <div>
            <label className="field-label block">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="field-input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="field-label block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="field-input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
