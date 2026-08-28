import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_LOCALES,
  createMultilingualString,
  ensureMultilingualString,
  getLocalizedString,
  getDefaultLocale,
} from './multilingual';

describe('multilingual helpers', () => {
  describe('SUPPORTED_LOCALES / getDefaultLocale', () => {
    it('declares exactly en and fr', () => {
      expect(SUPPORTED_LOCALES).toEqual(['en', 'fr']);
    });
    it('defaults to English', () => {
      expect(getDefaultLocale()).toBe('en');
    });
  });

  describe('getLocalizedString', () => {
    it('returns "" for null/undefined', () => {
      expect(getLocalizedString(undefined, 'en')).toBe('');
      expect(getLocalizedString(null as any, 'en')).toBe('');
    });

    it('passes plain strings straight through', () => {
      expect(getLocalizedString('hello', 'en')).toBe('hello');
      expect(getLocalizedString('bonjour', 'fr')).toBe('bonjour');
    });

    it('returns the requested locale first', () => {
      const v = createMultilingualString('hello', 'bonjour');
      expect(getLocalizedString(v, 'en')).toBe('hello');
      expect(getLocalizedString(v, 'fr')).toBe('bonjour');
    });

    it('falls back to the target locale when the requested one is empty', () => {
      const v = { en: 'hello', fr: '' };
      expect(getLocalizedString(v, 'fr')).toBe('hello');
    });

    it('falls back to a custom fallback locale', () => {
      const v = { en: 'hello' };
      expect(getLocalizedString(v, 'fr', 'en')).toBe('hello');
    });

    it('returns "" when neither locale is filled', () => {
      expect(getLocalizedString({ en: '', fr: '' }, 'en')).toBe('');
    });
  });

  describe('createMultilingualString', () => {
    it('builds both keys from args', () => {
      expect(createMultilingualString('en', 'fr')).toEqual({ en: 'en', fr: 'fr' });
    });
    it('defaults both keys to empty strings', () => {
      expect(createMultilingualString()).toEqual({ en: '', fr: '' });
    });
  });

  describe('ensureMultilingualString', () => {
    it('normalises undefined to both-empty', () => {
      expect(ensureMultilingualString(undefined)).toEqual({ en: '', fr: '' });
    });
    it('normalises a plain string into en-only', () => {
      expect(ensureMultilingualString('solo')).toEqual({ en: 'solo', fr: '' });
    });
    it('coerces optional fields to strings and drops undefined', () => {
      expect(ensureMultilingualString({ en: 'a', fr: undefined })).toEqual({ en: 'a', fr: '' });
      expect(ensureMultilingualString({ en: undefined, fr: 'b' })).toEqual({ en: '', fr: 'b' });
    });
  });
});
