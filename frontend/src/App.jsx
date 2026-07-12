import React, { useState } from "react";
import Dashboard from "../pages/Dashboard";
import EnvironmentalDashboard from "../pages/EnvironmentalDashboard";
import SocialDashboard from "../pages/SocialDashboard";
import GovernanceDashboard from "../pages/GovernanceDashboard";

export default function App() {
  const [activeTab, setActiveTab] = useState("Overview");

  const renderActiveView = () => {
    switch (activeTab) {
      case "Overview":
        return <Dashboard currentTab={activeTab} onTabChange={setActiveTab} />;
      case "Environmental":
        return <EnvironmentalDashboard />;
      case "Social":
        return <SocialDashboard />;
      case "Governance":
        return <GovernanceDashboard />;
      default:
        return (
          <div className="p-12 text-center text-slate-400 bg-[#0f2438] border border-slate-800 rounded-3xl m-8 font-bold">
            Workspace engine view placeholder for module:
            <span className="text-magenta-400 ml-2 font-mono">
              "{activeTab}"
            </span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f2438] text-slate-100 flex flex-col antialiased">
      <main className="flex-1 w-full">{renderActiveView()}</main>
    </div>
  );
}
