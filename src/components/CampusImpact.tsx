import React, { useState } from 'react';
import { Users, Leaf, Bus, Recycle, Snowflake, Droplet, Lightbulb, Car, Home, Trees, TrendingDown } from 'lucide-react';

interface CampusImpactProps {
  dailyFootprint: number;
  history: Array<{ id: string; date: string; footprint: number; savings: number; xp: number }>;
}

const initialScenarios = [
  { id: 's1', icon: Bus, title: 'Switch 1 commute/day to bus', defaultAdoption: 30, perStudentSavingKg: 1.2, effort: 'Easy', effortColor: '#10b981', cost: '₹0' },
  { id: 's2', icon: Leaf, title: 'Go vegetarian 3 days/week', defaultAdoption: 50, perStudentSavingKg: 1.16, effort: 'Medium', effortColor: '#f59e0b', cost: '₹0' },
  { id: 's3', icon: Recycle, title: 'Recycle all waste properly', defaultAdoption: 80, perStudentSavingKg: 0.5, effort: 'Easy', effortColor: '#10b981', cost: '₹0' },
  { id: 's4', icon: Snowflake, title: 'Reduce AC by 2 hours daily', defaultAdoption: 40, perStudentSavingKg: 2.4, effort: 'Easy', effortColor: '#10b981', cost: '₹0' },
  { id: 's5', icon: Droplet, title: 'Use reusable bottles & bags', defaultAdoption: 60, perStudentSavingKg: 0.5, effort: 'Very Easy', effortColor: '#10b981', cost: '₹0' },
  { id: 's6', icon: Lightbulb, title: 'Switch off lights when leaving', defaultAdoption: 90, perStudentSavingKg: 0.3, effort: 'Very Easy', effortColor: '#10b981', cost: '₹0' },
];

