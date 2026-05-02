/**
 * PremiumThreadManager Component Unit Tests
 *
 * Tests for the CRUD interface for managing creator premium threads.
 * Covers rendering, loading state, empty state, thread listing,
 * form interactions (create/edit), and submission.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
const { mockCreatorService } = vi.hoisted(() => ({
  mockCreatorService: {
    listPremiumThreads: vi.fn(),
    createPremiumThread: vi.fn(),
  },
}));

vi.mock('@/modules/creator/services/creatorService', () => ({
  creatorService: mockCreatorService,
}));

import { PremiumThreadManager } from '../premium-thread-manager';
function makeThread(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pt-1',
    threadId: 'thread-abc',
    priceNodes: 50,
    subscriberOnly: false,
    previewLength: 200,
    title: 'My Premium Thread',
    ...overrides,
  };
}

// Tests

describe('PremiumThreadManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should show loading spinner initially', () => {
    mockCreatorService.listPremiumThreads.mockReturnValueOnce(new Promise(() => {}));

    const { container } = render(<PremiumThreadManager />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
  it('should show empty message when no threads exist', async () => {
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce([]);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('No premium threads yet.')).toBeInTheDocument();
    });
  });

  it('should show "New Premium Thread" button when no form is open', async () => {
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce([]);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('+ New Premium Thread')).toBeInTheDocument();
    });
  });
  it('should render thread list with titles and metadata', async () => {
    const threads = [
      makeThread(),
      makeThread({
        id: 'pt-2',
        threadId: 'thread-def',
        title: 'Another Thread',
        priceNodes: 100,
        subscriberOnly: true,
      }),
    ];
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce(threads);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('My Premium Thread')).toBeInTheDocument();
      expect(screen.getByText('Another Thread')).toBeInTheDocument();
    });

    expect(screen.getByText(/50 Nodes/)).toBeInTheDocument();
    expect(screen.getByText(/100 Nodes/)).toBeInTheDocument();
    expect(screen.getByText(/Subscriber only/)).toBeInTheDocument();
  });

  it('should fall back to threadId when title is not set', async () => {
    const threads = [makeThread({ title: undefined })];
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce(threads);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('thread-abc')).toBeInTheDocument();
    });
  });

  it('should show Edit button for each thread', async () => {
    const threads = [makeThread(), makeThread({ id: 'pt-2' })];
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce(threads);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit');
      expect(editButtons).toHaveLength(2);
    });
  });
  it('should open create form when "New Premium Thread" is clicked', async () => {
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce([]);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('+ New Premium Thread')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New Premium Thread'));

    expect(screen.getByText('Create Premium Thread')).toBeInTheDocument();
    expect(screen.getByLabelText('Thread ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Price (Nodes)')).toBeInTheDocument();
    expect(screen.getByText('Subscriber only')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should hide "New Premium Thread" button when form is open', async () => {
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce([]);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('+ New Premium Thread')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New Premium Thread'));

    expect(screen.queryByText('+ New Premium Thread')).not.toBeInTheDocument();
  });

  it('should close form when Cancel is clicked', async () => {
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce([]);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('+ New Premium Thread')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New Premium Thread'));
    expect(screen.getByText('Create Premium Thread')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Create Premium Thread')).not.toBeInTheDocument();
    expect(screen.getByText('+ New Premium Thread')).toBeInTheDocument();
  });
  it('should open edit form when Edit button is clicked', async () => {
    const thread = makeThread({ priceNodes: 75, subscriberOnly: true, previewLength: 500 });
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce([thread]);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByText('Edit Premium Thread')).toBeInTheDocument();
    expect(screen.getByLabelText('Thread ID')).toHaveValue('thread-abc');
    expect(screen.getByLabelText('Price (Nodes)')).toHaveValue(75);
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('should disable Thread ID input when editing', async () => {
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce([makeThread()]);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByLabelText('Thread ID')).toBeDisabled();
  });
  it('should submit create form and reload threads', async () => {
    mockCreatorService.listPremiumThreads
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([makeThread()]);
    mockCreatorService.createPremiumThread.mockResolvedValueOnce(makeThread());

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('+ New Premium Thread')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New Premium Thread'));

    // Fill in Thread ID (required)
    fireEvent.change(screen.getByLabelText('Thread ID'), { target: { value: 'new-thread-id' } });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockCreatorService.createPremiumThread).toHaveBeenCalledWith({
        threadId: 'new-thread-id',
        priceNodes: 50,
        subscriberOnly: false,
        previewLength: 200,
      });
    });

    // Should reload threads after creation
    await waitFor(() => {
      expect(mockCreatorService.listPremiumThreads).toHaveBeenCalledTimes(2);
    });
  });

  it('should disable Create button when Thread ID is empty', async () => {
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce([]);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('+ New Premium Thread')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New Premium Thread'));

    const createButton = screen.getByText('Create');
    expect(createButton).toBeDisabled();
  });
  it('should update price field', async () => {
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce([]);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('+ New Premium Thread')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New Premium Thread'));

    const priceInput = screen.getByLabelText('Price (Nodes)');
    fireEvent.change(priceInput, { target: { value: '100' } });

    expect(priceInput).toHaveValue(100);
  });

  it('should toggle subscriber only checkbox', async () => {
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce([]);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('+ New Premium Thread')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New Premium Thread'));

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('should display preview length from range slider', async () => {
    mockCreatorService.listPremiumThreads.mockResolvedValueOnce([]);

    render(<PremiumThreadManager />);

    await waitFor(() => {
      expect(screen.getByText('+ New Premium Thread')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New Premium Thread'));

    expect(screen.getByText(/Preview length: 200 characters/)).toBeInTheDocument();
  });
});
