import React, { useState, useMemo } from 'react';
import { 
  Car, Bus, Train, Bike, Wind, Utensils, 
  Trash2, Droplets, ShoppingBag, ArrowRight, 
  TrendingDown, Trees, Users, Zap
} from 'lucide-react';

interface WhatIfSimulatorProps {
  history: Array<{ id: string; date: string; footprint: number; savings: number; xp: number }>;
}

const TRANSPORT_OPTIONS = [
  { id: 'car', label: 'Car', factor: 0.19, icon: Car },
  { id: 'twowheeler', label: '2-Wheeler', factor: 0.05, icon: Bike },
  { id: 'bus', label: 'Bus', factor: 0.025, icon: Bus },
  { id: 'metro', label: 'Metro', factor: 0.02, icon: Train },
  { id: 'walk', label: 'Walk/Bike', factor: 0, icon: Bike },
];

const DIET_OPTIONS = [
  { id: 'high-meat', label: 'High-Meat', factor: 8.0, icon: Utensils },
  { id: 'mixed', label: 'Mixed', factor: 5.5, icon: Utensils },
  { id: 'vegetarian', label: 'Vegetarian', factor: 2.8, icon: Utensils },
  { id: 'vegan', label: 'Vegan', factor: 1.8, icon: Utensils },
];

