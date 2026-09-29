/* The rows a settings page is made of, as the frames draw them: 64 tall, the
   glyph 28 set 4 in, the words 16 after it, what is set in grey at the end
   and a chevron on the edge; and the grey line that names a group of them. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { Body, Meta, Row } from './text';
import type { IconName } from '../icons';
import { colour } from './tokens';
import { Tap } from './motion';

export function SectionLabel({ children }: { children: string }) {
  return <Body tone="tertiary">{children}</Body>;
}

export function SettingRow({
  glyph,
  ink,
  title,
  value,
  onPress,
  testID,
}: {
  glyph: IconName;
  /** the frames colour some marks: the face in the accent, the shield in green, the bell in amber */
  ink?: string;
  title: string;
  value?: string;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <Tap accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={s.row} testID={testID}>
      <Icon name={glyph} size={28} colour={ink ?? colour.ink} />
      <Row style={{ flex: 1 }}>{title}</Row>
      {value ? <Meta tone="secondary">{value}</Meta> : null}
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 64, paddingLeft: 4, gap: 16 },
});
