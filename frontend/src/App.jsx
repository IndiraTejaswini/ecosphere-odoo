import React, { useState } from 'react';
import Dashboard from './pages/Dashboard'; // Your premium executive dashboard
import EnvironmentalDashboard from './pages/EnvironmentalDashboard'; // Friend's module
import SocialDashboard from './pages/SocialDashboard'; // Friend's module
import GovernanceDashboard from './pages/GovernanceDashboard'; // Friend's module

export default function App() {
  // Shared state controller to bridge the navigation engine to your active view workspace
  const [activeTab, setActiveTab] = useState('Overview');

  // Unified routing execution layout panel switcher
  const renderActiveView = () => {
    switch (activeTab) {
      case 'Overview':
        // We pass setActiveTab down so your navbar/sidebar can change views!
        return <Dashboard currentTab={activeTab} onTabChange={setActiveTab} />;
      case 'Environmental':
        return <EnvironmentalDashboard />;
      case 'Social':
        return <SocialDashboard />;
      case 'Governance':
        return <GovernanceDashboard />;
      default:
        return (
          <div className="p-12 text-center text-slate-400 bg-[#0f2438] border border-slate-800 rounded-3xl m-8 font-bold">
            Workspace engine view placeholder for module: 
            <span className="text-magenta-400 ml-2 font-mono">"{activeTab}"</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f2438] text-slate-100 flex flex-col antialiased">
      <main className="flex-1 w-full">
        {renderActiveView()}
      </main>
    </div>
  );
}