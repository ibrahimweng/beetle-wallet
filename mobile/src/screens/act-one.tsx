/* Act One, when it goes wrong. Every screen here is built from its frame in
   the Flows page, and they share one shape, which is why the pieces they are
   made of live in the design system rather than in this file. */
import React from 'react';
import { Pressable, View } from 'react-native';
import {
  AgentAsk,
  AgentSay,
  AmountPad,
  Banner,
  BigStatus,
  Button,
  Card,
  ChoiceRow,
  Choices,
  Dock,
  Facts,
  FootNote,
  Label,
  PageHead,
  ReasonList,
  Screen,
  SectionLabel,
  ToolPanel,
  ToolRow,
  colour,
} from '../design';
import { Route } from '../routes';

type Nav = { go: (r: Route) => void; back: () => void };
const dock = (placeholder: string, nav: Nav) => <Dock placeholder={placeholder} onBack={nav.back} />;

/* ---- the agent showing its working ---- */

export const Checking = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask how I decide', nav)}>
    <PageHead title="Before I filled this in" sub="What I checked, and the one part I am unsure of" />
    <ToolPanel
      tool="Beetle Reasoning"
      state="Checked"
      rows={[
        { k: 'Heard the name Sarah', v: 'Certain' },
        { k: 'Matched 14 past payments', v: 'Certain' },
        { k: 'Confirmed the account with GTBank', v: 'Certain' },
        { k: 'Heard the amount', v: 'Not certain', done: false },
      ]}
    />
    <ReasonList
      title="How I decided"
      rows={[
        ['check', 'Three of the four I am sure about.'],
        ['lock', 'The amount is the one I get wrong, so I flag it.'],
        ['lock', 'You only have to check the part I marked.'],
      ]}
      note="If I were sure of all four I would not stop you here at all."
    />
    <Choices>
      <ChoiceRow
        glyph="chat"
        title="It is ₦20,000"
        sub="Rent, the usual amount"
        onPress={() => nav.go('confirm')}
      />
      <ChoiceRow
        glyph="list"
        title="Let me type it"
        sub="I would rather you set this one"
        onPress={() => nav.go('typed')}
      />
      <ChoiceRow
        glyph="alert"
        title="I will not do this one"
        sub="Nothing has been sent"
        onPress={() => nav.go('iwillnot')}
      />
    </Choices>
  </Screen>
);

export const IWillNot = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask why I stopped this', nav)}>
    <PageHead title="I will not do this one" sub="Nothing has been sent" />
    <BigStatus
      glyph="warn-filled"
      tone={colour.good}
      amount="₦595,320"
      line="to an account I have never seen"
    />
    <Facts
      rows={[
        ['You said', 'send everything'],
        ['Account age', 'Four minutes'],
        ['Paid before', 'Never'],
      ]}
    />
    <AgentSay>Your whole balance, to an account four minutes old.</AgentSay>
    <Choices>
      <ChoiceRow
        glyph="pot"
        title="Send ₦20,000 instead"
        sub="Enough to check it arrives"
        onPress={() => nav.go('pay')}
      />
      <ChoiceRow
        glyph="send"
        title="Wait until tomorrow"
        sub="I will ask you again then"
        onPress={() => nav.go('home')}
      />
      <ChoiceRow
        glyph="request"
        title="It really is me"
        sub="Face ID, then a call from us"
        onPress={() => nav.go('noface')}
      />
    </Choices>
    <FootNote title="Nothing has left your account" sub="I can be overruled. It takes two minutes." />
  </Screen>
);

export const Misheard = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask me about this', nav)}>
    <PageHead title="Check this number" sub="Nothing has been sent" />
    <BigStatus
      glyph="warn-filled"
      tone={colour.good}
      amount="₦200,000"
      line="and I am not sure I heard it right"
    />
    <Facts
      rows={[
        ['You said', 'two hundred'],
        ['I heard', '₦200,000'],
        ['Or maybe', '₦200'],
      ]}
    />
    <AgentSay>
      Spoken round numbers are where I slip most. I will not choose between these two on my own.
    </AgentSay>
    <Choices>
      <ChoiceRow
        glyph="pot"
        title="It is ₦200,000"
        sub="Rent money, to Sarah"
        onPress={() => nav.go('pay')}
      />
      <ChoiceRow glyph="send" title="It is ₦200" sub="Small change, to Sarah" onPress={() => nav.go('pay')} />
      <ChoiceRow
        glyph="request"
        title="Let me type it"
        sub="Neither one is right"
        onPress={() => nav.go('amend')}
      />
      <ChoiceRow
        glyph="undo-filled"
        title="I sent it wrong"
        sub="₦200,000 left at 14:22"
        onPress={() => nav.go('alreadygone')}
      />
    </Choices>
    <FootNote title="Nothing has left your account" sub="I stop whenever an amount reads two ways." />
  </Screen>
);

