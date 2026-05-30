import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Country } from '@cgraph-dev/api-client';
import { usePhoneRegistrationStore } from '@/modules/auth/store/registration-store';

type CountrySection = {
  title: string;
  countries: Country[];
};

function tokenizeSearchValue(value: string): string[] {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, ' ')
    .replace(/[^a-z0-9+]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function countrySearchTokens(country: Country): string[] {
  const callingCode = country.calling_code.replace(/^\+/, '');

  return Array.from(
    new Set([
      ...tokenizeSearchValue(country.name),
      ...tokenizeSearchValue(country.code),
      ...tokenizeSearchValue(country.calling_code),
      ...tokenizeSearchValue(callingCode),
      ...tokenizeSearchValue(`+${callingCode}`),
    ])
  );
}

function matchesCountry(country: Country, query: string): boolean {
  const queryTokens = tokenizeSearchValue(query);

  if (queryTokens.length === 0) {
    return true;
  }

  const tokens = countrySearchTokens(country);

  return queryTokens.every((queryToken) => tokens.some((token) => token.startsWith(queryToken)));
}

/**
 * Slide-in country selector panel for phone number registration.
 * Filters countries by name or dial code and closes on selection or Escape.
 */
export function CountryPicker(): ReactElement | null {
  const isOpen = usePhoneRegistrationStore((state) => state.isCountryPickerOpen);
  const countries = usePhoneRegistrationStore((state) => state.countries);
  const selectedCountry = usePhoneRegistrationStore((state) => state.selectedCountry);
  const setCountryPickerOpen = usePhoneRegistrationStore((state) => state.setCountryPickerOpen);
  const selectCountry = usePhoneRegistrationStore((state) => state.selectCountry);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim());
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCountryPickerOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, setCountryPickerOpen]);

  const filteredCountries = useMemo(() => {
    if (!deferredQuery) {
      return countries;
    }

    return countries.filter((country) => matchesCountry(country, deferredQuery));
  }, [countries, deferredQuery]);

  const sections = useMemo<CountrySection[]>(() => {
    const groupedCountries = new Map<string, Country[]>();

    for (const country of filteredCountries) {
      const title = country.name.charAt(0).toUpperCase();
      const group = groupedCountries.get(title) ?? [];
      group.push(country);
      groupedCountries.set(title, group);
    }

    return Array.from(groupedCountries.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([title, sectionCountries]) => ({
        title,
        countries: sectionCountries.sort((left, right) => left.name.localeCompare(right.name)),
      }));
  }, [filteredCountries]);

  const jumpToSection = (title: string) => {
    sectionRefs.current[title]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={() => setCountryPickerOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex h-[36rem] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0f1a]/95 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/10 px-5 py-4">
              <h3 className="text-lg font-semibold text-white">Choose your country</h3>
              <p className="mt-1 text-sm text-white/50">
                Search by name, ISO code, or calling code.
              </p>
            </div>

            <div className="border-b border-white/10 px-5 py-4">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search countries"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400"
                autoFocus
              />
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-2 py-2 pr-9">
                {sections.map((section) => (
                  <div
                    key={section.title}
                    ref={(node) => {
                      sectionRefs.current[section.title] = node;
                    }}
                    className="mb-3"
                  >
                    <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                      {section.title}
                    </p>
                    {section.countries.map((country) => {
                      const isSelected = selectedCountry?.code === country.code;

                      return (
                        <button
                          key={`${section.title}-${country.code}-${country.calling_code}`}
                          type="button"
                          onClick={() => selectCountry(country)}
                          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                            isSelected ? 'bg-violet-500/15' : 'hover:bg-white/5'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className="text-2xl">{country.flag ?? '🌐'}</span>
                            <span>
                              <span className="block text-sm font-medium text-white">
                                {country.name}
                              </span>
                              <span className="block text-xs text-white/50">{country.code}</span>
                            </span>
                          </span>
                          <span className="text-sm text-white/60">{country.calling_code}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}

                {sections.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-white/50">
                    No countries matched that search.
                  </div>
                ) : null}
              </div>

              {sections.length > 0 ? (
                <div className="absolute bottom-3 right-1 top-3 flex w-6 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-black/30 py-2">
                  {sections.map((section) => (
                    <button
                      key={`index-${section.title}`}
                      type="button"
                      onClick={() => jumpToSection(section.title)}
                      className="text-[10px] font-semibold text-violet-300 transition hover:text-violet-200"
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
