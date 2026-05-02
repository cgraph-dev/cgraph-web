/**
 * FrequencyPicker Component Tests
 *
 * Tests for loading state, topic grid rendering, topic selection/deselection,
 * weight sliders, and save behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
const { mockUseTopics, mockUseUserFrequencies, mockUseUpdateFrequencies } = vi.hoisted(() => ({
  mockUseTopics: vi.fn(),
  mockUseUserFrequencies: vi.fn(),
  mockUseUpdateFrequencies: vi.fn(),
}));

vi.mock('../../hooks/useFrequencies', () => ({
  useTopics: mockUseTopics,
  useUserFrequencies: mockUseUserFrequencies,
  useUpdateFrequencies: mockUseUpdateFrequencies,
}));

import { FrequencyPicker } from '../frequency-picker';
const topics = [
  { id: 'topic-1', name: 'Gaming', icon: 'G', slug: 'gaming' },
  { id: 'topic-2', name: 'Music', icon: 'M', slug: 'music' },
  { id: 'topic-3', name: 'Art', icon: 'A', slug: 'art' },
];

function setupDefaultMocks(overrides?: {
  topicsLoading?: boolean;
  existingFrequencies?: Array<{ topic_id: string; weight: number }>;
  isPending?: boolean;
}) {
  mockUseTopics.mockReturnValue({
    data: overrides?.topicsLoading ? [] : topics,
    isLoading: overrides?.topicsLoading ?? false,
  });
  mockUseUserFrequencies.mockReturnValue({
    data: overrides?.existingFrequencies ?? [],
  });
  mockUseUpdateFrequencies.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: overrides?.isPending ?? false,
  });
}
beforeEach(() => {
  vi.clearAllMocks();
});
describe('FrequencyPicker', () => {
  describe('loading state', () => {
    it('shows loading text while topics load', () => {
      setupDefaultMocks({ topicsLoading: true });
      render(<FrequencyPicker />);

      expect(screen.getByText('Loading topics...')).toBeTruthy();
    });

    it('does not render topics grid during loading', () => {
      setupDefaultMocks({ topicsLoading: true });
      render(<FrequencyPicker />);

      expect(screen.queryByText('Gaming')).toBeNull();
    });
  });

  describe('topic grid', () => {
    it('renders all topics when loaded', () => {
      setupDefaultMocks();
      render(<FrequencyPicker />);

      expect(screen.getByText('Gaming')).toBeTruthy();
      expect(screen.getByText('Music')).toBeTruthy();
      expect(screen.getByText('Art')).toBeTruthy();
    });

    it('displays the header text', () => {
      setupDefaultMocks();
      render(<FrequencyPicker />);

      expect(screen.getByText("Select topics you're interested in")).toBeTruthy();
    });
  });

  describe('topic selection', () => {
    it('selects a topic when clicked', () => {
      setupDefaultMocks();
      render(<FrequencyPicker />);

      fireEvent.click(screen.getByText('Gaming'));

      // After selection, "Adjust interest levels" section appears
      expect(screen.getByText('Adjust interest levels')).toBeTruthy();
    });

    it('deselects a topic when clicked again', () => {
      setupDefaultMocks();
      render(<FrequencyPicker />);

      // Select — click the Gaming TopicCard button in the grid
      const gamingButtons = screen.getAllByText('Gaming');
      fireEvent.click(gamingButtons[0]!);
      expect(screen.getByText('Adjust interest levels')).toBeTruthy();

      // Deselect — after selection, Gaming appears in both grid and slider,
      // click the grid one (first occurrence)
      const gamingButtonsAfter = screen.getAllByText('Gaming');
      fireEvent.click(gamingButtonsAfter[0]!);
      expect(screen.queryByText('Adjust interest levels')).toBeNull();
    });

    it('supports selecting multiple topics', () => {
      setupDefaultMocks();
      render(<FrequencyPicker />);

      fireEvent.click(screen.getByText('Gaming'));
      fireEvent.click(screen.getByText('Music'));

      // Both should appear in the weight sliders section
      const sliderSection = screen.getByText('Adjust interest levels');
      expect(sliderSection).toBeTruthy();

      // Both topic names appear in the sliders (truncated name display)
      const gamingElements = screen.getAllByText('Gaming');
      const musicElements = screen.getAllByText('Music');
      expect(gamingElements.length).toBeGreaterThanOrEqual(2); // grid + slider
      expect(musicElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('weight sliders', () => {
    it('shows sliders with default weight of 50', () => {
      setupDefaultMocks();
      render(<FrequencyPicker />);

      fireEvent.click(screen.getByText('Gaming'));

      const slider = screen.getByRole('slider');
      expect(slider).toBeTruthy();
      expect((slider as HTMLInputElement).value).toBe('50');
    });

    it('updates weight when slider changes', () => {
      setupDefaultMocks();
      render(<FrequencyPicker />);

      fireEvent.click(screen.getByText('Gaming'));

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '75' } });

      expect((slider as HTMLInputElement).value).toBe('75');
    });
  });

  describe('save button', () => {
    it('renders save button', () => {
      setupDefaultMocks();
      render(<FrequencyPicker />);

      expect(screen.getByText('Save Preferences')).toBeTruthy();
    });

    it('disables save button when no topics selected', () => {
      setupDefaultMocks();
      render(<FrequencyPicker />);

      const saveButton = screen.getByText('Save Preferences');
      expect(saveButton).toBeDisabled();
    });

    it('enables save button when topics are selected', () => {
      setupDefaultMocks();
      render(<FrequencyPicker />);

      fireEvent.click(screen.getByText('Gaming'));

      const saveButton = screen.getByText('Save Preferences');
      expect(saveButton).not.toBeDisabled();
    });

    it('calls mutateAsync with entries on save', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      setupDefaultMocks();
      mockUseUpdateFrequencies.mockReturnValue({ mutateAsync, isPending: false });

      render(<FrequencyPicker />);

      fireEvent.click(screen.getByText('Gaming'));
      fireEvent.click(screen.getByText('Save Preferences'));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith([{ topic_id: 'topic-1', weight: 50 }]);
      });
    });

    it('calls onSaved callback after successful save', async () => {
      const onSaved = vi.fn();
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      setupDefaultMocks();
      mockUseUpdateFrequencies.mockReturnValue({ mutateAsync, isPending: false });

      render(<FrequencyPicker onSaved={onSaved} />);

      fireEvent.click(screen.getByText('Gaming'));
      fireEvent.click(screen.getByText('Save Preferences'));

      await waitFor(() => {
        expect(onSaved).toHaveBeenCalledTimes(1);
      });
    });

    it('shows Saving... text when mutation is pending', () => {
      setupDefaultMocks({ isPending: true });
      render(<FrequencyPicker />);

      expect(screen.getByText('Saving...')).toBeTruthy();
    });
  });

  describe('existing frequencies', () => {
    it('seeds entries from existing user frequencies', async () => {
      setupDefaultMocks({
        existingFrequencies: [
          { topic_id: 'topic-1', weight: 80 },
          { topic_id: 'topic-2', weight: 30 },
        ],
      });
      render(<FrequencyPicker />);

      // Should show the sliders section because entries are seeded
      await waitFor(() => {
        expect(screen.getByText('Adjust interest levels')).toBeTruthy();
      });
    });
  });

  it('accepts custom className', () => {
    setupDefaultMocks();
    const { container } = render(<FrequencyPicker className="custom-picker" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-picker');
  });
});
