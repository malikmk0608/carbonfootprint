import React, { useState, useMemo } from 'react';
import { Utensils, Zap, Trash2, Check, Leaf, MapPin, Info } from 'lucide-react';
import { TRANSPORT_FACTORS, DIET_FACTORS, calculateConfidence, calculateFootprintRange, rankActions } from '../utils/footprintCalculator';
import type { DailyInputs } from '../utils/footprintCalculator';

interface DailyLoggerProps {
  onSaveLog: (footprint: number, savings: number, xp: number) => void;
  streak: number;
}

export const DailyLogger: React.FC<DailyLoggerProps> = ({ onSaveLog, streak }) => {
  // Campus-specific transport modes
  const [transportMode, setTransportMode] = useState<string>('petrol');
  const [transportDistance, setTransportDistance] = useState<number>(12);
  const [dietType, setDietType] = useState<string>('average');
  const [heatingHours, setHeatingHours] = useState<number>(3);
  const [electricityHours, setElectricityHours] = useState<number>(6);
  const [recycled, setRecycled] = useState<boolean>(false);
  const [purchases, setPurchases] = useState<number>(0);
  const [customAction, setCustomAction] = useState<string>('');

  // Success indicator state
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [lastCalculation, setLastCalculation] = useState<{ footprint: number; savings: number; xp: number } | null>(null);

  // Current inputs object
  const currentInputs: DailyInputs = {
    transportMode,
    transportDistance,
    dietType,
    acHours: heatingHours,
    electronicsHours: electricityHours,
    recycled,
    purchases,
    customAction,
  };

  // Calculate carbon footprint dynamically for preview
  const calculateTodayFootprint = (): number => {
    const tFactor = TRANSPORT_FACTORS[transportMode]?.factor ?? 0;
    const transportEmissions = transportDistance * tFactor;

    const dietEmissions = DIET_FACTORS[dietType]?.factor ?? 5.5;

    const energyEmissions = (heatingHours * 1.2) + (electricityHours * 0.45);

    const wasteEmissions = recycled ? 0.9 : 1.5;
    const shoppingEmissions = purchases * 1.5;

    const customDeduction = customAction.trim() !== '' ? 2.0 : 0;

    return parseFloat(Math.max(0.1, transportEmissions + dietEmissions + energyEmissions + wasteEmissions + shoppingEmissions - customDeduction).toFixed(2));
  };

  const todayFootprintPreview = calculateTodayFootprint();

  // Confidence score
  const confidence = useMemo(() => calculateConfidence(currentInputs), [transportMode, transportDistance, dietType, heatingHours, electricityHours, recycled, purchases]);
  const footprintRange = useMemo(() => calculateFootprintRange(todayFootprintPreview, confidence), [todayFootprintPreview, confidence]);

  // Category breakdown for preview
  const transportEmission = transportDistance * (TRANSPORT_FACTORS[transportMode]?.factor ?? 0);
  const dietEmission = DIET_FACTORS[dietType]?.factor ?? 5.5;
  const energyEmission = (heatingHours * 1.2) + (electricityHours * 0.45);
  const wasteEmission = (recycled ? 0.9 : 1.5) + (purchases * 1.5);

  // Find biggest source
  const sources = [
    { name: 'Transportation', value: transportEmission, icon: '🚗', color: '#06b6d4' },
    { name: 'Diet & Food', value: dietEmission, icon: '🍽️', color: '#f59e0b' },
    { name: 'Energy', value: energyEmission, icon: '⚡', color: '#eab308' },
    { name: 'Waste & Lifestyle', value: wasteEmission, icon: '♻️', color: '#6366f1' },
  ].sort((a, b) => b.value - a.value);

  const biggestSource = sources[0];
  const biggestPct = todayFootprintPreview > 0 ? Math.round((biggestSource.value / todayFootprintPreview) * 100) : 0;

  // Top recommendation
  const topActions = useMemo(() => rankActions(currentInputs).slice(0, 1), [transportMode, transportDistance, dietType, heatingHours, electricityHours, recycled, purchases]);

  const handleSave = () => {
    const todayFootprint = calculateTodayFootprint();
    
    // Average daily carbon footprint benchmark is ~18 kg CO2e
    const dailyBenchmark = 18.0;
    const savings = Math.max(0, parseFloat((dailyBenchmark - todayFootprint).toFixed(2)));
    
    // XP based on savings rate + base XP
    const xpEarned = Math.round(15 + savings * 2);

    onSaveLog(todayFootprint, savings, xpEarned);
    
    setLastCalculation({ footprint: todayFootprint, savings, xp: xpEarned });
    setShowSuccess(true);
    setCustomAction('');
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };

  // Campus transport options for radio cards
  const campusTransportOptions = [
    { value: 'walk', label: 'Walk', icon: '🚶', sub: 'Zero emissions' },
    { value: 'bicycle', label: 'Bicycle', icon: '🚲', sub: 'Zero emissions' },
    { value: 'college-bus', label: 'College Bus', icon: '🚌', sub: '0.025 kg/km' },
    { value: 'metro', label: 'Metro', icon: '🚇', sub: '0.02 kg/km' },
    { value: 'two-wheeler', label: 'Two-Wheeler', icon: '🛵', sub: '0.05 kg/km' },
    { value: 'cab', label: 'Cab / Auto', icon: '🚕', sub: '0.08 kg/km' },
    { value: 'petrol', label: 'Car (Petrol)', icon: '🚗', sub: '0.19 kg/km' },
    { value: 'transit', label: 'Public Bus', icon: '🚌', sub: '0.04 kg/km' },
  ];

  const dietOptions = [
    { value: 'high-meat', label: 'Heavy Meat', icon: '🥩', sub: '~8.0 kg CO₂' },
    { value: 'average', label: 'Mixed / Average', icon: '🍗', sub: '~5.5 kg CO₂' },
    { value: 'canteen', label: 'Canteen / Mess', icon: '🍽️', sub: '~4.5 kg CO₂' },
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥬', sub: '~2.8 kg CO₂' },
    { value: 'vegan', label: 'Vegan', icon: '🌱', sub: '~1.8 kg CO₂' },
  ];

  const needsDistance = !['walk', 'bicycle', 'active'].includes(transportMode);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ═══ DECISION PREVIEW BANNER ═══ */}
      <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.06)', borderLeft: '4px solid var(--primary)', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem', textAlign: 'center' }}>
          {/* Estimated Footprint with range */}
          <div>
            <span className="metric-label">Estimated Today</span>
            <span className="metric-value" style={{ color: todayFootprintPreview > 15 ? 'var(--danger)' : todayFootprintPreview > 8 ? 'var(--accent)' : 'var(--primary-light)' }}>
              {todayFootprintPreview.toFixed(1)} <span style={{ fontSize: '1.25rem', fontWeight: '500' }}>kg</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
              Range: {footprintRange.low}–{footprintRange.high} kg CO₂e
            </span>
          </div>

          {/* Biggest Source */}
          <div className="metric-cell-bordered">
            <span className="metric-label">Biggest Source</span>
            <span className="metric-value" style={{ color: biggestSource.color, fontSize: '1.2rem' }}>
              {biggestSource.icon} {biggestPct}%
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
              {biggestSource.name}
            </span>
          </div>

          {/* Confidence */}
          <div className="metric-cell-bordered">
            <span className="metric-label">Confidence</span>
            <span className="metric-value" style={{ color: confidence.color, fontSize: '1.2rem' }}>
              {confidence.score}%
            </span>
            <span style={{ fontSize: '0.75rem', color: confidence.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: confidence.color, display: 'inline-block' }} />
              {confidence.rating}
            </span>
          </div>

          {/* Streak */}
          <div className="metric-cell">
            <span className="metric-label">Current Streak</span>
            <span className="metric-value" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              🔥 {streak} Days
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Keep logging daily</span>
          </div>
        </div>

        {/* Quick insight */}
        {topActions.length > 0 && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Info size={16} color="var(--primary-light)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--primary-light)', fontWeight: '600' }}>
              Best move: {topActions[0].icon} {topActions[0].title} → saves {topActions[0].weeklyReductionKg} kg/week
            </span>
          </div>
        )}
      </div>

      <div className="grid-3-main">
        {/* Daily Questionnaire Form - Segmented into themed sub-cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
            Record Today's Activities
          </h2>

          {/* 1. TRANSPORT - Campus-specific */}
          <div className="glass-card card-theme-transport" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <MapPin size={18} color="var(--secondary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>How do you get to campus?</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }} role="radiogroup" aria-label="Transport Mode">
              {campusTransportOptions.map(opt => (
                <div 
                  key={opt.value}
                  className={`option-card ${transportMode === opt.value ? 'selected' : ''}`}
                  style={{ borderColor: 'rgba(6, 182, 212, 0.15)', padding: '0.75rem', cursor: 'pointer', textAlign: 'center', flexDirection: 'column', justifyContent: 'center', gap: '0.25rem' }}
                  onClick={() => setTransportMode(opt.value)}
                  role="radio"
                  aria-checked={transportMode === opt.value}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTransportMode(opt.value); } }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{opt.icon}</div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '600' }}>{opt.label}</h4>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{opt.sub}</span>
                </div>
              ))}
            </div>

            {needsDistance && (
              <div className="slider-container" style={{ margin: 0 }}>
                <div className="slider-header">
                  <label htmlFor="transportDistance" className="form-label">Distance to campus (home/hostel)</label>
                  <span className="slider-value" style={{ color: 'var(--secondary)' }}>{transportDistance} km</span>
                </div>
                <input
                  id="transportDistance"
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={transportDistance}
                  onChange={(e) => setTransportDistance(parseInt(e.target.value))}
                  className="custom-slider"
                  style={{ background: 'rgba(6, 182, 212, 0.15)' }}
                  aria-valuemin={0}
                  aria-valuemax={60}
                  aria-valuenow={transportDistance}
                />
                {transportEmission > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem', display: 'block' }}>
                    Transport emission: {transportEmission.toFixed(1)} kg CO₂e
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 2. DIET - With Canteen/Mess option */}
          <div className="glass-card card-theme-diet" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Utensils size={18} color="var(--accent)" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>What did you eat today?</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }} role="radiogroup" aria-label="Diet Choices Today">
              {dietOptions.map(opt => (
                <div 
                  key={opt.value}
                  className={`option-card ${dietType === opt.value ? 'selected' : ''}`}
                  style={{ borderColor: 'rgba(245, 158, 11, 0.15)', padding: '0.75rem', cursor: 'pointer', textAlign: 'center', flexDirection: 'column', justifyContent: 'center', gap: '0.25rem' }}
                  onClick={() => setDietType(opt.value)}
                  role="radio"
                  aria-checked={dietType === opt.value}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDietType(opt.value); } }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{opt.icon}</div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '600' }}>{opt.label}</h4>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{opt.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. ENERGY - Student-specific */}
          <div className="glass-card card-theme-energy" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Zap size={18} color="#eab308" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Energy Usage Today</h3>
            </div>
            <div className="grid-2">
              <div className="slider-container" style={{ margin: 0 }}>
                <div className="slider-header">
                  <label htmlFor="heatingHours" className="form-label">AC / Fan Hours</label>
                  <span className="slider-value" style={{ color: '#eab308' }}>{heatingHours} hrs</span>
                </div>
                <input
                  id="heatingHours"
                  type="range"
                  min="0"
                  max="12"
                  value={heatingHours}
                  onChange={(e) => setHeatingHours(parseInt(e.target.value))}
                  className="custom-slider"
                  style={{ background: 'rgba(234, 179, 8, 0.15)' }}
                  aria-valuemin={0}
                  aria-valuemax={12}
                  aria-valuenow={heatingHours}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>= {(heatingHours * 1.2).toFixed(1)} kg CO₂e</span>
              </div>

              <div className="slider-container" style={{ margin: 0 }}>
                <div className="slider-header">
                  <label htmlFor="electricityHours" className="form-label">Laptop / Phone / Electronics</label>
                  <span className="slider-value" style={{ color: '#eab308' }}>{electricityHours} hrs</span>
                </div>
                <input
                  id="electricityHours"
                  type="range"
                  min="1"
                  max="18"
                  value={electricityHours}
                  onChange={(e) => setElectricityHours(parseInt(e.target.value))}
                  className="custom-slider"
                  style={{ background: 'rgba(234, 179, 8, 0.15)' }}
                  aria-valuemin={1}
                  aria-valuemax={18}
                  aria-valuenow={electricityHours}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>= {(electricityHours * 0.45).toFixed(1)} kg CO₂e</span>
              </div>
            </div>
          </div>

          {/* 4. WASTE & CONSUMPTION */}
          <div className="glass-card card-theme-waste" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Trash2 size={18} color="var(--info)" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Waste & Lifestyle</h3>
            </div>
            <div className="grid-2">
              <div 
                className={`option-card ${recycled ? 'selected' : ''}`}
                style={{ borderColor: 'rgba(99, 102, 241, 0.15)' }}
                onClick={() => setRecycled(!recycled)}
                role="checkbox"
                aria-checked={recycled}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRecycled(!recycled); } }}
              >
                <div className="checkbox-circle" style={{ borderColor: 'rgba(99, 102, 241, 0.5)' }} />
                <div>
                  <h4 style={{ fontSize: '0.85rem' }}>Recycled & Composted</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reduces waste footprint by 0.6 kg</span>
                </div>
              </div>

              <div className="slider-container" style={{ margin: 0 }}>
                <div className="slider-header">
                  <label htmlFor="purchases" className="form-label">New Items Purchased</label>
                  <span className="slider-value" style={{ color: 'var(--info)' }}>{purchases} {purchases === 1 ? 'item' : 'items'}</span>
                </div>
                <input
                  id="purchases"
                  type="range"
                  min="0"
                  max="5"
                  value={purchases}
                  onChange={(e) => setPurchases(parseInt(e.target.value))}
                  className="custom-slider"
                  style={{ background: 'rgba(99, 102, 241, 0.15)' }}
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-valuenow={purchases}
                />
              </div>
            </div>
          </div>

          {/* 5. CUSTOM ECO-ACTION */}
          <div className="glass-card card-theme-custom" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Leaf size={18} color="var(--primary-light)" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Custom Eco-Action</h3>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="customAction" className="form-label">Any other green action you did today:</label>
              <input
                id="customAction"
                type="text"
                placeholder="e.g. Used canvas bags, took stairs, planted a sapling..."
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                className="form-input"
                style={{ background: 'rgba(16, 185, 129, 0.04)' }}
              />
              {customAction.trim() !== '' && (
                <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', marginTop: '0.35rem', display: 'block', fontWeight: '500' }}>
                  🌱 Custom action registered! Deducting 2.0 kg CO₂e from today's footprint.
                </span>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSave} 
            className="btn-primary" 
            style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', fontSize: '1.05rem', borderRadius: 'var(--radius-md)' }}
          >
            Calculate & Log Today's Footprint
          </button>
        </div>

        {/* Side Panel: Live Category Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Live Breakdown */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Live Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sources.map((src, idx) => {
                const pct = todayFootprintPreview > 0 ? (src.value / todayFootprintPreview) * 100 : 0;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '600' }}>{src.icon} {src.name}</span>
                      <span style={{ color: src.color, fontWeight: '600' }}>{src.value.toFixed(1)} kg ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '6px' }}>
                      <div className="progress-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: src.color, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How it works */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>How it Works</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1rem' }}>
              Log your daily campus activities — transport, meals, energy, and waste. We calculate your exact carbon footprint using science-backed emission factors (EPA, DEFRA).
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Track trends over time. Every kg saved grows trees in your virtual forest! 🌲
            </p>
          </div>

          {/* Confidence detail */}
          {confidence.missingHints.length > 0 && (
            <div className="glass-card" style={{ borderLeft: `3px solid ${confidence.color}` }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: confidence.color }}>
                📊 Improve Accuracy
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Add more details to improve your estimate confidence:
              </p>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem', paddingLeft: '1rem' }}>
                {confidence.missingHints.map((hint, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>Add your {hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Popup Success message */}
      {showSuccess && lastCalculation && (
        <div className="glass-card animate-fade-in success-toast">
          <h3 style={{ color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '0.25rem' }}>
            <Check size={18} /> Footprint Logged!
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Your footprint today is <strong>{lastCalculation.footprint.toFixed(1)} kg CO₂e</strong>.
          </p>
          <div style={{ display: 'flex', gap: '0.50rem' }}>
            <span className="badge badge-success">-{lastCalculation.savings.toFixed(1)} kg saved</span>
            <span className="badge badge-success">+{lastCalculation.xp} XP</span>
          </div>
        </div>
      )}
    </div>
  );
};
