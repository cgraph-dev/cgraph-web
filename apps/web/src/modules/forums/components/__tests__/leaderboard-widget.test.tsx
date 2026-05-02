import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  StarIcon: () => <span data-testid="star-icon" />,
  TrophyIcon: () => <span data-testid="trophy-icon" />,
  ChevronUpIcon: () => <span data-testid="up-icon" />,
  ChevronDownIcon: () => <span data-testid="down-icon" />,
}));

vi.mock('../leaderboard-widget/index', () => ({
  ForumLeaderboardWidget: 'ForumLeaderboardWidget',
  GlobalLeaderboardWidget: 'GlobalLeaderboardWidget',
  LeaderboardSidebar: 'LeaderboardSidebar',
  default: 'LeaderboardWidgetDefault',
}));

describe('LeaderboardWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('module can be imported', async () => {
    const mod = await import('../leaderboard-widget');
    expect(mod.default).toBe('LeaderboardWidgetDefault');
    expect(mod.ForumLeaderboardWidget).toBe('ForumLeaderboardWidget');
    expect(mod.GlobalLeaderboardWidget).toBe('GlobalLeaderboardWidget');
    expect(mod.LeaderboardSidebar).toBe('LeaderboardSidebar');
  });
});
