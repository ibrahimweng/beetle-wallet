/* Being paid — the sheet of ways money reaches you, the three things safe to
   hand out, and the code itself.

   Frames 332:9555, 222:199 and 221:2. None of these can take anything: a
   number and a code can only be paid into, which is the line the file ends
   both screens on. */
import React from 'react';
import { Pressable, View } from 'react-native';
import {
  Avatar,
  Aside,
  Badge,
  Bubble,
  Button,
  Card,
  Caption,
  Divider,
  Head,
  Icon,
  Label,
  Meta,
  PageHead,
  QrCode,
  Row,
  Screen,
  Sheet,
  Title,
  colour,
  radius,
  space,
  toast,
} from '../design';
import { Nav, dock } from './nav';
import { still } from './send';
import { Home } from './home';
import { Route } from '../routes';
import { me } from '../state/data.js';

const WAYS: [string, string, string, Route][] = [
  ['bank', 'Bank transfer', `Your number, ${me.account}`, 'ways'],
  ['card', 'From a card', 'Any Nigerian debit card', 'ways'],
  ['request', 'Ask someone', 'Send a request they can pay', 'askreq'],
  ['dollar', 'In dollars', 'Hold it steady, or turn naira across', 'dollars'],
];

export const Receive = ({ nav }: { nav: Nav }) => (
  <Sheet onClose={nav.back} behind={<Home nav={still} />}>
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Badge glyph="receive-filled" size={52} tone={colour.accentWash} ink={colour.accent} />
      <Head>Receive</Head>
      <Meta tone="tertiary">Pick how you want the money to reach you</Meta>
    </View>
    <Card style={{ gap: space.s3 }}>
      {WAYS.map(([glyph, title, sub, to], i) => (
        <View key={title}>
          {i ? (
            <View style={{ paddingBottom: space.s3 }}>
              <Divider />
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => nav.go(to)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.s3,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Icon name={glyph as 'bank'} size={20} />
            <View style={{ flex: 1, gap: 2 }}>
              <Row>{title}</Row>
              <Meta tone="secondary">{sub}</Meta>
            </View>
            <Icon name="chevron" size={18} colour={colour.textTertiary} />
          </Pressable>
        </View>
      ))}
    </Card>
    <Button label="Done" tone="grey" onPress={() => nav.go('home')} />
  </Sheet>
);

export const Ways = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about getting paid', nav, 'home', true)}>
    <PageHead lead title="Three ways to be paid" sub="All of them safe to hand out" />
    <Bubble>
      You cannot receive by talking. What I can do is hand you the two things money reaches you by, and write
      the message that asks.
    </Bubble>
    <Card style={{ gap: space.s3 }}>
      <Caption tone="secondary">Your account number</Caption>
      <Row>{`${me.bank} · ${me.name}`}</Row>
      <Title>{me.account}</Title>
      <Button label="Copy it" tone="grey" onPress={() => toast(`${me.account} copied. Paste it anywhere.`)} />
    </Card>
    <Card style={{ gap: space.s3 }}>
      <Caption tone="secondary">Your code</Caption>
      <Row>Works with any bank app</Row>
      <Meta tone="tertiary">Point a camera at it</Meta>
      <Button label="Show it" tone="grey" onPress={() => nav.go('mycode')} />
    </Card>
    <Card style={{ gap: space.s3 }}>
      <Caption tone="secondary">Ask somebody</Caption>
      <Row>I write it, you check it</Row>
      <Meta tone="tertiary">On WhatsApp and SMS</Meta>
      <Button label="Ask for money" tone="grey" onPress={() => nav.go('askreq')} />
    </Card>
    <View style={{ gap: space.s2 }}>
      <Label>None of these can take anything</Label>
      <Caption tone="secondary">
        A number and a code can only be paid into. Neither carries your balance.
      </Caption>
    </View>
  </Screen>
);

export const MyCode = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about your code', nav, 'ways', true)}>
    <PageHead lead title="Your code" sub="Point their camera at this and the money reaches you" />
    {/* the code and whose it is sit on one white card with a hairline round it */}
    <View
      style={{
        borderWidth: 1,
        borderColor: colour.rule,
        borderRadius: radius.lg,
        paddingVertical: space.s5,
        gap: space.s5,
      }}
    >
      <QrCode size={148} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s3 }}>
        <Avatar initials={me.initials} size={44} tone={colour.accent} text={colour.textInverse} />
        <View style={{ gap: 2 }}>
          <Row>{me.name}</Row>
          <Meta tone="tertiary">{`${me.bank} · ${me.account}`}</Meta>
        </View>
      </View>
    </View>
    <View style={{ flexDirection: 'row', gap: space.s2 }}>
      <View style={{ flex: 1 }}>
        <Button label="Share it" onPress={() => toast('Ready to send, wherever you share things.')} />
      </View>
      <View style={{ flex: 1 }}>
        <Button label="Save it" tone="grey" leading="down" onPress={() => toast('Saved to your photos.')} />
      </View>
    </View>
    <Aside>
      Anyone can pay you with this. Nobody can take anything with it, and it does not carry your balance.
    </Aside>
  </Screen>
);
