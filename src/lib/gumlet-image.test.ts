import { describe, expect, it } from 'vitest';
import { gumletImageDeliveryFormatUrl, isAllowedGumletImageOrigin } from './gumlet-image';

describe('Gumlet image origins', () => {
  it('allows configured domains and their subdomains only', () => {
    expect(isAllowedGumletImageOrigin('cdn.example.com', ['example.com'])).toBe(true);
    expect(isAllowedGumletImageOrigin('example.com', ['example.com'])).toBe(true);
    expect(isAllowedGumletImageOrigin('example.com.evil.test', ['example.com'])).toBe(false);
  });

  it('swaps the delivery format query parameter', () => {
    const url = 'https://img.example.com/a.png?format=auto&w=100';
    expect(gumletImageDeliveryFormatUrl(url, 'webp')).toBe('https://img.example.com/a.png?format=webp&w=100');
  });
});
