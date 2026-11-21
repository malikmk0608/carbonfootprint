import { useState, useEffect } from 'react';
import { Leaf, Calendar, Trees, LayoutDashboard, SlidersHorizontal, School } from 'lucide-react';
import { FallingLeaves } from './components/FallingLeaves';
import { DailyLogger } from './components/DailyLogger';
import { HistoryLog } from './components/HistoryLog';
import type { HistoryEntry } from './components/HistoryLog';
import { VirtualForest } from './components/VirtualForest';
import { EcoSapling } from './components/EcoSapling';
import { IntroModal } from './components/IntroModal';
import { Dashboard } from './components/Dashboard';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { CampusImpact } from './components/CampusImpact';

const ECO_TIPS = [
  "Leaving heating/cooling on for just 2 hours less saves up to 2.4 kg of CO₂e, equivalent to growing 10% of a tree instantly!",
  "Choosing a plant-based meal over beef cuts your carbon emissions by 80% for that meal!",
  "Unplugging electronics when fully charged eliminates vampire power draw, saving up to 80kg of CO₂e per year.",
  "Drying clothes on a line instead of a dryer for 1 month saves 30kg of CO₂e, protecting your local canopy.",
  "A single 5-minute shorter shower saves 12 gallons of water and prevents 0.5kg of carbon from water heating.",
  "Walking or cycling for trips under 2 km prevents carbon emissions entirely and keeps you healthy!",
  "Sorting recyclable plastic, paper, and compost cuts your weekly landfill waste emissions by 40%."
];

const getDailyTip = () => {
  const day = new Date().getDate();
  return ECO_TIPS[day % ECO_TIPS.length];
};

