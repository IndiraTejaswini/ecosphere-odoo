import React, { useState, useEffect } from 'react';
import Dashboard from '../pages/Dashboard';
import EnvironmentalDashboard from '../pages/EnvironmentalDashboard';
import SocialDashboard from '../pages/SocialDashboard';
import GovernanceDashboard from '../pages/GovernanceDashboard';
import GamificationDashboard from '../pages/GamificationDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'Overview';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTab(params.get('tab') || 'Overview');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const newUrl = `${window.location.pathname}?tab=${encodeURIComponent(newTab)}`;
    window.history.pushState({ tab: newTab }, '', newUrl);
  };

  const renderActiveView = () => {
    switch (activeTab.trim().toLowerCase()) {
      case 'overview':
      case 'environmental':
      case 'social': // FIXED: Now routes inside the Master Dashboard shell layout wrapper
      case 'governance':
      case 'gamification':
      case 'reports':
      case 'settings':
        return <Dashboard currentTab={activeTab} onTabChange={handleTabChange} />;
        
      default:
        return (
          <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-3xl m-8 font-bold">
            Workspace engine view placeholder for module: 
            <span className="text-slate-900 ml-2 font-mono">"{activeTab}"</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0f2438] flex flex-col antialiased">
      <main className="flex-1 w-full">
        {renderActiveView()}
      </main>
    </div>
  );
}