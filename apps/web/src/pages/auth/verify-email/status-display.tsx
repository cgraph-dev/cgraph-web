/**
 * Status display views for email verification outcomes.
 *
 * Renders verifying spinner, success, already-verified, expired, and error states.
 *
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { FormEvent } from 'react';
import type { VerificationState } from '@/pages/auth/verify-email/useVerifyEmail';
import { containerVariants, itemVariants } from '@/pages/auth/verify-email/animations';
import { springs } from '@/lib/animation-presets';

interface StatusDisplayProps {
  state: VerificationState;
  isResending: boolean;
  resendSuccess: boolean;
  resendEmail: string;
  resendError: string | null;
  isResendEmailEditable: boolean;
  onResendEmailChange: (email: string) => void;
  onResend: () => void;
  onNavigate: (path: string) => void;
}

function VerifyingView() {
  return (
    <div className="flex flex-col items-center py-12">
      <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      <p className="text-gray-400">Verifying your email...</p>
    </div>
  );
}

function SuccessView({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-8 text-center"
    >
      <motion.div
        variants={itemVariants}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...springs.wobbly, delay: 0.2 }}
        className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20 text-green-400"
      >
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <motion.h2 variants={itemVariants} className="mb-2 text-2xl font-bold text-white">
        Email Verified!
      </motion.h2>

      <motion.p variants={itemVariants} className="mb-8 text-gray-400">
        Your email has been successfully verified. You now have full access to all features.
      </motion.p>

      <motion.div variants={itemVariants} className="space-y-3">
        <button
          type="button"
          onClick={() => onNavigate('/messages')}
          className="shadow-primary-500/25 hover:shadow-primary-500/40 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg transition-all hover:scale-[1.02]"
        >
          Continue to App
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );
}

function AlreadyVerifiedView({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-8 text-center"
    >
      <motion.div
        variants={itemVariants}
        className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/20 text-blue-400"
      >
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </motion.div>

      <motion.h2 variants={itemVariants} className="mb-2 text-2xl font-bold text-white">
        Already Verified
      </motion.h2>

      <motion.p variants={itemVariants} className="mb-8 text-gray-400">
        Your email has already been verified. You&apos;re all set!
      </motion.p>

      <motion.button
        variants={itemVariants}
        onClick={() => onNavigate('/messages')}
        className="shadow-primary-500/25 hover:shadow-primary-500/40 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 px-8 py-3 font-medium text-white shadow-lg transition-all hover:scale-[1.02]"
      >
        Go to App
      </motion.button>
    </motion.div>
  );
}

function ExpiredView({
  isResending,
  resendSuccess,
  resendEmail,
  resendError,
  isResendEmailEditable,
  onResendEmailChange,
  onResend,
  title = 'Link Expired',
  description =
    'This verification link has expired or was replaced. Request a new one and use only the newest link.',
  backLinkLabel = 'Back to Login',
}: {
  isResending: boolean;
  resendSuccess: boolean;
  resendEmail: string;
  resendError: string | null;
  isResendEmailEditable: boolean;
  onResendEmailChange: (email: string) => void;
  onResend: () => void;
  title?: string;
  description?: string;
  backLinkLabel?: string;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onResend();
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-8 text-center"
    >
      <motion.div
        variants={itemVariants}
        className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400"
      >
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </motion.div>

      <motion.h2 variants={itemVariants} className="mb-2 text-2xl font-bold text-white">
        {title}
      </motion.h2>

      <motion.p variants={itemVariants} className="mb-8 text-gray-400">
        {description}
      </motion.p>

      <motion.div variants={itemVariants} className="space-y-3">
        {resendSuccess ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-400">
            <p className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Verification request received
            </p>
            <p className="mt-1 text-sm text-green-400/70">
              If an unverified CGraph account matches this address, use the newest link we send.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-left text-sm font-medium text-white/75" htmlFor="email">
              {isResendEmailEditable ? 'Email address' : 'Verification email address'}
            </label>
            {!isResendEmailEditable && (
              <p className="text-left text-sm text-gray-400">
                This is the email address for your signed-in account.
              </p>
            )}
            <input
              id="email"
              type="email"
              value={resendEmail}
              onChange={(event) => onResendEmailChange(event.target.value)}
              disabled={isResending}
              readOnly={!isResendEmailEditable}
              aria-readonly={!isResendEmailEditable}
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="you@example.com"
            />
            {resendError && <p className="text-left text-sm text-red-300">{resendError}</p>}
            <button
              type="submit"
              disabled={isResending}
              className="shadow-primary-500/25 hover:shadow-primary-500/40 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Resend Verification Email
                </>
              )}
            </button>
          </form>
        )}

        <Link to="/login" className="block py-2 text-gray-400 transition-colors hover:text-white">
          {backLinkLabel}
        </Link>
      </motion.div>
    </motion.div>
  );
}

function ErrorView() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-8 text-center"
    >
      <motion.div
        variants={itemVariants}
        className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 text-red-400"
      >
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </motion.div>

      <motion.h2 variants={itemVariants} className="mb-2 text-2xl font-bold text-white">
        Verification Failed
      </motion.h2>

      <motion.p variants={itemVariants} className="mb-8 text-gray-400">
        We couldn&apos;t verify your email. The link may be invalid or corrupted.
      </motion.p>

      <motion.div variants={itemVariants} className="space-y-3">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-600"
        >
          Back to Login
        </Link>
      </motion.div>
    </motion.div>
  );
}

/**
 * Status Display component.
 */
export default function StatusDisplay({
  state,
  isResending,
  resendSuccess,
  resendEmail,
  resendError,
  isResendEmailEditable,
  onResendEmailChange,
  onResend,
  onNavigate,
}: StatusDisplayProps) {
  switch (state) {
    case 'verifying':
      return <VerifyingView />;
    case 'success':
      return <SuccessView onNavigate={onNavigate} />;
    case 'already-verified':
      return <AlreadyVerifiedView onNavigate={onNavigate} />;
    case 'pending':
      return (
        <ExpiredView
          title="Check your email"
          description="Verify your email before entering the app. You can request a fresh verification link here."
          backLinkLabel="Use a different account"
          isResending={isResending}
          resendSuccess={resendSuccess}
          resendEmail={resendEmail}
          resendError={resendError}
          isResendEmailEditable={isResendEmailEditable}
          onResendEmailChange={onResendEmailChange}
          onResend={onResend}
        />
      );
    case 'expired':
      return (
        <ExpiredView
          isResending={isResending}
          resendSuccess={resendSuccess}
          resendEmail={resendEmail}
          resendError={resendError}
          isResendEmailEditable={isResendEmailEditable}
          onResendEmailChange={onResendEmailChange}
          onResend={onResend}
        />
      );
    case 'error':
    default:
      return <ErrorView />;
  }
}
