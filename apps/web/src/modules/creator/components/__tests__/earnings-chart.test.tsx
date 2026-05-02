/**
 * EarningsChart Component Unit Tests
 *
 * Tests for the SVG bar chart component that displays creator earnings.
 * Covers empty state, data rendering, period selector, and SVG elements.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { EarningsChart } from '../earnings-chart';
function makeChartData(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    period: `2026-0${i + 1}`,
    amount: (i + 1) * 50,
  }));
}

// Tests

describe('EarningsChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should show empty message when data is empty', () => {
    render(<EarningsChart data={[]} />);

    expect(screen.getByText('No earnings data available')).toBeInTheDocument();
  });

  it('should not render SVG when data is empty', () => {
    const { container } = render(<EarningsChart data={[]} />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
  it('should render SVG chart when data is provided', () => {
    const { container } = render(<EarningsChart data={makeChartData()} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render bars for each data point', () => {
    const data = makeChartData(4);
    const { container } = render(<EarningsChart data={data} />);

    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(4);
  });

  it('should render amount labels for each data point', () => {
    const data = [
      { period: '2026-01', amount: 50 },
      { period: '2026-02', amount: 100 },
    ];
    render(<EarningsChart data={data} />);

    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('should render truncated period labels', () => {
    const data = [{ period: '2026-01-15', amount: 50 }];
    render(<EarningsChart data={data} />);

    // Period label is sliced to 7 chars: "2026-01"
    expect(screen.getByText('2026-01')).toBeInTheDocument();
  });

  it('should render groups for each data point', () => {
    const data = makeChartData(3);
    const { container } = render(<EarningsChart data={data} />);

    const groups = container.querySelectorAll('g');
    expect(groups).toHaveLength(3);
  });
  it('should render period selector buttons', () => {
    render(<EarningsChart data={makeChartData()} />);

    expect(screen.getByText('daily')).toBeInTheDocument();
    expect(screen.getByText('weekly')).toBeInTheDocument();
    expect(screen.getByText('monthly')).toBeInTheDocument();
  });

  it('should default to monthly period', () => {
    render(<EarningsChart data={makeChartData()} />);

    const monthlyButton = screen.getByText('monthly');
    // Active button has bg-primary class
    expect(monthlyButton.className).toContain('bg-primary');
  });

  it('should use initialPeriod prop', () => {
    render(<EarningsChart data={makeChartData()} period="daily" />);

    const dailyButton = screen.getByText('daily');
    expect(dailyButton.className).toContain('bg-primary');
  });

  it('should switch active period on click', () => {
    render(<EarningsChart data={makeChartData()} />);

    const weeklyButton = screen.getByText('weekly');
    fireEvent.click(weeklyButton);

    expect(weeklyButton.className).toContain('bg-primary');

    const monthlyButton = screen.getByText('monthly');
    expect(monthlyButton.className).not.toContain('bg-primary');
  });
  it('should set bar heights proportional to amounts', () => {
    const data = [
      { period: '2026-01', amount: 100 },
      { period: '2026-02', amount: 50 },
    ];
    const { container } = render(<EarningsChart data={data} />);

    const rects = container.querySelectorAll('rect');
    const height1 = parseFloat(rects[0]!.getAttribute('height') ?? '0');
    const height2 = parseFloat(rects[1]!.getAttribute('height') ?? '0');

    // The 100 bar should be taller than the 50 bar
    expect(height1).toBeGreaterThan(height2);
    // With max=100, the first bar should be full CHART_HEIGHT (200)
    expect(height1).toBe(200);
    // Second bar should be half
    expect(height2).toBe(100);
  });

  it('should handle single data point', () => {
    const data = [{ period: '2026-01', amount: 75 }];
    const { container } = render(<EarningsChart data={data} />);

    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(1);

    // Single point should use full height
    const height = parseFloat(rects[0]!.getAttribute('height') ?? '0');
    expect(height).toBe(200);
  });

  it('should handle zero amounts without crashing', () => {
    const data = [
      { period: '2026-01', amount: 0 },
      { period: '2026-02', amount: 0 },
    ];
    const { container } = render(<EarningsChart data={data} />);

    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(2);

    // maxAmount falls back to 1 when all amounts are 0
    const height = parseFloat(rects[0]!.getAttribute('height') ?? '0');
    expect(height).toBe(0);
  });

  it('should apply rounded corners to bars', () => {
    const data = [{ period: '2026-01', amount: 100 }];
    const { container } = render(<EarningsChart data={data} />);

    const rect = container.querySelector('rect');
    expect(rect?.getAttribute('rx')).toBe('3');
  });
  it('should have minimum SVG width of 100', () => {
    const data = [{ period: '2026-01', amount: 50 }];
    const { container } = render(<EarningsChart data={data} />);

    const svg = container.querySelector('svg');
    const width = parseFloat(svg?.getAttribute('width') ?? '0');
    expect(width).toBeGreaterThanOrEqual(100);
  });

  it('should scale SVG width with number of data points', () => {
    const smallData = makeChartData(2);
    const largeData = makeChartData(10);

    const { container: c1 } = render(<EarningsChart data={smallData} />);
    const { container: c2 } = render(<EarningsChart data={largeData} />);

    const w1 = parseFloat(c1.querySelector('svg')?.getAttribute('width') ?? '0');
    const w2 = parseFloat(c2.querySelector('svg')?.getAttribute('width') ?? '0');

    expect(w2).toBeGreaterThan(w1);
  });
});
