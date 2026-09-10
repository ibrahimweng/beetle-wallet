/* A receipt, laid out the way the frames draw one: two columns of label over
   value, a narration across the full width, dashed rules before the money and
   before the totals, and the session line inside the same card under a rule
   rather than in a second box. Labels are 12 regular. The identity values are
   16 semibold and the money values are 14 semibold, which is the frame's own
   distinction, not a slip. */
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { IconName } from '../icons';
import { Caption, Display, Label, Meta, Row } from './text';
import { StatusPill } from './StatusPill';
import { Card } from './Screen';
import { colour, space } from './tokens';

export type ReceiptField = [label: string, value: string, note?: string];

const WIDE = ['Narration', 'What', 'For'];
const RULE_BEFORE = ['Amount', 'Total charged'];
const BIG = ['To', 'From', 'Narration', 'What', 'For'];

function Rule() {
  return <View style={{ height: 1, backgroundColor: colour.rule, opacity: 0.9, width: '100%' }} />;
}

export function Receipt({
  amount,
  line,
  fields,
  session,
  sessionLabel = 'Session ID',
  status = 'Successful',
  icon = 'check',
  onCopy,
}: {
  amount: string;
  line: string;
  fields: ReceiptField[];
  session?: string;
  sessionLabel?: string;
  status?: string;
  icon?: IconName;
  onCopy?: () => void;
}) {
  const cells: React.ReactNode[] = [];
  fields.forEach((f, i) => {
    if (RULE_BEFORE.includes(f[0])) cells.push(<Rule key={'r' + i} />);
    cells.push(
      <View key={i} style={{ width: WIDE.includes(f[0]) ? '100%' : '50%', gap: 2, paddingBottom: space.s3 }}>
        <Caption tone="secondary">{f[0]}</Caption>
        {BIG.includes(f[0]) ? <Row>{f[1]}</Row> : <Label>{f[1]}</Label>}
        {f[2] ? <Caption tone="tertiary">{f[2]}</Caption> : null}
      </View>,
    );
  });

  return (
    <View style={{ gap: space.s5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s4 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colour.good,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={24} colour={colour.textInverse} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Display>{amount}</Display>
          <Meta tone="secondary">{line}</Meta>
        </View>
        <StatusPill label={status} tone={colour.good} />
      </View>

      <Card style={{ gap: 0 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{cells}</View>
        {session ? (
          <>
            <Rule />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3, paddingTop: space.s3 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Caption tone="secondary">{sessionLabel}</Caption>
                <Label>{session}</Label>
              </View>
              <Icon name="copy" size={16} colour={colour.textSecondary} />
            </View>
          </>
        ) : null}
      </Card>
    </View>
  );
}
