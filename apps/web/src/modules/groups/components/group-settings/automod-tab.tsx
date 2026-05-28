import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldExclamationIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  XMarkIcon,
  DocumentTextIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { entranceVariants } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { getGroupPermissionError } from '../../permission-errors';

const logger = createLogger('AutomodTab');

// ─── Types ────────────────────────────────────────────────────────────────────

type RuleType = 'word_filter' | 'link_filter' | 'spam_detection' | 'caps_filter';
type RuleAction = 'delete' | 'warn' | 'mute' | 'flag_for_review';

interface AutomodRule {
  id: string;
  name: string;
  rule_type: RuleType;
  action: RuleAction;
  enabled: boolean;
  pattern: string | null;
  config: Record<string, unknown> | null;
  inserted_at: string;
}

interface AutomodTabProps {
  groupId: string;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

const RULE_TYPE_META: Record<
  RuleType,
  { label: string; icon: React.ElementType; description: string; placeholder: string }
> = {
  word_filter: {
    label: 'Word Filter',
    icon: DocumentTextIcon,
    description: 'Block or flag specific words/phrases',
    placeholder: 'Enter comma-separated words, e.g. spam, badword, scam',
  },
  link_filter: {
    label: 'Link Filter',
    icon: LinkIcon,
    description: 'Control which domains or URLs are allowed',
    placeholder: 'Enter domain patterns, e.g. example.com, *.malicious.net',
  },
  spam_detection: {
    label: 'Spam Detection',
    icon: ChatBubbleLeftRightIcon,
    description: 'Detect repeated messages or rapid posting',
    placeholder: 'Optional pattern override',
  },
  caps_filter: {
    label: 'Caps Filter',
    icon: ArrowsUpDownIcon,
    description: 'Limit messages with excessive capitalization',
    placeholder: 'Optional threshold (e.g. 70 for 70%)',
  },
};

const ACTION_META: Record<RuleAction, { label: string; color: string }> = {
  delete: { label: 'Delete Message', color: 'text-red-400' },
  warn: { label: 'Warn User', color: 'text-yellow-400' },
  mute: { label: 'Mute User', color: 'text-orange-400' },
  flag_for_review: { label: 'Flag for Review', color: 'text-blue-400' },
};

const RULE_TYPES: RuleType[] = ['word_filter', 'link_filter', 'spam_detection', 'caps_filter'];
const RULE_ACTIONS: RuleAction[] = ['delete', 'warn', 'mute', 'flag_for_review'];
const AUTOMOD_PERMISSION_COPY = 'You do not have permission to manage automod rules in this group.';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface RuleFormData {
  name: string;
  rule_type: RuleType;
  action: RuleAction;
  pattern: string;
}

function emptyForm(): RuleFormData {
  return {
    name: '',
    rule_type: 'word_filter',
    action: 'delete',
    pattern: '',
  };
}

function getAutomodError(error: unknown, fallback: string): string {
  return getGroupPermissionError(error, AUTOMOD_PERMISSION_COPY, fallback);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  ariaLabel: string;
}

function ToggleSwitch({ checked, onChange, disabled = false, ariaLabel }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={checked}
      className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-primary-600' : 'bg-[var(--token-card-bg)]'
      }`}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
      />
    </button>
  );
}

interface RuleFormProps {
  initial?: Partial<RuleFormData>;
  onSubmit: (data: RuleFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  loading: boolean;
}

function RuleForm({ initial, onSubmit, onCancel, submitLabel, loading }: RuleFormProps) {
  const [form, setForm] = useState({ ...emptyForm(), ...initial });
  const [error, setError] = useState<string | null>(null);

  const typeMeta = RULE_TYPE_META[form.rule_type];

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setError(null);
    await onSubmit(form);
  };

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">Rule name</label>
        <input
          aria-label="Rule name"
          type="text"
          placeholder="e.g. Block slurs, No invite links"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          className="w-full rounded-lg bg-[var(--token-card-bg)] px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-1 ring-gray-700 focus:ring-primary-500"
        />
      </div>

      {/* Rule type */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">Rule type</label>
        <div className="grid grid-cols-2 gap-2">
          {RULE_TYPES.map((type) => {
            const meta = RULE_TYPE_META[type];
            const Icon = meta.icon;
            const active = form.rule_type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setField('rule_type', type)}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left text-xs transition-colors ${
                  active
                    ? 'bg-primary-500/10 border-primary-500 text-white'
                    : 'border-[var(--token-border-muted)] text-gray-400 hover:border-[var(--token-card-border)] hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary-400' : ''}`} />
                <span className="font-medium">{meta.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-gray-500">{typeMeta.description}</p>
      </div>

      {/* Pattern */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">
          Pattern / Config{' '}
          <span className="text-gray-600">
            {form.rule_type === 'spam_detection' || form.rule_type === 'caps_filter'
              ? '(optional)'
              : ''}
          </span>
        </label>
        <input
          aria-label="Pattern or config"
          type="text"
          placeholder={typeMeta.placeholder}
          value={form.pattern}
          onChange={(e) => setField('pattern', e.target.value)}
          className="w-full rounded-lg bg-[var(--token-card-bg)] px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-1 ring-gray-700 focus:ring-primary-500"
        />
      </div>

      {/* Action */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">Action to take</label>
        <div className="grid grid-cols-2 gap-2">
          {RULE_ACTIONS.map((action) => {
            const meta = ACTION_META[action];
            const active = form.action === action;
            return (
              <button
                key={action}
                type="button"
                onClick={() => setField('action', action)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-primary-500/10 border-primary-500 text-primary-400'
                    : 'border-[var(--token-border-muted)] text-gray-400 hover:border-[var(--token-card-border)] hover:text-white'
                }`}
              >
                <span className={active ? 'text-primary-400' : meta.color}>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-[var(--token-card-bg)] hover:text-white"
        >
          Cancel
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : submitLabel}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * AutoMod Tab component.
 * Manages automated moderation rules for a group.
 */
export function AutomodTab({ groupId }: AutomodTabProps) {
  const [rules, setRules] = useState<AutomodRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomodRule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setGlobalError(null);
    try {
      const res = await http.get(`/api/v1/groups/${groupId}/automod/rules`);
      setRules(res.data.data ?? []);
    } catch (err) {
      logger.error('Failed to fetch automod rules', err);
      setGlobalError(getAutomodError(err, 'Failed to load automod rules. Please try again.'));
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreate = async (form: RuleFormData) => {
    setSubmitting(true);
    setGlobalError(null);
    try {
      const res = await http.post(`/api/v1/groups/${groupId}/automod/rules`, {
        name: form.name,
        rule_type: form.rule_type,
        action: form.action,
        pattern: form.pattern || null,
      });
      setRules((prev) => [...prev, res.data.data]);
      setShowCreate(false);
    } catch (err) {
      logger.error('Failed to create automod rule', err);
      setGlobalError(getAutomodError(err, 'Failed to create automod rule. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (form: RuleFormData) => {
    if (!editingRule) return;
    setSubmitting(true);
    setGlobalError(null);
    try {
      const res = await http.put(`/api/v1/groups/${groupId}/automod/rules/${editingRule.id}`, {
        name: form.name,
        rule_type: form.rule_type,
        action: form.action,
        pattern: form.pattern || null,
      });
      setRules((prev) => prev.map((r) => (r.id === editingRule.id ? res.data.data : r)));
      setEditingRule(null);
    } catch (err) {
      logger.error('Failed to update automod rule', err);
      setGlobalError(getAutomodError(err, 'Failed to update automod rule. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (rule: AutomodRule) => {
    setTogglingId(rule.id);
    setGlobalError(null);
    try {
      const res = await http.patch(`/api/v1/groups/${groupId}/automod/rules/${rule.id}/toggle`);
      setRules((prev) => prev.map((r) => (r.id === rule.id ? res.data.data : r)));
    } catch (err) {
      logger.error('Failed to toggle automod rule', err);
      setGlobalError(getAutomodError(err, 'Failed to toggle automod rule. Please try again.'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (ruleId: string) => {
    setDeletingId(ruleId);
    setGlobalError(null);
    try {
      await http.delete(`/api/v1/groups/${groupId}/automod/rules/${ruleId}`);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err) {
      logger.error('Failed to delete automod rule', err);
      setGlobalError(getAutomodError(err, 'Failed to delete automod rule. Please try again.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-white">AutoMod</h2>
          <p className="text-sm text-gray-400">
            Automatically moderate messages based on rules you define.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRules}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[var(--token-card-bg)] hover:text-white"
            aria-label="Refresh rules"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setShowCreate(true);
              setEditingRule(null);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Rule
          </motion.button>
        </div>
      </div>

      {/* Global error */}
      {globalError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {globalError}
        </div>
      )}

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            key="create-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard variant="frosted" className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">New AutoMod Rule</h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg p-1 text-gray-500 hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <RuleForm
                onSubmit={handleCreate}
                onCancel={() => setShowCreate(false)}
                submitLabel="Create Rule"
                loading={submitting}
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rule list */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <ShieldExclamationIcon className="h-10 w-10 text-gray-600" />
            <p className="text-sm text-gray-500">
              No automod rules yet. Create one to get started.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-700/50">
            <AnimatePresence initial={false}>
              {rules.map((rule, index) => {
                const typeMeta = RULE_TYPE_META[rule.rule_type];
                const actionMeta = ACTION_META[rule.action];
                const Icon = typeMeta.icon;
                const isEditing = editingRule?.id === rule.id;

                return (
                  <motion.li
                    key={rule.id}
                    variants={entranceVariants.fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ delay: index * 0.04 }}
                    className="p-4"
                  >
                    {isEditing ? (
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white">Edit Rule</h4>
                          <button
                            onClick={() => setEditingRule(null)}
                            className="rounded-lg p-1 text-gray-500 hover:text-white"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <RuleForm
                          initial={{
                            name: rule.name,
                            rule_type: rule.rule_type,
                            action: rule.action,
                            pattern: rule.pattern ?? '',
                          }}
                          onSubmit={handleUpdate}
                          onCancel={() => setEditingRule(null)}
                          submitLabel="Save Changes"
                          loading={submitting}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                            rule.enabled
                              ? 'border-primary-500/30 bg-primary-500/10 text-primary-400'
                              : 'border-[var(--token-border-muted)] bg-[var(--token-card-bg)] text-gray-500'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${rule.enabled ? 'text-white' : 'text-gray-500'}`}
                            >
                              {rule.name}
                            </span>
                            <span className="rounded-full bg-[var(--token-card-bg)] px-2 py-0.5 text-xs text-gray-400">
                              {typeMeta.label}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            {rule.pattern && (
                              <span className="max-w-[180px] truncate font-mono text-xs text-gray-500">
                                {rule.pattern}
                              </span>
                            )}
                            <span className={`text-xs ${actionMeta.color}`}>
                              {actionMeta.label}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingRule(rule);
                              setShowCreate(false);
                            }}
                            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-[var(--token-card-bg)] hover:text-white"
                            aria-label={`Edit ${rule.name}`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            disabled={deletingId === rule.id}
                            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                            aria-label={`Delete ${rule.name}`}
                          >
                            {deletingId === rule.id ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </button>
                          <ToggleSwitch
                            checked={rule.enabled}
                            onChange={() => handleToggle(rule)}
                            disabled={togglingId === rule.id}
                            ariaLabel={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.name}`}
                          />
                        </div>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </GlassCard>

      {/* Footer info */}
      {rules.length > 0 && (
        <p className="text-center text-xs text-gray-600">
          {rules.filter((r) => r.enabled).length} of {rules.length} rule
          {rules.length !== 1 ? 's' : ''} active
        </p>
      )}
    </motion.div>
  );
}
