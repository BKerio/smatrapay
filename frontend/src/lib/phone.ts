import KenyaFlag from '@/assets/kenya-flag.svg';
import UgandaFlag from '@/assets/uganda-flag.svg';
import TanzaniaFlag from '@/assets/tanzania-flag.svg';

export type CountryCode = 'KE' | 'UG' | 'TZ';

export interface PhoneCountry {
  code: CountryCode;
  dialCode: string;
  flag: string;
  name: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'KE', dialCode: '254', flag: KenyaFlag, name: 'Kenya' },
  { code: 'UG', dialCode: '256', flag: UgandaFlag, name: 'Uganda' },
  { code: 'TZ', dialCode: '255', flag: TanzaniaFlag, name: 'Tanzania' },
];

export function getCountryByCode(code: CountryCode): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.code === code) ?? PHONE_COUNTRIES[0];
}

/** Strip country code and leading 0, leaving the 9-digit subscriber number. */
export function normalizeLocalDigits(localPhone: string, countryCode: CountryCode): string {
  const country = getCountryByCode(countryCode);
  let digits = localPhone.replace(/\D/g, '');

  if (digits.startsWith(country.dialCode)) {
    digits = digits.slice(country.dialCode.length);
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits;
}

export function toInternational(localPhone: string, countryCode: CountryCode): string {
  const country = getCountryByCode(countryCode);
  const digits = normalizeLocalDigits(localPhone, countryCode);
  return `+${country.dialCode}${digits}`;
}

export function toMpesaFormat(localPhone: string, countryCode: CountryCode): string {
  return toInternational(localPhone, countryCode).replace(/^\+/, '');
}

export function parseInternational(phone: string): { country: CountryCode; local: string } {
  const digits = phone.replace(/\D/g, '');

  for (const country of [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)) {
    if (digits.startsWith(country.dialCode)) {
      return { country: country.code, local: `0${digits.slice(country.dialCode.length)}` };
    }
  }

  if (digits.startsWith('0')) {
    return { country: 'KE', local: digits };
  }

  return { country: 'KE', local: digits ? `0${digits}` : '' };
}

export function isValidLocalPhone(localPhone: string, countryCode: CountryCode): boolean {
  const digits = normalizeLocalDigits(localPhone, countryCode);

  if (!/^\d{9}$/.test(digits)) {
    return false;
  }

  switch (countryCode) {
    case 'KE':
      return /^[17]\d{8}$/.test(digits);
    case 'UG':
      return /^7\d{8}$/.test(digits);
    case 'TZ':
      return /^[67]\d{8}$/.test(digits);
    default:
      return false;
  }
}
