import React, { useState, useMemo, useEffect } from 'react';
import { Home, Car, Utensils, ShoppingBag, Award, BarChart3, TrendingDown, Target, ChevronDown, ChevronUp, Trophy, Flame } from 'lucide-react';
import { calculateBudget, rankActions, calculateConfidence, calculateFootprintRange } from '../utils/footprintCalculator';
import type { DailyInputs, GreenAction } from '../utils/footprintCalculator';
import { CategoryExplainer } from './CategoryExplainer';

interface DashboardProps {
  ecoPoints: number;
  streak: number;
  savedCarbon: number; // in kg CO2e
  history: { id: string; date: string; footprint: number; savings: number; xp: number }[];
  carbonBudgetTarget: number;
  onSetBudgetTarget: (target: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  ecoPoints,
  streak,
  savedCarbon,
  history,
  carbonBudgetTarget,
  onSetBudgetTarget,
}) => {
  // Explainer modal state
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [explainerCategory, setExplainerCategory] = useState<{
    name: string; value: number; totalFootprint: number; color: string; icon: string;
  } | null>(null);

  // Expanded weekly challenge view
  const [showBudgetDetails, setShowBudgetDetails] = useState(false);

  // Get today's data from history
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = history.find(h => h.date === todayStr);
  const todayFootprint = todayLog ? todayLog.footprint : 0;

  // Animation trigger on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Default user inputs for recommendation engine (based on average user)
  const defaultInputs: DailyInputs = {
    transportMode: 'petrol',
    transportDistance: 12,
    dietType: 'average',
    acHours: 3,
    electronicsHours: 6,
    recycled: false,
    purchases: 0,
    customAction: '',
  };

  // Estimated daily breakdown from today's footprint or average
  const avgFootprint = history.length > 0 
    ? history.slice(0, 7).reduce((sum, h) => sum + h.footprint, 0) / Math.min(history.length, 7) 
    : 12.0;
  const displayFootprint = todayFootprint > 0 ? todayFootprint : avgFootprint;

  // Rough category breakdown estimates (proportional)
  const transportPct = 0.30;
  const dietPct = 0.35;
  const energyPct = 0.25;
  const lifestylePct = 0.10;

  const categories = [
    { name: 'Energy', value: parseFloat((displayFootprint * energyPct).toFixed(1)), color: '#10b981', icon: '⚡', iconComponent: Home, desc: 'AC, Electronics & Charging' },
    { name: 'Transportation', value: parseFloat((displayFootprint * transportPct).toFixed(1)), color: '#06b6d4', iconComponent: Car, icon: '🚗', desc: 'Campus commute & travel' },
    { name: 'Diet & Food', value: parseFloat((displayFootprint * dietPct).toFixed(1)), color: '#f59e0b', iconComponent: Utensils, icon: '🍽️', desc: 'Meals & dietary choices' },
    { name: 'Lifestyle', value: parseFloat((displayFootprint * lifestylePct).toFixed(1)), color: '#6366f1', iconComponent: ShoppingBag, icon: '♻️', desc: 'Waste, shopping & habits' },
  ];

  const sortedCategories = [...categories].sort((a, b) => b.value - a.value);

  // Budget calculation
  const budget = useMemo(() => calculateBudget(
    carbonBudgetTarget,
    displayFootprint,
    history,
    10
  ), [carbonBudgetTarget, displayFootprint, history]);

  // Green ROI recommendations
  const recommendations: GreenAction[] = useMemo(() => rankActions(defaultInputs).slice(0, 3), []);

  // Confidence
  const confidence = useMemo(() => calculateConfidence(defaultInputs), []);
  const footprintRange = useMemo(() => calculateFootprintRange(displayFootprint, confidence), [displayFootprint, confidence]);

  // SVG circular chart math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  // Budget gauge SVG
  const budgetRadius = 70;
  const budgetCircumference = 2 * Math.PI * budgetRadius;
  const budgetFillPct = Math.min(budget.utilizationPercent, 150);
  const budgetOffset = budgetCircumference - (budgetFillPct / 150) * budgetCircumference;

  const handleCategoryClick = (cat: typeof categories[0]) => {
    setExplainerCategory({
      name: cat.name,
      value: cat.value,
      totalFootprint: displayFootprint,
      color: cat.color,
      icon: cat.icon,
    });
    setExplainerOpen(true);
  };

  // Medal icons for top 3
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="animate-fade-in">
      {/* Category Explainer Modal */}
      {explainerCategory && (
        <CategoryExplainer
          isOpen={explainerOpen}
          onClose={() => setExplainerOpen(false)}
          category={explainerCategory}
          userInputs={defaultInputs}
        />
      )}

      {/* ═══ SECTION A: CARBON BUDGET METER ═══ */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={20} color={budget.statusColor} /> Your Daily Carbon Budget
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Track your daily emissions against your personal target
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="glass-card" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award color="var(--primary)" size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{ecoPoints} XP</span>
            </div>
            <div className="glass-card" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flame color="var(--accent)" size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{streak} Days</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
          {/* Circular Budget Gauge */}
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            <svg viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle cx="80" cy="80" r={budgetRadius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle
                cx="80" cy="80" r={budgetRadius}
                fill="none"
                stroke={budget.statusColor}
                strokeWidth="10"
                strokeDasharray={budgetCircumference}
                strokeDashoffset={mounted ? budgetOffset : budgetCircumference}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), stroke 0.5s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: budget.statusColor, lineHeight: '1' }}>
                {budget.utilizationPercent}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>of budget</div>
            </div>
          </div>

          {/* Budget Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Target</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>{carbonBudgetTarget}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> kg/day</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Today</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: budget.statusColor }}>{displayFootprint.toFixed(1)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> kg/day</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>{budget.difference > 0 ? 'Over' : 'Under'}</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: budget.statusColor }}>
                  {budget.difference > 0 ? '+' : ''}{budget.difference}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> kg</span>
              </div>
            </div>

            {/* Budget target slider */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <span>Adjust target</span>
                <span>{carbonBudgetTarget} kg/day</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                step="0.5"
                value={carbonBudgetTarget}
                onChange={(e) => onSetBudgetTarget(parseFloat(e.target.value))}
                className="custom-slider"
                style={{ background: 'rgba(16, 185, 129, 0.15)', width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ═══ SECTION B: WEEKLY CHALLENGE TRACKER ═══ */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={18} color="var(--accent)" /> Weekly Challenge
              </h3>
              <button
                onClick={() => setShowBudgetDetails(!showBudgetDetails)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              >
                {showBudgetDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Goal: Reduce footprint by 10% this week</span>
            </div>

            {/* Day pills */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {budget.weeklyTrend.map((day, idx) => {
                const isToday = idx === budget.weeklyTrend.length - 1;
                const hasData = day.value > 0;
                let pillColor = 'rgba(255,255,255,0.05)';
                if (hasData) {
                  if (day.value <= carbonBudgetTarget * 0.9) pillColor = 'rgba(16, 185, 129, 0.25)';
                  else if (day.value <= carbonBudgetTarget * 1.1) pillColor = 'rgba(245, 158, 11, 0.25)';
                  else pillColor = 'rgba(248, 113, 113, 0.2)';
                }
                return (
                  <div key={idx} style={{
                    flex: '1 1 0',
                    minWidth: '48px',
                    textAlign: 'center',
                    padding: '0.5rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: pillColor,
                    border: isToday ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.3s ease',
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>{day.day}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: hasData ? 'white' : 'var(--text-muted)' }}>
                      {hasData ? day.value.toFixed(1) : '–'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Challenge result */}
            {budget.weeklyChangePercent !== 0 && (
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: budget.challengeMet ? 'rgba(16, 185, 129, 0.1)' : 'rgba(248, 113, 113, 0.1)', border: `1px solid ${budget.challengeMet ? 'rgba(16, 185, 129, 0.2)' : 'rgba(248, 113, 113, 0.2)'}` }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: budget.challengeMet ? '#34d399' : '#f87171' }}>
                  {budget.challengeMet ? '🎉' : '📈'} {budget.weeklyChangePercent > 0 ? 'Reduced' : 'Increased'} by {Math.abs(budget.weeklyChangePercent)}% this week
                  {budget.challengeMet && ' — Challenge complete!'}
                </span>
              </div>
            )}

            {showBudgetDetails && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <p>Your carbon budget is set to <strong>{carbonBudgetTarget} kg/day</strong>, aligned with the 2050 Paris Agreement target of ~1.5 tonnes/year per person.</p>
                <p style={{ marginTop: '0.5rem' }}>Consistently staying under budget earns bonus XP and grows your virtual forest faster! 🌲</p>
              </div>
            )}
          </div>

          {/* ═══ SECTION D: EMISSION BREAKDOWN with Explainer Drill-Downs ═══ */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="var(--secondary)" /> Carbon Breakdown
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '400', marginLeft: 'auto' }}>tap to explore</span>
            </h3>

            {/* Donut Chart */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
                <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                  {(() => {
                    let accumulated = 0;
                    return categories.map((cat, idx) => {
                      const percentage = displayFootprint > 0 ? (cat.value / displayFootprint) * 100 : 0;
                      const strokeOffset = circumference - (percentage / 100) * circumference;
                      const rotation = (accumulated / 100) * 360;
                      accumulated += percentage;
                      if (cat.value === 0) return null;
                      return (
                        <circle
                          key={idx}
                          cx="60" cy="60" r={radius}
                          fill="none" stroke={cat.color} strokeWidth="12"
                          strokeDasharray={circumference}
                          strokeDashoffset={mounted ? strokeOffset : circumference}
                          transform={`rotate(${rotation} 60 60)`}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)', cursor: 'pointer' }}
                          onClick={() => handleCategoryClick(cat)}
                        />
                      );
                    });
                  })()}
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'white', lineHeight: '1' }}>{displayFootprint.toFixed(1)}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--primary-light)', fontWeight: '600' }}>kg/day</div>
                </div>
              </div>

              {/* Category list */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                {sortedCategories.map((cat, idx) => {
                  const pct = displayFootprint > 0 ? ((cat.value / displayFootprint) * 100).toFixed(0) : '0';
                  const Icon = cat.iconComponent;
                  return (
                    <div
                      key={idx}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 0.2s ease' }}
                      onClick={() => handleCategoryClick(cat)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ background: `${cat.color}15`, color: cat.color, padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600' }}>
                          <span>{cat.name}</span>
                          <span style={{ color: cat.color }}>{cat.value} kg ({pct}%)</span>
                        </div>
                        <div className="progress-bar-bg" style={{ marginTop: '0.25rem', height: '4px' }}>
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: cat.color, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                      <ChevronDown size={14} color="var(--text-muted)" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Benchmarks (Moved here to balance columns) */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BarChart3 color="var(--secondary)" size={18} />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>How You Compare</h3>
            </div>
            {[
              { label: 'U.S. Average', value: 48.2, color: '#f87171' },
              { label: 'Global Average', value: 18.1, color: '#9ca3af' },
              { label: 'You (Today)', value: displayFootprint, color: 'var(--primary)', isUser: true },
              { label: 'India Average', value: 5.5, color: '#fbbf24' },
              { label: '2050 Target', value: 4.0, color: '#34d399' },
            ].map((b, idx) => {
              const maxVal = 50;
              const widthPct = (b.value / maxVal) * 100;
              return (
                <div key={idx} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.15rem', fontWeight: b.isUser ? '700' : '400', color: b.isUser ? 'white' : 'var(--text-muted)' }}>
                    <span>{b.label}</span>
                    <span>{b.value} kg/day</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: b.isUser ? '8px' : '5px', border: b.isUser ? '1px solid var(--primary-light)' : 'none' }}>
                    <div className="progress-bar-fill" style={{ width: `${Math.min(widthPct, 100)}%`, background: b.isUser ? 'linear-gradient(90deg, var(--primary), var(--primary-light))' : b.color }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target color="var(--primary)" size={14} />
                The Paris Agreement target is under <strong>4.0 kg/day</strong> per person.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ═══ SECTION C: TOP 3 PERSONALIZED ACTIONS (Green ROI) ═══ */}
          <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🌱 Your Top Actions
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '400', background: 'rgba(16,185,129,0.1)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>Green ROI</span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Maximum impact for minimum lifestyle disruption
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recommendations.map((rec, idx) => (
                <div key={rec.id} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>{medals[idx]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.2rem' }}>
                        {rec.icon} {rec.title}
                      </div>
                      <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '0.5rem' }}>
                        {rec.description}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>−{rec.weeklyReductionKg} kg/week</span>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: `${rec.effortColor}20`, color: rec.effortColor, fontWeight: '600' }}>
                          {rec.effort}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          ROI: <strong style={{ color: 'var(--primary-light)' }}>{rec.greenROI}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ SECTION E: CONFIDENCE INDICATOR ═══ */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Estimate Accuracy
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: confidence.color }}>{confidence.score}%</div>
                <div style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: confidence.color }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: confidence.color, display: 'inline-block' }} />
                  {confidence.rating}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Estimated: <strong>{footprintRange.low}–{footprintRange.high} kg CO₂/day</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Based on transport, diet, energy and waste data. Log more activities for tighter estimates.
                </div>
              </div>
            </div>
            <div className="progress-bar-bg" style={{ height: '6px' }}>
              <div className="progress-bar-fill" style={{ width: `${confidence.score}%`, background: `linear-gradient(90deg, ${confidence.color}, ${confidence.color}aa)`, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Saved Carbon Summary */}
          {savedCarbon > 0 && (
            <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#34d399', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                <TrendingDown size={16} /> Total Logged Savings
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'white' }}>
                {savedCarbon.toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--primary-light)' }}>kg CO₂e</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                ≈ {Math.floor(savedCarbon / 22)} trees planted 🌳
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};
