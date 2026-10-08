import React from 'react';
import { Participant, ViewState } from '../types';

interface HomeHeroProps {
  participants: Participant[];
  onNavigate: (view: ViewState) => void;
  hasProfile: boolean;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  participants,
  onNavigate,
  hasProfile,
}) => {
  // Derive real statistics only
  const totalCount = participants.length;
  const uniqueCountries = new Set(participants.map((p) => p.country.trim()).filter(Boolean)).size;
  const uniqueIdeas = new Set(participants.map((p) => p.ideaName.trim()).filter(Boolean)).size;

  // Real preview participants (up to 3)
  const featuredParticipants = participants.slice(0, 3);

  return (
    <div className="flex flex-col w-full">
      {/* Top Hero & Card Mosaic Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#3a4efb] via-[#152de4] to-[#006aaa] text-white px-6 lg:px-12 py-12 lg:py-20 rounded-b-3xl shadow-2xl">
        {/* Ambient Backdrop Micro-glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#d4f029]/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-[#dee0ff]/15 blur-2xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 flex flex-col items-start gap-5 text-left">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4f029] animate-pulse"></span>
              <span className="text-[11px] font-extrabold text-[#d4f029] uppercase tracking-wider">
                Sri Lanka 2026 • Official Directory
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-white tracking-tight leading-[1.1]">
                Meet the people shaping rural development.
              </h1>
              <p className="text-[17px] text-[#e2e3ff] max-w-lg mt-2 leading-relaxed">
                APAC Rural Connect is the official digital participant directory for the Asia-Pacific Conference on Innovations in Rural Development.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-3">
              {!hasProfile ? (
                <button
                  onClick={() => onNavigate({ type: 'create' })}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#d4f029] text-[#191e00] font-bold text-[14px] rounded-full shadow-[0_12px_28px_rgba(212,240,41,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <span>CREATE MY PROFILE</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigate({ type: 'my-profile' })}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#d4f029] text-[#191e00] font-bold text-[14px] rounded-full shadow-[0_12px_28px_rgba(212,240,41,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <span>VIEW MY PROFILE</span>
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                </button>
              )}

              <button
                onClick={() => onNavigate({ type: 'explore' })}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#161a33] font-bold text-[14px] rounded-full shadow-md hover:bg-[#f4f2ff] transition-all duration-200 cursor-pointer"
              >
                <span>EXPLORE PARTICIPANTS</span>
                <span className="material-symbols-outlined text-[18px]">explore</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 text-[#e2e3ff] text-[13px]">
              <span className="material-symbols-outlined text-[#d4f029] text-[18px]">verified</span>
              <span>People. Ideas. Connections.</span>
            </div>
          </div>

          {/* Right Column: Real Delegate Showcase or Clean Launch State */}
          <div className="lg:col-span-6 relative w-full flex items-center justify-center">
            {featuredParticipants.length > 0 ? (
              <div className="w-full flex flex-col gap-4">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#d4f029] px-2 flex items-center justify-between">
                  <span>Recently Joined Delegates</span>
                  <button
                    onClick={() => onNavigate({ type: 'explore' })}
                    className="text-white hover:underline text-[12px] lowercase tracking-normal flex items-center gap-1 cursor-pointer"
                  >
                    <span>view all</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
                {featuredParticipants.map((p) => (
                  <div
                    key={p.profileId}
                    onClick={() => onNavigate({ type: 'participant', profileId: p.profileId })}
                    className="bg-white text-[#161a33] rounded-2xl p-5 shadow-xl hover:-translate-y-1 transition-transform duration-200 cursor-pointer flex items-center justify-between gap-4 border border-[#dee0ed]/40"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-[#edecff] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[#edecff] text-[#152de4] font-extrabold text-xl flex items-center justify-center flex-shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[17px] font-bold text-[#161a33] truncate">{p.name}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f4f2ff] text-[#152de4] uppercase flex-shrink-0">
                            {p.country}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#3a4efb] font-medium truncate flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                          <span>{p.ideaName}</span>
                        </p>
                        <p className="text-[12px] text-[#444656] truncate mt-0.5">
                          {p.role} • {p.organization}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#444656] text-[20px] flex-shrink-0">
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Clean, intentional official state when 0 participants in Firestore */
              <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-[#d4f029]/20 text-[#d4f029] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[32px]">badge</span>
                </div>
                <span className="text-[12px] font-bold uppercase tracking-widest text-[#d4f029] mb-1">
                  Accreditation Open
                </span>
                <h3 className="text-2xl font-bold text-white mb-2">Be the first to join</h3>
                <p className="text-[14px] text-[#e2e3ff] max-w-sm mb-6 leading-relaxed">
                  Join the official delegate directory for the Asia-Pacific Conference on Innovations in Rural Development.
                </p>
                <button
                  onClick={() => onNavigate({ type: 'create' })}
                  className="px-6 py-3 bg-[#d4f029] text-[#191e00] font-bold text-[13px] rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  Create Participant Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Real Statistics Banner (Only rendered when real data exists) */}
      {totalCount > 0 && (
        <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 -mt-8 relative z-30">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-around gap-6 text-center md:text-left border border-[#dee0ed]/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#f4f2ff] flex items-center justify-center text-[#152de4]">
                <span className="material-symbols-outlined text-2xl">badge</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-[#161a33]">{totalCount}</span>
                <p className="text-[12px] text-[#444656] uppercase tracking-wider font-semibold">
                  Accredited Delegates
                </p>
              </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-[#dee0ed]"></div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#f4f2ff] flex items-center justify-center text-[#152de4]">
                <span className="material-symbols-outlined text-2xl">public</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-[#161a33]">{uniqueCountries}</span>
                <p className="text-[12px] text-[#444656] uppercase tracking-wider font-semibold">
                  Participating Nations
                </p>
              </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-[#dee0ed]"></div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#f4f2ff] flex items-center justify-center text-[#152de4]">
                <span className="material-symbols-outlined text-2xl">rocket_launch</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-[#161a33]">{uniqueIdeas}</span>
                <p className="text-[12px] text-[#444656] uppercase tracking-wider font-semibold">
                  Rural Innovations
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Conference Architecture Bento Grid Section */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-[11px] font-extrabold text-[#152de4] uppercase tracking-widest">
              Summit Digital Platform
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#161a33] mt-1">
              Directory Purpose &amp; Channels
            </h2>
          </div>
          <p className="text-[14px] text-[#444656] max-w-md">
            Connecting leaders, researchers, and agritech creators gathered under the auspices of the Asia-Pacific Conference on Innovations in Rural Development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#dee0ed]/60 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#edecff] flex items-center justify-center text-[#152de4]">
                <span className="material-symbols-outlined text-2xl">hub</span>
              </div>
              <span className="text-[11px] font-extrabold text-[#444656] uppercase">01 / DISCOVERY</span>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#161a33] mb-2">Directory of Innovators</h3>
              <p className="text-[14px] text-[#444656] leading-relaxed">
                Explore real delegates, community-led initiatives, and regional rural development projects participating in the summit.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#dee0ed]/60 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#edecff] flex items-center justify-center text-[#152de4]">
                <span className="material-symbols-outlined text-2xl">handshake</span>
              </div>
              <span className="text-[11px] font-extrabold text-[#444656] uppercase">02 / CONNECTIONS</span>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#161a33] mb-2">Verified Contact Exchange</h3>
              <p className="text-[14px] text-[#444656] leading-relaxed">
                Connect directly for research collaboration and bilateral trials with granular privacy controls over contact details.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#dee0ed]/60 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#edecff] flex items-center justify-center text-[#152de4]">
                <span className="material-symbols-outlined text-2xl">qr_code_2</span>
              </div>
              <span className="text-[11px] font-extrabold text-[#444656] uppercase">03 / VERIFICATION</span>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#161a33] mb-2">Digital Delegation QR</h3>
              <p className="text-[14px] text-[#444656] leading-relaxed">
                Instantly generate and share your digital conference credential badge to allow other attendees to scan and save your contact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Strip */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 pb-16">
        <div className="bg-[#2b2f49] text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-[11px] font-extrabold text-[#d4f029] uppercase tracking-wider">
              Asia-Pacific Conference on Innovations in Rural Development
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Ready to create your profile?
            </h2>
            <p className="text-[14px] text-[#c5c5d9] max-w-xl">
              Publish your professional profile to the digital delegate roster and receive your official conference QR code.
            </p>
          </div>
          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
            <button
              onClick={() => onNavigate({ type: 'create' })}
              className="w-full md:w-auto px-8 py-4 bg-[#d4f029] text-[#191e00] font-bold text-[14px] rounded-full text-center hover:scale-[1.02] transition-transform cursor-pointer shadow-lg"
            >
              CREATE MY PROFILE
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
