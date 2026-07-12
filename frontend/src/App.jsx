import React, { useState, useEffect } from 'react';
import Navbar from '../components/Home/Navbar';
import HeroSection from '../components/Home/HeroSection';
import FeatureSection from '../components/Home/FeatureSection';
import AboutUs from '../components/Home/AboutUs';
import Testimonals from '../components/Home/Testimonals';
import Faq from '../components/Home/Faq';
import Footer from '../components/Home/Footer';

import Dashboard from '../pages/Dashboard';

// --- BACKEND CONNECTION ---
import api from '../api';

export default function App() {
  // "authChecked" gates the initial render so we don't flash the homepage
  // (or the dashboard) before we actually know whether the stored token,
  // if any, is still valid.
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [activeTab, setActiveTab] = useState('Overview');

  // --- BACKEND CONNECTION: real auth check on load ---
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    if (!api.auth.isLoggedIn()) {
      setAuthChecked(true);
      return;
    }
    try {
      const user = await api.auth.me(); // confirms the stored token is still valid, not just present
      setIsAuthenticated(true);
      setUserRole((user.role || 'user').toLowerCase());
    } catch {
      api.auth.logout(); // stale/invalid token - clear it
    } finally {
      setAuthChecked(true);
    }
  }

  async function handleAuthSuccess() {
    try {
      const user = await api.auth.me();
      setIsAuthenticated(true);
      setUserRole((user.role || 'user').toLowerCase());
      setActiveTab('Overview');
    } catch {
      alert('Logged in, but could not load your profile. Please try refreshing.');
    }
  }

  function handleLogout() {
    api.auth.logout();
    setIsAuthenticated(false);
    setUserRole('user');
    setActiveTab('Overview');
  }
  // --- END auth check ---

  // Every tab now routes through Dashboard.jsx, which already contains the
  // full switch for all 7 tabs (Overview/Environmental/Social/Governance/
  // Gamification/Reports/Settings) plus the shared header/sidebar chrome.
  // Previously Environmental/Social/Governance were rendered directly here,
  // bypassing that chrome entirely, and Gamification/Reports/Settings had no
  // case at all.
  const renderActiveView = () => (
    <Dashboard
      currentTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      userRole={userRole}
    />
  );

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-400 font-bold text-sm">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white text-[#0f2438] overflow-y-auto selection:bg-blue-100 scroll-smooth">
        <Navbar onAuthClick={() => {
          const heroCard = document.querySelector('form');
          if (heroCard) heroCard.scrollIntoView({ behavior: 'smooth' });
        }} />
        <HeroSection onAuthSuccess={handleAuthSuccess} />
        <FeatureSection />
        <AboutUs />
        <Testimonals />
        <Faq />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0f2438] flex flex-col antialiased">
      <main className="flex-1 w-full">
        {renderActiveView()}
      </main>
    </div>
  );
}