import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Plus, Save, ShieldAlert, X } from 'lucide-react';
import { createLogger } from '@/lib/logger';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  IconButton,
  Input,
  Skeleton,
  Switch,
  toast,
} from '@/shared/components/ui';
import { Select as FieldSelect } from '@/components/ui/input';

const logger = createLogger('ForumAutomodSettings');

interface ForumAutomodSettingsProps {
  forumId: string;
}

interface AutomodRules {
  word_filter: {
    enabled: boolean;
    banned_words: string[];
    action: string;
  };
  link_filter: {
    enabled: boolean;
    whitelist: string[];
    blacklist: string[];
    block_all_links: boolean;
    action: string;
  };
  spam_detection: {
    enabled: boolean;
    max_posts_per_minute: number;
    max_duplicate_content: number;
    action: string;
  };
  caps_filter: {
    enabled: boolean;
    max_caps_percentage: number;
    min_length: number;
    action: string;
  };
}

const DEFAULT_RULES: AutomodRules = {
  word_filter: { enabled: false, banned_words: [], action: 'flag' },
  link_filter: {
    enabled: false,
    whitelist: [],
    blacklist: [],
    block_all_links: false,
    action: 'flag',
  },
  spam_detection: {
    enabled: false,
    max_posts_per_minute: 3,
    max_duplicate_content: 2,
    action: 'block',
  },
  caps_filter: { enabled: false, max_caps_percentage: 70, min_length: 10, action: 'flag' },
};

const ACTION_OPTIONS = [
  { value: 'flag', label: 'Flag for review' },
  { value: 'block', label: 'Block posting' },
  { value: 'shadow_ban', label: 'Shadow ban' },
] as const;

type AutomodRuleResponse = {
  [Key in keyof AutomodRules]?: Partial<AutomodRules[Key]>;
};

function mergeAutomodRules(response: AutomodRuleResponse): AutomodRules {
  return {
    word_filter: { ...DEFAULT_RULES.word_filter, ...response.word_filter },
    link_filter: { ...DEFAULT_RULES.link_filter, ...response.link_filter },
    spam_detection: { ...DEFAULT_RULES.spam_detection, ...response.spam_detection },
    caps_filter: { ...DEFAULT_RULES.caps_filter, ...response.caps_filter },
  };
}

