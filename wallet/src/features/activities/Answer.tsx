/* The answer to a question about spending, from its frame: what was asked
   as the head, Beetle's line, the figure with its change and the six months
   behind it on one card, where it went as three lines, and what Beetle
   would do about it at the foot. Home's "Where your money went" opens it;
   the two chips on the card are the question's own terms. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Caption, Card, Display, Head, Icon, Label, Meta, PageHead, Row, Say, SayCard, Screen, Tap, colour, radius, toast } from '../../design';
import { useFoot } from '../more/Foot';
import type { IconName } from '../../icons';
import { useSessionGuard } from '../onboarding/useGuard';
import { askHome } from '../more/More';
import { naira } from '../../lib/format';

/* the frame's six bars, tallest last */
const MONTHS: [string, number][] = [
  ['Feb', 38],
  ['Mar', 50],
  ['Apr', 41],
  ['May', 56],
  ['Jun', 47],
  ['Jul', 56],
];

const WENT: [IconName, string, string, number][] = [
  ['data', 'MTN data', '5 top ups', 12500],
  ['airtime', 'MTN airtime', '7 top ups', 4400],
  ['airtime', 'Glo airtime', '2 top ups', 2000],
];

export function Answer() {
  const router = useRouter();
  const ok = useSessionGuard();
  useFoot({ kind: 'ask', placeholder: 'Ask about this', onAsk: q => askHome(router, q), onScan: () => router.push('/scan') });
  if (!ok) return null;
  const later = (what: string) => () => toast(`${what} comes with round 6.`);
  return (
    <Screen head={<PageHead title="Airtime and data" sub="You asked how much you spend on staying connected" />}>
      <View style={{ gap: 12 }}>
        <Say testID="say">₦18,900 on airtime and data last month. That is your highest month this year.</Say>
        {/* the figure, the six months, the terms and where the number came from, on one card */}
        {/* the frame sets the card 2 under the bubble, and its foot 5 under the last line */}
        <Card style={[s.figure, { marginTop: -8 }]} testID="figure">
          {/* the frame gives the figure's row 44 */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', height: 44 }}>
            <Display style={{ flex: 1 }}>{naira(18900)}</Display>
            <View style={s.change} testID="change">
              <Icon name="up" size={12} colour={colour.bad} />
              <Label tone="bad">{naira(4200)}</Label>
            </View>
          </View>
          <View style={s.chart} testID="chart">
            {MONTHS.map(([m, h], i) => (
              <View key={m} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                <View style={{ height: 52, justifyContent: 'flex-end' }}>
                  <View style={{ width: 30, height: h, borderRadius: 6, backgroundColor: i === MONTHS.length - 1 ? colour.accent : colour.rule }} />
                </View>
                <Caption tone="secondary">{m}</Caption>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['Airtime and data', 'Last month'].map(t => (
              <Tap key={t} accessibilityRole="button" accessibilityLabel={t} onPress={later('Changing the question')} style={s.term}>
                <Label>{t}</Label>
                <Icon name="check-small" size={12} colour={colour.textTertiary} />
              </Tap>
            ))}
          </View>
          <Tap accessibilityRole="button" accessibilityLabel="Added up from 14 top ups, 1 to 31 July" onPress={() => router.push('/activities')} style={s.source}>
            <Icon name="list" size={16} colour={colour.textTertiary} />
            <Meta tone="secondary" style={{ flex: 1 }}>
              Added up from 14 top ups, 1 to 31 July
            </Meta>
            <Icon name="chevron" size={16} colour={colour.textTertiary} />
          </Tap>
        </Card>
        <View style={{ gap: 16 }}>
          <Head>Where it went</Head>
          <View style={{ gap: 16 }}>
            {WENT.map(([glyph, what, howMany, amount]) => (
              <View key={what} style={s.went} testID="went">
                <View style={s.box40}>
                  <Icon name={glyph} size={20} colour={colour.ink} />
                </View>
                <View style={{ flex: 1, gap: 4, marginTop: 5 }}>
                  <Row>{what}</Row>
                  <Meta tone="secondary">{howMany}</Meta>
                </View>
                <Row>{naira(amount)}</Row>
              </View>
            ))}
          </View>
        </View>
        <View style={{ marginTop: -8 }}>
          <SayCard testID="footer">A 10GB monthly plan is ₦4,000 and would save about ₦1,800.</SayCard>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  figure: { paddingTop: 16, paddingBottom: 8, paddingHorizontal: 16, gap: 16 },
  change: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#eee3e4' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 76 },
  term: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 21,
    backgroundColor: colour.surface,
    borderWidth: 1,
    borderColor: colour.rule,
  },
  source: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48 },
  went: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 62 },
  box40: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
});
void radius;
