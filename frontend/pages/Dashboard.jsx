import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import LineSidebar from '../components/dashboard/LineSidebar';
import LineNavbar from '../components/dashboard/LineNavbar';
import ScoreCard from '../components/dashboard/ScoreCard';
import AnalyticsSection from '../components/dashboard/AnalyticsSection';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActions from '../components/dashboard/QuickActions';

import EnvironmentalDashboard from './EnvironmentalDashboard';
import SocialDashboard from './SocialDashboard'; 
import GamificationDashboard from './GamificationDashboard';
import GovernanceDashboard from './GovernanceDashboard';
import ReportsDashboard from './ReportsDashboard';
import SettingsDashboard from './SettingsDashboard';

// --- BACKEND CONNECTION ---
import api from '../api';

export default function Dashboard({ currentTab, onTabChange, userRole, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // --- BACKEND CONNECTION: live ESG scores for the Overview tab's 4 ScoreCards ---
  const [esgData, setEsgData] = useState(null);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [scoresError, setScoresError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadEsgScores() {
      setScoresLoading(true);
      setScoresError('');
      try {
        const result = await api.reports.esgScore();
        if (!cancelled) setEsgData(result);
      } catch (err) {
        if (!cancelled) {
          setScoresError(
            err.status === 403
              ? 'ESG scores are admin-only. Log in as the admin account via TempLogin.'
              : err.message || 'Failed to load ESG scores'
          );
        }
      } finally {
        if (!cancelled) setScoresLoading(false);
      }
    }

    loadEsgScores();
    return () => {
      cancelled = true;
    };
  }, []); // fetched once - Dashboard stays mounted while tabs switch, no need to refetch per-tab

  // Org-wide pillar scores = average of each department's pillar score.
  // (esg-score returns per-department scores + one overall weighted total;
  // it doesn't return separate org-wide E/S/G numbers, so we derive them here.)
  const average = (arr) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);
  const environmentalScore = esgData ? average(esgData.departments.map((d) => d.environmentalScore)) : null;
  const socialScore = esgData ? average(esgData.departments.map((d) => d.socialScore)) : null;
  const governanceScore = esgData ? average(esgData.departments.map((d) => d.governanceScore)) : null;
  const overallScore = esgData ? esgData.organizationOverallScore : null;
  // --- END BACKEND CONNECTION (scores) ---

  const navLabels = [
    'Overview',
    'Environmental',
    'Social',
    'Governance',
    'Gamification',
    'Reports',
    'Settings'
  ];

  const activeIndex = navLabels.indexOf(currentTab) !== -1 ? navLabels.indexOf(currentTab) : 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigationClick = (index) => {
    const targetLabel = navLabels[index];
    if (targetLabel && onTabChange) {
      onTabChange(targetLabel);
    }
  };

  const renderMainContent = () => {
    switch (currentTab) {
      case 'Environmental':
        return <EnvironmentalDashboard />;
      case 'Social': 
        return <SocialDashboard />;
      case 'Gamification':
        return <GamificationDashboard />;
      case 'Governance':
        // Gate preserved from the user's own App.jsx restructure - relocated
        // here so it lives alongside the rest of the tab routing instead of
        // being duplicated across two files.
        if (userRole && userRole !== 'admin') {
          return (
            <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-3xl m-8 font-bold shadow-xs">
              Access Restricted: Corporate Admin credentials are required to view Governance parameters.
            </div>
          );
        }
        return <GovernanceDashboard />;
      case 'Reports':
        return <ReportsDashboard />;
      case 'Settings':
        return <SettingsDashboard />;
      case 'Overview':
      default:
        return (
          <>
            <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-3xs relative overflow-hidden group hover:shadow-2xs transition-all duration-300">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/30 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none z-0" />
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center relative z-10">
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold tracking-widest text-white bg-[#163fa1] px-3 py-1 rounded-md uppercase shadow-xs">
                      Operational Core
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    <span className="text-[11px] font-mono text-slate-400 font-bold tracking-tight">PLATFORM PARAMETER DEPLOYMENT</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-[#0f2438] sm:text-3xl">
                    EcoSphere: Real-Time ESG Aggregator Engine
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    This matrix bridges the gap between active ERP processing systems and auditable organizational metrics. By translating day-to-day manufacturing operations, employee CSR engagement channels, and risk mitigation procedures into real-time ledger layers, EcoSphere delivers a single point of truth for corporate governance compliance.
                  </p>
                </div>
                <div className="lg:col-span-1 grid grid-cols-3 lg:grid-cols-1 gap-3 w-full border-t lg:border-t-0 lg:border-l border-slate-200/60 pt-6 lg:pt-0 lg:pl-8">
                  <div className="text-center lg:text-left">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Environmental</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      {esgData ? `${Math.round(esgData.weighting.environmental * 100)}% Alloc` : '40% Alloc'}
                    </span>
                  </div>
                  <div className="text-center lg:text-left">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Social Index</span>
                    <span className="text-sm font-black text-sky-600 font-mono">
                      {esgData ? `${Math.round(esgData.weighting.social * 100)}% Alloc` : '30% Alloc'}
                    </span>
                  </div>
                  <div className="text-center lg:text-left">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Governance</span>
                    <span className="text-sm font-black text-[#A10559] font-mono">
                      {esgData ? `${Math.round(esgData.weighting.governance * 100)}% Alloc` : '30% Alloc'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- BACKEND CONNECTION: real scores replace the old hardcoded 82/74/88/81 --- */}
            {scoresError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-2xl px-6 py-4">
                ⚠️ {scoresError}
              </div>
            )}

            {scoresLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-3xl border border-slate-200/60 p-8 h-32 animate-pulse flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-wider"
                  >
                    Loading score...
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ScoreCard title="Environmental Score" score={environmentalScore ?? 0} glowColor="16, 185, 129" metricColor="text-emerald-600" />
                <ScoreCard title="Social Score" score={socialScore ?? 0} glowColor="14, 165, 233" metricColor="text-sky-600" />
                <ScoreCard title="Governance Score" score={governanceScore ?? 0} glowColor="161, 5, 89" customGlowHex="#A10559" metricColor="text-[#A10559]" />
                <ScoreCard title="Overall ESG Score" score={overallScore ?? 0} glowColor="71, 85, 105" metricColor="text-slate-700" isOverall />
              </div>
            )}
            {/* --- END BACKEND CONNECTION --- */}

            <AnalyticsSection />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <RecentActivity />
              </div>
              <div className="lg:col-span-1">
                <QuickActions />
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0f2438] font-sans antialiased selection:bg-blue-100 relative overflow-x-hidden">
      
      <header className={`sticky top-0 z-45 w-full transition-all duration-300 px-6 py-4 flex items-center justify-between border-b ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-[0_4px_30px_rgba(15,36,56,0.02)]' 
          : 'bg-transparent border-transparent'
      }`}>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:text-[#0f2438] bg-white/60 hover:bg-white rounded-xl border border-slate-200/40 transition-all duration-200 active:scale-95 shadow-3xs flex items-center justify-center cursor-pointer"
            aria-label="Open Navigation Drawer"
          >
            <Menu size={18} />
          </button>
          
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#163fa1] shadow-[0_0_12px_rgba(22,63,161,0.4)]" />
            <h1 className="text-base font-bold tracking-tight text-[#0f2438] uppercase">EcoSphere</h1>
            <span className="text-[9px] font-mono font-bold text-slate-400 border border-slate-200/60 px-1.5 py-0.5 rounded bg-white/80 tracking-wider">
              ESG ENGINE
            </span>
          </div>
        </div>

        <div className="hidden md:block">
          <LineNavbar 
            items={navLabels}
            accentColor="#163fa1"
            textColor="#64748B"
            fontSize={0.85}
            itemGap={16}
            proximityRadius={120}
            maxShift={5}
            defaultActive={activeIndex}
            onItemClick={(index) => handleNavigationClick(index)}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono tracking-tight text-slate-400 hidden sm:inline-block bg-white/90 border border-slate-200/40 px-2.5 py-1 rounded-lg shadow-3xs">
            QUALIFIER NODE // SECURE
          </span>
          <button
            onClick={onLogout}
            title="Log out"
            className="w-8 h-8 rounded-xl bg-[#0f2438] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm hover:bg-[#16344f] transition-colors cursor-pointer"
          >
            TZ
          </button>
        </div>
      </header>

      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isSidebarOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'}`}>
        <div 
          className={`absolute inset-0 bg-slate-900/20 backdrop-blur-xs transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />
        
        <aside className={`absolute top-0 bottom-0 left-0 w-80 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-[30px_0_60px_-15px_rgba(15,36,56,0.06)] flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">System Modules</span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-slate-400 hover:text-[#0f2438] hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200/40 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 px-6 py-8 overflow-y-auto flex flex-col justify-start">
            {isSidebarOpen && (
              <LineSidebar 
                items={navLabels}
                accentColor="#163fa1"
                textColor="#64748B"
                markerColor="#CBD5E1"
                showIndex={true}
                showMarker={true}
                fontSize={1.05}
                itemGap={22}
                maxShift={24}
                proximityRadius={110}
                defaultActive={activeIndex}
                onItemClick={(idx) => {
                  handleNavigationClick(idx);
                  setIsSidebarOpen(false);
                }}
              />
            )}
          </div>
        </aside>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
         {renderMainContent()}
      </main>
    </div>
  );
}