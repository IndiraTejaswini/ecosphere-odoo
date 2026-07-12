import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import LineSidebar from '../components/dashboard/LineSidebar';
import LineNavbar from '../components/dashboard/LineNavbar';
import ScoreCard from '../components/dashboard/ScoreCard';
import AnalyticsSection from '../components/dashboard/AnalyticsSection';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActions from '../components/dashboard/QuickActions';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const navLabels = [
    'Overview', 
    'Environmental', 
    'Social', 
    'Governance', 
    'Gamification', 
    'Reports', 
    'Settings'
  ];[cite: 5]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f2438] text-slate-100 font-sans antialiased selection:bg-magenta-500/30 relative overflow-x-hidden">
      
      {/* Dynamic Glassmorphic Navigation Header - Adapted for Dark Backgrounds */}
      <header className={`sticky top-0 z-45 w-full transition-all duration-300 px-6 py-4 flex items-center justify-between border-b ${
        isScrolled 
          ? 'bg-[#0f2438]/80 backdrop-blur-xl border-slate-700/40 shadow-[0_4px_30px_rgba(0,0,0,0.2)]' 
          : 'bg-transparent border-transparent'
      }`}>[cite: 5]
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-xl border border-slate-700/40 transition-all duration-200 active:scale-95 shadow-2xs flex items-center justify-center cursor-pointer"
            aria-label="Open Navigation Drawer"
          >
            <Menu size={18} />
          </button>[cite: 5]
          
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-magenta-500 shadow-[0_0_12px_rgba(217,70,239,0.6)]" />
            <h1 className="text-base font-bold tracking-tight text-white uppercase">EcoSphere</h1>
            <span className="text-[9px] font-mono font-bold text-slate-400 border border-slate-700/60 px-1.5 py-0.5 rounded bg-slate-900 tracking-wider">
              ESG ENGINE
            </span>
          </div>[cite: 5]
        </div>

        {/* Horizontal Physics Engine Navbar */}
        <div className="hidden md:block">
          <LineNavbar 
            items={navLabels.slice(0, 5)}
            accentColor="#d946ef" // Swapped active tracking to Magenta
            textColor="#94A3B8"
            fontSize={0.85}
            itemGap={16}
            proximityRadius={120}
            maxShift={5}
            defaultActive={activeTab}
            onItemClick={(index) => setActiveTab(index)}
          />[cite: 5]
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono tracking-tight text-slate-400 hidden sm:inline-block bg-slate-900 border border-slate-700/40 px-2.5 py-1 rounded-lg shadow-3xs">
            QUALIFIER NODE // SECURE
          </span>
          <div className="w-8 h-8 rounded-xl bg-magenta-600 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            TZ
          </div>
        </div>[cite: 5]
      </header>

      {/* Slide-out Sidebar Drawer System Container */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isSidebarOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'}`}>
        <div 
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />[cite: 5]
        
        <aside className={`absolute top-0 bottom-0 left-0 w-80 bg-[#0f2438]/95 backdrop-blur-xl border-r border-slate-700/50 shadow-[30px_0_60px_-15px_rgba(0,0,0,0.5)] flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>[cite: 5]
          <div className="p-6 flex items-center justify-between border-b border-slate-700/40 bg-slate-900/30">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">System Modules</span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700/40 cursor-pointer"
            >
              <X size={14} />
            </button>[cite: 5]
          </div>

          <div className="flex-1 px-8 py-12 overflow-y-auto flex items-center justify-start">
            {isSidebarOpen && (
              <LineSidebar 
                items={navLabels}
                accentColor="#d946ef" // Sidebar tracks with Magenta
                textColor="#94A3B8"
                markerColor="#475569"
                fontSize={1.25}
                itemGap={26}
                maxShift={28}
                defaultActive={activeTab}
                onItemClick={(idx) => {
                  setActiveTab(idx);
                  setIsSidebarOpen(false); 
                }}
              />
            )}
          </div>[cite: 5]
        </aside>
      </div>

      {/* Main Container Viewport Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        
        {/* Core Objective Header Block - Dark Mode Styling */}
        <div className="bg-slate-900/40 rounded-3xl border border-slate-700/40 p-8 shadow-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-magenta-500/5 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none z-0" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center relative z-10">
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-widest text-white bg-magenta-600 px-3 py-1 rounded-md uppercase shadow-xs">
                  Operational Core
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <span className="text-[11px] font-mono text-slate-400 font-bold tracking-tight">PLATFORM PARAMETER DEPLOYMENT</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white sm:text-3xl">
                EcoSphere: Real-Time ESG Aggregator Engine
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                This matrix bridges the gap between active ERP processing systems and auditable organizational metrics[cite: 1]. By translating day-to-day manufacturing operations, employee CSR engagement channels, and risk mitigation procedures into real-time ledger layers, EcoSphere delivers a single point of truth for corporate governance compliance[cite: 1].
              </p>
            </div>

            <div className="lg:col-span-1 grid grid-cols-3 lg:grid-cols-1 gap-3 w-full border-t lg:border-t-0 lg:border-l border-slate-700/60 pt-6 lg:pt-0 lg:pl-8">
              <div className="text-center lg:text-left">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Environmental</span>
                <span className="text-sm font-black text-emerald-400 font-mono">40% Alloc[cite: 1]</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Social Index</span>
                <span className="text-sm font-black text-sky-400 font-mono">30% Alloc[cite: 1]</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Governance</span>
                <span className="text-sm font-black text-magenta-400 font-mono">30% Alloc[cite: 1]</span>
              </div>
            </div>
          </div>
        </div>[cite: 5]

        {/* Bento Scores Matrix Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ScoreCard title="Environmental Score" score={82} glowColor="16, 185, 129" metricColor="text-emerald-400" />
          <ScoreCard title="Social Score" score={74} glowColor="14, 165, 233" metricColor="text-sky-400" />
          {/* Governance Score Card updated to Magenta theme colors */}
          <ScoreCard title="Governance Score" score={88} glowColor="217, 70, 239" metricColor="text-magenta-400" /> 
          <ScoreCard title="Overall ESG Score" score={81} glowColor="148, 163, 184" metricColor="text-slate-300" isOverall />
        </div>[cite: 5]

        <AnalyticsSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
        </div>[cite: 5]
      </main>
    </div>
  );
}