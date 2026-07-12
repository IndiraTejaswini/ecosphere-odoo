import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 1. Import your Home components (Paths updated to ../components)
import Navbar from '../components/Home/Navbar';
import HeroSection from '../components/Home/HeroSection'; 
import FeatureSection from '../components/Home/FeatureSection'; 
import AboutUs from '../components/Home/AboutUs'; 
import Faq from '../components/Home/Faq';
import Testimonals from '../components/Home/Testimonals';
import Footer from '../components/Home/Footer';

// 2. Import your Dashboard pages (Paths correctly using ../pages)
import Dashboard from '../pages/Dashboard';
import EnvironmentalDashboard from '../pages/EnvironmentalDashboard';
import SocialDashboard from '../pages/SocialDashboard';
import GovernanceDashboard from '../pages/GovernanceDashboard';
import GamificationDashboard from '../pages/GamificationDashboard';

export default function App() {
  // Dashboard Tab State Logic
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

  const renderActiveDashboardView = () => {
    switch (activeTab.trim().toLowerCase()) {
      case 'overview':
      case 'environmental':
      case 'social': 
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
    <BrowserRouter>
      <Routes>
        {/* Landing Page Route */}
        <Route 
          path="/" 
          element={
            <>
              <Navbar /> 
              <HeroSection />
              <FeatureSection />
              <AboutUs />
              <Testimonals/>
              <Faq />
              <Footer/>
            </>
          } 
        />

        {/* Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            <div className="min-h-screen bg-[#F8FAFC] text-[#0f2438] flex flex-col antialiased">
              <main className="flex-1 w-full">
                {renderActiveDashboardView()}
              </main>
            </div>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}