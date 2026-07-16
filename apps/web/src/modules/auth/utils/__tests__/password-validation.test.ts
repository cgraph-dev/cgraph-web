/**
 * Password Validation Tests
 *
 * Tests for the shared password complexity validation utility.
 */

import { describe, it, expect } from 'vitest';
import { validatePassword } from '../password-validation';

describe('validatePassword', () => {
  describe('valid passwords', () => {
    it('accepts a password meeting all requirements', () => {
      const result = validatePassword('Abcdef1!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts a long complex password', () => {
      const result = validatePassword('MyStr0ng!Password#2026');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts various special characters', () => {
      const specials = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', ',', '.', '?', '"', ':', '{', '}', '|', '<', '>'];
      for (const char of specials) {
        const result = validatePassword(`Abcdef1${char}`);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('too short', () => {
    it('rejects a password shorter than 8 characters', () => {
      const result = validatePassword('Ab1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('rejects a 7-character password', () => {
      const result = validatePassword('Abcde1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('rejects an empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });
  });

  describe('too long', () => {
    it('rejects passwords beyond the backend Argon2 input limit', () => {
      const result = validatePassword(`Aa1!${'x'.repeat(69)}`);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at most 72 characters');
    });
  });

  describe('missing lowercase', () => {
    it('rejects a password with no lowercase letter', () => {
      const result = validatePassword('ABCDEF1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must contain a lowercase letter');
    });
  });

  describe('missing uppercase', () => {
    it('rejects a password with no uppercase letter', () => {
      const result = validatePassword('abcdef1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must contain an uppercase letter');
    });
  });

  describe('missing digit', () => {
    it('rejects a password with no number', () => {
      const result = validatePassword('Abcdefg!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must contain a number');
    });
  });

  describe('missing special character', () => {
    it('rejects a password with no special character', () => {
      const result = validatePassword('Abcdef12');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must contain a special character (!@#$%^&*)');
    });
  });

  describe('multiple violations', () => {
    it('reports all errors for a totally invalid password', () => {
      const result = validatePassword('abc');
      expect(result.isValid).toBe(false);
      // Should have: too short, no uppercase, no digit, no special
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });

    it('reports multiple errors for numeric-only input', () => {
      const result = validatePassword('12345678');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must contain a lowercase letter');
      expect(result.errors).toContain('Must contain an uppercase letter');
      expect(result.errors).toContain('Must contain a special character (!@#$%^&*)');
    });
  });
});
