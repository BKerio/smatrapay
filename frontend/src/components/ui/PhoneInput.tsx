import { ChevronDown } from 'lucide-react';
import {
  CountryCode,
  PHONE_COUNTRIES,
  getCountryByCode,
} from '@/lib/phone';

interface PhoneInputProps {
  country: CountryCode;
  value: string;
  onCountryChange: (country: CountryCode) => void;
  onChange: (localPhone: string) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  inputClassName?: string;
}

const PhoneInput = ({
  country,
  value,
  onCountryChange,
  onChange,
  disabled = false,
  error = false,
  placeholder = '0712345678',
  inputClassName = '',
}: PhoneInputProps) => {
  const selected = getCountryByCode(country);

  const borderClass = error
    ? 'border-red-400 dark:border-red-500'
    : 'border-slate-100 dark:border-slate-800';

  return (
    <div
      className={`flex rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${borderClass} ${inputClassName}`}
    >
      <div className="relative flex items-center gap-1.5 shrink-0 pl-2.5 pr-1 bg-slate-100 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-700">
        <img
          src={selected.flag}
          alt={selected.name}
          className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-600"
        />
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value as CountryCode)}
          disabled={disabled}
          className="appearance-none bg-transparent pr-5 py-2 text-sm font-medium text-slate-900 dark:text-white outline-none cursor-pointer disabled:opacity-50"
          aria-label="Country code"
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              +{c.dialCode}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-sm text-slate-900 dark:text-white outline-none transition-all disabled:opacity-50"
      />
    </div>
  );
};

export default PhoneInput;
