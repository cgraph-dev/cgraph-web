/**
 * useForumAdminActions - action handlers for categories, rules, flairs, mod queue, and members
 */

import { type Dispatch, type SetStateAction } from 'react';
import { type ForumCategory, type ForumModerator } from '@/modules/forums/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { ForumRule, PostFlair, ModQueueItem, MemberData } from './types';

interface ActionDeps {
  categories: ForumCategory[];
  setCategories: Dispatch<SetStateAction<ForumCategory[]>>;
  newCategoryName: string;
  setNewCategoryName: Dispatch<SetStateAction<string>>;
  rules: ForumRule[];
  setRules: Dispatch<SetStateAction<ForumRule[]>>;
  setEditingRule: Dispatch<SetStateAction<string | null>>;
  setFlairs: Dispatch<SetStateAction<PostFlair[]>>;
  setModQueue: Dispatch<SetStateAction<ModQueueItem[]>>;
  setMembers: Dispatch<SetStateAction<MemberData[]>>;
  setModerators: Dispatch<SetStateAction<ForumModerator[]>>;
}

/**
 * Hook for managing forum admin actions.
 *
 * @param deps - The deps.
 */
export function useForumAdminActions(deps: ActionDeps) {
  const {
    categories,
    setCategories,
    newCategoryName,
    setNewCategoryName,
    rules,
    setRules,
    setEditingRule,
    setFlairs,
    setModQueue,
    setMembers,
    setModerators,
  } = deps;

  // Category handlers
  function addCategory(): void {
    if (!newCategoryName.trim()) return;
    const newCategory: ForumCategory = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      slug: newCategoryName.trim().toLowerCase().replace(/\s+/g, '-'),
      description: '',
      order: categories.length,
      postCount: 0,
    };
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    HapticFeedback.success();
  }

  function removeCategory(categoryId: string): void {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    HapticFeedback.medium();
  }

  function updateCategory(index: number, category: ForumCategory): void {
    setCategories((prev) => {
      const updated = [...prev];
      updated[index] = category;
      return updated;
    });
  }

  // Rule handlers
  function addRule(): void {
    const newRule: ForumRule = {
      id: `rule_${Date.now()}`,
      title: 'New Rule',
      description: 'Rule description...',
      order: rules.length + 1,
    };
    setRules([...rules, newRule]);
    setEditingRule(newRule.id);
    HapticFeedback.light();
  }

  function updateRule(ruleId: string, field: keyof ForumRule, value: string | number): void {
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, [field]: value } : r)));
  }

  function removeRule(ruleId: string): void {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    HapticFeedback.medium();
  }

  // Flair handlers
  function addFlair(): void {
    const newFlair: PostFlair = {
      id: `flair_${Date.now()}`,
      name: 'New Flair',
      color: '#8B5CF6',
      emoji: '🏷️',
    };
    setFlairs((prev) => [...prev, newFlair]);
    HapticFeedback.light();
  }

  function updateFlair(flairId: string, field: keyof PostFlair, value: string | boolean): void {
    setFlairs((prev) => prev.map((f) => (f.id === flairId ? { ...f, [field]: value } : f)));
  }

  function removeFlair(flairId: string): void {
    setFlairs((prev) => prev.filter((f) => f.id !== flairId));
    HapticFeedback.medium();
  }

  // Mod queue handler
  function handleModQueueAction(itemId: string, action: 'approve' | 'reject'): void {
    setModQueue((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
          : item
      )
    );
    HapticFeedback.success();
  }

  // Member handler
  function updateMemberRole(memberId: string, newRole: string): void {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    HapticFeedback.medium();
  }

  // Moderator handlers
  function addModerator(mod: ForumModerator): void {
    setModerators((prev) => [...prev, mod]);
  }

  function removeModerator(modId: string): void {
    setModerators((prev) => prev.filter((m) => m.id !== modId));
  }

  return {
    addCategory,
    removeCategory,
    updateCategory,
    addRule,
    updateRule,
    removeRule,
    addFlair,
    updateFlair,
    removeFlair,
    handleModQueueAction,
    updateMemberRole,
    addModerator,
    removeModerator,
  };
}
