import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, Profile } from '../context/AuthContext'
import {
  Heart, Dna, Wheat, BarChart3, ClipboardList,
  FileEdit, ShoppingCart, Settings, TrendingUp,
  ShieldCheck, User, ChevronDown, Search, X, Check
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts'

// ─── Constants (mirrors mobile exactly) ──────────────────────────────────────

const SPECIES = [
  { label: 'Beef Production', value: 'beef-production', emoji: '🐂' },
  { label: 'Dairy Production', value: 'dairy-production', emoji: '🐄' },
  { label: 'Pen Fattening', value: 'pen-fattening', emoji: '🐑' },
  { label: 'Goats', value: 'goats', emoji: '🐐' },
  { label: 'Pigs', value: 'pigs', emoji: '🐷' },
  { label: 'Sheep', value: 'sheep', emoji: '🐑' },
  { label: 'Poultry', value: 'poultry', emoji: '🐔' },
  { label: 'Rabbits', value: 'rabbits', emoji: '🐇' },
]

const NAV_CARDS = [
  { title: 'Health',      icon: Heart,         description: 'Monitor animal health and medical records',   route: '/health',      grad: ['#EC7063','#CB4335'] },
  { title: 'Genetics',    icon: Dna,           description: 'Track breeding and genetic information',       route: '/genetics',    grad: ['#92CC4E','#639A34'] },
  { title: 'Production',  icon: BarChart3,      description: 'Monitor growth and production metrics',       route: '/production',  grad: ['#57CF91','#359563'] },
  { title: 'Records',     icon: ClipboardList,  description: 'Access and manage farm records',              route: '/records',     grad: ['#A48D3D','#715E21'] },
  { title: 'Nutrition',   icon: Wheat,          description: 'Manage feed and nutritional programs',        route: '/nutrition',   grad: ['#FFB25B','#E88A1A'] },
  { title: 'Register',    icon: FileEdit,       description: 'Register new animals and records',            route: '/register',    grad: ['#ADB5BD','#6C757D'] },
  { title: 'Marketplace', icon: ShoppingCart,   description: 'Buy, sell, and trade livestock',              route: '/marketplace', grad: ['#43B97C','#27714B'] },
  { title: 'Settings',    icon: Settings,       description: 'Configure farm preferences',                  route: '/settings',    grad: ['#6C757D','#343A40'] },
]

// Monthly trend (same mock data as mobile)
const MONTHLY_DATA = [
  {m:'Jan',v:65},{m:'Feb',v:72},{m:'Mar',v:68},{m:'Apr',v:75},
  {m:'May',v:82},{m:'Jun',v:78},{m:'Jul',v:80},{m:'Aug',v:85},
  {m:'Sep',v:82},{m:'Oct',v:78},{m:'Nov',v:80},{m:'Dec',v:83},
]
const YEARLY_DATA = [
  {m:'2020',v:58},{m:'2021',v:65},{m:'2022',v:70},
  {m:'2023',v:72},{m:'2024',v:78},{m:'2025',v:83},
]

// ─── Colour helpers ───────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { session, profile, farmers, selectedFarmer, setSelectedFarmer, targetUserId, setFarmerModalOpen } = useAuth()
  const navigate = useNavigate()

  // Data
  const [animals, setAnimals]           = useState<any[]>([])
  const [todoCount, setTodoCount]       = useState(0)
  const [scores, setScores]             = useState({
    scoreNutrition: 85,
    scoreGenetics: 92,
    scoreHealth: 88,
    scoreProduction: 75,
    scoreRecords: 78,
    scoreDLShift: 83
  })

  // UI state — mirrors mobile exactly
  const [selectedSpecies, setSelectedSpecies] = useState('beef-production')
  const [timeframe, setTimeframe]       = useState<'monthly'|'yearly'>('monthly')
  const [activeChart, setActiveChart]   = useState(0)      // 0 = line, 1 = bar

  // Load data
  useEffect(() => {
    if (!targetUserId) return

    Promise.all([
      supabase.from('animals').select('*').eq('user_id', targetUserId),
      supabase.from('todo_tasks').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId),
      supabase.from('breeding_records').select('*').eq('user_id', targetUserId),
      supabase.from('pregnancy_records').select('*').eq('user_id', targetUserId),
      supabase.from('feed_records').select('*').eq('user_id', targetUserId),
      supabase.from('production_records').select('*').eq('user_id', targetUserId),
      supabase.from('mortality_records').select('*').eq('user_id', targetUserId),
      supabase.from('farm_inspections').select('*').eq('user_id', targetUserId).maybeSingle()
    ]).then(([
      { data: animalsData },
      { count: todoCountVal },
      { data: breedingData },
      { data: pregnancyData },
      { data: feedData },
      { data: productionData },
      { data: mortalityData },
      { data: inspectionData }
    ]) => {
      const deadTags = new Set((mortalityData || []).map((m: any) => m.animal_tag).filter(Boolean))
      const aliveAnimalsData = (animalsData || []).filter((a: any) => !deadTags.has(a.tag))

      setAnimals(aliveAnimalsData)
      setTodoCount(todoCountVal ?? 0)

      const isDemo = targetUserId === '76408c11-021a-4fdd-a17c-6b90065182b7'

      // Map structures to match the mobile app context calculations
      const mappedAnimals = aliveAnimalsData.map((row: any) => ({
        weight: row.weight != null ? Number(row.weight) : undefined,
        previousWeight: row.previous_weight != null ? Number(row.previous_weight) : undefined,
        daysBetweenWeights: row.days_between_weights != null ? Number(row.days_between_weights) : undefined,
        bcs: row.bcs != null ? Number(row.bcs) : undefined,
        stockType: row.stock_type,
        isBreedingCow: row.is_breeding_cow ?? false
      }))

      const mappedBreeding = (breedingData || []).map((row: any) => ({
        earTagNumber: row.ear_tag_number,
        servicedDate: row.serviced_date,
        breedingStatus: row.breeding_status
      }))

      const mappedPregnancy = (pregnancyData || []).map((row: any) => ({
        cowEarTag: row.cow_ear_tag,
        actualCalvingDate: row.actual_calving_date
      }))

      const mappedFeed = (feedData || []).map((row: any) => ({
        animalGroup: row.animal_group,
        quantityConsumed: row.quantity_consumed != null ? Number(row.quantity_consumed) : 0
      }))

      const mappedProduction = (productionData || []).map((row: any) => ({
        type: row.type,
        quantity: row.quantity != null ? Number(row.quantity) : 0
      }))

      const mappedMortality = (mortalityData || []).map((row: any) => ({
        isPreWeaning: row.is_pre_weaning ?? false
      }))

      const defaultFarmInspection = {
        herdBcs: 3,
        nutritionalDeficiencies: 4.25,
        dungConsistency: 4,
        rumenFill: 4,
        coatSkin: 4.5,
        motilityLocomotion: 4.5,
        growthRatePerception: 3.5,
        muscleDefinition: 3,
        frameSizing: 4,
        fatCoverDevelopment: 3,
        skeletalSymmetry: 4,
        overallNutritionalHealth: 4,
        bunkFeedAvailability: 4,
        rationSortingBehaviour: 4,
        waterQualityAccess: 4,
        forageQualityPerception: 4,

        overallGeneticReproductivePerformance: 3.8,
        overallGeneticQuality: 4,
        vaccinationCoverage: 4.2,
        biosecurityRating: 3.5,
        dewormingPractice: 4,
        prudentAnthelmintic: 4,
        prudentAntibiotics: 4,
        drugBoxManagement: 4,
        cpdStaffControl: 4,
        
        maintainsBirth: true,
        maintainsMovements: true,
        maintainsHealth: true,
        maintainsMortalities: true,
        maintainsFeed: true,
        recordsSatisfaction: 4,
        recordsTrainingEvidence: 4,
        recordAccessibilityUsage: 4
      }

      const farmInspection = inspectionData?.data 
        ? { ...defaultFarmInspection, ...inspectionData.data } 
        : (isDemo ? defaultFarmInspection : null)

      // Calculate ADG
      const totals = { goats: 0.12, cattle: 0.85, sheep: 0.18, pigs: 0.65 }
      const counts = { goats: 0, cattle: 0, sheep: 0, pigs: 0 }
      mappedAnimals.forEach(a => {
        if (a.weight && a.previousWeight && a.daysBetweenWeights && a.daysBetweenWeights > 0) {
          const adgVal = (a.weight - a.previousWeight) / a.daysBetweenWeights
          if (a.stockType === 'Goat') {
            totals.goats += adgVal
            counts.goats++
          } else if (['Cow', 'Bull', 'Steer', 'Heifer', 'Bullying Heifer'].includes(a.stockType)) {
            totals.cattle += adgVal
            counts.cattle++
          } else if (a.stockType === 'Sheep') {
            totals.sheep += adgVal
            counts.sheep++
          } else if (a.stockType === 'Pig') {
            totals.pigs += adgVal
            counts.pigs++
          }
        }
      })
      const adg = {
        goats: counts.goats > 0 ? Number((totals.goats / counts.goats).toFixed(3)) : (isDemo ? 0.12 : 0),
        cattle: counts.cattle > 0 ? Number((totals.cattle / counts.cattle).toFixed(2)) : (isDemo ? 0.85 : 0),
        sheep: counts.sheep > 0 ? Number((totals.sheep / counts.sheep).toFixed(3)) : (isDemo ? 0.18 : 0),
        pigs: counts.pigs > 0 ? Number((totals.pigs / counts.pigs).toFixed(2)) : (isDemo ? 0.65 : 0)
      }

      // Calculate FCR
      const cattleFeed = mappedFeed
        .filter(f => f.animalGroup === 'Cattle-fattening')
        .reduce((sum, f) => sum + f.quantityConsumed, 0)
      const cattleWeightGain = mappedAnimals
        .filter(a => a.stockType === 'Bull' || a.stockType === 'Steer')
        .reduce((sum, a) => sum + ((a.weight || 0) - (a.previousWeight || 0)), 0)
      const cattleFCR = cattleWeightGain > 0 ? cattleFeed / cattleWeightGain : (isDemo ? 9.5 : 0)

      const chickenFeed = mappedFeed
        .filter(f => f.animalGroup === 'Poultry-broilers')
        .reduce((sum, f) => sum + f.quantityConsumed, 0)
      const chickenFCR = chickenFeed > 0 ? chickenFeed / 150 : (isDemo ? 1.7 : 0)

      const dairyFeed = mappedFeed
        .filter(f => f.animalGroup === 'Dairy-cows')
        .reduce((sum, f) => sum + f.quantityConsumed, 0)
      const milkProd = mappedProduction
        .filter(p => p.type === 'Milk')
        .reduce((sum, p) => sum + p.quantity, 0)
      const dairyFCR = milkProd > 0 ? dairyFeed / milkProd : (isDemo ? 5.8 : 0)
      const pigsFCR = isDemo ? 3.2 : 0

      const fcr = {
        cattle: Number(cattleFCR.toFixed(1)),
        chicken: Number(chickenFCR.toFixed(2)),
        dairy: Number(dairyFCR.toFixed(1)),
        pigs: Number(pigsFCR.toFixed(1))
      }

      // Calculate BCS
      const animalsWithBCS = mappedAnimals.filter(a => a.bcs !== undefined)
      const averageHerdBCS = animalsWithBCS.length > 0
        ? animalsWithBCS.reduce((sum, a) => sum + (a.bcs || 0), 0) / animalsWithBCS.length
        : (isDemo ? 3.2 : 0)

      const breedingCows = mappedAnimals.filter(a => a.isBreedingCow && a.bcs !== undefined)
      const averageBreedingBCS = breedingCows.length > 0
        ? breedingCows.reduce((sum, a) => sum + (a.bcs || 0), 0) / breedingCows.length
        : (isDemo ? 3.3 : 0)

      const bcs = {
        averageHerdBCS: Number(averageHerdBCS.toFixed(2)),
        averageBreedingBCS: Number(averageBreedingBCS.toFixed(2))
      }

      // Calculate Reproduction
      let totalIntervalDays = 0
      let countInterval = 0
      mappedPregnancy.forEach(p => {
        if (p.actualCalvingDate) {
          const breedRec = mappedBreeding.find(b => b.earTagNumber === p.cowEarTag)
          if (breedRec && breedRec.servicedDate) {
            const birthTime = new Date(p.actualCalvingDate).getTime()
            const serviceTime = new Date(breedRec.servicedDate).getTime()
            const diffDays = (serviceTime - birthTime) / (1000 * 60 * 60 * 24)
            if (diffDays > 0) {
              totalIntervalDays += diffDays
              countInterval++
            }
          }
        }
      })
      const avgBirthingToServiceInterval = countInterval > 0
        ? Math.round(totalIntervalDays / countInterval)
        : (isDemo ? 70 : 0)

      const servicedCows = mappedBreeding.filter(b => b.servicedDate).length
      const pregnantCows = mappedBreeding.filter(b => b.breedingStatus === 'Confirmed Pregnant').length
      const conceptionRate = servicedCows > 0 ? Math.round((pregnantCows / servicedCows) * 100) : (isDemo ? 67 : 0)
      const calvingPercentage = isDemo ? 96 : 0

      const repro = {
        avgBirthingToServiceInterval,
        conceptionRate,
        calvingPercentage
      }

      // Calculate Production
      const weaningPercentage = isDemo ? 95 : 0
      const preWeaningMortCount = mappedMortality.filter(m => m.isPreWeaning).length
      const postWeaningMortCount = mappedMortality.filter(m => !m.isPreWeaning).length
      
      const preWeaningMortality = mappedPregnancy.length > 0 ? (preWeaningMortCount / mappedPregnancy.length) * 100 : (isDemo ? 3.5 : 0)
      const postWeaningMortality = mappedAnimals.length > 0 ? (postWeaningMortCount / mappedAnimals.length) * 100 : (isDemo ? 2.8 : 0)
      const herdMortality = mappedAnimals.length > 0 ? (mappedMortality.length / (mappedAnimals.length + 1)) * 100 : (isDemo ? 3.0 : 0)

      const prod = {
        weaningPercentage,
        mortalityRates: {
          preWeaning: Number(preWeaningMortality.toFixed(1)),
          postWeaning: Number(postWeaningMortality.toFixed(1)),
          herd: Number(herdMortality.toFixed(1))
        }
      }

      // Compute Scores
      const hasAnimals = mappedAnimals.length > 0 || isDemo
      const hasInspection = !!farmInspection

      // 1. NUTRITION
      const adgPts = !hasAnimals ? 0 : (adg.cattle >= 0.9 ? 100 : (adg.cattle / 0.9) * 100)
      const fcrPts = !hasAnimals ? 0 : (fcr.cattle <= 8 ? 100 : fcr.cattle >= 12 ? 50 : 100 - (fcr.cattle - 8) * 12.5)
      const bcsPts = !hasAnimals ? 0 : ((bcs.averageHerdBCS >= 2.0 && bcs.averageHerdBCS <= 4.0) ? 100 : 60)
      const hasNutritionInspection = farmInspection && (farmInspection.nutritionalDeficiencies > 0 || farmInspection.overallNutritionalHealth > 0)
      const subjNutrition = !hasNutritionInspection ? 0 : ((farmInspection.nutritionalDeficiencies || 0) + (farmInspection.growthRatePerception || 0) + (farmInspection.overallNutritionalHealth || 0)) / 15 * 100

      let nutritionCount = 0
      if (adgPts > 0) nutritionCount++
      if (fcrPts > 0) nutritionCount++
      if (bcsPts > 0) nutritionCount++
      if (subjNutrition > 0) nutritionCount++
      const scoreNutrition = nutritionCount > 0 ? Math.round((adgPts + fcrPts + bcsPts + subjNutrition) / nutritionCount) : (isDemo ? 85 : 0)

      // 2. GENETICS
      const hasBreeding = mappedBreeding.length > 0 || isDemo
      const conceptionPts = !hasBreeding ? 0 : (repro.conceptionRate >= 65 ? 100 : (repro.conceptionRate / 65) * 100)
      const calvingPts = !hasBreeding ? 0 : (repro.calvingPercentage >= 95 ? 100 : 80)
      const subjGenetics = (!farmInspection || farmInspection.overallGeneticReproductivePerformance === 0) ? 0 : ((farmInspection.overallGeneticReproductivePerformance || 0) + (farmInspection.overallGeneticQuality || 0)) / 10 * 100

      let geneticsCount = 0
      if (conceptionPts > 0) geneticsCount++
      if (calvingPts > 0) geneticsCount++
      if (subjGenetics > 0) geneticsCount++
      const scoreGenetics = geneticsCount > 0 ? Math.round((conceptionPts + calvingPts + subjGenetics) / geneticsCount) : (isDemo ? 92 : 0)

      // 3. HEALTH
      const scoreHealth = hasInspection ? Math.round(
        ((farmInspection.vaccinationCoverage || 0) +
         (farmInspection.biosecurityRating || 0) +
         (farmInspection.dewormingPractice || 0) +
         (farmInspection.prudentAnthelmintic || 0) +
         (farmInspection.prudentAntibiotics || 0) +
         (farmInspection.drugBoxManagement || 0) +
         (farmInspection.cpdStaffControl || 0)) / 35 * 100
      ) : (isDemo ? 88 : 0)

      // 4. PRODUCTION
      const mortPts = !hasAnimals ? 0 : (prod.mortalityRates.herd <= 5 ? 100 : Math.max(100 - (prod.mortalityRates.herd - 5) * 10, 0))
      const weaningPts = !hasAnimals ? 0 : 95
      let productionCount = 0
      if (mortPts > 0) productionCount++
      if (weaningPts > 0) productionCount++
      const scoreProduction = productionCount > 0 ? Math.round((mortPts + weaningPts) / productionCount) : (isDemo ? 75 : 0)

      // 5. RECORDS
      let tracePoints = 0
      if (farmInspection) {
        if (farmInspection.maintainsBirth) tracePoints += 20
        if (farmInspection.maintainsMovements) tracePoints += 20
        if (farmInspection.maintainsHealth) tracePoints += 20
        if (farmInspection.maintainsMortalities) tracePoints += 20
        if (farmInspection.maintainsFeed) tracePoints += 20
      }
      const subjRecords = (!farmInspection || farmInspection.recordsSatisfaction === 0) ? 0 : ((farmInspection.recordsSatisfaction || 0) + (farmInspection.recordsTrainingEvidence || 0) + (farmInspection.recordAccessibilityUsage || 0)) / 15 * 100

      let recordsCount = 0
      if (tracePoints > 0) recordsCount++
      if (subjRecords > 0) recordsCount++
      const scoreRecords = recordsCount > 0 ? Math.round((tracePoints + subjRecords) / recordsCount) : (isDemo ? 78 : 0)

      // 6. DLSHIFT SCORE
      let activeCategories = 0
      let sumScores = 0
      if (scoreNutrition > 0) { activeCategories++; sumScores += scoreNutrition; }
      if (scoreGenetics > 0) { activeCategories++; sumScores += scoreGenetics; }
      if (scoreHealth > 0) { activeCategories++; sumScores += scoreHealth; }
      if (scoreProduction > 0) { activeCategories++; sumScores += scoreProduction; }
      if (scoreRecords > 0) { activeCategories++; sumScores += scoreRecords; }
      
      const scoreDLShift = activeCategories > 0 ? Math.round(sumScores / activeCategories) : (isDemo ? 83 : 0)

      setScores({
        scoreNutrition,
        scoreGenetics,
        scoreHealth,
        scoreProduction,
        scoreRecords,
        scoreDLShift
      })
    })
  }, [targetUserId])

  const isAdmin = profile?.role === 'admin'
  const displayName = profile?.full_name || profile?.email || 'Farmer'
  const viewingFarmer = isAdmin && selectedFarmer
  const viewingName = viewingFarmer
    ? (selectedFarmer!.full_name || selectedFarmer!.email || 'Farmer')
    : displayName

  // Animal count filtered by species
  const getCount = () => {
    const MAP: Record<string, string[]> = {
      'beef-production':  ['Cow','Heifer','Bull','Steer','Bullying Heifer','Calve','Calf'],
      'dairy-production': ['Cow','Heifer','Bullying Heifer','Calve','Calf'],
      'goats':            ['Goat'],
      'pigs':             ['Pig'],
      'sheep':            ['Sheep'],
      'pen-fattening':    ['Sheep'],
      'poultry':          ['Chicken'],
      'rabbits':          ['Rabbit'],
    }
    const types = MAP[selectedSpecies]
    return types ? animals.filter(a => types.includes(a.stock_type)).length : animals.length
  }

  // Category scores for bar chart
  const categoryData = [
    { label: 'Nutrition',  score: scores.scoreNutrition },
    { label: 'Records',    score: scores.scoreRecords },
    { label: 'Genetics',   score: scores.scoreGenetics },
    { label: 'Production', score: scores.scoreProduction },
    { label: 'Health',     score: scores.scoreHealth },
  ]

  // Chart data with live LS score injected as the last point (mirrors mobile)
  const isDemo = targetUserId === '76408c11-021a-4fdd-a17c-6b90065182b7'
  const monthlyChartData = MONTHLY_DATA.map((d, i) => {
    if (i === MONTHLY_DATA.length - 1) return { ...d, v: scores.scoreDLShift }
    return { ...d, v: isDemo ? d.v : 0 }
  })
  const yearlyChartData = YEARLY_DATA.map((d, i) => {
    if (i === YEARLY_DATA.length - 1) return { ...d, v: scores.scoreDLShift }
    return { ...d, v: isDemo ? d.v : 0 }
  })
  const chartData = timeframe === 'monthly' ? monthlyChartData : yearlyChartData



  const sp = SPECIES.find(s => s.value === selectedSpecies)

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* ── 1. HEADER ── mirrors mobile header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isAdmin ? C.primary50 : C.neutral100 }}>
          {isAdmin
            ? <ShieldCheck size={22} style={{ color: C.primary600 }} />
            : <User size={22} style={{ color: C.neutral700 }} />}
        </div>
        <div>
          <p className="text-sm" style={{ color: C.neutral500 }}>
            {isAdmin ? '🛡️ Admin Portal' : profile?.farm_name ? `🐄 ${profile.farm_name}` : 'Welcome back,'}
          </p>
          <h2 className="text-xl font-bold" style={{ color: C.neutral900 }}>{displayName}</h2>
        </div>
      </div>

      {/* ── 2. ADMIN FARMER SELECTOR BANNER ── only if admin */}
      {isAdmin && (
        <button
          onClick={() => setFarmerModalOpen(true)}
          className="w-full flex items-center justify-between rounded-2xl px-4 py-3 transition-all hover:shadow-md"
          style={{
            backgroundColor: C.white,
            border: `1.5px solid ${C.primary100}`,
            boxShadow: '0 4px 12px rgba(122,193,66,0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: C.primary50 }}>
              <ShieldCheck size={16} style={{ color: C.primary600 }} />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium" style={{ color: C.neutral500 }}>ADMIN VIEWING PORTAL</p>
              <p className="font-bold text-sm" style={{ color: C.neutral900 }}>
                {viewingName}
                {selectedFarmer?.farm_name ? ` (🐄 ${selectedFarmer.farm_name})` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: C.primary50 }}>
            <span className="text-xs font-bold" style={{ color: C.primary600 }}>Change</span>
            <ChevronDown size={14} style={{ color: C.primary600 }} />
          </div>
        </button>
      )}

      {/* ── 3. SUMMARY GRADIENT CARD ── animal count + tasks today */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.primary300}, ${C.primary600})` }}>
        <div className="flex justify-between items-center p-6">
          <div>
            <p className="text-4xl font-bold text-white">{getCount()} {sp?.emoji ?? '🐂'}</p>
            <p className="text-white mt-1" style={{ opacity: 0.9 }}>
              {sp?.label ?? 'Animals'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-white">{todoCount}</p>
            <p className="text-white" style={{ opacity: 0.9 }}>Tasks Today</p>
          </div>
        </div>
      </div>

      {/* ── 4. SPECIES PICKER ── dropdown, not chips */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: C.neutral500 }}>SELECT SPECIES</label>
        <select
          value={selectedSpecies}
          onChange={e => setSelectedSpecies(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm font-medium appearance-none cursor-pointer"
          style={{
            backgroundColor: C.white,
            border: `1.5px solid ${C.neutral200}`,
            color: C.neutral900,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236C757D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 16px center',
            paddingRight: 40,
          }}
        >
          {SPECIES.map(s => (
            <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
          ))}
        </select>
      </div>

      {/* ── 5. LIVESTOCK SHIFT SCORE CARD ── */}
      <div className="card">
        {/* Card header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold" style={{ color: C.neutral900 }}>Livestock Shift Score</h3>
            <p className="text-4xl font-bold mt-2" style={{ color: C.primary500 }}>{scores.scoreDLShift}%</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ backgroundColor: C.success50 }}>
            <TrendingUp size={18} style={{ color: C.success500 }} />
            <span className="text-sm font-semibold" style={{ color: C.success500 }}>+5% this month</span>
          </div>
        </div>

        {/* Monthly / Yearly toggle — same rounded pill toggle as mobile */}
        <div className="inline-flex rounded-lg p-1 mb-4"
          style={{ backgroundColor: C.neutral100 }}>
          {(['monthly','yearly'] as const).map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
              style={timeframe === tf
                ? { backgroundColor: C.white, color: C.neutral900, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                : { backgroundColor: 'transparent', color: C.neutral500 }}>
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>

        {/* Chart carousel — two charts with pagination dots */}
        <div>
          {/* Charts */}
          <div className="overflow-hidden rounded-xl" style={{ backgroundColor: C.neutral50 }}>
            {activeChart === 0 ? (
              /* Line / Area chart — score over time */
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 16, right: 16, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="lsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.primary500} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.primary500} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.neutral200} />
                  <XAxis dataKey="m" tick={{ fill: C.neutral500, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: C.neutral500, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: C.white, border: `1px solid ${C.neutral200}`, borderRadius: 10, fontSize: 12 }}
                    formatter={(v) => [`${v}%`, 'Score']}
                  />
                  <Area type="monotone" dataKey="v" stroke={C.primary500} strokeWidth={2.5}
                    fill="url(#lsGrad)" dot={{ fill: C.primary500, r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              /* Bar chart — category scores */
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} margin={{ top: 16, right: 16, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.neutral200} />
                  <XAxis dataKey="label" tick={{ fill: C.neutral500, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: C.neutral500, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: C.white, border: `1px solid ${C.neutral200}`, borderRadius: 10, fontSize: 12 }}
                    formatter={(v) => [`${v}%`, 'Score']}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {categoryData.map((_, i) => (
                      <rect key={i} />
                    ))}
                    {/* Use fill on Bar directly */}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pagination dots — same as mobile */}
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1].map(i => (
              <button key={i} onClick={() => setActiveChart(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width:  activeChart === i ? 16 : 8,
                  height: 8,
                  backgroundColor: activeChart === i ? C.primary500 : C.neutral300,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. QUICK ACCESS GRID ── 2-column, same as mobile */}
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: C.neutral900 }}>Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {NAV_CARDS.map(({ title, icon: Icon, description, route, grad }) => (
            <button
              key={title}
              onClick={() => navigate(route)}
              className="text-left rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
                minHeight: 140,
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Icon size={22} color="#fff" />
              </div>
              <p className="font-bold text-white text-sm mb-1">{title}</p>
              <p className="text-white text-xs leading-4" style={{ opacity: 0.88 }}>{description}</p>
            </button>
          ))}
        </div>
      </div>


    </div>
  )
}
