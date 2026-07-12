import  { useState } from 'react';
import EnvironmentalDashboard from './pages/EnvironmentalDashboard';
import SocialDashboard from './pages/SocialDashboard';
import GovernanceDashboard from './pages/GovernanceDashboard'; // Import Line Added

export default function App() {
  const [activeTab] = useState('Governance'); // Defaults to Screen 3

  const renderActiveView = () => {
    switch (activeTab) {
      case 'Environmental':
        return <EnvironmentalDashboard />;
      case 'Social':
        return <SocialDashboard />;
      case 'Governance': // Maps to Screen 3
        return <GovernanceDashboard />;
      default:
        return (
          <div className="p-12 text-center text-slate-500 bg-white border border-slate-300 rounded-xl m-6 font-bold">
            Workspace mockup layout placeholder for <strong className="text-black">"{activeTab}"</strong> module.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Global header configurations stay consistent */}
      
       
      

      

      <main className="flex-1">{renderActiveView()}</main>
    </div>
  );
}