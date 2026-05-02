/**
 * Login form state, wallet connect, and submission logic.
 *
 * Supports 2FA login gate — when backend returns 2fa_required,
 * the form transitions to a TOTP code entry step.
 *
 * Uses wagmi/WalletConnect for multi-wallet support (MetaMask,
 * WalletConnect QR, Coinbase Wallet) instead of raw window.ethereum.
 *
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { useWalletConnect } from '@/lib/wallet';
import { createLogger } from '@/lib/logger';
import type { WalletConnectorType } from '@cgraph/shared-types';

const logger = createLogger('Login');

/** Which step of the login flow is active */
export type LoginStep = 'credentials' | '2fa';

/**
 * Hook for managing login form, including 2FA step and multi-wallet auth.
 */
export function useLoginForm() {
  const navigate = useNavigate();
  const { login, verifyLoginTwoFactor, isLoading, error, clearError } = useAuthStore();

  const { connectAndSign, connectors, isConnecting } = useWalletConnect();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA state
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);

  // Auto-dismiss error after 5 seconds (enough time to read)
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      clearError();
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  const handleSubmit = async (turnstileToken?: string | null): Promise<boolean> => {
    clearError();

    try {
      const result = await login(email, password, turnstileToken);

      // Backend requires 2FA — transition to TOTP form
      if (result?.twoFactorRequired) {
        setTwoFactorToken(result.twoFactorToken);
        setLoginStep('2fa');
        return true;
      }

      navigate('/messages');
      return true;
    } catch (error) {
      logger.warn('Login failed', error);
      return false;
    }
  };

  const handleVerifyTwoFactor = async (code: string) => {
    if (!twoFactorToken) return;
    clearError();

    try {
      await verifyLoginTwoFactor(twoFactorToken, code);
      navigate('/messages');
    } catch (error) {
      logger.warn('Two-factor verification failed', error);
    }
  };

  const handleBackToCredentials = () => {
    setLoginStep('credentials');
    setTwoFactorToken(null);
    clearError();
  };

  /**
   * Connect wallet via a specific connector type and complete SIWE auth.
   * Defaults to injected (MetaMask) if no type specified.
   */
  async function handleWalletConnect(connectorType?: WalletConnectorType) {
    clearError();
    try {
      await connectAndSign(connectorType);
      navigate('/messages');
    } catch (err) {
      logger.error('Wallet login error:', err);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading: isLoading || isConnecting,
    error,
    loginStep,
    twoFactorToken,
    handleSubmit,
    handleVerifyTwoFactor,
    handleBackToCredentials,
    handleWalletConnect,
    /** Available wallet connectors for the UI */
    walletConnectors: connectors,
  };
}
