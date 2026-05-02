import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PasswordStrengthMeter } from '../password-strength-meter';
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (!['initial', 'animate', 'exit', 'transition'].includes(k) && !k.startsWith('while')) {
          clean[k] = v;
        }
      }
      return <div {...clean}>{children}</div>;
    },
    span: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const {
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        ...rest
      } = props;
      return <span {...rest}>{children}</span>;
    },
    li: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const {
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        ...rest
      } = props;
      return <li {...rest}>{children}</li>;
    },
    ul: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => <ul {...props}>{children}</ul>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  CheckIcon: (props: Record<string, unknown>) => <svg data-testid="check-icon" {...props} />,
  XMarkIcon: (props: Record<string, unknown>) => <svg data-testid="x-icon" {...props} />,
  ShieldCheckIcon: (props: Record<string, unknown>) => <svg data-testid="shield-icon" {...props} />,
}));
describe('PasswordStrengthMeter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the component when a password is provided', () => {
    render(<PasswordStrengthMeter password="a" />);
    expect(screen.getByText('Password Strength')).toBeInTheDocument();
  });
  it('shows "Weak" for a single lowercase character', () => {
    render(<PasswordStrengthMeter password="a" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows "Fair" for a password meeting 2 requirements (lowercase + number)', () => {
    render(<PasswordStrengthMeter password="abc1" />);
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('shows "Good" for a password meeting 3 requirements', () => {
    render(<PasswordStrengthMeter password="Abc1" />);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('shows "Strong" for a password meeting 4 requirements', () => {
    render(<PasswordStrengthMeter password="Abcdefg1" />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('shows "Very Strong" for a password meeting all 5 requirements', () => {
    render(<PasswordStrengthMeter password="Abcdefg1!" />);
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
  });
  it('renders all 5 requirement labels by default', () => {
    render(<PasswordStrengthMeter password="a" />);
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Contains uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('Contains lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('Contains a number')).toBeInTheDocument();
    expect(screen.getByText('Contains special character')).toBeInTheDocument();
  });

  it('shows check icons for passed requirements', () => {
    render(<PasswordStrengthMeter password="Abc" />);
    const checks = screen.getAllByTestId('check-icon');
    // "Contains uppercase" + "Contains lowercase" = 2 checks
    expect(checks).toHaveLength(2);
  });

  it('shows X icons for failed requirements', () => {
    render(<PasswordStrengthMeter password="a" />);
    const xIcons = screen.getAllByTestId('x-icon');
    // Only lowercase passes, so 4 X icons
    expect(xIcons).toHaveLength(4);
  });

  it('hides requirements when showRequirements is false', () => {
    render(<PasswordStrengthMeter password="a" showRequirements={false} />);
    expect(screen.queryByText('At least 8 characters')).not.toBeInTheDocument();
  });
  it('respects custom minLength prop', () => {
    render(<PasswordStrengthMeter password="abc" minLength={3} />);
    expect(screen.getByText('At least 3 characters')).toBeInTheDocument();
    // "At least 3 characters" and "Contains lowercase" should pass
    const checks = screen.getAllByTestId('check-icon');
    expect(checks).toHaveLength(2);
  });

  it('treats default minLength=8 as failing for short passwords', () => {
    render(<PasswordStrengthMeter password="Abc1!" />);
    // 5 chars — length requirement fails
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    const xIcons = screen.getAllByTestId('x-icon');
    expect(xIcons).toHaveLength(1); // only length fails
  });
  it('renders minimal variant without requirements list', () => {
    render(<PasswordStrengthMeter password="Abc1!" variant="minimal" />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.queryByText('Contains uppercase letter')).not.toBeInTheDocument();
  });

  it('renders the strength label in minimal variant', () => {
    render(<PasswordStrengthMeter password="a" variant="minimal" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });
  it('renders bar variant with strength label and bar segments', () => {
    render(<PasswordStrengthMeter password="Abcdefg1!" variant="bar" />);
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
    expect(screen.getByText('Password Strength')).toBeInTheDocument();
  });

  it('bar variant does not show requirements', () => {
    render(<PasswordStrengthMeter password="Abc" variant="bar" />);
    expect(screen.queryByText('Contains uppercase letter')).not.toBeInTheDocument();
  });
  it('applies custom className to outer container', () => {
    const { container } = render(<PasswordStrengthMeter password="a" className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });
  it('handles special characters in requirements', () => {
    render(<PasswordStrengthMeter password="!@#$%^" />);
    const checks = screen.getAllByTestId('check-icon');
    // Only "Contains special character" passes
    expect(checks).toHaveLength(1);
  });

  it('handles a password of exactly minLength', () => {
    render(<PasswordStrengthMeter password="abcdefgh" minLength={8} />);
    // length + lowercase = 2 requirements → Fair
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('handles all-uppercase password', () => {
    render(<PasswordStrengthMeter password="ABCDEFGH" />);
    // length + uppercase = 2 → Fair
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });
});
