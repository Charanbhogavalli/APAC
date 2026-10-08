import React, { useState, useEffect, useRef } from 'react';
import { Participant, ViewState, LocalSessionProfile } from '../types';
import { fetchParticipantById } from '../services/participantService';
import { getParticipantProfileUrl } from '../utils/url';
import QRCode from 'qrcode';

interface QRViewProps {
  session: LocalSessionProfile | null;
  targetProfileId?: string;
  onNavigate: (view: ViewState) => void;
}

export const QRView: React.FC<QRViewProps> = ({
  session,
  targetProfileId,
  onNavigate,
}) => {
  const profileIdToLoad = targetProfileId || session?.profileId;
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [profileUrl, setProfileUrl] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileIdToLoad) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchParticipantById(profileIdToLoad!);
        if (!isMounted) return;
        setParticipant(data);

        if (data) {
          const liveUrl = getParticipantProfileUrl(data.profileId);
          setProfileUrl(liveUrl);

          const qr = await QRCode.toDataURL(liveUrl, {
            width: 400,
            margin: 2,
            color: {
              dark: '#161a33',
              light: '#ffffff',
            },
          });
          if (isMounted) setQrDataUrl(qr);
        }
      } catch (err) {
        console.error('Failed to generate QR data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [profileIdToLoad]);

  const handleCopyLink = () => {
    if (!profileUrl) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl).then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      });
    }
  };

  const handleShareLink = () => {
    if (!participant || !profileUrl) return;
    if (navigator.share) {
      navigator
        .share({
          title: `${participant.name} | APAC Rural Connect 2026`,
          text: `Scan or connect with ${participant.name} (${participant.ideaName} • ${participant.organization}, ${participant.country})`,
          url: profileUrl,
        })
        .catch(() => handleCopyLink());
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl || !participant) return;
    setSaveStatus('SAVING PASS...');
    try {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = `APAC-Rural-Connect-${participant.name.replace(/\s+/g, '-')}-QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSaveStatus('QR SAVED!');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      console.error('Failed to download QR:', err);
      setSaveStatus(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-[#3a4efb] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[16px] font-semibold text-[#161a33]">Generating real QR badge...</p>
      </div>
    );
  }

  if (!profileIdToLoad || !participant) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#edecff] text-[#152de4] mx-auto flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">qr_code_2</span>
        </div>
        <h2 className="text-2xl font-bold text-[#161a33] mb-2">No Profile Created Yet</h2>
        <p className="text-[14px] text-[#444656] mb-6">
          Create your official conference profile to generate a verifiable digital QR code badge.
        </p>
        <button
          onClick={() => onNavigate({ type: 'create' })}
          className="px-8 py-3.5 bg-[#d4f029] text-[#191e00] font-bold text-[14px] rounded-full hover:scale-105 transition-all shadow-md cursor-pointer"
        >
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#2b2f49] via-[#152de4] to-[#2b2f49] py-12 sm:py-16 px-4 sm:px-6 flex items-center justify-center min-h-[calc(100vh-140px)]">
      {/* Ambient tech radial glowing blurs */}
      <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-[#3a4efb]/30 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-16 w-[30rem] h-[30rem] rounded-full bg-[#d4f029]/15 blur-[100px] pointer-events-none"></div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md mb-3 text-[#d4f029] border border-white/20">
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-white">
              Direct Exchange
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Share your profile.
          </h1>
          <p className="text-[14px] text-[#dee0ff] max-w-md mt-1 text-center">
            Let someone scan this QR code to instantly view your digital conference card on their phone.
          </p>
        </div>

        {/* Hero QR Card matching Stitch */}
        <div
          ref={cardRef}
          className="w-full bg-white rounded-3xl p-5 sm:p-10 shadow-2xl flex flex-col items-center text-center transition-all duration-300 border border-[#dee0ed]/40"
        >
          {/* Delegate Header */}
          <div className="flex items-center gap-3 mb-4 w-full justify-center text-left">
            {participant.photoUrl ? (
              <img
                src={participant.photoUrl}
                alt={participant.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-sm ring-2 ring-[#3a4efb]/20 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#edecff] text-[#152de4] font-extrabold text-xl sm:text-2xl flex items-center justify-center flex-shrink-0">
                {participant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-bold text-[#161a33] truncate">{participant.name}</span>
                <span className="material-symbols-outlined text-[#3a4efb] text-[18px]">verified</span>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#444656] truncate">
                {participant.ideaName} • {participant.organization}, {participant.country}
              </p>
            </div>
          </div>

          {/* QR Display Canvas Container with Subtle Electric Blue Corner Accents */}
          <div className="relative my-3 sm:my-4 p-3 sm:p-5 bg-[#fbf8ff] rounded-2xl shadow-inner flex items-center justify-center border border-[#dee0ed] max-w-full">
            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#3a4efb] rounded-tl-md"></div>
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#3a4efb] rounded-tr-md"></div>
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#3a4efb] rounded-bl-md"></div>
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#3a4efb] rounded-br-md"></div>

            {/* Crisp High-Density Real QR Code */}
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center bg-white p-3 rounded-xl shadow-xs">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${participant.name}`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>

          {/* Verified Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#edecff] mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4f029] shadow-[0_0_8px_#d4f029]"></span>
            <span className="text-[11px] font-extrabold text-[#161a33] uppercase tracking-wide">
              Verified Delegate • APAC Rural Connect 2026
            </span>
          </div>

          {/* Profile Direct URL */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-[#3a4efb] hover:text-[#152de4] text-[13px] font-bold cursor-pointer group mb-1"
          >
            <span className="material-symbols-outlined text-[16px]">link</span>
            <span className="truncate max-w-xs">{profileUrl}</span>
            {copiedToast && (
              <span className="text-[10px] bg-[#161a33] text-white px-2 py-0.5 rounded-full uppercase ml-1 animate-fade">
                Copied
              </span>
            )}
          </button>
        </div>

        {/* Action Buttons Block */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button
            onClick={handleDownloadQR}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#d4f029] text-[#191e00] font-bold text-[13px] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg"
          >
            <span className="material-symbols-outlined text-[20px]">
              {saveStatus ? 'check_circle' : 'download'}
            </span>
            <span>{saveStatus || 'SAVE QR CODE (.PNG)'}</span>
          </button>

          <button
            onClick={handleShareLink}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-[#161a33] font-bold text-[13px] hover:bg-[#f4f2ff] active:scale-95 transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            <span>SHARE PROFILE LINK</span>
          </button>
        </div>

        {/* Fast Offline Mode Indicator */}
        <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-[12px] text-white border border-white/10">
          <span className="material-symbols-outlined text-[#d4f029] text-[18px]">wifi_tethering</span>
          <span>Fast Offline Mode — works without venue Wi-Fi</span>
        </div>
      </div>
    </div>
  );
};
