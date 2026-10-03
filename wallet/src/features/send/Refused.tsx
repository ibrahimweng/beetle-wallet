/* I will not do this one, from its frame: the whole balance to an account
   Beetle has never seen. The green warning, the figure and where it was
   going, what was typed, how old the account is and that it was never paid
   before, Beetle's one line, and the ways — a smaller figure to check it
   arrives, waiting until tomorrow, or Face ID and a call from us — with the
   note on why it stops. Reached from Slide to send when the amount is the
   whole balance to somebody never paid, and said the same way in the chat. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BigStatus, ChoiceList, Facts, NoteCard, PageHead, Say, Screen, colour, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { clock, useChats } from '../agent/chats';
import { turn } from '../agent/turns';
import { PasscodeSheet } from '../passcode';
import { LAB } from '../../lab/enabled';
import { groupAccount, naira } from '../../lib/format';
import { draft } from './hand';
import { TRY_FIRST, accountAge } from './rules';
import { useBackToSend } from './Short';
import { openTab } from '../tabs/tabs';

export function Refused() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ amount?: string; name?: string; number?: string; said?: string; demo?: string }>();
  const account = app.session?.account;
  const { file } = useChats(account?.accountNumber, !!account?.demo);
  const [guard, setGuard] = useState(false);
  const demo = LAB && asked.demo === '1';
  const amount = demo ? 595_320 : Number(asked.amount ?? 0) || 0;
  const number = demo ? '0123456789' : (asked.number ?? '');
  const name = demo ? 'The account holder' : (asked.name ?? 'The account holder');
  const said = demo ? 'send everything' : (asked.said ?? `${naira(amount)} to ${groupAccount(number)}`);
  const toSend = useBackToSend();
  useFoot({ kind: 'back', veil: guard ? 'away' : undefined });
  if (!ok || !account) return null;
  const at = clock();
  const chat = (id: string, title: string, detail: string, words: string) =>
    file({ id: `${id}-${Date.now().toString(36)}`, startedBy: 'beetle', title, detail, time: at, day: 'today', turns: [turn.say(words)], pending: null, unread: true });
  const smaller = () => {
    draft.put({ amount: TRY_FIRST, amountNote: 'Enough to check it arrives' });
    toSend();
  };
  const tomorrow = () => {
    chat(
      'wait',
      `${naira(amount)}, waiting until tomorrow`,
      `To ${groupAccount(number)} · nothing sent`,
      `Tomorrow I ask you again about the ${naira(amount)} to ${groupAccount(number)}. Nothing has been sent, and nothing will be until you say so then.`,
    );
    toast('I will ask you again tomorrow. Nothing has been sent.');
    openTab(router, 'home');
  };
  const itIsMe = () => {
    setGuard(false);
    chat(
      'call',
      `${naira(amount)}, a call from us first`,
      `To ${groupAccount(number)} · Face ID matched`,
      `Face ID matched at ${at}. Someone from Beetle calls you within the hour to hear it from you, and the ${naira(amount)} goes after that call, not before.`,
    );
    toast('Face ID matched. A call from us comes within the hour; it goes after that.');
    openTab(router, 'home');
  };
  return (
    <>
      <Screen head={<PageHead title="I will not do this one" sub="Nothing has been sent" />}>
        {/* the frame: the figures 12 under the status, the bubble 12 under them, the ways 2 under the bubble, the note 12 under the ways */}
        <View style={{ marginTop: -2 }}>
          <BigStatus glyph="warn-filled" tone={colour.good} amount={naira(amount)} line="to an account I have never seen" />
        </View>
        <View style={{ marginTop: -8 }}>
          <Facts
            inset={8}
            rows={[
              { label: 'You typed', value: said },
              { label: 'Account age', value: accountAge(false) ?? 'New' },
              { label: 'Paid before', value: 'Never', tone: colour.warn },
            ]}
          />
        </View>
        <View style={{ marginTop: -8 }}>
          <Say testID="line">{`Your whole balance, to an account ${(accountAge(false) ?? 'minutes').toLowerCase()} old.`}</Say>
        </View>
        <View style={{ marginTop: -8 }}>
          <ChoiceList
            testID="ways"
            items={[
              { glyph: 'lock', title: `Send ${naira(TRY_FIRST)} instead`, sub: 'Enough to check it arrives', onPress: smaller },
              { glyph: 'up', title: 'Wait until tomorrow', sub: 'I will ask you again then', onPress: tomorrow },
              { glyph: 'faceid', title: 'It really is me', sub: 'Face ID, then a call from us', onPress: () => setGuard(true) },
            ]}
          />
        </View>
        <View style={{ marginTop: -8 }}>
          <NoteCard height={64} title="Why I stopped" body="A new account, the whole balance: I stop." />
        </View>
      </Screen>
      {guard ? (
        <PasscodeSheet
          amount={naira(amount)}
          name={name}
          detail={`${groupAccount(number)} · never paid before`}
          glyph="faceid"
          rows={[
            { label: 'This account', value: 'Never paid before' },
            { label: 'What it is for', value: 'Saying it is you asking' },
          ]}
          verify={app.checkPasscode}
          onDone={itIsMe}
          onCancel={() => setGuard(false)}
        />
      ) : null}
    </>
  );
}
