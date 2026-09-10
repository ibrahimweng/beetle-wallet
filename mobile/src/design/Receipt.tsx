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
import { Tap } from './motion';

export type ReceiptField = [label: string, value: string, note?: string];

const WIDE = ['Narration', 'What', 'For'];
/* the frames perforate a receipt once, above the money — the totals under it
   are part of the same block, not a third one */
const RULE_BEFORE = ['Amount'];
const BIG = ['To', 'From', 'Narration', 'What', 'For'];

/* The frames rule a receipt with a dashed line, not a solid one — it is the
   perforation on a paper slip. */
function Rule() {
  return (
    <View
      style={{
        width: '100%',
        borderTopWidth: 1,
        borderStyle: 'dashed',
        borderColor: colour.rule,
        marginBottom: space.s3,
      }}
    />
  );
}

export function Receipt({
  amount,
  line,
  fields,
  session,
  sessionLabel = 'Session ID',
  status = 'Successful',
  icon = 'check',
  good = false,
  tail = 0,
  onCopy,
}: {
  amount: string;
  line: string;
  fields: ReceiptField[];
  session?: string;
  sessionLabel?: string;
  status?: string;
  icon?: IconName;
  /* money in: the frames set the figure itself in the green */
  good?: boolean;
  /* some frames leave room under the reference — the airtime slip leaves two
     lines of it — where others end the card straight after */
  tail?: number;
  onCopy?: () => void;
}) {
  const cells: React.ReactNode[] = [];
  let pair = 0;
  fields.forEach((f, i) => {
    if (RULE_BEFORE.includes(f[0])) {
      cells.push(<Rule key={'r' + i} />);
      pair = 0;
    }
    cells.push(
      /* the frames put the second column 164 along in a 310 card, which leaves
         each cell 147 with 16 between them — narrow enough that a long bank
         line wraps where theirs does */
      <View
        key={i}
        style={{
          width: WIDE.includes(f[0]) ? '100%' : '47%',
          marginRight: WIDE.includes(f[0]) || pair % 2 === 1 ? 0 : '6%',
          gap: 4,
          paddingBottom: 20,
        }}
      >
        <Caption tone="secondary">{f[0]}</Caption>
        {BIG.includes(f[0]) ? <Row>{f[1]}</Row> : <Label>{f[1]}</Label>}
        {f[2] ? <Caption tone="tertiary">{f[2]}</Caption> : null}
      </View>,
    );
    pair = WIDE.includes(f[0]) ? 0 : pair + 1;
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
          <Display tone={good ? 'good' : 'ink'}>{amount}</Display>
          <Meta tone="secondary">{line}</Meta>
        </View>
        <StatusPill label={status} tone={colour.good} ink={colour.goodText} />
      </View>

      {/* a receipt is a white slip with a hairline round it, not a grey block */}
      <Card
        style={{
          gap: 0,
          backgroundColor: colour.surface,
          borderWidth: 1,
          borderColor: colour.rule,
        }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{cells}</View>
        {session ? (
          <>
            <Rule />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.s4,
                paddingTop: space.s3,
                paddingBottom: tail,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Caption tone="secondary">{sessionLabel}</Caption>
                {/* the frames set the reference itself a size up from the money
                    values, which is what makes it break where theirs breaks */}
                <Label style={{ fontSize: 16 }}>{session}</Label>
              </View>
              {/* the frames give it a button, not a bare glyph, which is also
                  what holds the reference to the width it wraps at */}
              <Tap
                accessibilityRole="button"
                accessibilityLabel="Copy it"
                onPress={onCopy}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colour.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="copy" size={16} colour={colour.textSecondary} />
              </Tap>
            </View>
          </>
        ) : null}
      </Card>
    </View>
  );
}
