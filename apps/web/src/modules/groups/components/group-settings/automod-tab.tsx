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
import { Button, IconButton } from '@/components/ui/button';
import Card, { CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { FADE_UP } from '@/lib/animations/transitions';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { getGroupPermissionError } from '../../permission-errors';
import { ConfirmModal } from './confirm-modal';

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
  delete: { label: 'Delete Message', color: 'text-[var(--token-feedback-error)]' },
  warn: { label: 'Warn User', color: 'text-[var(--token-feedback-warning)]' },
  mute: { label: 'Mute User', color: 'text-[var(--token-feedback-warning)]' },
  flag_for_review: { label: 'Flag for Review', color: 'text-[var(--token-feedback-info)]' },
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
      <Input
        label="Rule name"
        type="text"
        placeholder="e.g. Block slurs, No invite links"
        value={form.name}
        onChange={(event) => setField('name', event.target.value)}
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-[var(--token-text-secondary)]">
          Rule type
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {RULE_TYPES.map((type) => {
            const meta = RULE_TYPE_META[type];
            const Icon = meta.icon;
            const active = form.rule_type === type;
            return (
              <label
                key={type}
                className="cgraph-list-row flex min-h-12 cursor-pointer items-center gap-2 px-3 py-2 text-sm"
                data-selected={active || undefined}
              >
                <input
                  type="radio"
                  name="automod-rule-type"
                  value={type}
                  checked={active}
                  onChange={() => setField('rule_type', type)}
                  className="sr-only"
                />
                <Icon className="h-4 w-4 shrink-0 text-[var(--token-interactive-primary)]" />
                <span className="font-medium">{meta.label}</span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-[var(--token-text-muted)]">{typeMeta.description}</p>
      </fieldset>

      <Input
        label={`Pattern / Config ${
          form.rule_type === 'spam_detection' || form.rule_type === 'caps_filter'
            ? '(optional)'
            : ''
        }`}
        type="text"
        placeholder={typeMeta.placeholder}
        value={form.pattern}
        onChange={(event) => setField('pattern', event.target.value)}
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-[var(--token-text-secondary)]">
          Action to take
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {RULE_ACTIONS.map((action) => {
            const meta = ACTION_META[action];
            const active = form.action === action;
            return (
              <label
                key={action}
                className="cgraph-list-row flex min-h-11 cursor-pointer items-center px-3 py-2 text-sm"
                data-selected={active || undefined}
              >
                <input
                  type="radio"
                  name="automod-rule-action"
                  value={action}
                  checked={active}
                  onChange={() => setField('action', action)}
                  className="sr-only"
                />
                <span className={meta.color}>{meta.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="rounded-[var(--product-radius-md)] border border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] px-3 py-2 text-xs text-[var(--token-feedback-error)]"
        >
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" animated={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          animated={false}
          onClick={handleSubmit}
          disabled={loading}
          isLoading={loading}
        >
          {submitLabel}
        </Button>
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
  const [pendingDeleteRule, setPendingDeleteRule] = useState<AutomodRule | null>(null);
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
      <div className="cgraph-page-header">
        <div>
          <p className="cgraph-eyebrow">Group settings</p>
          <h2 className="text-2xl font-bold text-[var(--token-text-primary)]">AutoMod</h2>
          <p className="mt-1 text-sm text-[var(--token-text-muted)]">
            Automatically moderate messages based on rules you define.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            icon={<ArrowPathIcon className={loading ? 'animate-spin' : ''} />}
            label="Refresh rules"
            onClick={fetchRules}
            disabled={loading}
          />
          <Button
            leftIcon={<PlusIcon />}
            animated={false}
            onClick={() => {
              setShowCreate(true);
              setEditingRule(null);
            }}
          >
            Add Rule
          </Button>
        </div>
      </div>

      {globalError && (
        <div
          role="alert"
          className="rounded-[var(--product-radius-md)] border border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] px-3 py-2 text-sm text-[var(--token-feedback-error)]"
        >
          {globalError}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <motion.div
            key="create-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card padding="lg">
              <CardHeader className="flex items-center justify-between gap-3">
                <CardTitle>New AutoMod Rule</CardTitle>
                <IconButton
                  icon={<XMarkIcon />}
                  label="Close new rule form"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                />
              </CardHeader>
              <RuleForm
                onSubmit={handleCreate}
                onCancel={() => setShowCreate(false)}
                submitLabel="Create Rule"
                loading={submitting}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <Skeleton shape="message" count={3} className="p-4" />
        ) : rules.length === 0 ? (
          <div className="cgraph-empty-state">
            <div className="cgraph-empty-icon">
              <ShieldExclamationIcon className="h-6 w-6" />
            </div>
            <h3>No AutoMod rules</h3>
            <p>No automod rules yet. Create one to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--product-line)]">
            <AnimatePresence initial={false}>
              {rules.map((rule) => {
                const typeMeta = RULE_TYPE_META[rule.rule_type];
                const actionMeta = ACTION_META[rule.action];
                const Icon = typeMeta.icon;
                const isEditing = editingRule?.id === rule.id;

                return (
                  <motion.li
                    key={rule.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    className="p-4"
                  >
                    {isEditing ? (
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-[var(--token-text-primary)]">
                            Edit Rule
                          </h4>
                          <IconButton
                            icon={<XMarkIcon />}
                            label={`Close ${rule.name} editor`}
                            size="sm"
                            onClick={() => setEditingRule(null)}
                          />
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
                      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                        <div className="cgraph-empty-icon mb-0 h-10 w-10 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                rule.enabled
                                  ? 'text-[var(--token-text-primary)]'
                                  : 'text-[var(--token-text-muted)]'
                              }`}
                            >
                              {rule.name}
                            </span>
                            <span className="cgraph-label-badge">{typeMeta.label}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            {rule.pattern && (
                              <span className="max-w-[180px] truncate font-mono text-xs text-[var(--token-text-muted)]">
                                {rule.pattern}
                              </span>
                            )}
                            <span className={`text-xs ${actionMeta.color}`}>
                              {actionMeta.label}
                            </span>
                          </div>
                        </div>

                        <div
                          className="ml-auto flex shrink-0 items-center gap-1"
                          role="toolbar"
                          aria-label={`${rule.name} actions`}
                        >
                          <IconButton
                            icon={<PencilIcon />}
                            label={`Edit ${rule.name}`}
                            size="sm"
                            onClick={() => {
                              setEditingRule(rule);
                              setShowCreate(false);
                            }}
                          />
                          <IconButton
                            icon={<TrashIcon />}
                            label={`Delete ${rule.name}`}
                            variant="danger"
                            size="sm"
                            onClick={() => setPendingDeleteRule(rule)}
                            disabled={deletingId === rule.id}
                            isLoading={deletingId === rule.id}
                          />
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => handleToggle(rule)}
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
      </Card>

      {rules.length > 0 && (
        <p className="text-center text-xs text-[var(--token-text-muted)]">
          {rules.filter((r) => r.enabled).length} of {rules.length} rule
          {rules.length !== 1 ? 's' : ''} active
        </p>
      )}

      {pendingDeleteRule && (
        <ConfirmModal
          title="Delete AutoMod rule"
          message={`Delete ${pendingDeleteRule.name}? This rule will stop moderating new messages.`}
          confirmLabel="Delete rule"
          danger
          onClose={() => setPendingDeleteRule(null)}
          onConfirm={() => {
            const ruleId = pendingDeleteRule.id;
            setPendingDeleteRule(null);
            void handleDelete(ruleId);
          }}
        />
      )}
    </motion.div>
  );
}
