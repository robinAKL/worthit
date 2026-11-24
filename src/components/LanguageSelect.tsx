import { LOCALES, type Locale } from '../lib/types';
import { DICTIONARIES } from '../i18n/registry';
import './LanguageSelect.css';

interface Props {
  locale: Locale;
  label: string;
  onChange: (locale: Locale) => void;
}

/** A native select supplies keyboard navigation and mobile language selection. */
export function LanguageSelect({ locale, label, onChange }: Props) {
  return (
    <select
      className="language-select"
      aria-label={label}
      value={locale}
      onChange={(event) => onChange(event.target.value as Locale)}
    >
      {LOCALES.map((code) => (
        <option key={code} value={code} lang={code}>{DICTIONARIES[code].language.name}</option>
      ))}
    </select>
  );
}
