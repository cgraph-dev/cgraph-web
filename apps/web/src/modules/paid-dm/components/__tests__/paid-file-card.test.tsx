/** @module PaidFileCard tests */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { PaidFileCard } from '../paid-file-card';
function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    fileUrl: 'https://cdn.example.com/photo.jpg',
    fileName: 'photo.jpg',
    fileType: 'image' as const,
    price: 25,
    status: 'pending' as const,
    onUnlock: vi.fn(),
    ...overrides,
  };
}
describe('PaidFileCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders the file name', () => {
    render(<PaidFileCard {...makeProps()} />);
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
  });

  it('shows price badge when locked', () => {
    render(<PaidFileCard {...makeProps({ price: 30 })} />);
    expect(screen.getByText('30 Nodes')).toBeInTheDocument();
  });

  it('shows unlock button with price when locked', () => {
    render(<PaidFileCard {...makeProps({ price: 25 })} />);
    expect(screen.getByText('Unlock for 25 Nodes')).toBeInTheDocument();
  });

  it('calls onUnlock when unlock button is clicked', () => {
    const onUnlock = vi.fn();
    render(<PaidFileCard {...makeProps({ onUnlock })} />);

    fireEvent.click(screen.getByText('Unlock for 25 Nodes'));
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('applies blur filter when locked', () => {
    const { container } = render(<PaidFileCard {...makeProps()} />);

    // The preview div has inline blur style
    const previewDiv = container.querySelector('[style]');
    expect(previewDiv).not.toBeNull();
    expect(previewDiv!.getAttribute('style')).toContain('blur(10px)');
  });

  it('renders an img element for image file type', () => {
    render(<PaidFileCard {...makeProps({ fileType: 'image' })} />);
    const img = screen.getByAltText('photo.jpg');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/photo.jpg');
  });
  it('shows "Unlocked" text when status is paid', () => {
    render(<PaidFileCard {...makeProps({ status: 'paid' })} />);
    expect(screen.getByText('Unlocked')).toBeInTheDocument();
  });

  it('does not show unlock button when paid', () => {
    render(<PaidFileCard {...makeProps({ status: 'paid' })} />);
    expect(screen.queryByText(/Unlock for/)).toBeNull();
  });

  it('does not show price badge when paid', () => {
    render(<PaidFileCard {...makeProps({ status: 'paid', price: 25 })} />);
    // "25 Nodes" badge should not be present (only "Unlock for 25 Nodes" button text)
    expect(screen.queryByText('25 Nodes')).toBeNull();
  });

  it('does not apply blur filter when paid', () => {
    const { container } = render(<PaidFileCard {...makeProps({ status: 'paid' })} />);

    // No inline style with blur on the preview div
    const previewDiv = container.querySelector('.h-40');
    expect(previewDiv?.getAttribute('style')).toBeNull();
  });
  it('renders a file icon for video type', () => {
    render(<PaidFileCard {...makeProps({ fileType: 'video', fileName: 'clip.mp4' })} />);
    // No img element for non-image types
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('clip.mp4')).toBeInTheDocument();
  });

  it('renders a file icon for audio type', () => {
    render(<PaidFileCard {...makeProps({ fileType: 'audio', fileName: 'song.mp3' })} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('song.mp3')).toBeInTheDocument();
  });

  it('renders a file icon for document type', () => {
    render(<PaidFileCard {...makeProps({ fileType: 'document', fileName: 'report.pdf' })} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
  });

  it('uses lazy loading on images', () => {
    render(<PaidFileCard {...makeProps({ fileType: 'image' })} />);
    const img = screen.getByAltText('photo.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
  });
});
