/* Read from your photo, over the camera, from its frame: the message the
   camera read was somebody asking to be paid, so Beetle lays out what it
   read — the amount and what it is for from the photo, the person it
   matched to someone who has paid before, and where the request reaches
   them — with Ask Musa to go on to the request, Retake to try the camera
   again, and Not this person to go on and pick who. Nothing is sent from
   here.

   Measured off the frame: the sheet's first row 24 under its top, the
   big line 14 under that, What I read 14 under it and its card 14 under
   that; the rows 48; Not this person 24 under the card and the buttons 12
   under it, 56 tall, 24 above the foot. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Button, Caption, Display, Icon, Label, Meta, Row, Sheet, Tap, colour } from '../../design';
import type { RequestReading } from '../../services';
import { naira } from '../../lib/format';
import type { RequestDraft } from './hand';
import { firstOf, objectOf, payerIn, type Payer } from './people';
import { shortMoney } from './words';

export function FoundSheet({ reading, onAsk, onRetake, onDismiss }: { reading: RequestReading; onAsk: (draft: RequestDraft) => void; onRetake: () => void; onDismiss: () => void }) {
  const who: Payer | null = payerIn(reading.from);
  const first = who ? firstOf(who.name) : reading.from;
  const said = `Ask ${first} for ${shortMoney(reading.amount)}`;
  const rows: { label: string; value: string; note?: string }[] = [
    { label: 'Amount', value: naira(reading.amount), note: 'from the photo' },
    { label: 'Person', value: who ? who.name : reading.from, note: who ? who.note : 'not known yet' },
    { label: who ? `Reaches ${objectOf(who.pronoun)}` : 'Reaches them', value: who ? 'WhatsApp and SMS' : 'A line you give me' },
    ...(reading.note ? [{ label: 'For', value: reading.note, note: 'from the photo' }] : []),
  ];
  const go = (person: Payer | null) => onAsk({ who: person, amount: reading.amount, note: reading.note, read: 'photo', said });
  return (
    <Sheet onDismiss={onDismiss} testID="found">
      <View style={{ marginTop: -8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} testID="read-row">
          <Icon name="mark" size={24} colour={colour.accent} />
          <Row tone="accent">Read from your photo</Row>
        </View>
        <Display style={{ marginTop: 14 }} accessibilityRole="header">
          {said}
        </Display>
        <Body tone="secondary" style={{ marginTop: 14 }}>
          What I read
        </Body>
        <View style={s.card} testID="what-read">
          {rows.map((r, i) => (
            <View key={r.label} style={[s.row, i ? s.hairTop : null]}>
              <Icon name="step-done" size={18} colour={colour.good} />
              <Meta tone="secondary">{r.label}</Meta>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <Row>{r.value}</Row>
                {r.note ? <Caption tone="secondary">{r.note}</Caption> : null}
              </View>
            </View>
          ))}
        </View>
        <Tap accessibilityRole="button" accessibilityLabel="Not this person" onPress={() => go(null)} style={{ alignSelf: 'center', height: 20, justifyContent: 'center', marginTop: 20 }} hitSlop={10}>
          <Label tone="accent">Not this person</Label>
        </Tap>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }} testID="found-buttons">
          <Button label={`Ask ${first}`} tone="blue" onPress={() => go(who)} style={{ flex: 1 }} />
          <Tap accessibilityRole="button" accessibilityLabel="Retake" onPress={onRetake} style={s.retake}>
            <Icon name="camera" size={24} colour={colour.ink} />
          </Tap>
        </View>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  card: { marginTop: 14, backgroundColor: colour.surface2, borderRadius: 20, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 48 },
  hairTop: { borderTopWidth: 1, borderTopColor: colour.rule },
  retake: { width: 56, height: 56, borderRadius: 28, backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, alignItems: 'center', justifyContent: 'center' },
});
