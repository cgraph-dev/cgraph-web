/**
 * Forum route definitions (protected)
 *
 */

import { Route } from 'react-router-dom';
import { RouteErrorBoundary } from '@/components/feedback/route-error-boundary';
import {
  Forums,
  ForumPost,
  ForumLeaderboard,
  CreateForum,
  CreatePost,
  ForumSettings,
  ForumBoardView,
  ForumAdmin,
  ModerationQueue,
  ForumSearchResults,
  CommissionBoardView,
  CommissionDetailPage,
  BountyList,
  BountyDetail,
  CreateBounty,
} from '../lazyPages';

/** All forum-related protected routes */
export function ForumRoutes() {
  return (
    <>
      <Route
        path="forums"
        element={
          <RouteErrorBoundary routeName="Forums">
            <Forums />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/leaderboard"
        element={
          <RouteErrorBoundary routeName="Forum Leaderboard">
            <ForumLeaderboard />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/create"
        element={
          <RouteErrorBoundary routeName="Create Forum">
            <CreateForum />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/moderation"
        element={
          <RouteErrorBoundary routeName="Moderation Queue">
            <ModerationQueue />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/search"
        element={
          <RouteErrorBoundary routeName="Forum Search">
            <ForumSearchResults />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/:forumSlug"
        element={
          <RouteErrorBoundary routeName="Forum View">
            <ForumBoardView />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/:forumSlug/posts"
        element={
          <RouteErrorBoundary routeName="Forum Posts">
            <ForumBoardView />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/:forumSlug/create-post"
        element={
          <RouteErrorBoundary routeName="Create Post">
            <CreatePost />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/:forumSlug/settings"
        element={
          <RouteErrorBoundary routeName="Forum Settings">
            <ForumSettings />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/:forumSlug/admin"
        element={
          <RouteErrorBoundary routeName="Forum Admin">
            <ForumAdmin />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/:forumSlug/post/:postId"
        element={
          <RouteErrorBoundary routeName="Forum Post">
            <ForumPost />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/:forumSlug/boards/:boardSlug"
        element={
          <RouteErrorBoundary routeName="Forum Board">
            <ForumBoardView />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/:forumSlug/threads/:threadId"
        element={
          <RouteErrorBoundary routeName="Forum Thread">
            <ForumPost />
          </RouteErrorBoundary>
        }
      />
      {/* Bounties */}
      <Route
        path="forums/:forumSlug/bounties"
        element={
          <RouteErrorBoundary routeName="Bounty List">
            <BountyList />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/:forumSlug/bounties/create"
        element={
          <RouteErrorBoundary routeName="Create Bounty">
            <CreateBounty />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/:forumSlug/bounties/:bountyId"
        element={
          <RouteErrorBoundary routeName="Bounty Detail">
            <BountyDetail />
          </RouteErrorBoundary>
        }
      />
      {/* Commission Board */}
      <Route
        path="forums/:forumId/boards/:boardId/commissions"
        element={
          <RouteErrorBoundary routeName="Commission Board">
            <CommissionBoardView />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="forums/:forumId/boards/:boardId/commissions/:commissionId"
        element={
          <RouteErrorBoundary routeName="Commission Detail">
            <CommissionDetailPage />
          </RouteErrorBoundary>
        }
      />
    </>
  );
}
