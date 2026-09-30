import { describe, expect, it } from 'vitest';
import { TABS, holdPages, isTab, pagesHeld, settleOn, tabs } from '../src/features/tabs/tabs';

describe('the three pages', () => {
  it('sit in the bar’s order', () => {
    expect(TABS).toEqual(['home', 'activities', 'settings']);
    expect(isTab('settings')).toBe(true);
    expect(isTab('lab')).toBe(false);
  });

  it('turn forward past a third of the width or on a flick, and back the other way', () => {
    const W = 393;
    expect(settleOn(0, -140, 0, W)).toBe(1);
    expect(settleOn(0, -100, 0, W)).toBe(0);
    expect(settleOn(0, -40, -800, W)).toBe(1);
    expect(settleOn(1, 140, 0, W)).toBe(0);
    expect(settleOn(1, 40, 900, W)).toBe(0);
    expect(settleOn(1, -140, 0, W)).toBe(2);
  });

  it('never turn past Home or past Settings', () => {
    const W = 393;
    expect(settleOn(0, 300, 1200, W)).toBe(0);
    expect(settleOn(2, -300, -1200, W)).toBe(2);
  });

  it('hold still while anything open over them asks, and move once nobody does', () => {
    expect(pagesHeld()).toBe(false);
    holdPages('chat', true);
    holdPages('receipt', true);
    expect(pagesHeld()).toBe(true);
    holdPages('chat', false);
    expect(pagesHeld()).toBe(true);
    holdPages('receipt', false);
    expect(pagesHeld()).toBe(false);
  });

  it('remember which one is showing', () => {
    tabs.go('settings');
    expect(tabs.get()).toBe('settings');
    tabs.go('home');
    expect(tabs.get()).toBe('home');
  });
});
