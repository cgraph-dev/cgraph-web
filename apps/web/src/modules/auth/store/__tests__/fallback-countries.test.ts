import { describe, expect, it } from 'vitest';

import { FALLBACK_PHONE_COUNTRIES, resolvePhoneCountries } from '../fallback-countries';

describe('resolvePhoneCountries', () => {
  it('uses API countries when the backend returns countries', () => {
    const apiCountries = [{ code: 'US', name: 'United States', calling_code: '+1' }];

    expect(resolvePhoneCountries(apiCountries)).toEqual(apiCountries);
  });

  it('falls back to a usable country list when the backend returns none', () => {
    const countries = resolvePhoneCountries([]);

    expect(countries).toBe(FALLBACK_PHONE_COUNTRIES);
    expect(countries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'US', calling_code: '+1' }),
        expect.objectContaining({ code: 'RO', calling_code: '+40' }),
      ])
    );
  });
});