export default function ForumAutomodSettings({ forumId }: ForumAutomodSettingsProps) {
  const [rules, setRules] = useState<AutomodRules>(DEFAULT_RULES);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const [domainInput, setDomainInput] = useState('');

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      const { api: http } = await import('@/lib/api');
      const response = await http.get(`/api/v1/forums/${forumId}/moderation/automod`);
      if (response.data?.data) {
        setRules(mergeAutomodRules(response.data.data));
      }
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'loadAutomod');
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [forumId]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const { api: http } = await import('@/lib/api');
      await http.put(`/api/v1/forums/${forumId}/moderation/automod`, rules);
      toast.success('Automod rules saved');
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'saveAutomod');
      toast.error('Failed to save automod rules');
    } finally {
      setIsSaving(false);
    }
  }

  function updateFilter<K extends keyof AutomodRules>(
    filter: K,
    updates: Partial<AutomodRules[K]>
  ) {
    setRules((previous) => ({
      ...previous,
      [filter]: { ...previous[filter], ...updates },
    }));
  }

  function addBannedWord() {
    const word = wordInput.trim().toLowerCase();
    if (!word || rules.word_filter.banned_words.includes(word)) return;

    updateFilter('word_filter', {
      banned_words: [...rules.word_filter.banned_words, word],
    });
    setWordInput('');
  }

  function removeBannedWord(word: string) {
    updateFilter('word_filter', {
      banned_words: rules.word_filter.banned_words.filter((item) => item !== word),
    });
  }

  function addBlacklistDomain() {
    const domain = domainInput.trim().toLowerCase();
    if (!domain || rules.link_filter.blacklist.includes(domain)) return;

    updateFilter('link_filter', {
      blacklist: [...rules.link_filter.blacklist, domain],
    });
    setDomainInput('');
  }

  function removeBlacklistDomain(domain: string) {
    updateFilter('link_filter', {
      blacklist: rules.link_filter.blacklist.filter((item) => item !== domain),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading automod settings">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} shape="card" />
        ))}
      </div>
    );
  }

  if (loadFailed) {
    return (
      <Alert variant="error">
        <AlertTitle>Automod settings unavailable</AlertTitle>
        <AlertDescription>
          <p>Check the connection and try loading the moderation rules again.</p>
          <Button className="mt-3" variant="secondary" onClick={() => void loadRules()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <FilterSection
        title="Word filter"
        description="Flag or block posts containing banned words."
        enabled={rules.word_filter.enabled}
        onToggle={(enabled) => updateFilter('word_filter', { enabled })}
        action={rules.word_filter.action}
        onActionChange={(action) => updateFilter('word_filter', { action })}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={wordInput}
            onChange={(event) => setWordInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addBannedWord();
              }
            }}
            placeholder="Add banned word"
          />
          <Button
            variant="secondary"
            leftIcon={<Plus aria-hidden="true" />}
            disabled={!wordInput.trim()}
            onClick={addBannedWord}
          >
            Add
          </Button>
        </div>
        <RuleTags
          values={rules.word_filter.banned_words}
          emptyLabel="No banned words"
          onRemove={removeBannedWord}
        />
      </FilterSection>

      <FilterSection
        title="Link filter"
        description="Control which links are allowed in posts."
        enabled={rules.link_filter.enabled}
        onToggle={(enabled) => updateFilter('link_filter', { enabled })}
        action={rules.link_filter.action}
        onActionChange={(action) => updateFilter('link_filter', { action })}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--token-text-primary)]">Block all links</p>
            <p className="text-xs text-[var(--token-text-muted)]">
              Ignore the domain list and reject every link.
            </p>
          </div>
          <Switch
            checked={rules.link_filter.block_all_links}
            onCheckedChange={(block_all_links) =>
              updateFilter('link_filter', { block_all_links })
            }
            ariaLabel="Block all links"
          />
        </div>
        {!rules.link_filter.block_all_links && (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={domainInput}
                onChange={(event) => setDomainInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addBlacklistDomain();
                  }
                }}
                placeholder="Add blacklisted domain"
              />
              <Button
                variant="secondary"
                leftIcon={<Plus aria-hidden="true" />}
                disabled={!domainInput.trim()}
                onClick={addBlacklistDomain}
              >
                Add
              </Button>
            </div>
            <RuleTags
              values={rules.link_filter.blacklist}
              emptyLabel="No blacklisted domains"
              onRemove={removeBlacklistDomain}
            />
          </>
        )}
      </FilterSection>

      <FilterSection
        title="Spam detection"
        description="Apply rate and duplicate-content limits."
        enabled={rules.spam_detection.enabled}
        onToggle={(enabled) => updateFilter('spam_detection', { enabled })}
        action={rules.spam_detection.action}
        onActionChange={(action) => updateFilter('spam_detection', { action })}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Maximum posts per minute"
            type="number"
            min={1}
            value={rules.spam_detection.max_posts_per_minute}
            onChange={(event) =>
              updateFilter('spam_detection', {
                max_posts_per_minute: Number(event.target.value),
              })
            }
          />
          <Input
            label="Maximum duplicate posts"
            type="number"
            min={1}
            value={rules.spam_detection.max_duplicate_content}
            onChange={(event) =>
              updateFilter('spam_detection', {
                max_duplicate_content: Number(event.target.value),
              })
            }
          />
        </div>
      </FilterSection>

      <FilterSection
        title="Caps filter"
        description="Detect excessive capitalization."
        enabled={rules.caps_filter.enabled}
        onToggle={(enabled) => updateFilter('caps_filter', { enabled })}
        action={rules.caps_filter.action}
        onActionChange={(action) => updateFilter('caps_filter', { action })}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Maximum caps percentage"
            type="number"
            min={0}
            max={100}
            value={rules.caps_filter.max_caps_percentage}
            onChange={(event) =>
              updateFilter('caps_filter', {
                max_caps_percentage: Number(event.target.value),
              })
            }
          />
          <Input
            label="Minimum text length"
            type="number"
            min={1}
            value={rules.caps_filter.min_length}
            onChange={(event) =>
              updateFilter('caps_filter', { min_length: Number(event.target.value) })
            }
          />
        </div>
      </FilterSection>

      <div className="flex justify-end border-t border-[var(--product-line)] pt-4">
        <Button
          className="min-w-44"
          leftIcon={<Save aria-hidden="true" />}
          isLoading={isSaving}
          onClick={() => void handleSave()}
        >
          {isSaving ? 'Saving…' : 'Save Automod Rules'}
        </Button>
      </div>
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  action: string;
  onActionChange: (action: string) => void;
  children: ReactNode;
}

function FilterSection({
  title,
  description,
  enabled,
  onToggle,
  action,
  onActionChange,
  children,
}: FilterSectionProps) {
  const switchLabel = `${enabled ? 'Disable' : 'Enable'} ${title}`;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <ShieldAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--token-interactive-primary)]"
            aria-hidden="true"
          />
          <div>
            <h4 className="font-semibold text-[var(--token-text-primary)]">{title}</h4>
            <p className="text-sm text-[var(--token-text-muted)]">{description}</p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          ariaLabel={switchLabel}
          className="shrink-0"
        />
      </div>

      {enabled && (
        <div className="mt-4 space-y-4 border-t border-[var(--product-line)] pt-4">
          <FieldSelect
            label="Action"
            value={action}
            onChange={(event) => onActionChange(event.target.value)}
            options={ACTION_OPTIONS}
          />
          {children}
        </div>
      )}
    </Card>
  );
}

function RuleTags({
  values,
  emptyLabel,
  onRemove,
}: {
  values: readonly string[];
  emptyLabel: string;
  onRemove: (value: string) => void;
}) {
  if (values.length === 0) {
    return <p className="text-sm text-[var(--token-text-muted)]">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} variant="secondary" className="gap-1 pl-2.5 pr-1">
          <span className="max-w-56 truncate">{value}</span>
          <IconButton
            size="sm"
            variant="ghost"
            icon={<X aria-hidden="true" />}
            label={`Remove ${value}`}
            onClick={() => onRemove(value)}
          />
        </Badge>
      ))}
    </div>
  );
}
