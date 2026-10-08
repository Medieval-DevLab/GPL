import { describe, it, expect } from 'vitest';
import { CHECKS } from './checks';

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe('quick checks (D-089)', () => {
  it('has a real answer and a short reason for every check', () => {
    for (const [id, c] of Object.entries(CHECKS)) {
      expect(c.options.length, id).toBeGreaterThanOrEqual(2);
      expect(c.answer, id).toBeGreaterThanOrEqual(0);
      expect(c.answer, id).toBeLessThan(c.options.length);
      expect(words(c.prompt), id + ' prompt').toBeLessThanOrEqual(25);
      expect(words(c.why), id + ' why').toBeLessThanOrEqual(30);
      if (c.kind === 'truefalse') expect(c.options).toEqual(['True', 'False']);
      if (c.kind === 'bar') expect(c.options).toEqual(['Win', 'Worth', 'Deliver']);
    }
  });

  it('never repeats the answer as the first word of its reason', () => {
    for (const [id, c] of Object.entries(CHECKS)) expect(c.why.startsWith(c.options[c.answer]), id).toBe(false);
  });
});
