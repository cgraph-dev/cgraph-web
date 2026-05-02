/**
 * discoveryStore Unit Tests
 *
 * Tests for initial state, mode switching, community selection, and reset.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDiscoveryStore } from '../discoveryStore';
import type { FeedMode } from '../discoveryStore';
beforeEach(() => {
  useDiscoveryStore.getState().reset();
});
describe('discoveryStore', () => {
  describe('initial state', () => {
    it('defaults activeMode to pulse', () => {
      expect(useDiscoveryStore.getState().activeMode).toBe('pulse');
    });

    it('defaults selectedCommunityId to null', () => {
      expect(useDiscoveryStore.getState().selectedCommunityId).toBeNull();
    });
  });

  describe('setMode', () => {
    it.each<FeedMode>(['pulse', 'fresh', 'rising', 'deep_cut', 'frequency_surf'])(
      'sets activeMode to %s',
      (mode) => {
        useDiscoveryStore.getState().setMode(mode);
        expect(useDiscoveryStore.getState().activeMode).toBe(mode);
      }
    );

    it('does not affect selectedCommunityId', () => {
      useDiscoveryStore.getState().setCommunityId('community-1');
      useDiscoveryStore.getState().setMode('rising');
      expect(useDiscoveryStore.getState().selectedCommunityId).toBe('community-1');
    });
  });

  describe('setCommunityId', () => {
    it('sets a community id', () => {
      useDiscoveryStore.getState().setCommunityId('community-42');
      expect(useDiscoveryStore.getState().selectedCommunityId).toBe('community-42');
    });

    it('clears community id with null', () => {
      useDiscoveryStore.getState().setCommunityId('community-42');
      useDiscoveryStore.getState().setCommunityId(null);
      expect(useDiscoveryStore.getState().selectedCommunityId).toBeNull();
    });

    it('does not affect activeMode', () => {
      useDiscoveryStore.getState().setMode('deep_cut');
      useDiscoveryStore.getState().setCommunityId('community-1');
      expect(useDiscoveryStore.getState().activeMode).toBe('deep_cut');
    });
  });

  describe('reset', () => {
    it('restores activeMode to pulse', () => {
      useDiscoveryStore.getState().setMode('frequency_surf');
      useDiscoveryStore.getState().reset();
      expect(useDiscoveryStore.getState().activeMode).toBe('pulse');
    });

    it('restores selectedCommunityId to null', () => {
      useDiscoveryStore.getState().setCommunityId('community-99');
      useDiscoveryStore.getState().reset();
      expect(useDiscoveryStore.getState().selectedCommunityId).toBeNull();
    });

    it('resets both fields at once', () => {
      useDiscoveryStore.getState().setMode('rising');
      useDiscoveryStore.getState().setCommunityId('community-5');
      useDiscoveryStore.getState().reset();

      const state = useDiscoveryStore.getState();
      expect(state.activeMode).toBe('pulse');
      expect(state.selectedCommunityId).toBeNull();
    });
  });
});
