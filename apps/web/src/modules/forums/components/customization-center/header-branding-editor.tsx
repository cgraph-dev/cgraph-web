
/**
 * Header & Branding Editor — Logo, header bg, title font, subtitle, favicon
 *
 */

import { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { str } from '@/lib/api-utils';

/** Safely extract a string from a draft record field, returning the fallback if not a string. */
function draftStr(draft: Record<string, unknown>, key: string, fallback = ''): string {
  return str(draft, key, fallback);
}

interface HeaderBrandingEditorProps {
  options: Record<string, unknown>;
  onSave: (changes: Record<string, unknown>) => void;
  saving: boolean;
}

const FONT_OPTIONS = [
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  'Poppins, sans-serif',
  'Roboto, sans-serif',
  'Playfair Display, serif',
  'Oswald, sans-serif',
  'Montserrat, sans-serif',
  'Source Code Pro, monospace',
];

/** Header Branding Editor component. */
export function HeaderBrandingEditor({ options, onSave, saving }: HeaderBrandingEditorProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setDraft({ ...options });
  }, [options]);

  const updateField = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div>
        <label className="mb-1 block text-xs text-white/50">Logo URL</label>
        <input
          type="url"
          value={draftStr(draft, 'logo_url')}
          onChange={(e) => updateField('logo_url', e.target.value)}
          placeholder="https://example.com/logo.png"
          className="w-full rounded border border-[var(--token-border-muted)] bg-white/5 px-2 py-1.5 text-sm text-white"
        />
        {!!draft.logo_url && (
          <div className="mt-2 inline-block rounded bg-white/5 p-2">
            <img
              src={draftStr(draft, 'logo_url')}
              alt="Logo preview"
              className="h-12 object-contain"
            />
          </div>
        )}
      </div>

      {/* Header Background */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-white/50">Header Background Image</label>
          <input
            type="url"
            value={draftStr(draft, 'header_background_url')}
            onChange={(e) => updateField('header_background_url', e.target.value)}
            placeholder="https://example.com/header-bg.jpg"
            className="w-full rounded border border-[var(--token-border-muted)] bg-white/5 px-2 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Header Background Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={draftStr(draft, 'header_background_color', '#1F2937')}
              onChange={(e) => updateField('header_background_color', e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-[var(--token-border-muted)]"
            />
            <input
              type="text"
              value={draftStr(draft, 'header_background_color', '#1F2937')}
              onChange={(e) => updateField('header_background_color', e.target.value)}
              className="flex-1 rounded border border-[var(--token-border-muted)] bg-white/5 px-2 py-1 text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* Title Font & Subtitle */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-white/50">Title Font</label>
          <select
            value={draftStr(draft, 'title_font', 'Inter, system-ui, sans-serif')}
            onChange={(e) => updateField('title_font', e.target.value)}
            className="w-full rounded border border-[var(--token-border-muted)] bg-white/5 px-2 py-1.5 text-sm text-white"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f.split(',')[0]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Subtitle</label>
          <input
            type="text"
            value={draftStr(draft, 'subtitle_text')}
            onChange={(e) => updateField('subtitle_text', e.target.value)}
            placeholder="Your forum subtitle"
            className="w-full rounded border border-[var(--token-border-muted)] bg-white/5 px-2 py-1.5 text-sm text-white"
          />
        </div>
      </div>

      {/* Favicon */}
      <div>
        <label className="mb-1 block text-xs text-white/50">Favicon URL</label>
        <input
          type="url"
          value={draftStr(draft, 'favicon_url')}
          onChange={(e) => updateField('favicon_url', e.target.value)}
          placeholder="https://example.com/favicon.ico"
          className="w-full rounded border border-[var(--token-border-muted)] bg-white/5 px-2 py-1.5 text-sm text-white"
        />
      </div>

      {/* Preview */}
      <div className="overflow-hidden rounded-lg border border-[var(--token-border-muted)]">
        <div
          className="p-4"
          style={{
            backgroundColor: draftStr(draft, 'header_background_color', '#1F2937'),
            backgroundImage: draft.header_background_url
              ? `url(${draft.header_background_url})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="flex items-center gap-3">
            {!!draft.logo_url && (
              <img src={draftStr(draft, 'logo_url')} alt="" className="h-10 object-contain" loading="lazy" />
            )}
            <div>
              <h3
                className="text-lg font-bold text-white"
                style={{
                  fontFamily: draftStr(draft, 'title_font', 'Inter, system-ui, sans-serif'),
                }}
              >
                Forum Title
              </h3>
              {!!draft.subtitle_text && (
                <p className="text-xs text-white/60">{String(draft.subtitle_text)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end border-t border-[var(--token-border-muted)] pt-4">
        <button
          onClick={() => onSave(draft)}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
        >
          <CheckIcon className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Header & Branding'}
        </button>
      </div>
    </div>
  );
}

export default HeaderBrandingEditor;