function App() {
  // Intro overlay state
  const [showIntro, setShowIntro] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Navigation tab: 'dashboard' | 'logger' | 'whatif' | 'campus' | 'history' | 'forest'
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Gamification & Log state
  const [ecoPoints, setEcoPoints] = useState<number>(180);
  const [streak, setStreak] = useState<number>(3);
  const [savedCarbon, setSavedCarbon] = useState<number>(45.5); // total carbon saved in kg
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Carbon Budget target (default 4.0 kg/day ~ Paris Agreement ~1.5t/yr)
  const [carbonBudgetTarget, setCarbonBudgetTarget] = useState<number>(4.0);

  // Load baseline if saved in localStorage, otherwise initialize with mock data for instant visualization!
  useEffect(() => {
    const savedPoints = localStorage.getItem('ecosphere_points');
    const savedStreak = localStorage.getItem('ecosphere_streak');
    const savedCarbonVal = localStorage.getItem('ecosphere_saved_carbon');
    const savedHistory = localStorage.getItem('ecosphere_history');
    const savedBudget = localStorage.getItem('ecosphere_budget_target');
    // Always show intro screen like a heartbeat on login/page-load!
    setShowIntro(true);

    if (savedBudget) setCarbonBudgetTarget(parseFloat(savedBudget));

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
      if (savedPoints) setEcoPoints(parseInt(savedPoints));
      if (savedStreak) setStreak(parseInt(savedStreak));
      if (savedCarbonVal) setSavedCarbon(parseFloat(savedCarbonVal));
    } else {
      // Mock history so the chart and forest look premium immediately!
      const mockHistory: HistoryEntry[] = [
        { id: 'h1', date: '2026-08-08', footprint: 16.2, savings: 1.8, xp: 25 },
        { id: 'h2', date: '2026-08-09', footprint: 12.4, savings: 5.6, xp: 45 },
        { id: 'h3', date: '2026-08-10', footprint: 15.0, savings: 3.0, xp: 30 },
        { id: 'h4', date: '2026-08-11', footprint: 8.8, savings: 9.2, xp: 75 },
        { id: 'h5', date: '2026-08-12', footprint: 11.2, savings: 6.8, xp: 55 },
        { id: 'h6', date: '2026-08-13', footprint: 9.5, savings: 8.5, xp: 65 },
        { id: 'h7', date: '2026-08-14', footprint: 10.1, savings: 7.9, xp: 60 },
      ];
      setHistory(mockHistory);
      setSavedCarbon(42.8); // sum of savings
      setEcoPoints(355);    // sum of xp
      setStreak(7);
      
      localStorage.setItem('ecosphere_history', JSON.stringify(mockHistory));
      localStorage.setItem('ecosphere_saved_carbon', '42.8');
      localStorage.setItem('ecosphere_points', '355');
      localStorage.setItem('ecosphere_streak', '7');
    }
  }, []);

  const handleSetBudgetTarget = (target: number) => {
    setCarbonBudgetTarget(target);
    localStorage.setItem('ecosphere_budget_target', target.toString());
  };

  const handleSaveLog = (footprint: number, savings: number, xp: number) => {
    const todayStr = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    
    // Check if we already logged today to either replace or add
    const existingIndex = history.findIndex((h) => h.date === todayStr);

    let updatedHistory = [...history];
    let carbonDifference = savings;
    let xpDifference = xp;

    if (existingIndex >= 0) {
      // Replace today's log if logging again
      const prev = history[existingIndex];
      carbonDifference = savings - prev.savings;
      xpDifference = xp - prev.xp;
      
      updatedHistory[existingIndex] = {
        id: prev.id,
        date: todayStr,
        footprint,
        savings,
        xp,
      };
    } else {
      // Append new daily log
      const newEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        date: todayStr,
        footprint,
        savings,
        xp,
      };
      updatedHistory = [newEntry, ...history];
      setStreak((prev) => prev + 1);
      localStorage.setItem('ecosphere_streak', (streak + 1).toString());
    }

    const newSavedCarbon = Math.max(0, savedCarbon + carbonDifference);
    const newPoints = Math.max(0, ecoPoints + xpDifference);

    setHistory(updatedHistory);
    setSavedCarbon(newSavedCarbon);
    setEcoPoints(newPoints);

    localStorage.setItem('ecosphere_history', JSON.stringify(updatedHistory));
    localStorage.setItem('ecosphere_saved_carbon', newSavedCarbon.toString());
    localStorage.setItem('ecosphere_points', newPoints.toString());
  };

  const handleResetHistory = () => {
    setShowResetConfirm(true);
  };

  const handleIntroComplete = (_pledgeId: string, bonusXp: number) => {
    setShowIntro(false);
    
    // Only award bonus XP if they haven't seen the intro yet in this browser's life
    const savedIntroSeen = localStorage.getItem('ecosphere_intro_seen');
    if (!savedIntroSeen) {
      localStorage.setItem('ecosphere_intro_seen', 'true');
      setEcoPoints((prev) => {
        const newPoints = prev + bonusXp;
        localStorage.setItem('ecosphere_points', newPoints.toString());
        return newPoints;
      });
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = history.find((h) => h.date === todayStr);
  const todaySavings = todayLog ? todayLog.savings : 0;
  const todayFootprint = todayLog ? todayLog.footprint : 12.0;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logger', label: 'Logger', icon: Leaf },
    { id: 'whatif', label: 'What-If', icon: SlidersHorizontal },
    { id: 'campus', label: 'Campus', icon: School },
    { id: 'history', label: 'History', icon: Calendar },
    { id: 'forest', label: 'Forest', icon: Trees },
  ];

  return (
    <>
      {/* Background visual components */}
      <FallingLeaves />
      <div className="blue-lightning-overlay" />

      {/* Floating tree mascot assistant */}
      <EcoSapling savedCarbon={savedCarbon} todaySavings={todaySavings} />

      {/* Interactive nature-themed startup modal */}
      {showIntro && (
        <IntroModal onComplete={handleIntroComplete} />
      )}

      {/* Nature-themed custom confirm modal */}
      {showResetConfirm && (
        <div className="nature-modal-backdrop" style={{ zIndex: 999999 }}>
          <div className="nature-modal-container" style={{ maxWidth: '420px', padding: '2.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1rem', color: '#f87171' }}>
              Clear Eco-Records?
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Are you sure you want to clear your daily footprint logs? This will permanently wipe your history, streak, and saved carbon.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                  setHistory([]);
                  setSavedCarbon(0);
                  setEcoPoints(0);
                  setStreak(0);
                  localStorage.removeItem('ecosphere_history');
                  localStorage.removeItem('ecosphere_saved_carbon');
                  localStorage.removeItem('ecosphere_points');
                  localStorage.removeItem('ecosphere_streak');
                  localStorage.removeItem('ecosphere_intro_seen');
                  localStorage.removeItem('ecosphere_budget_target');
                  setShowIntro(true); // reset and show intro modal
                  setShowResetConfirm(false);
                }}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', border: 'none', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
              >
                Clear Records
              </button>
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="app-container">
        {/* Header bar */}
        <header className="app-header">
          <div className="app-header-brand">
            <div style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #0d9488 100%)',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              flexShrink: 0,
            }}>
              <Leaf size={20} color="white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.6rem)', fontWeight: '800', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
                Eco<span className="gradient-text">Sphere</span>
              </h1>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>
                Carbon Decision Engine
              </span>
            </div>
          </div>

          <div className="app-header-actions">
            <button 
              onClick={handleResetHistory}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', display: 'flex', gap: '0.35rem', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}
              title="Reset All Logs History"
            >
              Clear Records
            </button>
          </div>
        </header>

        {/* Daily Eco Tip Banner - Distinct Amber Theme */}
        <div className="eco-tip-banner">
          <span className="eco-tip-icon">💡</span>
          <div style={{ minWidth: 0 }}>
            <strong style={{ color: '#fbbf24', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.2rem' }}>
              Daily Eco Tip
            </strong>
            <span style={{ fontSize: '0.88rem', color: '#fef08a', fontWeight: '700', lineHeight: '1.4', wordBreak: 'break-word' }}>
              {getDailyTip()}
            </span>
          </div>
        </div>

        {/* Navigation Tabs - 6 tabs with scrollable container */}
        <div className="nav-tabs" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        <main style={{ flex: 1 }}>
          {activeTab === 'dashboard' && (
            <Dashboard
              ecoPoints={ecoPoints}
              streak={streak}
              savedCarbon={savedCarbon}
              history={history}
              carbonBudgetTarget={carbonBudgetTarget}
              onSetBudgetTarget={handleSetBudgetTarget}
            />
          )}
          {activeTab === 'logger' && (
            <DailyLogger 
              onSaveLog={handleSaveLog} 
              streak={streak} 
            />
          )}
          {activeTab === 'whatif' && (
            <WhatIfSimulator 
              history={history}
            />
          )}
          {activeTab === 'campus' && (
            <CampusImpact 
              dailyFootprint={todayFootprint}
              history={history}
            />
          )}
          {activeTab === 'history' && (
            <HistoryLog 
              history={history} 
              totalSavedCarbon={savedCarbon} 
            />
          )}
          {activeTab === 'forest' && (
            <VirtualForest 
              savedCarbon={savedCarbon} 
              ecoPoints={ecoPoints} 
            />
          )}
        </main>

        {/* Footer */}
        <footer style={{ marginTop: '4rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <p>© 2026 EcoSphere — Carbon Decision Engine. Built on science-backed models (EPA, DEFRA, Science 2018). Live Lightly on Earth.</p>
        </footer>
      </div>
    </>
  );
}

export default App;
