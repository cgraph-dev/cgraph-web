/**
 * ChannelCategoriesPanel - Manage channel categories (folders)
 *
 * Category management: create, rename, reorder, delete.
 * Categories group channels in the sidebar for organization.
 * Uses /api/v1/groups/:group_id/categories
 *
 */

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { apiClient, http } from '@/lib/api-client';
import { asString, asNumber, ensureArray } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';

const logger = createLogger('ChannelCategories');
import { CreateCategoryForm } from './create-category-form';
import { CategoryListItem } from './category-list-item';
import type { Category } from './category-list-item';
import { DeleteCategoryModal } from './delete-category-modal';

interface ChannelCategoriesPanelProps {
  groupId: string;
}

/**
 * Channel Categories Panel component.
 */
export function ChannelCategoriesPanel({ groupId }: ChannelCategoriesPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, chanRes] = await Promise.all([
        http.get(`/api/v1/groups/${groupId}/categories`),
        http.get(`/api/v1/groups/${groupId}/channels`),
      ]);

      const categoryRecords = ensureArray<Record<string, unknown>>(catRes.data);
      const channelRecords = ensureArray<Record<string, unknown>>(chanRes.data).flatMap((record) =>
        Array.isArray(record.channels)
          ? ensureArray<Record<string, unknown>>(record.channels)
          : [record]
      );

      const countMap: Record<string, number> = {};
      for (const ch of channelRecords) {
        const catId = asString(ch.category_id) || asString(ch.categoryId);
        if (catId) {
          countMap[catId] = (countMap[catId] ?? 0) + 1;
        }
      }

      setCategories(
        categoryRecords
          .map((c: Record<string, unknown>) => ({
            id: asString(c.id),
            name: asString(c.name),
            position: asNumber(c.position),
            isCollapsed: !!(c.is_collapsed ?? c.isCollapsed),
            channelCount: countMap[asString(c.id)] ?? 0,
          }))
          .sort((a: Category, b: Category) => a.position - b.position)
      );
    } catch (error) {
      logger.error('Failed to fetch categories', error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const result = await apiClient.groups.createCategory(groupId, newName.trim());
      if (!result.ok) throw new Error(result.error.message);
      setNewName('');
      setShowCreate(false);
      fetchCategories();
    } catch (error) {
      logger.error('Failed to create category', error);
    }
  };

  const handleUpdate = async (categoryId: string) => {
    if (!editName.trim()) return;
    try {
      await http.put(`/api/v1/groups/${groupId}/categories/${categoryId}`, {
        name: editName.trim(),
      });
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      logger.error('Failed to update category', error);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await http.delete(`/api/v1/groups/${groupId}/categories/${categoryId}`);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setDeleteConfirmId(null);
    } catch (error) {
      logger.error('Failed to delete category', error);
    }
  };

  const handleReorder = async (newOrder: Category[]) => {
    setCategories(newOrder);
    try {
      await Promise.all(
        newOrder.map((cat, idx) =>
          http.put(`/api/v1/groups/${groupId}/categories/${cat.id}`, {
            position: idx,
          })
        )
      );
    } catch (error) {
      logger.warn('Failed to reorder categories, reverting', error);
      fetchCategories();
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...categories];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index]!, newOrder[index - 1]!];
    handleReorder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index >= categories.length - 1) return;
    const newOrder = [...categories];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1]!, newOrder[index]!];
    handleReorder(newOrder);
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Categories</h3>
          <p className="text-sm text-gray-400">Group channels into collapsible categories</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<PlusIcon />}
          onClick={() => setShowCreate(true)}
          aria-expanded={showCreate}
          className="min-h-11 lg:min-h-10"
        >
          Add Category
        </Button>
      </div>

      {/* Create Form */}
      <CreateCategoryForm
        show={showCreate}
        name={newName}
        onNameChange={setNewName}
        onSubmit={handleCreate}
        onClose={() => setShowCreate(false)}
      />

      {/* Categories List */}
      {loading ? (
        <div className="space-y-2 py-2" aria-label="Loading categories" role="status">
          <Skeleton variant="rectangular" height={52} />
          <Skeleton variant="rectangular" height={52} />
        </div>
      ) : categories.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-500">
          No categories. Channels will appear ungrouped.
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Channel categories">
          {categories.map((category, index) => (
            <div key={category.id} role="listitem">
              <CategoryListItem
                category={category}
                index={index}
                totalCount={categories.length}
                isEditing={editingId === category.id}
                editName={editName}
                onEditNameChange={setEditName}
                onSave={handleUpdate}
                onCancelEdit={() => setEditingId(null)}
                onStartEdit={startEdit}
                onDeleteRequest={setDeleteConfirmId}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteCategoryModal
        deleteConfirmId={deleteConfirmId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
