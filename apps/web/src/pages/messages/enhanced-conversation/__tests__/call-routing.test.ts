import { describe, expect, it } from 'vitest';

import { getDirectCallRoute } from '../call-routing';

describe('getDirectCallRoute', () => {
  it('builds the routed audio call destination for a direct recipient', () => {
    expect(getDirectCallRoute('user-1', 'audio')).toBe('/call/user-1/audio');
  });

  it('builds the routed video call destination for a direct recipient', () => {
    expect(getDirectCallRoute('user-1', 'video')).toBe('/call/user-1/video');
  });

  it('does not create an inert route without a recipient', () => {
    expect(getDirectCallRoute(null, 'audio')).toBeNull();
  });
});
