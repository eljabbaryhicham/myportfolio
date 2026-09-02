import { describe, expect, it } from 'vitest';
import { isAllowedGumletImageOrigin } from './gumlet-image';

describe('Gumlet image origins', () => {
  it('allows configured domains and their subdomains only', () => {
    expect(isAllowedGumletImageOrigin('cdn.example.com', ['example.com'])).toBe(true);
    expect(isAllowedGumletImageOrigin('example.com', ['example.com'])).toBe(true);
    expect(isAllowedGumletImageOrigin('example.com.evil.test', ['example.com'])).toBe(false);
  });
});
