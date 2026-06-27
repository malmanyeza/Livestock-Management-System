import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Health from './pages/Health'
import Genetics from './pages/Genetics'
import Production from './pages/Production'
import Records from './pages/Records'
import Nutrition from './pages/Nutrition'
import Register from './pages/Register'
import Marketplace from './pages/Marketplace'
import LivestockPro from './pages/LivestockPro'
import Tasks from './pages/Tasks'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoutes() {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#7AC142', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/health" element={<Health />} />
        <Route path="/genetics" element={<Genetics />} />
        <Route path="/production" element={<Production />} />
        <Route path="/records" element={<Records />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/livestock-pro" element={<LivestockPro />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </AuthProvider>
  )
}