export const AlreadyGone = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about the cover', nav)}>
    <PageHead title="I sent it wrong" sub="₦200,000 left at 14:22" />
    <BigStatus glyph="warn-filled" tone={colour.alert} amount="₦200,000" line="left your account" />
    <Banner text="This one is mine. You are covered." tone={colour.good} />
    <AgentSay>
      You said two hundred. I sent two hundred thousand. That is my error, so you get the difference back
      today, whether or not Sarah returns it.
    </AgentSay>
    <Choices>
      <ChoiceRow
        glyph="send"
        title="Take ₦199,800 back"
        sub="Paid by us today, not in days"
        onPress={() => nav.go('reversed')}
      />
      <ChoiceRow
        glyph="bank"
        title="Ask Sarah to return it"
        sub="We do this to recover our side"
        onPress={() => nav.go('recall')}
      />
    </Choices>
    <AgentAsk question="Want to know how I stop this?" answer="Tell me" onAnswer={() => nav.go('checking')} />
  </Screen>
);

/* ---- when a transfer does not land ---- */

export const Short = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask me about this', nav)}>
    <PageHead title="Not enough in Everyday" sub="Nothing has been sent" />
    <BigStatus
      glyph="warn-filled"
      tone={colour.good}
      amount="₦7,520"
      line="short of the ₦20,000 you asked for"
    />
    <Facts
      rows={[
        ['You asked for', '₦20,000'],
        ['In Everyday', '₦12,480'],
        ['Short by', '₦7,520'],
      ]}
    />
    <AgentSay>Three ways to close it. None of them costs you anything.</AgentSay>
    <Choices>
      <ChoiceRow
        glyph="pot"
        title="Move it from Holiday"
        sub="₦48,000 is sitting there"
        onPress={() => nav.go('goal')}
      />
      <ChoiceRow
        glyph="send"
        title="Send ₦12,480 now"
        sub="The rest when your salary lands"
        onPress={() => nav.go('pay')}
      />
      <ChoiceRow
        glyph="request"
        title="Ask Musa for ₦7,520"
        sub="He owes you from the rent"
        onPress={() => nav.go('askreq')}
      />
    </Choices>
    <FootNote
      title="Nothing has left your account"
      sub="No fee and no attempt. This is a sum I did before trying."
    />
  </Screen>
);

export const Pending = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about this transfer', nav)}>
    <PageHead title="Still on its way" sub="Sent at 14:22, not confirmed yet" />
    {/* the frame turns the ring in the accent while it waits, not in the amber
        the words beneath it carry */}
    <BigStatus glyph="wait-filled" tone={colour.accent} amount="₦20,000" line="to Sarah Adeyemi · GTBank" />
    <Banner text="Do not send it again. This one is still live." glyph="warn-filled" ink={colour.good} />
    {/* the frame draws these three as a plain grey block, with no tool over
        them: the transfer is already out, so there is nothing running */}
    <Card style={{ gap: 0, paddingHorizontal: 0, paddingVertical: 12 }}>
      {(
        [
          ['Left your account', '14:22', true],
          ['GTBank has it', '14:22', true],
          ['Reaching Sarah', 'Waiting', false],
        ] as [string, string, boolean][]
      ).map(([k, v, done], i) => (
        /* the frame runs these 48 apart and stops the value short of the
           card's own edge, where a panel's rows go right to it */
        <View
          key={k}
          style={[
            { paddingVertical: 2, paddingRight: 64 },
            i ? { borderTopWidth: 1, borderTopColor: colour.rule } : null,
          ]}
        >
          <ToolRow k={k} v={v} done={done} />
        </View>
      ))}
    </Card>
    <AgentSay>
      Slow, not lost. If GTBank has not confirmed by 16:22 it comes back on its own, and I will tell you
      either way.
    </AgentSay>
    <AgentAsk
      question="Want a message the moment it lands?"
      answer="Yes, tell me"
      onAnswer={() => nav.go('home')}
    />
  </Screen>
);

