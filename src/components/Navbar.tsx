import React from 'react';
import { ViewState, LocalSessionProfile } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  session: LocalSessionProfile | null;
  userPhotoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  session,
  userPhotoUrl,
}) => {
  const isExploreActive = currentView.type === 'explore';
  const isCreateActive = currentView.type === 'create';
  const isMyProfileActive = currentView.type === 'my-profile';
  const isQRActive = currentView.type === 'qr';

  return (
    <header className="fixed top-0 w-full z-50 bg-[#ffffff]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#dee0ed]/40">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => onNavigate({ type: 'home' })}
          className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#152de4] to-[#3a4efb] flex items-center justify-center text-white shadow-md shadow-[#152de4]/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">hub</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[18px] sm:text-[20px] font-bold text-[#161a33] leading-tight tracking-tight">
              APAC Rural Connect
            </span>
            <span className="text-[11px] font-bold text-[#444656] uppercase tracking-wider">
              Sri Lanka 2026
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center p-1 bg-[#f4f2ff] rounded-full border border-[#dee0ed]/60">
          {!session ? (
            <>
              <button
                onClick={() => onNavigate({ type: 'home' })}
                className={`px-5 py-2 text-[14px] font-bold rounded-full transition-all cursor-pointer ${
                  currentView.type === 'home'
                    ? 'bg-[#3a4efb] text-white shadow-[0_4px_14px_rgba(58,78,251,0.25)]'
                    : 'text-[#444656] hover:text-[#161a33]'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate({ type: 'create' })}
                className={`px-5 py-2 text-[14px] font-bold rounded-full transition-all cursor-pointer ${
                  isCreateActive
                    ? 'bg-[#3a4efb] text-white shadow-[0_4px_14px_rgba(58,78,251,0.25)]'
                    : 'text-[#444656] hover:text-[#161a33]'
                }`}
              >
                Create Profile
              </button>
              <button
                onClick={() => onNavigate({ type: 'explore' })}
                className={`px-5 py-2 text-[14px] font-bold rounded-full transition-all cursor-pointer ${
                  isExploreActive
                    ? 'bg-[#3a4efb] text-white shadow-[0_4px_14px_rgba(58,78,251,0.25)]'
                    : 'text-[#444656] hover:text-[#161a33]'
                }`}
              >
                Explore
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate({ type: 'explore' })}
                className={`px-5 py-2 text-[14px] font-bold rounded-full transition-all cursor-pointer ${
                  isExploreActive
                    ? 'bg-[#3a4efb] text-white shadow-[0_4px_14px_rgba(58,78,251,0.25)]'
                    : 'text-[#444656] hover:text-[#161a33]'
                }`}
              >
                Explore
              </button>
              <button
                onClick={() => onNavigate({ type: 'my-profile' })}
                className={`px-5 py-2 text-[14px] font-bold rounded-full transition-all cursor-pointer ${
                  isMyProfileActive
                    ? 'bg-[#3a4efb] text-white shadow-[0_4px_14px_rgba(58,78,251,0.25)]'
                    : 'text-[#444656] hover:text-[#161a33]'
                }`}
              >
                My Profile
              </button>
              <button
                onClick={() => onNavigate({ type: 'qr', profileId: session.profileId })}
                className={`px-5 py-2 text-[14px] font-bold rounded-full transition-all cursor-pointer ${
                  isQRActive
                    ? 'bg-[#3a4efb] text-white shadow-[0_4px_14px_rgba(58,78,251,0.25)]'
                    : 'text-[#444656] hover:text-[#161a33]'
                }`}
              >
                QR Badge
              </button>
            </>
          )}
        </nav>

        {/* Right side accreditation badge & avatar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#edecff] px-3 py-1.5 rounded-full border border-[#dee0ed]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4f029] shadow-[0_0_8px_#d4f029] animate-pulse"></span>
            <span className="text-[11px] font-bold text-[#576400] uppercase tracking-wider hidden sm:inline">
              Accredited
            </span>
          </div>

          {session ? (
            <button
              onClick={() => onNavigate({ type: 'my-profile' })}
              className="flex items-center gap-2 focus:outline-none cursor-pointer group"
              title="View My Profile"
            >
              {userPhotoUrl ? (
                <img
                  src={userPhotoUrl}
                  alt={session.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[#3a4efb]/30 group-hover:ring-[#3a4efb] transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#3a4efb] text-white font-bold text-[13px] flex items-center justify-center ring-2 ring-[#3a4efb]/20 group-hover:ring-[#3a4efb] transition-all">
                  {session.name.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={() => onNavigate({ type: 'create' })}
              className="md:hidden px-3.5 py-1.5 bg-[#d4f029] text-[#191e00] text-[12px] font-bold rounded-full shadow-sm"
            >
              Join
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar with Safe Area Support */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#ffffff]/95 backdrop-blur-lg border-t border-[#dee0ed] px-3 pt-2 pb-[max(env(safe-area-inset-bottom,0px),10px)] flex items-center justify-around shadow-lg">
        <button
          onClick={() => onNavigate({ type: 'home' })}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            currentView.type === 'home'
              ? 'text-[#152de4] font-bold bg-[#edecff]'
              : 'text-[#444656] hover:text-[#161a33]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => onNavigate({ type: 'explore' })}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            isExploreActive
              ? 'text-[#152de4] font-bold bg-[#edecff]'
              : 'text-[#444656] hover:text-[#161a33]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">explore</span>
          <span className="text-[10px]">Explore</span>
        </button>

        {session ? (
          <>
            <button
              onClick={() => onNavigate({ type: 'my-profile' })}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isMyProfileActive
                  ? 'text-[#152de4] font-bold bg-[#edecff]'
                  : 'text-[#444656] hover:text-[#161a33]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">badge</span>
              <span className="text-[10px]">My Profile</span>
            </button>
            <button
              onClick={() => onNavigate({ type: 'qr', profileId: session.profileId })}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isQRActive
                  ? 'text-[#152de4] font-bold bg-[#edecff]'
                  : 'text-[#444656] hover:text-[#161a33]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
              <span className="text-[10px]">QR Badge</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => onNavigate({ type: 'create' })}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              isCreateActive
                ? 'text-[#152de4] font-bold bg-[#edecff]'
                : 'text-[#444656] hover:text-[#161a33]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span className="text-[10px]">Create Profile</span>
          </button>
        )}
      </div>
    </header>
  );
};
