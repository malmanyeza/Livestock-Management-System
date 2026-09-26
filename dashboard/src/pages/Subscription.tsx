import React, { useState, useMemo, useEffect } from 'react'
import {
  Check, Minus, Sparkles, Shield, Building2, PhoneCall,
  Printer, ArrowRight, Info, Users, Layers, Sliders, CheckCircle2,
  DollarSign, FileText, Smartphone, Radio, Award, AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export interface TierInfo {
  id: 'bronze' | 'gold' | 'platinum' | 'enterprise'
  shortName: string
  fullName: string
  badge: string
  tagline: string
  dotColor: string
  accentBg: string
  borderColor: string
  targetAudience: string
  animalLimit: string
  maxAnimals: number
  monthlyPrice: number // 0 for free, -1 for custom
  annualPrice: number
  coreValue: string
  userLimit: string
}

export const TIERS: TierInfo[] = [
  {
    id: 'bronze',
    shortName: 'Bronze',
    fullName: 'Kumusha Bronze (Free Tier)',
    badge: 'Free Tier',
    tagline: 'Digital replacing the paper notebook.',
    dotColor: '#D97706',
    accentBg: 'bg-amber-50',
    borderColor: 'border-amber-300',
    targetAudience: 'Subsistence, communal, & hobby farmers',
    animalLimit: 'Up to 10 animals',
    maxAnimals: 10,
    monthlyPrice: 0,
    annualPrice: 0,
    coreValue: 'Digital replacing the paper notebook.',
    userLimit: '1 User (Farm Owner)',
  },
  {
    id: 'gold',
    shortName: 'Gold',
    fullName: 'Hurudza Gold (Growth)',
    badge: 'Growth Tier',
    tagline: 'Optimising yield, scheduling, and local market visibility.',
    dotColor: '#CA8A04',
    accentBg: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    targetAudience: 'Emerging commercial & A1 farmers',
    animalLimit: 'Up to 100 animals',
    maxAnimals: 100,
    monthlyPrice: 10,
    annualPrice: 100,
    coreValue: 'Optimising yield, scheduling, and local market visibility.',
    userLimit: '1 User (SMS to Workers)',
  },
  {
    id: 'platinum',
    shortName: 'Platinum',
    fullName: 'Divisi Platinum (Master-Farmer)',
    badge: 'Master-Farmer',
    tagline: 'Multi-worker management, deep data, and investor transparency.',
    dotColor: '#0284C7',
    accentBg: 'bg-sky-50',
    borderColor: 'border-sky-300',
    targetAudience: 'Established medium commercial & A2 farmers',
    animalLimit: 'Up to 500 animals',
    maxAnimals: 500,
    monthlyPrice: 15,
    annualPrice: 150,
    coreValue: 'Multi-worker management, deep data, and investor transparency.',
    userLimit: 'Up to 5 Users (Permissions-based)',
  },
  {
    id: 'enterprise',
    shortName: 'Enterprise',
    fullName: 'Mambo Enterprise (Custom)',
    badge: 'Enterprise',
    tagline: 'Total supply chain tracking, API integrations, and offline servers.',
    dotColor: '#7C3AED',
    accentBg: 'bg-purple-50',
    borderColor: 'border-purple-300',
    targetAudience: 'Large-scale ranches, feedlots, & cooperatives',
    animalLimit: 'Unlimited',
    maxAnimals: 99999,
    monthlyPrice: -1,
    annualPrice: -1,
    coreValue: 'Total supply chain tracking, API integrations, and offline servers.',
    userLimit: 'Unlimited Users & Roles',
  },
]

interface MatrixRow {
  key: string
  category: string
  title: string
  description: string
  bronze: string | boolean
  gold: string | boolean
  platinum: string | boolean
  enterprise: string | boolean
}

const MATRIX_ROWS: MatrixRow[] = [
  // Core Capabilities
  {
    key: 'offline_sync',
    category: 'Core Capabilities & Record-Keeping',
    title: 'Offline-First Record-Keeping',
    description: 'Digital notebook for births, deaths, sales, and theft alerts. Data sits on the mobile device and only syncs when visiting a business centre with Wi-Fi or mobile network.',
    bronze: true,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'visual_profile',
    category: 'Core Capabilities & Record-Keeping',
    title: 'Visual Profile & Tag ID',
    description: 'Basic profiles for cattle, goats, or pigs using physical ear tag numbers and visual photographic profiles.',
    bronze: true,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'market_prices',
    category: 'Core Capabilities & Record-Keeping',
    title: 'Basic Market Prices',
    description: 'Monthly regional livestock auction averages (helps communal farmers avoid being cheated by middlemen).',
    bronze: true,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'theft_log',
    category: 'Core Capabilities & Record-Keeping',
    title: 'Theft / Loss Log (ZRP Police Export)',
    description: 'A quick-export text profile of an animal to share with local ZRP (police) or community watch groups if an animal goes missing.',
    bronze: true,
    gold: true,
    platinum: true,
    enterprise: true,
  },

  // Automation & Commercial Yield
  {
    key: 'sms_reminders',
    category: 'Automation & Commercial Yield',
    title: 'Smart SMS Reminders',
    description: 'Automated text alerts for dipping schedules, vaccination dates, and gestation tracking (vital because smallholders don\'t always check app notifications, but they always read SMS).',
    bronze: false,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'production_weight',
    category: 'Automation & Commercial Yield',
    title: 'Production & Weight Logs',
    description: 'Daily milk weigh-ins for small dairies, or regular weight tracking for beef/pigs to calculate market readiness.',
    bronze: false,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'finance_ledger',
    category: 'Automation & Commercial Yield',
    title: 'Farm Finance Ledger',
    description: 'Simple, region-specific cash flow inputs (feed costs, veterinary supplies vs. slaughter/live sales).',
    bronze: false,
    gold: true,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'lender_exports',
    category: 'Automation & Commercial Yield',
    title: 'Vet & Lender Ready Exports',
    description: 'One-click PDF summaries formatted to satisfy requirements for local microfinance institutions (like Empower Bank or Women\'s Bank) or local veterinary inspectors.',
    bronze: false,
    gold: true,
    platinum: true,
    enterprise: true,
  },

  // Multi-User Collaboration & Scale
  {
    key: 'multi_user',
    category: 'Multi-User & Herd Optimization',
    title: 'Multi-User Collaboration',
    description: 'Permissions-based access. Farm workers on-site can log daily data on the mobile app, while the owner views the master dashboard on the web.',
    bronze: false,
    gold: false,
    platinum: 'Up to 5 Users',
    enterprise: 'Unlimited Users',
  },
  {
    key: 'smart_batch',
    category: 'Multi-User & Herd Optimization',
    title: 'Smart Batch Logging',
    description: 'Save hours of admin. Apply a single deworming treatment, dipping record, or feedback note to an entire herd or paddock group at once.',
    bronze: false,
    gold: false,
    platinum: true,
    enterprise: true,
  },
  {
    key: 'performance_analytics',
    category: 'Multi-User & Herd Optimization',
    title: 'Advanced Performance Analytics',
    description: 'Automated calculation of Average Daily Gain (ADG), cow-calf efficiency ratios, and identification of underperforming animals (e.g., cows failing to conceive).',
    bronze: false,
    gold: false,
    platinum: true,
    enterprise: true,
  },

  // Enterprise & Ecosystem
  {
    key: 'hardware_integration',
    category: 'Enterprise Hardware & Ecosystem',
    title: 'Hardware Integration',
    description: 'Integration with Bluetooth digital weight scales or RFID electronic ear-tag scanners.',
    bronze: false,
    gold: false,
    platinum: false,
    enterprise: true,
  },
  {
    key: 'cooperative_portals',
    category: 'Enterprise Hardware & Ecosystem',
    title: 'Cooperative Master Portals',
    description: 'A master dashboard for a cooperative manager to view aggregated data across 100+ local smallholder suppliers.',
    bronze: false,
    gold: false,
    platinum: false,
    enterprise: true,
  },
  {
    key: 'dedicated_manager',
    category: 'Enterprise Hardware & Ecosystem',
    title: 'Dedicated Account Manager & Training',
    description: 'Dedicated account manager and priority offline/on-site training sessions for staff.',
    bronze: false,
    gold: false,
    platinum: false,
    enterprise: true,
  },
]

export default function Subscription() {
  const { profile } = useAuth()
  const [selectedTierId, setSelectedTierId] = useState<'bronze' | 'gold' | 'platinum' | 'enterprise'>('bronze')
  const [isAnnual, setIsAnnual] = useState(false)
  const [simulatedHerdSize, setSimulatedHerdSize] = useState<number>(20)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedFeature, setSelectedFeature] = useState<MatrixRow | null>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false)

  const selectedTier = useMemo(() => {
    return TIERS.find((t) => t.id === selectedTierId) || TIERS[0]
  }, [selectedTierId])

  // Recommended tier from simulator
  const recommendedTier = useMemo(() => {
    if (simulatedHerdSize <= 10) return TIERS[0]
    if (simulatedHerdSize <= 100) return TIERS[1]
    if (simulatedHerdSize <= 500) return TIERS[2]
    return TIERS[3]
  }, [simulatedHerdSize])

  // Automatically update active package as user moves herd slider
  useEffect(() => {
    let nextTier: 'bronze' | 'gold' | 'platinum' | 'enterprise' = 'bronze'
    if (simulatedHerdSize <= 10) nextTier = 'bronze'
    else if (simulatedHerdSize <= 100) nextTier = 'gold'
    else if (simulatedHerdSize <= 500) nextTier = 'platinum'
    else nextTier = 'enterprise'

    if (nextTier !== selectedTierId) {
      setSelectedTierId(nextTier)
    }
  }, [simulatedHerdSize])

  const handleSelectTier = (tier: TierInfo) => {
    setSelectedTierId(tier.id)
    if (tier.id === 'bronze' && simulatedHerdSize > 10) {
      setSimulatedHerdSize(10)
    } else if (tier.id === 'gold' && (simulatedHerdSize <= 10 || simulatedHerdSize > 100)) {
      setSimulatedHerdSize(50)
    } else if (tier.id === 'platinum' && (simulatedHerdSize <= 100 || simulatedHerdSize > 500)) {
      setSimulatedHerdSize(250)
    } else if (tier.id === 'enterprise' && simulatedHerdSize <= 500) {
      setSimulatedHerdSize(750)
    }
  }

  const formatPrice = (tier: TierInfo) => {
    if (tier.monthlyPrice === 0) return '$0 / Free'
    if (tier.monthlyPrice === -1) return 'Custom Quote'
    if (isAnnual) {
      return `$${tier.annualPrice} / year`
    }
    return `$${tier.monthlyPrice} / month`
  }

  const filteredRows = useMemo(() => {
    if (activeCategory === 'all') return MATRIX_ROWS
    return MATRIX_ROWS.filter((r) => r.category === activeCategory)
  }, [activeCategory])

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(MATRIX_ROWS.map((r) => r.category)))]
  }, [])

  return (
    <div className="flex-1 bg-neutral-50 overflow-y-auto p-4 md:p-8 space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Pricing Packages
            </span>
            <span className="text-xs text-neutral-500">• Zvipfuwo Choice Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Interactive Subscription Matrix
          </h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
            Clean, modern, presentation-ready tier breakdown designed for Zimbabwean communal, A1, A2 commercial livestock producers, and cooperatives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 shadow-sm transition"
          >
            <Printer size={16} />
            <span>Print / PDF</span>
          </button>
          <button
            onClick={() => setEnterpriseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 shadow-sm transition"
          >
            <PhoneCall size={16} />
            <span>Contact Enterprise</span>
          </button>
        </div>
      </div>

      {/* Top Status Bar (Matching Image 1) */}
      <div className="bg-white rounded-xl p-4 md:p-6 border border-neutral-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 md:divide-x md:divide-neutral-200">
        <div className="flex flex-col items-start md:pr-4">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Selected Tier
          </span>
          <span className="text-lg md:text-xl font-bold text-neutral-900 mt-0.5 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedTier.dotColor }} />
            {selectedTier.fullName}
          </span>
          <span className="text-xs text-neutral-500 mt-0.5">{selectedTier.badge}</span>
        </div>

        <div className="flex flex-col items-start md:items-center md:px-4">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Tier Base Cost
          </span>
          <span className="text-lg md:text-xl font-bold text-emerald-600 mt-0.5">
            {formatPrice(selectedTier)}
          </span>
          <span className="text-xs text-neutral-500 mt-0.5">
            {isAnnual && selectedTier.monthlyPrice > 0 ? 'Save ~17% with annual billing' : 'Standard billing'}
          </span>
        </div>

        <div className="flex flex-col items-start md:items-end md:pl-4">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Herd Suitability
          </span>
          <span className="text-lg md:text-xl font-bold text-neutral-900 mt-0.5">
            {selectedTier.animalLimit}
          </span>
          <span className="text-xs text-neutral-500 mt-0.5">
            Simulated: <strong className="text-neutral-800">{simulatedHerdSize} Head</strong>
          </span>
        </div>
      </div>

      {/* Interactive Herd Operational Size Simulator (Matching Image 1) */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Sliders size={18} className="text-blue-600" />
              Simulate Your Herd Operational Size
            </h3>
            <p className="text-xs text-neutral-500">
              Drag the slider to find the package that matches your operational capacity and scaling goals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-neutral-100 rounded-lg text-sm font-bold text-neutral-800 border border-neutral-200">
              {simulatedHerdSize >= 1000 ? '1,000+ head' : `${simulatedHerdSize} head`}
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="pt-2">
          <input
            type="range"
            min={1}
            max={1000}
            step={5}
            value={simulatedHerdSize}
            onChange={(e) => setSimulatedHerdSize(Number(e.target.value))}
            className="w-full h-2.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
          />
          {/* Quick presets */}
          <div className="flex justify-between items-center text-xs text-neutral-500 mt-2 px-1 font-medium">
            <button
              onClick={() => setSimulatedHerdSize(10)}
              className={`hover:text-neutral-900 transition ${simulatedHerdSize <= 10 ? 'font-bold text-amber-700' : ''}`}
            >
              10 head (Bronze)
            </button>
            <button
              onClick={() => setSimulatedHerdSize(50)}
              className="hover:text-neutral-900 transition hidden sm:inline"
            >
              50 head
            </button>
            <button
              onClick={() => setSimulatedHerdSize(100)}
              className={`hover:text-neutral-900 transition ${simulatedHerdSize > 10 && simulatedHerdSize <= 100 ? 'font-bold text-yellow-700' : ''}`}
            >
              100 head (Gold)
            </button>
            <button
              onClick={() => setSimulatedHerdSize(250)}
              className="hover:text-neutral-900 transition hidden sm:inline"
            >
              250 head
            </button>
            <button
              onClick={() => setSimulatedHerdSize(500)}
              className={`hover:text-neutral-900 transition ${simulatedHerdSize > 100 && simulatedHerdSize <= 500 ? 'font-bold text-sky-700' : ''}`}
            >
              500 head (Platinum)
            </button>
            <button
              onClick={() => setSimulatedHerdSize(1000)}
              className={`hover:text-neutral-900 transition ${simulatedHerdSize > 500 ? 'font-bold text-purple-700' : ''}`}
            >
              1,000+ (Enterprise)
            </button>
          </div>
        </div>

        {/* Simulator Recommendation Banner */}
        <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} style={{ color: recommendedTier.dotColor }} />
            <span className="text-sm text-neutral-700">
              For your operational herd of <strong>{simulatedHerdSize} animals</strong>, we recommend the{' '}
              <strong style={{ color: recommendedTier.dotColor }}>{recommendedTier.fullName}</strong>.
            </span>
          </div>
          {recommendedTier.id !== selectedTierId && (
            <button
              onClick={() => handleSelectTier(recommendedTier)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
            >
              Select {recommendedTier.shortName} Plan
            </button>
          )}
        </div>
      </div>

      {/* Billing Switcher (Monthly vs Annual) */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1 bg-neutral-200 rounded-xl">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition ${
              !isAnnual ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition flex items-center gap-1.5 ${
              isAnnual ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md">
              Save ~17%
            </span>
          </button>
        </div>
      </div>

      {/* Subscription Package Tier Breakdown (4 Cards matching Image 1 & 2) */}
      <div>
        <h2 className="text-lg font-bold text-neutral-900 mb-4">
          Subscription Package Tier Breakdown
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((tier) => {
            const isSelected = selectedTierId === tier.id
            const isRecommended = recommendedTier.id === tier.id
            return (
              <div
                key={tier.id}
                onClick={() => handleSelectTier(tier)}
                className={`relative rounded-xl p-5 border-2 cursor-pointer transition-all duration-200 bg-white flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 shadow-md ring-2 ring-blue-100'
                    : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white tracking-wide uppercase shadow-sm">
                    Recommended
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.dotColor }} />
                    <h3 className="text-base font-bold text-neutral-900">{tier.shortName}</h3>
                    <span className="ml-auto text-[11px] font-semibold text-neutral-500 px-2 py-0.5 bg-neutral-100 rounded">
                      {tier.badge}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500 min-h-[32px] line-clamp-2">{tier.tagline}</p>

                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="text-2xl font-black text-neutral-900">
                      {formatPrice(tier)}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {tier.animalLimit}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectTier(tier)
                      if (tier.id === 'enterprise') {
                        setEnterpriseModalOpen(true)
                      } else {
                        setConfirmModalOpen(true)
                      }
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                        : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                    }`}
                  >
                    <span>{tier.id === 'enterprise' ? 'Request Quote' : isSelected ? 'Current Plan' : 'Select Plan'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Target Audience & Core Value Presentation Grid (Matching Image 2) */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-neutral-200 bg-neutral-50/50">
          <h3 className="text-base font-bold text-neutral-900">
            Strategic Value & Audience Alignment
          </h3>
          <p className="text-xs text-neutral-500">
            Clear delineation of target livestock categories across communal, smallholder, medium commercial, and large-scale operations.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100/70 text-neutral-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-44">Feature / Tier</th>
                {TIERS.map((tier) => (
                  <th
                    key={tier.id}
                    className={`py-3 px-4 text-xs font-bold ${
                      selectedTierId === tier.id ? 'bg-blue-50 text-blue-900' : 'text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.dotColor }} />
                      <span>{tier.fullName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              <tr className="hover:bg-neutral-50/50">
                <td className="py-3 px-4 font-bold text-neutral-800 bg-neutral-50/30">Target Audience</td>
                {TIERS.map((tier) => (
                  <td key={tier.id} className={`py-3 px-4 ${selectedTierId === tier.id ? 'bg-blue-50/40 font-medium' : 'text-neutral-700'}`}>
                    {tier.targetAudience}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-neutral-50/50">
                <td className="py-3 px-4 font-bold text-neutral-800 bg-neutral-50/30">Animal Limit</td>
                {TIERS.map((tier) => (
                  <td key={tier.id} className={`py-3 px-4 ${selectedTierId === tier.id ? 'bg-blue-50/40 font-semibold' : 'text-neutral-700'}`}>
                    {tier.animalLimit}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-neutral-50/50">
                <td className="py-3 px-4 font-bold text-neutral-800 bg-neutral-50/30">Monthly Price</td>
                {TIERS.map((tier) => (
                  <td key={tier.id} className={`py-3 px-4 ${selectedTierId === tier.id ? 'bg-blue-50/40 font-bold' : 'text-neutral-800'}`}>
                    {tier.monthlyPrice === 0 ? '$0' : tier.monthlyPrice === -1 ? 'Custom Quote' : `$${tier.monthlyPrice} / month`}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-neutral-50/50">
                <td className="py-3 px-4 font-bold text-neutral-800 bg-neutral-50/30">Annual Price</td>
                {TIERS.map((tier) => (
                  <td key={tier.id} className={`py-3 px-4 ${selectedTierId === tier.id ? 'bg-blue-50/40 font-bold' : 'text-neutral-800'}`}>
                    {tier.annualPrice === 0 ? '$0' : tier.annualPrice === -1 ? 'Custom Quote / Annual Contract' : `$${tier.annualPrice} / year`}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-neutral-50/50">
                <td className="py-3 px-4 font-bold text-neutral-800 bg-neutral-50/30">Core Value</td>
                {TIERS.map((tier) => (
                  <td key={tier.id} className={`py-3 px-4 ${selectedTierId === tier.id ? 'bg-blue-50/40 font-medium' : 'text-neutral-700'}`}>
                    {tier.coreValue}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Capabilities Comparison Matrix Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Interactive Capabilities Comparison Matrix
            </h3>
            <p className="text-xs text-neutral-500">
              Granular breakdown of features across all 4 packages. Click any row to view operational context.
            </p>
          </div>

          {/* Category filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat === 'all' ? 'All Features' : cat.split('&')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100/70 text-neutral-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-64">Core Capabilities</th>
                {TIERS.map((tier) => (
                  <th
                    key={tier.id}
                    className={`py-3.5 px-4 text-center cursor-pointer transition ${
                      selectedTierId === tier.id ? 'bg-blue-50 text-blue-900' : 'hover:bg-neutral-200/50'
                    }`}
                    onClick={() => handleSelectTier(tier)}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.dotColor }} />
                      <span className="font-bold">{tier.shortName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {filteredRows.map((row) => (
                <tr
                  key={row.key}
                  onClick={() => setSelectedFeature(row)}
                  className="hover:bg-neutral-50/70 cursor-pointer transition"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-neutral-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-neutral-900">{row.title}</span>
                        <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">{row.description}</p>
                      </div>
                    </div>
                  </td>

                  {TIERS.map((tier) => {
                    const val = row[tier.id]
                    const isSelected = selectedTierId === tier.id
                    return (
                      <td
                        key={tier.id}
                        className={`py-3.5 px-4 text-center ${isSelected ? 'bg-blue-50/40' : ''}`}
                      >
                        {typeof val === 'boolean' ? (
                          val ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white shadow-xs">
                              <Check size={13} strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="text-neutral-300 font-bold">—</span>
                          )
                        ) : (
                          <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            isSelected ? 'bg-blue-100 text-blue-800' : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {val}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Plan Breakdown Sections (A, B, C, D) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier A: Bronze */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-600" />
            <h3 className="text-base font-bold text-neutral-900">
              A. Kumusha Bronze Plan (Free Tier)
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
            Digital notebook replacing the paper book for communal, subsistence, and hobby livestock keepers.
          </p>
          <ul className="space-y-2 text-xs text-neutral-700 pt-2 border-t border-neutral-100">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Offline-First Record-Keeping:</span>
              <span>Digital notebook for births, deaths, sales, and theft alerts. Sits on the phone and only syncs when visiting a business centre with Wi-Fi/network.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Visual Profile & Tag ID:</span>
              <span>Basic profiles for cattle, goats, or pigs using physical ear tag numbers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Basic Market Prices:</span>
              <span>Monthly regional livestock auction averages (helps communal farmers avoid being cheated by middlemen).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Theft/Loss Log:</span>
              <span>A quick-export text profile of an animal to share with local ZRP (police) or community watch groups if an animal goes missing.</span>
            </li>
          </ul>
        </div>

        {/* Tier B: Gold */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-yellow-600" />
            <h3 className="text-base font-bold text-neutral-900">
              B. Hurudza Gold Plan ($10/mo • $100/yr)
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
            For emerging commercial & A1 farmers wanting smart alerts, milk/weight yield, and lender records.
          </p>
          <ul className="space-y-2 text-xs text-neutral-700 pt-2 border-t border-neutral-100">
            <li className="flex items-start gap-2 text-neutral-500 italic">
              <span>Includes all Bronze features, plus:</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Smart SMS Reminders:</span>
              <span>Automated text alerts for dipping schedules, vaccination dates, and gestation tracking (vital because smallholders always read SMS).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Production & Weight Logs:</span>
              <span>Daily milk weigh-ins for small dairies, or regular weight tracking for beef/pigs to calculate market readiness.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Farm Finance Ledger:</span>
              <span>Simple, region-specific cash flow inputs (feed costs, veterinary supplies vs. slaughter/live sales).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Vet & Lender Ready Exports:</span>
              <span>One-click PDF summaries formatted for Empower Bank, Women\'s Bank, or local veterinary inspectors.</span>
            </li>
          </ul>
        </div>

        {/* Tier C: Platinum */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-sky-600" />
            <h3 className="text-base font-bold text-neutral-900">
              C. Divisi Platinum Master-Farmer Plan ($15/mo • $150/yr)
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
            Established medium commercial & A2 farmers needing multi-worker delegation and deep analytics.
          </p>
          <ul className="space-y-2 text-xs text-neutral-700 pt-2 border-t border-neutral-100">
            <li className="flex items-start gap-2 text-neutral-500 italic">
              <span>Includes all Gold features, plus:</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Multi-User Collaboration:</span>
              <span>Up to 5 Users with permissions. Workers on-site log on mobile app; owner views master dashboard on web.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Smart Batch Logging:</span>
              <span>Save hours of admin. Apply a single deworming treatment, dipping record, or feedback note to an entire herd or paddock group at once.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Advanced Performance Analytics:</span>
              <span>Automated calculation of Average Daily Gain (ADG), cow-calf efficiency ratios, and identification of underperforming animals.</span>
            </li>
          </ul>
        </div>

        {/* Tier D: Enterprise */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-purple-600" />
            <h3 className="text-base font-bold text-neutral-900">
              D. Mambo Enterprise Plan (Customized)
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
            Complete ecosystem for large-scale ranches, feedlots, and cooperative aggregation hubs.
          </p>
          <ul className="space-y-2 text-xs text-neutral-700 pt-2 border-t border-neutral-100">
            <li className="flex items-start gap-2 text-neutral-500 italic">
              <span>Includes all Platinum features, plus:</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Unlimited Scale:</span>
              <span>Unlimited animals and unlimited user accounts.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Hardware Integration:</span>
              <span>Direct integration with Bluetooth weight scales or RFID electronic ear-tag scanners.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Cooperative Portals:</span>
              <span>Master dashboard for a cooperative manager to view aggregated data across 100+ local smallholder suppliers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-neutral-900">• Dedicated Account Manager:</span>
              <span>Priority offline and on-site training sessions for staff with custom uptime SLA.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Feature Details Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  {selectedFeature.category}
                </span>
                <h4 className="text-lg font-bold text-neutral-900 mt-0.5">
                  {selectedFeature.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed">
              {selectedFeature.description}
            </p>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
              <span className="text-xs font-bold text-neutral-700 block">Tier Availability:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {TIERS.map((tier) => {
                  const val = selectedFeature[tier.id]
                  return (
                    <div key={tier.id} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.dotColor }} />
                      <span className="font-semibold text-neutral-800">{tier.shortName}:</span>
                      {typeof val === 'boolean' ? (
                        val ? (
                          <span className="text-emerald-600 font-bold">Included</span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )
                      ) : (
                        <span className="text-blue-600 font-semibold">{val}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => setSelectedFeature(null)}
              className="w-full py-2 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-neutral-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: selectedTier.accentBg.replace('bg-', '') }}>
              <Sparkles size={28} style={{ color: selectedTier.dotColor }} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-neutral-900">
                Switch to {selectedTier.shortName} Plan
              </h3>
              <p className="text-xs text-neutral-500 mt-1">{selectedTier.tagline}</p>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-neutral-500 block">Billing</span>
                <span className="font-bold text-neutral-900 text-sm mt-0.5 block">{formatPrice(selectedTier)}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Capacity</span>
                <span className="font-bold text-neutral-900 text-sm mt-0.5 block">{selectedTier.animalLimit}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Users</span>
                <span className="font-bold text-neutral-900 text-sm mt-0.5 block">{selectedTier.userLimit.split(' ')[0]}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setConfirmModalOpen(false)
                  alert(`Plan changed to ${selectedTier.fullName}! All corresponding modules have been unlocked.`)
                }}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white shadow-sm transition"
                style={{ backgroundColor: selectedTier.dotColor }}
              >
                Confirm {selectedTier.shortName} Plan
              </button>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="w-full py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Contact Modal */}
      {enterpriseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Mambo Enterprise Consultation
                </h3>
                <p className="text-xs text-neutral-500">
                  Custom deployment for ranches, feedlots, and cooperative supplier portals.
                </p>
              </div>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-lg border border-purple-200 text-xs text-neutral-700 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-purple-900">
                <PhoneCall size={16} />
                <span>Direct Executive Contact: +263 77 123 4567 / +263 242 889900</span>
              </div>
              <p>
                Includes on-site engineer deployment, Bluetooth RFID wand configuration, custom cooperative reporting dashboards, and dedicated account manager SLA.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                setEnterpriseModalOpen(false)
                alert('Thank you! Our enterprise livestock team will contact you within 2 business hours.')
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Ranch / Cooperative Name</label>
                <input
                  type="text"
                  required
                  defaultValue={profile?.farm_name || ''}
                  placeholder="e.g. Marondera Cattle Cooperative"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Estimated Herd Size</label>
                  <input
                    type="number"
                    defaultValue={simulatedHerdSize >= 500 ? simulatedHerdSize : 1200}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+263..."
                    defaultValue={profile?.phone_number || ''}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm"
                >
                  Request Enterprise Proposal
                </button>
                <button
                  type="button"
                  onClick={() => setEnterpriseModalOpen(false)}
                  className="px-4 py-2.5 border border-neutral-300 rounded-lg text-neutral-700 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
