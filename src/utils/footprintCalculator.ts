import type { FootprintData } from '../components/Wizard';

export interface EmissionsBreakdown {
  energy: number; // tonnes CO2e
  transport: number; // tonnes CO2e
  food: number; // tonnes CO2e
  lifestyle: number; // tonnes CO2e
  total: number; // tonnes CO2e
}

// ─── Campus-Specific Transport Emission Factors (kg CO₂e per km) ───
export const TRANSPORT_FACTORS: Record<string, { factor: number; label: string; icon: string }> = {
  'petrol': { factor: 0.19, label: 'Petrol Car', icon: '🚗' },
  'diesel': { factor: 0.18, label: 'Diesel Car', icon: '🚗' },
  'hybrid': { factor: 0.11, label: 'Hybrid Car', icon: '🚗' },
  'ev': { factor: 0.05, label: 'Electric Car', icon: '⚡' },
  'cab': { factor: 0.08, label: 'Cab / Auto-Rickshaw', icon: '🚕' },
  'two-wheeler': { factor: 0.05, label: 'Two-Wheeler / Scooter', icon: '🛵' },
  'college-bus': { factor: 0.025, label: 'College Bus', icon: '🚌' },
  'transit': { factor: 0.04, label: 'Public Transit', icon: '🚌' },
  'metro': { factor: 0.02, label: 'Metro / Train', icon: '🚇' },
  'active': { factor: 0, label: 'Walk / Bicycle', icon: '🚶' },
  'walk': { factor: 0, label: 'Walk', icon: '🚶' },
  'bicycle': { factor: 0, label: 'Bicycle', icon: '🚲' },
};

// ─── Diet Emission Factors (kg CO₂e per day) ───
export const DIET_FACTORS: Record<string, { factor: number; label: string; icon: string }> = {
  'high-meat': { factor: 8.0, label: 'Heavy Meat', icon: '🥩' },
  'average': { factor: 5.5, label: 'Mixed / Average', icon: '🍗' },
  'flexitarian': { factor: 3.8, label: 'Flexitarian', icon: '🥗' },
  'vegetarian': { factor: 2.8, label: 'Vegetarian', icon: '🥬' },
  'vegan': { factor: 1.8, label: 'Vegan', icon: '🌱' },
  'canteen': { factor: 4.5, label: 'Canteen / Mess', icon: '🍽️' },
};

// ─── Waste Factors (kg CO₂e per day) ───
export const WASTE_FACTORS: Record<string, number> = {
  'none': 1.5,
  'partial': 1.3,
  'active': 0.9,
};

