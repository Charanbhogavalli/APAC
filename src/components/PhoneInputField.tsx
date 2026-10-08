import React from 'react';
import { COUNTRY_DIAL_CODES } from '../utils/countryCodes';

interface PhoneInputFieldProps {
  label: string;
  iconName: string;
  iconColorClass?: string;
  dialCode: string;
  number: string;
  onDialCodeChange: (code: string) => void;
  onNumberChange: (num: string) => void;
  visibility: 'public' | 'private';
  onToggleVisibility: () => void;
  placeholder?: string;
  onCopyFromPhone?: () => void;
  showCopyFromPhone?: boolean;
}

export const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  label,
  iconName,
  iconColorClass = 'text-[#3a4efb]',
  dialCode,
  number,
  onDialCodeChange,
  onNumberChange,
  visibility,
  onToggleVisibility,
  placeholder = 'e.g. 771234567',
  onCopyFromPhone,
  showCopyFromPhone,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-[#fbf8ff] border border-[#dee0ed] transition-colors focus-within:border-[#3a4efb]">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[13px] font-bold text-[#161a33] flex items-center gap-2">
          <span className={`material-symbols-outlined text-[18px] ${iconColorClass}`}>
            {iconName}
          </span>
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-2">
          {showCopyFromPhone && onCopyFromPhone && (
            <button
              type="button"
              onClick={onCopyFromPhone}
              className="text-[11px] font-bold text-[#3a4efb] hover:text-[#152de4] px-2 py-0.5 rounded-full hover:bg-[#edecff] transition-colors cursor-pointer"
            >
              Same as Phone
            </button>
          )}

          <button
            type="button"
            onClick={onToggleVisibility}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase transition-colors cursor-pointer ${
              visibility === 'public'
                ? 'bg-[#d4f029] text-[#191e00]'
                : 'bg-[#444656] text-white'
            }`}
          >
            {visibility === 'public' ? 'Visible' : 'Private'}
          </button>
        </div>
      </div>

      {/* Country Code + Local Number Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Country Code Select */}
        <div className="relative w-full sm:w-44 flex-shrink-0">
          <select
            value={dialCode}
            onChange={(e) => onDialCodeChange(e.target.value)}
            className="w-full appearance-none px-3.5 py-3 sm:py-2.5 pr-8 rounded-xl border border-[#dee0ed] bg-white text-[#161a33] text-[15px] sm:text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#3a4efb] cursor-pointer"
          >
            {COUNTRY_DIAL_CODES.map((c, i) => (
              <option key={`${c.code}-${i}`} value={c.dialCode}>
                {c.dialCode} ({c.name})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[#444656]">
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
        </div>

        {/* Local Number Input */}
        <div className="flex-1 min-w-0">
          <input
            type="tel"
            value={number}
            onChange={(e) => onNumberChange(e.target.value.replace(/[^0-9\s-]/g, ''))}
            placeholder={placeholder}
            className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-[#dee0ed] bg-white text-[#161a33] text-[16px] sm:text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3a4efb]"
          />
        </div>
      </div>

      {number.trim() && (
        <div className="mt-1.5 text-[11px] text-[#444656] flex items-center gap-1">
          <span className="font-semibold text-[#152de4]">International format:</span>
          <span className="font-mono">{dialCode} {number.trim().replace(/^0+/, '')}</span>
        </div>
      )}
    </div>
  );
};
