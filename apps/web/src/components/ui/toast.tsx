import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { create } from 'zustand';
import { IconButton } from './button';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  readonly id: string;
  readonly type: ToastType;
  readonly title: string;
  readonly message?: string;
  readonly duration?: number;
}

interface ToastStore {
  readonly toasts: readonly Toast[];
  readonly addToast: (toast: Omit<Toast, 'id'>) => void;
  readonly removeToast: (id: string) => void;
}

interface ToastOptions {
  readonly duration?: number;
}

const DEFAULT_DURATION = 5000;
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();
let toastSequence = 0;

function createToastId(): string {
  toastSequence += 1;
  return `toast-${Date.now()}-${toastSequence}`;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = createToastId();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    const duration = toast.duration ?? DEFAULT_DURATION;
    if (duration > 0) {
      toastTimers.set(
        id,
        setTimeout(() => useToastStore.getState().removeToast(id), duration)
      );
    }
  },
  removeToast: (id) => {
    const timer = toastTimers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      toastTimers.delete(id);
    }
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
}));

function addToast(
  type: ToastType,
  title: string,
  messageOrOptions?: string | ToastOptions,
  options?: ToastOptions
): void {
  const message = typeof messageOrOptions === 'string' ? messageOrOptions : undefined;
  const duration =
    typeof messageOrOptions === 'string' ? options?.duration : messageOrOptions?.duration;

  useToastStore.getState().addToast({ type, title, message, duration });
}

export const toast = {
  success: (title: string, messageOrOptions?: string | ToastOptions, options?: ToastOptions) =>
    addToast('success', title, messageOrOptions, options),
  error: (title: string, messageOrOptions?: string | ToastOptions, options?: ToastOptions) =>
    addToast('error', title, messageOrOptions, options),
  warning: (title: string, messageOrOptions?: string | ToastOptions, options?: ToastOptions) =>
    addToast('warning', title, messageOrOptions, options),
  info: (title: string, messageOrOptions?: string | ToastOptions, options?: ToastOptions) =>
    addToast('info', title, messageOrOptions, options),
};

const TYPE_CONFIG = {
  success: { icon: CircleCheck, role: 'status', live: 'polite' },
  error: { icon: CircleX, role: 'alert', live: 'assertive' },
  warning: { icon: TriangleAlert, role: 'alert', live: 'assertive' },
  info: { icon: Info, role: 'status', live: 'polite' },
} as const;

interface ToastItemProps {
  readonly toast: Toast;
  readonly onRemove: () => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const config = TYPE_CONFIG[toast.type];
  const Icon = config.icon;
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      layout="position"
      initial={prefersReducedMotion ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 360, damping: 32, mass: 0.8 }
      }
      className="cgraph-toast"
      data-cgraph-material="raised"
      data-cgraph-surface="toast"
      data-cgraph-variant={toast.type}
    >
      <Icon className="cgraph-toast-icon" aria-hidden="true" />
      <div
        className="min-w-0"
        role={config.role}
        aria-live={config.live}
        aria-atomic="true"
      >
        <p className="cgraph-toast-title">{toast.title}</p>
        {toast.message ? <p className="cgraph-toast-message">{toast.message}</p> : null}
      </div>
      <IconButton
        className="cgraph-toast-dismiss"
        icon={<X />}
        label="Dismiss notification"
        size="sm"
        onClick={onRemove}
      />
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <section className="cgraph-toast-stack" aria-label="Notifications">
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onRemove={() => removeToast(item.id)} />
        ))}
      </AnimatePresence>
    </section>
  );
}

export default ToastContainer;
