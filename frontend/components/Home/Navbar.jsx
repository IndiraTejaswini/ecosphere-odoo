

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, User, MessageSquare, AtSign, CheckCircle } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Toggle to simulate guest vs logged-in user
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Monitor page scroll to trigger the sliding width compression
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Notification system mock dataset
  const unreadCount = 3;
  const notifications = [
    { id: 1, type: 'answer', text: 'Someone answered your question', icon: MessageSquare, time: '2m ago' },
    { id: 2, type: 'comment', text: 'Someone commented on your answer', icon: CheckCircle, time: '1h ago' },
    { id: 3, type: 'mention', text: 'Someone mentioned you using @username', icon: AtSign, time: '2h ago' },
  ];

  // Close notifications dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-5 w-full pointer-events-none">
      {/* THE SLIDING GLASS PANEL */}
      <nav 
        className={`
          flex items-center justify-between transition-all duration-700 ease-in-out pointer-events-auto font-sans
          ${isScrolled 
            ? 'w-[75%] max-w-5xl px-6 py-2.5 bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-full shadow-xl' 
            : 'w-[90%] max-w-7xl px-8 py-3.5 bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-full'
          }
        `}
      >
        {/* LEFT: Platform Branding */}
        <a href="#home" className="flex items-center gap-2 cursor-pointer no-underline">
          <div className="w-7 h-7 bg-slate-900 text-white font-black rounded-full flex items-center justify-center text-sm">
            E
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900">
            EcoSphere
          </span>
        </a>

        {/* MIDDLE: Comprehensive linked page navigation routes with clean black hover color */}
        <ul className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-wide">
          <li>
            <a href="#home" className="text-slate-900 cursor-pointer hover:text-black transition-colors no-underline">
              Home
            </a>
          </li>
          <li>
            <a href="#tags" className="text-slate-700 hover:text-black cursor-pointer transition-colors no-underline">
              Features
            </a>
          </li>
          <li>
            <a href="#about" className="text-slate-700 hover:text-black cursor-pointer transition-colors no-underline">
              About Us
            </a>
          </li>
          
          <li>
            <a href="#testimonials" className="text-slate-700 hover:text-black cursor-pointer transition-colors no-underline">
              Testimonials
            </a>
          </li>
          <li>
            <a href="#faqs" className="text-slate-700 hover:text-black cursor-pointer transition-colors no-underline">
              FAQs
            </a>
          </li>
        </ul>

        {/* RIGHT: Essential User Actions & Notification Dropdown */}
        <div className="flex items-center gap-4">
          
          {/* Quick toggle to test states */}
          

          <div className="flex items-center gap-4">
            

            {/* Notification Bell Dropdown Panel */}
            <div className="relative" ref={dropdownRef}>
              

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-80 bg-slate-950/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                    <span className="font-bold text-white text-xs tracking-wider uppercase">Notifications</span>
                    <span className="text-xs text-slate-400 font-semibold cursor-pointer hover:underline">Mark read</span>
                  </div>
                  <div className="max-h-[240px] overflow-y-auto">
                    {notifications.map((notif) => {
                      const Icon = notif.icon;
                      return (
                        <div key={notif.id} className="p-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer flex gap-3 transition-colors">
                          <div className="mt-0.5 text-white bg-white/10 p-1.5 rounded-lg h-fit">
                            <Icon size={13} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-300 leading-normal font-medium">{notif.text}</p>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">{notif.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Conditional Authentication Options */}
            {isLoggedIn ? (
              <>
              
                
              </>
            ) : (
              <button className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-all active:scale-95">
                Sign In
              </button>
            )}
          </div>

          <button className="lg:hidden text-slate-900">
            <Menu size={22} />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;