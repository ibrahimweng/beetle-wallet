/* Before I filled this in, from its frame: what Beetle checked when it
   filled a transfer from a photo — the name, the past payments, the account
   with the bank — and the one part it is not sure of, the amount; how it
   decided, in three lines; and the ways — the usual figure, or typing one.
   Reached from the note under a person read off a photo on Send money,
   and from the lab with the frame's own figures. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { ReasonPage } from '../dispute/Reason';
import { PEOPLE } from '../../services';
import { LAB } from '../../lab/enabled';
import { naira } from '../../lib/format';
import { checkFor, draft, type CheckDraft } from './hand';
import { checksOf, sureLine } from './rules';
import { useBackToSend } from './Short';

/** The frame's transfer, for the lab: Sarah, paid fourteen times, the rent, the amount not read. */
/** Rent, the usual amount; or just the usual amount, when the last one carried no reference. */
const usualLine = (u: { amount: number; reference?: string }) => (u.reference ? `${u.reference}, the usual amount` : 'The usual amount, what went last time');

const DEMO: CheckDraft = { who: PEOPLE[0]!, times: 14, usual: { amount: 20_000, reference: 'Rent' }, amount: 0, read: true };

export function Checking() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ demo?: string }>();
  const account = app.session?.account;
  const [d] = useState<CheckDraft | null>(() => checkFor.take() ?? (LAB && asked.demo === '1' ? DEMO : null));
  const toSend = useBackToSend();
  useFoot({ kind: 'ask', placeholder: 'Ask how I decide', onAsk: q => askHome(router, q, d ? `${d.who.name}, read off a photo` : undefined), onScan: () => router.push('/scan') });
  if (!ok || !account) return null;
  const who = d?.who ?? PEOPLE[0]!;
  const first = who.name.split(' ')[0] ?? who.name;
  const checks = checksOf(first, who.bank, d?.times ?? 0, !!d?.read && !!d.amount, !d?.read && !!d?.amount);
  const usual = d?.usual;
  const useUsual = () => {
    if (!usual) return;
    draft.put({ amount: usual.amount, amountNote: usualLine(usual) });
    toSend();
  };
  return (
    <ReasonPage
      title="Before I filled this in"
      sub="What I checked, and the one part I am unsure of"
      panel={{ glyph: 'up', title: 'Beetle Reasoning', status: 'Checked', rows: checks.map(c => ({ label: c.label, value: c.value, done: c.sure })), testID: 'reasoning' }}
      card={{
        title: 'How I decided',
        notes: [
          { glyph: 'check', text: sureLine(checks) },
          { glyph: 'lock', text: 'The amount is the one I get wrong, so I flag it.' },
          { glyph: 'lock', text: 'You only have to check the part I marked.' },
        ],
        foot: 'If I were sure of all four I would not stop you here at all.',
        testID: 'decided',
      }}
      ways={[
        ...(usual ? [{ glyph: 'chat' as const, title: `It is ${naira(usual.amount)}`, sub: usualLine(usual), onPress: useUsual }] : []),
        { glyph: 'list', title: 'Let me type it', sub: 'Any figure, on the keypad', to: '/amend?amount=0' },
      ]}
    />
  );
}
