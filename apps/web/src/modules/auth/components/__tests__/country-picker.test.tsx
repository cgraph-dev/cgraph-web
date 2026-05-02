import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { FALLBACK_PHONE_COUNTRIES } from '../../store/fallback-countries';
import { usePhoneRegistrationStore } from '../../store/registration-store';
import { CountryPicker } from '../country-picker';

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop !== 'string') return undefined;
        return ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => {
          const Element = prop as React.ElementType;
          const domProps = { ...rest };
          delete domProps.animate;
          delete domProps.exit;
          delete domProps.initial;
          delete domProps.transition;
          return <Element {...domProps}>{children}</Element>;
        };
      },
    }
  ),
}));

describe('CountryPicker', () => {
  beforeEach(() => {
    usePhoneRegistrationStore.setState({
      countries: FALLBACK_PHONE_COUNTRIES,
      selectedCountry: FALLBACK_PHONE_COUNTRIES.find((country) => country.code === 'US') ?? null,
      isCountryPickerOpen: true,
    });
  });

  it('renders selectable fallback countries when the picker opens', () => {
    render(<CountryPicker />);

    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('Romania')).toBeInTheDocument();
    expect(screen.queryByText('No countries matched that search.')).not.toBeInTheDocument();
  });

  it('filters fallback countries by calling code', () => {
    render(<CountryPicker />);

    fireEvent.change(screen.getByPlaceholderText('Search countries'), {
      target: { value: '+40' },
    });

    expect(screen.getByText('Romania')).toBeInTheDocument();
    expect(screen.queryByText('United States')).not.toBeInTheDocument();
  });
});
