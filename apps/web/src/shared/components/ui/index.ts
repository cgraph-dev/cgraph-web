/**
 * Shared UI Components - Primitives
 *
 * Re-exports all UI primitives from @/components/ui.
 * Import from '@/shared/components/ui' for the new architecture.
 *
 */

// Re-export all UI components from legacy location
export {
  // Avatar
  Avatar,
  AvatarGroup,
  // Badge
  Badge,
  NewBadge,
  HotBadge,
  NsfwBadge,
  PinnedBadge,
  PrivateBadge,
  PublicBadge,
  OwnerBadge,
  ModeratorBadge,
  MemberBadge,
  CountBadge,
  // Button
  Button,
  IconButton,
  // Card
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
  // Skeleton
  Skeleton,
  PostCardSkeleton,
  ForumCardSkeleton,
  CommentSkeleton,
  // Error State
  ErrorState,
  NetworkError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  // Empty State
  EmptyState,
  NoPostsEmpty,
  NoCommentsEmpty,
  NoMembersEmpty,
  NoMessagesEmpty,
  NoFriendsEmpty,
  SearchNoResults,
  // Toast
  ToastContainer,
  toast,
  useToastStore,
  // Tooltip
  Tooltip,
  // Dialog
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  // Form
  Input,
  Label,
  Alert,
  AlertDescription,
  AlertTitle,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  // Animation
  GlowText,
  FireText,
  ElectricText,
  RainbowText,
} from '@/components/ui';

// Re-export GlassCard variants
export { default as GlassCard } from '@/components/ui/glass-card';
export { GlassCardNeon } from '@/components/ui/glass-card-variants';
export { InlineTitle } from './inline-title';
export { InlineBadges } from './inline-badges';
export { DisplayName } from './display-name';
export {
  BADGE_DISPLAY_MAP,
  BADGE_RARITY_HEX,
  getTitleDisplay,
  isRareTitle,
  resolveEquippedBadges,
} from './cosmetic-display';
export type { BadgeDisplay, TitleDisplay } from './cosmetic-display';
