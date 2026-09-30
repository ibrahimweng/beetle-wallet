/* Read from your photo, for a top-up: the message the camera read was
   somebody asking for data or airtime, so Beetle lays out the line and its
   network, whose it is where a saved line matches, the figure from the
   photo and the bundle it buys — with Top up Mum to go on, Retake to try
   the camera again, and Not this line to go on and pick whose. */
import React from 'react';
import { ReadSheet, type ReadRow } from '../scan/ReadSheet';
import type { TopupReading } from '../../services';
import { DEMO_SAVED, groupPhoneNumber, planFor, planName, type LinePaid, type Network } from '../../services/nigeria';
import { naira } from '../../lib/format';
import type { TopupDraft } from './hand';

/** 2k, from 2,000: money the way a message writes it. */
const short = (n: number) => (n >= 1_000 && n % 1_000 === 0 && n < 1_000_000 ? `${n / 1_000}k` : naira(n));

export function TopupSheet({ reading, onBuy, onRetake, onDismiss }: { reading: TopupReading; onBuy: (draft: TopupDraft) => void; onRetake: () => void; onDismiss: () => void }) {
  const network = reading.network as Network;
  const saved: LinePaid | null = DEMO_SAVED.lines.find(l => l.number === reading.line) ?? null;
  const whose = saved?.label ?? reading.from;
  const plan = reading.data && reading.amount ? planFor(network, { amount: reading.amount }) : null;
  const said = `${reading.amount ? short(reading.amount) : 'Some'} ${reading.data ? 'data' : 'airtime'} for ${whose.toLowerCase()}`;
  const rows: ReadRow[] = [
    { label: 'Line', value: groupPhoneNumber(reading.line), note: network },
    { label: 'Whose', value: whose, note: saved ? 'her usual line' : 'not saved yet' },
    ...(reading.amount ? [{ label: 'Amount', value: naira(reading.amount), note: 'from the photo' }] : []),
    ...(plan ? [{ label: 'Plan', value: planName(plan) }] : []),
  ];
  const line: LinePaid = saved ?? { kind: 'line', id: `line:${reading.line}`, label: reading.from, number: reading.line, network, when: '', times: 0 };
  const go = (whoseLine: LinePaid | null) => onBuy({ line: whoseLine, plan, asked: reading.amount, amount: reading.data ? undefined : reading.amount, read: 'photo', said });
  return <ReadSheet said={said} rows={rows} link="Not this line" action={`Top up ${whose}`} onLink={() => go(null)} onAction={() => go(line)} onRetake={onRetake} onDismiss={onDismiss} />;
}
