/* Finishing setting up, as stages of the way in, from its four frames:
   where you live, a photo of an ID, where your money comes from, and
   everything is on. Each is a plain function of the screen's state, like
   the stages before it, so the same choreography carries the pieces. */
import React from 'react';
import { Platform, TextInput, View } from 'react-native';
import { Aside, Body, Card, Head, Icon, Meta, Tap, Tick, colour, font, motion, night, washes } from '../../design';
import type { IconName } from '../../icons';
import { FULL_LINE, IDCARD, INCOME, INCOMES, OPENS, addressOk, type Income } from '../setup/setup';
import type { Ctx, StageView } from './views';

/* A step still to come, greyed under the body, the way the frames list them. */
function Later({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 40 }} testID="later">
      <Icon name={icon} size={24} colour={night.ink} />
      <Body tone="tertiary">{label}</Body>
    </View>
  );
}

/* What finishing opens: three rows on a card, 50 tall, a dashed ring or a
   green tick before each, a rule between. */
function Opens({ on, cascade = false }: { on: boolean; cascade?: boolean }) {
  const rows = on ? [...OPENS, 'Everything you could already do'] : OPENS;
  return (
    <Card style={{ paddingTop: 4, paddingBottom: 0, paddingHorizontal: 16, gap: 0 }} testID="opens">
      {rows.map((text, i) => (
        <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 50, borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: night.rule }}>
          <Tick on={on} size={20} delay={cascade ? motion.markWait + 90 * (i + 1) : undefined} />
          <Meta tone={on ? 'ink' : 'tertiary'} style={{ flex: 1 }}>
            {text}
          </Meta>
        </View>
      ))}
    </Card>
  );
}

/* Where you live: the street on one line and the area under it, typed into
   the same card, with what is still to come and what it opens below. */
export function address(c: Ctx): StageView {
  const ok = addressOk(c.street, c.area);
  const save = () => {
    if (!ok) return;
    c.setSetup({ address: { street: c.street.trim(), area: c.area.trim() } });
    c.go('idcard');
  };
  return {
    icon: 'home-filled',
    tint: washes.finish.tone,
    wash: washes.finish,
    title: 'Where you live',
    sub: 'Street, town and state. No utility bill, and nothing arrives in the post.',
    bodyKey: 'address',
    body: (
      /* the frame: 9 from the line to the card; the band's own 12 is above */
      <View style={{ marginTop: -3 }}>
        <Card style={{ paddingTop: 12, paddingBottom: 11, paddingHorizontal: 16, gap: 4 }} testID="address">
          <TextInput
            value={c.street}
            onChangeText={c.setStreet}
            placeholder="12 Bode Thomas Street"
            placeholderTextColor={night.tertiary}
            autoFocus={Platform.OS !== 'web' ? false : true}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel="Street"
            testID="street"
            style={{ fontSize: 16, lineHeight: 24, ...font('600'), color: night.ink, padding: 0, height: 24 }}
          />
          <TextInput
            value={c.area}
            onChangeText={c.setArea}
            placeholder="Area, town and state"
            placeholderTextColor={night.tertiary}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={save}
            accessibilityLabel="Area, town and state"
            testID="area"
            style={{ fontSize: 12, lineHeight: 16, ...font('400'), color: night.secondary, padding: 0, height: 16 }}
          />
        </Card>
        <Later icon={IDCARD.icon} label={IDCARD.label} />
        <Later icon={INCOME.icon} label={INCOME.label} />
        <View style={{ paddingTop: 20, gap: 8 }}>
          <Head>What it opens</Head>
          <Opens on={false} />
        </View>
        {/* the frame's row: the words 20 under the card, and the row's foot on the column's */}
        <View style={{ paddingTop: 18, paddingBottom: 2 }}>
          <Aside>This is the same check every Nigerian bank runs. We ask once, and we do not sell it.</Aside>
        </View>
      </View>
    ),
    bar: { label: 'Continue', onPress: save, disabled: !ok, back: c.exit },
  };
}

/* A photo of an ID: the frame to fill, what is read off it, and Take it,
   which is the camera on a phone and a moment here. */
export function idcard(c: Ctx): StageView {
  const reading = c.idState === 'checking';
  return {
    icon: 'camera-filled',
    tint: washes.idcard.tone,
    wash: washes.idcard,
    title: 'A photo of an ID',
    sub: 'A driver’s licence, a passport or a voter’s card. Any of the three will do.',
    bodyKey: 'idcard',
    body: (
      /* the frame: 9 from the line to the card */
      <View style={{ marginTop: -3 }}>
        <Card style={{ paddingTop: 12, paddingBottom: 8, paddingHorizontal: 16, alignItems: 'center', gap: 4 }} testID="idframe">
          <View style={{ width: 246, height: 152, borderRadius: 12, borderWidth: 2, borderColor: reading ? colour.good : colour.accent }} />
          <Meta tone="tertiary">{reading ? 'Reading the name and the number…' : 'Lay it flat and fill the frame'}</Meta>
        </Card>
        {/* the frame's row is 66 tall with three lines of 20 from 12 down, the last line running past its foot */}
        <View style={{ paddingTop: 12, height: 66, paddingRight: 37 }} testID="id-note">
          <Aside glyph="eye">I read the name and the number off it and keep nothing else. The photo does not leave your phone.</Aside>
        </View>
        <Later icon={INCOME.icon} label={INCOME.label} />
      </View>
    ),
    bar: { label: reading ? 'Reading…' : 'Take it', disabled: reading, onPress: c.takeId, back: () => c.go('address', -1) },
  };
}

/* Where your money comes from: one tap on four rows, the picked one ticked. */
export function income(c: Ctx): StageView {
  const pick = (id: Income) => c.setIncome(id);
  const save = () => {
    if (!c.income) return;
    c.setSetup({ income: c.income });
    c.go('full');
  };
  return {
    icon: 'receive-filled',
    tint: washes.income.tone,
    wash: washes.income,
    title: 'Where your money comes from',
    sub: 'One tap. It is the last question, and every bank has to ask it.',
    bodyKey: 'income',
    body: (
      /* the frame: 14 from the line to the first row */
      <View style={{ paddingTop: 2 }} testID="incomes">
        {INCOMES.map((it, i) => (
          <Tap
            key={it.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: c.income === it.id }}
            accessibilityLabel={it.label}
            onPress={() => pick(it.id)}
            style={{ flexDirection: 'row', alignItems: 'center', height: 56, borderBottomWidth: i < INCOMES.length - 1 ? 1 : 0, borderBottomColor: night.rule }}
          >
            <Body style={{ flex: 1 }}>{it.label}</Body>
            {c.income === it.id ? <Tick on size={22} /> : <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: night.ruleStrong }} />}
          </Tap>
        ))}
      </View>
    ),
    bar: { label: 'Continue', onPress: save, disabled: !c.income, back: () => c.go('idcard', -1) },
  };
}

/* Everything is on: the three steps done above, the tick beside the title,
   and the four things that are on, landing one after another. */
export function full(c: Ctx): StageView {
  const finish = () => {
    c.setSetup({ done: true });
    c.toHome(() => c.app.startOver());
  };
  return {
    icon: 'tick',
    small: true,
    inline: true,
    title: 'Everything is on',
    sub: FULL_LINE,
    bodyKey: 'full',
    body: (
      /* the frame: 13 from the line to the card */
      <View style={{ paddingTop: 1 }}>
        <Opens on cascade />
      </View>
    ),
    bar: { label: 'Take me in', onPress: finish },
  };
}