export const Failed = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask why this failed', nav)}>
    <PageHead title="It did not go" sub="GTBank turned it down at 14:22" />
    <BigStatus glyph="warn-filled" tone={colour.alert} amount="₦20,000" line="still in your account" />
    <Banner text="Your balance is exactly what it was." tone={colour.good} />
    <AgentSay>
      Nothing was taken and nothing was charged. GTBank has been failing since 13:40, so this is their
      afternoon, not your account.
    </AgentSay>
    <Choices>
      <ChoiceRow
        glyph="send"
        title="Try again now"
        sub="It may have cleared already"
        onPress={() => nav.go('confirm')}
      />
      <ChoiceRow
        glyph="bank"
        title="Send it another way"
        sub="Through your Zenith account"
        onPress={() => nav.go('payfrom')}
      />
    </Choices>
    <AgentAsk question="Keep trying until GTBank is back?" answer="Do that" onAnswer={() => nav.go('home')} />
  </Screen>
);

export const Reversed = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about this', nav)}>
    <PageHead title="It came back" sub="Returned at 16:22" />
    <BigStatus glyph="undo-filled" tone={colour.ink} amount="₦20,000" line="back in Everyday" />
    <Facts
      rows={[
        ['Left', '14:22'],
        ['Came back', '16:22'],
        ['Why', 'Account could not be credited'],
        ['Reference', 'REV-40118-2290'],
      ]}
    />
    <AgentSay>
      Sarah never got it, so GTBank sent it back and I put it where it came from. Nothing was charged, and
      your balance is whole.
    </AgentSay>
    <Choices>
      <ChoiceRow
        glyph="search"
        title="Check the account number"
        sub="One digit is usually all it is"
        onPress={() => nav.go('pay')}
      />
      <ChoiceRow
        glyph="send"
        title="Try Sarah again"
        sub="Same amount, same account"
        onPress={() => nav.go('confirm')}
      />
    </Choices>
  </Screen>
);

/* ---- putting a wrong one right ---- */

export const Wrong = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Tell me what happened', nav)}>
    <PageHead title="What went wrong?" sub="Tell me which and I start it now" />
    <AgentSay>
      Some of this I can do in minutes. Some of it only a bank can do, and that takes days. I will tell you
      which one you are in before you start, not after.
    </AgentSay>
    <SectionLabel>The payment</SectionLabel>
    <Facts
      rows={[
        ['Amount', '₦20,000'],
        ['To', 'Sarah Adeyemi · GTBank'],
        ['Sent', 'Today, 14:22'],
      ]}
    />
    <Choices>
      <ChoiceRow
        glyph="person"
        title="It went to the wrong person"
        sub="I ask their bank to send it back"
        onPress={() => nav.go('recall')}
      />
      <ChoiceRow
        glyph="search"
        title="They say it never arrived"
        sub="I make GTBank trace it"
        onPress={() => nav.go('pending')}
      />
      <ChoiceRow
        glyph="shield"
        title="I did not make this payment"
        sub="I freeze the account first, then we look"
        onPress={() => nav.go('disputeopen')}
      />
    </Choices>
  </Screen>
);

export const Recall = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask what happens next', nav)}>
    <PageHead title="Asking for it back" sub="₦20,000, sent at 14:22" />
    <ToolPanel
      tool="Beetle Recall"
      state="Running"
      rows={[
        { k: 'You reported it', v: '16:24' },
        { k: 'Sent to GTBank', v: '16:24' },
        { k: 'Sarah asked to approve', v: '16:25' },
        { k: 'Her answer', v: 'Up to 5 working days', done: false },
      ]}
    />
    <ReasonList
      title="What this is and is not"
      rows={[
        ['check', 'I have asked GTBank. That part is done.'],
        ['lock', 'I cannot take it back. It is her money until she agrees.'],
        ['lock', 'If she says no, no bank can force her.'],
      ]}
      note="After that it is a formal dispute, then a police report. I walk you through either."
    />
    <Choices>
      <ChoiceRow
        glyph="chat"
        title="Message Sarah"
        sub="Most of these end here, in an hour"
        onPress={() => nav.go('agentchat')}
      />
      <ChoiceRow
        glyph="list"
        title="Open a dispute"
        sub="If she has not answered by Friday"
        onPress={() => nav.go('disputeopen')}
      />
    </Choices>
  </Screen>
);

