import React, { useState, useEffect } from 'react';
import { Participant, ViewState } from '../types';
import { fetchParticipantById } from '../services/participantService';
import { getParticipantProfileUrl } from '../utils/url';
import QRCode from 'qrcode';

interface ParticipantProfileViewProps {
  profileId: string;
  onNavigate: (view: ViewState) => void;
  currentSessionProfileId?: string;
}

export const ParticipantProfileView: React.FC<ParticipantProfileViewProps> = ({
  profileId,
  onNavigate,
  currentSessionProfileId,
}) => {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const isOwnProfile = currentSessionProfileId === profileId;

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchParticipantById(profileId);
        if (!isMounted) return;
        setParticipant(data);

        if (data) {
          // Generate QR code for this real profile URL
          const publicUrl = getParticipantProfileUrl(data.profileId);
          const qr = await QRCode.toDataURL(publicUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#161a33',
              light: '#ffffff',
            },
          });
          if (isMounted) setQrDataUrl(qr);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching participant:', err);
        setError('Unable to load participant profile.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [profileId]);

  const handleCopyLink = () => {
    const url = getParticipantProfileUrl(profileId);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-[#3a4efb] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[16px] font-semibold text-[#161a33]">Loading participant profile...</p>
      </div>
    );
  }

  // Not found or error state
  if (error || !participant) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] mx-auto flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">person_off</span>
        </div>
        <h2 className="text-2xl font-bold text-[#161a33] mb-2">Profile not found</h2>
        <p className="text-[14px] text-[#444656] mb-6">
          The requested delegate profile does not exist or may have been updated.
        </p>
        <button
          onClick={() => onNavigate({ type: 'explore' })}
          className="px-6 py-3 rounded-full bg-[#3a4efb] text-white font-bold text-[14px] hover:bg-[#152de4] transition-all cursor-pointer shadow-md"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  // Determine which contact methods can be displayed
  // If isOwnProfile, all entered methods are visible. Otherwise, only public ones.
  const canShowPhone = Boolean(participant.phone && (isOwnProfile || participant.visibility?.phone === 'public'));
  const canShowWhatsapp = Boolean(participant.whatsapp && (isOwnProfile || participant.visibility?.whatsapp === 'public'));
  const canShowEmail = Boolean(participant.email && (isOwnProfile || participant.visibility?.email === 'public'));
  const canShowLinkedin = Boolean(participant.linkedin && (isOwnProfile || participant.visibility?.linkedin === 'public'));
  const canShowWebsite = Boolean(participant.website && (isOwnProfile || participant.visibility?.website === 'public'));
  const canShowInstagram = Boolean(participant.instagram && (isOwnProfile || participant.visibility?.instagram === 'public'));

  const hasAnyContact =
    canShowPhone || canShowWhatsapp || canShowEmail || canShowLinkedin || canShowWebsite || canShowInstagram;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-6 pb-20">
        {/* Breadcrumb Nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate({ type: 'explore' })}
            className="inline-flex items-center gap-1.5 text-[#152de4] font-bold text-[14px] hover:text-[#3a4efb] transition-transform duration-200 hover:-translate-x-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Explore</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-[#444656] text-[13px]">
            <span>Delegates</span>
            <span>/</span>
            <span className="text-[#161a33] font-bold">{participant.name}</span>
          </div>
        </div>

        {/* Header Bento Card */}
        <div className="relative w-full rounded-3xl overflow-hidden bg-white shadow-xl mb-10 border border-[#dee0ed]/60">
          {/* Top Banner Gradient */}
          <div className="relative h-48 sm:h-64 w-full bg-gradient-to-r from-[#152de4] via-[#3a4efb] to-[#006aaa] overflow-hidden">
            {/* Ambient Glows */}
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#d4f029]/25 blur-3xl pointer-events-none"></div>
            <div className="absolute left-1/4 -bottom-20 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

            {/* Badge */}
            <div className="absolute top-5 right-5 sm:top-6 sm:right-6 flex items-center gap-2 bg-[#2b2f49]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4f029] animate-pulse"></span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#d4f029]">
                Accredited Delegate
              </span>
            </div>
          </div>

          {/* Profile Banner Overlap */}
          <div className="px-4 sm:px-10 lg:px-12 pb-8 sm:pb-10 pt-0 relative bg-white">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 -mt-16 sm:-mt-24">
              {/* Avatar + Core Identity */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-2xl bg-white p-1.5 bg-gradient-to-tr from-[#152de4] to-[#d4f029]">
                    {participant.photoUrl ? (
                      <img
                        src={participant.photoUrl}
                        alt={participant.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-[#edecff] text-[#152de4] font-extrabold text-4xl sm:text-5xl flex items-center justify-center">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-[#d4f029] text-[#191e00] p-1.5 rounded-xl shadow-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                  </div>
                </div>

                {/* Name and Affiliation Block */}
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 bg-[#edecff] px-3 py-1 rounded-full text-[11px] font-extrabold text-[#152de4] uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[14px]">public</span>
                      {participant.country}
                    </span>
                    <span className="bg-[#3a4efb]/10 text-[#3a4efb] px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase">
                      {participant.role}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#161a33] tracking-tight leading-tight mb-1">
                    {participant.name}
                  </h1>
                  <p className="text-[16px] text-[#444656] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#152de4]">account_balance</span>
                    <span>{participant.organization}</span>
                  </p>
                </div>
              </div>

              {/* Fast Spec Badges Strip */}
              <div className="flex items-center gap-3 self-start lg:self-end pt-2 lg:pt-0">
                <div className="bg-[#f4f2ff] px-4 py-2.5 rounded-2xl flex flex-col">
                  <span className="text-[10px] font-extrabold text-[#444656] uppercase">Innovation</span>
                  <span className="text-[16px] font-bold text-[#152de4] truncate max-w-[200px]">
                    {participant.ideaName}
                  </span>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => onNavigate({ type: 'my-profile' })}
                    className="px-4 py-3 rounded-2xl bg-[#d4f029] text-[#191e00] font-bold text-[13px] flex items-center gap-1.5 shadow-sm hover:scale-105 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Narrative & Intellectual Contribution */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Bio Card (only if exists) */}
            {participant.bio && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#dee0ed]/60">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#152de4] text-[22px]">id_card</span>
                    <h2 className="text-xl font-bold text-[#161a33]">About {participant.name}</h2>
                  </div>
                  <span className="text-[#444656] text-[10px] font-extrabold tracking-widest uppercase">
                    Delegate Brief
                  </span>
                </div>
                <p className="text-[15px] text-[#161a33] leading-relaxed whitespace-pre-wrap">
                  {participant.bio}
                </p>
              </div>
            )}

            {/* Innovation Summary Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#dee0ed]/60">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#3a4efb] text-[22px]">lightbulb</span>
                <h2 className="text-xl font-bold text-[#161a33]">Rural Innovation</h2>
              </div>
              <div className="p-4 rounded-2xl bg-[#f4f2ff] border border-[#dee0ed]">
                <h3 className="text-[17px] font-bold text-[#152de4] mb-1">
                  {participant.ideaName}
                </h3>
                <p className="text-[13px] text-[#444656]">
                  Presented by {participant.name} ({participant.role}) at {participant.organization}, {participant.country}.
                </p>
              </div>
            </div>

            {/* Expertise Badges (only if exists) */}
            {participant.expertise && participant.expertise.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#dee0ed]/60">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#152de4] text-[22px]">psychology</span>
                  <h2 className="text-xl font-bold text-[#161a33]">Focus Areas &amp; Expertise</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {participant.expertise.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-[#f4f2ff] text-[#152de4] px-4 py-2 rounded-full text-[13px] font-bold border border-[#dee0ed]"
                    >
                      <span className="material-symbols-outlined text-[16px]">tag</span>
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Direct Reach & Digital Identity */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Direct Contact Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#dee0ed]/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#152de4] text-[22px]">contact_mail</span>
                  <h2 className="text-xl font-bold text-[#161a33]">Direct Contact</h2>
                </div>
                <span className="text-[#576400] text-[10px] font-extrabold uppercase bg-[#d4f029]/30 px-2 py-0.5 rounded-full">
                  Verified Hub
                </span>
              </div>

              {hasAnyContact ? (
                <div className="flex flex-col gap-3">
                  {canShowEmail && participant.email && (
                    <a
                      href={`mailto:${participant.email}`}
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f2ff] hover:bg-[#edecff] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white text-[#152de4] flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-[20px]">mail</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-extrabold text-[#444656] uppercase">Email</span>
                          <span className="text-[13px] font-bold text-[#161a33] truncate">
                            {participant.email}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#444656] group-hover:text-[#152de4] text-[18px]">
                        arrow_outward
                      </span>
                    </a>
                  )}

                  {canShowWhatsapp && participant.whatsapp && (
                    <a
                      href={`https://wa.me/${participant.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f2ff] hover:bg-[#edecff] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white text-[#576400] flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-[20px]">chat</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-extrabold text-[#444656] uppercase">WhatsApp</span>
                          <span className="text-[13px] font-bold text-[#161a33] truncate">
                            {participant.whatsapp}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#444656] group-hover:text-[#576400] text-[18px]">
                        arrow_outward
                      </span>
                    </a>
                  )}

                  {canShowPhone && participant.phone && (
                    <a
                      href={`tel:${participant.phone.replace(/[^0-9+]/g, '')}`}
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f2ff] hover:bg-[#edecff] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white text-[#152de4] flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-[20px]">call</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-extrabold text-[#444656] uppercase">Phone</span>
                          <span className="text-[13px] font-bold text-[#161a33] truncate">
                            {participant.phone}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#444656] group-hover:text-[#152de4] text-[18px]">
                        arrow_outward
                      </span>
                    </a>
                  )}

                  {canShowLinkedin && participant.linkedin && (
                    <a
                      href={participant.linkedin.startsWith('http') ? participant.linkedin : `https://${participant.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f2ff] hover:bg-[#edecff] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white text-[#005184] flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-[20px]">work</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-extrabold text-[#444656] uppercase">LinkedIn</span>
                          <span className="text-[13px] font-bold text-[#161a33] truncate">
                            {participant.linkedin}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#444656] group-hover:text-[#005184] text-[18px]">
                        arrow_outward
                      </span>
                    </a>
                  )}

                  {canShowWebsite && participant.website && (
                    <a
                      href={participant.website.startsWith('http') ? participant.website : `https://${participant.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f2ff] hover:bg-[#edecff] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white text-[#152de4] flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-[20px]">language</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-extrabold text-[#444656] uppercase">Website</span>
                          <span className="text-[13px] font-bold text-[#161a33] truncate">
                            {participant.website}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#444656] group-hover:text-[#152de4] text-[18px]">
                        arrow_outward
                      </span>
                    </a>
                  )}

                  {canShowInstagram && participant.instagram && (
                    <a
                      href={participant.instagram.startsWith('http') ? participant.instagram : `https://instagram.com/${participant.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f2ff] hover:bg-[#edecff] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white text-[#3a4efb] flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-extrabold text-[#444656] uppercase">Instagram</span>
                          <span className="text-[13px] font-bold text-[#161a33] truncate">
                            {participant.instagram}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#444656] group-hover:text-[#3a4efb] text-[18px]">
                        arrow_outward
                      </span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#fbf8ff] border border-[#dee0ed] text-center text-[13px] text-[#444656]">
                  Contact details are private or have not been provided by this delegate.
                </div>
              )}
            </div>

            {/* Quick QR Digital Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#dee0ed]/60 text-center flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#152de4]/10 text-[#152de4] mb-3">
                <span className="material-symbols-outlined text-[26px]">qr_code_scanner</span>
              </div>
              <h3 className="text-xl font-bold text-[#161a33] mb-1">Digital Badge &amp; QR</h3>
              <p className="text-[13px] text-[#444656] mb-5 max-w-xs">
                Scan to open {participant.name}&apos;s verified conference profile on any mobile device.
              </p>

              {qrDataUrl && (
                <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-[#dee0ed] mb-6">
                  <img src={qrDataUrl} alt="Participant Profile QR" className="w-44 h-44 object-contain" />
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="w-full py-3.5 px-6 rounded-full bg-[#d4f029] text-[#191e00] font-bold text-[14px] shadow-md hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
                <span>VIEW / SHARE QR</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Share Dialog Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2b2f49]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl relative text-center border border-[#dee0ed]">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-5 right-5 text-[#444656] hover:text-[#161a33] w-10 h-10 rounded-full bg-[#f4f2ff] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#d4f029] text-[#191e00] mx-auto flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[30px]">qr_code_2</span>
            </div>
            <h3 className="text-xl font-bold text-[#161a33] mb-0.5">{participant.name}</h3>
            <p className="text-[13px] text-[#444656] mb-5">
              {participant.ideaName} • {participant.country}
            </p>

            {qrDataUrl && (
              <div className="bg-[#f4f2ff] p-4 rounded-2xl mb-6 flex justify-center">
                <img src={qrDataUrl} alt="Delegate QR" className="w-48 h-48 object-contain rounded-xl" />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-3 px-4 rounded-full bg-[#f4f2ff] text-[13px] font-bold text-[#161a33] hover:bg-[#edecff] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                <span>{copyFeedback ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-full bg-[#3a4efb] text-white text-[13px] font-bold hover:bg-[#152de4] transition-colors flex items-center justify-center cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
