/* What was read, row by row on a grey card: a tick, the label, the value
   and a word on where it came from; 48 a row. Read from your photo and
   What I found both lay their pieces out on it. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Caption, Icon, Meta, Row, colour } from '../../design';

export type ReadRow = { label: string; value: string; note?: string };

export function ReadRows({ rows, style, testID = 'what-read' }: { rows: ReadRow[]; style?: object; testID?: string }) {
  return (
    <View style={[s.card, style]} testID={testID}>
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
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface2, borderRadius: 20, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 48 },
  hairTop: { borderTopWidth: 1, borderTopColor: colour.rule },
});
