import React, { useEffect, useState } from 'react';
import { X, ArrowRight, Lightbulb } from 'lucide-react';

export interface CategoryExplainerProps {
  isOpen: boolean;
  onClose: () => void;
  category: {
    name: string;
    value: number;
    totalFootprint: number;
    color: string;
    icon: string;
  };
  userInputs: {
    transportMode: string;
    transportDistance: number;
    dietType: string;
    acHours: number;
    electronicsHours: number;
    recycled: boolean;
    purchases: number;
  };
}

export const CategoryExplainer: React.FC<CategoryExplainerProps> = ({
  isOpen,
  onClose,
  category,
  userInputs
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const handleAnimationEnd = () => {
    if (!isOpen) setIsRendered(false);
  };

  const percentage = category.totalFootprint > 0 
    ? ((category.value / category.totalFootprint) * 100).toFixed(1) 
    : '0.0';

  // Calculate specific logic
  const getExplanation = () => {
    switch (category.name) {
      case 'Transportation': {
        const { transportMode, transportDistance } = userInputs;
        const transportFactors: Record<string, number> = {
          'petrol': 0.19, 'diesel': 0.18, 'ev': 0.05,
          'transit': 0.04, 'bus': 0.025, 'metro': 0.02,
          'two-wheeler': 0.05, 'cab': 0.08, 'active': 0, 'walk': 0, 'bicycle': 0
        };
        const currentEmissions = transportDistance * (transportFactors[transportMode.toLowerCase()] || 0.19);
        const altMode = ['petrol', 'diesel', 'cab'].includes(transportMode.toLowerCase()) ? 'bus' : 
                        ['two-wheeler', 'bus', 'transit'].includes(transportMode.toLowerCase()) ? 'metro' : 'bicycle';
        const altEmission = transportDistance * (transportFactors[altMode] || 0);
        const reduction = currentEmissions > 0 ? ((currentEmissions - altEmission) / currentEmissions) * 100 : 0;
        
        return {
          whyText: (
            <>
              <p style={{ margin: '0 0 0.5rem' }}>You travel {transportDistance} km/day by {transportMode}.</p>
              <p style={{ margin: '0 0 0.5rem' }}>🚗 {transportMode} accounts for {currentEmissions > 0 ? '100' : '0'}% of your transport emissions.</p>
              <p style={{ margin: '0' }}>If you switched to {altMode}:</p>
            </>
          ),
          current: currentEmissions,
          potential: altEmission,
          reduction: reduction.toFixed(0),
          action: `Switch ${transportDistance}km daily commute from ${transportMode} to ${altMode}.`,
          savings: Math.max(0, currentEmissions - altEmission).toFixed(1),
          effort: altMode === 'bicycle' ? 'Hard' : 'Medium'
        };
      }
      case 'Diet & Food': {
        const { dietType } = userInputs;
        const current = category.value;
        const potential = dietType === 'high-meat' ? 5.5 : 
                          dietType === 'average' ? 2.8 : 
                          dietType === 'vegetarian' ? 1.8 : 1.8;
        const reduction = current > 0 ? ((current - potential) / current) * 100 : 0;
        const isVegan = dietType === 'vegan';
        
        return {
          whyText: (
            <>
              <p style={{ margin: '0 0 0.5rem' }}>Your current diet ({dietType}) produces {current.toFixed(1)} kg CO₂/day.</p>
              <p style={{ margin: '0 0 0.5rem' }}>Meat and dairy account for ~60% of food emissions on average.</p>
              {!isVegan && <p style={{ margin: '0' }}>If you went one step greener:</p>}
            </>
          ),
          current,
          potential: isVegan ? current : potential,
          reduction: isVegan ? '0' : reduction.toFixed(0),
          action: dietType === 'high-meat' ? 'Reduce meat consumption to average levels.' :
                  dietType === 'average' ? 'Try going vegetarian 3 days a week.' :
                  'Go fully vegan for maximum impact.',
          savings: Math.max(0, current - potential).toFixed(1),
          effort: 'Medium'
        };
      }
      case 'Energy': {
        const { acHours, electronicsHours } = userInputs;
        const acEmission = acHours * 1.2;
        const elecEmission = electronicsHours * 0.45;
        const suggestedAC = Math.max(0, acHours - 2) * 1.2;
        const potential = suggestedAC + elecEmission;
        const current = category.value;
        const reduction = current > 0 ? ((current - potential) / current) * 100 : 0;
        
        return {
          whyText: (
            <>
              <p style={{ margin: '0 0 0.5rem' }}>You use AC/heating for {acHours} hrs/day.</p>
              <p style={{ margin: '0 0 0.5rem' }}>AC alone contributes {acEmission.toFixed(1)} kg CO₂/day.</p>
              <p style={{ margin: '0 0 0.5rem' }}>Electronics add another {elecEmission.toFixed(1)} kg.</p>
              <p style={{ margin: '0' }}>If you reduced AC by 2 hours:</p>
            </>
          ),
          current,
          potential,
          reduction: reduction.toFixed(0),
          action: 'Reduce AC usage by 2 hours daily, use fans instead.',
          savings: Math.max(0, current - potential).toFixed(1),
          effort: 'Easy'
        };
      }
      case 'Lifestyle':
      default: {
        const { recycled, purchases } = userInputs;
        const current = category.value;
        const potential = 0.9; // recycled (0.9) + 0 purchases
        const reduction = current > 0 ? ((current - potential) / current) * 100 : 0;
        
        return {
          whyText: (
            <>
              <p style={{ margin: '0 0 0.5rem' }}>{recycled ? 'Good: You recycle!' : 'You currently don\'t recycle waste.'}</p>
              <p style={{ margin: '0 0 0.5rem' }}>You purchased {purchases} new item(s) today.</p>
              <p style={{ margin: '0 0 0.5rem' }}>Each new item adds ~1.5 kg CO₂.</p>
              <p style={{ margin: '0' }}>If you recycled all waste + bought nothing new:</p>
            </>
          ),
          current,
          potential,
          reduction: reduction.toFixed(0),
          action: 'Avoid unnecessary purchases and compost/recycle all waste.',
          savings: Math.max(0, current - potential).toFixed(1),
          effort: purchases > 0 ? 'Medium' : 'Easy'
        };
      }
    }
  };

  const exp = getExplanation();

  return (
    <div 
      className="category-explainer-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.3s ease',
        padding: '1rem'
      }}
      onClick={onClose}
      onTransitionEnd={handleAnimationEnd}
    >
      <div 
        className="glass-card"
        style={{
          background: 'rgba(10, 31, 19, 0.95)',
          border: `1px solid ${category.color}40`,
          borderRadius: 'var(--radius-lg, 12px)',
          width: '100%',
          maxWidth: '520px',
          color: '#e5e7eb',
          position: 'relative',
          transform: isOpen ? 'translateY(0)' : 'translateY(30px)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s, background 0.2s'
          }}
          onMouseOver={e => (e.currentTarget.style.color = '#fff')}
          onMouseOut={e => (e.currentTarget.style.color = '#9ca3af')}
        >
          <X size={20} />
        </button>

        <div style={{ padding: '1.5rem 1.5rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>{category.icon}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-display, Outfit)', fontWeight: 600, color: '#fff' }}>
                {category.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 600, color: category.color }}>
                  {category.value.toFixed(1)} kg CO₂/day
                </span>
                <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                  ({percentage}% of your daily footprint)
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ 
            height: '6px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '1.5rem'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${percentage}%`, 
              background: category.color,
              borderRadius: '3px',
              transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>
              Why is this high?
            </h3>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.5, color: '#d1d5db' }}>
              {exp.whyText}
            </div>
          </div>

          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            borderRadius: 'var(--radius-md, 8px)', 
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 500 }}>Current</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: category.color }}>{exp.current.toFixed(1)}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>kg/day</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1rem' }}>
                <ArrowRight size={20} color="#9ca3af" style={{ marginBottom: '0.25rem' }} />
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  ↓ {exp.reduction}%
                </div>
              </div>
              
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 500 }}>Potential</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#10b981' }}>{exp.potential.toFixed(1)}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>kg/day</div>
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#10b981' }}>
              <Lightbulb size={20} />
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>Your best move</span>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#e5e7eb', lineHeight: 1.5 }}>
              {exp.action}
            </p>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#9ca3af' }}>
                Potential savings: <strong style={{ color: '#10b981' }}>{exp.savings} kg/day</strong>
              </span>
              <span style={{ color: '#9ca3af' }}>
                Effort: <strong style={{ 
                  color: exp.effort === 'Easy' ? '#10b981' : exp.effort === 'Medium' ? '#f59e0b' : '#f87171' 
                }}>{exp.effort}</strong>
              </span>
            </div>
          </div>
        </div>
        
        <div style={{ 
          padding: '0.75rem 1.5rem', 
          background: 'rgba(0,0,0,0.4)', 
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.75rem',
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: 1.4
        }}>
          📊 These estimates use emission factors from EPA & DEFRA databases.<br/>
          Confidence level depends on input completeness.
        </div>
      </div>
    </div>
  );
};
