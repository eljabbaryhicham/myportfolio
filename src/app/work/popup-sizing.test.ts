import { describe, expect, it } from 'vitest';
import {
  getDetailsSizing,
  getDetailsStyle,
  getMinimizedPopupSizing,
  getPopupSizing,
} from './popup-sizing';

const NO_FLAGS = { isExtraWide: false, isDescriptionLong: false };
const LONG_FLAGS = { isExtraWide: false, isDescriptionLong: true };
const WIDE_FLAGS = { isExtraWide: true, isDescriptionLong: false };
const BOTH_FLAGS = { isExtraWide: true, isDescriptionLong: true };

describe('getMinimizedPopupSizing', () => {
  it('uses max-h for short content (shrinks to fit)', () => {
    expect(getMinimizedPopupSizing(NO_FLAGS)).toBe(
      'w-[90vw] max-w-7xl max-h-[90dvh]'
    );
  });

  it('locks to h-[90dvh] when description is long', () => {
    expect(getMinimizedPopupSizing(LONG_FLAGS)).toBe(
      'w-[90vw] max-w-7xl h-[90dvh]'
    );
  });

  it('locks to h-[90dvh] when content is extra wide', () => {
    expect(getMinimizedPopupSizing(WIDE_FLAGS)).toBe(
      'w-[90vw] max-w-7xl h-[90dvh]'
    );
  });

  it('locks to h-[90dvh] when BOTH flags are set', () => {
    expect(getMinimizedPopupSizing(BOTH_FLAGS)).toBe(
      'w-[90vw] max-w-7xl h-[90dvh]'
    );
  });
});

describe('getPopupSizing (project dialog)', () => {
  it('forces 98vw / 98dvh / max-w-none when maximized', () => {
    expect(getPopupSizing(true, NO_FLAGS)).toBe('w-[98vw] h-[98dvh] max-w-none');
  });

  it('uses maximized size regardless of wide/long flags', () => {
    expect(getPopupSizing(true, BOTH_FLAGS)).toBe('w-[98vw] h-[98dvh] max-w-none');
  });

  it('falls through to minimized sizing when not maximized', () => {
    expect(getPopupSizing(false, NO_FLAGS)).toBe(
      'w-[90vw] max-w-7xl max-h-[90dvh]'
    );
  });

  it('passes long-content flag through to minimized sizing', () => {
    expect(getPopupSizing(false, LONG_FLAGS)).toBe(
      'w-[90vw] max-w-7xl h-[90dvh]'
    );
  });
});

describe('getDetailsSizing (details dialog)', () => {
  it('forces 98vw / 98dvh / max-w-none when maximized', () => {
    expect(getDetailsSizing(true, NO_FLAGS)).toBe('w-[98vw] h-[98dvh] max-w-none');
  });

  it('uses maximized size regardless of wide/long flags', () => {
    expect(getDetailsSizing(true, BOTH_FLAGS)).toBe('w-[98vw] h-[98dvh] max-w-none');
  });

  it('falls through to minimized sizing when not maximized', () => {
    expect(getDetailsSizing(false, NO_FLAGS)).toBe(
      'w-[90vw] max-w-7xl max-h-[90dvh]'
    );
  });

  it('passes long-content flag through to minimized sizing', () => {
    expect(getDetailsSizing(false, LONG_FLAGS)).toBe(
      'w-[90vw] max-w-7xl h-[90dvh]'
    );
  });

  it('keeps maximize states INDEPENDENT (project vs details)', () => {
    // This guards the regression where one popup's maximize leaked into the
    // other popup's sizing.
    expect(getPopupSizing(false, NO_FLAGS)).toBe(
      getDetailsSizing(false, NO_FLAGS)
    );
    expect(getPopupSizing(true, NO_FLAGS)).toBe(
      getDetailsSizing(true, NO_FLAGS)
    );
    // But project=false and details=true must differ.
    expect(getPopupSizing(false, NO_FLAGS)).not.toBe(
      getDetailsSizing(true, NO_FLAGS)
    );
  });
});

describe('getDetailsStyle (inline style for details dialog)', () => {
  it('forces 98vw / 98dvh / max-width none when maximized', () => {
    expect(getDetailsStyle(true, null)).toEqual({
      width: '98vw',
      height: '98dvh',
      maxWidth: 'none',
    });
  });

  it('forces 98vw / 98dvh / max-width none when maximized EVEN IF a captured size exists', () => {
    // Maximized must ignore the captured project size — otherwise the inline
    // style would override the className and the details would not reach
    // 98vw/98dvh.
    const captured = { w: 1883, h: 1060 };
    expect(getDetailsStyle(true, captured)).toEqual({
      width: '98vw',
      height: '98dvh',
      maxWidth: 'none',
    });
  });

  it('returns undefined when minimized and no size has been captured yet', () => {
    expect(getDetailsStyle(false, null)).toBeUndefined();
  });

  it('mirrors the captured pixel dimensions when minimized', () => {
    const captured = { w: 1883, h: 1060 };
    expect(getDetailsStyle(false, captured)).toEqual({
      width: '1883px',
      height: '1060px',
      minHeight: '1060px',
    });
  });

  it('includes minHeight equal to height so the scroll area never collapses', () => {
    const captured = { w: 500, h: 800 };
    const style = getDetailsStyle(false, captured);
    expect(style).toBeDefined();
    expect(style!.minHeight).toBe(style!.height);
  });
});