export const CampusImpact: React.FC<CampusImpactProps> = ({ dailyFootprint, history }) => {
  const [studentCount, setStudentCount] = useState(1000);
  const [adoptionRates, setAdoptionRates] = useState<Record<string, number>>(
    initialScenarios.reduce((acc, s) => ({ ...acc, [s.id]: s.defaultAdoption }), {})
  );

  const handleAdoptionChange = (id: string, value: number) => {
    setAdoptionRates(prev => ({ ...prev, [id]: value }));
  };

  const avgDailyFootprint = dailyFootprint || 5.5;
  const currentWeeklyEmissionsTonnes = (studentCount * avgDailyFootprint * 7) / 1000;

  let totalWeeklySavings = 0;
  const scenarioImpacts = initialScenarios.map(s => {
    const rate = adoptionRates[s.id];
    const weeklyImpact = studentCount * (rate / 100) * s.perStudentSavingKg * 7;
    totalWeeklySavings += weeklyImpact;
    const treesEquivalent = (weeklyImpact * 52) / 22;
    return { ...s, rate, weeklyImpact, treesEquivalent };
  });

  const totalAnnualSavings = totalWeeklySavings * 52;
  const totalTreesEquivalent = totalAnnualSavings / 22;
  const carsEquivalent = totalAnnualSavings / 4600;
  const homesEquivalent = (totalAnnualSavings / 12) / 900;

  const avgUserSavings = history.length > 0 
    ? history.reduce((sum, h) => sum + h.savings, 0) / history.length 
    : (avgDailyFootprint * 0.15); // Fallback if no history

  const cascadeNodes = [
    { label: 'YOU', mult: 1, delay: '0s', desc: 'Daily actions' },
    { label: 'YOUR HOSTEL', mult: 50, delay: '0.2s', desc: '50 students' },
    { label: 'YOUR DEPT', mult: 200, delay: '0.4s', desc: '200 students' },
    { label: 'YOUR CAMPUS', mult: 1000, delay: '0.6s', desc: '1000 students' },
    { label: 'YOUR CITY', mult: 100000, delay: '0.8s', desc: '100k students' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. CAMPUS OVERVIEW HEADER */}
      <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <Users size={32} color="var(--primary)" />
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.75rem' }}>CAMPUS CARBON</h2>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Campus Population</span>
              <span className="metric-value" style={{ fontSize: '1.1rem' }}>{studentCount} students</span>
            </label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={studentCount}
              onChange={(e) => setStudentCount(Number(e.target.value))}
              className="custom-slider"
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ flex: 1, minWidth: '250px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <div className="metric-label">Current Estimated Emissions</div>
            <div className="metric-value" style={{ fontSize: '2rem', color: 'var(--danger)', marginTop: '0.5rem' }}>
              {currentWeeklyEmissionsTonnes.toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>tonnes CO₂/week</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOTAL COMBINED IMPACT */}
      <div className="glass-card" style={{ 
        padding: '2rem', 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
        border: '1px solid var(--primary)',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontFamily: 'var(--font-display)', color: '#fff' }}>🌍 COMBINED CAMPUS IMPACT</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>If all these changes were adopted by the chosen percentages:</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', minWidth: '200px' }}>
            <TrendingDown size={24} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
            <div className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>{Math.round(totalWeeklySavings).toLocaleString()}</div>
            <div className="metric-label">kg CO₂ / week saved</div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', minWidth: '200px' }}>
            <TrendingDown size={24} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
            <div className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>{(totalAnnualSavings / 1000).toFixed(1)}</div>
            <div className="metric-label">tonnes CO₂ / year saved</div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', minWidth: '200px' }}>
            <Trees size={24} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
            <div className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>{Math.round(totalTreesEquivalent).toLocaleString()}</div>
            <div className="metric-label">trees planted / year</div>
          </div>
        </div>
      </div>

      {/* 5. EQUIVALENCE VISUALIZATIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <Car size={32} color="var(--accent)" />
          </div>
          <div>
            <div className="metric-label">Equivalent to</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>{Math.max(1, Math.round(carsEquivalent))} cars</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>off the road for a year</div>
          </div>
        </div>
        
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <Trees size={32} color="var(--primary)" />
          </div>
          <div>
            <div className="metric-label">Equivalent to</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>{Math.max(1, Math.round(totalTreesEquivalent))} trees</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>grown for 10 years</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <Home size={32} color="var(--secondary)" />
          </div>
          <div>
            <div className="metric-label">Equivalent to</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>{Math.max(1, Math.round(homesEquivalent))} homes</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>powered for a month</div>
          </div>
        </div>
      </div>

      {/* 2. SCENARIO IMPACT CARDS */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>Explore Scenarios</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {scenarioImpacts.map(scenario => {
            const Icon = scenario.icon;
            return (
              <div key={scenario.id} className="glass-card" style={{ 
                padding: '1.5rem',
                borderLeft: `4px solid ${scenario.effortColor}`,
                transition: 'transform 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <Icon size={24} color={scenario.effortColor} />
                  <h4 style={{ margin: 0, flex: 1, fontSize: '1.1rem' }}>{scenario.title}</h4>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span className="badge" style={{ backgroundColor: `${scenario.effortColor}20`, color: scenario.effortColor }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: scenario.effortColor, marginRight: '4px' }}></span>
                    {scenario.effort}
                  </span>
                  <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>{scenario.cost}</span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Adoption Rate</span>
                    <span>{scenario.rate}%</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={scenario.rate}
                    onChange={(e) => handleAdoptionChange(scenario.id, Number(e.target.value))}
                    className="custom-slider"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="metric-label">Weekly Impact</span>
                    <span className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                      ↓ {Math.round(scenario.weeklyImpact)} kg CO₂
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="metric-label">Trees Eq. / Year</span>
                    <span className="metric-value" style={{ color: 'var(--primary)' }}>
                      {Math.round(scenario.treesEquivalent)} 🌳
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. IMPACT CASCADE VISUALIZATION */}
      <div className="glass-card" style={{ padding: '2rem', overflowX: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>The Ripple Effect</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          See how your personal daily savings of <strong style={{color: '#fff'}}>{avgUserSavings.toFixed(2)} kg CO₂</strong> can cascade.
        </p>

        <div style={{ position: 'relative', minWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
          {/* SVG connecting lines */}
          <svg style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '4px', transform: 'translateY(-50%)', zIndex: 0 }}>
            <line 
              x1="0" y1="2" x2="100%" y2="2" 
              stroke="var(--primary)" 
              strokeWidth="2" 
              strokeDasharray="8 8" 
              style={{
                animation: 'dash 20s linear infinite',
              }}
            />
            <style>
              {`
                @keyframes dash {
                  to {
                    stroke-dashoffset: -1000;
                  }
                }
                @keyframes cascadeNode {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}
            </style>
          </svg>

          {/* Nodes */}
          {cascadeNodes.map((node, _i) => {
            const nodeImpact = avgUserSavings * node.mult;
            return (
              <div 
                key={node.label}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  background: 'var(--surface)',
                  border: '2px solid var(--border-color)',
                  borderRadius: '50%',
                  width: '120px',
                  height: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  textAlign: 'center',
                  animation: `cascadeNode 0.5s ease forwards`,
                  animationDelay: node.delay,
                  opacity: 0, // start hidden for animation
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {node.label}
                </div>
                <div className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                  {nodeImpact > 1000 ? `${(nodeImpact/1000).toFixed(1)}t` : `${Math.round(nodeImpact)}kg`}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {node.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
