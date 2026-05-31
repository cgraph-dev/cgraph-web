/**
 * Chat UI preference adapter.
 *
 * Runtime-neutral values and defaults live in @cgraph-dev/shared-types. Web
 * keeps this compatibility export for routed chat components.
 */

import { DEFAULT_CHAT_UI_PREFERENCES } from '@cgraph-dev/shared-types';
import type { ChatUiPreferences } from '@cgraph-dev/shared-types';

export type UIPreferences = ChatUiPreferences;

export const DEFAULT_UI_PREFERENCES: UIPreferences = DEFAULT_CHAT_UI_PREFERENCES;
