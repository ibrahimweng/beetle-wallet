/* Pay from, from its frame: the sheet the From row on a paying page puts
   up — Everyday with what it holds, Dollars with what they are worth
   today, a tick on the one chosen, Beetle's word that the other side is
   paid in naira either way, and Done. Picking Dollars makes the page pay
   from them at the rate on it. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Button, Head, Icon, Meta, Row, Say, Sheet, Tap, colour, toast } from '../../design';
import { naira } from '../../lib/format';
import { nairaOf, usdFull } from './dollars';

export type Source = 'everyday' | 'dollars';

export function PayFromSheet({
  everyday,
  dollars,
  rate,
  value,
  who,
  onPick,
  onDismiss,
  locked = false,
}: {
  everyday: number;
  dollars: number;
  rate: number;
  value: Source;
  /** who is paid: Sarah, the light */
  who: string;
  onPick: (s: Source) => void;
  onDismiss: () => void;
  /** setting up is not finished, and holding dollars is one of the things it turns on (the analysis after Round 34) */
  locked?: boolean;
}) {
  const pick = (id: Source) => {
    if (locked && id === 'dollars') {
      toast('Finish setting up first, and you can pay from your dollars. It takes two minutes.');
      return;
    }
    onPick(id);
  };
  const row = (id: Source, glyph: 'bank' | 'dollar', title: string, sub: string) => (
    <Tap accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected: value === id }} onPress={() => pick(id)} style={s.row} testID="source-row">
      <View style={s.box}>
        <Icon name={glyph} size={20} colour={colour.ink} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Row>{title}</Row>
        <Meta tone="secondary">{sub}</Meta>
      </View>
      {value === id ? (
        <View style={s.tick} testID="picked">
          <Icon name="check" size={12} colour={colour.textInverse} />
        </View>
      ) : (
        <View style={s.ring} />
      )}
    </Tap>
  );
  return (
    <Sheet onDismiss={onDismiss} testID="payfrom" foot={22}>
      {/* the frame's head sits 46 in from the sheet's inset, over the rows' words */}
      <View style={{ paddingLeft: 46, marginTop: -1, paddingTop: 2 }} testID="payfrom-head">
        <View style={s.big}>
          <Icon name="up" size={32} colour={colour.ink} />
        </View>
        <Head style={{ marginTop: 10 }}>Pay from</Head>
        <Body tone="secondary" style={{ marginTop: 10 }}>
          Two places the money can leave
        </Body>
      </View>
      <View style={{ marginTop: 15 }} testID="sources">
        {row('everyday', 'bank', 'Everyday', `${naira(everyday)} in naira`)}
        {row('dollars', 'dollar', 'Dollars', `${usdFull(dollars)}, about ${naira(nairaOf(dollars, rate))} today`)}
      </View>
      <View style={{ marginTop: 16 }}>
        <Say testID="line">{`${who} is paid in naira either way. From dollars I convert at the rate on the next screen, and you see it before anything moves.`}</Say>
      </View>
      <Button label="Done" tone="grey" size={48} full={false} style={{ alignSelf: 'center', paddingHorizontal: 40, marginTop: 20 }} onPress={onDismiss} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  big: { width: 64, height: 64, borderRadius: 20, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 76 },
  box: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 22, height: 22, borderRadius: 11, backgroundColor: colour.good, alignItems: 'center', justifyContent: 'center' },
  ring: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colour.ruleStrong },
});