// ─── Original Baseline Calculation (unchanged) ───
export const calculateEmissions = (data: FootprintData): EmissionsBreakdown => {
  // 1. Energy
  const electricityEmissions = (data.electricity * 12 * 0.4) / 1000; // kg to tonnes
  let heatingEmissions = 0;
  if (data.heatingType === 'gas') {
    heatingEmissions = (data.heatingUsage * 12 * 2.0) / 1000;
  } else if (data.heatingType === 'oil') {
    heatingEmissions = (data.heatingUsage * 12 * 2.5) / 1000;
  } else if (data.heatingType === 'lpg') {
    heatingEmissions = (data.heatingUsage * 12 * 1.6) / 1000;
  }
  const totalEnergy = (electricityEmissions + heatingEmissions) / data.householdMembers;

  // 2. Transport
  let vehicleFactor = 0;
  if (data.vehicleType === 'petrol') vehicleFactor = 0.19;
  else if (data.vehicleType === 'diesel') vehicleFactor = 0.18;
  else if (data.vehicleType === 'hybrid') vehicleFactor = 0.11;
  else if (data.vehicleType === 'ev') vehicleFactor = 0.05;
  
  const vehicleEmissions = (data.vehicleDistance * 52 * vehicleFactor) / 1000;
  const publicEmissions = (data.publicDistance * 52 * 0.04) / 1000;
  const flightEmissions = ((data.shortFlights * 300 * 0.15) + (data.longFlights * 3000 * 0.11)) / 1000;
  const totalTransport = vehicleEmissions + publicEmissions + flightEmissions;

  // 3. Food
  let dietDailyEmissions = 5.5; // default
  if (data.dietType === 'high-meat') dietDailyEmissions = 8.0;
  else if (data.dietType === 'average') dietDailyEmissions = 5.5;
  else if (data.dietType === 'flexitarian') dietDailyEmissions = 3.8;
  else if (data.dietType === 'vegetarian') dietDailyEmissions = 2.8;
  else if (data.dietType === 'vegan') dietDailyEmissions = 1.8;
  
  const totalFood = (dietDailyEmissions * 365) / 1000;

  // 4. Lifestyle / Waste
  let wasteDailyEmissions = 1.5;
  if (data.recycleHabits === 'active') wasteDailyEmissions = 1.0;
  else if (data.recycleHabits === 'partial') wasteDailyEmissions = 1.3;
  
  let shoppingAddon = 0; // tonnes/year
  if (data.shoppingHabits === 'minimalist') shoppingAddon = -0.2;
  else if (data.shoppingHabits === 'heavy') shoppingAddon = 0.6;
  
  const totalLifestyle = ((wasteDailyEmissions * 365) / 1000) + shoppingAddon;

  const total = totalEnergy + totalTransport + totalFood + Math.max(0.1, totalLifestyle);

  return {
    energy: parseFloat(totalEnergy.toFixed(2)),
    transport: parseFloat(totalTransport.toFixed(2)),
    food: parseFloat(totalFood.toFixed(2)),
    lifestyle: parseFloat(Math.max(0.1, totalLifestyle).toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
};

// ═══════════════════════════════════════════════════════════════════
// NEW: Daily Footprint Breakdown (kg per day, used by Decision Engine)
// ═══════════════════════════════════════════════════════════════════

export interface DailyBreakdown {
  transport: number;
  diet: number;
  energy: number;
  waste: number;
  total: number;
}

export interface DailyInputs {
  transportMode: string;
  transportDistance: number;
  dietType: string;
  acHours: number;
  electronicsHours: number;
  recycled: boolean;
  purchases: number;
  customAction: string;
}

export const calculateDailyBreakdown = (inputs: DailyInputs): DailyBreakdown => {
  const tFactor = TRANSPORT_FACTORS[inputs.transportMode]?.factor ?? 0;
  const transport = inputs.transportDistance * tFactor;

  const diet = DIET_FACTORS[inputs.dietType]?.factor ?? 5.5;

  const energy = (inputs.acHours * 1.2) + (inputs.electronicsHours * 0.45);

  const wasteBase = inputs.recycled ? 0.9 : 1.5;
  const waste = wasteBase + (inputs.purchases * 1.5);

  const customDeduction = inputs.customAction.trim() !== '' ? 2.0 : 0;

  const total = Math.max(0.1, transport + diet + energy + waste - customDeduction);

  return {
    transport: parseFloat(transport.toFixed(2)),
    diet: parseFloat(diet.toFixed(2)),
    energy: parseFloat(energy.toFixed(2)),
    waste: parseFloat(waste.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
};

// ═══════════════════════════════════════════════════════════════════
// NEW: Confidence Scoring System
// ═══════════════════════════════════════════════════════════════════

export interface ConfidenceResult {
  score: number; // 0-100
  rating: 'High' | 'Moderate' | 'Low';
  color: string;
  filledFields: number;
  totalFields: number;
  missingHints: string[];
}

export const calculateConfidence = (inputs: Partial<DailyInputs>): ConfidenceResult => {
  const fields = [
    { key: 'transportMode', filled: !!inputs.transportMode && inputs.transportMode !== '', hint: 'transport mode' },
    { key: 'transportDistance', filled: inputs.transportDistance !== undefined && inputs.transportDistance > 0, hint: 'travel distance' },
    { key: 'dietType', filled: !!inputs.dietType && inputs.dietType !== '', hint: 'diet type' },
    { key: 'acHours', filled: inputs.acHours !== undefined, hint: 'AC/heating hours' },
    { key: 'electronicsHours', filled: inputs.electronicsHours !== undefined, hint: 'electronics usage' },
    { key: 'recycled', filled: inputs.recycled !== undefined, hint: 'recycling habits' },
    { key: 'purchases', filled: inputs.purchases !== undefined, hint: 'purchase count' },
  ];

  const filled = fields.filter(f => f.filled).length;
  const total = fields.length;
  const score = Math.round((filled / total) * 100);

  const missingHints = fields.filter(f => !f.filled).map(f => f.hint);

  let rating: 'High' | 'Moderate' | 'Low';
  let color: string;
  if (score >= 80) {
    rating = 'High';
    color = '#10b981';
  } else if (score >= 50) {
    rating = 'Moderate';
    color = '#f59e0b';
  } else {
    rating = 'Low';
    color = '#f87171';
  }

  return { score, rating, color, filledFields: filled, totalFields: total, missingHints };
};

// Calculate footprint range based on confidence
export const calculateFootprintRange = (footprint: number, confidence: ConfidenceResult): { low: number; high: number } => {
  // Higher confidence = tighter range
  const uncertainty = (100 - confidence.score) / 100; // 0 to 1
  const margin = footprint * uncertainty * 0.15; // max ±15% at 0 confidence
  return {
    low: parseFloat(Math.max(0.1, footprint - margin).toFixed(1)),
    high: parseFloat((footprint + margin).toFixed(1)),
  };
};

// ═══════════════════════════════════════════════════════════════════
// NEW: Impact × Effort Green ROI Ranking
// ═══════════════════════════════════════════════════════════════════

export type EffortLevel = 'Very Easy' | 'Easy' | 'Medium' | 'Difficult';

export interface GreenAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  weeklyReductionKg: number;
  effort: EffortLevel;
  effortScore: number; // 1 (easiest) to 4 (hardest)
  effortColor: string;
  greenROI: number; // weeklyReduction / effortScore
  category: string;
  applicable: boolean; // whether this action applies to the user's current inputs
}

const EFFORT_META: Record<EffortLevel, { score: number; color: string }> = {
  'Very Easy': { score: 1, color: '#10b981' },
  'Easy': { score: 1.5, color: '#34d399' },
  'Medium': { score: 2.5, color: '#f59e0b' },
  'Difficult': { score: 4, color: '#f87171' },
};

export const rankActions = (inputs: DailyInputs): GreenAction[] => {
  const actions: Omit<GreenAction, 'greenROI'>[] = [];

  // Transport actions
  const tFactor = TRANSPORT_FACTORS[inputs.transportMode]?.factor ?? 0;
  if (tFactor > 0.04) {
    // Suggest bus
    const busSaving = (tFactor - 0.025) * inputs.transportDistance * 7;
    if (busSaving > 0) {
      actions.push({
        id: 'transport-bus',
        title: 'Switch to campus bus/shuttle',
        description: `Replace ${TRANSPORT_FACTORS[inputs.transportMode]?.label || 'your vehicle'} with campus bus for your ${inputs.transportDistance}km commute`,
        icon: '🚌',
        weeklyReductionKg: parseFloat(busSaving.toFixed(1)),
        effort: tFactor > 0.1 ? 'Medium' : 'Easy',
        effortScore: EFFORT_META[tFactor > 0.1 ? 'Medium' : 'Easy'].score,
        effortColor: EFFORT_META[tFactor > 0.1 ? 'Medium' : 'Easy'].color,
        category: 'Transport',
        applicable: true,
      });
    }
    // Suggest metro
    const metroSaving = (tFactor - 0.02) * inputs.transportDistance * 7;
    if (metroSaving > 0) {
      actions.push({
        id: 'transport-metro',
        title: 'Take the metro instead',
        description: `Switch your commute to metro/train — nearly 90% less emissions per km`,
        icon: '🚇',
        weeklyReductionKg: parseFloat(metroSaving.toFixed(1)),
        effort: 'Medium',
        effortScore: EFFORT_META['Medium'].score,
        effortColor: EFFORT_META['Medium'].color,
        category: 'Transport',
        applicable: true,
      });
    }
    // Suggest cycling/walking if distance < 10km
    if (inputs.transportDistance <= 10) {
      const activeSaving = tFactor * inputs.transportDistance * 7;
      actions.push({
        id: 'transport-active',
        title: 'Walk or cycle to campus',
        description: `Your ${inputs.transportDistance}km commute is bikeable — zero emissions + great exercise`,
        icon: '🚲',
        weeklyReductionKg: parseFloat(activeSaving.toFixed(1)),
        effort: inputs.transportDistance <= 3 ? 'Easy' : 'Medium',
        effortScore: EFFORT_META[inputs.transportDistance <= 3 ? 'Easy' : 'Medium'].score,
        effortColor: EFFORT_META[inputs.transportDistance <= 3 ? 'Easy' : 'Medium'].color,
        category: 'Transport',
        applicable: true,
      });
    }
  }

  // Diet actions
  const currentDiet = DIET_FACTORS[inputs.dietType]?.factor ?? 5.5;
  if (currentDiet > 2.8) {
    const vegSaving = (currentDiet - 2.8) * 3; // 3 days/week vegetarian
    actions.push({
      id: 'diet-veg3',
      title: 'Go vegetarian 3 days/week',
      description: `Replace ${DIET_FACTORS[inputs.dietType]?.label || 'meat'} meals with vegetarian options 3 days a week`,
      icon: '🥬',
      weeklyReductionKg: parseFloat(vegSaving.toFixed(1)),
      effort: currentDiet >= 8.0 ? 'Difficult' : 'Medium',
      effortScore: EFFORT_META[currentDiet >= 8.0 ? 'Difficult' : 'Medium'].score,
      effortColor: EFFORT_META[currentDiet >= 8.0 ? 'Difficult' : 'Medium'].color,
      category: 'Diet',
      applicable: true,
    });
  }
  if (currentDiet > 1.8) {
    const veganSaving = (currentDiet - 1.8) * 1; // 1 day/week vegan
    actions.push({
      id: 'diet-vegan1',
      title: 'Try 1 fully plant-based day/week',
      description: `Go vegan for just 1 day per week — every small step counts`,
      icon: '🌱',
      weeklyReductionKg: parseFloat(veganSaving.toFixed(1)),
      effort: 'Easy',
      effortScore: EFFORT_META['Easy'].score,
      effortColor: EFFORT_META['Easy'].color,
      category: 'Diet',
      applicable: true,
    });
  }

  // Energy actions
  if (inputs.acHours > 1) {
    const acSaving = Math.min(inputs.acHours, 2) * 1.2 * 7;
    actions.push({
      id: 'energy-ac',
      title: `Reduce AC by ${Math.min(inputs.acHours, 2)} hour${Math.min(inputs.acHours, 2) > 1 ? 's' : ''}/day`,
      description: `Use a fan instead or set AC 2°C higher — comfort stays, carbon drops`,
      icon: '❄️',
      weeklyReductionKg: parseFloat(acSaving.toFixed(1)),
      effort: 'Easy',
      effortScore: EFFORT_META['Easy'].score,
      effortColor: EFFORT_META['Easy'].color,
      category: 'Energy',
      applicable: true,
    });
  }
  if (inputs.electronicsHours > 4) {
    const elecSaving = 2 * 0.45 * 7; // reduce by 2 hrs
    actions.push({
      id: 'energy-unplug',
      title: 'Unplug devices & reduce screen time 2hrs',
      description: `Switch off unused electronics and chargers — eliminates phantom power`,
      icon: '🔌',
      weeklyReductionKg: parseFloat(elecSaving.toFixed(1)),
      effort: 'Very Easy',
      effortScore: EFFORT_META['Very Easy'].score,
      effortColor: EFFORT_META['Very Easy'].color,
      category: 'Energy',
      applicable: true,
    });
  }

  // Waste actions
  if (!inputs.recycled) {
    const recycleSaving = (1.5 - 0.9) * 7;
    actions.push({
      id: 'waste-recycle',
      title: 'Start recycling & composting',
      description: `Sort waste into recyclables, compostables, and landfill — huge impact for minimal effort`,
      icon: '♻️',
      weeklyReductionKg: parseFloat(recycleSaving.toFixed(1)),
      effort: 'Easy',
      effortScore: EFFORT_META['Easy'].score,
      effortColor: EFFORT_META['Easy'].color,
      category: 'Lifestyle',
      applicable: true,
    });
  }
  if (inputs.purchases > 0) {
    const shopSaving = inputs.purchases * 1.5 * 7;
    actions.push({
      id: 'waste-shop',
      title: 'Buy second-hand or borrow instead',
      description: `Each new item costs ~1.5 kg CO₂ — consider repair, borrow, or thrift`,
      icon: '🛍️',
      weeklyReductionKg: parseFloat(Math.min(shopSaving, 15).toFixed(1)),
      effort: 'Medium',
      effortScore: EFFORT_META['Medium'].score,
      effortColor: EFFORT_META['Medium'].color,
      category: 'Lifestyle',
      applicable: true,
    });
  }

  // Always-applicable actions
  actions.push({
    id: 'lifestyle-reusable',
    title: 'Use reusable bottle & bags',
    description: `Swap disposable bottles and plastic bags — costs ₹0 after initial purchase`,
    icon: '🚰',
    weeklyReductionKg: 3.5,
    effort: 'Very Easy',
    effortScore: EFFORT_META['Very Easy'].score,
    effortColor: EFFORT_META['Very Easy'].color,
    category: 'Lifestyle',
    applicable: true,
  });

  // Calculate Green ROI and sort
  const ranked: GreenAction[] = actions.map(a => ({
    ...a,
    greenROI: parseFloat((a.weeklyReductionKg / a.effortScore).toFixed(1)),
  }));

  // Sort by Green ROI descending
  ranked.sort((a, b) => b.greenROI - a.greenROI);

  return ranked;
};

// ═══════════════════════════════════════════════════════════════════
// NEW: Carbon Budget Calculator
// ═══════════════════════════════════════════════════════════════════

export interface BudgetStatus {
  target: number; // kg/day
  actual: number; // kg/day
  difference: number; // positive = over budget
  utilizationPercent: number; // 100 = exactly at budget
  status: 'under' | 'near' | 'over';
  statusColor: string;
  weeklyTrend: { day: string; value: number; target: number }[];
  weeklyChangePercent: number;
  challengeMet: boolean;
}

export const calculateBudget = (
  target: number,
  todayFootprint: number,
  history: { date: string; footprint: number }[],
  challengeReductionPercent: number = 10
): BudgetStatus => {
  const difference = todayFootprint - target;
  const utilizationPercent = target > 0 ? (todayFootprint / target) * 100 : 0;

  let status: 'under' | 'near' | 'over';
  let statusColor: string;
  if (utilizationPercent <= 90) {
    status = 'under';
    statusColor = '#10b981';
  } else if (utilizationPercent <= 110) {
    status = 'near';
    statusColor = '#f59e0b';
  } else {
    status = 'over';
    statusColor = '#f87171';
  }

  // Build weekly trend from history (last 7 days)
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyTrend: { day: string; value: number; target: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = history.find(h => h.date === dateStr);
    weeklyTrend.push({
      day: dayNames[d.getDay()],
      value: entry ? entry.footprint : 0,
      target,
    });
  }

  // Calculate weekly change percent
  const thisWeekEntries = weeklyTrend.filter(t => t.value > 0);
  let weeklyChangePercent = 0;
  if (thisWeekEntries.length >= 2) {
    const firstVal = thisWeekEntries[0].value;
    const lastVal = thisWeekEntries[thisWeekEntries.length - 1].value;
    weeklyChangePercent = firstVal > 0 ? ((firstVal - lastVal) / firstVal) * 100 : 0;
  }

  const challengeMet = weeklyChangePercent >= challengeReductionPercent;

  return {
    target,
    actual: todayFootprint,
    difference: parseFloat(difference.toFixed(1)),
    utilizationPercent: parseFloat(utilizationPercent.toFixed(0)),
    status,
    statusColor,
    weeklyTrend,
    weeklyChangePercent: parseFloat(weeklyChangePercent.toFixed(1)),
    challengeMet,
  };
};

// ═══════════════════════════════════════════════════════════════════
// NEW: Campus Scaling Calculator
// ═══════════════════════════════════════════════════════════════════

export interface CampusScaleResult {
  weeklyReductionKg: number;
  annualReductionKg: number;
  annualReductionTonnes: number;
  treesEquivalent: number;
  carsOffRoad: number; // 1 car ≈ 4,600 kg CO₂/year
  homesEquivalent: number; // avg home ≈ 900 kg CO₂/month
}

export const scaleToCampus = (
  individualDailyReductionKg: number,
  studentCount: number,
  adoptionRatePercent: number = 100
): CampusScaleResult => {
  const adoptingStudents = studentCount * (adoptionRatePercent / 100);
  const weeklyReductionKg = individualDailyReductionKg * adoptingStudents * 7;
  const annualReductionKg = weeklyReductionKg * 52;
  const annualReductionTonnes = annualReductionKg / 1000;
  const treesEquivalent = Math.round(annualReductionKg / 22);
  const carsOffRoad = parseFloat((annualReductionTonnes / 4.6).toFixed(1));
  const homesEquivalent = parseFloat((annualReductionKg / 900).toFixed(1));

  return {
    weeklyReductionKg: parseFloat(weeklyReductionKg.toFixed(0)),
    annualReductionKg: parseFloat(annualReductionKg.toFixed(0)),
    annualReductionTonnes: parseFloat(annualReductionTonnes.toFixed(1)),
    treesEquivalent,
    carsOffRoad,
    homesEquivalent,
  };
};