export const DisputeOpen = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask where this stands', nav)}>
    <PageHead title="Your dispute, day 3 of 5" sub="₦20,000 to Sarah Adeyemi, 28 August" />
    <ToolPanel
      tool="Beetle Dispute"
      state="Day 3"
      rows={[
        { k: 'You reported it', v: '28 Aug' },
        { k: 'Filed with GTBank', v: '28 Aug' },
        { k: 'GTBank acknowledged', v: '29 Aug' },
        { k: 'Their decision', v: 'By 4 September', done: false },
      ]}
    />
    <ReasonList
      title="Where this actually is"
      rows={[
        ['check', 'GTBank has it and the clock is running. Nothing more is needed from you.'],
        ['lock', 'I check every morning and tell you the day it moves.'],
        ['lock', 'If they miss 4 September it escalates on its own.'],
      ]}
      note="You do not have to call anybody, and you do not have to watch this screen."
    />
    <Choices>
      <ChoiceRow
        glyph="chat"
        title="See what was filed"
        sub="The exact wording, and what was attached"
        onPress={() => nav.go('agentchat')}
      />
      <ChoiceRow
        glyph="list"
        title="Add something to it"
        sub="A screenshot or a message that helps"
        onPress={() => nav.go('agentchat')}
      />
      <ChoiceRow
        glyph="check"
        title="The dispute is closed"
        sub="GTBank decided on 3 September"
        onPress={() => nav.go('disputeend')}
      />
    </Choices>
  </Screen>
);

export const DisputeEnd = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about this dispute', nav)}>
    <PageHead title="The dispute is closed" sub="GTBank decided on 3 September" />
    <BigStatus glyph="wait-filled" tone={colour.good} amount="₦20,000" line="back in Everyday at 11:40" />
    <Banner text="It is already in your balance. Nothing to do." glyph="warn-filled" ink={colour.good} />
    {/* closed, so nothing is running over it — the frame draws the three as a
        plain grey block */}
    <Card style={{ gap: 0, paddingHorizontal: 0, paddingVertical: 12 }}>
      {(
        [
          ['You reported it', '28 Aug', true],
          ['GTBank decided', '3 Sep', true],
          ['Money returned', '11:40', false],
        ] as [string, string, boolean][]
      ).map(([k, v, done], i) => (
        /* the frame runs these 48 apart and stops the value short of the
           card's own edge, where a panel's rows go right to it */
        <View
          key={k}
          style={[
            { paddingVertical: 2, paddingRight: 64 },
            i ? { borderTopWidth: 1, borderTopColor: colour.rule } : null,
          ]}
        >
          <ToolRow k={k} v={v} done={done} />
        </View>
      ))}
    </Card>
    <AgentSay>
      Six days, and you did not chase it once. Most disputes that get this far end the same way.
    </AgentSay>
    <AgentAsk
      question="Want the closing letter for your records?"
      answer="Save it"
      onAnswer={() => nav.go('history')}
    />
  </Screen>
);

export const NoNetwork = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask what works offline', nav)}>
    <PageHead title="You are offline" sub="Last checked 12 minutes ago" />
    <BigStatus glyph="warn-filled" tone={colour.alert} amount="₦595,320" line="as of 14:10, not live" />
    <Banner text="Nothing you do here gets lost." tone={colour.good} />
    <AgentSay>
      I will not send money against a balance I cannot check. Tell me what you want, I hold it, and it goes
      the second the network is back.
    </AgentSay>
    <Choices>
      <ChoiceRow
        glyph="send"
        title="Queue it for later"
        sub="Waits here until I can check"
        onPress={() => nav.go('home')}
      />
      <ChoiceRow
        glyph="bank"
        title="Pay by USSD instead"
        sub="Works with no data at all"
        onPress={() => nav.go('home')}
      />
    </Choices>
    <AgentAsk
      question="Turn on lite mode while data is short?"
      answer="Turn it on"
      onAnswer={() => nav.go('settings')}
    />
  </Screen>
);

/* Changing an amount before it goes. The pad replaces on the first key, so the
   figure it heard is a suggestion rather than something half typed. */
export const Amend = ({ nav }: { nav: Nav }) => {
  const [amount, setAmount] = React.useState(20000);
  return (
    <Screen dock={undefined}>
      <PageHead title="Change the amount" sub="Nothing has been sent" />
      <AmountPad value={amount} onChange={setAmount} heard="₦200,000" />
      <AgentSay>
        Change it as many times as you like. It moves after your face and your passcode, not before.
      </AgentSay>
      <Button
        label={`Use ₦${amount.toLocaleString('en-NG')}`}
        full={false}
        style={{ alignSelf: 'center' }}
        onPress={() => nav.go('confirm')}
      />
      <Pressable accessibilityRole="button" onPress={() => nav.go('short')} style={{ alignSelf: 'center' }}>
        <Label tone="accent">What if it is more than I have?</Label>
      </Pressable>
    </Screen>
  );
};
