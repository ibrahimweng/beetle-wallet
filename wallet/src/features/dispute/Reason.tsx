/* The shape two frames share: Beetle's panel with its steps and a chip on
   its band, a card that says how it decided or where a thing actually is
   (a line each with a glyph, and one under them), and the ways out on a
   grey card. Your dispute and Before I filled this in are both this. */
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Card, ChoiceList, LightPanel, Meta, NoteRow, PageHead, Screen, type StepRow, type Way } from '../../design';
import type { IconName } from '../../icons';

const NOTE_ROWS = [30, 36, 30];

export function ReasonPage({
  title,
  sub,
  panel,
  card,
  ways,
  after,
}: {
  title: string;
  sub: string;
  panel: { glyph: IconName; title: string; status: string; rows: StepRow[]; testID?: string };
  card: { title: string; notes: { glyph: IconName; text: string }[]; foot: string; testID?: string };
  ways: Way[];
  /** what a way put under the ways: the words that were filed */
  after?: ReactNode;
}) {
  return (
    <Screen head={<PageHead title={title} sub={sub} />}>
      {/* the frame runs 16 between its blocks where the screen's column runs 20 */}
      <View>
        <LightPanel glyph={panel.glyph} title={panel.title} status={panel.status} rows={panel.rows} testID={panel.testID ?? 'panel'} />
      </View>
      <Card outline style={s.card} testID={card.testID ?? 'reasons'}>
        <Body tone="secondary" style={{ lineHeight: 16 }}>
          {card.title}
        </Body>
        {/* the frame boxes the three lines 30, 36 and 30 tall, 8 apart, and lets their words run past the boxes */}
        <View style={{ gap: 8 }}>
          {card.notes.map((n, i) => (
            <View key={n.text} style={{ height: NOTE_ROWS[i] ?? 30, overflow: 'visible' }}>
              <NoteRow glyph={n.glyph}>{n.text}</NoteRow>
            </View>
          ))}
        </View>
        <Meta tone="secondary">{card.foot}</Meta>
      </Card>
      <View style={s.tight}>
        <ChoiceList testID="ways" items={ways} />
      </View>
      {after}
    </Screen>
  );
}

const s = StyleSheet.create({
  tight: { marginTop: -4 },
  /* the frame's card: the title 18 down, 12 to the lines, 8 between their boxes, 12 to the line under, 20 under that */
  card: { marginTop: -4, paddingTop: 18, paddingBottom: 20, paddingHorizontal: 16, gap: 12 },
});
