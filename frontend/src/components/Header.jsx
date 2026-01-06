import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { supabase } from '../supabase';

// IMAGES
import compassLogo from '../assets/logo-compass.png';
import sammyChat from '../assets/sammy-chat.png';

const Header = ({ 
    activeTab, 
    setActiveTab, 
    user, 
    onLoginClick,
    showAIChat,
    onToggleChat,
    selectedSchool
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <header className="bg-[#003C6C] border-b border-[#FDC700] sticky top-0 z-[60] shadow-xl shrink-0 h-[80px]">
      <div className="w-full h-full px-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          
          {/* LEFT: Logo Area */}
          <div className="flex items-center gap-3 justify-self-start relative">
            {/* ✅ UPDATED: Massive Logo with Negative Margins (Doesn't affect header height) */}
            <img 
              src={compassLogo} 
              alt="AI Slug Navigator" 
              className="w-24 h-24 object-contain drop-shadow-lg hover:scale-105 transition-transform -my-6 z-50 relative" 
            />
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">AI Slug Navigator</h1>
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-100 mt-1">
                  <GraduationCap className="w-4 h-4 text-[#FDC700]" /> {selectedSchool.term}
              </div>
            </div>
          </div>

          {/* CENTER: Tabs */}
          <div className="flex justify-center">
              <div className="flex bg-[#002a4d]/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg overflow-hidden">
                  {['search', 'schedule'].map(tab => (
                      <button 
                          key={tab} 
                          onClick={() => setActiveTab(tab)} 
                          className={`px-8 py-2.5 text-sm font-bold transition-all duration-200 rounded-none cursor-pointer ${
                              activeTab === tab 
                              ? 'bg-white text-[#003C6C] shadow-sm' 
                              : 'text-blue-200 hover:text-white hover:bg-white/5'
                          }`}
                      >
                          {tab === 'schedule' ? 'My Schedule' : 'Search'}
                      </button>
                  ))}
              </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-4 justify-self-end">
            
            {/* ✅ UPDATED: Button stays small, Image hangs off the side */}
            <button 
              onClick={onToggleChat} 
              className={`pl-10 pr-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg border-2 border-[#FDC700] bg-[#FDC700] text-[#003C6C] hover:bg-[#eec00e] active:shadow-inner active:translate-y-0.5 relative overflow-visible`}
            >
              {/* Massive Sammy Image positioned absolutely to hang off the button */}
              <img 
                src={sammyChat} 
                alt="Sammy" 
                className="absolute -left-6 top-1/2 -translate-y-1/2 w-16 h-16 object-contain drop-shadow-md hover:scale-110 transition-transform" 
              />
              {showAIChat ? 'Hide Assistant' : 'Ask Sammy AI'}
            </button>

            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                  <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="w-10 h-10 bg-[#FDC700] text-[#003C6C] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-105 transition-transform">
                    {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute top-full right-0 mt-4 w-72 bg-white rounded-[24px] shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-100 p-8 animate-in zoom-in-95 z-[60]">
                        <div className="mb-4 pb-4 border-b border-slate-100 text-center">
                           <p className="font-bold text-slate-800">{user.user_metadata?.full_name || "User"}</p>
                           <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-3.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-[11px] hover:bg-rose-600 hover:text-white transition-all cursor-pointer">
                            <LogOut className="w-4 h-4" /> Log out
                        </button>
                    </div>
                  )}
              </div>
            ) : (
              <button onClick={onLoginClick} className="px-6 py-2.5 bg-[#FDC700] text-[#003C6C] font-bold rounded-xl text-sm hover:bg-[#eec00e] transition-all cursor-pointer border-2 border-[#FDC700] flex items-center gap-2 shadow-lg active:shadow-inner active:translate-y-0.5">
                  <User className="w-4 h-4" /> Log in
              </button>
            )}
          </div>
      </div>
    </header>
  );
};

export default Header;