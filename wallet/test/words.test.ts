import { describe, expect, it } from 'vitest';
import { typedState, WORDS } from '@/features/settings/words';

describe('the three words past a limit', () => {
  it('counts the letters still to go', () => {
    const s = typedState('Confirm this transa');
    expect(s.right).toBe(true);
    expect(s.left).toBe(5);
    expect(s.rest).toBe('ction');
    expect(s.line).toMatch(/^Five letters to go/);
    expect(s.done).toBe(false);
  });
  it('is done on the last letter and not before', () => {
    expect(typedState(WORDS).done).toBe(true);
    expect(typedState(WORDS).line).toBe('That is it. It can go now.');
    expect(typedState(WORDS.slice(0, -1)).done).toBe(false);
  });
  it('says so when the letters are wrong', () => {
    const s = typedState('Confirm that');
    expect(s.right).toBe(false);
    expect(s.done).toBe(false);
    expect(s.rest).toBe('');
    expect(s.line).toMatch(/not it/);
  });
  it('starts empty with everything to go', () => {
    expect(typedState('').left).toBe(WORDS.length);
    expect(typedState('').rest).toBe(WORDS);
  });
});
