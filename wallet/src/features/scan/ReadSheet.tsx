/* Read from your photo, over the camera, from its frames: the camera read
   something that is a thing to do — a message asking to be paid, a message
   asking for data — so Beetle lays out what it read, row by row with a
   tick, a line at the foot that goes on without one of the pieces, the one
   button that goes on with all of them, and Retake. Nothing is sent from
   here. The request's sheet and the top-up's are this one with their own
   rows and words.

   Measured off the frames: the sheet's first row 24 under its top, the big
   line 14 under that, What I read 14 under it and its card 14 under that;
   the rows 48; the link 20 under the card and the buttons 12 under it, 56
   tall, 24 above the foot. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Button, Display, Icon, Label, Row, Sheet, Tap, colour } from '../../design';
import { ReadRows, type ReadRow } from './ReadRows';

export type { ReadRow };

export function ReadSheet({
  said,
  rows,
  link,
  action,
  onLink,
  onAction,
  onRetake,
  onDismiss,
  testID = 'found',
}: {
  /** the thing to do, as the photo says it: Ask Musa for 20k */
  said: string;
  rows: ReadRow[];
  /** the way on without one of the pieces: Not this person */
  link: string;
  action: string;
  onLink: () => void;
  onAction: () => void;
  onRetake: () => void;
  onDismiss: () => void;
  testID?: string;
}) {
  return (
    <Sheet onDismiss={onDismiss} testID={testID}>
      <View style={{ marginTop: -8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} testID="read-row">
          <Icon name="mark" size={24} colour={colour.ink} />
          <Row tone="accent">Read from your photo</Row>
        </View>
        <Display style={{ marginTop: 14 }} accessibilityRole="header">
          {said}
        </Display>
        <Body tone="secondary" style={{ marginTop: 14 }}>
          What I read
        </Body>
        <ReadRows rows={rows} style={{ marginTop: 14 }} />
        <Tap accessibilityRole="button" accessibilityLabel={link} onPress={onLink} style={{ alignSelf: 'center', height: 20, justifyContent: 'center', marginTop: 20 }} hitSlop={10}>
          <Label tone="accent">{link}</Label>
        </Tap>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }} testID="found-buttons">
          <Button label={action} tone="blue" onPress={onAction} style={{ flex: 1 }} />
          <Tap accessibilityRole="button" accessibilityLabel="Retake" onPress={onRetake} style={s.retake}>
            <Icon name="camera" size={24} colour={colour.ink} />
          </Tap>
        </View>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  retake: { width: 56, height: 56, borderRadius: 28, backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, alignItems: 'center', justifyContent: 'center' },
});
