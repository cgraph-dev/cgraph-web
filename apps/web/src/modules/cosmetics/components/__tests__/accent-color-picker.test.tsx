import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccentColorPicker } from '../accent-color-picker';

describe('AccentColorPicker', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the "Accent Color" heading', () => {
    render(<AccentColorPicker currentColor={null} onChange={mockOnChange} />);

    expect(screen.getByText('Accent Color')).toBeInTheDocument();
  });

  it('renders 12 preset swatches', () => {
    render(<AccentColorPicker currentColor={null} onChange={mockOnChange} />);

    const swatches = screen.getAllByRole('button');
    expect(swatches.length).toBe(12);
  });

  it('calls onChange when a swatch is clicked', () => {
    render(<AccentColorPicker currentColor={null} onChange={mockOnChange} />);

    const swatch = screen.getByLabelText('Select color #3b82f6');
    fireEvent.click(swatch);

    expect(mockOnChange).toHaveBeenCalledWith('#3b82f6');
  });

  it('highlights the currently selected swatch with white border', () => {
    render(<AccentColorPicker currentColor="#3b82f6" onChange={mockOnChange} />);

    const selectedSwatch = screen.getByLabelText('Select color #3b82f6');
    expect(selectedSwatch.style.borderColor).toBe('white');

    const otherSwatch = screen.getByLabelText('Select color #22c55e');
    expect(otherSwatch.style.borderColor).toBe('transparent');
  });

  it('renders custom hex input field', () => {
    render(<AccentColorPicker currentColor={null} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('#3b82f6');
    expect(input).toBeInTheDocument();
  });

  it('calls onChange when valid hex is typed in custom input', () => {
    render(<AccentColorPicker currentColor={null} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('#3b82f6');
    fireEvent.change(input, { target: { value: '#ff0000' } });

    expect(mockOnChange).toHaveBeenCalledWith('#ff0000');
  });

  it('auto-prefixes # when user omits it', () => {
    render(<AccentColorPicker currentColor={null} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('#3b82f6');
    fireEvent.change(input, { target: { value: 'ff0000' } });

    expect(mockOnChange).toHaveBeenCalledWith('#ff0000');
  });

  it('shows validation error for invalid hex', () => {
    render(<AccentColorPicker currentColor={null} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('#3b82f6');
    fireEvent.change(input, { target: { value: '#xyz' } });

    expect(screen.getByText('Enter a valid hex color (#RRGGBB)')).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('does not show error for empty input', () => {
    render(<AccentColorPicker currentColor={null} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('#3b82f6');
    fireEvent.change(input, { target: { value: '' } });

    expect(screen.queryByText('Enter a valid hex color (#RRGGBB)')).not.toBeInTheDocument();
  });

  it('renders gradient preview with current color', () => {
    render(<AccentColorPicker currentColor="#ef4444" onChange={mockOnChange} />);

    // Preview shows the hex value
    expect(screen.getByText('#ef4444')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('uses default blue for preview when no color is selected', () => {
    render(<AccentColorPicker currentColor={null} onChange={mockOnChange} />);

    expect(screen.getByText('#3b82f6')).toBeInTheDocument();
  });

  it('renders "Custom hex" label', () => {
    render(<AccentColorPicker currentColor={null} onChange={mockOnChange} />);

    expect(screen.getByText('Custom hex')).toBeInTheDocument();
  });

  it('populates custom hex input with currentColor on mount', () => {
    render(<AccentColorPicker currentColor="#a855f7" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('#3b82f6') as HTMLInputElement;
    expect(input.value).toBe('#a855f7');
  });

  it('applies error border class on invalid input', () => {
    render(<AccentColorPicker currentColor={null} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('#3b82f6');
    fireEvent.change(input, { target: { value: '#zz' } });

    expect(input.className).toContain('border-red-500/50');
  });
});
