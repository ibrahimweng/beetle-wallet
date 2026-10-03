/* Feed the goal, from its frame (Feed the Holiday goal): the sheet the row
   of what feeds the first goal puts up — four ways money can reach the goal
   without anyone thinking about it, a switch on each of the three that run
   on their own (the payday slice is the standing instruction on the Rules
   page; round ups and cash back are the goal's own), Set it on the fixed
   amount that opens the amount picker, the note that none of it is locked
   away, and Done. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Button, Caption, Head, Icon, Meta, NoteCard, Row, Sheet, Tap, Toggle, colour } from '../../design';
import { FEEDS, GOAL, type FeedId } from './goal';

export function FeedSheet({
  name = GOAL.name,
  on,
  onChange,
  onFixed,
  onDismiss,
}: {
  /** the goal the feeds go to: the first */
  name?: string;
  on: Record<FeedId, boolean>;
  onChange: (id: FeedId, v: boolean) => void;
  onFixed: () => void;
  onDismiss: () => void;
}) {
  return (
    <Sheet onDismiss={onDismiss} testID="feed-sheet" foot={22}>
      {/* the frame's head sits 28.6 in from the sheet's inset, over the rows' words */}
      <View style={s.head} testID="feed-head">
        <View style={s.big}>
          <Icon name="pot" size={32} colour={colour.ink} />
        </View>
        <Head style={{ marginTop: 10 }}>{`Feed the ${name} goal`}</Head>
        <Body tone="secondary" style={{ marginTop: 10, width: 277 }}>
          Pick something that runs without you thinking about it
        </Body>
      </View>
      <View style={{ marginTop: 14 }} testID="ways">
        {FEEDS.map(f => (
          <View key={f.id} style={s.row} testID="way">
            <View style={s.box}>
              <Icon name={f.glyph} size={20} colour={colour.ink} />
            </View>
            <View style={s.words}>
              <Row>{f.pick}</Row>
              <Caption tone="secondary">{f.pickHow}</Caption>
              <Meta tone="secondary">{`₦${f.monthly.toLocaleString('en-NG')} a month`}</Meta>
            </View>
            <Toggle value={on[f.id]} onChange={v => onChange(f.id, v)} label={f.pick} testID={`feed-${f.id}`} />
          </View>
        ))}
        <View style={s.row} testID="way">
          <View style={s.box}>
            <Icon name="plus" size={20} colour={colour.ink} />
          </View>
          <View style={s.words}>
            <Row>A fixed amount</Row>
            <Caption tone="secondary">You pick the day and the sum</Caption>
            <Meta tone="secondary">You choose</Meta>
          </View>
          <Tap accessibilityRole="button" accessibilityLabel="Set it" onPress={onFixed} style={s.chip} testID="set-it">
            <Caption style={{ fontWeight: '600' }}>Set it</Caption>
          </Tap>
        </View>
      </View>
      <View style={{ marginTop: 16 }}>
        <NoteCard width="100%" title="None of this is locked away" body="Take any of it back the same day. No fee, no notice, and no question from me about why." />
      </View>
      <Button label="Done" tone="grey" size={48} full={false} style={{ alignSelf: 'center', paddingHorizontal: 40, marginTop: 16 }} onPress={onDismiss} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  head: { marginTop: -1, paddingTop: 2, paddingLeft: 29 },
  big: { width: 64, height: 64, borderRadius: 20, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 76 },
  /* the frame's three lines sit 8 down in the row, their boxes overlapping by 8 */
  words: { flex: 1, gap: 4, marginTop: 8 },
  box: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  chip: { height: 32, paddingHorizontal: 9, borderRadius: 16, borderWidth: 1, borderColor: colour.ruleStrong, alignItems: 'center', justifyContent: 'center' },
});
