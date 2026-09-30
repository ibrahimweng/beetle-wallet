/* Read from your photo, for a request: the message the camera read was
   somebody asking to be paid, so Beetle lays out the amount and what it is
   for from the photo, the person it matched to someone who has paid before,
   and where the request reaches them — with Ask Musa to go on to the
   request, Retake to try the camera again, and Not this person to go on
   and pick who. */
import React from 'react';
import { ReadSheet, type ReadRow } from '../scan/ReadSheet';
import type { RequestReading } from '../../services';
import { naira } from '../../lib/format';
import type { RequestDraft } from './hand';
import { firstOf, objectOf, payerIn, type Payer } from './people';
import { shortMoney } from './words';

export function FoundSheet({ reading, onAsk, onRetake, onDismiss }: { reading: RequestReading; onAsk: (draft: RequestDraft) => void; onRetake: () => void; onDismiss: () => void }) {
  const who: Payer | null = payerIn(reading.from);
  const first = who ? firstOf(who.name) : reading.from;
  const said = `Ask ${first} for ${shortMoney(reading.amount)}`;
  const rows: ReadRow[] = [
    { label: 'Amount', value: naira(reading.amount), note: 'from the photo' },
    { label: 'Person', value: who ? who.name : reading.from, note: who ? who.note : 'not known yet' },
    { label: who ? `Reaches ${objectOf(who.pronoun)}` : 'Reaches them', value: who ? 'WhatsApp and SMS' : 'A line you give me' },
    ...(reading.note ? [{ label: 'For', value: reading.note, note: 'from the photo' }] : []),
  ];
  const go = (person: Payer | null) => onAsk({ who: person, amount: reading.amount, note: reading.note, read: 'photo', said });
  return <ReadSheet said={said} rows={rows} link="Not this person" action={`Ask ${first}`} onLink={() => go(null)} onAction={() => go(who)} onRetake={onRetake} onDismiss={onDismiss} />;
}
