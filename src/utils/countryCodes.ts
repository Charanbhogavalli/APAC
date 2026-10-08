export interface CountryDialCode {
  name: string;
  code: string;
  dialCode: string;
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { name: 'Sri Lanka (Host)', code: 'LK', dialCode: '+94' },
  { name: 'India', code: 'IN', dialCode: '+91' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92' },
  { name: 'Nepal', code: 'NP', dialCode: '+977' },
  { name: 'Bhutan', code: 'BT', dialCode: '+975' },
  { name: 'Maldives', code: 'MV', dialCode: '+960' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84' },
  { name: 'Thailand', code: 'TH', dialCode: '+66' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60' },
  { name: 'Philippines', code: 'PH', dialCode: '+63' },
  { name: 'Singapore', code: 'SG', dialCode: '+65' },
  { name: 'Cambodia', code: 'KH', dialCode: '+855' },
  { name: 'Laos', code: 'LA', dialCode: '+856' },
  { name: 'Myanmar', code: 'MM', dialCode: '+95' },
  { name: 'Japan', code: 'JP', dialCode: '+81' },
  { name: 'South Korea', code: 'KR', dialCode: '+82' },
  { name: 'Taiwan', code: 'TW', dialCode: '+886' },
  { name: 'China', code: 'CN', dialCode: '+86' },
  { name: 'Australia', code: 'AU', dialCode: '+61' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64' },
  { name: 'Fiji', code: 'FJ', dialCode: '+679' },
  { name: 'Papua New Guinea', code: 'PG', dialCode: '+675' },
  { name: 'Samoa', code: 'WS', dialCode: '+685' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'Canada', code: 'CA', dialCode: '+1' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'France', code: 'FR', dialCode: '+33' },
];

/**
 * Parses an existing full phone string into country dial code and local number
 */
export function parsePhoneNumber(fullNumber?: string): { dialCode: string; localNumber: string } {
  if (!fullNumber) return { dialCode: '+94', localNumber: '' };
  const trimmed = fullNumber.trim();
  
  // Sort longest dial codes first to avoid prefix collisions (e.g. +880 before +88)
  const sortedCodes = [...COUNTRY_DIAL_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sortedCodes) {
    if (trimmed.startsWith(c.dialCode)) {
      return {
        dialCode: c.dialCode,
        localNumber: trimmed.slice(c.dialCode.length).trim(),
      };
    }
  }

  // Fallback regex for other dial codes
  const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/);
  if (match) {
    return { dialCode: match[1], localNumber: match[2].trim() };
  }

  return { dialCode: '+94', localNumber: trimmed };
}

/**
 * Formats country dial code + local number into clean international string
 */
export function formatFullPhoneNumber(dialCode: string, localNumber: string): string {
  const cleanNumber = localNumber.trim().replace(/^0+/, ''); // strip leading zero
  if (!cleanNumber) return '';
  return `${dialCode} ${cleanNumber}`;
}
