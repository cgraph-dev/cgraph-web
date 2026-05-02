import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilePriceInput } from '../file-price-input';

describe('FilePriceInput', () => {
  it('renders toggle in OFF state when nodesPrice is null', () => {
    const onChange = vi.fn();
    render(<FilePriceInput nodesPrice={null} onChange={onChange} />);

    expect(screen.getByText('Lock for Nodes')).toBeInTheDocument();
    // Price input should NOT be visible
    expect(screen.queryByLabelText('Node price')).not.toBeInTheDocument();
  });

  it('enables pricing with default 10 Nodes when toggled ON', () => {
    const onChange = vi.fn();
    render(<FilePriceInput nodesPrice={null} onChange={onChange} />);

    fireEvent.click(screen.getByText('Lock for Nodes'));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('disables pricing when toggled OFF', () => {
    const onChange = vi.fn();
    render(<FilePriceInput nodesPrice={50} onChange={onChange} />);

    fireEvent.click(screen.getByText('Lock for Nodes'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows numeric input when pricing is enabled', () => {
    const onChange = vi.fn();
    render(<FilePriceInput nodesPrice={25} onChange={onChange} />);

    const input = screen.getByLabelText('Node price');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(25);
  });

  it('enforces minimum price of 10 Nodes', () => {
    const onChange = vi.fn();
    render(<FilePriceInput nodesPrice={25} onChange={onChange} />);

    const input = screen.getByLabelText('Node price');
    fireEvent.change(input, { target: { value: '3' } });

    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('accepts valid prices above minimum', () => {
    const onChange = vi.fn();
    render(<FilePriceInput nodesPrice={10} onChange={onChange} />);

    const input = screen.getByLabelText('Node price');
    fireEvent.change(input, { target: { value: '100' } });

    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('displays correct 80% creator earnings for the current price', () => {
    render(<FilePriceInput nodesPrice={100} onChange={vi.fn()} />);
    expect(screen.getByText(/You'll receive 80% \(80 Nodes\)/)).toBeInTheDocument();
  });

  it('floors the 80% earnings calculation', () => {
    // 15 * 0.8 = 12
    render(<FilePriceInput nodesPrice={15} onChange={vi.fn()} />);
    expect(screen.getByText(/12 Nodes/)).toBeInTheDocument();
  });

  it('shows "Nodes" suffix next to the input', () => {
    render(<FilePriceInput nodesPrice={10} onChange={vi.fn()} />);
    expect(screen.getByText('Nodes')).toBeInTheDocument();
  });
});
