import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session } = useAuth()
  const navigate = useNavigate()
  
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)
    
    let loginEmail = email.trim()
    
    if (isSignUp) {
      if (!name.trim() || !farmName.trim() || !loginEmail || !password) {
        setError('Please fill in all required fields.')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.')
        setLoading(false)
        return
      }
      const { error: signUpError } = await supabase.auth.signUp({
        email: loginEmail,
        password,
        options: {
          data: {
            full_name: name.trim(),
            farm_name: farmName.trim()
          }
        }
      })
      if (signUpError) {
        setError(signUpError.message)
      } else {
        setSuccessMsg('Account created successfully! You can now sign in.')
        setIsSignUp(false)
        setPassword('')
      }
    } else {
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

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
      if (signInError) setError(signInError.message)
    }
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
          <p className="text-sm mt-1" style={{ color: '#6C757D' }}>
            {isSignUp ? 'Create your farm account' : 'Sign in to your admin dashboard'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="card space-y-4">
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#FDEDEC', color: '#B03A2E', border: '1px solid #F5B7B1' }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#E6F9F1', color: '#27714B', border: '1px solid #9FE4C1' }}>
              {successMsg}
            </div>
          )}
          
          {isSignUp && (
            <>
              <div>
                <label className="field-label block">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="field-input"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="field-label block">Farm Name</label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  className="field-input"
                  placeholder="Green Valley Farm"
                />
              </div>
            </>
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
            {loading ? (isSignUp ? 'Creating account…' : 'Signing in…') : (isSignUp ? 'Create Account' : 'Sign in')}
          </button>
          
          <div className="text-center mt-4 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setSuccessMsg('')
              }}
              className="text-sm font-semibold"
              style={{ color: '#7AC142' }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
