import re

filepath = r"c:\Users\malvern.manyeza\Desktop\Malvern\Projects\Livestock-Management-System\mobile\context\FarmDataContext.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Define the start and end markers to replace the whole block of calculation functions
start_marker = "  // 1. Weight Gain Metrics (WGM) / Average Daily Gain (ADG)"
end_marker = "  // Run Calculations"

if start_marker in content and end_marker in content:
    before = content[:content.find(start_marker)]
    after = content[content.find(end_marker):]
    
    new_block = """  // 1. Weight Gain Metrics (WGM) / Average Daily Gain (ADG)
  const calculateADG = () => {
    const totals = { goats: 0, cattle: 0, sheep: 0, pigs: 0, chickens: 0 };
    const counts = { goats: 0, cattle: 0, sheep: 0, pigs: 0, chickens: 0 };

    animals.forEach(a => {
      if (a.weight && a.previousWeight && a.daysBetweenWeights && a.daysBetweenWeights > 0) {
        const adg = (a.weight - a.previousWeight) / a.daysBetweenWeights;
        if (a.stockType === 'Goat') {
          totals.goats += adg; counts.goats++;
        } else if (['Cow', 'Bull', 'Steer', 'Heifer', 'Bullying Heifer', 'Calve'].includes(a.stockType)) {
          totals.cattle += adg; counts.cattle++;
        } else if (a.stockType === 'Sheep') {
          totals.sheep += adg; counts.sheep++;
        } else if (a.stockType === 'Pig') {
          totals.pigs += adg; counts.pigs++;
        } else if (a.stockType === 'Chicken') {
          totals.chickens += adg; counts.chickens++;
        }
      }
    });

    return {
      goats: counts.goats > 0 ? Number((totals.goats / counts.goats).toFixed(3)) : 0,
      cattle: counts.cattle > 0 ? Number((totals.cattle / counts.cattle).toFixed(3)) : 0,
      sheep: counts.sheep > 0 ? Number((totals.sheep / counts.sheep).toFixed(3)) : 0,
      pigs: counts.pigs > 0 ? Number((totals.pigs / counts.pigs).toFixed(3)) : 0,
      chickens: counts.chickens > 0 ? Number((totals.chickens / counts.chickens).toFixed(3)) : 0,
    };
  };

  // 2. Feed Conversion Ratio (FCR)
  const calculateFCR = () => {
    // Basic calculation if we don't have detailed feed intake per animal
    const fcrTotals = { cattle: 0, chicken: 0, dairy: 0, pigs: 0 };
    const fcrCounts = { cattle: 0, chicken: 0, dairy: 0, pigs: 0 };

    return {
      cattle: fcrCounts.cattle > 0 ? fcrTotals.cattle / fcrCounts.cattle : 0,
      chicken: fcrCounts.chicken > 0 ? fcrTotals.chicken / fcrCounts.chicken : 0,
      dairy: fcrCounts.dairy > 0 ? fcrTotals.dairy / fcrCounts.dairy : 0,
      pigs: fcrCounts.pigs > 0 ? fcrTotals.pigs / fcrCounts.pigs : 0,
    };
  };

  // 3. Body Condition Score (BCS)
  const calculateBCS = () => {
    const cows = animals.filter(a => a.stockType === 'Cow' || a.stockType === 'Heifer');
    
    let totalHerdBcs = 0;
    let herdCount = 0;
    animals.forEach(a => {
      if (a.bcs) {
        totalHerdBcs += a.bcs;
        herdCount++;
      }
    });

    let totalCowsBcs = 0;
    let cowsCount = 0;
    cows.forEach(a => {
      if (a.bcs) {
        totalCowsBcs += a.bcs;
        cowsCount++;
      }
    });

    return {
      averageHerdBCS: herdCount > 0 ? Number((totalHerdBcs / herdCount).toFixed(2)) : 0,
      averageBreedingBCS: cowsCount > 0 ? Number((totalCowsBcs / cowsCount).toFixed(2)) : 0,
    };
  };

  // B. REPRODUCTION & GENETICS CALCULATIONS
  const calculateReproductionMetrics = () => {
    const eligibleCows = animals.filter(a => a.stockType === 'Cow' || (a.stockType === 'Heifer' && a.isBreedingCow));
    
    const pregnantBreedings = breedingRecords.filter(r => r.breedingStatus === 'Confirmed Pregnant');
    const conceptionRate = breedingRecords.length > 0 ? (pregnantBreedings.length / breedingRecords.length) * 100 : 0;
    
    const calvesBorn = animals.filter(a => ['Calve', 'Calf'].includes(a.stockType)).length;
    const calvingPercentage = eligibleCows.length > 0 ? (calvesBorn / eligibleCows.length) * 100 : 0;

    const heatDetectionRate = 0;
    const submissionRate = 0;
    const avgBirthingToServiceInterval = 0;
    const pregnancyRate28d = 0;
    const pregnancyRate42d = 0;
    const pregnancyRate200d = 0;
    const pregnancyRateCycle = 0;
    const calvingRate21d = 0;
    const barrenCowRate = 0;

    return {
      avgBirthingToServiceInterval,
      heatDetectionRate,
      submissionRate,
      conceptionRate,
      pregnancyRate28d,
      pregnancyRate42d,
      pregnancyRate200d,
      pregnancyRateCycle,
      calvingRate21d,
      barrenCowRate,
      calvingPercentage,
    };
  };

  // C. PRODUCTION CALCULATIONS
  const calculateProductionMetrics = () => {
    const calves = animals.filter(a => ['Calve', 'Calf'].includes(a.stockType));
    const eligibleCows = animals.filter(a => a.stockType === 'Cow' || (a.stockType === 'Heifer' && a.isBreedingCow));
    
    const weanedCalves = calves.filter(a => a.calfStatus === 'Replacement' || a.calfStatus === 'Sold' || Number(a.weaningWeight || 0) > 0);
    const weaningPercentage = eligibleCows.length > 0 ? (weanedCalves.length / eligibleCows.length) * 100 : 0;
    const weaningRate = calves.length > 0 ? (weanedCalves.length / calves.length) * 100 : 0;

    const preWeaningDLWG = 0; 
    const postWeaningDLWG = 0; 

    const preWeaningMortCount = mortalityRecords.filter(m => m.isPreWeaning).length;
    const postWeaningMortCount = mortalityRecords.filter(m => !m.isPreWeaning).length;
    
    const preWeaningMortality = calves.length > 0 ? (preWeaningMortCount / calves.length) * 100 : 0;
    const postWeaningMortality = weanedCalves.length > 0 ? (postWeaningMortCount / weanedCalves.length) * 100 : 0;
    const herdMortality = animals.length > 0 ? (mortalityRecords.length / (animals.length + mortalityRecords.length)) * 100 : 0;

    return {
      weaningPercentage,
      preWeaningDLWG,
      postWeaningDLWG,
      mortalityRates: {
        preWeaning: Number(preWeaningMortality.toFixed(1)),
        postWeaning: Number(postWeaningMortality.toFixed(1)),
        herd: Number(herdMortality.toFixed(1)),
        chicken: 0,
      },
      weaningRate,
    };
  };

  // D. CATEGORY SCORES
  const calculateCategoryScores = (
    adg: any, 
    fcr: any, 
    bcs: any,
    repro: any,
    prod: any
  ) => {
    if (loadingData) {
      return { scoreNutrition: 0, scoreGenetics: 0, scoreHealth: 0, scoreProduction: 0, scoreRecords: 0, scoreDLShift: 0 };
    }

    // 1. NUTRITION SCORE (0-100)
    let nutritionPts = 0;
    let nutritionCount = 0;
    
    if (adg.cattle > 0) {
      nutritionPts += Math.min((adg.cattle / 1.13) * 100, 100);
      nutritionCount++;
    }
    if (bcs.averageHerdBCS > 0) {
      nutritionPts += Math.min((bcs.averageHerdBCS / 4.0) * 100, 100);
      nutritionCount++;
    }
    if (farmInspection && farmInspection.nutritionalDeficiencies > 0) {
      nutritionPts += Math.min((farmInspection.nutritionalDeficiencies / 5) * 100, 100);
      nutritionCount++;
    }
    if (farmInspection && farmInspection.growthRatePerception > 0) {
      nutritionPts += Math.min((farmInspection.growthRatePerception / 5) * 100, 100);
      nutritionCount++;
    }
    if (farmInspection && farmInspection.overallNutritionalHealth > 0) {
      nutritionPts += Math.min((farmInspection.overallNutritionalHealth / 5) * 100, 100);
      nutritionCount++;
    }
    const scoreNutrition = nutritionCount > 0 ? Math.round(nutritionPts / nutritionCount) : 0;

    // 2. GENETICS SCORE (0-100)
    let geneticsPts = 0;
    let geneticsCount = 0;
    
    if (farmInspection?.geneticsTargets) {
      const keys = [
        'breedingBCS', 'inCalf', 'conceptionRate', 'firstTrimesterPD', 'secondTrimesterPD',
        'thirdTrimesterPD', 'calvingInterval', 'calfMortality', 'calfCropPercent', 'vigour'
      ];
      for (const k of keys) {
        const item = farmInspection.geneticsTargets[k];
        if (item && item.target > 0) {
          geneticsPts += Math.min((item.attained / item.target) * 100, 100);
          geneticsCount++;
        }
      }
    }

    const scoreGenetics = geneticsCount > 0 ? Math.round(geneticsPts / geneticsCount) : 0;

    // 3. HEALTH SCORE (0-100)
    let healthPts = 0;
    let healthCount = 0;
    const hasInspection = !!farmInspection && farmInspection.nutritionalDeficiencies > 0;
    
    if (hasInspection) {
      healthPts += ((farmInspection.vaccinationCoverage || 0) + (farmInspection.biosecurityRating || 0) + (farmInspection.dewormingPractice || 0) + (farmInspection.prudentAnthelmintic || 0) + (farmInspection.prudentAntibiotics || 0) + (farmInspection.drugBoxManagement || 0) + (farmInspection.cpdStaffControl || 0)) / 35 * 100;
      healthCount++;
    }
    const scoreHealth = healthCount > 0 ? Math.round(healthPts / healthCount) : 0;

    // 4. PRODUCTION SCORE (0-100)
    let prodPts = 0;
    let prodCount = 0;
    
    if (animals.length > 0) {
      const p_weaning = (prod.weaningPercentage / 94) * 100;
      const p_adg = (adg.cattle / 0.9) * 100;
      const p_preWeaningDLWG = ((adg.cattle * 0.85) / 0.7) * 100;
      const p_postWeaningDLWG = (adg.cattle / 0.9) * 100;
      const p_preMort = Math.max(0, 100 - (prod.mortalityRates.preWeaning / 5.0) * 100);
      const p_herdMort = Math.max(0, 100 - (prod.mortalityRates.herd / 5.0) * 100);
      const p_weaningRate = (prod.weaningPercentage / 75) * 100;
      
      const p_scores = [p_weaning, p_adg, p_preWeaningDLWG, p_postWeaningDLWG, p_preMort, p_herdMort, p_weaningRate];
      for (const s of p_scores) {
        prodPts += Math.min(s, 100);
        prodCount++;
      }
    }
    const scoreProduction = prodCount > 0 ? Math.round(prodPts / prodCount) : 0;

    // 5. RECORDS SCORE (0-100)
    let recordsPts = 0;
    let recordsCount = 0;

    const hasAnimals = animals.length > 0;
    const overrides = farmInspection?.recordsOverrides || {};

    const getVal = (key, defaultAttained, defaultTarget) => {
      const o = overrides[key] || {};
      let a = parseFloat(o.attained ?? defaultAttained) || 0;
      let t = parseFloat(o.target ?? defaultTarget) || 1;
      return Math.min((a / t) * 100, 100);
    };

    if (hasInspection) {
      // 1. Accessibility and Usage
      const accuracy = getVal('data accuracy', (farmInspection.recordsSatisfaction || 0) * 20, 95);
      const knowledge = getVal('knowledge', (farmInspection.recordsTrainingEvidence || 0) * 20, 85);
      const decision = getVal('use in decision making', (farmInspection.recordAccessibilityUsage || 0) * 20, 90);
      recordsPts += (accuracy + knowledge + decision) / 3;
      recordsCount++;

      // 2. Record System Traceability
      const birth = getVal('birth registration', farmInspection.maintainsBirth ? 100 : 0, 100);
      const movement = getVal('movement records', farmInspection.maintainsMovements ? 100 : 0, 95);
      const health = getVal('health treatments', farmInspection.maintainsHealth ? 100 : 0, 100);
      const mortality = getVal('mortality records', farmInspection.maintainsMortalities ? 100 : 0, 100);
      const feed = getVal('feed records', farmInspection.maintainsFeed ? 100 : 0, 90);
      recordsPts += (birth + movement + health + mortality + feed) / 5;
      recordsCount++;
    }

    // 3. Identification
    if (hasAnimals) {
      const earTags = getVal('ear tags', 100, 100);
      const eid = getVal('electronic id', 85, 90);
      const brand = getVal('brand registration', 92, 95);
      const dna = getVal('dna profiles', 65, 70);
      recordsPts += (earTags + eid + brand + dna) / 4;
      recordsCount++;
    }
    const scoreRecords = recordsCount > 0 ? Math.round(recordsPts / recordsCount) : 0;

    // 6. OVERALL DLSHIFT SCORE
    let activeCategories = 0;
    let sumScores = 0;
    if (scoreNutrition > 0) { activeCategories++; sumScores += scoreNutrition; }
    if (scoreGenetics > 0) { activeCategories++; sumScores += scoreGenetics; }
    if (scoreHealth > 0) { activeCategories++; sumScores += scoreHealth; }
    if (scoreProduction > 0) { activeCategories++; sumScores += scoreProduction; }
    if (scoreRecords > 0) { activeCategories++; sumScores += scoreRecords; }
    
    const scoreDLShift = activeCategories > 0 ? Math.round(sumScores / activeCategories) : 0;

    return { scoreNutrition, scoreGenetics, scoreHealth, scoreProduction, scoreRecords, scoreDLShift };
  };

"""
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(before + new_block + after)
    print("Updated FarmDataContext.tsx successfully.")
else:
    print("Markers not found in FarmDataContext.tsx")
