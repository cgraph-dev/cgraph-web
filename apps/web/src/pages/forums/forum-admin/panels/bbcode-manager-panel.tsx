/**
 * BBCode Manager Panel — Admin panel for managing custom BBCode tags.
 * Allows forum admins to create, edit, preview, and delete custom BBCode.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
  CodeBracketIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { http } from '@/modules/forums/store/forumStore.utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('BBCodeManager');

interface CustomBbcode {
  id: string;
  name: string;
  tag: string;
  regex_match: string;
  html_replacement: string;
  example_input: string | null;
  description: string | null;
  enabled: boolean;
  parse_content: boolean;
  position: number;
}

interface BbcodeManagerPanelProps {
  forumId: string;
}

const EMPTY_FORM: Omit<CustomBbcode, 'id'> = {
  name: '',
  tag: '',
  regex_match: '',
  html_replacement: '',
  example_input: '',
  description: '',
  enabled: true,
  parse_content: true,
  position: 0,
};

/** Admin panel for managing custom BBCode tags in a forum. */
export function BbcodeManagerPanel({ forumId }: BbcodeManagerPanelProps) {
  const [bbcodes, setBbcodes] = useState<CustomBbcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewOutput, setPreviewOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchBbcodes = useCallback(async () => {
    try {
      const response = await http.get(`/api/v1/forums/${forumId}/bbcodes`);
      setBbcodes(response.data?.data ?? []);
    } catch (err: unknown) {
      logger.error(err instanceof Error ? err : new Error(String(err)), 'fetchBbcodes');
    } finally {
      setLoading(false);
    }
  }, [forumId]);

  useEffect(() => {
    fetchBbcodes();
  }, [fetchBbcodes]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setPreviewOutput('');
    setError(null);
  }

  function startEdit(bbcode: CustomBbcode) {
    setForm({
      name: bbcode.name,
      tag: bbcode.tag,
      regex_match: bbcode.regex_match,
      html_replacement: bbcode.html_replacement,
      example_input: bbcode.example_input ?? '',
      description: bbcode.description ?? '',
      enabled: bbcode.enabled,
      parse_content: bbcode.parse_content,
      position: bbcode.position,
    });
    setEditingId(bbcode.id);
    setShowForm(true);
    setPreviewOutput('');
    setError(null);
  }

  async function handleSave() {
    setError(null);
    try {
      if (editingId) {
        await http.put(`/api/v1/forums/${forumId}/bbcodes/${editingId}`, form);
      } else {
        await http.post(`/api/v1/forums/${forumId}/bbcodes`, form);
      }
      resetForm();
      await fetchBbcodes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save BBCode';
      setError(message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await http.delete(`/api/v1/forums/${forumId}/bbcodes/${id}`);
      setBbcodes((prev) => prev.filter((b) => b.id !== id));
    } catch (err: unknown) {
      logger.error(err instanceof Error ? err : new Error(String(err)), 'deleteBbcode');
    }
  }

  async function handlePreview() {
    if (!form.regex_match || !form.html_replacement || !form.example_input) return;
    try {
      const response = await http.post(`/api/v1/forums/${forumId}/bbcodes/preview`, {
        regex_match: form.regex_match,
        html_replacement: form.html_replacement,
        test_input: form.example_input,
      });
      setPreviewOutput(response.data?.data?.output ?? '');
    } catch (_err: unknown) {
      setPreviewOutput('Preview error — check regex pattern');
    }
  }

  async function handleToggle(bbcode: CustomBbcode) {
    try {
      await http.put(`/api/v1/forums/${forumId}/bbcodes/${bbcode.id}`, {
        enabled: !bbcode.enabled,
      });
      setBbcodes((prev) =>
        prev.map((b) => (b.id === bbcode.id ? { ...b, enabled: !b.enabled } : b))
      );
    } catch (err: unknown) {
      logger.error(err instanceof Error ? err : new Error(String(err)), 'toggleBbcode');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--token-text-primary)]">Custom BBCode</h2>
          <p className="text-sm text-[var(--token-text-secondary)]">
            Create custom BBCode tags for your forum
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
        >
          <PlusIcon className="h-4 w-4" />
          Add BBCode
        </motion.button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="space-y-4 p-4">
              <h3 className="font-semibold text-[var(--token-text-primary)]">
                {editingId ? 'Edit BBCode' : 'New BBCode'}
              </h3>

              {error && (
                <div className="rounded-lg border border-red-500 bg-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. YouTube Embed"
                    className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                    Tag name
                  </label>
                  <input
                    value={form.tag}
                    onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                    placeholder="e.g. youtube"
                    className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                  Regex Match Pattern
                </label>
                <input
                  value={form.regex_match}
                  onChange={(e) => setForm((f) => ({ ...f, regex_match: e.target.value }))}
                  placeholder="e.g. \[youtube\](.*?)\[\/youtube\]"
                  className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 font-mono text-sm text-[var(--token-text-primary)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                  HTML Replacement
                </label>
                <input
                  value={form.html_replacement}
                  onChange={(e) => setForm((f) => ({ ...f, html_replacement: e.target.value }))}
                  placeholder='e.g. <iframe src="https://youtube.com/embed/\1"></iframe>'
                  className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 font-mono text-sm text-[var(--token-text-primary)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                  Description (optional)
                </label>
                <input
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What does this BBCode do?"
                  className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                  Example Input (for preview)
                </label>
                <input
                  value={form.example_input ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, example_input: e.target.value }))}
                  placeholder="e.g. [youtube]dQw4w9WgXcQ[/youtube]"
                  className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 font-mono text-sm text-[var(--token-text-primary)]"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-[var(--token-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                    className="rounded"
                  />
                  Enabled
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--token-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={form.parse_content}
                    onChange={(e) => setForm((f) => ({ ...f, parse_content: e.target.checked }))}
                    className="rounded"
                  />
                  Parse inner content
                </label>
              </div>

              {/* Preview */}
              {previewOutput && (
                <div className="rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-3">
                  <p className="mb-1 text-xs font-medium text-[var(--token-text-secondary)]">
                    Preview Output:
                  </p>
                  <div
                    className="prose prose-invert text-sm"
                    dangerouslySetInnerHTML={{ __html: previewOutput }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePreview}
                  className="flex items-center gap-1 rounded-lg border border-[var(--token-card-border)] px-3 py-2 text-sm text-[var(--token-text-secondary)]"
                >
                  <EyeIcon className="h-4 w-4" />
                  Preview
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="flex items-center gap-1 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
                >
                  <CheckIcon className="h-4 w-4" />
                  {editingId ? 'Update' : 'Create'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetForm}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-[var(--token-text-secondary)]"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="space-y-2">
        {bbcodes.length === 0 && !showForm && (
          <GlassCard className="p-6 text-center">
            <CodeBracketIcon className="mx-auto mb-2 h-8 w-8 text-[var(--token-text-secondary)]" />
            <p className="text-sm text-[var(--token-text-secondary)]">
              No custom BBCode tags yet. Click &quot;Add BBCode&quot; to create one.
            </p>
          </GlassCard>
        )}

        {bbcodes.map((bbcode) => (
          <GlassCard key={bbcode.id} className="flex items-center justify-between p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--token-text-primary)]">{bbcode.name}</span>
                <code className="rounded bg-[var(--token-bg-secondary)] px-1.5 py-0.5 text-xs text-primary-400">
                  [{bbcode.tag}]
                </code>
                {!bbcode.enabled && (
                  <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs text-yellow-400">
                    Disabled
                  </span>
                )}
              </div>
              {bbcode.description && (
                <p className="mt-1 text-xs text-[var(--token-text-secondary)]">
                  {bbcode.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleToggle(bbcode)}
                className={`rounded-lg p-1.5 ${bbcode.enabled ? 'text-green-400' : 'text-gray-500'}`}
                title={bbcode.enabled ? 'Disable' : 'Enable'}
              >
                <CheckIcon className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => startEdit(bbcode)}
                className="rounded-lg p-1.5 text-[var(--token-text-secondary)]"
                title="Edit"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDelete(bbcode.id)}
                className="rounded-lg p-1.5 text-red-400"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </motion.button>
            </div>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
}
