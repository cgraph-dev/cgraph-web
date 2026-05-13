import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
  type ReactElement,
} from 'react';

const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileTheme = 'auto' | 'light' | 'dark';
type TurnstileSize = 'normal' | 'compact' | 'flexible';
type TurnstileStatus = 'idle' | 'loading' | 'ready' | 'error' | 'disabled';

interface TurnstileRenderOptions {
  sitekey: string;
  theme: TurnstileTheme;
  size: TurnstileSize;
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
  'unsupported-callback': () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface TurnstileWidgetHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  readonly ref?: Ref<TurnstileWidgetHandle>;
  readonly onTokenChange: (token: string | null) => void;
  readonly onError?: () => void;
  readonly resetSignal?: number;
  readonly theme?: TurnstileTheme;
  readonly size?: TurnstileSize;
  readonly className?: string;
}

let scriptPromise: Promise<void> | null = null;

/**
 * Returns whether the frontend has a Turnstile site key configured.
 */
export function isTurnstileEnabled(): boolean {
  if (import.meta.env.VITE_E2E_AUTH_BYPASS === 'true') {
    return false;
  }

  return Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Turnstile is only available in the browser'));
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Turnstile failed to load')),
        {
          once: true,
        }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Turnstile failed to load')), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Renders a Cloudflare Turnstile widget and exposes an imperative reset handle.
 */
export function TurnstileWidget({
  ref,
  onTokenChange,
  onError,
  resetSignal,
  theme = 'dark',
  size = 'normal',
  className = '',
}: TurnstileWidgetProps): ReactElement | null {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const onErrorRef = useRef(onError);
  const [status, setStatus] = useState<TurnstileStatus>('idle');
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
    onErrorRef.current = onError;
  }, [onError, onTokenChange]);

  const resetWidget = useCallback(() => {
    onTokenChangeRef.current(null);

    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  useImperativeHandle(ref, () => ({ reset: resetWidget }), [resetWidget]);

  useEffect(() => {
    if (!siteKey) {
      setStatus('disabled');
      onTokenChangeRef.current(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          callback: (token) => {
            setStatus('ready');
            onTokenChangeRef.current(token);
          },
          'expired-callback': () => {
            onTokenChangeRef.current(null);
          },
          'error-callback': () => {
            setStatus('error');
            onTokenChangeRef.current(null);
            onErrorRef.current?.();
          },
          'unsupported-callback': () => {
            setStatus('error');
            onTokenChangeRef.current(null);
            onErrorRef.current?.();
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          onTokenChangeRef.current(null);
          onErrorRef.current?.();
        }
      });

    return () => {
      cancelled = true;
      onTokenChangeRef.current(null);

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, size, theme]);

  useEffect(() => {
    if (resetSignal === undefined) {
      return;
    }

    resetWidget();
  }, [resetSignal, resetWidget]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className={`flex min-h-[65px] justify-center ${className}`} data-status={status}>
      <div ref={containerRef} />
    </div>
  );
}
