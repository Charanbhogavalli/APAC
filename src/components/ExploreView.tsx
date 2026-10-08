import React, { useState, useMemo } from 'react';
import { Participant, ViewState } from '../types';

interface ExploreViewProps {
  participants: Participant[];
  isLoading: boolean;
  error: string | null;
  onNavigate: (view: ViewState) => void;
  onRetry: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  participants,
  isLoading,
  error,
  onNavigate,
  onRetry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<'all' | 'country' | 'organization' | 'expertise'>('all');
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>('');

  // Extract unique filter values from real participants safely
  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(participants.map((p) => (p.country || '').trim()).filter(Boolean))).sort();
  }, [participants]);

  const uniqueOrgs = useMemo(() => {
    return Array.from(new Set(participants.map((p) => (p.organization || '').trim()).filter(Boolean))).sort();
  }, [participants]);

  const uniqueExpertise = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (Array.isArray(p.expertise)) {
        p.expertise.forEach((exp) => {
          if (exp && typeof exp === 'string' && exp.trim()) {
            set.add(exp.trim());
          }
        });
      }
    });
    return Array.from(set).sort();
  }, [participants]);

  // Real filtered data with null-safe string comparisons
  const filteredParticipants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return participants.filter((p) => {
      // 1. Text Search matching Name, Idea Name, Organization, or Expertise
      const nameMatch = (p.name || '').toLowerCase().includes(term);
      const ideaMatch = (p.ideaName || '').toLowerCase().includes(term);
      const orgMatch = (p.organization || '').toLowerCase().includes(term);
      const countryMatch = (p.country || '').toLowerCase().includes(term);
      const roleMatch = (p.role || '').toLowerCase().includes(term);
      const expMatch = Array.isArray(p.expertise) && p.expertise.some((e) => (e || '').toLowerCase().includes(term));

      const matchesSearch = !term || nameMatch || ideaMatch || orgMatch || countryMatch || roleMatch || expMatch;

      if (!matchesSearch) return false;

      // 2. Specific filter selection
      if (selectedFilterCategory === 'country' && selectedFilterValue) {
        if ((p.country || '').toLowerCase() !== selectedFilterValue.toLowerCase()) return false;
      } else if (selectedFilterCategory === 'organization' && selectedFilterValue) {
        if ((p.organization || '').toLowerCase() !== selectedFilterValue.toLowerCase()) return false;
      } else if (selectedFilterCategory === 'expertise' && selectedFilterValue) {
        if (!Array.isArray(p.expertise) || !p.expertise.some((e) => (e || '').toLowerCase() === selectedFilterValue.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [participants, searchTerm, selectedFilterCategory, selectedFilterValue]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFilterCategory('all');
    setSelectedFilterValue('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
      {/* Hero / Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#edecff] mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#d4f029]"></span>
            <span className="text-[11px] font-extrabold text-[#444656] uppercase tracking-wider">
              Official Delegation Directory • {participants.length} Registered
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#161a33] tracking-tight mb-2">
            Explore participants.
          </h1>
          <p className="text-[16px] text-[#444656]">
            Discover fellow delegates, innovations, and organizations at APAC Rural Connect 2026.
          </p>
        </div>

        {/* Real Metrics Counter */}
        {participants.length > 0 && (
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#dee0ed]/60">
            <div className="flex flex-col pr-4">
              <span className="text-2xl font-extrabold text-[#3a4efb] leading-none">
                {uniqueCountries.length}
              </span>
              <span className="text-[10px] font-bold text-[#444656] uppercase mt-1">Nations</span>
            </div>
            <div className="w-px h-8 bg-[#dee0ed]"></div>
            <div className="flex flex-col px-4">
              <span className="text-2xl font-extrabold text-[#161a33] leading-none">
                {participants.length}
              </span>
              <span className="text-[10px] font-bold text-[#444656] uppercase mt-1">Delegates</span>
            </div>
            <div className="w-px h-8 bg-[#dee0ed]"></div>
            <div className="flex flex-col pl-4">
              <span className="text-2xl font-extrabold text-[#576400] leading-none">
                100%
              </span>
              <span className="text-[10px] font-bold text-[#444656] uppercase mt-1">Verified</span>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 border-4 border-[#3a4efb] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[15px] font-semibold text-[#161a33]">Loading delegate directory...</p>
          <p className="text-[13px] text-[#444656]">Retrieving real conference participants from database.</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl p-8 border border-[#ffdad6] shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] mb-4">
            <span className="material-symbols-outlined text-[32px]">error</span>
          </div>
          <h3 className="text-xl font-bold text-[#161a33] mb-2">Unable to load participants</h3>
          <p className="text-[14px] text-[#444656] max-w-md mb-6">{error}</p>
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-full bg-[#3a4efb] text-white font-bold text-[13px] hover:bg-[#152de4] transition-all cursor-pointer shadow-md"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Search & Filter Controls (When loaded) */}
      {!isLoading && !error && (
        <div className="flex flex-col gap-4 mb-8">
          {/* Search Input Bar */}
          <div className="relative w-full shadow-sm rounded-full bg-white border border-[#dee0ed]/80">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#444656]">
              <span className="material-symbols-outlined text-[24px]">search</span>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search people, ideas, organizations or expertise"
              className="w-full pl-14 pr-24 py-4 rounded-full bg-transparent text-[15px] text-[#161a33] placeholder:text-[#757688] focus:outline-none focus:ring-2 focus:ring-[#3a4efb] transition-all"
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-1 rounded-full bg-[#f4f2ff] hover:bg-[#edecff] text-[#444656] text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Filter Chips Bar */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => {
                setSelectedFilterCategory('all');
                setSelectedFilterValue('');
              }}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all cursor-pointer shadow-xs ${
                selectedFilterCategory === 'all'
                  ? 'bg-[#3a4efb] text-white shadow-[0_4px_14px_rgba(58,78,251,0.25)]'
                  : 'bg-white text-[#444656] hover:text-[#161a33] hover:bg-[#f4f2ff] border border-[#dee0ed]'
              }`}
            >
              All
            </button>

            {uniqueCountries.length > 0 && (
              <button
                onClick={() => {
                  setSelectedFilterCategory('country');
                  if (!selectedFilterValue && uniqueCountries.length > 0) {
                    setSelectedFilterValue(uniqueCountries[0]);
                  }
                }}
                className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all cursor-pointer shadow-xs ${
                  selectedFilterCategory === 'country'
                    ? 'bg-[#3a4efb] text-white shadow-[0_4px_14px_rgba(58,78,251,0.25)]'
                    : 'bg-white text-[#444656] hover:text-[#161a33] hover:bg-[#f4f2ff] border border-[#dee0ed]'
                }`}
              >
                Country
              </button>
            )}

            {uniqueOrgs.length > 0 && (
              <button
                onClick={() => {
                  setSelectedFilterCategory('organization');
                  if (!selectedFilterValue && uniqueOrgs.length > 0) {
                    setSelectedFilterValue(uniqueOrgs[0]);
                  }
                }}
                className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all cursor-pointer shadow-xs ${
                  selectedFilterCategory === 'organization'
                    ? 'bg-[#3a4efb] text-white shadow-[0_4px_14px_rgba(58,78,251,0.25)]'
                    : 'bg-white text-[#444656] hover:text-[#161a33] hover:bg-[#f4f2ff] border border-[#dee0ed]'
                }`}
              >
                Organization
              </button>
            )}

            {uniqueExpertise.length > 0 && (
              <button
                onClick={() => {
                  setSelectedFilterCategory('expertise');
                  if (!selectedFilterValue && uniqueExpertise.length > 0) {
                    setSelectedFilterValue(uniqueExpertise[0]);
                  }
                }}
                className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all cursor-pointer shadow-xs ${
                  selectedFilterCategory === 'expertise'
                    ? 'bg-[#3a4efb] text-white shadow-[0_4px_14px_rgba(58,78,251,0.25)]'
                    : 'bg-white text-[#444656] hover:text-[#161a33] hover:bg-[#f4f2ff] border border-[#dee0ed]'
                }`}
              >
                Expertise
              </button>
            )}
          </div>

          {/* Sub-Filters based on active category */}
          {selectedFilterCategory === 'country' && uniqueCountries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-[#f4f2ff] rounded-2xl">
              <span className="text-[12px] font-bold text-[#444656] px-2">Select Country:</span>
              {uniqueCountries.map((country) => (
                <button
                  key={country}
                  onClick={() => setSelectedFilterValue(country)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                    selectedFilterValue === country
                      ? 'bg-[#152de4] text-white'
                      : 'bg-white text-[#161a33] hover:bg-[#edecff]'
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>
          )}

          {selectedFilterCategory === 'organization' && uniqueOrgs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-[#f4f2ff] rounded-2xl">
              <span className="text-[12px] font-bold text-[#444656] px-2">Select Organization:</span>
              {uniqueOrgs.map((org) => (
                <button
                  key={org}
                  onClick={() => setSelectedFilterValue(org)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer truncate max-w-xs ${
                    selectedFilterValue === org
                      ? 'bg-[#152de4] text-white'
                      : 'bg-white text-[#161a33] hover:bg-[#edecff]'
                  }`}
                >
                  {org}
                </button>
              ))}
            </div>
          )}

          {selectedFilterCategory === 'expertise' && uniqueExpertise.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-[#f4f2ff] rounded-2xl">
              <span className="text-[12px] font-bold text-[#444656] px-2">Filter By Expertise:</span>
              {uniqueExpertise.map((exp) => (
                <button
                  key={exp}
                  onClick={() => setSelectedFilterValue(exp)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                    selectedFilterValue === exp
                      ? 'bg-[#152de4] text-white'
                      : 'bg-white text-[#161a33] hover:bg-[#edecff]'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Participants Directory Grid */}
      {!isLoading && !error && (
        <>
          {participants.length === 0 ? (
            /* Official Empty State: Zero participants in the database */
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl p-8 border border-[#dee0ed] shadow-sm my-6">
              <div className="w-16 h-16 rounded-2xl bg-[#edecff] flex items-center justify-center text-[#152de4] mb-4">
                <span className="material-symbols-outlined text-[32px]">groups</span>
              </div>
              <h3 className="text-2xl font-bold text-[#161a33] mb-2">No participants yet</h3>
              <p className="text-[15px] text-[#444656] max-w-md mb-6 leading-relaxed">
                Participant profiles will appear here as conference participants join.
              </p>
              <button
                onClick={() => onNavigate({ type: 'create' })}
                className="px-8 py-3.5 rounded-full bg-[#d4f029] text-[#191e00] text-[14px] font-bold hover:scale-105 transition-all shadow-md cursor-pointer"
              >
                Create My Profile
              </button>
            </div>
          ) : filteredParticipants.length === 0 ? (
            /* Search / Filter Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl p-8 border border-[#dee0ed] shadow-sm my-6">
              <div className="w-16 h-16 rounded-full bg-[#f4f2ff] flex items-center justify-center text-[#3a4efb] mb-4">
                <span className="material-symbols-outlined text-[32px]">manage_search</span>
              </div>
              <h3 className="text-xl font-bold text-[#161a33] mb-2">No matching participants found</h3>
              <p className="text-[14px] text-[#444656] max-w-md mb-6">
                Try adjusting your search keywords or clearing filters to see all accredited delegates.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 rounded-full bg-[#d4f029] text-[#191e00] font-bold text-[13px] hover:scale-105 transition-all shadow-md cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Grid of Real Participants */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredParticipants.map((p) => (
                <div
                  key={p.profileId}
                  className="participant-card flex flex-col justify-between bg-white rounded-2xl p-6 shadow-[0_8px_24px_-4px_rgba(37,41,67,0.05),0_2px_6px_-1px_rgba(37,41,67,0.03)] hover:shadow-[0_16px_36px_-6px_rgba(58,78,251,0.14),0_4px_12px_-2px_rgba(37,41,67,0.04)] transition-all duration-300 transform hover:-translate-y-1 border border-[#dee0ed]/40"
                >
                  <div>
                    {/* Header: Photo & Innovation Pill */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="relative">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            className="w-16 h-16 rounded-2xl object-cover shadow-sm ring-2 ring-[#edecff]"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-[#edecff] text-[#152de4] font-extrabold text-2xl flex items-center justify-center ring-2 ring-[#dee0ed]">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#d4f029] flex items-center justify-center shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#191e00]"></span>
                        </span>
                      </div>

                      <div className="flex flex-col items-end text-right">
                        <span className="px-3 py-1 rounded-full bg-[#3a4efb] text-white text-[11px] font-extrabold tracking-wide shadow-sm truncate max-w-[140px]">
                          {p.ideaName}
                        </span>
                        <span className="text-[10px] font-bold text-[#444656] uppercase mt-1">
                          {p.country}
                        </span>
                      </div>
                    </div>

                    {/* Delegate Meta */}
                    <h2 className="text-[20px] font-bold text-[#161a33] tracking-tight mb-1 truncate">
                      {p.name}
                    </h2>
                    <p className="text-[13px] text-[#3a4efb] font-semibold mb-2 truncate">
                      {p.role}
                    </p>
                    <div className="flex items-center gap-1.5 text-[#444656] text-[13px] mb-4">
                      <span className="material-symbols-outlined text-[16px] text-[#005184]">domain</span>
                      <span className="truncate">{p.organization}</span>
                    </div>

                    {/* Expertise Tags */}
                    {p.expertise && p.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {p.expertise.slice(0, 3).map((exp, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full bg-[#f4f2ff] text-[#3a4efb] text-[11px] font-semibold"
                          >
                            {exp}
                          </span>
                        ))}
                        {p.expertise.length > 3 && (
                          <span className="px-2 py-1 rounded-full bg-[#f4f2ff] text-[#444656] text-[11px]">
                            +{p.expertise.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <button
                    onClick={() => onNavigate({ type: 'participant', profileId: p.profileId })}
                    className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-[#f4f2ff] hover:bg-[#d4f029] text-[#161a33] transition-all group text-[13px] font-bold cursor-pointer"
                  >
                    <span>View Profile</span>
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
