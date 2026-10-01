/* What the passcode sheet shows for a panel, while the six digits go in:
   who or what it is for, and the whole of it in rows — what they receive,
   the fee, when it lands and what leaves which account; for a bill the
   name on the meter and what it buys; for a loan what comes in and what is
   paid back. The chat's cards and the panels say the same thing here as
   Send money does. */
import type { IconName } from '../../icons';
import { arrivesAt, feeLabel, isBeetle, type Panel } from '../../services';
import { groupAccount, moneyExact } from '../../lib/format';
import type { Breakdown } from './Passcode';

export type Sheet = { amount: string; name: string; detail?: string; glyph?: IconName; rows: Breakdown[] };

const row = (panel: Panel, label: string) => panel.rows.find(r => r.label === label)?.value;

export function sheetFor(panel: Panel): Sheet {
  const move = panel.move;
  const amount = Math.abs(move?.amount ?? panel.action?.amount ?? 0);
  const leaves = { label: 'Leaves Everyday', value: moneyExact(panel.action?.amount ?? amount), strong: true };
  if (panel.tool === 'transfer' && panel.person) {
    const p = panel.person;
    const beetle = isBeetle(p);
    const fee = move?.fee ?? 0;
    return {
      amount: moneyExact(amount),
      name: p.name,
      detail: beetle && p.tag ? `Beetle · $${p.tag}` : `${p.bank} · ${groupAccount(p.number)}`,
      rows: [
        { label: 'They receive', value: moneyExact(amount) },
        { label: 'Fee', value: beetle ? 'Free · Beetle to Beetle' : feeLabel(fee) },
        { label: 'Arrives', value: arrivesAt(amount, p.bank) },
        { ...leaves, value: moneyExact(amount + fee) },
      ],
    };
  }
  if (panel.tool === 'pay')
    return {
      amount: moneyExact(amount),
      name: row(panel, 'Biller') ?? panel.title,
      detail: row(panel, 'Meter'),
      glyph: 'power',
      rows: [
        { label: 'Name on the meter', value: row(panel, 'Name') ?? 'Looked up' },
        row(panel, 'Units') ? { label: 'Units', value: row(panel, 'Units')! } : { label: 'Settles', value: row(panel, 'Settles') ?? 'At once' },
        { label: 'Fee', value: 'Free' },
        leaves,
      ],
    };
  if (panel.tool === 'data')
    return {
      amount: moneyExact(amount),
      name: `${row(panel, 'Network') ?? ''} · ${row(panel, 'Plan') ?? 'Data'}`,
      detail: row(panel, 'Line'),
      glyph: 'data',
      rows: [{ label: 'Plan', value: row(panel, 'Plan') ?? '' }, { label: 'Fee', value: 'Free' }, leaves],
    };
  if (panel.tool === 'airtime')
    return {
      amount: moneyExact(amount),
      name: `${row(panel, 'Network') ?? ''} airtime`,
      detail: row(panel, 'Line'),
      glyph: 'airtime',
      rows: [{ label: 'Lands', value: 'At once' }, { label: 'Fee', value: 'Free' }, leaves],
    };
  if (panel.tool === 'loan')
    return {
      amount: moneyExact(amount),
      name: 'Beetle Loans',
      detail: row(panel, 'Term'),
      glyph: 'loan',
      rows: panel.rows.filter(r => r.label !== 'Term').map(r => ({ label: r.label, value: r.value, strong: r.label === 'You pay back' })),
    };
  return { amount: moneyExact(amount), name: move?.name ?? panel.title, detail: move?.detail, rows: [leaves] };
}
