import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ROUTED_SOURCE_DIRS = ['pages', 'modules', 'shared', 'layouts'];
const SOURCE_FILE_PATTERN = /\.(ts|tsx)$/;
const IGNORED_SEGMENTS = new Set(['__tests__', '__mocks__']);

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (IGNORED_SEGMENTS.has(entry)) return [];
      return listSourceFiles(path);
    }
    return SOURCE_FILE_PATTERN.test(entry) ? [path] : [];
  });
}

describe('route inventory hygiene', () => {
  it('does not ship literal coming-soon panels in routed web source', () => {
    const offenders = ROUTED_SOURCE_DIRS.flatMap((dir) => listSourceFiles(join(WEB_SRC, dir)))
      .map((file) => ({
        file,
        source: readFileSync(file, 'utf8'),
      }))
      .filter(({ source }) => /coming soon/i.test(source))
      .map(({ file }) => file.replace(`${WEB_SRC}/`, 'src/'));

    expect(offenders).toEqual([]);
  });

  it('keeps password recovery inside the shared auth layout and store boundary', () => {
    const authRoutes = readFileSync(join(WEB_SRC, 'routes/route-groups/auth-routes.tsx'), 'utf8');
    const resetPage = readFileSync(join(WEB_SRC, 'pages/auth/reset-password.tsx'), 'utf8');
    const forgotPage = readFileSync(join(WEB_SRC, 'pages/auth/forgot-password.tsx'), 'utf8');

    expect(authRoutes).toMatch(
      /path="\/reset-password"[\s\S]*?<AuthLayout>[\s\S]*?<ResetPassword \/>/
    );
    expect(resetPage).toContain('state.resetPassword');
    expect(forgotPage).toContain('state.requestPasswordReset');
    expect(resetPage).not.toContain('apiClient.auth');
    expect(forgotPage).not.toContain('apiClient.auth');
  });

  it('does not expose a remember-me control without a persistence contract', () => {
    const loginFields = readFileSync(
      join(WEB_SRC, 'pages/auth/login/login-form-fields.tsx'),
      'utf8'
    );

    expect(loginFields).not.toContain("t('login.remember_me')");
    expect(loginFields).not.toContain('type="checkbox"');
  });

  it('keeps the Turnstile provider responsive inside narrow auth cards', () => {
    const turnstileWidget = readFileSync(
      join(WEB_SRC, 'modules/auth/components/turnstile-widget.tsx'),
      'utf8'
    );

    expect(turnstileWidget).toContain("size = 'flexible'");
    expect(turnstileWidget).toContain('w-full min-w-0 flex-col');
    expect(turnstileWidget).toContain('overflow-hidden');
    expect(turnstileWidget).toContain('className="w-full max-w-[300px]"');
  });
});
