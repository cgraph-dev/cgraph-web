import { ForumMonetizationPanel } from '@/modules/forums/components/forum-monetization-panel';

interface NodeGatingPanelProps {
  readonly forumId: string;
}

/** Node Gating Panel. */
export function NodeGatingPanel({ forumId }: NodeGatingPanelProps) {
  return <ForumMonetizationPanel forumId={forumId} />;
}
