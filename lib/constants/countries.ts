/** @format */

export interface Country {
  name: string;
  code: string;
  phone_code: string;
  flag: string;
}

export const COUNTRIES: Record<string, Country> = {
  FJ: {
    name: 'Fiji',
    code: 'FJ',
    phone_code: '+679',
    flag: '🇫🇯',
  },
  NZ: {
    name: 'New Zealand',
    code: 'NZ',
    phone_code: '+64',
    flag: '🇳🇿',
  },
  AU: {
    name: 'Australia',
    code: 'AU',
    phone_code: '+61',
    flag: '🇦🇺',
  },
  US: {
    name: 'United States',
    code: 'US',
    phone_code: '+1',
    flag: '🇺🇸',
  },
  IN: {
    name: 'India',
    code: 'IN',
    phone_code: '+91',
    flag: '🇮🇳',
  },
  GB: {
    name: 'United Kingdom',
    code: 'GB',
    phone_code: '+44',
    flag: '🇬🇧',
  },
  GLOBAL: {
    name: 'Global',
    code: 'GLOBAL',
    phone_code: '',
    flag: '🌐',
  },
};

export const getPhoneCode = (countryCode: string): string => {
  return COUNTRIES[countryCode]?.phone_code || '';
};