const WASTE_OPTIONS = [
  { id: 'no-recycle', label: 'No Recycling', factor: 1.5, icon: Trash2 },
  { id: 'partial-recycle', label: 'Partial', factor: 1.3, icon: Trash2 },
  { id: 'full-recycle', label: 'Full Recycling', factor: 0.9, icon: Trash2 },
];

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ history: _history }) => {
  // Baseline state (current day)
  const [baseTransportMode] = useState('car');
  const [baseDistance, setBaseDistance] = useState(20);
  const [baseACHours] = useState(3);
  const [baseDiet] = useState('mixed');
  const [baseWaste] = useState('no-recycle');
  
  // Modified state (what-if)
  const [modTransportMode, setModTransportMode] = useState('car');
  const [modDistance, setModDistance] = useState(20);
  const [modACHours, setModACHours] = useState(3);
  const [modDiet, setModDiet] = useState('mixed');
  const [modWaste, setModWaste] = useState('no-recycle');
  const [useReusableBottle, setUseReusableBottle] = useState(false);
  const [useCanvasBags, setUseCanvasBags] = useState(false);

  // Calculations
  const getTransportFactor = (id: string) => TRANSPORT_OPTIONS.find(t => t.id === id)?.factor || 0;
  const getDietFactor = (id: string) => DIET_OPTIONS.find(d => d.id === id)?.factor || 0;
  const getWasteFactor = (id: string) => WASTE_OPTIONS.find(w => w.id === id)?.factor || 0;

  const baselineTotal = useMemo(() => {
    const transport = baseDistance * getTransportFactor(baseTransportMode);
    const diet = getDietFactor(baseDiet);
    const energy = baseACHours * 1.2 + 6 * 0.45; // 6 hrs electronics default
    const waste = getWasteFactor(baseWaste);
    return transport + diet + energy + waste;
  }, [baseDistance, baseTransportMode, baseDiet, baseACHours, baseWaste]);

  const modifiedTotal = useMemo(() => {
    const transport = modDistance * getTransportFactor(modTransportMode);
    const diet = getDietFactor(modDiet);
    const energy = modACHours * 1.2 + 6 * 0.45;
    const waste = getWasteFactor(modWaste);
    const reusableDeductions = (useReusableBottle ? 0.3 : 0) + (useCanvasBags ? 0.2 : 0);
    return transport + diet + energy + waste - reusableDeductions;
  }, [modDistance, modTransportMode, modDiet, modACHours, modWaste, useReusableBottle, useCanvasBags]);

  // We don't need a debounce, use the calculated totals directly for instantaneous feedback
  const displayBaseline = baselineTotal;
  const displayModified = modifiedTotal;

  const reduction = Math.max(0, baselineTotal - modifiedTotal);
  const reductionPercent = baselineTotal > 0 ? (reduction / baselineTotal) * 100 : 0;
  const weeklySavings = reduction * 7;
  const annualSavings = reduction * 365;
  const treesEquivalent = Math.round(annualSavings / 22);
  const barPercent = displayBaseline > 0 ? Math.min(100, (displayModified / displayBaseline) * 100) : 0;

  // Presets
  const applyPreset = (preset: string) => {
    if (preset === 'bus') {
      setModTransportMode('bus');
    } else if (preset === 'veg') {
      setModDiet('vegetarian');
    } else if (preset === 'cool') {
      setModACHours(1);
    } else if (preset === 'zero') {
      setModWaste('full-recycle');
      setUseReusableBottle(true);
      setUseCanvasBags(true);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
          <Zap style={{ marginRight: '0.5rem', color: 'var(--accent)' }} /> 🔮 What-If Simulator
        </h2>
      </div>

      {/* Baseline Overview */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '0.25rem' }}>Baseline: My Current Day</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Using your typical habits.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>{displayBaseline.toFixed(1)} kg</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CO₂e / day</div>
        </div>
      </div>

      {/* Scenario Presets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
        <button className="option-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => applyPreset('bus')}>
          <Bus size={24} style={{ marginBottom: '0.5rem', color: 'var(--secondary)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Public Transport Week</span>
        </button>
        <button className="option-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => applyPreset('veg')}>
          <Utensils size={24} style={{ marginBottom: '0.5rem', color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Veg Challenge</span>
        </button>
        <button className="option-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => applyPreset('cool')}>
          <Wind size={24} style={{ marginBottom: '0.5rem', color: 'var(--info)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Cool Less</span>
        </button>
        <button className="option-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => applyPreset('zero')}>
          <Trash2 size={24} style={{ marginBottom: '0.5rem', color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Zero Waste</span>
        </button>
      </div>

      {/* Interactive Panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Transport */}
        <div className="glass-card card-theme-transport" style={{ padding: '1.5rem', borderLeft: '3px solid var(--secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', marginRight: '0.75rem' }}>
              <Car size={20} color="var(--secondary)" />
            </div>
            <h3 style={{ fontWeight: '600', fontSize: '1.2rem' }}>Transport</h3>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Distance: {modDistance} km</label>
            <input 
              type="range" 
              min="0" max="50" 
              value={modDistance} 
              onChange={(e) => { setModDistance(Number(e.target.value)); setBaseDistance(Number(e.target.value)); }}
              className="custom-slider"
              style={{ width: '100%', background: 'rgba(6, 182, 212, 0.15)' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {TRANSPORT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSelected = modTransportMode === opt.id;
              return (
                <button 
                  key={opt.id}
                  onClick={() => setModTransportMode(opt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', transition: 'all 0.2s', cursor: 'pointer',
                    background: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'var(--surface)',
                    border: `1px solid ${isSelected ? 'var(--secondary)' : 'var(--border-color)'}`,
                    color: isSelected ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  <Icon size={16} style={{ marginRight: '0.5rem' }} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Diet */}
        <div className="glass-card card-theme-diet" style={{ padding: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', marginRight: '0.75rem' }}>
              <Utensils size={20} color="var(--accent)" />
            </div>
            <h3 style={{ fontWeight: '600', fontSize: '1.2rem' }}>Diet</h3>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {DIET_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSelected = modDiet === opt.id;
              return (
                <button 
                  key={opt.id}
                  onClick={() => setModDiet(opt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', transition: 'all 0.2s', cursor: 'pointer',
                    background: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'var(--surface)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                    color: isSelected ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  <Icon size={16} style={{ marginRight: '0.5rem' }} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* AC / Heating */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '3px solid #eab308' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', marginRight: '0.75rem' }}>
              <Wind size={20} color="#eab308" />
            </div>
            <h3 style={{ fontWeight: '600', fontSize: '1.2rem' }}>AC / Heating Usage</h3>
          </div>
          
          <div>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Hours per day: {modACHours} hr</label>
            <input 
              type="range" 
              min="0" max="12" step="1"
              value={modACHours} 
              onChange={(e) => setModACHours(Number(e.target.value))}
              className="custom-slider"
              style={{ width: '100%', background: 'rgba(234, 179, 8, 0.15)' }}
            />
          </div>
        </div>

        {/* Waste */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '3px solid var(--info)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', marginRight: '0.75rem' }}>
              <Trash2 size={20} color="var(--info)" />
            </div>
            <h3 style={{ fontWeight: '600', fontSize: '1.2rem' }}>Waste & Reusables</h3>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {WASTE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSelected = modWaste === opt.id;
              return (
                <button 
                  key={opt.id}
                  onClick={() => setModWaste(opt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', transition: 'all 0.2s', cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--surface)',
                    border: `1px solid ${isSelected ? 'var(--info)' : 'var(--border-color)'}`,
                    color: isSelected ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  <Icon size={16} style={{ marginRight: '0.5rem' }} />
                  {opt.label}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={useReusableBottle} onChange={(e) => setUseReusableBottle(e.target.checked)} className="form-input" style={{ width: '1rem', height: '1rem' }} />
              <Droplets size={16} color="var(--secondary)" />
              Reusable Bottle (-0.3 kg)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={useCanvasBags} onChange={(e) => setUseCanvasBags(e.target.checked)} className="form-input" style={{ width: '1rem', height: '1rem' }} />
              <ShoppingBag size={16} color="var(--accent)" />
              Canvas Bags (-0.2 kg)
            </label>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="glass-card" style={{ padding: '2rem', marginTop: '1.5rem', position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.1) 0%, rgba(10, 31, 19, 0.8) 100%)', borderColor: 'var(--primary)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
          <TrendingDown style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> Impact Analysis
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Baseline</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{displayBaseline.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>kg</span></div>
          </div>
          
          <div style={{ width: '10%', display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <ArrowRight size={24} />
          </div>
          
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Modified</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{displayModified.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>kg</span></div>
          </div>
        </div>

        {/* Bar comparison */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ position: 'relative', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--surface)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: 'var(--text-secondary)', width: '100%', transition: 'all 0.5s ease-out' }}></div>
          </div>
          <div style={{ position: 'relative', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--surface)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: 'var(--primary)', width: `${barPercent}%`, transition: 'all 0.5s ease-out' }}></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Daily Reduction</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)' }}>
              {reductionPercent > 0 ? '↓' : ''} {reductionPercent.toFixed(0)}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({reduction.toFixed(1)} kg)</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Weekly Savings</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--secondary)' }}>{weeklySavings.toFixed(1)} kg</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)', marginBottom: '0.5rem' }}>
            <Trees size={28} style={{ marginRight: '0.5rem' }} />
            <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{treesEquivalent} Trees</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Your annual savings of <span style={{ color: '#fff', fontWeight: '500' }}>{annualSavings.toFixed(0)} kg CO₂</span> is equivalent to planting {treesEquivalent} trees!
          </p>
        </div>
      </div>

      {/* Campus Impact */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.3)', backgroundColor: 'rgba(99, 102, 241, 0.05)', marginTop: '1rem' }}>
        <Users style={{ color: 'var(--info)', marginRight: '1rem' }} size={32} />
        <p style={{ fontSize: '0.95rem', fontWeight: '500', color: 'rgba(255,255,255,0.9)' }}>
          If 500 students made these changes:<br/>
          <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#fff' }}>↓ {(weeklySavings * 500).toLocaleString(undefined, {maximumFractionDigits: 0})} kg CO₂/week</span>
        </p>
      </div>

    </div>
  );
};
