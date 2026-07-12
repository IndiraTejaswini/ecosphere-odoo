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

  // Core Feature: Notification system data mapping exactly to your problem statement
  const unreadCount = 3;
  const notifications = [
    { id: 1, type: 'answer', text: 'Someone answered your question', icon: MessageSquare, time: '2m ago' },
    { id: 2, type: 'comment', text: 'Someone commented on your answer', icon: CheckCircle, time: '1h ago' },
    { id: 3, type: 'mention', text: 'Someone mentioned you using @username', icon: AtSign, time: '2h ago' },
  ];

  // Close notifications on clicking outside
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
      {/* 
        THE SLIDING GLASS PANEL: 
        Width slides smoothly from 86% down to 65% on scroll, compressing elements into the middle.
      */}
      <nav 
        className={`
          flex items-center justify-between transition-all duration-700 ease-in-out pointer-events-auto font-sans
          ${isScrolled 
            ? 'w-[65%] max-w-4xl px-6 py-2.5 bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-full shadow-xl' 
            : 'w-[86%] max-w-7xl px-8 py-3.5 bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-full'
          }
        `}
      >
        {/* LEFT: Platform Branding */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 bg-white text-slate-950 font-black rounded-full flex items-center justify-center text-sm">
            S
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            StackIt
          </span>
        </div>

        {/* MIDDLE: Essential Forum Routes Only */}
        <ul className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide text-slate-300">
          <li className="text-white cursor-pointer hover:text-white transition-colors">Home</li>
          <li className="hover:text-white cursor-pointer transition-colors">Questions</li>
          <li className="hover:text-white cursor-pointer transition-colors">Tags</li>
        </ul>

        {/* RIGHT: Essential User Actions & Notification Dropdown */}
        <div className="flex items-center gap-4">
          
          {/* Quick toggle to test views during landing page construction */}
          <button 
            onClick={() => setIsLoggedIn(!isLoggedIn)}
            className="text-[9px] uppercase font-bold tracking-wider text-slate-500 hover:text-white transition-colors hidden lg:block mr-1"
          >
            {isLoggedIn ? "[Guest View]" : "[User View]"}
          </button>

          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-white transition-colors">
              <Search size={16} />
            </button>

            {/* Notification Bell Dropdown Panel */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1 text-slate-400 hover:text-white transition-colors focus:outline-none"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-blue-600 text-[7px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

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
                <button className="w-7 h-7 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                  <User size={14} />
                </button>
                <button className="hidden sm:block px-4 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-full transition-all active:scale-95">
                  Ask Question
                </button>
              </>
            ) : (
              <button className="px-4 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-full transition-all active:scale-95">
                Sign In
              </button>
            )}
          </div>

          <button className="md:hidden text-white">
            <Menu size={22} />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;